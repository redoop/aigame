// 游戏状态
const game = {
    env: 'grid',
    algo: 'qlearning',
    training: false,
    testing: false,
    episode: 0,
    totalReward: 0,
    rewardHistory: [],
    successCount: 0,
    qTable: {},
    policy: {},
    agent: { x: 0, y: 0 },
    params: {
        lr: 0.1,
        gamma: 0.9,
        epsilon: 0.3,
        speed: 3
    },
    rewards: {
        goal: 100,
        trap: -50,
        step: -1
    }
};

// 环境配置
const environments = {
    grid: {
        size: 8,
        start: { x: 0, y: 0 },
        goal: { x: 7, y: 7 },
        traps: [{ x: 3, y: 3 }, { x: 4, y: 4 }, { x: 5, y: 3 }],
        walls: []
    },
    cliff: {
        size: 8,
        start: { x: 0, y: 7 },
        goal: { x: 7, y: 7 },
        traps: [{ x: 1, y: 7 }, { x: 2, y: 7 }, { x: 3, y: 7 }, { x: 4, y: 7 }, { x: 5, y: 7 }, { x: 6, y: 7 }],
        walls: []
    },
    maze: {
        size: 8,
        start: { x: 0, y: 0 },
        goal: { x: 7, y: 7 },
        traps: [{ x: 5, y: 5 }],
        walls: [
            { x: 2, y: 0 }, { x: 2, y: 1 }, { x: 2, y: 2 },
            { x: 4, y: 2 }, { x: 4, y: 3 }, { x: 4, y: 4 },
            { x: 6, y: 4 }, { x: 6, y: 5 }, { x: 6, y: 6 }
        ]
    },
    rlhf: {
        size: 8,
        start: { x: 0, y: 0 },
        goal: { x: 7, y: 7 },
        traps: [{ x: 2, y: 2 }, { x: 5, y: 5 }],
        walls: [],
        feedback: true
    }
};

const actions = ['up', 'down', 'left', 'right'];
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const chartCanvas = document.getElementById('rewardChart');
const chartCtx = chartCanvas.getContext('2d');

// 初始化
function init() {
    // 环境按钮
    document.querySelectorAll('.env-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.env-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            game.env = btn.dataset.env;
            resetGame();
        });
    });
    
    // 算法选择
    document.getElementById('algoSelect').addEventListener('change', (e) => {
        game.algo = e.target.value;
        resetGame();
    });
    
    // 参数滑块
    document.getElementById('learningRate').addEventListener('input', (e) => {
        game.params.lr = parseFloat(e.target.value);
        document.getElementById('lrValue').textContent = e.target.value;
    });
    
    document.getElementById('gamma').addEventListener('input', (e) => {
        game.params.gamma = parseFloat(e.target.value);
        document.getElementById('gammaValue').textContent = e.target.value;
    });
    
    document.getElementById('epsilon').addEventListener('input', (e) => {
        game.params.epsilon = parseFloat(e.target.value);
        document.getElementById('epsilonValue').textContent = e.target.value;
    });
    
    document.getElementById('speed').addEventListener('input', (e) => {
        game.params.speed = parseInt(e.target.value);
        const speeds = ['很慢', '慢', '正常', '快', '很快'];
        document.getElementById('speedValue').textContent = speeds[e.target.value - 1];
    });
    
    // 奖励配置
    document.getElementById('goalReward').addEventListener('change', (e) => {
        game.rewards.goal = parseInt(e.target.value);
    });
    
    document.getElementById('trapPenalty').addEventListener('change', (e) => {
        game.rewards.trap = parseInt(e.target.value);
    });
    
    document.getElementById('stepPenalty').addEventListener('change', (e) => {
        game.rewards.step = parseInt(e.target.value);
    });
    
    // 控制按钮
    document.getElementById('startBtn').addEventListener('click', startTraining);
    document.getElementById('pauseBtn').addEventListener('click', pauseTraining);
    document.getElementById('resetBtn').addEventListener('click', resetGame);
    document.getElementById('testBtn').addEventListener('click', testAgent);
    
    resetGame();
    draw();
}

function resetGame() {
    game.training = false;
    game.testing = false;
    game.episode = 0;
    game.totalReward = 0;
    game.rewardHistory = [];
    game.successCount = 0;
    game.qTable = {};
    game.policy = {};
    
    const env = environments[game.env];
    game.agent = { ...env.start };
    
    updateStats();
    draw();
    drawChart();
    updatePolicy();
}

function startTraining() {
    if (game.training) return;
    game.training = true;
    trainLoop();
}

function pauseTraining() {
    game.training = false;
}

function testAgent() {
    if (game.training || game.testing) return;
    game.testing = true;
    testLoop();
}

async function trainLoop() {
    while (game.training) {
        await runEpisode(false);
        
        const delay = [200, 100, 50, 20, 5][game.params.speed - 1];
        await new Promise(resolve => setTimeout(resolve, delay));
    }
}

async function testLoop() {
    game.params.epsilon = 0; // 纯利用，不探索
    await runEpisode(true);
    game.testing = false;
}

async function runEpisode(visualize) {
    const env = environments[game.env];
    game.agent = { ...env.start };
    
    let episodeReward = 0;
    let steps = 0;
    const maxSteps = 100;
    let prevState = null;
    let prevAction = null;
    
    while (steps < maxSteps) {
        const state = stateKey(game.agent);
        const action = chooseAction(state);
        const nextPos = getNextPosition(game.agent, action);
        const reward = getReward(nextPos);
        
        episodeReward += reward;
        
        // 更新Q值
        if (game.algo === 'qlearning') {
            updateQTableQLearning(state, action, reward, stateKey(nextPos));
        } else if (game.algo === 'sarsa') {
            if (prevState !== null) {
                updateQTableSARSA(prevState, prevAction, reward, state, action);
            }
            prevState = state;
            prevAction = action;
        }
        
        game.agent = nextPos;
        steps++;
        
        if (visualize) {
            draw();
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        // 检查终止条件
        if (isGoal(nextPos)) {
            game.successCount++;
            break;
        }
        if (isTrap(nextPos) && game.env === 'cliff') {
            break;
        }
    }
    
    game.episode++;
    game.totalReward += episodeReward;
    game.rewardHistory.push(episodeReward);
    if (game.rewardHistory.length > 100) {
        game.rewardHistory.shift();
    }
    
    updateStats();
    updatePolicy();
    
    if (!visualize) {
        if (game.episode % 10 === 0) {
            draw();
            drawChart();
        }
    } else {
        drawChart();
    }
}

function chooseAction(state) {
    // ε-greedy策略
    if (Math.random() < game.params.epsilon) {
        return actions[Math.floor(Math.random() * actions.length)];
    }
    
    // 选择最优动作
    let maxQ = -Infinity;
    let bestAction = actions[0];
    
    for (const action of actions) {
        const q = getQ(state, action);
        if (q > maxQ) {
            maxQ = q;
            bestAction = action;
        }
    }
    
    return bestAction;
}

function updateQTableQLearning(state, action, reward, nextState) {
    const currentQ = getQ(state, action);
    const maxNextQ = Math.max(...actions.map(a => getQ(nextState, a)));
    const newQ = currentQ + game.params.lr * (reward + game.params.gamma * maxNextQ - currentQ);
    setQ(state, action, newQ);
}

function updateQTableSARSA(state, action, reward, nextState, nextAction) {
    const currentQ = getQ(state, action);
    const nextQ = getQ(nextState, nextAction);
    const newQ = currentQ + game.params.lr * (reward + game.params.gamma * nextQ - currentQ);
    setQ(state, action, newQ);
}

function getQ(state, action) {
    if (!game.qTable[state]) {
        game.qTable[state] = {};
    }
    return game.qTable[state][action] || 0;
}

function setQ(state, action, value) {
    if (!game.qTable[state]) {
        game.qTable[state] = {};
    }
    game.qTable[state][action] = value;
}

function stateKey(pos) {
    return `${pos.x},${pos.y}`;
}

function getNextPosition(pos, action) {
    const next = { ...pos };
    
    switch (action) {
        case 'up': next.y--; break;
        case 'down': next.y++; break;
        case 'left': next.x--; break;
        case 'right': next.x++; break;
    }
    
    const env = environments[game.env];
    
    // 边界检查
    if (next.x < 0 || next.x >= env.size || next.y < 0 || next.y >= env.size) {
        return pos;
    }
    
    // 墙壁检查
    if (env.walls.some(w => w.x === next.x && w.y === next.y)) {
        return pos;
    }
    
    return next;
}

function getReward(pos) {
    if (isGoal(pos)) return game.rewards.goal;
    if (isTrap(pos)) return game.rewards.trap;
    return game.rewards.step;
}

function isGoal(pos) {
    const env = environments[game.env];
    return pos.x === env.goal.x && pos.y === env.goal.y;
}

function isTrap(pos) {
    const env = environments[game.env];
    return env.traps.some(t => t.x === pos.x && t.y === pos.y);
}

function updateStats() {
    document.getElementById('episode').textContent = game.episode;
    document.getElementById('totalReward').textContent = Math.round(game.totalReward);
    
    const avgReward = game.episode > 0 ? game.totalReward / game.episode : 0;
    document.getElementById('avgReward').textContent = Math.round(avgReward);
    
    const successRate = game.episode > 0 ? (game.successCount / game.episode * 100) : 0;
    document.getElementById('successRate').textContent = successRate.toFixed(1) + '%';
}

function updatePolicy() {
    const env = environments[game.env];
    let policyText = '';
    
    for (let y = 0; y < env.size; y++) {
        for (let x = 0; x < env.size; x++) {
            const state = stateKey({ x, y });
            let bestAction = '·';
            let maxQ = -Infinity;
            
            for (const action of actions) {
                const q = getQ(state, action);
                if (q > maxQ) {
                    maxQ = q;
                    bestAction = action;
                }
            }
            
            const arrow = { up: '↑', down: '↓', left: '←', right: '→' }[bestAction] || '·';
            policyText += arrow + ' ';
        }
        policyText += '\n';
    }
    
    document.getElementById('policyDisplay').textContent = policyText;
}

function draw() {
    const env = environments[game.env];
    const cellSize = canvas.width / env.size;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 绘制网格
    for (let y = 0; y < env.size; y++) {
        for (let x = 0; x < env.size; x++) {
            ctx.strokeStyle = '#e0e0e0';
            ctx.strokeRect(x * cellSize, y * cellSize, cellSize, cellSize);
            
            // 绘制Q值热力图
            const state = stateKey({ x, y });
            const maxQ = Math.max(...actions.map(a => getQ(state, a)), 0);
            if (maxQ > 0) {
                const alpha = Math.min(maxQ / 50, 0.5);
                ctx.fillStyle = `rgba(72, 187, 120, ${alpha})`;
                ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
            }
        }
    }
    
    // 绘制墙壁
    ctx.fillStyle = '#333';
    env.walls.forEach(wall => {
        ctx.fillRect(wall.x * cellSize, wall.y * cellSize, cellSize, cellSize);
    });
    
    // 绘制陷阱
    ctx.fillStyle = '#e53e3e';
    env.traps.forEach(trap => {
        ctx.fillRect(trap.x * cellSize + 5, trap.y * cellSize + 5, cellSize - 10, cellSize - 10);
        ctx.fillStyle = 'white';
        ctx.font = `${cellSize * 0.5}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('✕', trap.x * cellSize + cellSize / 2, trap.y * cellSize + cellSize / 2);
        ctx.fillStyle = '#e53e3e';
    });
    
    // 绘制目标
    ctx.fillStyle = '#48bb78';
    ctx.fillRect(env.goal.x * cellSize + 5, env.goal.y * cellSize + 5, cellSize - 10, cellSize - 10);
    ctx.fillStyle = 'white';
    ctx.font = `${cellSize * 0.5}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('★', env.goal.x * cellSize + cellSize / 2, env.goal.y * cellSize + cellSize / 2);
    
    // 绘制智能体
    ctx.fillStyle = '#667eea';
    ctx.beginPath();
    ctx.arc(
        game.agent.x * cellSize + cellSize / 2,
        game.agent.y * cellSize + cellSize / 2,
        cellSize / 3,
        0,
        Math.PI * 2
    );
    ctx.fill();
}

function drawChart() {
    const width = chartCanvas.width;
    const height = chartCanvas.height;
    
    chartCtx.clearRect(0, 0, width, height);
    
    if (game.rewardHistory.length < 2) return;
    
    // 找到最大最小值
    const maxReward = Math.max(...game.rewardHistory);
    const minReward = Math.min(...game.rewardHistory);
    const range = maxReward - minReward || 1;
    
    // 绘制坐标轴
    chartCtx.strokeStyle = '#e0e0e0';
    chartCtx.beginPath();
    chartCtx.moveTo(40, 10);
    chartCtx.lineTo(40, height - 30);
    chartCtx.lineTo(width - 10, height - 30);
    chartCtx.stroke();
    
    // 绘制曲线
    chartCtx.strokeStyle = '#667eea';
    chartCtx.lineWidth = 2;
    chartCtx.beginPath();
    
    const xStep = (width - 50) / (game.rewardHistory.length - 1);
    
    game.rewardHistory.forEach((reward, i) => {
        const x = 40 + i * xStep;
        const y = height - 30 - ((reward - minReward) / range) * (height - 40);
        
        if (i === 0) {
            chartCtx.moveTo(x, y);
        } else {
            chartCtx.lineTo(x, y);
        }
    });
    
    chartCtx.stroke();
    
    // 绘制标签
    chartCtx.fillStyle = '#666';
    chartCtx.font = '12px Arial';
    chartCtx.textAlign = 'right';
    chartCtx.fillText(Math.round(maxReward), 35, 15);
    chartCtx.fillText(Math.round(minReward), 35, height - 25);
    chartCtx.textAlign = 'center';
    chartCtx.fillText('奖励曲线', width / 2, height - 10);
}

// 启动游戏
window.addEventListener('load', init);
