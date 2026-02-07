// 游戏状态
const game = {
    canvas: null,
    ctx: null,
    currentLevel: 1,
    hypotheses: [],
    priors: [],
    posteriors: [],
    collectedEvidence: [],
    correctAnswer: null
};

// 关卡配置
const levels = [
    {
        name: "医疗诊断",
        scenario: "一位患者接受了某种罕见疾病的检测。这种疾病在人群中的患病率为1%。检测的准确率为95%（真阳性率95%，假阳性率5%）。如果检测结果为阳性，患者真的患病的概率是多少？",
        hypotheses: [
            { name: "患病", prior: 0.01 },
            { name: "健康", prior: 0.99 }
        ],
        evidence: [
            {
                name: "检测阳性",
                likelihoods: [0.95, 0.05],
                description: "检测结果显示阳性"
            },
            {
                name: "有症状",
                likelihoods: [0.80, 0.10],
                description: "患者出现相关症状"
            },
            {
                name: "家族史",
                likelihoods: [0.30, 0.05],
                description: "家族中有患病史"
            }
        ],
        correctAnswer: 0,
        threshold: 0.15
    },
    {
        name: "垃圾邮件过滤",
        scenario: "你正在开发一个垃圾邮件过滤器。已知30%的邮件是垃圾邮件。现在收到一封包含特定关键词的邮件，需要判断它是否为垃圾邮件。",
        hypotheses: [
            { name: "垃圾邮件", prior: 0.30 },
            { name: "正常邮件", prior: 0.70 }
        ],
        evidence: [
            {
                name: "包含'免费'",
                likelihoods: [0.80, 0.10],
                description: "邮件中包含'免费'关键词"
            },
            {
                name: "包含'中奖'",
                likelihoods: [0.70, 0.05],
                description: "邮件中包含'中奖'关键词"
            },
            {
                name: "陌生发件人",
                likelihoods: [0.90, 0.30],
                description: "发件人不在联系人列表中"
            },
            {
                name: "多个链接",
                likelihoods: [0.85, 0.20],
                description: "邮件包含多个外部链接"
            }
        ],
        correctAnswer: 0,
        threshold: 0.80
    },
    {
        name: "犯罪推理",
        scenario: "一起盗窃案发生了。现场有三名嫌疑人：张三、李四、王五。根据初步调查，他们的嫌疑程度相当。现在需要通过收集证据来确定真凶。",
        hypotheses: [
            { name: "张三", prior: 0.33 },
            { name: "李四", prior: 0.33 },
            { name: "王五", prior: 0.34 }
        ],
        evidence: [
            {
                name: "指纹匹配",
                likelihoods: [0.95, 0.10, 0.05],
                description: "现场指纹与张三高度匹配"
            },
            {
                name: "目击证词",
                likelihoods: [0.20, 0.70, 0.10],
                description: "有人看到李四在案发时间附近"
            },
            {
                name: "作案动机",
                likelihoods: [0.60, 0.30, 0.80],
                description: "王五有强烈的作案动机"
            },
            {
                name: "不在场证明",
                likelihoods: [0.30, 0.20, 0.90],
                description: "王五声称有不在场证明"
            }
        ],
        correctAnswer: 0,
        threshold: 0.70
    },
    {
        name: "天气预测",
        scenario: "明天的天气会怎样？根据历史数据，这个季节晴天占60%，雨天占30%，阴天占10%。现在需要根据气象指标来预测明天的天气。",
        hypotheses: [
            { name: "晴天", prior: 0.60 },
            { name: "雨天", prior: 0.30 },
            { name: "阴天", prior: 0.10 }
        ],
        evidence: [
            {
                name: "气压下降",
                likelihoods: [0.20, 0.80, 0.50],
                description: "气压显著下降"
            },
            {
                name: "湿度增加",
                likelihoods: [0.30, 0.90, 0.60],
                description: "空气湿度明显增加"
            },
            {
                name: "云层增厚",
                likelihoods: [0.10, 0.70, 0.85],
                description: "云层逐渐增厚"
            },
            {
                name: "风速加大",
                likelihoods: [0.40, 0.75, 0.55],
                description: "风速明显加大"
            }
        ],
        correctAnswer: 1,
        threshold: 0.60
    }
];

// 初始化
function init() {
    game.canvas = document.getElementById('probCanvas');
    game.ctx = game.canvas.getContext('2d');
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // 按钮事件
    document.getElementById('submitBtn').addEventListener('click', submitAnswer);
    document.getElementById('resetBtn').addEventListener('click', reset);
    
    // 关卡按钮
    document.querySelectorAll('.level-btn').forEach(btn => {
        btn.addEventListener('click', () => loadLevel(parseInt(btn.dataset.level)));
    });
    
    loadLevel(1);
}

function resizeCanvas() {
    const container = game.canvas.parentElement;
    game.canvas.width = container.clientWidth - 40;
    game.canvas.height = 300;
    drawProbabilities();
}

function loadLevel(level) {
    game.currentLevel = level;
    const config = levels[level - 1];
    
    game.hypotheses = config.hypotheses.map(h => h.name);
    game.priors = config.hypotheses.map(h => h.prior);
    game.posteriors = [...game.priors];
    game.collectedEvidence = [];
    game.correctAnswer = config.correctAnswer;
    
    // 更新UI
    document.querySelectorAll('.level-btn').forEach(btn => {
        btn.classList.remove('active');
        if (parseInt(btn.dataset.level) === level) {
            btn.classList.add('active');
        }
    });
    
    document.getElementById('scenario').textContent = config.scenario;
    
    // 显示假设
    const hypothesisList = document.getElementById('hypothesisList');
    hypothesisList.innerHTML = '';
    game.hypotheses.forEach((h, i) => {
        const div = document.createElement('div');
        div.className = 'hypothesis-item';
        div.innerHTML = `
            <div class="hypothesis-name">${h}</div>
            <div class="hypothesis-prob">先验: ${(game.priors[i] * 100).toFixed(1)}%</div>
            <div class="prob-bar">
                <div class="prob-fill" style="width: ${game.posteriors[i] * 100}%"></div>
            </div>
        `;
        hypothesisList.appendChild(div);
    });
    
    // 显示证据按钮
    const evidenceButtons = document.getElementById('evidenceButtons');
    evidenceButtons.innerHTML = '';
    config.evidence.forEach((e, i) => {
        const btn = document.createElement('button');
        btn.className = 'evidence-btn';
        btn.textContent = `${e.name} - ${e.description}`;
        btn.onclick = () => collectEvidence(i);
        evidenceButtons.appendChild(btn);
    });
    
    updateStats();
    drawProbabilities();
    
    document.getElementById('evidenceList').innerHTML = '';
    document.getElementById('calcDisplay').innerHTML = '<p>选择证据后显示计算过程</p>';
}

function collectEvidence(index) {
    const config = levels[game.currentLevel - 1];
    const evidence = config.evidence[index];
    
    if (game.collectedEvidence.includes(index)) return;
    
    game.collectedEvidence.push(index);
    
    // 贝叶斯更新
    const likelihoods = evidence.likelihoods;
    const newPosteriors = [];
    let sum = 0;
    
    for (let i = 0; i < game.hypotheses.length; i++) {
        const unnormalized = likelihoods[i] * game.posteriors[i];
        newPosteriors.push(unnormalized);
        sum += unnormalized;
    }
    
    // 归一化
    for (let i = 0; i < newPosteriors.length; i++) {
        newPosteriors[i] /= sum;
    }
    
    // 显示计算过程
    showCalculation(evidence, likelihoods, newPosteriors);
    
    game.posteriors = newPosteriors;
    
    // 更新UI
    updateHypotheses();
    updateStats();
    drawProbabilities();
    
    // 标记证据已收集
    const buttons = document.querySelectorAll('.evidence-btn');
    buttons[index].classList.add('collected');
    buttons[index].disabled = true;
    
    // 添加证据标签
    const tag = document.createElement('div');
    tag.className = 'evidence-tag';
    tag.textContent = evidence.name;
    document.getElementById('evidenceList').appendChild(tag);
}

function showCalculation(evidence, likelihoods, newPosteriors) {
    const calcDisplay = document.getElementById('calcDisplay');
    let html = `<div class="calc-step"><strong>证据: ${evidence.name}</strong></div>`;
    
    game.hypotheses.forEach((h, i) => {
        html += `<div class="calc-step">`;
        html += `P(${h}|E) ∝ P(E|${h}) × P(${h})<br>`;
        html += `= ${likelihoods[i].toFixed(2)} × ${game.posteriors[i].toFixed(3)}<br>`;
        html += `= ${(likelihoods[i] * game.posteriors[i]).toFixed(4)}<br>`;
        html += `归一化后: ${newPosteriors[i].toFixed(4)} (${(newPosteriors[i] * 100).toFixed(1)}%)`;
        html += `</div>`;
    });
    
    calcDisplay.innerHTML = html;
}

function updateHypotheses() {
    const items = document.querySelectorAll('.hypothesis-item');
    items.forEach((item, i) => {
        const probDiv = item.querySelector('.hypothesis-prob');
        probDiv.textContent = `后验: ${(game.posteriors[i] * 100).toFixed(1)}%`;
        
        const fill = item.querySelector('.prob-fill');
        fill.style.width = `${game.posteriors[i] * 100}%`;
    });
}

function updateStats() {
    document.getElementById('evidenceCount').textContent = game.collectedEvidence.length;
    
    const maxIndex = game.posteriors.indexOf(Math.max(...game.posteriors));
    document.getElementById('mostLikely').textContent = game.hypotheses[maxIndex];
    document.getElementById('confidence').textContent = 
        `${(game.posteriors[maxIndex] * 100).toFixed(1)}%`;
}

function drawProbabilities() {
    const ctx = game.ctx;
    const w = game.canvas.width;
    const h = game.canvas.height;
    
    ctx.clearRect(0, 0, w, h);
    
    if (game.hypotheses.length === 0) return;
    
    const barWidth = w / game.hypotheses.length * 0.8;
    const spacing = w / game.hypotheses.length;
    const maxHeight = h - 60;
    
    game.hypotheses.forEach((h, i) => {
        const x = spacing * i + spacing * 0.1;
        
        // 先验概率（浅色）
        const priorHeight = game.priors[i] * maxHeight;
        ctx.fillStyle = 'rgba(102, 126, 234, 0.3)';
        ctx.fillRect(x, h - 40 - priorHeight, barWidth, priorHeight);
        
        // 后验概率（深色）
        const posteriorHeight = game.posteriors[i] * maxHeight;
        ctx.fillStyle = '#48bb78';
        ctx.fillRect(x, h - 40 - posteriorHeight, barWidth, posteriorHeight);
        
        // 标签
        ctx.fillStyle = '#333';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(h, x + barWidth / 2, h - 25);
        ctx.fillText(`${(game.posteriors[i] * 100).toFixed(1)}%`, 
                     x + barWidth / 2, h - 10);
    });
}

function submitAnswer() {
    const maxIndex = game.posteriors.indexOf(Math.max(...game.posteriors));
    const config = levels[game.currentLevel - 1];
    
    if (game.posteriors[maxIndex] < config.threshold) {
        alert('置信度不够！请收集更多证据。');
        return;
    }
    
    if (maxIndex === game.correctAnswer) {
        alert(`正确！${game.hypotheses[maxIndex]} 的概率最高：${(game.posteriors[maxIndex] * 100).toFixed(1)}%`);
        
        // 标记关卡完成
        const levelBtn = document.querySelector(`[data-level="${game.currentLevel}"]`);
        levelBtn.classList.add('completed');
        
        if (game.currentLevel < levels.length) {
            setTimeout(() => {
                if (confirm('进入下一关？')) {
                    loadLevel(game.currentLevel + 1);
                }
            }, 500);
        } else {
            setTimeout(() => {
                alert('恭喜完成所有关卡！你已掌握贝叶斯推理的精髓！');
            }, 500);
        }
    } else {
        alert(`不对！正确答案是：${game.hypotheses[game.correctAnswer]}\n你需要收集更多关键证据。`);
    }
}

function reset() {
    loadLevel(game.currentLevel);
}

// 启动游戏
window.addEventListener('load', init);
