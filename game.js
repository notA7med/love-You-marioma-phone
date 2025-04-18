const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// تهيئة الصوتيات
let bgMusic = new Audio("sounds/bg.mp3");
bgMusic.loop = true;

// إعدادات التحكم
let isGameStarted = false;
let isAudioContextResumed = false;

// تهيئة Canvas
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ground = canvas.height - 100;
    if(player) {
        player.y = ground - player.height;
        player.targetY = ground - player.height;
    }
}

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

// متغيرات اللعبة
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

// الأحداث
document.addEventListener("keydown", (e) => {
    if (e.code === "Space" && !player.jumping && isGameStarted) {
        player.vy = -20;
        player.jumping = true;
        jumpSound.play();
    }
});

canvas.addEventListener("touchstart", (e) => {
    if (!isGameStarted) return;
    e.preventDefault();
    if (!player.jumping) {
        player.vy = -20;
        player.jumping = true;
        jumpSound.play();
    }
});

// وظائف اللعبة
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
        touch-action: manipulation;
    `;

    // أحداث اللمس والنقر
    const startGameHandler = () => {
        if(isGameStarted) return;
        isGameStarted = true;
        button.remove();
        
        // تفعيل الصوت بعد التفاعل
        if(!isAudioContextResumed) {
            const resumeAudioContext = () => {
                if(typeof AudioContext !== "undefined" && audioContext.state === "suspended") {
                    audioContext.resume();
                }
                isAudioContextResumed = true;
            }
            resumeAudioContext();
            bgMusic.play().catch(e => console.log("Audio error:", e));
        }
        
        startGame();
    };

    button.addEventListener("click", startGameHandler);
    button.addEventListener("touchstart", (e) => {
        e.preventDefault();
        startGameHandler();
    });

    document.body.appendChild(button);
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

// باقي الوظائف (spawnFlower, spawnObstacle, update, draw, collision detection) تبقى كما هي بدون تغيير
// ...
// [ضع هنا نفس كود الوظائف الأخرى من الإصدار السابق بدون تعديل]

// التهيئة النهائية
window.addEventListener("resize", resizeCanvas);
resizeCanvas();
createStartButton();

// إنشاء سياق الصوت
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
