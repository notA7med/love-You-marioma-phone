// تهيئة العناصر الأساسية
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// تكييف حجم Canvas مع الشاشة
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ground = canvas.height - 100;
    player.y = ground - player.height;
    player.targetY = ground - player.height;
}
window.addEventListener("resize", resizeCanvas);

// كائنات اللعبة
let player = {
    x: 100,
    y: 300,
    width: 50,
    height: 80,
    vy: 0,
    jumping: false,
    img: new Image(),
    targetX: 100,
    targetY: 300
};
player.img.src = "images/girl.png";

let boy = {
    x: 800,
    y: 270,
    width: 60,
    height: 100,
    targetX: 600,
    targetY: 270,
    img: new Image()
};
boy.img.src = "images/boy.png";

let ground = 350;
let gravity = 0.8;
let flowers = [];
let obstacles = [];
let flowerParticles = [];
let score = 0;
let gameOver = false;
let showBoy = false;
let isEnding = false;

// تحميل الأصول
let background = new Image();
background.src = "images/background.png";

let flowerImg = new Image();
flowerImg.src = "images/flower.png";

let obstacleImgs = ["images/fire.png", "images/hole.png", "images/box.png"].map(src => {
    let img = new Image();
    img.src = src;
    return img;
});

// الصوتيات
let jumpSound = new Audio("sounds/jump.mp3");
let hitSound = new Audio("sounds/hit.mp3");
let bgMusic = new Audio("sounds/bg.mp3");
let loveMusic = new Audio("sounds/love.mp3");

bgMusic.loop = true;

// أحداث التحكم
document.addEventListener("keydown", (e) => {
    if (e.code === "Space" && !player.jumping) {
        player.vy = -20;
        player.jumping = true;
        jumpSound.play();
    }
});

canvas.addEventListener("touchstart", (e) => {
    e.preventDefault();
    if (!player.jumping) {
        player.vy = -20;
        player.jumping = true;
        jumpSound.play();
    }
});

// منع التمرير باللمس
document.body.addEventListener("touchstart", (e) => e.preventDefault(), { passive: false });
document.body.addEventListener("touchmove", (e) => e.preventDefault(), { passive: false });

// وظائف اللعبة
function spawnFlower() {
    flowers.push({ x: canvas.width, y: ground - 40, width: 30, height: 30 });
}

function spawnObstacle() {
    let i = Math.floor(Math.random() * obstacleImgs.length);
    obstacles.push({
        x: canvas.width,
        y: ground - 30,
        width: 40,
        height: 40,
        img: obstacleImgs[i]
    });
}

function createFlowerParticles() {
    for (let i = 0; i < score; i++) {
        flowerParticles.push({
            x: Math.random() * canvas.width,
            y: -Math.random() * 100,
            vy: Math.random() * 2 + 1,
            rotate: 0,
            rotationSpeed: (Math.random() - 0.5) * 0.2
        });
    }
}

function update() {
    if (gameOver) return;

    // فيزياء اللاعب
    player.y += player.vy;
    player.vy += gravity;

    if (player.y >= ground - player.height) {
        player.y = ground - player.height;
        player.vy = 0;
        player.jumping = false;
    }

    // نهاية اللعبة
    if (isEnding) {
        player.x += (player.targetX - player.x) * 0.05;
        boy.x += (boy.targetX - boy.x) * 0.05;

        flowerParticles.forEach(p => {
            p.y += p.vy;
            p.vy += 0.3;
            p.rotate += p.rotationSpeed;

            if (p.y > canvas.height) {
                p.y = -10;
                p.vy = Math.random() * 2 + 1;
            }
        });
        return;
    }

    // تحديث العناصر
    flowers.forEach(f => f.x -= 4);
    obstacles.forEach(o => o.x -= 5);

    flowers = flowers.filter(f => f.x + f.width > 0);
    obstacles = obstacles.filter(o => o.x + o.width > 0);

    flowers.forEach((f, i) => {
        if (collision(player, f)) {
            flowers.splice(i, 1);
            score++;
        }
    });

    obstacles.forEach((o) => {
        if (collision(player, o)) {
            hitSound.play();
            gameOver = true;
            bgMusic.pause();
        }
    });

    if (score >= 9 && !showBoy) {
        showBoy = true;
        isEnding = true;
        player.targetX = canvas.width/2 - 100;
        boy.targetX = canvas.width/2 + 40;
        loveMusic.play();
        bgMusic.pause();
        createFlowerParticles();
        clearInterval(flowerInterval);
        clearInterval(obstacleInterval);
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

    // رسم العناصر
    ctx.drawImage(player.img, player.x, player.y, player.width, player.height);
    
    flowers.forEach(f => {
        ctx.drawImage(flowerImg, f.x, f.y, f.width, f.height);
    });

    obstacles.forEach(o => {
        ctx.drawImage(o.img, o.x, o.y, o.width, o.height);
    });

    if (showBoy) {
        ctx.drawImage(boy.img, boy.x, boy.y, boy.width, boy.height);
        ctx.fillStyle = "#fff";
        ctx.font = "24px Arial";
        ctx.fillText("LOVE YOU MARIOMA", canvas.width/2 - 120, 150);
        
        flowerParticles.forEach(p => {
            ctx.save();
            ctx.translate(p.x + 15, p.y + 15);
            ctx.rotate(p.rotate);
            ctx.drawImage(flowerImg, -15, -15, 30, 30);
            ctx.restore();
        });
    }

    ctx.fillStyle = "#fff";
    ctx.font = "20px Arial";
    ctx.fillText("Score: " + score, 10, 30);

    if (gameOver) {
        ctx.fillStyle = "#fff";
        ctx.font = "40px Arial";
        ctx.fillText("Game Over", canvas.width/2 - 100, canvas.height/2 - 50);
        createRestartButton();
    }
}

// اكتشاف التصادم
function collision(a, b) {
    return a.x < b.x + b.width &&
           a.x + a.width > b.x &&
           a.y < b.y + b.height &&
           a.y + a.height > b.y;
}

// إنشاء الأزرار
function createStartButton() {
    const button = document.createElement("button");
    button.innerHTML = "Start Game";
    button.style.cssText = `
        position: fixed;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        font-size: 24px;
        padding: 15px 30px;
        background: #ff4444;
        color: white;
        border: none;
        border-radius: 25px;
        cursor: pointer;
        box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        transition: transform 0.2s;
        z-index: 100;
    `;
    button.addEventListener("touchstart", (e) => e.preventDefault());
    document.body.appendChild(button);

    button.addEventListener("click", () => {
        bgMusic.play();
        button.remove();
        startGame();
    });
}

function createRestartButton() {
    const button = document.createElement("button");
    button.innerHTML = "Restart Game";
    button.style.cssText = `
        position: fixed;
        left: 50%;
        top: 60%;
        transform: translate(-50%, -50%);
        font-size: 24px;
        padding: 15px 30px;
        background: #ff4444;
        color: white;
        border: none;
        border-radius: 25px;
        cursor: pointer;
        box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        transition: transform 0.2s;
        z-index: 100;
    `;
    button.addEventListener("touchstart", (e) => e.preventDefault());
    document.body.appendChild(button);

    button.addEventListener("click", () => location.reload());
}

// بدء اللعبة
let flowerInterval, obstacleInterval;

function startGame() {
    resizeCanvas();
    flowers = [];
    obstacles = [];
    flowerParticles = [];
    score = 0;
    gameOver = false;
    showBoy = false;
    isEnding = false;
    
    player = {
        ...player,
        x: 100,
        y: ground - player.height,
        vy: 0,
        jumping: false
    };

    flowerInterval = setInterval(spawnFlower, 3000);
    obstacleInterval = setInterval(spawnObstacle, 4000);
    gameLoop();
}

// الحلقة الرئيسية
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// التهيئة الأولية
resizeCanvas();
createStartButton();
