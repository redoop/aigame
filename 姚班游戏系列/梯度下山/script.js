// 游戏状态
const game = {
    canvas: null,
    ctx: null,
    width: 0,
    height: 0,
    position: { x: 0, y: 0 },
    velocity: { x: 0, y: 0 },
    path: [],
    iterations: 0,
    isRunning: false,
    terrain: 'convex',
    optimizer: 'gd',
    learningRate: 0.1,
    momentum: 0.9,
    currentLevel: 1
};

// 地形函数
const terrains = {
    convex: (x, y) => {
        // 简单的凸函数：抛物面
        return (x - 0.5) ** 2 + (y - 0.5) ** 2;
    },
    nonconvex: (x, y) => {
        // 非凸函数：多个局部最优
        return Math.sin(x * 10) * 0.3 + Math.sin(y * 10) * 0.3 + 
               (x - 0.5) ** 2 + (y - 0.5) ** 2;
    },
    saddle: (x, y) => {
        // 鞍点函数
        return (x - 0.5) ** 2 - (y - 0.5) ** 2;
    },
    ravine: (x, y) => {
        // 峡谷函数
        return (x - 0.5) ** 2 * 10 + (y - 0.5) ** 2 * 0.1;
    }
};

// 计算梯度
function computeGradient(x, y, terrainFunc) {
    const h = 0.001;
    const dx = (terrainFunc(x + h, y) - terrainFunc(x - h, y)) / (2 * h);
    const dy = (terrainFunc(x, y + h) - terrainFunc(x, y - h)) / (2 * h);
    return { dx, dy };
}

// 优化器
const optimizers = {
    gd: (pos, grad, lr) => {
        return {
            x: pos.x - lr * grad.dx,
            y: pos.y - lr * grad.dy
        };
    },
    momentum: (pos, grad, lr, velocity, momentum) => {
        velocity.x = momentum * velocity.x - lr * grad.dx;
        velocity.y = momentum * velocity.y - lr * grad.dy;
        return {
            x: pos.x + velocity.x,
            y: pos.y + velocity.y
        };
    },
    adam: (pos, grad, lr) => {
        // 简化的Adam
        const beta1 = 0.9, beta2 = 0.999, eps = 1e-8;
        if (!game.m) game.m = { x: 0, y: 0 };
        if (!game.v) game.v = { x: 0, y: 0 };
        
        game.m.x = beta1 * game.m.x + (1 - beta1) * grad.dx;
        game.m.y = beta1 * game.m.y + (1 - beta1) * grad.dy;
        game.v.x = beta2 * game.v.x + (1 - beta2) * grad.dx ** 2;
        game.v.y = beta2 * game.v.y + (1 - beta2) * grad.dy ** 2;
        
        const mHatX = game.m.x / (1 - beta1 ** (game.iterations + 1));
        const mHatY = game.m.y / (1 - beta1 ** (game.iterations + 1));
        const vHatX = game.v.x / (1 - beta2 ** (game.iterations + 1));
        const vHatY = game.v.y / (1 - beta2 ** (game.iterations + 1));
        
        return {
            x: pos.x - lr * mHatX / (Math.sqrt(vHatX) + eps),
            y: pos.y - lr * mHatY / (Math.sqrt(vHatY) + eps)
        };
    },
    sgd: (pos, grad, lr) => {
        // 添加噪声的SGD
        const noise = 0.1;
        const noisyGradX = grad.dx + (Math.random() - 0.5) * noise;
        const noisyGradY = grad.dy + (Math.random() - 0.5) * noise;
        return {
            x: pos.x - lr * noisyGradX,
            y: pos.y - lr * noisyGradY
        };
    }
};

// 初始化
function init() {
    game.canvas = document.getElementById('terrainCanvas');
    game.ctx = game.canvas.getContext('2d');
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // 事件监听
    document.getElementById('startBtn').addEventListener('click', toggleOptimization);
    document.getElementById('stepBtn').addEventListener('click', step);
    document.getElementById('resetBtn').addEventListener('click', reset);
    document.getElementById('learningRate').addEventListener('input', updateLearningRate);
    document.getElementById('momentum').addEventListener('input', updateMomentum);
    document.getElementById('optimizer').addEventListener('change', updateOptimizer);
    document.getElementById('terrain').addEventListener('change', updateTerrain);
    
    // 关卡按钮
    document.querySelectorAll('.level-btn').forEach(btn => {
        btn.addEventListener('click', () => selectLevel(parseInt(btn.dataset.level)));
    });
    
    // 画布点击
    game.canvas.addEventListener('click', handleCanvasClick);
    
    reset();
    draw();
}

function resizeCanvas() {
    const container = game.canvas.parentElement;
    game.canvas.width = container.clientWidth - 40;
    game.canvas.height = 600;
    game.width = game.canvas.width;
    game.height = game.canvas.height;
    draw();
}

function handleCanvasClick(e) {
    const rect = game.canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / game.width;
    const y = (e.clientY - rect.top) / game.height;
    
    game.position = { x, y };
    game.path = [{ ...game.position }];
    game.iterations = 0;
    game.velocity = { x: 0, y: 0 };
    game.m = null;
    game.v = null;
    
    updateInfo();
    draw();
}

function toggleOptimization() {
    game.isRunning = !game.isRunning;
    const btn = document.getElementById('startBtn');
    btn.textContent = game.isRunning ? '暂停' : '开始优化';
    
    if (game.isRunning) {
        animate();
    }
}

function animate() {
    if (!game.isRunning) return;
    
    step();
    
    setTimeout(() => {
        if (game.isRunning) {
            requestAnimationFrame(animate);
        }
    }, 50);
}

function step() {
    const terrainFunc = terrains[game.terrain];
    const grad = computeGradient(game.position.x, game.position.y, terrainFunc);
    
    let newPos;
    if (game.optimizer === 'momentum') {
        newPos = optimizers[game.optimizer](game.position, grad, game.learningRate, game.velocity, game.momentum);
    } else {
        newPos = optimizers[game.optimizer](game.position, grad, game.learningRate);
    }
    
    // 边界检查
    newPos.x = Math.max(0, Math.min(1, newPos.x));
    newPos.y = Math.max(0, Math.min(1, newPos.y));
    
    game.position = newPos;
    game.path.push({ ...game.position });
    game.iterations++;
    
    updateInfo();
    draw();
    
    // 检查收敛
    const gradMag = Math.sqrt(grad.dx ** 2 + grad.dy ** 2);
    if (gradMag < 0.001) {
        game.isRunning = false;
        document.getElementById('startBtn').textContent = '开始优化';
        alert(`收敛！迭代次数: ${game.iterations}, 最终损失: ${terrainFunc(game.position.x, game.position.y).toFixed(6)}`);
    }
}

function reset() {
    game.isRunning = false;
    game.position = { x: Math.random(), y: Math.random() };
    game.velocity = { x: 0, y: 0 };
    game.path = [{ ...game.position }];
    game.iterations = 0;
    game.m = null;
    game.v = null;
    
    document.getElementById('startBtn').textContent = '开始优化';
    updateInfo();
    draw();
}

function updateLearningRate(e) {
    game.learningRate = parseFloat(e.target.value);
    document.getElementById('lrValue').textContent = game.learningRate.toFixed(2);
}

function updateMomentum(e) {
    game.momentum = parseFloat(e.target.value);
    document.getElementById('momentumValue').textContent = game.momentum.toFixed(2);
}

function updateOptimizer(e) {
    game.optimizer = e.target.value;
    reset();
}

function updateTerrain(e) {
    game.terrain = e.target.value;
    reset();
}

function selectLevel(level) {
    game.currentLevel = level;
    
    document.querySelectorAll('.level-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    const configs = {
        1: { terrain: 'convex', lr: 0.1, optimizer: 'gd' },
        2: { terrain: 'nonconvex', lr: 0.05, optimizer: 'momentum' },
        3: { terrain: 'saddle', lr: 0.1, optimizer: 'momentum' },
        4: { terrain: 'ravine', lr: 0.05, optimizer: 'adam' }
    };
    
    const config = configs[level];
    game.terrain = config.terrain;
    game.learningRate = config.lr;
    game.optimizer = config.optimizer;
    
    document.getElementById('terrain').value = config.terrain;
    document.getElementById('learningRate').value = config.lr;
    document.getElementById('optimizer').value = config.optimizer;
    document.getElementById('lrValue').textContent = config.lr.toFixed(2);
    
    reset();
}

function updateInfo() {
    const terrainFunc = terrains[game.terrain];
    const loss = terrainFunc(game.position.x, game.position.y);
    const grad = computeGradient(game.position.x, game.position.y, terrainFunc);
    
    document.getElementById('position').textContent = 
        `(${game.position.x.toFixed(3)}, ${game.position.y.toFixed(3)})`;
    document.getElementById('loss').textContent = loss.toFixed(6);
    document.getElementById('gradient').textContent = 
        `(${grad.dx.toFixed(3)}, ${grad.dy.toFixed(3)})`;
    document.getElementById('iterations').textContent = game.iterations;
}

function draw() {
    const ctx = game.ctx;
    const w = game.width;
    const h = game.height;
    
    // 清空画布
    ctx.clearRect(0, 0, w, h);
    
    // 绘制地形热力图
    const terrainFunc = terrains[game.terrain];
    const resolution = 100;
    const cellW = w / resolution;
    const cellH = h / resolution;
    
    let minZ = Infinity, maxZ = -Infinity;
    const values = [];
    
    for (let i = 0; i < resolution; i++) {
        values[i] = [];
        for (let j = 0; j < resolution; j++) {
            const x = i / resolution;
            const y = j / resolution;
            const z = terrainFunc(x, y);
            values[i][j] = z;
            minZ = Math.min(minZ, z);
            maxZ = Math.max(maxZ, z);
        }
    }
    
    for (let i = 0; i < resolution; i++) {
        for (let j = 0; j < resolution; j++) {
            const z = values[i][j];
            const normalized = (z - minZ) / (maxZ - minZ);
            const hue = 240 - normalized * 240; // 蓝到红
            ctx.fillStyle = `hsl(${hue}, 70%, 50%)`;
            ctx.fillRect(i * cellW, j * cellH, cellW, cellH);
        }
    }
    
    // 绘制等高线
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    const contours = 10;
    for (let c = 0; c < contours; c++) {
        const level = minZ + (maxZ - minZ) * c / contours;
        ctx.beginPath();
        for (let i = 0; i < resolution - 1; i++) {
            for (let j = 0; j < resolution - 1; j++) {
                if ((values[i][j] <= level && values[i+1][j] > level) ||
                    (values[i][j] > level && values[i+1][j] <= level)) {
                    ctx.moveTo(i * cellW, j * cellH);
                    ctx.lineTo((i+1) * cellW, j * cellH);
                }
            }
        }
        ctx.stroke();
    }
    
    // 绘制路径
    if (game.path.length > 1) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(game.path[0].x * w, game.path[0].y * h);
        for (let i = 1; i < game.path.length; i++) {
            ctx.lineTo(game.path[i].x * w, game.path[i].y * h);
        }
        ctx.stroke();
        
        // 绘制路径点
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        for (let i = 0; i < game.path.length; i++) {
            ctx.beginPath();
            ctx.arc(game.path[i].x * w, game.path[i].y * h, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    // 绘制当前位置
    ctx.fillStyle = '#ffff00';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(game.position.x * w, game.position.y * h, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    // 绘制梯度箭头
    const grad = computeGradient(game.position.x, game.position.y, terrainFunc);
    const arrowLen = 50;
    const gradMag = Math.sqrt(grad.dx ** 2 + grad.dy ** 2);
    if (gradMag > 0.001) {
        const arrowX = game.position.x * w - (grad.dx / gradMag) * arrowLen;
        const arrowY = game.position.y * h - (grad.dy / gradMag) * arrowLen;
        
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(game.position.x * w, game.position.y * h);
        ctx.lineTo(arrowX, arrowY);
        ctx.stroke();
        
        // 箭头头部
        const angle = Math.atan2(-(grad.dy / gradMag), -(grad.dx / gradMag));
        ctx.fillStyle = '#00ff00';
        ctx.beginPath();
        ctx.moveTo(arrowX, arrowY);
        ctx.lineTo(arrowX - 10 * Math.cos(angle - Math.PI/6), 
                   arrowY - 10 * Math.sin(angle - Math.PI/6));
        ctx.lineTo(arrowX - 10 * Math.cos(angle + Math.PI/6), 
                   arrowY - 10 * Math.sin(angle + Math.PI/6));
        ctx.closePath();
        ctx.fill();
    }
}

// 启动游戏
window.addEventListener('load', init);
