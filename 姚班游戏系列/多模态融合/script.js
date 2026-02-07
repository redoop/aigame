// 游戏状态
const game = {
    task: 'classification',
    method: 'early',
    weights: { vision: 0.33, text: 0.33, audio: 0.34 },
    modalities: {
        vision: null,
        text: '',
        audio: null
    },
    features: {
        vision: [],
        text: [],
        audio: []
    }
};

// 预定义数据
const shapes = {
    cat: { color: '#ff9800', features: [0.8, 0.6, 0.3, 0.9, 0.5, 0.7, 0.4, 0.8] },
    dog: { color: '#795548', features: [0.7, 0.8, 0.5, 0.6, 0.9, 0.4, 0.7, 0.6] },
    car: { color: '#f44336', features: [0.3, 0.4, 0.9, 0.8, 0.2, 0.6, 0.8, 0.5] },
    tree: { color: '#4caf50', features: [0.5, 0.3, 0.2, 0.4, 0.7, 0.9, 0.6, 0.8] }
};

const textEmbeddings = {
    '猫': [0.9, 0.7, 0.2, 0.8, 0.4, 0.6, 0.3, 0.9],
    '狗': [0.8, 0.9, 0.4, 0.5, 0.8, 0.3, 0.6, 0.7],
    '车': [0.2, 0.3, 0.9, 0.9, 0.1, 0.5, 0.9, 0.4],
    '树': [0.4, 0.2, 0.1, 0.3, 0.8, 0.9, 0.5, 0.9]
};

const audioPatterns = {
    meow: [0.9, 0.8, 0.3, 0.7, 0.5, 0.6, 0.4, 0.8],
    bark: [0.7, 0.9, 0.6, 0.4, 0.9, 0.3, 0.7, 0.5],
    horn: [0.3, 0.2, 0.9, 0.8, 0.2, 0.4, 0.9, 0.6],
    wind: [0.5, 0.4, 0.2, 0.3, 0.6, 0.9, 0.7, 0.8]
};

const visionCanvas = document.getElementById('visionCanvas');
const visionCtx = visionCanvas.getContext('2d');
const audioCanvas = document.getElementById('audioCanvas');
const audioCtx = audioCanvas.getContext('2d');
const fusionCanvas = document.getElementById('fusionCanvas');
const fusionCtx = fusionCanvas.getContext('2d');

// 初始化
function init() {
    // 任务按钮
    document.querySelectorAll('.task-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.task-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            game.task = btn.dataset.task;
        });
    });
    
    // 融合方法
    document.getElementById('methodSelect').addEventListener('change', (e) => {
        game.method = e.target.value;
    });
    
    // 权重滑块
    ['vision', 'text', 'audio'].forEach(modality => {
        const slider = document.getElementById(`${modality}Slider`);
        slider.addEventListener('input', (e) => {
            game.weights[modality] = parseFloat(e.target.value);
            document.getElementById(`${modality}Weight`).textContent = e.target.value;
        });
    });
    
    // 归一化按钮
    document.getElementById('normalizeBtn').addEventListener('click', normalizeWeights);
    
    // 绘制按钮
    document.querySelectorAll('.draw-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.draw-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            drawShape(btn.dataset.shape);
        });
    });
    
    // 文本预设
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.getElementById('textInput').value = btn.dataset.text;
            game.modalities.text = btn.dataset.text;
        });
    });
    
    // 文本输入
    document.getElementById('textInput').addEventListener('input', (e) => {
        game.modalities.text = e.target.value;
    });
    
    // 音频按钮
    document.querySelectorAll('.audio-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.audio-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            playSound(btn.dataset.sound);
        });
    });
    
    // 示例按钮
    document.querySelectorAll('.example-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            loadExample(btn.dataset.example);
        });
    });
    
    // 融合按钮
    document.getElementById('fuseBtn').addEventListener('click', executeFusion);
    
    // 初始绘制
    drawShape('cat');
}

function drawShape(shape) {
    game.modalities.vision = shape;
    const data = shapes[shape];
    
    visionCtx.clearRect(0, 0, visionCanvas.width, visionCanvas.height);
    
    // 绘制简单图形
    visionCtx.fillStyle = data.color;
    
    if (shape === 'cat') {
        // 猫头
        visionCtx.beginPath();
        visionCtx.arc(150, 120, 60, 0, Math.PI * 2);
        visionCtx.fill();
        // 耳朵
        visionCtx.beginPath();
        visionCtx.moveTo(110, 80);
        visionCtx.lineTo(100, 50);
        visionCtx.lineTo(130, 70);
        visionCtx.fill();
        visionCtx.beginPath();
        visionCtx.moveTo(190, 80);
        visionCtx.lineTo(200, 50);
        visionCtx.lineTo(170, 70);
        visionCtx.fill();
        // 眼睛
        visionCtx.fillStyle = 'white';
        visionCtx.beginPath();
        visionCtx.arc(130, 110, 10, 0, Math.PI * 2);
        visionCtx.arc(170, 110, 10, 0, Math.PI * 2);
        visionCtx.fill();
        visionCtx.fillStyle = 'black';
        visionCtx.beginPath();
        visionCtx.arc(130, 110, 5, 0, Math.PI * 2);
        visionCtx.arc(170, 110, 5, 0, Math.PI * 2);
        visionCtx.fill();
    } else if (shape === 'dog') {
        // 狗头
        visionCtx.beginPath();
        visionCtx.arc(150, 130, 60, 0, Math.PI * 2);
        visionCtx.fill();
        // 耳朵
        visionCtx.beginPath();
        visionCtx.ellipse(110, 100, 20, 40, -0.3, 0, Math.PI * 2);
        visionCtx.ellipse(190, 100, 20, 40, 0.3, 0, Math.PI * 2);
        visionCtx.fill();
        // 眼睛
        visionCtx.fillStyle = 'white';
        visionCtx.beginPath();
        visionCtx.arc(130, 120, 10, 0, Math.PI * 2);
        visionCtx.arc(170, 120, 10, 0, Math.PI * 2);
        visionCtx.fill();
        visionCtx.fillStyle = 'black';
        visionCtx.beginPath();
        visionCtx.arc(130, 120, 5, 0, Math.PI * 2);
        visionCtx.arc(170, 120, 5, 0, Math.PI * 2);
        visionCtx.fill();
    } else if (shape === 'car') {
        // 车身
        visionCtx.fillRect(80, 140, 140, 60);
        // 车顶
        visionCtx.fillRect(110, 100, 80, 40);
        // 轮子
        visionCtx.fillStyle = '#333';
        visionCtx.beginPath();
        visionCtx.arc(110, 200, 20, 0, Math.PI * 2);
        visionCtx.arc(190, 200, 20, 0, Math.PI * 2);
        visionCtx.fill();
    } else if (shape === 'tree') {
        // 树干
        visionCtx.fillStyle = '#795548';
        visionCtx.fillRect(130, 150, 40, 100);
        // 树冠
        visionCtx.fillStyle = data.color;
        visionCtx.beginPath();
        visionCtx.arc(150, 120, 70, 0, Math.PI * 2);
        visionCtx.fill();
    }
    
    game.features.vision = data.features;
    updateFeatureViz('vision', data.features);
}

function playSound(sound) {
    game.modalities.audio = sound;
    const pattern = audioPatterns[sound];
    
    audioCtx.clearRect(0, 0, audioCanvas.width, audioCanvas.height);
    
    // 绘制波形
    audioCtx.strokeStyle = '#667eea';
    audioCtx.lineWidth = 2;
    audioCtx.beginPath();
    
    const width = audioCanvas.width;
    const height = audioCanvas.height;
    const step = width / 100;
    
    for (let i = 0; i < 100; i++) {
        const x = i * step;
        let y = height / 2;
        
        if (sound === 'meow') {
            y += Math.sin(i * 0.3) * 30 * Math.exp(-i * 0.02);
        } else if (sound === 'bark') {
            y += (Math.random() - 0.5) * 40 * (i < 30 ? 1 : Math.exp(-(i - 30) * 0.05));
        } else if (sound === 'horn') {
            y += Math.sin(i * 0.5) * 35;
        } else if (sound === 'wind') {
            y += Math.sin(i * 0.1) * 20 + Math.sin(i * 0.3) * 10;
        }
        
        if (i === 0) {
            audioCtx.moveTo(x, y);
        } else {
            audioCtx.lineTo(x, y);
        }
    }
    
    audioCtx.stroke();
    
    game.features.audio = pattern;
    updateFeatureViz('audio', pattern);
}

function updateFeatureViz(modality, features) {
    const container = document.getElementById(`${modality}Features`);
    container.innerHTML = '';
    
    features.forEach(value => {
        const bar = document.createElement('div');
        bar.className = 'feature-bar';
        bar.style.height = (value * 50) + 'px';
        container.appendChild(bar);
    });
}

function loadExample(example) {
    const examples = {
        cat: { shape: 'cat', text: '一只可爱的橙色猫咪', sound: 'meow' },
        dog: { shape: 'dog', text: '一只棕色的狗狗', sound: 'bark' },
        car: { shape: 'car', text: '一辆红色的跑车', sound: 'horn' },
        nature: { shape: 'tree', text: '一棵绿色的大树', sound: 'wind' }
    };
    
    const ex = examples[example];
    
    // 设置视觉
    document.querySelectorAll('.draw-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.shape === ex.shape);
    });
    drawShape(ex.shape);
    
    // 设置文本
    document.getElementById('textInput').value = ex.text;
    game.modalities.text = ex.text;
    
    // 提取文本特征
    let textFeatures = [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5];
    for (const [key, embedding] of Object.entries(textEmbeddings)) {
        if (ex.text.includes(key)) {
            textFeatures = embedding;
            break;
        }
    }
    game.features.text = textFeatures;
    updateFeatureViz('text', textFeatures);
    
    // 设置音频
    document.querySelectorAll('.audio-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.sound === ex.sound);
    });
    playSound(ex.sound);
}

function normalizeWeights() {
    const sum = game.weights.vision + game.weights.text + game.weights.audio;
    if (sum === 0) return;
    
    game.weights.vision /= sum;
    game.weights.text /= sum;
    game.weights.audio /= sum;
    
    document.getElementById('visionSlider').value = game.weights.vision.toFixed(2);
    document.getElementById('textSlider').value = game.weights.text.toFixed(2);
    document.getElementById('audioSlider').value = game.weights.audio.toFixed(2);
    
    document.getElementById('visionWeight').textContent = game.weights.vision.toFixed(2);
    document.getElementById('textWeight').textContent = game.weights.text.toFixed(2);
    document.getElementById('audioWeight').textContent = game.weights.audio.toFixed(2);
}

function executeFusion() {
    if (!game.modalities.vision || !game.modalities.text || !game.modalities.audio) {
        alert('请先选择所有模态的输入！');
        return;
    }
    
    // 更新融合方法显示
    const methodNames = {
        early: '早期融合：直接拼接特征向量',
        late: '晚期融合：加权平均各模态预测',
        attention: '注意力融合：动态计算模态权重',
        transformer: 'Transformer融合：自注意力建模交互'
    };
    
    document.querySelector('.method-content').textContent = methodNames[game.method];
    
    // 执行融合
    const fusedFeatures = fuseFeatures();
    drawFusionFeatures(fusedFeatures);
    
    // 生成结果
    const result = generateResult(fusedFeatures);
    displayResult(result);
    
    // 评估质量
    evaluateQuality();
}

function fuseFeatures() {
    const { vision, text, audio } = game.features;
    const { method } = game;
    
    if (method === 'early') {
        // 早期融合：拼接
        return [...vision, ...text, ...audio];
    } else if (method === 'late') {
        // 晚期融合：加权平均
        const fused = [];
        for (let i = 0; i < 8; i++) {
            fused.push(
                vision[i] * game.weights.vision +
                text[i] * game.weights.text +
                audio[i] * game.weights.audio
            );
        }
        return fused;
    } else if (method === 'attention') {
        // 注意力融合：自适应权重
        const consistency = calculateConsistency();
        const adaptiveWeights = {
            vision: consistency.vision * game.weights.vision,
            text: consistency.text * game.weights.text,
            audio: consistency.audio * game.weights.audio
        };
        const sum = adaptiveWeights.vision + adaptiveWeights.text + adaptiveWeights.audio;
        
        const fused = [];
        for (let i = 0; i < 8; i++) {
            fused.push(
                (vision[i] * adaptiveWeights.vision +
                text[i] * adaptiveWeights.text +
                audio[i] * adaptiveWeights.audio) / sum
            );
        }
        return fused;
    } else {
        // Transformer融合：交叉注意力
        const fused = [];
        for (let i = 0; i < 8; i++) {
            const crossAttn = (vision[i] + text[i] + audio[i]) / 3;
            fused.push(crossAttn);
        }
        return fused;
    }
}

function drawFusionFeatures(features) {
    const width = fusionCanvas.width;
    const height = fusionCanvas.height;
    
    fusionCtx.clearRect(0, 0, width, height);
    
    const barWidth = width / features.length;
    
    features.forEach((value, i) => {
        const barHeight = value * (height - 20);
        const x = i * barWidth;
        const y = height - barHeight - 10;
        
        const gradient = fusionCtx.createLinearGradient(x, y + barHeight, x, y);
        gradient.addColorStop(0, '#667eea');
        gradient.addColorStop(1, '#764ba2');
        
        fusionCtx.fillStyle = gradient;
        fusionCtx.fillRect(x + 2, y, barWidth - 4, barHeight);
    });
}

function generateResult(features) {
    const categories = {
        cat: { name: '猫', emoji: '🐱', threshold: [0.7, 0.6, 0.3] },
        dog: { name: '狗', emoji: '🐕', threshold: [0.6, 0.7, 0.4] },
        car: { name: '汽车', emoji: '🚗', threshold: [0.3, 0.4, 0.8] },
        tree: { name: '树', emoji: '🌲', threshold: [0.4, 0.3, 0.2] }
    };
    
    const scores = {};
    
    for (const [key, cat] of Object.entries(categories)) {
        let score = 0;
        for (let i = 0; i < 3; i++) {
            score += Math.abs(features[i] - cat.threshold[i]);
        }
        scores[key] = Math.max(0, 1 - score / 3);
    }
    
    return scores;
}

function displayResult(scores) {
    const resultDisplay = document.getElementById('resultDisplay');
    const confidenceBars = document.getElementById('confidenceBars');
    
    // 找到最高分
    let maxScore = 0;
    let maxCategory = '';
    
    for (const [key, score] of Object.entries(scores)) {
        if (score > maxScore) {
            maxScore = score;
            maxCategory = key;
        }
    }
    
    const categories = {
        cat: { name: '猫', emoji: '🐱' },
        dog: { name: '狗', emoji: '🐕' },
        car: { name: '汽车', emoji: '🚗' },
        tree: { name: '树', emoji: '🌲' }
    };
    
    const winner = categories[maxCategory];
    
    resultDisplay.innerHTML = `
        <div class="result-content">
            <div style="font-size: 3em; text-align: center; margin-bottom: 15px;">${winner.emoji}</div>
            <div style="text-align: center; font-size: 1.3em; font-weight: 600; color: #667eea;">
                识别结果：${winner.name}
            </div>
            <div style="text-align: center; margin-top: 10px; color: #666;">
                置信度：${(maxScore * 100).toFixed(1)}%
            </div>
        </div>
    `;
    
    // 显示所有类别的置信度
    confidenceBars.innerHTML = '';
    
    for (const [key, score] of Object.entries(scores)) {
        const cat = categories[key];
        const item = document.createElement('div');
        item.className = 'confidence-item';
        item.innerHTML = `
            <div class="confidence-label">${cat.emoji} ${cat.name}</div>
            <div class="confidence-bar">
                <div class="confidence-fill" style="width: ${score * 100}%">
                    ${(score * 100).toFixed(0)}%
                </div>
            </div>
        `;
        confidenceBars.appendChild(item);
    }
}

function calculateConsistency() {
    const { vision, text, audio } = game.features;
    
    const visionTextSim = cosineSimilarity(vision, text);
    const visionAudioSim = cosineSimilarity(vision, audio);
    const textAudioSim = cosineSimilarity(text, audio);
    
    return {
        vision: (visionTextSim + visionAudioSim) / 2,
        text: (visionTextSim + textAudioSim) / 2,
        audio: (visionAudioSim + textAudioSim) / 2
    };
}

function cosineSimilarity(a, b) {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
        dotProduct += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

function evaluateQuality() {
    const consistency = calculateConsistency();
    const avgConsistency = (consistency.vision + consistency.text + consistency.audio) / 3;
    
    // 模态一致性
    document.getElementById('consistency').style.width = (avgConsistency * 100) + '%';
    
    // 特征互补性
    const complementarity = 1 - avgConsistency * 0.5; // 不完全一致反而有互补性
    document.getElementById('complementarity').style.width = (complementarity * 100) + '%';
    
    // 融合效果
    const effectiveness = (avgConsistency * 0.6 + complementarity * 0.4);
    document.getElementById('effectiveness').style.width = (effectiveness * 100) + '%';
}

// 启动游戏
window.addEventListener('load', init);
