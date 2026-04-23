/* [New Feature] Mahjong Score Master Core Logic */

// 遊戲狀態物件
let gameState = {
    players: [
        { id: 0, name: '玩家 1', score: 0, stats: { win: 0, selfDrawn: 0, gun: 0 } },
        { id: 1, name: '玩家 2', score: 0, stats: { win: 0, selfDrawn: 0, gun: 0 } },
        { id: 2, name: '玩家 3', score: 0, stats: { win: 0, selfDrawn: 0, gun: 0 } },
        { id: 3, name: '玩家 4', score: 0, stats: { win: 0, selfDrawn: 0, gun: 0 } }
    ],
    config: { base: 50, tai: 20 },
    dealerIndex: 0, // 誰是莊家 (指向 players 的索引)
    dealerCount: 0, // 連莊次數 n
    layout: ['pos-e', 'pos-s', 'pos-w', 'pos-n'], // 物理位置佈局
    history: [],    // 歷史紀錄
    isSetup: false,
    currentWinType: 'self' // 'self' 或 'win'
};

// 初始化：從 LocalStorage 讀取資料
function init() {
    const saved = localStorage.getItem('mahjong_state');
    if (saved) {
        gameState = JSON.parse(saved);
        // 確保舊資料升級
        if (!gameState.layout) gameState.layout = ['pos-e', 'pos-s', 'pos-w', 'pos-n'];
        
        if (gameState.isSetup) {
            renderBoard();
            document.getElementById('setup-modal').style.display = 'none';
        } else {
            document.getElementById('setup-modal').style.display = 'flex';
        }
    } else {
        document.getElementById('setup-modal').style.display = 'flex';
    }
}

// 儲存狀態至 LocalStorage
function saveState() {
    localStorage.setItem('mahjong_state', JSON.stringify(gameState));
}

// 渲染主畫面
function renderBoard() {
    const grid = document.getElementById('player-grid');
    grid.innerHTML = '';

    const posNames = ['東家', '南家', '西家', '北家'];
    
    gameState.players.forEach((p, idx) => {
        const isDealer = gameState.dealerIndex === idx;
        const card = document.createElement('div');
        // 使用 layout 記錄的物理位置
        card.className = `player-card ${gameState.layout[idx]} ${isDealer ? 'is-dealer' : ''}`;
        
        card.draggable = true;
        card.dataset.index = idx;
        
        card.onclick = (e) => {
            if (card.classList.contains('dragging')) return;
            setDealer(idx);
        };

        card.addEventListener('dragstart', handleDragStart);
        card.addEventListener('dragover', handleDragOver);
        card.addEventListener('drop', handleDrop);
        card.addEventListener('dragend', handleDragEnd);

        card.addEventListener('touchstart', handleTouchStart, {passive: false});
        card.addEventListener('touchmove', handleTouchMove, {passive: false});
        card.addEventListener('touchend', handleTouchEnd);
        
        card.innerHTML = `
            <div class="dealer-badge">莊 (連 ${gameState.dealerCount})</div>
            <div style="font-size: 0.7rem; color: var(--accent-gold); pointer-events:none;">${posNames[idx]}</div>
            <div class="player-name" style="pointer-events:none;">${p.name}</div>
            <div class="player-score" style="pointer-events:none;">${p.score.toLocaleString()}</div>
            <div class="player-stats" style="pointer-events:none;">
                <span>胡: ${p.stats.win}</span>
                <span>摸: ${p.stats.selfDrawn}</span>
                <span>槍: ${p.stats.gun}</span>
            </div>
        `;
        grid.appendChild(card);
    });

    // 加入中央桌布資訊
    const center = document.createElement('div');
    center.id = 'table-center';
    center.innerHTML = `
        <div class="info-label">底/台</div>
        <div class="info-value">${gameState.config.base}/${gameState.config.tai}</div>
        <div class="info-label" style="margin-top:5px;">連莊</div>
        <div class="info-value">${gameState.dealerCount}</div>
    `;
    grid.appendChild(center);

    document.getElementById('game-config-summary').innerText = `目前位置：${posNames[gameState.dealerIndex]} 莊`;
}

// --- 拖曳邏輯 ---
let draggedIdx = null;

function handleDragStart(e) {
    draggedIdx = this.dataset.index;
    this.classList.add('dragging');
    if (e.dataTransfer) e.dataTransfer.setData('text/plain', draggedIdx);
}

function handleDragOver(e) { e.preventDefault(); }

function handleDrop(e) {
    e.preventDefault();
    const targetIdx = this.dataset.index;
    if (draggedIdx !== null && draggedIdx !== targetIdx) {
        swapLayout(parseInt(draggedIdx), parseInt(targetIdx));
    }
}

function handleDragEnd() {
    this.classList.remove('dragging');
    draggedIdx = null;
}

// --- 觸控支援 (手機端) ---
let touchStartX, touchStartY;
let activeTouchCard = null;

function handleTouchStart(e) {
    activeTouchCard = this;
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    this.classList.add('dragging');
}

function handleTouchMove(e) {
    if (!activeTouchCard) return;
    e.preventDefault(); 
}

function handleTouchEnd(e) {
    if (!activeTouchCard) return;
    activeTouchCard.classList.remove('dragging');
    
    const touch = e.changedTouches[0];
    const targetEl = document.elementFromPoint(touch.clientX, touch.clientY);
    const targetCard = targetEl ? targetEl.closest('.player-card') : null;
    
    if (targetCard && targetCard !== activeTouchCard) {
        swapLayout(parseInt(activeTouchCard.dataset.index), parseInt(targetCard.dataset.index));
    }
    activeTouchCard = null;
}

// 交換物理位置
function swapLayout(idx1, idx2) {
    const temp = gameState.layout[idx1];
    gameState.layout[idx1] = gameState.layout[idx2];
    gameState.layout[idx2] = temp;
    saveState();
    renderBoard();
}

// 設定莊家
function setDealer(idx) {
    if (confirm(`確定要將莊家改為 ${gameState.players[idx].name} 嗎？`)) {
        gameState.dealerIndex = idx;
        gameState.dealerCount = 0;
        saveState();
        renderBoard();
    }
}

// 儲存設定
function saveSettings() {
    gameState.config.base = parseInt(document.getElementById('base-input').value) || 50;
    gameState.config.tai = parseInt(document.getElementById('tai-input').value) || 20;
    
    for (let i = 0; i < 4; i++) {
        gameState.players[i].name = document.getElementById(`p${i}-name`).value || `玩家 ${i+1}`;
    }
    
    gameState.isSetup = true;
    saveState();
    renderBoard();
    document.getElementById('setup-modal').style.display = 'none';
}

// 顯示設定
function showSettings() {
    document.getElementById('setup-modal').style.display = 'flex';
}

// 顯示計分彈窗
function showRecordModal() {
    const winnerSelect = document.getElementById('winner-select');
    const loserSelect = document.getElementById('loser-select');
    winnerSelect.innerHTML = '';
    loserSelect.innerHTML = '';
    
    gameState.players.forEach(p => {
        winnerSelect.add(new Option(p.name, p.id));
        loserSelect.add(new Option(p.name, p.id));
    });
    
    document.getElementById('tai-count-input').value = 0;
    setWinType('self');
    document.getElementById('record-modal').style.display = 'flex';
}

// 設定贏牌類型 (自摸或胡牌)
function setWinType(type) {
    gameState.currentWinType = type;
    const btnSelf = document.getElementById('btn-self-draw');
    const btnWin = document.getElementById('btn-win');
    const loserGroup = document.getElementById('loser-group');
    
    if (type === 'self') {
        btnSelf.className = 'btn btn-primary';
        btnWin.className = 'btn btn-secondary';
        loserGroup.style.display = 'none';
    } else {
        btnSelf.className = 'btn btn-secondary';
        btnWin.className = 'btn btn-primary';
        loserGroup.style.display = 'block';
    }
}

// 關閉彈窗
function closeModal(id) {
    document.getElementById(id).style.display = 'none';
}

// 核心計算邏輯
function calculateScore() {
    const winnerId = parseInt(document.getElementById('winner-select').value);
    const baseTai = parseInt(document.getElementById('tai-count-input').value) || 0;
    const { base, tai } = gameState.config;
    const n = gameState.dealerCount;
    
    const backup = JSON.parse(JSON.stringify(gameState));
    let logMsg = "";
    
    if (gameState.currentWinType === 'self') {
        gameState.players[winnerId].stats.selfDrawn++;
        let totalWin = 0;
        gameState.players.forEach((p, idx) => {
            if (idx === winnerId) return;
            let extraTai = (idx === gameState.dealerIndex || winnerId === gameState.dealerIndex) ? (2 * n + 1) : 0;
            let currentPoints = base + (baseTai + extraTai) * tai;
            p.score -= currentPoints;
            totalWin += currentPoints;
        });
        gameState.players[winnerId].score += totalWin;
        logMsg = `${gameState.players[winnerId].name} 自摸 ${baseTai} 台`;
        if (winnerId === gameState.dealerIndex) {
            logMsg += ` (莊連 ${n} +${2*n+1})`;
            gameState.dealerCount++;
        } else {
            gameState.dealerIndex = (gameState.dealerIndex + 1) % 4;
            gameState.dealerCount = 0;
        }
    } else {
        const loserId = parseInt(document.getElementById('loser-select').value);
        if (winnerId === loserId) return alert("贏家與輸家不能是同一人");
        
        gameState.players[winnerId].stats.win++;
        gameState.players[loserId].stats.gun++;
        let extraTai = (winnerId === gameState.dealerIndex || loserId === gameState.dealerIndex) ? (2 * n + 1) : 0;
        let totalPoints = base + (baseTai + extraTai) * tai;
        
        gameState.players[winnerId].score += totalPoints;
        gameState.players[loserId].score -= totalPoints;
        logMsg = `${gameState.players[winnerId].name} 胡 ${gameState.players[loserId].name} ${baseTai} 台`;
        
        if (winnerId === gameState.dealerIndex) {
            logMsg += ` (莊連 ${n} +${2*n+1})`;
            gameState.dealerCount++;
        } else {
            gameState.dealerIndex = (gameState.dealerIndex + 1) % 4;
            gameState.dealerCount = 0;
        }
    }
    
    gameState.history.push({ msg: logMsg, backup: backup });
    saveState();
    renderBoard();
    closeModal('record-modal');
}

function showHistory() {
    const list = document.getElementById('history-list');
    list.innerHTML = '';
    if (gameState.history.length === 0) {
        list.innerHTML = '<div class="history-item">尚無紀錄</div>';
    } else {
        gameState.history.slice().reverse().forEach(h => {
            const item = document.createElement('div');
            item.className = 'history-item';
            item.innerText = h.msg;
            list.appendChild(item);
        });
    }
    document.getElementById('history-modal').style.display = 'flex';
}

function undoLast() {
    if (gameState.history.length === 0) return;
    if (confirm("確定要復原上一局嗎？")) {
        const last = gameState.history.pop();
        gameState = last.backup;
        saveState();
        renderBoard();
        showHistory();
    }
}

init();
