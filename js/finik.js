const state = {
    coins: 100,
    streak: 1,
    mood: 80,
    energy: 70,
    hunger: 60,
    lastLogin: new Date().toDateString(),
    inventory: [],
    equipped: null,

    tasks: [
        { id: 1, title: 'Покорми Финика', desc: 'Покорми питомца 3 раза', target: 3, current: 0, reward: 50 },
        { id: 2, title: 'Поиграй с Фиником', desc: 'Поиграй 5 раз', target: 5, current: 0, reward: 100 },
        { id: 3, title: 'Ежедневный вход', desc: 'Зайди в игру 2 дня подряд', target: 2, current: 1, reward: 200 },
        { id: 4, title: 'Крути рулетку', desc: 'Сделай 3 спина', target: 3, current: 0, reward: 150 }
    ],

    shopItems: [
        { id: 1, name: 'Фиолетовый шарф', emoji: '🧣', price: 150, bonus: '+10% к монетам' },
        { id: 2, name: 'Золотая корона', emoji: '👑', price: 500, bonus: '+25% к наградам' },
        { id: 3, name: 'Розовые очки', emoji: '👓', price: 200, bonus: '+15% к настроению' },
        { id: 4, name: 'Кроссовки', emoji: '👟', price: 300, bonus: '+20% к энергии' }
    ]
};

document.addEventListener('DOMContentLoaded', () => {
    loadState();
    updateUI();
    renderTasks();
    renderShop();
    checkDailyLogin();
    startDecayLoop();

    const finik = document.getElementById('finik');
    if (finik) finik.addEventListener('click', actionPet);
});

function switchView(viewName) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

    const view = document.getElementById(viewName + 'View');
    if (view) view.classList.add('active');

    const map = { home: 0, tasks: 1, spin: 2, shop: 3 };
    const navItems = document.querySelectorAll('.nav-item');
    if (navItems[map[viewName]]) navItems[map[viewName]].classList.add('active');
}

function actionFeed() {
    if (state.hunger >= 100) return showNotification('Финик не голоден!', '🤢');

    state.hunger = Math.min(100, state.hunger + 30);
    state.mood = Math.min(100, state.mood + 10);

    updateUI();
    checkTaskProgress('feed');
    showNotification('+30 сытости!', '🍎');
    saveState();
}

function actionPlay() {
    if (state.energy < 20) return showNotification('Финик слишком устал!', '😴');

    state.energy -= 20;
    state.mood = Math.min(100, state.mood + 25);
    state.coins += 10;

    updateUI();
    checkTaskProgress('play');
    showNotification('+25 настроения! +10 🪙', '🎮');
    saveState();
}

function actionPet() {
    state.mood = Math.min(100, state.mood + 15);
    updateUI();
    showNotification('Финик доволен!', '😊');
    saveState();
}

function actionSleep() {
    if (state.energy >= 100) return showNotification('Финик полон энергии!', '⚡');

    state.energy = 100;
    state.hunger = Math.max(0, state.hunger - 20);

    updateUI();
    showNotification('Финик выспался!', '💤');
    saveState();
}

function updateStats() {
    const moodBar = document.getElementById('moodBar');
    const energyBar = document.getElementById('energyBar');
    const hungerBar = document.getElementById('hungerBar');

    if (moodBar) moodBar.style.width = state.mood + '%';
    if (energyBar) energyBar.style.width = state.energy + '%';
    if (hungerBar) hungerBar.style.width = state.hunger + '%';
}

function updateUI() {
    const coinsCount = document.getElementById('coinsCount');
    const shopCoins = document.getElementById('shopCoins');
    const streakCount = document.getElementById('streakCount');

    if (coinsCount) coinsCount.textContent = state.coins;
    if (shopCoins) shopCoins.textContent = state.coins;
    if (streakCount) streakCount.textContent = state.streak;

    updateStats();
}

function renderTasks() {
    const container = document.getElementById('tasksList');
    if (!container) return;

    container.innerHTML = '';

    state.tasks.forEach(task => {
        const completed = task.current >= task.target;

        container.innerHTML += `
            <div class="task-card">
                <div class="task-info">
                    <h3>${task.title}</h3>
                    <p>${task.desc}</p>
                    <div style="margin-top:8px;font-size:12px;color:var(--yellow)">
                        Прогресс: ${task.current}/${task.target}
                    </div>
                </div>
                <div style="text-align:right">
                    <div class="task-reward"><span>🪙</span><span>${task.reward}</span></div>
                    <button class="claim-btn"
                        onclick="claimTask(${task.id})"
                        ${completed ? '' : 'disabled'}>
                        ${completed ? 'Получить' : 'В процессе'}
                    </button>
                </div>
            </div>
        `;
    });
}

function checkTaskProgress(action) {
    state.tasks.forEach(task => {
        if (action === 'feed' && task.id === 1) task.current = Math.min(task.target, task.current + 1);
        if (action === 'play' && task.id === 2) task.current = Math.min(task.target, task.current + 1);
        if (action === 'spin' && task.id === 4) task.current = Math.min(task.target, task.current + 1);
    });

    renderTasks();
    saveState();
}

function claimTask(taskId) {
    const task = state.tasks.find(t => t.id === taskId);
    if (!task || task.current < task.target) return;

    state.coins += task.reward;
    task.current = 0;

    updateUI();
    renderTasks();
    showNotification(`+${task.reward} монет!`, '🎉');
    saveState();
}

function checkDailyLogin() {
    const today = new Date().toDateString();

    if (state.lastLogin !== today) {
        state.lastLogin = today;
        state.streak++;
        state.coins += 50;

        const loginTask = state.tasks.find(t => t.id === 3);
        if (loginTask) loginTask.current = Math.min(loginTask.target, loginTask.current + 1);

        updateUI();
        renderTasks();
        showNotification(`День ${state.streak}! +50 🪙`, '🔥');
        saveState();
    }
}

function renderShop() {
    const container = document.getElementById('shopGrid');
    if (!container) return;

    container.innerHTML = '';

    state.shopItems.forEach(item => {
        const owned = state.inventory.includes(item.id);
        const equipped = state.equipped === item.id;

        container.innerHTML += `
            <div class="shop-item ${equipped ? 'equipped' : ''}">
                <span class="item-icon">${item.emoji}</span>
                <div class="item-name">${item.name}</div>
                <div class="item-bonus">${item.bonus}</div>
                <div class="item-price"><span>🪙</span><span>${item.price}</span></div>
                <button class="buy-btn" onclick="buyItem(${item.id})"
                    ${owned || state.coins < item.price ? 'disabled' : ''}>
                    ${equipped ? 'Надето ✓' : owned ? 'Куплено' : 'Купить'}
                </button>
            </div>
        `;
    });
}

function buyItem(itemId) {
    const item = state.shopItems.find(i => i.id === itemId);
    if (!item || state.coins < item.price || state.inventory.includes(itemId)) return;

    state.coins -= item.price;
    state.inventory.push(itemId);
    state.equipped = itemId;

    updateUI();
    renderShop();
    showNotification(`${item.name} куплен!`, '🛍️');
    saveState();
}

function showNotification(text, icon) {
    const notif = document.getElementById('notification');
    const notifText = document.getElementById('notifText');
    const notifIcon = document.getElementById('notifIcon');

    if (!notif || !notifText || !notifIcon) return;

    notifText.textContent = text;
    notifIcon.textContent = icon;
    notif.classList.add('show');

    setTimeout(() => notif.classList.remove('show'), 2500);
}

function startDecayLoop() {
    setInterval(() => {
        state.hunger = Math.max(0, state.hunger - 2);
        state.mood = Math.max(0, state.mood - 1);
        state.energy = Math.max(0, state.energy - 1);

        updateUI();
        saveState();
    }, 30000);
}

function saveState() {
    localStorage.setItem('finikState', JSON.stringify(state));
}

function loadState() {
    const saved = localStorage.getItem('finikState');
    if (!saved) return;

    Object.assign(state, JSON.parse(saved));
}

function spinWheel() {
    location.href = 'ruletka.html';
}