class SpaceGame {
    constructor() {
        // 初始化画布
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // 设置画布大小为设备屏幕大小
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // 初始化飞船 - 位置改为底部20%处
        this.ship = {
            x: this.canvas.width / 2,
            y: this.canvas.height * 0.8,
            speed: 5,
            score: 0,
            size: this.calculateGameScale() * 30 // 飞船大小根据屏幕缩放
        };
        
        // 初始化游戏对象
        this.stars = [];
        this.meteors = [];
        this.bullets = [];
        
        // 初始化控制
        this.keys = {};
        this.touchStartX = null;
        this.touchStartY = null;
        this.isShooting = false;
        
        // 移除键盘事件监听
        // 添加触摸事件监听
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e));
        this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e));
        
        // 添加自动射击
        setInterval(() => {
            if (this.isShooting) {
                this.shoot();
            }
        }, 500); // 每500ms射击一次
        
        // 生成初始星星和陨石
        this.generateStars();
        this.generateMeteors(5);
        
        // 添加音频上下文
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (error) {
            console.warn('无法创建音频上下文:', error);
            this.audioContext = null;
        }
        
        // 添加生日歌音符数据
        this.birthdaySong = [
            { note: 'C4', duration: 0.75, frequency: 262 },  // 祝
            { note: 'C4', duration: 0.25, frequency: 262 },  // 你
            { note: 'D4', duration: 1.0, frequency: 294 },   // 生
            { note: 'C4', duration: 1.0, frequency: 262 },   // 日
            { note: 'F4', duration: 1.0, frequency: 349 },   // 快
            { note: 'E4', duration: 2.0, frequency: 330 },   // 乐
            
            { note: 'C4', duration: 0.75, frequency: 262 },  // 祝
            { note: 'C4', duration: 0.25, frequency: 262 },  // 你
            { note: 'D4', duration: 1.0, frequency: 294 },   // 生
            { note: 'C4', duration: 1.0, frequency: 262 },   // 日
            { note: 'G4', duration: 1.0, frequency: 392 },   // 快
            { note: 'F4', duration: 2.0, frequency: 349 },   // 乐
            
            { note: 'C4', duration: 0.75, frequency: 262 },  // 
            { note: 'C4', duration: 0.25, frequency: 262 },  // 你
            { note: 'C5', duration: 1.0, frequency: 523 },   // 生
            { note: 'A4', duration: 1.0, frequency: 440 },   // 日
            { note: 'F4', duration: 1.0, frequency: 349 },   // 快
            { note: 'E4', duration: 1.0, frequency: 330 },   // 乐
            { note: 'D4', duration: 2.0, frequency: 294 },   // 啊
            
            { note: 'Bb4', duration: 0.75, frequency: 466 }, // 祝
            { note: 'Bb4', duration: 0.25, frequency: 466 }, // 你
            { note: 'A4', duration: 1.0, frequency: 440 },   // 生
            { note: 'F4', duration: 1.0, frequency: 349 },   // 日
            { note: 'G4', duration: 1.0, frequency: 392 },   // 快
            { note: 'F4', duration: 2.0, frequency: 349 }    // 乐
        ];

        // 添加播放按钮监听
        window.addEventListener('keydown', (e) => {
            if (e.code === 'KeyB') {  // 按B键播放生日歌
                this.playBirthdaySong();
            }
        });
        
        // 添加敌对飞船数组
        this.enemies = [];
        this.enemyBullets = [];
        
        // 生成初始敌机
        this.generateEnemies(3);  // 生成3个敌机
        
        // 开始游戏循环
        this.gameLoop();
    }
    
    // 生成星星
    generateStars() {
        for (let i = 0; i < 50; i++) {
            this.stars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 2 + 1,
                color: '#ffffff'
            });
        }
    }
    
    // 生成陨石
    generateMeteors(count) {
        const meteorSize = this.gameScale * 20; // 陨石大小根据屏幕缩放
        for (let i = 0; i < count; i++) {
            this.meteors.push({
                x: Math.random() * this.canvas.width,
                y: -meteorSize,
                size: meteorSize + Math.random() * (meteorSize),
                speed: (Math.random() * 2 + 1) * this.gameScale,
                color: '#FF6B6B'
            });
        }
    }
    
    // 射击
    shoot() {
        const bulletSize = this.gameScale * 5; // 子弹大小根据屏幕缩放
        this.bullets.push({
            x: this.ship.x,
            y: this.ship.y,
            speed: 10 * this.gameScale,
            size: bulletSize,
            color: '#00ff00'
        });
        
        this.playSound('shoot');
    }
    
    // 添加音效播放方法
    playSound(type) {
        if (!this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        switch(type) {
            case 'shoot':
                // 射击音效 - 高音短促
                oscillator.frequency.value = 880;
                oscillator.type = 'square';
                gainNode.gain.value = 0.1;
                oscillator.start();
                oscillator.stop(this.audioContext.currentTime + 0.1);
                break;

            case 'explosion':
                // 爆炸音效 - 低音噪声
                oscillator.frequency.value = 100;
                oscillator.type = 'sawtooth';
                gainNode.gain.value = 0.2;
                oscillator.start();
                oscillator.stop(this.audioContext.currentTime + 0.3);
                break;

            case 'engine':
                // 引擎音效 - 持续的低沉声音
                oscillator.frequency.value = 50;
                oscillator.type = 'sine';
                gainNode.gain.value = 0.05;
                oscillator.start();
                oscillator.stop(this.audioContext.currentTime + 0.1);
                break;

            case 'enemyShoot':
                oscillator.frequency.value = 440;
                oscillator.type = 'square';
                gainNode.gain.value = 0.08;
                oscillator.start();
                oscillator.stop(this.audioContext.currentTime + 0.1);
                break;

            case 'hit':
                oscillator.frequency.value = 150;
                oscillator.type = 'sawtooth';
                gainNode.gain.value = 0.15;
                oscillator.start();
                oscillator.stop(this.audioContext.currentTime + 0.2);
                break;
        }
    }
    
    // 更新游戏状态
    update() {
        // 更新子弹
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            this.bullets[i].y -= this.bullets[i].speed;
            if (this.bullets[i].y < 0) {
                this.bullets.splice(i, 1);
            }
        }
        
        // 更新陨石
        for (let i = this.meteors.length - 1; i >= 0; i--) {
            let meteor = this.meteors[i];
            meteor.y += meteor.speed;
            
            // 检查子弹碰撞
            for (let j = this.bullets.length - 1; j >= 0; j--) {
                let bullet = this.bullets[j];
                let dx = meteor.x - bullet.x;
                let dy = meteor.y - bullet.y;
                let distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < meteor.size + bullet.size) {
                    this.meteors.splice(i, 1);
                    this.bullets.splice(j, 1);
                    this.ship.score += 10;
                    this.generateMeteors(1);
                    // 播放爆炸音效
                    this.playSound('explosion');
                    break;
                }
            }
            
            if (meteor.y > this.canvas.height + meteor.size) {
                this.meteors.splice(i, 1);
                this.generateMeteors(1);
            }
        }
        
        // 更新星星
        this.stars.forEach(star => {
            star.y += 1;
            if (star.y > this.canvas.height) {
                star.y = 0;
                star.x = Math.random() * this.canvas.width;
            }
        });
        
        // 修改引擎音效触发条件
        if (this.touchStartX !== null || this.touchStartY !== null) {
            this.playSound('engine');
        }
        
        // 更新敌机
        this.updateEnemies();
        
        // 更新敌机子弹
        this.updateEnemyBullets();
    }
    
    // 绘制游戏画面
    draw() {
        // 清空画布
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制星星
        this.stars.forEach(star => {
            this.ctx.fillStyle = star.color;
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
        
        // 绘制飞船
        this.drawTransformerShip();
        
        // 绘制子弹
        this.bullets.forEach(bullet => {
            this.ctx.fillStyle = bullet.color;
            this.ctx.beginPath();
            this.ctx.arc(bullet.x, bullet.y, bullet.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
        
        // 绘制陨石
        this.meteors.forEach(meteor => {
            this.ctx.fillStyle = meteor.color;
            this.ctx.beginPath();
            this.ctx.arc(meteor.x, meteor.y, meteor.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
        
        // 绘制敌机
        this.enemies.forEach(enemy => {
            this.drawEnemy(enemy);
        });

        // 绘制敌机子弹
        this.enemyBullets.forEach(bullet => {
            this.ctx.fillStyle = bullet.color;
            this.ctx.beginPath();
            this.ctx.arc(bullet.x, bullet.y, bullet.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
        
        // 调整分数显示大小和位置
        const fontSize = Math.max(16, Math.floor(20 * this.gameScale));
        this.ctx.fillStyle = '#FFF';
        this.ctx.font = `${fontSize}px Arial`;
        this.ctx.fillText(`分数: ${this.ship.score}`, 10, fontSize + 10);
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

        // 机械细节线条
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
    
    // 添加播放生日歌的方法
    playBirthdaySong() {
        if (!this.audioContext) return;
        
        let currentTime = this.audioContext.currentTime;
        const tempo = 1.5; // 控制播放速度

        this.birthdaySong.forEach((note) => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            // 设置音色
            oscillator.type = 'sine';
            oscillator.frequency.value = note.frequency;
            
            // 设置音量包络
            gainNode.gain.setValueAtTime(0, currentTime);
            gainNode.gain.linearRampToValueAtTime(0.3, currentTime + 0.1);
            gainNode.gain.linearRampToValueAtTime(0.2, currentTime + note.duration * tempo - 0.1);
            gainNode.gain.linearRampToValueAtTime(0, currentTime + note.duration * tempo);
            
            // 播放音符
            oscillator.start(currentTime);
            oscillator.stop(currentTime + note.duration * tempo);
            
            currentTime += note.duration * tempo;
        });
    }
    
    // 添加生成敌机的方法
    generateEnemies(count) {
        const enemySize = this.gameScale * 30; // 敌机大小根据屏幕缩放
        for (let i = 0; i < count; i++) {
            this.enemies.push({
                x: Math.random() * (this.canvas.width - enemySize * 2) + enemySize,
                y: Math.random() * (this.canvas.height * 0.3) + enemySize,
                width: enemySize,
                height: enemySize,
                speed: 2 * this.gameScale,
                direction: Math.random() < 0.5 ? -1 : 1,
                shootTimer: Math.random() * 100,
                color: '#ff4444'
            });
        }
    }

    // 敌机射击方法
    enemyShoot(enemy) {
        this.enemyBullets.push({
            x: enemy.x,
            y: enemy.y + 20,
            speed: 5,
            size: 4,
            color: '#ff0000'
        });
        this.playSound('enemyShoot');
    }

    // 添加敌机更新方法
    updateEnemies() {
        this.enemies.forEach((enemy, index) => {
            // 敌机移动
            enemy.x += enemy.speed * enemy.direction;
            
            // 碰到边界就改变方向
            if (enemy.x <= 20 || enemy.x >= this.canvas.width - 20) {
                enemy.direction *= -1;
            }

            // 随机射击
            enemy.shootTimer--;
            if (enemy.shootTimer <= 0) {
                this.enemyShoot(enemy);
                enemy.shootTimer = 100 + Math.random() * 50;  // 重置射击计时器
            }

            // 检查是否被玩家子弹击中
            for (let i = this.bullets.length - 1; i >= 0; i--) {
                let bullet = this.bullets[i];
                let dx = enemy.x - bullet.x;
                let dy = enemy.y - bullet.y;
                let distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < 25) {  // 击中判定
                    this.enemies.splice(index, 1);
                    this.bullets.splice(i, 1);
                    this.ship.score += 30;  // 击毁敌机得分
                    this.playSound('explosion');
                    this.generateEnemies(1);  // 生成新的敌机
                    break;
                }
            }
        });
    }

    // 添加敌机子弹更新方法
    updateEnemyBullets() {
        for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
            let bullet = this.enemyBullets[i];
            bullet.y += bullet.speed;

            // 检查是否击中玩家
            let dx = this.ship.x - bullet.x;
            let dy = this.ship.y - bullet.y;
            let distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 20) {
                this.ship.score -= 10;  // 被击中扣分
                this.enemyBullets.splice(i, 1);
                this.playSound('hit');
                continue;
            }

            // 移除出界的子弹
            if (bullet.y > this.canvas.height) {
                this.enemyBullets.splice(i, 1);
            }
        }
    }

    // 添加敌机绘制方法
    drawEnemy(enemy) {
        this.ctx.save();
        this.ctx.translate(enemy.x, enemy.y);

        // 敌机主体
        this.ctx.fillStyle = enemy.color;
        this.ctx.beginPath();
        this.ctx.moveTo(0, -15);
        this.ctx.lineTo(-15, 15);
        this.ctx.lineTo(15, 15);
        this.ctx.closePath();
        this.ctx.fill();

        // 敌机装饰
        this.ctx.strokeStyle = '#ff0000';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(-10, 0);
        this.ctx.lineTo(10, 0);
        this.ctx.stroke();

        // 敌机引擎
        this.ctx.fillStyle = '#ff8800';
        this.ctx.beginPath();
        this.ctx.moveTo(-8, 15);
        this.ctx.lineTo(-4, 20);
        this.ctx.lineTo(4, 20);
        this.ctx.lineTo(8, 15);
        this.ctx.closePath();
        this.ctx.fill();

        this.ctx.restore();
    }
    
    // 游戏循环
    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }

    // 添加触摸事件处理方法
    handleTouchStart(e) {
        e.preventDefault();
        const touch = e.touches[0];
        this.touchStartX = touch.clientX;
        this.touchStartY = touch.clientY;
        this.isShooting = true;
    }

    handleTouchMove(e) {
        e.preventDefault();
        if (!this.touchStartX || !this.touchStartY) return;
        
        const touch = e.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        const scale = this.canvas.width / rect.width;
        
        // 计算实际触摸位置
        const x = (touch.clientX - rect.left) * scale;
        const y = (touch.clientY - rect.top) * scale;
        
        // 平滑移动
        const dx = x - this.ship.x;
        const dy = y - this.ship.y;
        
        this.ship.x += dx * 0.2; // 添加平滑效果
        this.ship.y += dy * 0.2;
        
        // 限制飞船移动范围
        this.ship.x = Math.max(this.ship.size, Math.min(this.canvas.width - this.ship.size, this.ship.x));
        this.ship.y = Math.max(this.canvas.height * 0.2, Math.min(this.canvas.height * 0.9, this.ship.y));
    }

    handleTouchEnd(e) {
        e.preventDefault();
        this.touchStartX = null;
        this.touchStartY = null;
        this.isShooting = false;
    }

    // 添加画布大小调整方法
    resizeCanvas() {
        // 获取设备屏幕尺寸
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        
        // 设置画布大小
        this.canvas.width = screenWidth;
        this.canvas.height = screenHeight;
        
        // 重新计算游戏元素大小
        this.gameScale = this.calculateGameScale();
        
        // 确保飞船在调整大小后保持在可见区域内
        if (this.ship) {
            this.ship.x = Math.min(Math.max(this.ship.size, this.ship.x), this.canvas.width - this.ship.size);
            this.ship.y = Math.min(this.canvas.height * 0.8, this.canvas.height - this.ship.size);
            this.ship.size = this.gameScale * 30;
        }
    }

    // 添加游戏元素缩放计算方法
    calculateGameScale() {
        // 基于屏幕尺寸计算缩放比例
        const baseWidth = 800; // 基准宽度
        return Math.min(this.canvas.width / baseWidth, 1);
    }
} 