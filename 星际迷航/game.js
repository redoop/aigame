class SpaceGame {
    constructor() {
        // 初始化画布
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // 设置画布尺寸为屏幕大小
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        // 初始化游戏对象
        this.ship = {
            x: this.canvas.width / 2,
            y: this.canvas.height * 0.8,
            size: 20,
            speed: 5,
            score: 0
        };
        
        this.bullets = [];
        this.enemies = [];
        
        // 修改控制状态
        this.touchStartX = null;
        this.touchStartY = null;
        this.isShooting = false;
        this.shootInterval = null;
        
        // 设置触摸控制
        this.setupTouchControls();
        
        // 生成初始敌人
        this.generateEnemies();
        
        // 添加爆炸效果数组
        this.explosions = [];
        this.meteors = [];
        
        // 生成初始陨石
        this.generateMeteors(5);
        
        // 初始化音频系统
        this.initAudio();
        
        // 开始游戏循环
        this.gameLoop();
    }
    
    // 替换原有的setupControls方法
    setupTouchControls() {
        // 添加触摸事件监听
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e));
        this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e));
    }
    
    // 处理触摸开始
    handleTouchStart(e) {
        e.preventDefault();
        const touch = e.touches[0];
        this.touchStartX = touch.clientX;
        this.touchStartY = touch.clientY;
        
        // 开始持续射击
        this.isShooting = true;
        this.shoot();
        this.shootInterval = setInterval(() => {
            if (this.isShooting) {
                this.shoot();
            }
        }, 200); // 每200ms射击一次
    }
    
    // 处理触摸移动
    handleTouchMove(e) {
        e.preventDefault();
        if (!this.touchStartX || !this.touchStartY) return;
        
        const touch = e.touches[0];
        const deltaX = touch.clientX - this.touchStartX;
        const deltaY = touch.clientY - this.touchStartY;
        
        // 移动飞船
        this.ship.x += deltaX * 0.1;
        this.ship.y += deltaY * 0.1;
        
        // 限制飞船在画布范围内
        this.ship.x = Math.max(30, Math.min(this.canvas.width - 30, this.ship.x));
        this.ship.y = Math.max(30, Math.min(this.canvas.height - 30, this.ship.y));
        
        // 更新触摸位置
        this.touchStartX = touch.clientX;
        this.touchStartY = touch.clientY;
        
        // 移动时播放引擎音效
        this.playSound('engine');
    }
    
    // 处理触摸结束
    handleTouchEnd(e) {
        e.preventDefault();
        this.touchStartX = null;
        this.touchStartY = null;
        
        // 停止射击
        this.isShooting = false;
        if (this.shootInterval) {
            clearInterval(this.shootInterval);
            this.shootInterval = null;
        }
    }
    
    // 生成敌人
    generateEnemies() {
        for (let i = 0; i < 5; i++) {
            this.enemies.push({
                x: Math.random() * (this.canvas.width - 40) + 20,
                y: Math.random() * (this.canvas.height * 0.5),
                size: 20,
                speed: 2
            });
        }
    }
    
    // 添加陨石生成方法
    generateMeteors(count) {
        for (let i = 0; i < count; i++) {
            this.meteors.push({
                x: Math.random() * (this.canvas.width - 40) + 20,
                y: -20,
                size: 20 + Math.random() * 20,
                speed: 2 + Math.random() * 2,
                rotation: Math.random() * Math.PI * 2
            });
        }
    }
    
    // 修改音频初始化方法
    initAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // 创建星际迷航风格的音效
            this.sounds = {
                shoot: {
                    // 相位枪射击音效
                    oscillator: null,
                    gainNode: null,
                    frequency: 1200,
                    type: 'sine',
                    duration: 0.15,
                    volume: 0.2,
                    sweep: true  // 添加频率扫描
                },
                explosion: {
                    // 星际迷航爆炸音效
                    oscillator: null,
                    gainNode: null,
                    frequency: 150,
                    type: 'sawtooth',
                    duration: 0.4,
                    volume: 0.3,
                    noise: true  // 添加噪声
                },
                engine: {
                    // 曲速引擎音效
                    oscillator: null,
                    gainNode: null,
                    frequency: 80,
                    type: 'sine',
                    duration: 0.2,
                    volume: 0.1,
                    modulation: true  // 添加调制
                },
                alert: {
                    // 警报音效
                    oscillator: null,
                    gainNode: null,
                    frequency: 800,
                    type: 'square',
                    duration: 0.3,
                    volume: 0.15,
                    alternating: true  // 添加交替音高
                }
            };
        } catch (error) {
            console.warn('无法创建音频上下文:', error);
            this.audioContext = null;
        }
    }
    
    // 修改音效播放方法
    playSound(type) {
        if (!this.audioContext || !this.sounds[type]) return;
        
        const sound = this.sounds[type];
        const currentTime = this.audioContext.currentTime;
        
        // 创建音频节点
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        // 设置基本参数
        oscillator.type = sound.type;
        oscillator.frequency.setValueAtTime(sound.frequency, currentTime);
        
        // 添加特殊音效处理
        if (sound.sweep) {
            // 相位枪射击音效的频率扫描
            oscillator.frequency.exponentialRampToValueAtTime(
                sound.frequency * 0.5,
                currentTime + sound.duration
            );
        }
        
        if (sound.modulation) {
            // 曲速引擎的调制效果
            const modulator = this.audioContext.createOscillator();
            const modulatorGain = this.audioContext.createGain();
            
            modulator.frequency.value = 30;
            modulatorGain.gain.value = 20;
            
            modulator.connect(modulatorGain);
            modulatorGain.connect(oscillator.frequency);
            modulator.start(currentTime);
            modulator.stop(currentTime + sound.duration);
        }
        
        if (sound.noise) {
            // 爆炸音效的噪声处理
            const noiseGain = this.audioContext.createGain();
            noiseGain.gain.setValueAtTime(sound.volume, currentTime);
            noiseGain.gain.exponentialRampToValueAtTime(0.01, currentTime + sound.duration);
            
            // 创建白噪声
            const bufferSize = 2 * this.audioContext.sampleRate;
            const noiseBuffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
            const output = noiseBuffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                output[i] = Math.random() * 2 - 1;
            }
            
            const noise = this.audioContext.createBufferSource();
            noise.buffer = noiseBuffer;
            noise.connect(noiseGain);
            noiseGain.connect(this.audioContext.destination);
            noise.start(currentTime);
        }
        
        if (sound.alternating) {
            // 警报音效的交替音高
            oscillator.frequency.setValueAtTime(sound.frequency, currentTime);
            oscillator.frequency.setValueAtTime(sound.frequency * 1.2, currentTime + 0.15);
        }
        
        // 设置音量包络
        gainNode.gain.setValueAtTime(0, currentTime);
        gainNode.gain.linearRampToValueAtTime(sound.volume, currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, currentTime + sound.duration);
        
        // 连接音频节点
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        // 播放音效
        oscillator.start(currentTime);
        oscillator.stop(currentTime + sound.duration);
    }
    
    // 射击方法
    shoot() {
        const bulletSpeed = 10;
        // 从飞船两侧发射子弹
        this.bullets.push({
            x: this.ship.x - 15,
            y: this.ship.y,
            size: 4,
            speed: bulletSpeed,
            color: '#00ffff'
        });
        this.bullets.push({
            x: this.ship.x + 15,
            y: this.ship.y,
            size: 4,
            speed: bulletSpeed,
            color: '#00ffff'
        });
        
        // 播放射击音效
        this.playSound('shoot');
    }
    
    // 添加爆炸效果方法
    createExplosion(x, y, size) {
        const particleCount = 15;
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 / particleCount) * i;
            const speed = 2 + Math.random() * 2;
            this.explosions.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 2 + Math.random() * 2,
                life: 1.0,
                color: `hsl(${Math.random() * 30 + 15}, 100%, 50%)`  // 橙色到红色的随机色
            });
        }
        
        // 播放爆炸音效
        this.playSound('explosion');
    }
    
    // 更新游戏状态
    update() {
        // 更新子弹
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            this.bullets[i].y -= this.bullets[i].speed;
            
            // 移除出界的子弹
            if (this.bullets[i].y < 0) {
                this.bullets.splice(i, 1);
                continue;
            }
            
            // 检测子弹击中敌人
            for (let j = this.enemies.length - 1; j >= 0; j--) {
                const dx = this.bullets[i]?.x - this.enemies[j].x;
                const dy = this.bullets[i]?.y - this.enemies[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < this.enemies[j].size + this.bullets[i]?.size) {
                    this.enemies.splice(j, 1);
                    this.bullets.splice(i, 1);
                    this.ship.score += 10;
                    break;
                }
            }
        }
        
        // 更新敌人
        this.enemies.forEach(enemy => {
            enemy.y += enemy.speed;
            if (enemy.y > this.canvas.height) {
                enemy.y = -20;
                enemy.x = Math.random() * (this.canvas.width - 40) + 20;
            }
        });
        
        // 如果敌人数量少于5，生成新的敌人
        if (this.enemies.length < 5) {
            this.generateEnemies();
        }
        
        // 更新陨石
        for (let i = this.meteors.length - 1; i >= 0; i--) {
            const meteor = this.meteors[i];
            meteor.y += meteor.speed;
            meteor.rotation += 0.02;
            
            // 检查陨石是否超出屏幕
            if (meteor.y > this.canvas.height + meteor.size) {
                this.meteors.splice(i, 1);
                this.generateMeteors(1);
                continue;
            }
            
            // 检查子弹碰撞
            for (let j = this.bullets.length - 1; j >= 0; j--) {
                const bullet = this.bullets[j];
                const dx = bullet.x - meteor.x;
                const dy = bullet.y - meteor.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < meteor.size + bullet.size) {
                    // 创建爆炸效果
                    this.createExplosion(meteor.x, meteor.y, meteor.size);
                    // 移除陨石和子弹
                    this.meteors.splice(i, 1);
                    this.bullets.splice(j, 1);
                    // 增加分数
                    this.ship.score += 10;
                    // 生成新的陨石
                    this.generateMeteors(1);
                    break;
                }
            }
        }
        
        // 更新爆炸效果
        for (let i = this.explosions.length - 1; i >= 0; i--) {
            const explosion = this.explosions[i];
            explosion.x += explosion.vx;
            explosion.y += explosion.vy;
            explosion.life -= 0.02;
            
            if (explosion.life <= 0) {
                this.explosions.splice(i, 1);
            }
        }
    }
    
    // 绘制游戏画面
    draw() {
        // 清空画布
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制变形金刚风格的飞船
        this.drawTransformerShip();
        
        // 绘制陨石
        this.meteors.forEach(meteor => {
            this.ctx.save();
            this.ctx.translate(meteor.x, meteor.y);
            this.ctx.rotate(meteor.rotation);
            
            // 绘制不规则的陨石形状
            this.ctx.fillStyle = '#8B4513';
            this.ctx.beginPath();
            for (let i = 0; i < 8; i++) {
                const angle = (Math.PI * 2 / 8) * i;
                const radius = meteor.size * (0.8 + Math.sin(i * 1.5) * 0.2);
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;
                if (i === 0) {
                    this.ctx.moveTo(x, y);
                } else {
                    this.ctx.lineTo(x, y);
                }
            }
            this.ctx.closePath();
            this.ctx.fill();
            
            // 添加陨石表面细节
            this.ctx.strokeStyle = '#654321';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            
            this.ctx.restore();
        });
        
        // 绘制爆炸效果
        this.explosions.forEach(explosion => {
            this.ctx.fillStyle = explosion.color;
            this.ctx.globalAlpha = explosion.life;
            this.ctx.beginPath();
            this.ctx.arc(explosion.x, explosion.y, explosion.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
        this.ctx.globalAlpha = 1.0;
        
        // 绘制子弹
        this.bullets.forEach(bullet => {
            this.ctx.fillStyle = bullet.color;
            this.ctx.beginPath();
            this.ctx.arc(bullet.x, bullet.y, bullet.size, 0, Math.PI * 2);
            this.ctx.fill();
            
            // 添加子弹光晕效果
            this.ctx.beginPath();
            this.ctx.arc(bullet.x, bullet.y, bullet.size * 2, 0, Math.PI * 2);
            const gradient = this.ctx.createRadialGradient(
                bullet.x, bullet.y, bullet.size,
                bullet.x, bullet.y, bullet.size * 2
            );
            gradient.addColorStop(0, 'rgba(0, 255, 255, 0.3)');
            gradient.addColorStop(1, 'rgba(0, 255, 255, 0)');
            this.ctx.fillStyle = gradient;
            this.ctx.fill();
        });
        
        // 绘制分数
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '20px Arial';
        this.ctx.fillText(`分数: ${this.ship.score}`, 10, 30);
    }
    
    // 添加变形金刚风格的飞船绘制方法
    drawTransformerShip() {
        this.ctx.save();
        this.ctx.translate(this.ship.x, this.ship.y);

        // 主体装甲
        this.ctx.fillStyle = '#4169E1';  // 深蓝色主体
        this.ctx.beginPath();
        this.ctx.moveTo(0, -30);         // 顶部尖端
        this.ctx.lineTo(-20, -10);       // 左上
        this.ctx.lineTo(-15, 10);        // 左中
        this.ctx.lineTo(-25, 30);        // 左下
        this.ctx.lineTo(25, 30);         // 右下
        this.ctx.lineTo(15, 10);         // 右中
        this.ctx.lineTo(20, -10);        // 右上
        this.ctx.closePath();
        this.ctx.fill();

        // 机械细节线��
        this.ctx.strokeStyle = '#00FFFF'; // 青色线条
        this.ctx.lineWidth = 2;
        
        // 驾驶舱
        this.ctx.fillStyle = '#FFD700';   // 金色驾驶舱
        this.ctx.beginPath();
        this.ctx.moveTo(0, -20);
        this.ctx.lineTo(-8, -5);
        this.ctx.lineTo(8, -5);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();

        // 左侧装甲板
        this.ctx.fillStyle = '#1E90FF';   // 亮蓝色装甲
        this.ctx.beginPath();
        this.ctx.moveTo(-20, -10);
        this.ctx.lineTo(-30, 0);
        this.ctx.lineTo(-15, 10);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();

        // 右侧装甲板
        this.ctx.beginPath();
        this.ctx.moveTo(20, -10);
        this.ctx.lineTo(30, 0);
        this.ctx.lineTo(15, 10);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();

        // 引擎喷射效果
        this.ctx.fillStyle = '#FFA500';   // 橙色引擎火焰
        this.ctx.beginPath();
        this.ctx.moveTo(-15, 30);
        this.ctx.lineTo(-10, 40 + Math.random() * 10);  // 随机火焰长度
        this.ctx.lineTo(10, 40 + Math.random() * 10);
        this.ctx.lineTo(15, 30);
        this.ctx.closePath();
        this.ctx.fill();

        // 机械细节装饰
        this.ctx.strokeStyle = '#00FFFF';
        this.ctx.beginPath();
        this.ctx.moveTo(-15, 0);
        this.ctx.lineTo(15, 0);
        this.ctx.moveTo(-10, 10);
        this.ctx.lineTo(10, 10);
        this.ctx.stroke();

        this.ctx.restore();
    }
    
    // 游戏循环
    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
} 