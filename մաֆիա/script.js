let gameRoles = [];
let playersStatus = [];
let currentIndex = 0;
let currentPhase = 0;
let lastNightVictimId = null;
let votes = {};
let totalVotesCast = 0;

const phases = [
    "Բոլորը փակում են աչքերը: 😴",
    "Արթնանում է Մաֆիան: 🕵️‍♂️",
    "Արթնանում է Շերիֆը: 👮‍♂️",
    "Առավոտ է: ☀️ Բոլորը արթնանում են:"
];

// 1. Խաղի սկզբնավորում
function setupGame() {
    const count = parseInt(document.getElementById('player-count').value);
    if (isNaN(count) || count < 4) {
        alert("Մուտքագրեք առնվազն 4 խաղացող:");
        return;
    }

    gameRoles = [];
    playersStatus = [];
    currentIndex = 0;
    currentPhase = 0;

    let mafiaCount = Math.floor(count / 3) || 1;
    let sheriffCount = 1;
    let citizenCount = count - mafiaCount - sheriffCount;

    for (let i = 0; i < mafiaCount; i++) gameRoles.push("Մաֆիա");
    gameRoles.push("Շերիֆ");
    for (let i = 0; i < citizenCount; i++) gameRoles.push("Քաղաքացի");

    gameRoles.sort(() => Math.random() - 0.5);

    gameRoles.forEach((role, i) => {
        playersStatus.push({ id: i + 1, role: role, alive: true });
    });

    document.getElementById('setup-section').style.display = 'none';
    document.getElementById('game-section').style.display = 'block';
    updateDisplay();
}

// 2. Դերերի բաշխման էկրան
function updateDisplay() {
    document.getElementById('player-title').innerText = "Խաղացող " + (currentIndex + 1);
    const box = document.getElementById('role-box');
    box.innerText = "?";
    box.className = "hidden-role";
    document.getElementById('show-btn').style.display = 'inline-block';
    document.getElementById('next-btn').style.display = 'none';
}

function showRole() {
    const box = document.getElementById('role-box');
    box.innerText = gameRoles[currentIndex];
    box.className = "revealed-role";
    document.getElementById('show-btn').style.display = 'none';
    document.getElementById('next-btn').style.display = 'inline-block';
}

function nextPlayer() {
    currentIndex++;
    if (currentIndex < gameRoles.length) {
        updateDisplay();
    } else {
        showGameTable();
    }
}

// 3. Հիմնական խաղային էկրան
function showGameTable() {
    document.getElementById('game-section').style.display = 'none';
    document.getElementById('main-game-screen').style.display = 'block';
    updatePhaseDisplay();
    renderPlayers();
}

function updatePhaseDisplay() {
    const text = document.getElementById('instruction-text');
    text.innerHTML = `<strong>${phases[currentPhase]}</strong><br><br>`;

    // Ֆոնի գույնի փոփոխություն (Գիշեր/Ցերեկ)
    if (currentPhase > 0 && currentPhase < 3) {
        document.body.style.backgroundColor = "#000";
    } else {
        document.body.style.backgroundColor = "#1a1a1a";
    }

    if (currentPhase === 1) { // Մաֆիա
        renderActionButtons(text, killPlayer, "#e74c3c");
    } 
    else if (currentPhase === 2) { // Շերիֆ
        renderActionButtons(text, checkPlayer, "#3498db");
    }
    else if (currentPhase === 3) { // Առավոտ
        if (lastNightVictimId) {
            text.innerHTML += `<span style="color: #e74c3c;">Այս գիշեր սպանվեց Խաղացող ${lastNightVictimId}-ը:</span><br>`;
        } else {
            text.innerHTML += "Գիշերը խաղաղ անցավ:<br>";
        }
        text.innerHTML += "<br><strong>Քվեարկություն:</strong><br>";
        renderVoteButtons(text);
    }
}

// 4. Գործողությունների կոճակներ (Սպանել / Ստուգել)
function renderActionButtons(container, actionFunc, color) {
    playersStatus.forEach(p => {
        if (p.alive) {
            let shouldShow = true;
            if (currentPhase === 1 && p.role === "Մաֆիա") shouldShow = false; // Մաֆիան իրար չի սպանում
            if (currentPhase === 2 && p.role === "Շերիֆ") shouldShow = false; // Շերիֆը իրեն չի ստուգում

            if (shouldShow) {
                const btn = document.createElement('button');
                btn.innerText = p.id;
                btn.style.cssText = `margin:5px; padding:10px 15px; background:${color}; border:none; color:white; border-radius:5px; cursor:pointer; font-weight:bold;`;
                btn.onclick = () => actionFunc(p.id);
                container.appendChild(btn);
            }
        }
    });
}

function killPlayer(id) {
    lastNightVictimId = id;
    const p = playersStatus.find(x => x.id === id);
    p.alive = false;
    checkWinCondition();
    nextPhase();
}

function checkPlayer(id) {
    const role = playersStatus.find(p => p.id === id).role;
    const text = document.getElementById('instruction-text');
    
    // Ցուցադրում ենք դերը էկրանին alert-ի փոխարեն
    text.innerHTML = `🕵️‍♂️ Շերիֆի ստուգում:<br><br>
                      Խաղացող ${id}-ի դերն է՝ <strong>${role}</strong><br><br>
                      <button onclick="nextPhase()" style="padding:10px 20px; background:#2ecc71; border:none; color:white; border-radius:5px; cursor:pointer;">Շարունակել</button>`;
}
// 5. Քվեարկության համակարգ
function renderVoteButtons(container) {
    const aliveCount = playersStatus.filter(p => p.alive).length;
    votes = {};
    totalVotesCast = 0;

    container.innerHTML += `<p id="vote-info" style="color:#f1c40f">Քվեարկել են 0 / ${aliveCount} հոգի</p>`;

    playersStatus.forEach(p => {
        if (p.alive) {
            votes[p.id] = 0;
            const div = document.createElement('div');
            div.style.margin = "10px 0";
            div.innerHTML = `
                Խաղացող ${p.id}: <span id="v-${p.id}">0</span> ձայն
                <button onclick="changeVote(${p.id}, 1)" style="margin-left:10px; background:#2ecc71; color:white; border:none; padding:5px 10px; cursor:pointer;">+1</button>
                <button onclick="changeVote(${p.id}, -1)" style="margin-left:5px; background:#e67e22; color:white; border:none; padding:5px 10px; cursor:pointer;">-1</button>
            `;
            container.appendChild(div);
        }
    });

    const btn = document.createElement('button');
    btn.innerText = "Ավարտել քվեարկությունը";
    btn.style.cssText = "margin-top:15px; padding:12px; background:#f39c12; border:none; color:white; border-radius:5px; cursor:pointer; width:100%; font-weight:bold;";
    btn.onclick = processVotes;
    container.appendChild(btn);
}

function changeVote(id, delta) {
    const aliveCount = playersStatus.filter(p => p.alive).length;
    if (delta > 0 && totalVotesCast >= aliveCount) return;
    if (delta < 0 && votes[id] <= 0) return;

    votes[id] += delta;
    totalVotesCast += delta;
    document.getElementById(`v-${id}`).innerText = votes[id];
    document.getElementById('vote-info').innerText = `Քվեարկել են ${totalVotesCast} / ${aliveCount} հոգի`;
}

function processVotes() {
    let maxVotes = 0;
    let victimId = null;
    let isTie = false;

    for (let id in votes) {
        if (votes[id] > maxVotes) {
            maxVotes = votes[id];
            victimId = id;
            isTie = false;
        } else if (votes[id] === maxVotes && maxVotes > 0) {
            isTie = true;
        }
    }

    if (maxVotes === 0) {
        alert("Ոչ ոք չքվեարկեց:");
        nextPhase();
    } else if (isTie) {
        alert("Ձայները հավասար են: Ոչ ոք չի հեռացվում:");
        nextPhase();
    } else {
        const p = playersStatus.find(x => x.id == victimId);
        p.alive = false;
        
        const text = document.getElementById('instruction-text');
        text.innerHTML = `🗳 Քվեարկության արդյունք:<br><br>
                          Քաղաքը հեռացրեց Խաղացող ${victimId}-ին:<br>
                          Նա <strong>${p.role}</strong> էր:<br><br>
                          <button onclick="checkWinCondition(); nextPhase();" style="padding:10px 20px; background:#f39c12; border:none; color:white; border-radius:5px; cursor:pointer;">Անցնել գիշերվան</button>`;
    }
}


// 6. Փուլերի կառավարում
function nextPhase() {
    currentPhase++;
    if (currentPhase >= phases.length) {
        currentPhase = 0;
        lastNightVictimId = null;
    }
    updatePhaseDisplay();
    renderPlayers();
}

function renderPlayers() {
    const list = document.getElementById('players-list');
    list.innerHTML = "";
    playersStatus.forEach(p => {
        const li = document.createElement('li');
        // Եթե խաղացողը ողջ է, ցույց տալ ???, եթե մեռած է՝ իրական դերը
        const displayRole = p.alive ? "???" : p.role;
        
        li.innerHTML = `<span>${p.id}. Խաղացող (Դերը՝ ${displayRole})</span>`;
        
        if (!p.alive) {
            li.style.opacity = "0.5";
            li.style.textDecoration = "line-through";
        }
        list.appendChild(li);
    });
}

function checkWinCondition() {
    const mafia = playersStatus.filter(p => p.alive && p.role === "Մաֆիա").length;
    const innocents = playersStatus.filter(p => p.alive && p.role !== "Մաֆիա").length;

    if (mafia === 0) {
        showEndGame("Քաղաքացիները հաղթեցին! 🎉", "#2ecc71");
    } else if (innocents === 0) {
        showEndGame("Մաֆիան հաղթեց! 😈", "#e74c3c");
    }
}

function showEndGame(message, color) {
    const screen = document.getElementById('main-game-screen');
    screen.innerHTML = `
        <div style="text-align: center; padding: 50px; background: ${color}; border-radius: 15px; color: white; margin-top: 20px;">
            <h1 style="font-size: 3em;">${message}</h1>
            <p style="font-size: 1.5em;">Խաղն ավարտվեց:</p>
            <br>
            <button onclick="location.reload()" style="padding: 15px 30px; background: white; color: ${color}; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 1.2em;">Խաղալ նորից</button>
        </div>
    `;
}