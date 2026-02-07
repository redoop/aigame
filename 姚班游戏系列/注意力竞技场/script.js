// 游戏状态
const game = {
    attentionCanvas: null,
    queryCanvas: null,
    keyCanvas: null,
    valueCanvas: null,
    attentionCtx: null,
    queryCtx: null,
    keyCtx: null,
    valueCtx: null,
    tokens: [],
    embeddings: [],
    attentionWeights: [],
    selectedToken: 0,
    attentionType: 'self',
    heads: 1,
    temperature: 1.0,
    dimension: 64
};

// 初始化
function init() {
    game.attentionCanvas = document.getElementById('attentionCanvas');
    game.queryCanvas = document.getElementById('queryCanvas');
    game.keyCanvas = document.getElementById('keyCanvas');
    game.valueCanvas = document.getElementById('valueCanvas');
    
    game.attentionCtx = game.attentionCanvas.getContext('2d');
    game.queryCtx = game.queryCanvas.getContext('2d');
    game.keyCtx = game.keyCanvas.getContext('2d');
    game.valueCtx = game.valueCanvas.getContext('2d');
    
    resizeCanvases();
    window.addEventListener('resize', resizeCanvases);
    
    // 事件监听
    document.getElementById('updateBtn').addEventListener('click', updateSequence);
    document.getElementById('sequenceInput').addEventListener('keypress', e => {
        if (e.key === 'Enter') updateSequence();
    });
    
    document.getElementById('attentionType').addEventListener('change', e => {
        game.attentionType = e.target.value;
        computeAttention();
    });
    
    document.getElementById('heads').addEventListener('input', e => {
        game.heads = parseInt(e.target.value);
        document.getElementById('headsValue').textContent = game.heads;
        computeAttention();
    });
    
    document.getElementById('temperature').addEventListener('input', e => {
        game.temperature = parseFloat(e.target.value);
        document.getElementById('tempValue').textContent = game.temperature.toFixed(1);
        computeAttention();
    });
    
    document.getElementById('dimension').addEventListener('input', e => {
        game.dimension = parseInt(e.target.value);
        document.getElementById('dimValue').textContent = game.dimension;
        updateSequence();
    });
    
    // 示例按钮
    document.querySelectorAll('.example-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.getElementById('sequenceInput').value = btn.dataset.text;
            updateSequence();
        });
    });
    
    // 画布点击
    game.attentionCanvas.addEventListener('click', handleCanvasClick);
    
    // 初始化
    updateSequence();
}

function resizeCanvases() {
    const canvases = [
        { canvas: game.attentionCanvas, height: 400 },
        { canvas: game.queryCanvas, height: 150 },
        { canvas: game.keyCanvas, height: 150 },
        { canvas: game.valueCanvas, height: 150 }
    ];
    
    canvases.forEach(({ canvas, height }) => {
        const container = canvas.parentElement;
        canvas.width = container.clientWidth - 40;
        canvas.height = height;
    });
    
    drawAttentionMap();
    drawQKV();
}

function updateSequence() {
    const text = document.getElementById('sequenceInput').value.trim();
    game.tokens = text.split(/\s+/).filter(t => t.length > 0);
    
    if (game.tokens.length === 0) {
        game.tokens = ['我', '爱', 'AI'];
    }
    
    // 生成随机嵌入
    game.embeddings = game.tokens.map(() => {
        return Array(game.dimension).fill(0).map(() => Math.random() - 0.5);
    });
    
    // 更新token列表
    const tokenList = document.getElementById('tokenList');
    tokenList.innerHTML = '';
    game.tokens.forEach((token, i) => {
        const div = document.createElement('div');
        div.className = 'token-item' + (i === game.selectedToken ? ' selected' : '');
        div.textContent = token;
        div.onclick = () => selectToken(i);
        tokenList.appendChild(div);
    });
    
    // 更新统计
    document.getElementById('seqLen').textContent = game.tokens.length;
    const params = game.tokens.length * game.dimension * 3; // Q, K, V
    document.getElementById('params').textContent = params.toLocaleString();
    
    computeAttention();
}

function selectToken(index) {
    game.selectedToken = index;
    updateSequence();
}

function computeAttention() {
    const n = game.tokens.length;
    const d = game.dimension;
    
    // 简化的Q, K, V矩阵（实际应该是学习的权重矩阵）
    const Q = game.embeddings.map(e => e.slice());
    const K = game.embeddings.map(e => e.slice());
    const V = game.embeddings.map(e => e.slice());
    
    // 计算注意力权重: softmax(QK^T / sqrt(d_k))
    game.attentionWeights = [];
    
    for (let i = 0; i < n; i++) {
        const scores = [];
        for (let j = 0; j < n; j++) {
            // 点积
            let score = 0;
            for (let k = 0; k < d; k++) {
                score += Q[i][k] * K[j][k];
            }
            // 缩放
            score /= Math.sqrt(d);
            // 温度
            score /= game.temperature;
            
            // 掩码（如果是masked attention）
            if (game.attentionType === 'masked' && j > i) {
                score = -Infinity;
            }
            
            scores.push(score);
        }
        
        // Softmax
        const maxScore = Math.max(...scores.filter(s => s !== -Infinity));
        const expScores = scores.map(s => s === -Infinity ? 0 : Math.exp(s - maxScore));
        const sumExp = expScores.reduce((a, b) => a + b, 0);
        const weights = expScores.map(e => e / sumExp);
        
        game.attentionWeights.push(weights);
    }
    
    drawAttentionMap();
    drawQKV();
}

function drawAttentionMap() {
    const ctx = game.attentionCtx;
    const w = game.attentionCanvas.width;
    const h = game.attentionCanvas.height;
    
    ctx.clearRect(0, 0, w, h);
    
    if (game.tokens.length === 0) return;
    
    const n = game.tokens.length;
    const cellSize = Math.min((w - 100) / n, (h - 100) / n);
    const offsetX = (w - cellSize * n) / 2;
    const offsetY = (h - cellSize * n) / 2;
    
    // 绘制热力图
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            const weight = game.attentionWeights[i][j];
            const intensity = Math.floor(weight * 255);
            ctx.fillStyle = `rgb(${255 - intensity}, ${255 - intensity * 0.5}, 255)`;
            ctx.fillRect(
                offsetX + j * cellSize,
                offsetY + i * cellSize,
                cellSize - 1,
                cellSize - 1
            );
            
            // 显示权重值
            if (cellSize > 40) {
                ctx.fillStyle = weight > 0.5 ? 'white' : 'black';
                ctx.font = `${Math.min(cellSize / 3, 14)}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(
                    weight.toFixed(2),
                    offsetX + j * cellSize + cellSize / 2,
                    offsetY + i * cellSize + cellSize / 2
                );
            }
        }
    }
    
    // 绘制标签
    ctx.fillStyle = '#333';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    
    for (let i = 0; i < n; i++) {
        // 列标签（Key）
        ctx.fillText(
            game.tokens[i],
            offsetX + i * cellSize + cellSize / 2,
            offsetY - 10
        );
        
        // 行标签（Query）
        ctx.save();
        ctx.translate(offsetX - 10, offsetY + i * cellSize + cellSize / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText(game.tokens[i], 0, 0);
        ctx.restore();
    }
    
    // 标题
    ctx.font = 'bold 14px Arial';
    ctx.fillText('Key →', w / 2, 20);
    ctx.save();
    ctx.translate(20, h / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Query →', 0, 0);
    ctx.restore();
}

function drawQKV() {
    const canvases = [
        { ctx: game.queryCtx, canvas: game.queryCanvas, title: 'Q' },
        { ctx: game.keyCtx, canvas: game.keyCanvas, title: 'K' },
        { ctx: game.valueCtx, canvas: game.valueCanvas, title: 'V' }
    ];
    
    canvases.forEach(({ ctx, canvas, title }) => {
        const w = canvas.width;
        const h = canvas.height;
        
        ctx.clearRect(0, 0, w, h);
        
        if (game.tokens.length === 0) return;
        
        const n = game.tokens.length;
        const d = Math.min(game.dimension, 32); // 只显示前32维
        const cellW = (w - 60) / d;
        const cellH = (h - 40) / n;
        
        // 绘制矩阵
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < d; j++) {
                const value = game.embeddings[i][j];
                const intensity = Math.floor((value + 0.5) * 255);
                ctx.fillStyle = `rgb(${intensity}, ${intensity}, ${intensity})`;
                ctx.fillRect(
                    30 + j * cellW,
                    20 + i * cellH,
                    cellW - 1,
                    cellH - 1
                );
            }
            
            // 行标签
            ctx.fillStyle = '#333';
            ctx.font = '10px Arial';
            ctx.textAlign = 'right';
            ctx.fillText(game.tokens[i], 25, 20 + i * cellH + cellH / 2);
        }
    });
}

function handleCanvasClick(e) {
    const rect = game.attentionCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const n = game.tokens.length;
    const cellSize = Math.min((game.attentionCanvas.width - 100) / n, (game.attentionCanvas.height - 100) / n);
    const offsetX = (game.attentionCanvas.width - cellSize * n) / 2;
    const offsetY = (game.attentionCanvas.height - cellSize * n) / 2;
    
    const col = Math.floor((x - offsetX) / cellSize);
    const row = Math.floor((y - offsetY) / cellSize);
    
    if (row >= 0 && row < n && col >= 0 && col < n) {
        const weight = game.attentionWeights[row][col];
        document.getElementById('attentionInfo').textContent = 
            `"${game.tokens[row]}" 对 "${game.tokens[col]}" 的注意力权重: ${(weight * 100).toFixed(1)}%`;
    }
}

// 启动游戏
window.addEventListener('load', init);
