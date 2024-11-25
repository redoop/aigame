const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let player = {
    x: 50,
    y: 50,
    width: 50,
    height: 50,
    color: 'blue',
    speed: 10,
    shape: 'humanoid',
    bullets: []
};

let enemies = [];
const enemyCount = 80;

const shootSound = new Audio('shoot.mp3');
const hitSound = new Audio('hit.mp3');
const explosionSound = new Audio('explosion.mp3');

function createEnemies() {
    for (let i = 0; i < enemyCount; i++) {
        enemies.push({
            x: Math.random() * (canvas.width - 50),
            y: Math.random() * (canvas.height - 50),
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

function drawBullets() {
    player.bullets.forEach(bullet => {
        ctx.fillStyle = 'yellow';
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });
}

function updateBullets() {
    player.bullets.forEach((bullet, index) => {
        bullet.x += bullet.speedX;
        bullet.y += bullet.speedY;
        if (bullet.x < 0 || bullet.x > canvas.width || bullet.y < 0 || bullet.y > canvas.height) {
            player.bullets.splice(index, 1);
        }
    });
}

function checkBulletCollision() {
    player.bullets.forEach((bullet, bulletIndex) => {
        enemies.forEach((enemy, enemyIndex) => {
            if (enemy.isAlive && bullet.x < enemy.x + enemy.width &&
                bullet.x + bullet.width > enemy.x &&
                bullet.y < enemy.y + enemy.height &&
                bullet.y + bullet.height > enemy.y) {
                enemy.isAlive = false;
                player.bullets.splice(bulletIndex, 1);
                explosionSound.play();
                hitSound.play();
                createExplosion(enemy.x, enemy.y);
                chainDamage(enemy.x, enemy.y);
            }
        });
    });
}

function createExplosion(x, y) {
    ctx.fillStyle = 'orange';
    ctx.beginPath();
    ctx.arc(x + 25, y + 25, 30, 0, Math.PI * 2);
    ctx.fill();
    createEnemyBullets(x + 25, y + 25);
}

function createEnemyBullets(x, y) {
    const directions = [
        { speedX: 0, speedY: -7 },  // 上
        { speedX: 7, speedY: 0 },   // 右
        { speedX: -7, speedY: 0 },  // 左
        { speedX: 0, speedY: 7 },   // 下
        { speedX: 5, speedY: -5 },  // 右上
        { speedX: 5, speedY: 5 },   // 右下
        { speedX: -5, speedY: -5 }, // 左上
        { speedX: -5, speedY: 5 }   // 左下
    ];

    directions.forEach(direction => {
        player.bullets.push({
            x: x,
            y: y,
            width: 5,
            height: 10,
            speedX: direction.speedX,
            speedY: direction.speedY
        });
    });
}

function chainDamage(x, y) {
    enemies.forEach((enemy, enemyIndex) => {
        if (enemy.isAlive && Math.abs(enemy.x - x) < 50 && Math.abs(enemy.y - y) < 50) {
            enemy.isAlive = false;
            explosionSound.play();
        }
    });
}

function drawPlayer() {
    ctx.fillStyle = player.color;

    // 头
    ctx.beginPath();
    ctx.arc(player.x + 25, player.y + 10, 10, 0, Math.PI * 2); // 头部
    ctx.fill();

    // 身体
    ctx.fillRect(player.x + 10, player.y + 20, 30, 30); // 身体

    // 手
    ctx.fillRect(player.x, player.y + 20, 10, 5); // 左手
    ctx.fillRect(player.x + 40, player.y + 20, 10, 5); // 右手

    // 脚
    ctx.fillRect(player.x + 10, player.y + 50, 5, 10); // 左脚
    ctx.fillRect(player.x + 35, player.y + 50, 5, 10); // 右脚
}

function checkWinCondition() {
    if (player.x >= canvas.width - player.width && player.y >= canvas.height - player.height) {
        alert('恭喜你通关！');
        resetGame();
    }
}

function resetGame() {
    player.x = 50;
    player.y = 50;
    player.bullets = [];
    enemies = [];
    createEnemies();
}

function update() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // 清空画布
    drawPlayer();
    drawEnemies();
    drawBullets();
    updateBullets();
    checkBulletCollision();
    checkWinCondition();
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
            shootBullet();
            break;
    }
}

function shootBullet() {
    player.bullets.push({
        x: player.x + player.width / 2 - 2.5,
        y: player.y,
        width: 5,
        height: 10,
        speedX: 0,
        speedY: -7
    });
    player.bullets.push({
        x: player.x + player.width / 2 - 2.5,
        y: player.y,
        width: 5,
        height: 10,
        speedX: 7,
        speedY: 0
    });
    player.bullets.push({
        x: player.x + player.width / 2 - 2.5,
        y: player.y,
        width: 5,
        height: 10,
        speedX: -7,
        speedY: 0
    });
    player.bullets.push({
        x: player.x + player.width / 2 - 2.5,
        y: player.y,
        width: 5,
        height: 10,
        speedX: 0,
        speedY: 7
    });
    shootSound.play();
}

document.addEventListener('keydown', movePlayer);
createEnemies();
update(); 