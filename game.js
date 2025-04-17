const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// تحسين الأداء للهواتف
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
const targetScore = 5; // تقليل النقاط المطلوبة لإنهاء اللعبة

let gameAssets = {
  images: {},
  sounds: {}
};

// تحسين إعدادات الكنفاس للهواتف
function setupCanvas() {
  const maxWidth = isMobile ? window.innerWidth : 800;
  const targetAspectRatio = 16 / 9;

  canvas.width = Math.min(window.innerWidth, maxWidth);
  canvas.height = canvas.width / targetAspectRatio;
  
  canvas.style.touchAction = "none";
  document.body.style.overflow = "hidden";
}

window.addEventListener("resize", () => {
  setupCanvas();
  resetGamePositions();
});

// زيادة سرعة العناصر
const speeds = {
  flower: isMobile ? 6 : 5, // زيادة السرعة على الهواتف
  obstacle: isMobile ? 7 : 6,
  boyMovement: 0.08 // زيادة سرعة حركة الولد
};

async function loadResources() {
  try {
    gameAssets.images = {
      background: await loadImage("./images/background.png"),
      player: await loadImage("./images/girl.png"),
      boy: await loadImage("./images/boy.png"),
      flower: await loadImage("./images/flower.png"),
      obstacles: [
        await loadImage("./images/fire.png"),
        await loadImage("./images/hole.png"),
        await loadImage("./images/box.png")
      ]
    };

    gameAssets.sounds = {
      jump: await loadAudio("./sounds/jump.mp3"),
      hit: await loadAudio("./sounds/hit.mp3"),
      bgMusic: await loadAudio("./sounds/bg.mp3"),
      love: await loadAudio("./sounds/love.mp3")
    };

    gameAssets.sounds.bgMusic.loop = true;

  } catch (error) {
    console.error("فشل تحميل الموارد:", error);
    alert("الملفات المطلوبة مفقودة!");
  }
}

// ... (بقية دوال تحميل الموارد كما هي)

let player = {
  x: 100,
  y: 0,
  width: 50,
  height: 80,
  vy: 0,
  isJumping: false,
  targetX: 100
};

let boy = {
  x: 0,
  y: 270,
  width: 60,
  height: 100,
  targetX: 600
};

let gameState = {
  groundY: 0,
  gravity: 0.8,
  flowers: [],
  obstacles: [],
  particles: [],
  score: 0,
  isGameOver: false,
  isEnding: false
};

// تحسين حركة الولد عند النهاية
function updateEndingSequence() {
  if (gameState.isEnding) {
    player.x += (player.targetX - player.x) * speeds.boyMovement;
    boy.x += (boy.targetX - boy.x) * speeds.boyMovement;
    
    // إنهاء اللعبة عند الاقتراب الكافي
    if (Math.abs(player.x - boy.x) < 50) {
      gameState.isGameOver = true;
      ctx.fillStyle = "#fff";
      ctx.font = "30px Arial";
      ctx.fillText("مبروك! لقد فزت!", canvas.width/2 - 100, canvas.height/2);
    }
  }
}

function checkEndCondition() {
  if (gameState.score >= targetScore && !gameState.isEnding) {
    gameState.isEnding = true;
    player.targetX = canvas.width * 0.4;
    boy.targetX = canvas.width * 0.6;
    gameAssets.sounds.love.play().catch(() => {});
    gameAssets.sounds.bgMusic.pause();
    
    // إيقاف توليد العناصر
    clearInterval(flowerInterval);
    clearInterval(obstacleInterval);
  }
}

function updateGame() {
  if (gameState.isGameOver) return;

  // تحديث حركة اللاعب
  player.y += player.vy;
  player.vy += gameState.gravity;

  if (player.y + player.height > gameState.groundY) {
    player.y = gameState.groundY - player.height;
    player.vy = 0;
    player.isJumping = false;
  }

  // زيادة سرعة العناصر
  gameState.flowers.forEach(f => f.x -= speeds.flower);
  gameState.obstacles.forEach(o => o.x -= speeds.obstacle);

  gameState.flowers = gameState.flowers.filter(f => f.x + f.width > 0);
  gameState.obstacles = gameState.obstacles.filter(o => o.x + o.width > 0);

  checkCollisions();
  checkEndCondition();
  updateEndingSequence(); // إضافة تحديث التسلسل النهائي
}

// ... (بقية الدوال مع الحفاظ على التعديلات)

async function startGame() {
  setupCanvas();
  await loadResources();
  initControls();
  resetGamePositions();

  // تقليل فترات التوليد
  const flowerInterval = setInterval(() => spawnObject("flower"), 2000);
  const obstacleInterval = setInterval(() => spawnObject("obstacle"), 2500);

  document.addEventListener("click", () => {
    gameAssets.sounds.bgMusic.play().catch(() => {});
  }, { once: true });

  gameLoop();
}

startGame();
