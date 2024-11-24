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
            score: 0,
            health: 100,
            maxHealth: 100
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
        
        // 添加星星数组
        this.stars = [];
        
        // 生成初始星星
        this.generateStars(10);
        
        // 添加星星收集音效
        this.sounds.collect = {
            oscillator: null,
            gainNode: null,
            frequency: 1500,
            type: 'sine',
            duration: 0.2,
            volume: 0.2
        };
        
        // 添加敌方子弹数组
        this.enemyBullets = [];
        
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
        const rect = this.canvas.getBoundingClientRect();
        
        // 记录初始触摸位置
        this.touchStartX = touch.clientX - rect.left;
        this.touchStartY = touch.clientY - rect.top;
        
        // 设置飞船初始位置为触摸位置
        this.ship.x = this.touchStartX;
        this.ship.y = this.touchStartY;
        
        // 开始射击
        this.isShooting = true;
        this.shoot();
        
        // 设置连续射击
        if (!this.shootInterval) {
            this.shootInterval = setInterval(() => {
                if (this.isShooting) {
                    this.shoot();
                }
            }, 200);
        }
        
        // 初始化音频（如果还未初始化）
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }
    
    // 处理触摸移动
    handleTouchMove(e) {
        e.preventDefault();
        if (!this.touchStartX || !this.touchStartY) return;
        
        const touch = e.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        
        // 计算当前触摸位置
        const currentX = touch.clientX - rect.left;
        const currentY = touch.clientY - rect.top;
        
        // 计算移动距离
        const deltaX = currentX - this.touchStartX;
        const deltaY = currentY - this.touchStartY;
        
        // 更新飞船位置
        this.ship.x += deltaX * 0.5;
        this.ship.y += deltaY * 0.5;
        
        // 限制飞船在画布范围内
        this.ship.x = Math.max(30, Math.min(this.canvas.width - 30, this.ship.x));
        this.ship.y = Math.max(30, Math.min(this.canvas.height - 30, this.ship.y));
        
        // 更新触摸位置
        this.touchStartX = currentX;
        this.touchStartY = currentY;
        
        // 播放引擎音效
        if (Math.abs(deltaX) > 1 || Math.abs(deltaY) > 1) {
            this.playSound('engine');
        }
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
                y: Math.random() * (this.canvas.height * 0.3),
                size: 25,
                speed: 2,
                shootTimer: Math.random() * 100,  // 射击计时器
                shootInterval: 100,  // 射击间隔
                health: 30,  // 敌人生命值
                direction: Math.random() < 0.5 ? -1 : 1  // 移动方向
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
        
        try {
            // 如果音频上下文被暂停，则恢复
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }
            
            const sound = this.sounds[type];
            const currentTime = this.audioContext.currentTime;
            
            // 创建音频节点
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            // 设置音频参数
            oscillator.type = sound.type;
            oscillator.frequency.setValueAtTime(sound.frequency, currentTime);
            
            // 设置音量
            gainNode.gain.setValueAtTime(0, currentTime);
            gainNode.gain.linearRampToValueAtTime(sound.volume, currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.001, currentTime + sound.duration);
            
            // 连接节点
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            // 播放音效
            oscillator.start(currentTime);
            oscillator.stop(currentTime + sound.duration);
        } catch (error) {
            console.warn('播放音效失败:', error);
        }
    }
    
    // 射击方法
    shoot() {
        if (!this.bullets) this.bullets = [];
        
        // 从飞船两侧发射子弹
        this.bullets.push({
            x: this.ship.x - 15,
            y: this.ship.y - 10,
            size: 4,
            speed: 10,
            color: '#00ffff'
        });
        
        this.bullets.push({
            x: this.ship.x + 15,
            y: this.ship.y - 10,
            size: 4,
            speed: 10,
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
    
    // 添加星星生成方法
    generateStars(count) {
        for (let i = 0; i < count; i++) {
            this.stars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: 15,
                rotation: Math.random() * Math.PI * 2,
                color: '#FFD700',
                healing: 10 + Math.random() * 20, // 恢复生命值的量
                speed: 1 + Math.random()
            });
        }
    }
    
    // 修改更新方法，添加星星相关逻辑
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
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            
            // 左右移动
            enemy.x += enemy.speed * enemy.direction;
            
            // 碰到边界就改变方向
            if (enemy.x <= enemy.size || enemy.x >= this.canvas.width - enemy.size) {
                enemy.direction *= -1;
            }
            
            // 更新射击计时器
            enemy.shootTimer++;
            if (enemy.shootTimer >= enemy.shootInterval) {
                this.enemyShoot(enemy);
                enemy.shootTimer = 0;
                enemy.shootInterval = 80 + Math.random() * 40; // 随机射击间隔
            }
            
            // 检查是否被子弹击中
            for (let j = this.bullets.length - 1; j >= 0; j--) {
                const bullet = this.bullets[j];
                const dx = bullet.x - enemy.x;
                const dy = bullet.y - enemy.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < enemy.size + bullet.size) {
                    enemy.health -= 10;
                    this.bullets.splice(j, 1);
                    
                    if (enemy.health <= 0) {
                        this.createExplosion(enemy.x, enemy.y, enemy.size);
                        this.enemies.splice(i, 1);
                        this.ship.score += 30;
                        break;
                    }
                }
            }
        }
        
        // 更新敌人子弹
        for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
            const bullet = this.enemyBullets[i];
            bullet.y += bullet.speed;
            
            // 移除出界的子弹
            if (bullet.y > this.canvas.height) {
                this.enemyBullets.splice(i, 1);
                continue;
            }
            
            // 检测是否击中玩家
            const dx = bullet.x - this.ship.x;
            const dy = bullet.y - this.ship.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < this.ship.size + bullet.size) {
                this.enemyBullets.splice(i, 1);
                this.ship.health -= 10;
                this.playSound('alert');
                
                // 创建受伤特效
                this.createHitEffect(this.ship.x, this.ship.y);
            }
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
        
        // 更新星星
        for (let i = this.stars.length - 1; i >= 0; i--) {
            const star = this.stars[i];
            
            // 星星缓慢下落
            star.y += star.speed;
            star.rotation += 0.02;
            
            // 如果星星超出屏幕底部，重置到顶部
            if (star.y > this.canvas.height) {
                star.y = -star.size;
                star.x = Math.random() * this.canvas.width;
            }
            
            // 检测与飞船的碰撞
            const dx = this.ship.x - star.x;
            const dy = this.ship.y - star.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < this.ship.size + star.size) {
                // 收集星星，恢复生命值
                this.ship.health = Math.min(this.ship.maxHealth, this.ship.health + star.healing);
                this.ship.score += 50;
                this.stars.splice(i, 1);
                this.generateStars(1); // 生成新的星星
                this.playSound('collect');
                
                // 创建收集特效
                this.createCollectEffect(star.x, star.y);
            }
        }
    }
    
    // 添加收集特效方法
    createCollectEffect(x, y) {
        const particleCount = 8;
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 / particleCount) * i;
            this.explosions.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * 3,
                vy: Math.sin(angle) * 3,
                size: 3,
                life: 1.0,
                color: '#FFD700'
            });
        }
    }
    
    // 添加敌人射击方法
    enemyShoot(enemy) {
        this.enemyBullets.push({
            x: enemy.x,
            y: enemy.y + enemy.size,
            size: 5,
            speed: 5,
            color: '#ff0000'
        });
    }
    
    // 添加受伤特效
    createHitEffect(x, y) {
        const particleCount = 8;
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 / particleCount) * i;
            this.explosions.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * 2,
                vy: Math.sin(angle) * 2,
                size: 2,
                life: 0.5,
                color: '#ff0000'
            });
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
        
        // 绘制星星
        this.stars.forEach(star => {
            this.ctx.save();
            this.ctx.translate(star.x, star.y);
            this.ctx.rotate(star.rotation);
            
            // 绘制五角星
            this.ctx.beginPath();
            for (let i = 0; i < 5; i++) {
                const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
                const x = Math.cos(angle) * star.size;
                const y = Math.sin(angle) * star.size;
                if (i === 0) {
                    this.ctx.moveTo(x, y);
                } else {
                    this.ctx.lineTo(x, y);
                }
            }
            this.ctx.closePath();
            this.ctx.fillStyle = star.color;
            this.ctx.fill();
            
            // 添加星星光晕
            const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, star.size * 1.5);
            gradient.addColorStop(0, 'rgba(255, 215, 0, 0.3)');
            gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
            this.ctx.fillStyle = gradient;
            this.ctx.fill();
            
            this.ctx.restore();
        });
        
        // 绘制生命值条
        const healthBarWidth = 200;
        const healthBarHeight = 10;
        const healthBarX = 10;
        const healthBarY = 50;
        
        // 背景
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);
        
        // 生命值
        const healthPercent = this.ship.health / this.ship.maxHealth;
        this.ctx.fillStyle = `hsl(${120 * healthPercent}, 100%, 50%)`;
        this.ctx.fillRect(healthBarX, healthBarY, healthBarWidth * healthPercent, healthBarHeight);
        
        // 生命值文字
        this.ctx.fillStyle = '#FFF';
        this.ctx.font = '14px Arial';
        this.ctx.fillText(`生命值: ${Math.floor(this.ship.health)}`, healthBarX, healthBarY - 5);
        
        // 绘制分数
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '20px Arial';
        this.ctx.fillText(`分数: ${this.ship.score}`, 10, 30);
        
        // 绘制敌人（炸鸡造型）
        this.enemies.forEach(enemy => {
            this.ctx.save();
            this.ctx.translate(enemy.x, enemy.y);
            
            // 绘制炸鸡主体
            this.ctx.fillStyle = '#FFD700';  // 金黄色
            this.ctx.beginPath();
            this.ctx.arc(0, 0, enemy.size, 0, Math.PI * 2);
            this.ctx.fill();
            
            // 绘制炸鸡外壳
            this.ctx.strokeStyle = '#8B4513';  // 棕色
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            for (let i = 0; i < 8; i++) {
                const angle = (Math.PI * 2 / 8) * i;
                const x = Math.cos(angle) * (enemy.size + 5);
                const y = Math.sin(angle) * (enemy.size + 5);
                this.ctx.lineTo(x, y);
            }
            this.ctx.closePath();
            this.ctx.stroke();
            
            // 绘制眼睛
            this.ctx.fillStyle = '#FF0000';  // 红色眼睛
            this.ctx.beginPath();
            this.ctx.arc(-8, -5, 4, 0, Math.PI * 2);
            this.ctx.arc(8, -5, 4, 0, Math.PI * 2);
            this.ctx.fill();
            
            // 绘制生命值条
            const healthBarWidth = enemy.size * 2;
            const healthBarHeight = 4;
            this.ctx.fillStyle = '#333';
            this.ctx.fillRect(-healthBarWidth/2, -enemy.size - 10, healthBarWidth, healthBarHeight);
            this.ctx.fillStyle = '#00ff00';
            this.ctx.fillRect(-healthBarWidth/2, -enemy.size - 10, 
                            healthBarWidth * (enemy.health / 30), healthBarHeight);
            
            this.ctx.restore();
        });
        
        // 绘制敌人子弹
        this.enemyBullets.forEach(bullet => {
            this.ctx.fillStyle = bullet.color;
            this.ctx.beginPath();
            this.ctx.arc(bullet.x, bullet.y, bullet.size, 0, Math.PI * 2);
            this.ctx.fill();
            
            // 添加子弹光晕效果
            const gradient = this.ctx.createRadialGradient(
                bullet.x, bullet.y, bullet.size,
                bullet.x, bullet.y, bullet.size * 2
            );
            gradient.addColorStop(0, 'rgba(255, 0, 0, 0.3)');
            gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(bullet.x, bullet.y, bullet.size * 2, 0, Math.PI * 2);
            this.ctx.fill();
        });
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

        // 机械细节线
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