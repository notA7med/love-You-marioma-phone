const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let gameAssets = {
  images: {},
  sounds: {}
};

function setupCanvas() {
  const targetAspectRatio = 16 / 9;
  const maxWidth = 800;

  canvas.width = Math.min(window.innerWidth, maxWidth);
  canvas.height = canvas.width / targetAspectRatio;

  canvas.style.touchAction = "none";
  document.body.style.overflow = "hidden";
}

window.addEventListener("resize", () => {
  setupCanvas();
  resetGamePositions();
});

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

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject("فشل تحميل الصورة: " + src);
    img.src = src;
  });
}

function loadAudio(src) {
  return new Promise((resolve, reject) => {
    const audio = new Audio(src);
    audio.oncanplaythrough = () => resolve(audio);
    audio.onerror = () => reject("فشل تحميل الصوت: " + src);
  });
}

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

function resetGamePositions() {
  gameState.groundY = canvas.height - 50;
  player.y = gameState.groundY - player.height;
  boy.x = canvas.width + 100;
}

function initControls() {
  const handleJumpStart = (e) => {
    e.preventDefault();
    if (!gameState.isGameOver && !player.isJumping) {
      player.vy = -20;
      player.isJumping = true;
      gameAssets.sounds.jump.play().catch(() => {});
    }
  };

  canvas.addEventListener("touchstart", handleJumpStart);
  canvas.addEventListener("touchend", (e) => e.preventDefault());
  canvas.addEventListener("mousedown", handleJumpStart);
  canvas.addEventListener("mouseup", (e) => e.preventDefault());

  document.addEventListener("keydown", (e) => {
    if ((e.code === "Space" || e.code === "ArrowUp") && !player.isJumping) {
      handleJumpStart(e);
    }
    if (gameState.isGameOver && e.code === "Enter") {
      location.reload();
    }
  });
}

function spawnObject(type) {
  const baseY = gameState.groundY - 40;

  if (type === "flower") {
    gameState.flowers.push({
      x: canvas.width,
      y: baseY,
      width: 30,
      height: 30
    });
  } else {
    gameState.obstacles.push({
      x: canvas.width,
      y: baseY,
      width: 40,
      height: 40,
      type: Math.floor(Math.random() * 3)
    });
  }
}

function checkCollisions() {
  gameState.flowers.forEach((flower, index) => {
    if (detectCollision(player, flower)) {
      gameState.score++;
      gameState.flowers.splice(index, 1);
    }
  });

  gameState.obstacles.forEach(obstacle => {
    if (detectCollision(player, obstacle)) {
      gameAssets.sounds.hit.play().catch(() => {});
      gameState.isGameOver = true;
      gameAssets.sounds.bgMusic.pause();
    }
  });
}

function detectCollision(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function updateGame() {
  if (gameState.isGameOver) return;

  player.y += player.vy;
  player.vy += gameState.gravity;

  if (player.y + player.height > gameState.groundY) {
    player.y = gameState.groundY - player.height;
    player.vy = 0;
    player.isJumping = false;
  }

  gameState.flowers.forEach(f => f.x -= 4);
  gameState.obstacles.forEach(o => o.x -= 5);

  gameState.flowers = gameState.flowers.filter(f => f.x + f.width > 0);
  gameState.obstacles = gameState.obstacles.filter(o => o.x + o.width > 0);

  checkCollisions();
}

function drawScene() {
  ctx.drawImage(gameAssets.images.background, 0, 0, canvas.width, canvas.height);
  ctx.drawImage(gameAssets.images.player, player.x, player.y, player.width, player.height);

  gameState.flowers.forEach(flower => {
    ctx.drawImage(gameAssets.images.flower, flower.x, flower.y, flower.width, flower.height);
  });

  gameState.obstacles.forEach(obstacle => {
    ctx.drawImage(gameAssets.images.obstacles[obstacle.type], obstacle.x, obstacle.y, obstacle.width, obstacle.height);
  });

  ctx.fillStyle = "#ffffff";
  ctx.font = "24px Arial";
  ctx.fillText(`النقاط: ${gameState.score}`, 20, 40);
}

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!gameState.isGameOver) {
    updateGame();
    drawScene();
    requestAnimationFrame(gameLoop);
  }
}

async function startGame() {
  setupCanvas();
  await loadResources();
  initControls();
  resetGamePositions();

  setInterval(() => spawnObject("flower"), 3000);
  setInterval(() => spawnObject("obstacle"), 4000);

  document.addEventListener("click", () => {
    gameAssets.sounds.bgMusic.play().catch(() => {});
  }, { once: true });

  gameLoop();
}

startGame();