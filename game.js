const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// الأساسيات
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
const baseURL = window.location.href.replace(/\/[^/]*$/, '') + '/';
let gameAssets = { images: {}, sounds: {} };

// إعدادات التحكم
const controls = {
  jumpForce: isMobile ? -18 : -20,
  gravity: isMobile ? 0.7 : 0.8,
  speeds: {
    flower: isMobile ? 6 : 5,
    obstacle: isMobile ? 7 : 6,
    boy: 0.08
  }
};

// حالة اللعبة
let gameState = {
  groundY: 0,
  score: 0,
  isGameOver: false,
  isEnding: false,
  flowers: [],
  obstacles: [],
  intervals: { flowers: null, obstacles: null }
};

// العناصر الرئيسية
const player = {
  x: 100,
  y: 0,
  width: 50,
  height: 80,
  vy: 0,
  isJumping: false,
  targetX: 100
};

const boy = {
  x: 0,
  y: 270,
  width: 60,
  height: 100,
  targetX: 600
};

// تحميل الموارد مع تتبع المسارات
async function loadAsset(type, path) {
  const fullPath = new URL(path, baseURL).href;
  try {
    const response = await fetch(fullPath);
    if (!response.ok) throw new Error(`Status: ${response.status}`);
    return type === 'image' ? await loadImage(fullPath) : await loadAudio(fullPath);
  } catch (error) {
    console.error(`فشل تحميل ${type === 'image' ? 'الصورة' : 'الصوت'}: ${fullPath}`);
    throw error;
  }
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      console.log(`تم تحميل الصورة: ${src}`);
      resolve(img);
    };
    img.onerror = reject;
    img.src = src;
  });
}

function loadAudio(src) {
  return new Promise((resolve, reject) => {
    const audio = new Audio(src);
    audio.oncanplaythrough = () => {
      console.log(`تم تحميل الصوت: ${src}`);
      resolve(audio);
    };
    audio.onerror = reject;
    audio.preload = 'auto';
  });
}

// إعداد الكانفاس
function setupCanvas() {
  const maxWidth = isMobile ? window.innerWidth : 800;
  const targetRatio = 16 / 9;
  
  canvas.width = Math.min(window.innerWidth, maxWidth);
  canvas.height = canvas.width / targetRatio;
  canvas.style.touchAction = "none";
  
  gameState.groundY = canvas.height - 50;
  player.y = gameState.groundY - player.height;
}

// نظام التحكم
function initControls() {
  const handleAction = (e) => {
    e.preventDefault();
    if (!player.isJumping && !gameState.isGameOver) {
      player.vy = controls.jumpForce;
      player.isJumping = true;
      gameAssets.sounds.jump.play().catch(console.error);
    }
  };

  canvas.addEventListener('click', handleAction);
  canvas.addEventListener('touchstart', handleAction);
}

// توليد العناصر
function spawnObject(type) {
  const x = canvas.width + 100;
  const baseY = gameState.groundY - 40;

  if (type === "flower") {
    gameState.flowers.push({ x, y: baseY, width: 30, height: 30 });
  } else {
    const obstacle = {
      x,
      y: baseY,
      width: 40,
      height: 40,
      img: gameAssets.images.obstacles[Math.floor(Math.random() * 3)]
    };
    gameState.obstacles.push(obstacle);
  }
}

// الاصطدامات
function checkCollisions() {
  gameState.flowers.forEach((flower, i) => {
    if (isColliding(player, flower)) {
      gameState.flowers.splice(i, 1);
      gameState.score++;
    }
  });

  gameState.obstacles.forEach(obstacle => {
    if (isColliding(player, obstacle)) {
      gameState.isGameOver = true;
      gameAssets.sounds.hit.play();
      clearIntervals();
    }
  });
}

function isColliding(a, b) {
  return a.x < b.x + b.width &&
         a.x + a.width > b.x &&
         a.y < b.y + b.height &&
         a.y + a.height > b.y;
}

// نظام النهاية
function updateEnding() {
  if (!gameState.isEnding || gameState.isGameOver) return;

  player.x += (player.targetX - player.x) * controls.speeds.boy;
  boy.x += (boy.targetX - boy.x) * controls.speeds.boy;

  if (Math.abs(player.x - boy.x) < 50) {
    gameState.isGameOver = true;
    showEndMessage();
    clearIntervals();
  }
}

function showEndMessage() {
  ctx.fillStyle = "#fff";
  ctx.font = "30px Arial";
  ctx.textAlign = "center";
  ctx.fillText("مبروك! فزت!", canvas.width/2, canvas.height/2);
}

// الحلقة الرئيسية
function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  if (!gameState.isGameOver) {
    updateGame();
    drawGame();
  }
  
  requestAnimationFrame(gameLoop);
}

function updateGame() {
  // الحركة الأساسية
  player.y += player.vy;
  player.vy += controls.gravity;

  // الحدود السفلية
  if (player.y + player.height > gameState.groundY) {
    player.y = gameState.groundY - player.height;
    player.vy = 0;
    player.isJumping = false;
  }

  // حركة العناصر
  gameState.flowers.forEach(f => f.x -= controls.speeds.flower);
  gameState.obstacles.forEach(o => o.x -= controls.speeds.obstacle);

  // التحديثات
  checkCollisions();
  checkEndCondition();
  updateEnding();
}

function drawGame() {
  // الخلفية
  ctx.drawImage(gameAssets.images.background, 0, 0, canvas.width, canvas.height);

  // الشخصيات
  ctx.drawImage(gameAssets.images.player, player.x, player.y, player.width, player.height);
  if (gameState.isEnding) {
    ctx.drawImage(gameAssets.images.boy, boy.x, boy.y, boy.width, boy.height);
  }

  // العناصر
  gameState.flowers.forEach(f => {
    ctx.drawImage(gameAssets.images.flower, f.x, f.y, f.width, f.height);
  });

  gameState.obstacles.forEach(o => {
    ctx.drawImage(o.img, o.x, o.y, o.width, o.height);
  });

  // النقاط
  ctx.fillStyle = "#fff";
  ctx.font = "24px Arial";
  ctx.fillText(النقاط: ${gameState.score}, 20, 40);
}

// دوال مساعدة
function clearIntervals() {
  clearInterval(gameState.intervals.flowers);
  clearInterval(gameState.intervals.obstacles);
}

function checkEndCondition() {
  if (gameState.score >= 5 && !gameState.isEnding) {
    gameState.isEnding = true;
    player.targetX = canvas.width * 0.4;
    boy.targetX = canvas.width * 0.6;
    gameAssets.sounds.love.play();
    gameAssets.sounds.bgMusic.pause();
  }
}

async function startGame() {
  try {
    setupCanvas();
    
    // تحميل الموارد
    gameAssets.images = {
      background: await loadAsset('image', './images/background.png'),
      player: await loadAsset('image', './images/girl.png'),
      boy: await loadAsset('image', './images/boy.png'),
      flower: await loadAsset('image', './images/flower.png'),
      obstacles: [
        await loadAsset('image', './images/fire.png'),
        await loadAsset('image', './images/hole.png'),
        await loadAsset('image', './images/box.png')
      ]
    };

    gameAssets.sounds = {
      jump: await loadAsset('audio', './sounds/jump.mp3'),
      hit: await loadAsset('audio', './sounds/hit.mp3'),
      bgMusic: await loadAsset('audio', './sounds/bg.mp3'),
      love: await loadAsset('audio', './sounds/love.mp3')
    };

    // البدء
    initControls();
    resetGame();
    
    gameState.intervals.flowers = setInterval(() => spawnObject("flower"), 2000);
    gameState.intervals.obstacles = setInterval(() => spawnObject("obstacle"), 2500);

    // تشغيل الموسيقى
    document.addEventListener('click', () => gameAssets.sounds.bgMusic.play(), { once: true });
    document.addEventListener('touchstart', () => gameAssets.sounds.bgMusic.play(), { once: true });

    gameLoop();
  } catch (error) {
    console.error("خطأ في التشغيل:", error);
    alert("الرجاء التحقق من ملفات اللعبة!");
  }
}

function resetGame() {
  player.y = gameState.groundY - player.height;
  boy.x = canvas.width + 100;
  gameState.flowers = [];
  gameState.obstacles = [];
  gameState.score = 0;
  gameState.isGameOver = false;
  gameState.isEnding = false;
}

// التحقق النهائي من الملفات
function finalCheck() {
  const requiredFiles = [
    './images/background.png',
    './images/girl.png',
    './images/boy.png',
    './images/flower.png',
    './images/fire.png',
    './images/hole.png',
    './images/box.png',
    './sounds/jump.mp3',
    './sounds/hit.mp3',
    './sounds/bg.mp3',
    './sounds/love.mp3'
  ];

  requiredFiles.forEach(file => {
    fetch(file)
      .then(res => console.log(res.ok ? ✅ ${file} : ❌ ${file}))
      .catch(() => console.error(🚫 ${file}));
  });
}

// بدء التشغيل
finalCheck();
startGame();
