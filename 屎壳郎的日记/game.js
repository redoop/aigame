class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // 设置画布大小为窗口大小
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        this.canvas.width = windowWidth;
        this.canvas.height = windowHeight;
        
        // 初始化游戏对象
        this.beetle = {
            x: this.canvas.width / 2,
            y: this.canvas.height / 2,
            size: 40 * (this.canvas.height / 600),
            speed: 5 * (this.canvas.height / 600),
            rotation: 0
        };
        
        this.hole = {
            x: this.canvas.width - 100,
            y: this.canvas.height - 100,
            size: 80 * (this.canvas.height / 600),
            active: true
        };
        
        this.dungBall = {
            x: this.canvas.width / 2,
            y: this.canvas.height / 2 + 50,
            size: 60 * (this.canvas.height / 600),
            pushing: false,
            falling: false,
            fallProgress: 0
        };
        
        this.score = 0;
        this.scoreElement = document.getElementById('scoreValue');
        
        this.keys = {
            ArrowUp: false,
            ArrowDown: false,
            ArrowLeft: false,
            ArrowRight: false
        };
        
        // 初始化音频系统
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.pushSoundTimer = 0;
        
        // 添加装饰元素
        this.decorations = {
            grass: this.generateGrass(),
            trees: this.generateTrees(),
            flowers: this.generateFlowers()
        };
        
        // 启动背景音效
        this.createForestAmbience();
        
        // 设置事件监听
        this.setupEventListeners();
        this.setupMobileControls();
        
        // 监听窗口大小变化
        window.addEventListener('resize', () => {
            this.resizeCanvas();
        });
        
        // 启动游戏循环
        this.gameLoop();
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            if (this.keys.hasOwnProperty(e.key)) {
                this.keys[e.key] = true;
            }
        });
        
        document.addEventListener('keyup', (e) => {
            if (this.keys.hasOwnProperty(e.key)) {
                this.keys[e.key] = false;
            }
        });
    }
    
    // 创建森林环境音效
    createForestAmbience() {
        // 清脆的鸟叫声
        this.scheduleBirdSounds();
        
        // 偶尔的清脆铃声
        this.scheduleChimes();
    }
    
    // 创建悦耳的鸟叫声
    createBirdSound() {
        const duration = 0.15; // 缩短持续时间
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        // 设置音调（使用更高更清脆的音调）
        oscillator.type = 'sine';
        const baseFreq = 4000 + Math.random() * 1000; // 提高基础频率
        
        // 创建音调变化（更快的旋律）
        oscillator.frequency.setValueAtTime(baseFreq, this.audioContext.currentTime);
        oscillator.frequency.setValueAtTime(baseFreq * 1.5, this.audioContext.currentTime + duration * 0.2);
        oscillator.frequency.setValueAtTime(baseFreq, this.audioContext.currentTime + duration * 0.4);
        
        // 设置音量包络（更短促的声音）
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.015, this.audioContext.currentTime + 0.02);
        gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + duration);
        
        // 连接节点
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        // 播放声音
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + duration);
    }
    
    // 创建清脆的风铃声
    createChimeSound() {
        const duration = 2.0;
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        // 设置音调（使用更高的泛音）
        oscillator.type = 'sine';
        const baseFreq = 3000 + Math.random() * 500;
        oscillator.frequency.setValueAtTime(baseFreq, this.audioContext.currentTime);
        
        // 设置音量包络（更长的余音，更小的音量）
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.01, this.audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, this.audioContext.currentTime + duration);
        
        // 连接节点
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        // 播放声音
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + duration);
        
        // 添加延迟的泛音
        setTimeout(() => {
            const harmonicOsc = this.audioContext.createOscillator();
            const harmonicGain = this.audioContext.createGain();
            
            harmonicOsc.type = 'sine';
            harmonicOsc.frequency.setValueAtTime(baseFreq * 1.5, this.audioContext.currentTime);
            
            harmonicGain.gain.setValueAtTime(0, this.audioContext.currentTime);
            harmonicGain.gain.linearRampToValueAtTime(0.005, this.audioContext.currentTime + 0.01);
            harmonicGain.gain.exponentialRampToValueAtTime(0.0001, this.audioContext.currentTime + duration * 0.8);
            
            harmonicOsc.connect(harmonicGain);
            harmonicGain.connect(this.audioContext.destination);
            
            harmonicOsc.start();
            harmonicOsc.stop(this.audioContext.currentTime + duration * 0.8);
        }, 50);
    }
    
    // 安排鸟叫声的播放时间
    scheduleBirdSounds() {
        const schedule = () => {
            // 随机播放2-4声鸟叫
            const chirps = 2 + Math.floor(Math.random() * 3);
            for (let i = 0; i < chirps; i++) {
                setTimeout(() => this.createBirdSound(), i * 150);
            }
            // 更长的随机间隔
            setTimeout(() => schedule(), 12000 + Math.random() * 15000);
        };
        
        schedule();
    }
    
    // 安排风铃声的播放时间
    scheduleChimes() {
        const schedule = () => {
            this.createChimeSound();
            // 更长的随机间隔
            setTimeout(() => schedule(), 20000 + Math.random() * 25000);
        };
        
        schedule();
    }
    
    // 生成推动声音（摩擦声）
    createPushSound() {
        const duration = 0.15;  // 声音持续时间
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const noiseBuffer = this.createNoiseBuffer();
        const bufferSource = this.audioContext.createBufferSource();
        
        // 设置噪声源
        bufferSource.buffer = noiseBuffer;
        bufferSource.loop = true;
        
        // 设置音量包络
        gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + duration);
        
        // 连接节点
        bufferSource.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        // 播放声音
        bufferSource.start();
        bufferSource.stop(this.audioContext.currentTime + duration);
    }
    
    // 生成掉落声音（低沉的"咚"声）
    createFallSound() {
        const duration = 0.3;
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        // 设置音调
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(100, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(50, this.audioContext.currentTime + duration);
        
        // 设置音量包络
        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
        
        // 连接节点
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        // 播放声音
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + duration);
    }
    
    // 创建噪声缓冲区（用于摩擦声）
    createNoiseBuffer() {
        const bufferSize = this.audioContext.sampleRate * 0.15;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        
        return buffer;
    }
    
    update() {
        // 更新屎壳郎位置
        if (this.keys.ArrowUp) this.beetle.y -= this.beetle.speed;
        if (this.keys.ArrowDown) this.beetle.y += this.beetle.speed;
        if (this.keys.ArrowLeft) this.beetle.x -= this.beetle.speed;
        if (this.keys.ArrowRight) this.beetle.x += this.beetle.speed;
        
        // 限制屎壳郎在画布范围内
        this.beetle.x = Math.max(this.beetle.size/2, Math.min(this.canvas.width - this.beetle.size/2, this.beetle.x));
        this.beetle.y = Math.max(this.beetle.size/2, Math.min(this.canvas.height - this.beetle.size/2, this.beetle.y));
        
        // 检测屎壳郎和粪球的碰撞
        const dx = this.beetle.x - this.dungBall.x;
        const dy = this.beetle.y - this.dungBall.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (!this.dungBall.falling && distance < this.beetle.size/2 + this.dungBall.size/2) {
            this.dungBall.pushing = true;
            this.dungBall.x = this.beetle.x + Math.cos(Math.atan2(dy, dx)) * (this.beetle.size/2 + this.dungBall.size/2);
            this.dungBall.y = this.beetle.y + Math.sin(Math.atan2(dy, dx)) * (this.beetle.size/2 + this.dungBall.size/2);
            
            // 播放推动声音（每500毫秒播放一次）
            if (this.pushSoundTimer <= 0) {
                this.createPushSound();
                this.pushSoundTimer = 30; // 约500毫秒（30帧）
            }
            this.pushSoundTimer--;
            
            // 检测粪球是否进洞
            if (this.hole.active) {
                const dxHole = this.dungBall.x - this.hole.x;
                const dyHole = this.dungBall.y - this.hole.y;
                const distanceToHole = Math.sqrt(dxHole * dxHole + dyHole * dyHole);
                
                if (distanceToHole < (this.hole.size - this.dungBall.size) / 2) {
                    this.dungBall.falling = true;
                    this.dungBall.fallProgress = 0;
                    // 播放掉落声音
                    this.createFallSound();
                }
            }
        } else {
            this.dungBall.pushing = false;
            this.pushSoundTimer = 0;
        }
        
        // 处理粪球下落动画
        if (this.dungBall.falling) {
            this.dungBall.fallProgress += 0.05;
            if (this.dungBall.fallProgress >= 1) {
                this.score += 50;
                this.scoreElement.textContent = this.score;
                this.resetGame();
            }
        }
    }
    
    draw() {
        // 清空画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制背景草地色
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制草
        this.drawGrass();
        
        // 绘制树木
        this.drawTrees();
        
        // 绘制花朵
        this.drawFlowers();
        
        // 绘制洞
        this.ctx.fillStyle = '#000000';
        this.ctx.beginPath();
        this.ctx.arc(this.hole.x, this.hole.y, this.hole.size/2, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 绘制洞的阴影效果
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.beginPath();
        this.ctx.arc(this.hole.x, this.hole.y, this.hole.size/2 - 10, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 绘制粪球（带下落动画）
        if (!this.dungBall.falling) {
            // 计算屎壳郎的朝向
            if (this.keys.ArrowLeft) this.beetle.rotation = Math.PI;
            if (this.keys.ArrowRight) this.beetle.rotation = 0;
            if (this.keys.ArrowUp) this.beetle.rotation = -Math.PI/2;
            if (this.keys.ArrowDown) this.beetle.rotation = Math.PI/2;
            
            // 绘制粪球
            this.ctx.fillStyle = '#654321';
            this.ctx.beginPath();
            this.ctx.arc(this.dungBall.x, this.dungBall.y, this.dungBall.size/2, 0, Math.PI * 2);
            this.ctx.fill();
            
            // 添加粪球的纹理
            this.ctx.strokeStyle = '#543210';
            for (let i = 0; i < 8; i++) {
                this.ctx.beginPath();
                this.ctx.arc(
                    this.dungBall.x + Math.cos(i * Math.PI/4) * this.dungBall.size/4,
                    this.dungBall.y + Math.sin(i * Math.PI/4) * this.dungBall.size/4,
                    this.dungBall.size/8,
                    0,
                    Math.PI * 2
                );
                this.ctx.stroke();
            }
            
            // 保存当前绘图状态
            this.ctx.save();
            
            // 移动到屎壳郎中心点并旋转
            this.ctx.translate(this.beetle.x, this.beetle.y);
            this.ctx.rotate(this.beetle.rotation);
            
            // 绘制屎壳郎身体
            this.ctx.fillStyle = '#2C1810';
            this.ctx.beginPath();
            this.ctx.ellipse(0, 0, this.beetle.size/2, this.beetle.size/3, 0, 0, Math.PI * 2);
            this.ctx.fill();
            
            // 绘制头部
            this.ctx.fillStyle = '#1A0F0A';
            this.ctx.beginPath();
            this.ctx.ellipse(this.beetle.size/2, 0, this.beetle.size/4, this.beetle.size/5, 0, 0, Math.PI * 2);
            this.ctx.fill();
            
            // 绘制触角
            this.ctx.strokeStyle = '#1A0F0A';
            this.ctx.lineWidth = 2;
            
            // 左触角
            this.ctx.beginPath();
            this.ctx.moveTo(this.beetle.size/2, -this.beetle.size/6);
            this.ctx.quadraticCurveTo(
                this.beetle.size/2 + this.beetle.size/4,
                -this.beetle.size/2,
                this.beetle.size/2 + this.beetle.size/3,
                -this.beetle.size/3
            );
            this.ctx.stroke();
            
            // 右触角
            this.ctx.beginPath();
            this.ctx.moveTo(this.beetle.size/2, this.beetle.size/6);
            this.ctx.quadraticCurveTo(
                this.beetle.size/2 + this.beetle.size/4,
                this.beetle.size/2,
                this.beetle.size/2 + this.beetle.size/3,
                this.beetle.size/3
            );
            this.ctx.stroke();
            
            // 绘制腿
            for (let i = 0; i < 3; i++) {
                // 左腿
                this.ctx.beginPath();
                this.ctx.moveTo(-this.beetle.size/4 + i * this.beetle.size/4, -this.beetle.size/3);
                this.ctx.quadraticCurveTo(
                    -this.beetle.size/4 + i * this.beetle.size/4,
                    -this.beetle.size/2,
                    -this.beetle.size/4 + i * this.beetle.size/4 - this.beetle.size/6,
                    -this.beetle.size/2
                );
                this.ctx.stroke();
                
                // 右腿
                this.ctx.beginPath();
                this.ctx.moveTo(-this.beetle.size/4 + i * this.beetle.size/4, this.beetle.size/3);
                this.ctx.quadraticCurveTo(
                    -this.beetle.size/4 + i * this.beetle.size/4,
                    this.beetle.size/2,
                    -this.beetle.size/4 + i * this.beetle.size/4 - this.beetle.size/6,
                    this.beetle.size/2
                );
                this.ctx.stroke();
            }
            
            // 恢复绘图状态
            this.ctx.restore();
        } else {
            // 下落动画效果
            const scale = 1 - this.dungBall.fallProgress * 0.5;
            const alpha = 1 - this.dungBall.fallProgress;
            
            this.ctx.globalAlpha = alpha;
            this.ctx.fillStyle = '#654321';
            this.ctx.beginPath();
            this.ctx.arc(
                this.dungBall.x,
                this.dungBall.y,
                (this.dungBall.size/2) * scale,
                0,
                Math.PI * 2
            );
            this.ctx.fill();
            this.ctx.globalAlpha = 1;
        }
    }
    
    // 绘制草
    drawGrass() {
        this.ctx.strokeStyle = '#90EE90';
        this.ctx.lineWidth = 1;
        
        this.decorations.grass.forEach(grass => {
            this.ctx.beginPath();
            this.ctx.moveTo(grass.x, grass.y);
            this.ctx.quadraticCurveTo(
                grass.x + grass.lean * grass.height,
                grass.y - grass.height / 2,
                grass.x + grass.lean * grass.height * 2,
                grass.y - grass.height
            );
            this.ctx.stroke();
        });
    }
    
    // 绘制树木
    drawTrees() {
        this.decorations.trees.forEach(tree => {
            // 树干
            this.ctx.fillStyle = '#8B4513';
            this.ctx.beginPath();
            this.ctx.fillRect(tree.x - tree.size/8, tree.y, tree.size/4, tree.size);
            
            // 树冠
            this.ctx.fillStyle = '#228B22';
            this.ctx.beginPath();
            this.ctx.arc(tree.x, tree.y, tree.size/2, 0, Math.PI * 2);
            this.ctx.fill();
            
            // 树冠细节
            this.ctx.fillStyle = '#006400';
            this.ctx.beginPath();
            this.ctx.arc(tree.x - tree.size/4, tree.y, tree.size/3, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.beginPath();
            this.ctx.arc(tree.x + tree.size/4, tree.y - tree.size/4, tree.size/3, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }
    
    // 绘制花朵
    drawFlowers() {
        this.decorations.flowers.forEach(flower => {
            // 花茎
            this.ctx.strokeStyle = '#228B22';
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.moveTo(flower.x, flower.y);
            this.ctx.lineTo(flower.x, flower.y + flower.size * 3);
            this.ctx.stroke();
            
            // 花瓣
            this.ctx.fillStyle = flower.color;
            for (let i = 0; i < 5; i++) {
                this.ctx.beginPath();
                this.ctx.ellipse(
                    flower.x + Math.cos(flower.rotation + i * Math.PI * 0.4) * flower.size,
                    flower.y + Math.sin(flower.rotation + i * Math.PI * 0.4) * flower.size,
                    flower.size,
                    flower.size/2,
                    flower.rotation + i * Math.PI * 0.4,
                    0,
                    Math.PI * 2
                );
                this.ctx.fill();
            }
            
            // 花蕊
            this.ctx.fillStyle = '#FFD700';
            this.ctx.beginPath();
            this.ctx.arc(flower.x, flower.y, flower.size/2, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }
    
    resetGame() {
        // 重置粪球位置和状态
        this.dungBall.falling = false;
        this.dungBall.fallProgress = 0;
        this.resetDungBall();
        
        // 确保洞不会生成在树木上
        do {
            const margin = 100;
            this.hole.x = margin + Math.random() * (this.canvas.width - 2 * margin);
            this.hole.y = margin + Math.random() * (this.canvas.height - 2 * margin);
        } while (this.isNearTrees(this.hole.x, this.hole.y));
    }
    
    resetDungBall() {
        // 确保粪球不会生成在树木或洞的位置
        do {
            this.dungBall.x = Math.random() * (this.canvas.width - 2 * this.dungBall.size) + this.dungBall.size;
            this.dungBall.y = Math.random() * (this.canvas.height - 2 * this.dungBall.size) + this.dungBall.size;
            
            const dx = this.dungBall.x - this.hole.x;
            const dy = this.dungBall.y - this.hole.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
        } while (distance < this.hole.size || this.isNearTrees(this.dungBall.x, this.dungBall.y));
    }
    
    // 检查位置是否靠近树木
    isNearTrees(x, y) {
        return this.decorations.trees.some(tree => {
            const dx = x - tree.x;
            const dy = y - tree.y;
            return Math.sqrt(dx * dx + dy * dy) < tree.size;
        });
    }
    
    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
    
    resizeCanvas() {
        // 获取窗口大小
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        
        // 设置画布大小
        this.canvas.width = windowWidth;
        this.canvas.height = windowHeight;
        
        // 更新游戏对象的大小
        this.beetle.size = 40 * (this.canvas.height / 600);
        this.beetle.speed = 5 * (this.canvas.height / 600);
        this.dungBall.size = 60 * (this.canvas.height / 600);
        this.hole.size = 80 * (this.canvas.height / 600);
        
        // 重新生成装饰元素
        this.decorations = {
            grass: this.generateGrass(),
            trees: this.generateTrees(),
            flowers: this.generateFlowers()
        };
        
        // 确保所有游戏对象都在新的画布范围内
        this.resetGame();
    }
    
    setupMobileControls() {
        const buttons = {
            upBtn: document.getElementById('upBtn'),
            downBtn: document.getElementById('downBtn'),
            leftBtn: document.getElementById('leftBtn'),
            rightBtn: document.getElementById('rightBtn')
        };
        
        // 触摸事件处理
        const handleTouch = (btn, key, isDown) => {
            btn.addEventListener(isDown ? 'touchstart' : 'touchend', (e) => {
                e.preventDefault();
                this.keys[key] = isDown;
            });
        };
        
        // 为每个按钮添加触摸事件
        handleTouch(buttons.upBtn, 'ArrowUp', true);
        handleTouch(buttons.upBtn, 'ArrowUp', false);
        handleTouch(buttons.downBtn, 'ArrowDown', true);
        handleTouch(buttons.downBtn, 'ArrowDown', false);
        handleTouch(buttons.leftBtn, 'ArrowLeft', true);
        handleTouch(buttons.leftBtn, 'ArrowLeft', false);
        handleTouch(buttons.rightBtn, 'ArrowRight', true);
        handleTouch(buttons.rightBtn, 'ArrowRight', false);
    }
    
    generateGrass() {
        const grass = [];
        const count = Math.floor((this.canvas.width * this.canvas.height) / 2400);
        for (let i = 0; i < count; i++) {
            grass.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                height: (10 + Math.random() * 15) * (this.canvas.height / 600),
                lean: -0.2 + Math.random() * 0.4
            });
        }
        return grass;
    }
    
    generateTrees() {
        const trees = [];
        const count = Math.floor((this.canvas.width * this.canvas.height) / 96000);
        for (let i = 0; i < count; i++) {
            trees.push({
                x: 50 + Math.random() * (this.canvas.width - 100),
                y: 50 + Math.random() * (this.canvas.height - 100),
                size: (40 + Math.random() * 30) * (this.canvas.height / 600)
            });
        }
        return trees;
    }
    
    generateFlowers() {
        const flowers = [];
        const count = Math.floor((this.canvas.width * this.canvas.height) / 16000);
        const colors = ['#FF6B6B', '#E83E8C', '#A44CD3', '#4169E1', '#FFD93D'];
        for (let i = 0; i < count; i++) {
            flowers.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: (4 + Math.random() * 4) * (this.canvas.height / 600),
                color: colors[Math.floor(Math.random() * colors.length)],
                rotation: Math.random() * Math.PI * 2
            });
        }
        return flowers;
    }
}

// 启动游戏
window.onload = () => {
    new Game();
}; 