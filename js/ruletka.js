

const SEGMENTS = [
  {
    label: 'Монеты',
    emoji: '🪙',
    value: 500,
    color1: '#6A0DAD',
    color2: '#8B2FC9',
    textColor: '#FFFFFF',
    desc: '500 монет на ваш баланс!'
  },
  {
    label: 'Скидка',
    emoji: '🏷️',
    value: 15,
    color1: '#FF2E63',
    color2: '#FF5A85',
    textColor: '#FFFFFF',
    desc: 'Скидка 15% на следующую покупку!'
  },
  {
    label: 'Бонус',
    emoji: '⭐',
    value: 200,
    color1: '#FFD600',
    color2: '#FFEA00',
    textColor: '#1A0A2E',
    desc: 'Бонус 200 баллов!'
  },
  {
    label: 'Подарок',
    emoji: '🎁',
    value: 1000,
    color1: '#FFFFFF',
    color2: '#F0F0F5',
    textColor: '#1A0A2E',
    desc: 'Секретный подарок внутри!'
  },
  {
    label: 'Кэшбэк',
    emoji: '💸',
    value: 10,
    color1: '#9B30FF',
    color2: '#B866FF',
    textColor: '#FFFFFF',
    desc: 'Кэшбэк 10% на 30 дней!'
  },
  {
    label: 'VIP',
    emoji: '👑',
    value: 7,
    color1: '#FFD600',
    color2: '#FFC107',
    textColor: '#1A0A2E',
    desc: 'VIP статус на 7 дней!'
  },
  {
    label: 'Билет',
    emoji: '🎟️',
    value: 1,
    color1: '#FF2E63',
    color2: '#E91E53',
    textColor: '#FFFFFF',
    desc: 'Бесплатный билет в кино!'
  },
  {
    label: 'Джекпот',
    emoji: '💎',
    value: 5000,
    color1: '#E53935',   // насыщенный красный
    color2: '#FF6B6B',   // светло-красный градиент
  textColor: '#FFFFFF', // белый текст для контраста
  desc: 'ДЖЕКПОТ! 5000 монет!'
}
  
];

const NUM_SEGMENTS = SEGMENTS.length;
const SEGMENT_ANGLE = (2 * Math.PI) / NUM_SEGMENTS; // угол одного сектора

// ──────────────────────────────────────────────────────
// 2. DOM ЭЛЕМЕНТЫ
// ──────────────────────────────────────────────────────
const canvas = document.getElementById('wheelCanvas');
const ctx = canvas.getContext('2d');
const confettiCanvas = document.getElementById('confettiCanvas');
const confettiCtx = confettiCanvas.getContext('2d');
const spinBtn = document.getElementById('spinBtn');
const popup = document.getElementById('popup');
const popupEmoji = document.getElementById('popupEmoji');
const popupTitle = document.getElementById('popupTitle');
const popupDesc = document.getElementById('popupDesc');
const popupBtn = document.getElementById('popupBtn');
const totalWinsEl = document.getElementById('totalWins');
const totalCoinsEl = document.getElementById('totalCoins');
const totalStreakEl = document.getElementById('totalStreak');

// Размеры canvas
const W = canvas.width;
const H = canvas.height;
const CX = W / 2;
const CY = H / 2;
const RADIUS = W / 2 - 10; // отступ для декоративной рамки

// ──────────────────────────────────────────────────────
// 3. СОСТОЯНИЕ
// ──────────────────────────────────────────────────────
let currentAngle = 0;        // текущий угол вращения (радианы)
let angularVelocity = 0;     // текущая угловая скорость
let isSpinning = false;      // флаг вращения
let totalWins = 0;
let totalCoins = 0;
let streak = 0;

// ──────────────────────────────────────────────────────
// 4. ЗВУКОВОЙ ДВИЖОК (Web Audio API)
// ──────────────────────────────────────────────────────
let audioCtx = null;

function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
}

function playTick() {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.type = 'sine';
  osc.frequency.setValueAtTime(1200 + Math.random() * 400, audioCtx.currentTime);
  gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.06);

  osc.start(audioCtx.currentTime);
  osc.stop(audioCtx.currentTime + 0.06);
}

function playWinSound() {
  if (!audioCtx) return;
  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
  notes.forEach((freq, i) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.type = 'sine';
    osc.frequency.value = freq;
    const t = audioCtx.currentTime + i * 0.12;
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    osc.start(t);
    osc.stop(t + 0.4);
  });
}

// ──────────────────────────────────────────────────────
// 5. ОТРИСОВКА КОЛЕСА
// ──────────────────────────────────────────────────────
function drawWheel() {
  ctx.clearRect(0, 0, W, H);

  ctx.save();
  ctx.translate(CX, CY);
  ctx.rotate(currentAngle);

  for (let i = 0; i < NUM_SEGMENTS; i++) {
    const startAngle = i * SEGMENT_ANGLE;
    const endAngle = startAngle + SEGMENT_ANGLE;
    const seg = SEGMENTS[i];

    // ── Сектор (градиент) ──
    const midAngle = startAngle + SEGMENT_ANGLE / 2;
    const grad = ctx.createRadialGradient(
      Math.cos(midAngle) * RADIUS * 0.3,
      Math.sin(midAngle) * RADIUS * 0.3,
      RADIUS * 0.1,
      0, 0, RADIUS
    );
    grad.addColorStop(0, seg.color2);
    grad.addColorStop(1, seg.color1);

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, RADIUS, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // ── Разделительная линия ──
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(startAngle) * RADIUS, Math.sin(startAngle) * RADIUS);
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // ── Текст и эмодзи ──
    ctx.save();
    ctx.rotate(midAngle);

    // Эмодзи
    const emojiSize = RADIUS * 0.18;
    ctx.font = `${emojiSize}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(seg.emoji, RADIUS * 0.62, 0);

    // Лейбл
    ctx.font = `bold ${RADIUS * 0.08}px -apple-system, BlinkMacSystemFont, sans-serif`;
    ctx.fillStyle = seg.textColor;
    ctx.textAlign = 'center';
    ctx.fillText(seg.label, RADIUS * 0.42, 0);

    ctx.restore();
  }

  // ── Внутренний круг (под центральную кнопку) ──
  const innerGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, RADIUS * 0.22);
  innerGrad.addColorStop(0, 'rgba(255,255,255,0.1)');
  innerGrad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.beginPath();
  ctx.arc(0, 0, RADIUS * 0.22, 0, Math.PI * 2);
  ctx.fillStyle = innerGrad;
  ctx.fill();

  // ── Внешняя обводка ──
  ctx.beginPath();
  ctx.arc(0, 0, RADIUS, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255,255,255,0.1)';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.restore();
}

// ──────────────────────────────────────────────────────
// 6. ТОЧКИ-ИНДИКАТОРЫ ПО КРАЯМ
// ──────────────────────────────────────────────────────
function createDots() {
  const container = document.getElementById('wheelDots');
  const numDots = 24;
  const wrapperW = document.querySelector('.wheel-wrapper').offsetWidth;
  const dotRadius = (wrapperW - 16) / 2;

  for (let i = 0; i < numDots; i++) {
    const angle = (i / numDots) * Math.PI * 2 - Math.PI / 2;
    const dot = document.createElement('div');
    dot.className = 'wheel-dot';
    dot.style.left = `${(wrapperW / 2) + Math.cos(angle) * dotRadius - 5}px`;
    dot.style.top = `${(wrapperW / 2) + Math.sin(angle) * dotRadius - 5}px`;
    dot.dataset.index = i;
    container.appendChild(dot);
  }
}

function animateDots() {
  const dots = document.querySelectorAll('.wheel-dot');
  const numDots = dots.length;
  // Определяем, какой сектор сейчас сверху (указатель)
  // Указатель находится вверху (-π/2)
  const normalizedAngle = ((-currentAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  const activeDotIndex = Math.floor((normalizedAngle / (Math.PI * 2)) * numDots) % numDots;

  dots.forEach((dot, i) => {
    dot.classList.toggle('active', i === activeDotIndex);
  });
}

// ──────────────────────────────────────────────────────
// 7. ОПРЕДЕЛЕНИЕ ВЫИГРЫШНОГО СЕКТОРА
// ──────────────────────────────────────────────────────
function getWinningSegment() {
  // Указатель сверху: угол = -π/2 (или 3π/2)
  // Нам нужно найти, какой сектор пересекает верхнюю точку
  const pointerAngle = -Math.PI / 2;
  // Нормализуем текущий угол
  const normalized = ((currentAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);

  // Угол сектора относительно указателя
  let relativeAngle = pointerAngle - normalized;
  // Нормализуем в [0, 2π)
  relativeAngle = ((relativeAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);

  const index = Math.floor(relativeAngle / SEGMENT_ANGLE) % NUM_SEGMENTS;
  return SEGMENTS[index];
}

// ──────────────────────────────────────────────────────
// 8. АНИМАЦИЯ ВРАЩЕНИЯ
// ──────────────────────────────────────────────────────
let lastTickAngle = 0;

function spinWheel() {
  if (isSpinning) return;
  isSpinning = true;
  spinBtn.classList.add('spinning');
  initAudio();

  // Случайный выбор сектора (контролируемый)
  const targetIndex = Math.floor(Math.random() * NUM_SEGMENTS);
  // Целевой угол: чтобы указатель указывал на середину targetIndex
  // Указатель сверху = -π/2
  // Середина сектора targetIndex = targetIndex * SEGMENT_ANGLE + SEGMENT_ANGLE / 2
  // Нужно: currentAngle + totalRotation ≡ -(targetIndex * SEGMENT_ANGLE + SEGMENT_ANGLE/2) - π/2  (mod 2π)
  // Но проще: задаём целевой угол напрямую

  const targetSegmentCenter = targetIndex * SEGMENT_ANGLE + SEGMENT_ANGLE / 2;
  // Указатель сверху = -π/2, значит текущий угол должен быть таким,
  // чтобы при повороте sector оказался сверху
  // sector angle от указателя = currentAngle + π/2
  // Нужно: currentAngle + π/2 ≡ targetSegmentCenter (mod 2π)
  // currentAngle ≡ targetSegmentCenter - π/2

  let targetAngle = targetSegmentCenter - Math.PI / 2;
  // Добавляем несколько полных оборотов (5-8)
  const extraSpins = (5 + Math.random() * 3) * Math.PI * 2;
  targetAngle = currentAngle + extraSpins + (targetAngle - (currentAngle % (Math.PI * 2)));
  // Нормализуем чтобы всегда крутилось вперёд
  targetAngle = currentAngle + extraSpins + ((targetSegmentCenter - Math.PI / 2 - currentAngle) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);

  const startAngle = currentAngle;
  const totalRotation = targetAngle - startAngle;

  // Параметры анимации
  const duration = 4000 + Math.random() * 2000; // 4-6 секунд
  const startTime = performance.now();

  lastTickAngle = currentAngle;

  function animate(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // Easing: cubic-bezier(0.25, 0.1, 0.25, 1) → ease-out с лёгким bounce
    // Используем кастомную функцию для эффекта замедления + bounce
    let eased;
    if (progress < 1) {
      // easeOutCubic с замедлением
      eased = 1 - Math.pow(1 - progress, 3);
    } else {
      eased = 1;
    }

    // Добавляем bounce при остановке (последние 5%)
    if (progress > 0.95) {
      const bounceProgress = (progress - 0.95) / 0.05;
      const bounce = Math.sin(bounceProgress * Math.PI * 2) * 0.005 * (1 - bounceProgress);
      eased += bounce;
    }

    currentAngle = startAngle + totalRotation * eased;

    // Звук тиков при прохождении секторов
    const angleDiff = currentAngle - lastTickAngle;
    if (angleDiff > SEGMENT_ANGLE) {
      playTick();
      lastTickAngle = currentAngle;
    }

    drawWheel();
    animateDots();

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      // Вращение завершено
      isSpinning = false;
      spinBtn.classList.remove('spinning');
      onSpinComplete(targetIndex);
    }
  }

  requestAnimationFrame(animate);
}

// ──────────────────────────────────────────────────────
// 9. ОБРАБОТКА РЕЗУЛЬТАТА
// ──────────────────────────────────────────────────────
function onSpinComplete(index) {
  const seg = SEGMENTS[index];
  totalWins++;
  totalCoins += seg.value;
  streak++;

  // Обновляем статистику
  totalWinsEl.textContent = totalWins;
  totalCoinsEl.textContent = totalCoins.toLocaleString();
  totalStreakEl.textContent = streak;

  // Звук победы
  playWinSound();

  // Конфетти!
  launchConfetti();

  // Показываем popup с задержкой
  setTimeout(() => {
    popupEmoji.textContent = seg.emoji;
    popupTitle.textContent = seg.label + '!';
    popupDesc.textContent = seg.desc;
    popup.classList.add('visible');
  }, 300);
}

// ──────────────────────────────────────────────────────
// 10. КОНФЕТТИ СИСТЕМА
// ──────────────────────────────────────────────────────
let confettiPieces = [];
let confettiRunning = false;

function resizeConfetti() {
  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;
}
resizeConfetti();
window.addEventListener('resize', resizeConfetti);

function launchConfetti() {
  confettiPieces = [];
  const colors = ['#6A0DAD', '#FF2E63', '#FFD600', '#FFFFFF', '#9B30FF', '#FF6B8A', '#FFEA00'];

  for (let i = 0; i < 150; i++) {
    confettiPieces.push({
      x: confettiCanvas.width / 2 + (Math.random() - 0.5) * 100,
      y: confettiCanvas.height / 2,
      vx: (Math.random() - 0.5) * 16,
      vy: -Math.random() * 18 - 4,
      w: Math.random() * 10 + 5,
      h: Math.random() * 6 + 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.3,
      gravity: 0.3 + Math.random() * 0.2,
      opacity: 1,
      decay: 0.005 + Math.random() * 0.008
    });
  }

  if (!confettiRunning) {
    confettiRunning = true;
    animateConfetti();
  }
}

function animateConfetti() {
  confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);

  let alive = false;
  confettiPieces.forEach(p => {
    p.x += p.vx;
    p.vy += p.gravity;
    p.y += p.vy;
    p.rotation += p.rotSpeed;
    p.opacity -= p.decay;

    // Затухание по краям
    if (p.x < 0 || p.x > confettiCanvas.width) {
      p.opacity -= 0.02;
    }

    if (p.opacity <= 0) return;
    alive = true;

    confettiCtx.save();
    confettiCtx.translate(p.x, p.y);
    confettiCtx.rotate(p.rotation);
    confettiCtx.globalAlpha = Math.max(0, p.opacity);
    confettiCtx.fillStyle = p.color;

    // Рисуем конфетти (прямоугольник)
    confettiCtx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);

    confettiCtx.restore();
  });

  if (alive) {
    requestAnimationFrame(animateConfetti);
  } else {
    confettiRunning = false;
    confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
  }
}

// ──────────────────────────────────────────────────────
// 11. EVENT LISTENERS
// ──────────────────────────────────────────────────────
spinBtn.addEventListener('click', spinWheel);
canvas.addEventListener('click', () => {
  if (!isSpinning) spinWheel();
});

popupBtn.addEventListener('click', () => {
  popup.classList.remove('visible');
});

popup.addEventListener('click', (e) => {
  if (e.target === popup) {
    popup.classList.remove('visible');
  }
});

// Клавиша Enter/Space для вращения
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space' || e.code === 'Enter') {
    e.preventDefault();
    if (!isSpinning && !popup.classList.contains('visible')) {
      spinWheel();
    } else if (popup.classList.contains('visible')) {
      popup.classList.remove('visible');
    }
  }
});

// ──────────────────────────────────────────────────────
// 12. ИНИЦИАЛИЗАЦИЯ
// ──────────────────────────────────────────────────────
createDots();
drawWheel();

// Начальная анимация — лёгкое покачивание
(function initialWobble() {
  let t = 0;
  function wobble() {
    if (isSpinning) return;
    t += 0.02;
    currentAngle = Math.sin(t) * 0.03;
    drawWheel();
    animateDots();
    requestAnimationFrame(wobble);
  }
  wobble();
})();
