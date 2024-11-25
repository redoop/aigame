const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let player = {
    x: 50,
    y: 400,
    width: 50,
    height: 50,
    color: 'blue',
    speed: 5,
    bullets: [],
    isAttacking: false
};

let enemies = [];
const enemyCount = 5;
const enemySpeed = 2;

const shootSound = new Audio('shoot.mp3');
const hitSound = new Audio('hit.mp3');
const explosionSound = new Audio('explosion.mp3');

function createEnemies() {
    for (let i = 0; i < enemyCount; i++) {
        enemies.push({
            x: Math.random() * (canvas.width - 50),
            y: Math.random() * (canvas.height - 200),
            width: 50,
            height: 50,
            color: 'red',
            isAlive: true
        });
    }
}

function drawEnemies() {
    enemies.forEach(enemy => {
        if (enemy.isAlive) {
            ctx.fillStyle = enemy.color;
            ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
        }
    });
}

function drawPlayer() {
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.width, player.height); // 绘制玩家
    if (player.isAttacking) {
        ctx.fillStyle = 'yellow'; // 攻击时的颜色
        ctx.fillRect(player.x + player.width, player.y + 10, 20, 30); // 攻击范围
    }
}

function updateEnemies() {
    enemies.forEach(enemy => {
        if (enemy.isAlive) {
            // 简单的敌人移动逻辑
            if (enemy.x < player.x) {
                enemy.x += enemySpeed;
            } else {
                enemy.x -= enemySpeed;
            }
        }
    });
}

function checkCollision() {
    enemies.forEach((enemy, enemyIndex) => {
        if (enemy.isAlive && player.x < enemy.x + enemy.width &&
            player.x + player.width > enemy.x &&
            player.y < enemy.y + enemy.height &&
            player.y + player.height > enemy.y) {
            // 玩家与敌人碰撞
            alert('游戏结束！');
            resetGame();
        }
    });
}

function update() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // 清空画布
    drawPlayer();
    drawEnemies();
    updateEnemies();
    checkCollision();
    requestAnimationFrame(update);
}

function movePlayer(event) {
    switch(event.key) {
        case 'ArrowUp':
            player.y -= player.speed;
            break;
        case 'ArrowDown':
            player.y += player.speed;
            break;
        case 'ArrowLeft':
            player.x -= player.speed;
            break;
        case 'ArrowRight':
            player.x += player.speed;
            break;
        case ' ':
            player.isAttacking = true; // 开始攻击
            setTimeout(() => player.isAttacking = false, 200); // 攻击持续时间
            break;
    }
}

function resetGame() {
    player.x = 50;
    player.y = 400;
    player.bullets = [];
    enemies = [];
    createEnemies();
}

document.addEventListener('keydown', movePlayer);
createEnemies();
update(); 