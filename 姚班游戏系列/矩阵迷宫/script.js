// 游戏状态
const game = {
    originalCanvas: null,
    transformedCanvas: null,
    originalCtx: null,
    transformedCtx: null,
    vector: { x: 2, y: 1 },
    matrix: [[1, 0], [0, 1]],
    target: { x: 3, y: 2 },
    currentLevel: 1,
    gridSize: 1,
    scale: 40
};

// 关卡配置
const levels = [
    {
        name: "旋转变换",
        objective: "将向量旋转90度",
        vector: { x: 2, y: 0 },
        target: { x: 0, y: 2 },
        hint: "使用旋转90°预设"
    },
    {
        name: "缩放变换",
        objective: "将向量放大2倍",
        vector: { x: 1, y: 1 },
        target: { x: 2, y: 2 },
        hint: "使用缩放2x预设"
    },
    {
        name: "反射变换",
        objective: "将向量关于y轴反射",
        vector: { x: 2, y: 1 },
        target: { x: -2, y: 1 },
        hint: "使用反射预设"
    },
    {
        name: "组合变换",
        objective: "先旋转再缩放",
        vector: { x: 1, y: 0 },
        target: { x: 0, y: 3 },
        hint: "需要组合多个变换"
    },
    {
        name: "剪切变换",
        objective: "使用剪切变换",
        vector: { x: 1, y: 1 },
        target: { x: 2, y: 1 },
        hint: "使用剪切预设"
    },
    {
        name: "投影变换",
        objective: "投影到x轴",
        vector: { x: 2, y: 2 },
        target: { x: 2, y: 0 },
        hint: "使用投影预设"
    }
];

// 预设变换
const transforms = {
    identity: [[1, 0], [0, 1]],
    rotate90: [[0, -1], [1, 0]],
    scale: [[2, 0], [0, 2]],
    shear: [[1, 1], [0, 1]],
    reflect: [[-1, 0], [0, 1]],
    projection: [[1, 0], [0, 0]]
};

// 初始化
function init() {
    game.originalCanvas = document.getElementById('originalCanvas');
    game.transformedCanvas = document.getElementById('transformedCanvas');
    game.originalCtx = game.originalCanvas.getContext('2d');
    game.transformedCtx = game.transformedCanvas.getContext('2d');
    
    resizeCanvases();
    window.addEventListener('resize', resizeCanvases);
    
    // 矩阵输入监听
    ['m00', 'm01', 'm10', 'm11'].forEach(id => {
        document.getElementById(id).addEventListener('input', updateMatrix);
    });
    
    // 向量控制
    document.getElementById('vectorX').addEventListener('input', updateVectorX);
    document.getElementById('vectorY').addEventListener('input', updateVectorY);
    
    // 按钮
    document.getElementById('applyBtn').addEventListener('click', applyTransform);
    document.getElementById('resetBtn').addEventListener('click', reset);
    document.getElementById('nextLevelBtn').addEventListener('click', nextLevel);
    
    // 预设变换按钮
    document.querySelectorAll('.transform-btn').forEach(btn => {
        btn.addEventListener('click', () => applyPreset(btn.dataset.transform));
    });
    
    // 画布点击
    game.originalCanvas.addEventListener('click', handleCanvasClick);
    
    loadLevel(1);
    draw();
}

function resizeCanvases() {
    [game.originalCanvas, game.transformedCanvas].forEach(canvas => {
        const container = canvas.parentElement;
        canvas.width = container.clientWidth - 30;
        canvas.height = 400;
    });
    draw();
}

function loadLevel(level) {
    game.currentLevel = level;
    const config = levels[level - 1];
    
    game.vector = { ...config.vector };
    game.target = { ...config.target };
    game.matrix = [[1, 0], [0, 1]];
    
    document.getElementById('currentLevel').textContent = level;
    document.getElementById('objective').textContent = 
        `关卡 ${level}: ${config.objective} - ${config.hint}`;
    
    updateMatrixInputs();
    updateVectorSliders();
    updateInfo();
    draw();
}

function updateMatrix() {
    game.matrix[0][0] = parseFloat(document.getElementById('m00').value) || 0;
    game.matrix[0][1] = parseFloat(document.getElementById('m01').value) || 0;
    game.matrix[1][0] = parseFloat(document.getElementById('m10').value) || 0;
    game.matrix[1][1] = parseFloat(document.getElementById('m11').value) || 0;
    
    updateInfo();
    draw();
}

function updateMatrixInputs() {
    document.getElementById('m00').value = game.matrix[0][0];
    document.getElementById('m01').value = game.matrix[0][1];
    document.getElementById('m10').value = game.matrix[1][0];
    document.getElementById('m11').value = game.matrix[1][1];
}

function updateVectorX(e) {
    game.vector.x = parseFloat(e.target.value);
    document.getElementById('xValue').textContent = game.vector.x.toFixed(1);
    updateInfo();
    draw();
}

function updateVectorY(e) {
    game.vector.y = parseFloat(e.target.value);
    document.getElementById('yValue').textContent = game.vector.y.toFixed(1);
    updateInfo();
    draw();
}

function updateVectorSliders() {
    document.getElementById('vectorX').value = game.vector.x;
    document.getElementById('vectorY').value = game.vector.y;
    document.getElementById('xValue').textContent = game.vector.x.toFixed(1);
    document.getElementById('yValue').textContent = game.vector.y.toFixed(1);
}

function applyPreset(name) {
    game.matrix = transforms[name].map(row => [...row]);
    updateMatrixInputs();
    updateInfo();
    draw();
}

function applyTransform() {
    const transformed = matrixVectorMultiply(game.matrix, game.vector);
    game.vector = transformed;
    updateVectorSliders();
    checkWin();
}

function matrixVectorMultiply(matrix, vector) {
    return {
        x: matrix[0][0] * vector.x + matrix[0][1] * vector.y,
        y: matrix[1][0] * vector.x + matrix[1][1] * vector.y
    };
}

function determinant(matrix) {
    return matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];
}

function checkWin() {
    const transformed = matrixVectorMultiply(game.matrix, game.vector);
    const distance = Math.sqrt(
        (transformed.x - game.target.x) ** 2 + 
        (transformed.y - game.target.y) ** 2
    );
    
    const progress = Math.max(0, Math.min(100, (1 - distance / 5) * 100));
    document.getElementById('progressBar').style.width = progress + '%';
    
    if (distance < 0.3) {
        setTimeout(() => {
            alert(`恭喜通关！\n关卡 ${game.currentLevel} 完成！`);
            if (game.currentLevel < levels.length) {
                document.getElementById('nextLevelBtn').disabled = false;
            }
        }, 100);
    }
}

function nextLevel() {
    if (game.currentLevel < levels.length) {
        loadLevel(game.currentLevel + 1);
        document.getElementById('nextLevelBtn').disabled = true;
    } else {
        alert('恭喜完成所有关卡！');
    }
}

function reset() {
    loadLevel(game.currentLevel);
}

function handleCanvasClick(e) {
    const rect = game.originalCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = game.originalCanvas.width / 2;
    const centerY = game.originalCanvas.height / 2;
    
    game.vector.x = (x - centerX) / game.scale;
    game.vector.y = -(y - centerY) / game.scale;
    
    updateVectorSliders();
    updateInfo();
    draw();
}

function updateInfo() {
    document.getElementById('vectorPos').textContent = 
        `(${game.vector.x.toFixed(2)}, ${game.vector.y.toFixed(2)})`;
    
    const transformed = matrixVectorMultiply(game.matrix, game.vector);
    document.getElementById('transformedPos').textContent = 
        `(${transformed.x.toFixed(2)}, ${transformed.y.toFixed(2)})`;
    
    const det = determinant(game.matrix);
    document.getElementById('determinant').textContent = det.toFixed(2);
}

function draw() {
    drawSpace(game.originalCtx, game.originalCanvas, false);
    drawSpace(game.transformedCtx, game.transformedCanvas, true);
}

function drawSpace(ctx, canvas, transformed) {
    const w = canvas.width;
    const h = canvas.height;
    const centerX = w / 2;
    const centerY = h / 2;
    
    ctx.clearRect(0, 0, w, h);
    
    // 背景
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, w, h);
    
    // 绘制网格
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    
    for (let i = -10; i <= 10; i++) {
        for (let j = -10; j <= 10; j++) {
            let p1 = { x: i, y: j };
            let p2 = { x: i + 1, y: j };
            let p3 = { x: i, y: j + 1 };
            
            if (transformed) {
                p1 = matrixVectorMultiply(game.matrix, p1);
                p2 = matrixVectorMultiply(game.matrix, p2);
                p3 = matrixVectorMultiply(game.matrix, p3);
            }
            
            ctx.beginPath();
            ctx.moveTo(centerX + p1.x * game.scale, centerY - p1.y * game.scale);
            ctx.lineTo(centerX + p2.x * game.scale, centerY - p2.y * game.scale);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(centerX + p1.x * game.scale, centerY - p1.y * game.scale);
            ctx.lineTo(centerX + p3.x * game.scale, centerY - p3.y * game.scale);
            ctx.stroke();
        }
    }
    
    // 绘制坐标轴
    ctx.strokeStyle = '#999';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(w, centerY);
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, h);
    ctx.stroke();
    
    // 绘制基向量
    let i = { x: 1, y: 0 };
    let j = { x: 0, y: 1 };
    
    if (transformed) {
        i = matrixVectorMultiply(game.matrix, i);
        j = matrixVectorMultiply(game.matrix, j);
    }
    
    // x基向量（红色）
    drawArrow(ctx, centerX, centerY, 
              centerX + i.x * game.scale, centerY - i.y * game.scale, 
              '#ff6b6b', 3);
    
    // y基向量（绿色）
    drawArrow(ctx, centerX, centerY, 
              centerX + j.x * game.scale, centerY - j.y * game.scale, 
              '#51cf66', 3);
    
    // 绘制向量
    let vec = { ...game.vector };
    if (transformed) {
        vec = matrixVectorMultiply(game.matrix, vec);
    }
    
    drawArrow(ctx, centerX, centerY, 
              centerX + vec.x * game.scale, centerY - vec.y * game.scale, 
              '#667eea', 4);
    
    // 绘制目标（仅在变换后空间）
    if (transformed) {
        ctx.strokeStyle = '#48bb78';
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.arc(centerX + game.target.x * game.scale, 
                centerY - game.target.y * game.scale, 
                15, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
    }
}

function drawArrow(ctx, x1, y1, x2, y2, color, width) {
    const headlen = 10;
    const angle = Math.atan2(y2 - y1, x2 - x1);
    
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = width;
    
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - headlen * Math.cos(angle - Math.PI / 6), 
               y2 - headlen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(x2 - headlen * Math.cos(angle + Math.PI / 6), 
               y2 - headlen * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
}

// 启动游戏
window.addEventListener('load', init);
