const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const dialog = document.getElementById('dialog');
const dialogText = document.getElementById('dialogText');
const dialogBtn = document.getElementById('dialogBtn');
const victory = document.getElementById('victory');
const restartBtn = document.getElementById('restartBtn');

// 音频上下文
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

// 音效函数
function playSound(type) {
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    switch(type) {
        case 'move':
            oscillator.frequency.value = 200;
            gainNode.gain.value = 0.05;
            oscillator.start();
            oscillator.stop(audioCtx.currentTime + 0.05);
            break;
        case 'meet':
            oscillator.frequency.value = 400;
            gainNode.gain.value = 0.1;
            oscillator.start();
            oscillator.stop(audioCtx.currentTime + 0.1);
            break;
        case 'victory':
            [523, 659, 784, 1047].forEach((freq, i) => {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.frequency.value = freq;
                gain.gain.value = 0.15;
                osc.start(audioCtx.currentTime + i * 0.15);
                osc.stop(audioCtx.currentTime + i * 0.15 + 0.3);
            });
            break;
    }
}

// 游戏状态
let gameState = 'playing';
let lastMoveTime = 0;
const keys = {};

// 小蝌蚪
const tadpole = {
    x: 400,
    y: 500,
    size: 20,
    speed: 3,
    color: '#2c3e50',
    tailAngle: 0
};

// 动物们
const animals = [
    { x: 150, y: 150, type: 'duck', emoji: '🦆', name: '鸭妈妈', message: '我不是你妈妈，你妈妈有四条腿，会跳。', met: false },
    { x: 650, y: 200, type: 'fish', emoji: '🐟', name: '鱼妈妈', message: '我不是你妈妈，你妈妈能在陆地上生活。', met: false },
    { x: 200, y: 400, type: 'turtle', emoji: '🐢', name: '乌龟', message: '我不是你妈妈，你妈妈没有壳，是绿色的。', met: false },
    { x: 600, y: 450, type: 'frog', emoji: '🐸', name: '青蛙妈妈', message: '孩子，我就是你的妈妈！', met: false }
];

// 键盘控制
document.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
});

document.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
});

// 对话框控制
dialogBtn.addEventListener('click', () => {
    dialog.classList.add('hidden');
    gameState = 'playing';
});

restartBtn.addEventListener('click', () => {
    location.reload();
});

// 更新小蝌蚪位置
function updateTadpole() {
    if (gameState !== 'playing') return;

    const moving = keys['arrowup'] || keys['w'] || keys['arrowdown'] || keys['s'] || 
                   keys['arrowleft'] || keys['a'] || keys['arrowright'] || keys['d'];
    
    if (moving) {
        const now = Date.now();
        if (now - lastMoveTime > 200) {
            playSound('move');
            lastMoveTime = now;
        }
    }

    if (keys['arrowup'] || keys['w']) tadpole.y -= tadpole.speed;
    if (keys['arrowdown'] || keys['s']) tadpole.y += tadpole.speed;
    if (keys['arrowleft'] || keys['a']) tadpole.x -= tadpole.speed;
    if (keys['arrowright'] || keys['d']) tadpole.x += tadpole.speed;

    // 边界检测
    tadpole.x = Math.max(tadpole.size, Math.min(canvas.width - tadpole.size, tadpole.x));
    tadpole.y = Math.max(tadpole.size, Math.min(canvas.height - tadpole.size, tadpole.y));
}

// 检测碰撞
function checkCollision() {
    if (gameState !== 'playing') return;

    animals.forEach(animal => {
        const dist = Math.hypot(tadpole.x - animal.x, tadpole.y - animal.y);
        if (dist < 50 && !animal.met) {
            animal.met = true;
            gameState = 'dialog';
            showDialog(animal);
        }
    });
}

// 文字转语音
function speak(text) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = 1;
    utterance.pitch = 1.2;
    speechSynthesis.speak(utterance);
}

// 显示对话
function showDialog(animal) {
    playSound('meet');
    const message = `${animal.name}说：${animal.message}`;
    dialogText.textContent = message;
    speak(animal.message);
    dialog.classList.remove('hidden');
    
    if (animal.type === 'frog') {
        playSound('victory');
        setTimeout(() => {
            dialog.classList.add('hidden');
            victory.classList.remove('hidden');
            speak('找到妈妈了！');
        }, 2000);
    }
}

// 绘制小蝌蚪
function drawTadpole() {
    // 尾巴摆动
    tadpole.tailAngle += 0.15;
    const tailSwing = Math.sin(tadpole.tailAngle) * 15;
    
    ctx.fillStyle = tadpole.color;
    ctx.beginPath();
    ctx.arc(tadpole.x, tadpole.y, tadpole.size, 0, Math.PI * 2);
    ctx.fill();
    
    // 眼睛
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(tadpole.x - 6, tadpole.y - 5, 4, 0, Math.PI * 2);
    ctx.arc(tadpole.x + 6, tadpole.y - 5, 4, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(tadpole.x - 6, tadpole.y - 5, 2, 0, Math.PI * 2);
    ctx.arc(tadpole.x + 6, tadpole.y - 5, 2, 0, Math.PI * 2);
    ctx.fill();
    
    // 嘴巴
    ctx.strokeStyle = '#e74c3c';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(tadpole.x, tadpole.y + 4, 6, 0.3, Math.PI - 0.3);
    ctx.stroke();
    
    // 摆动的尾巴
    ctx.strokeStyle = tadpole.color;
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(tadpole.x - tadpole.size, tadpole.y);
    ctx.quadraticCurveTo(
        tadpole.x - tadpole.size - 15, 
        tadpole.y + tailSwing,
        tadpole.x - tadpole.size - 25, 
        tadpole.y + tailSwing * 1.5
    );
    ctx.stroke();
}

// 绘制动物
function drawAnimals() {
    ctx.font = '40px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    animals.forEach(animal => {
        if (!animal.met || animal.type !== 'frog') {
            ctx.fillText(animal.emoji, animal.x, animal.y);
            
            // 问号提示
            if (!animal.met) {
                ctx.font = '20px Arial';
                ctx.fillStyle = '#e74c3c';
                ctx.fillText('?', animal.x + 25, animal.y - 25);
                ctx.font = '40px Arial';
            }
        }
    });
}

// 绘制水草装饰
function drawDecoration() {
    ctx.fillStyle = 'rgba(76, 175, 80, 0.3)';
    for (let i = 0; i < 5; i++) {
        const x = i * 200 + 50;
        ctx.beginPath();
        ctx.ellipse(x, canvas.height - 30, 15, 40, 0, 0, Math.PI * 2);
        ctx.fill();
    }
}

// 游戏循环
function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    drawDecoration();
    drawAnimals();
    drawTadpole();
    
    updateTadpole();
    checkCollision();
    
    requestAnimationFrame(gameLoop);
}

gameLoop();
