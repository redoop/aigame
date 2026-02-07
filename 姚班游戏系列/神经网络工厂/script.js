// 游戏状态
const game = {
    networkCanvas: null,
    lossCanvas: null,
    dataCanvas: null,
    networkCtx: null,
    lossCtx: null,
    dataCtx: null,
    layers: [],
    task: 'xor',
    isTraining: false,
    epoch: 0,
    lossHistory: [],
    accHistory: [],
    dataset: null,
    model: null
};

// 数据集生成
const datasets = {
    xor: () => {
        const data = [];
        const labels = [];
        for (let i = 0; i < 200; i++) {
            const x = Math.random() * 2 - 1;
            const y = Math.random() * 2 - 1;
            data.push([x, y]);
            labels.push((x * y > 0) ? 1 : 0);
        }
        return { data, labels, classes: 2 };
    },
    circle: () => {
        const data = [];
        const labels = [];
        for (let i = 0; i < 200; i++) {
            const x = Math.random() * 2 - 1;
            const y = Math.random() * 2 - 1;
            data.push([x, y]);
            const dist = Math.sqrt(x * x + y * y);
            labels.push(dist < 0.6 ? 0 : 1);
        }
        return { data, labels, classes: 2 };
    },
    spiral: () => {
        const data = [];
        const labels = [];
        for (let i = 0; i < 100; i++) {
            const r = i / 100 * 5;
            const t = 1.75 * i / 100 * 2 * Math.PI;
            data.push([r * Math.cos(t), r * Math.sin(t)]);
            labels.push(0);
            data.push([r * Math.cos(t + Math.PI), r * Math.sin(t + Math.PI)]);
            labels.push(1);
        }
        return { data, labels, classes: 2 };
    },
    mnist: () => {
        // 简化版：生成一些简单的模式
        const data = [];
        const labels = [];
        for (let i = 0; i < 100; i++) {
            const features = [];
            const label = Math.floor(Math.random() * 3);
            for (let j = 0; j < 10; j++) {
                features.push(Math.random() + (j === label ? 1 : 0));
            }
            data.push(features);
            labels.push(label);
        }
        return { data, labels, classes: 3 };
    }
};

// 样例网络架构
const exampleNetworks = {
    simple: {
        name: "简单网络",
        description: "适合XOR等简单问题",
        layers: [
            { type: 'dense', neurons: 8, activation: 'relu' },
            { type: 'dense', neurons: 4, activation: 'relu' }
        ]
    },
    deep: {
        name: "深度网络",
        description: "多层网络，适合复杂问题",
        layers: [
            { type: 'dense', neurons: 32, activation: 'relu' },
            { type: 'dense', neurons: 16, activation: 'relu' },
            { type: 'dense', neurons: 16, activation: 'relu' },
            { type: 'dense', neurons: 8, activation: 'relu' }
        ]
    },
    regularized: {
        name: "正则化网络",
        description: "使用Dropout防止过拟合",
        layers: [
            { type: 'dense', neurons: 32, activation: 'relu' },
            { type: 'dropout', rate: 0.3 },
            { type: 'dense', neurons: 16, activation: 'relu' },
            { type: 'dropout', rate: 0.2 },
            { type: 'dense', neurons: 8, activation: 'relu' }
        ]
    },
    resnet: {
        name: "ResNet风格",
        description: "深层网络 + 批归一化",
        layers: [
            { type: 'dense', neurons: 32, activation: 'relu' },
            { type: 'batchnorm' },
            { type: 'dense', neurons: 32, activation: 'relu' },
            { type: 'batchnorm' },
            { type: 'dense', neurons: 16, activation: 'relu' },
            { type: 'batchnorm' },
            { type: 'dense', neurons: 8, activation: 'relu' }
        ]
    }
};

// 激活函数
const activations = {
    relu: x => Math.max(0, x),
    sigmoid: x => 1 / (1 + Math.exp(-x)),
    tanh: x => Math.tanh(x),
    linear: x => x
};

const activationDerivatives = {
    relu: x => x > 0 ? 1 : 0,
    sigmoid: x => {
        const s = activations.sigmoid(x);
        return s * (1 - s);
    },
    tanh: x => 1 - Math.tanh(x) ** 2,
    linear: x => 1
};

// 简单的神经网络实现
class SimpleNN {
    constructor(layers) {
        this.layers = layers;
        this.weights = [];
        this.biases = [];
        this.activations = [];
        this.initWeights();
    }

    initWeights() {
        for (let i = 0; i < this.layers.length - 1; i++) {
            const w = [];
            const scale = Math.sqrt(2.0 / this.layers[i]); // He initialization
            for (let j = 0; j < this.layers[i]; j++) {
                const row = [];
                for (let k = 0; k < this.layers[i + 1]; k++) {
                    row.push((Math.random() - 0.5) * 2 * scale);
                }
                w.push(row);
            }
            this.weights.push(w);
            
            const b = [];
            for (let j = 0; j < this.layers[i + 1]; j++) {
                b.push(0);
            }
            this.biases.push(b);
        }
    }

    forward(input) {
        this.activations = [input];
        let current = input;
        
        for (let i = 0; i < this.weights.length; i++) {
            const next = [];
            for (let j = 0; j < this.weights[i][0].length; j++) {
                let sum = this.biases[i][j];
                for (let k = 0; k < current.length; k++) {
                    sum += current[k] * this.weights[i][k][j];
                }
                // ReLU for hidden layers, linear for output
                next.push(i < this.weights.length - 1 ? Math.max(0, sum) : sum);
            }
            current = next;
            this.activations.push(current);
        }
        
        // Softmax for output
        const max = Math.max(...current);
        const exp = current.map(x => Math.exp(x - max));
        const sum = exp.reduce((a, b) => a + b, 0);
        return exp.map(x => x / sum);
    }

    backward(input, label, lr) {
        const output = this.forward(input);
        
        // Compute output error
        const outputError = [...output];
        outputError[label] -= 1;
        
        // Backpropagate
        let error = outputError;
        
        for (let i = this.weights.length - 1; i >= 0; i--) {
            const nextError = new Array(this.layers[i]).fill(0);
            
            for (let j = 0; j < this.weights[i].length; j++) {
                for (let k = 0; k < this.weights[i][j].length; k++) {
                    const gradient = error[k] * this.activations[i][j];
                    this.weights[i][j][k] -= lr * gradient;
                    nextError[j] += error[k] * this.weights[i][j][k];
                }
            }
            
            // Update biases
            for (let k = 0; k < error.length; k++) {
                this.biases[i][k] -= lr * error[k];
            }
            
            // Apply ReLU derivative for hidden layers
            if (i > 0) {
                for (let j = 0; j < nextError.length; j++) {
                    nextError[j] *= this.activations[i][j] > 0 ? 1 : 0;
                }
            }
            
            error = nextError;
        }
        
        return output;
    }

    train(data, labels, lr = 0.01, epochs = 1) {
        let totalLoss = 0;
        let correct = 0;

        for (let epoch = 0; epoch < epochs; epoch++) {
            // Shuffle data
            const indices = data.map((_, i) => i);
            for (let i = indices.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [indices[i], indices[j]] = [indices[j], indices[i]];
            }

            for (let idx of indices) {
                const output = this.backward(data[idx], labels[idx], lr);
                
                // Cross-entropy loss
                totalLoss -= Math.log(Math.max(output[labels[idx]], 1e-10));
                
                // Accuracy
                const pred = output.indexOf(Math.max(...output));
                if (pred === labels[idx]) correct++;
            }
        }
        
        return {
            loss: totalLoss / data.length,
            accuracy: correct / data.length
        };
    }
}

// 初始化
function init() {
    game.networkCanvas = document.getElementById('networkCanvas');
    game.lossCanvas = document.getElementById('lossCanvas');
    game.dataCanvas = document.getElementById('dataCanvas');
    
    game.networkCtx = game.networkCanvas.getContext('2d');
    game.lossCtx = game.lossCanvas.getContext('2d');
    game.dataCtx = game.dataCanvas.getContext('2d');
    
    resizeCanvases();
    window.addEventListener('resize', resizeCanvases);
    
    // 事件监听
    document.getElementById('taskSelect').addEventListener('change', changeTask);
    document.getElementById('trainBtn').addEventListener('click', startTraining);
    document.getElementById('stopBtn').addEventListener('click', stopTraining);
    document.getElementById('resetBtn').addEventListener('click', resetNetwork);
    
    document.querySelectorAll('.layer-btn').forEach(btn => {
        btn.addEventListener('click', () => addLayer(btn.dataset.type));
    });
    
    document.querySelectorAll('.example-btn').forEach(btn => {
        btn.addEventListener('click', () => loadExampleNetwork(btn.dataset.example));
    });
    
    document.getElementById('dropoutRate').addEventListener('input', e => {
        document.getElementById('dropoutValue').textContent = e.target.value;
    });
    
    // 初始化默认网络
    loadExampleNetwork('simple');
    
    changeTask();
}

function resizeCanvases() {
    const canvases = [
        { canvas: game.networkCanvas, height: 300 },
        { canvas: game.lossCanvas, height: 200 },
        { canvas: game.dataCanvas, height: 250 }
    ];
    
    canvases.forEach(({ canvas, height }) => {
        const container = canvas.parentElement;
        canvas.width = container.clientWidth - 40;
        canvas.height = height;
    });
    
    drawNetwork();
    drawLossHistory();
    drawDataset();
}

function addLayer(type) {
    const layer = { type };
    
    if (type === 'dense') {
        layer.neurons = parseInt(document.getElementById('neurons').value);
        layer.activation = document.getElementById('activation').value;
    } else if (type === 'activation') {
        layer.activation = document.getElementById('activation').value;
    } else if (type === 'dropout') {
        layer.rate = parseFloat(document.getElementById('dropoutRate').value);
    }
    
    game.layers.push(layer);
    updateLayerList();
    drawNetwork();
}

function loadExampleNetwork(exampleName) {
    const example = exampleNetworks[exampleName];
    
    if (confirm(`加载 "${example.name}"?\n${example.description}\n\n这将清除当前网络。`)) {
        game.layers = JSON.parse(JSON.stringify(example.layers));
        updateLayerList();
        drawNetwork();
        
        // 显示提示
        document.getElementById('layerInfo').textContent = 
            `已加载: ${example.name} - ${example.description}`;
        
        setTimeout(() => {
            document.getElementById('layerInfo').textContent = '点击层查看详情';
        }, 3000);
    }
}

function removeLayer(index) {
    game.layers.splice(index, 1);
    updateLayerList();
    drawNetwork();
}

function updateLayerList() {
    const list = document.getElementById('layerList');
    list.innerHTML = '';
    
    game.layers.forEach((layer, i) => {
        const div = document.createElement('div');
        div.className = 'layer-item';
        
        let name = '';
        let params = '';
        
        if (layer.type === 'dense') {
            name = `全连接层 ${i + 1}`;
            params = `${layer.neurons} 神经元, ${layer.activation}`;
        } else if (layer.type === 'activation') {
            name = `激活层 ${i + 1}`;
            params = layer.activation;
        } else if (layer.type === 'dropout') {
            name = `Dropout ${i + 1}`;
            params = `rate=${layer.rate}`;
        } else if (layer.type === 'batchnorm') {
            name = `批归一化 ${i + 1}`;
            params = '';
        }
        
        div.innerHTML = `
            <div>
                <div class="layer-name">${name}</div>
                <div class="layer-params">${params}</div>
            </div>
            <button class="layer-remove" onclick="removeLayer(${i})">删除</button>
        `;
        
        list.appendChild(div);
    });
}

function changeTask() {
    game.task = document.getElementById('taskSelect').value;
    game.dataset = datasets[game.task]();
    document.getElementById('datasetName').textContent = 
        `数据集: ${game.task.toUpperCase()}, ${game.dataset.data.length} 样本`;
    drawDataset();
}

function drawNetwork() {
    const ctx = game.networkCtx;
    const w = game.networkCanvas.width;
    const h = game.networkCanvas.height;
    
    ctx.clearRect(0, 0, w, h);
    
    if (game.layers.length === 0) return;
    
    // 提取全连接层
    const denseLayers = game.layers.filter(l => l.type === 'dense');
    if (denseLayers.length === 0) return;
    
    const layerSpacing = w / (denseLayers.length + 1);
    const maxNeurons = Math.max(...denseLayers.map(l => l.neurons));
    
    denseLayers.forEach((layer, i) => {
        const x = layerSpacing * (i + 1);
        const neuronSpacing = h / (layer.neurons + 1);
        
        for (let j = 0; j < layer.neurons; j++) {
            const y = neuronSpacing * (j + 1);
            
            // 绘制连接
            if (i > 0) {
                const prevLayer = denseLayers[i - 1];
                const prevX = layerSpacing * i;
                const prevSpacing = h / (prevLayer.neurons + 1);
                
                ctx.strokeStyle = 'rgba(102, 126, 234, 0.2)';
                ctx.lineWidth = 1;
                
                for (let k = 0; k < prevLayer.neurons; k++) {
                    const prevY = prevSpacing * (k + 1);
                    ctx.beginPath();
                    ctx.moveTo(prevX, prevY);
                    ctx.lineTo(x, y);
                    ctx.stroke();
                }
            }
            
            // 绘制神经元
            ctx.fillStyle = '#667eea';
            ctx.beginPath();
            ctx.arc(x, y, 8, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // 标签
        ctx.fillStyle = '#333';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`Layer ${i + 1}`, x, h - 10);
        ctx.fillText(`${layer.neurons}`, x, 15);
    });
}

function drawLossHistory() {
    const ctx = game.lossCtx;
    const w = game.lossCanvas.width;
    const h = game.lossCanvas.height;
    
    ctx.clearRect(0, 0, w, h);
    
    if (game.lossHistory.length < 2) return;
    
    const maxLoss = Math.max(...game.lossHistory, 1);
    const xStep = w / Math.max(game.lossHistory.length, 100);
    
    // 绘制损失曲线
    ctx.strokeStyle = '#f56565';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    game.lossHistory.forEach((loss, i) => {
        const x = i * xStep;
        const y = h - (loss / maxLoss) * (h - 20);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });
    
    ctx.stroke();
    
    // 绘制准确率曲线
    if (game.accHistory.length > 0) {
        ctx.strokeStyle = '#48bb78';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        game.accHistory.forEach((acc, i) => {
            const x = i * xStep;
            const y = h - acc * (h - 20);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        
        ctx.stroke();
    }
}

function drawDataset() {
    const ctx = game.dataCtx;
    const w = game.dataCanvas.width;
    const h = game.dataCanvas.height;
    
    ctx.clearRect(0, 0, w, h);
    
    if (!game.dataset) return;
    
    const data = game.dataset.data;
    const labels = game.dataset.labels;
    
    // 只绘制2D数据
    if (data[0].length !== 2) {
        ctx.fillStyle = '#666';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('高维数据无法可视化', w / 2, h / 2);
        return;
    }
    
    const colors = ['#667eea', '#f56565', '#48bb78', '#ffc107'];
    
    data.forEach((point, i) => {
        const x = (point[0] + 1) / 2 * (w - 40) + 20;
        const y = (1 - (point[1] + 1) / 2) * (h - 40) + 20;
        
        ctx.fillStyle = colors[labels[i]];
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
    });
}

async function startTraining() {
    if (game.isTraining) return;
    
    const denseLayers = game.layers.filter(l => l.type === 'dense');
    if (denseLayers.length < 1) {
        alert('至少需要1个全连接层');
        return;
    }
    
    game.isTraining = true;
    game.epoch = 0;
    game.lossHistory = [];
    game.accHistory = [];
    
    document.getElementById('trainBtn').disabled = true;
    document.getElementById('stopBtn').disabled = false;
    
    // 构建网络架构
    const inputSize = game.dataset.data[0].length;
    const outputSize = game.dataset.classes;
    const hiddenSizes = denseLayers.map(l => l.neurons);
    const architecture = [inputSize, ...hiddenSizes, outputSize];
    
    game.model = new SimpleNN(architecture);
    
    const lr = parseFloat(document.getElementById('learningRate').value);
    
    // 训练循环
    const maxEpochs = 200;
    for (let i = 0; i < maxEpochs && game.isTraining; i++) {
        const result = game.model.train(game.dataset.data, game.dataset.labels, lr, 1);
        
        game.lossHistory.push(result.loss);
        game.accHistory.push(result.accuracy);
        game.epoch++;
        
        document.getElementById('trainLoss').textContent = result.loss.toFixed(4);
        document.getElementById('valAcc').textContent = (result.accuracy * 100).toFixed(1) + '%';
        document.getElementById('epoch').textContent = game.epoch;
        
        drawLossHistory();
        
        // 每10轮更新一次，加快速度
        if (i % 10 === 0) {
            await new Promise(resolve => setTimeout(resolve, 10));
        }
        
        // 如果准确率达到95%以上，提前停止
        if (result.accuracy > 0.95) {
            alert(`训练完成！\n准确率: ${(result.accuracy * 100).toFixed(1)}%\n迭代次数: ${game.epoch}`);
            break;
        }
    }
    
    game.isTraining = false;
    document.getElementById('trainBtn').disabled = false;
    document.getElementById('stopBtn').disabled = true;
    
    if (game.epoch >= maxEpochs) {
        alert(`训练结束！\n最终准确率: ${(game.accHistory[game.accHistory.length - 1] * 100).toFixed(1)}%`);
    }
}

function stopTraining() {
    game.isTraining = false;
    document.getElementById('trainBtn').disabled = false;
    document.getElementById('stopBtn').disabled = true;
}

function resetNetwork() {
    game.layers = [];
    game.epoch = 0;
    game.lossHistory = [];
    game.accHistory = [];
    game.model = null;
    game.isTraining = false;
    
    document.getElementById('trainLoss').textContent = '-';
    document.getElementById('valAcc').textContent = '-';
    document.getElementById('epoch').textContent = '0';
    document.getElementById('trainBtn').disabled = false;
    document.getElementById('stopBtn').disabled = true;
    
    updateLayerList();
    drawNetwork();
    drawLossHistory();
}

// 全局函数
window.removeLayer = removeLayer;

// 启动游戏
window.addEventListener('load', init);
