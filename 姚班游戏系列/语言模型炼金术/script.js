// 游戏状态
const game = {
    lossCanvas: null,
    lossCtx: null,
    isTraining: false,
    steps: 0,
    lossHistory: [],
    config: {
        layers: 6,
        dModel: 512,
        heads: 8,
        vocab: 10000,
        batchSize: 32,
        learningRate: 0.0001,
        maxSteps: 1000
    },
    model: null
};

// 预设配置
const presets = {
    tiny: { layers: 4, dModel: 256, heads: 4, vocab: 5000 },
    small: { layers: 6, dModel: 512, heads: 8, vocab: 10000 },
    base: { layers: 12, dModel: 768, heads: 12, vocab: 30000 },
    large: { layers: 24, dModel: 1024, heads: 16, vocab: 50000 }
};

// 数据集信息
const datasets = {
    wiki: { name: '维基百科', tokens: 10000000, desc: '高质量的中文维基百科文本' },
    news: { name: '新闻语料', tokens: 5000000, desc: '新闻文章和报道' },
    code: { name: '代码数据', tokens: 3000000, desc: '开源代码仓库' },
    dialogue: { name: '对话数据', tokens: 2000000, desc: '人类对话记录' }
};

// 初始化
function init() {
    game.lossCanvas = document.getElementById('lossCanvas');
    game.lossCtx = game.lossCanvas.getContext('2d');
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // 模型配置监听
    ['layers', 'dModel', 'heads', 'vocab'].forEach(id => {
        document.getElementById(id).addEventListener('input', updateModelConfig);
    });
    
    // 训练配置监听
    ['batchSize', 'learningRate', 'maxSteps'].forEach(id => {
        document.getElementById(id).addEventListener('input', updateTrainingConfig);
    });
    
    // 按钮事件
    document.getElementById('trainBtn').addEventListener('click', startTraining);
    document.getElementById('stopBtn').addEventListener('click', stopTraining);
    document.getElementById('saveBtn').addEventListener('click', saveModel);
    document.getElementById('generateBtn').addEventListener('click', generateText);
    
    // 数据集选择
    document.getElementById('dataset').addEventListener('change', updateDataset);
    
    // 生成参数
    document.getElementById('temperature').addEventListener('input', e => {
        document.getElementById('tempValue').textContent = e.target.value;
    });
    document.getElementById('maxLength').addEventListener('input', e => {
        document.getElementById('maxLenValue').textContent = e.target.value;
    });
    
    // 预设按钮
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', () => loadPreset(btn.dataset.preset));
    });
    
    updateModelConfig();
    updateDataset();
}

function resizeCanvas() {
    const container = game.lossCanvas.parentElement;
    game.lossCanvas.width = container.clientWidth - 40;
    game.lossCanvas.height = 250;
    drawLossHistory();
}

function updateModelConfig() {
    game.config.layers = parseInt(document.getElementById('layers').value);
    game.config.dModel = parseInt(document.getElementById('dModel').value);
    game.config.heads = parseInt(document.getElementById('heads').value);
    game.config.vocab = parseInt(document.getElementById('vocab').value);
    
    calculateParams();
}

function updateTrainingConfig() {
    game.config.batchSize = parseInt(document.getElementById('batchSize').value);
    game.config.learningRate = parseFloat(document.getElementById('learningRate').value);
    game.config.maxSteps = parseInt(document.getElementById('maxSteps').value);
}

function calculateParams() {
    const { layers, dModel, heads, vocab } = game.config;
    
    // 简化的参数计算
    const embeddingParams = vocab * dModel;
    const attentionParams = layers * (4 * dModel * dModel); // Q, K, V, O
    const ffnParams = layers * (8 * dModel * dModel); // 2层FFN，中间层4倍
    const totalParams = embeddingParams + attentionParams + ffnParams;
    
    // 显存估算 (FP16)
    const memoryGB = (totalParams * 2) / (1024 * 1024 * 1024);
    
    document.getElementById('params').textContent = 
        totalParams >= 1000000 ? (totalParams / 1000000).toFixed(0) + 'M' : (totalParams / 1000).toFixed(0) + 'K';
    document.getElementById('memory').textContent = memoryGB.toFixed(2) + 'GB';
}

function updateDataset() {
    const dataset = document.getElementById('dataset').value;
    const info = datasets[dataset];
    document.getElementById('datasetDesc').textContent = info.desc;
}

function loadPreset(preset) {
    const config = presets[preset];
    document.getElementById('layers').value = config.layers;
    document.getElementById('dModel').value = config.dModel;
    document.getElementById('heads').value = config.heads;
    document.getElementById('vocab').value = config.vocab;
    updateModelConfig();
}

async function startTraining() {
    if (game.isTraining) return;
    
    game.isTraining = true;
    game.steps = 0;
    game.lossHistory = [];
    
    document.getElementById('trainBtn').disabled = true;
    document.getElementById('stopBtn').disabled = false;
    
    const maxSteps = game.config.maxSteps;
    const baseLR = game.config.learningRate;
    const scheduler = document.getElementById('scheduler').value;
    
    // 训练循环
    for (let step = 0; step < maxSteps && game.isTraining; step++) {
        // 计算当前学习率
        let currentLR = baseLR;
        if (scheduler === 'cosine') {
            currentLR = baseLR * 0.5 * (1 + Math.cos(Math.PI * step / maxSteps));
        } else if (scheduler === 'linear') {
            currentLR = baseLR * (1 - step / maxSteps);
        }
        
        // 模拟训练损失（实际应该是真实的训练过程）
        const progress = step / maxSteps;
        const baseLoss = 8.0; // 初始损失
        const finalLoss = 2.5; // 最终损失
        const noise = (Math.random() - 0.5) * 0.3;
        const loss = baseLoss - (baseLoss - finalLoss) * Math.pow(progress, 0.7) + noise;
        
        game.lossHistory.push(loss);
        game.steps = step + 1;
        
        // 计算困惑度 PPL = exp(loss)
        const perplexity = Math.exp(loss);
        
        // 更新UI
        document.getElementById('trainLoss').textContent = loss.toFixed(4);
        document.getElementById('perplexity').textContent = perplexity.toFixed(2);
        document.getElementById('steps').textContent = game.steps;
        document.getElementById('currentLR').textContent = currentLR.toExponential(2);
        
        drawLossHistory();
        
        // 每10步更新一次
        if (step % 10 === 0) {
            await new Promise(resolve => setTimeout(resolve, 10));
        }
    }
    
    game.isTraining = false;
    document.getElementById('trainBtn').disabled = false;
    document.getElementById('stopBtn').disabled = true;
    
    if (game.steps >= maxSteps) {
        alert(`训练完成！\n最终损失: ${game.lossHistory[game.lossHistory.length - 1].toFixed(4)}\n困惑度: ${Math.exp(game.lossHistory[game.lossHistory.length - 1]).toFixed(2)}`);
    }
}

function stopTraining() {
    game.isTraining = false;
    document.getElementById('trainBtn').disabled = false;
    document.getElementById('stopBtn').disabled = true;
}

function saveModel() {
    if (game.steps === 0) {
        alert('请先训练模型！');
        return;
    }
    
    const modelInfo = {
        config: game.config,
        steps: game.steps,
        finalLoss: game.lossHistory[game.lossHistory.length - 1]
    };
    
    alert(`模型已保存！\n\n配置:\n- 层数: ${game.config.layers}\n- 维度: ${game.config.dModel}\n- 训练步数: ${game.steps}\n- 最终损失: ${modelInfo.finalLoss.toFixed(4)}`);
}

function generateText() {
    if (game.steps === 0) {
        alert('请先训练模型！');
        return;
    }
    
    const prompt = document.getElementById('promptInput').value;
    const temperature = parseFloat(document.getElementById('temperature').value);
    const maxLength = parseInt(document.getElementById('maxLength').value);
    
    // 模拟文本生成（实际应该是真实的生成过程）
    const sampleTexts = [
        '是一种强大的技术，它能够理解和生成人类语言。通过深度学习和大规模数据训练，现代语言模型展现出了惊人的能力。',
        '正在改变我们的世界。从自动翻译到智能对话，从代码生成到内容创作，AI技术的应用越来越广泛。',
        '的发展离不开算法、数据和算力的共同进步。Transformer架构的提出是一个重要的里程碑。',
        '需要大量的计算资源和高质量的训练数据。预训练和微调是目前主流的训练范式。'
    ];
    
    const randomText = sampleTexts[Math.floor(Math.random() * sampleTexts.length)];
    const generated = prompt + randomText.substring(0, maxLength);
    
    document.getElementById('generatedText').textContent = generated;
}

function drawLossHistory() {
    const ctx = game.lossCtx;
    const w = game.lossCanvas.width;
    const h = game.lossCanvas.height;
    
    ctx.clearRect(0, 0, w, h);
    
    if (game.lossHistory.length < 2) return;
    
    const maxLoss = Math.max(...game.lossHistory);
    const minLoss = Math.min(...game.lossHistory);
    const range = maxLoss - minLoss || 1;
    
    const xStep = w / Math.max(game.lossHistory.length, game.config.maxSteps);
    
    // 绘制网格
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
        const y = h - (i / 5) * (h - 40) - 20;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
        
        // 标签
        ctx.fillStyle = '#666';
        ctx.font = '10px Arial';
        ctx.textAlign = 'right';
        const value = minLoss + (range * i / 5);
        ctx.fillText(value.toFixed(2), w - 5, y - 3);
    }
    
    // 绘制损失曲线
    ctx.strokeStyle = '#f56565';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    game.lossHistory.forEach((loss, i) => {
        const x = i * xStep;
        const y = h - 20 - ((loss - minLoss) / range) * (h - 40);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });
    
    ctx.stroke();
    
    // 标题
    ctx.fillStyle = '#333';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Training Loss', 10, 15);
}

// 启动游戏
window.addEventListener('load', init);
