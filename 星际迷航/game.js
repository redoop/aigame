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
        
        // 初始化控制状态
        this.controls = {
            left: false,
            right: false,
            up: false,
            down: false,
            shoot: false
        };
        
        // 设置按钮控制
        this.setupControls();
        
        // 生成初始敌人
        this.generateEnemies();
        
        // 添加爆炸效果数组
        this.explosions = [];
        this.meteors = [];
        
        // 生成初始陨石
        this.generateMeteors(5);
        
        // 开始游戏循环
        this.gameLoop();
    }
    
    // 设置控制
    setupControls() {
        // 方向按钮
        ['Up', 'Down', 'Left', 'Right'].forEach(dir => {
            const btn = document.getElementById(`btn${dir}`);
            if (btn) {
                btn.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    this.controls[dir.toLowerCase()] = true;
                });
                btn.addEventListener('touchend', (e) => {
                    e.preventDefault();
                    this.controls[dir.toLowerCase()] = false;
                });
            }
        });
        
        // 射击按钮
        const shootBtn = document.getElementById('btnShoot');
        if (shootBtn) {
            shootBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.shoot();
            });
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
    }
    
    // 更新游戏状态
    update() {
        // 更新飞船位置
        if (this.controls.left) this.ship.x -= this.ship.speed;
        if (this.controls.right) this.ship.x += this.ship.speed;
        if (this.controls.up) this.ship.y -= this.ship.speed;
        if (this.controls.down) this.ship.y += this.ship.speed;
        
        // 限制飞船在画布内
        this.ship.x = Math.max(20, Math.min(this.canvas.width - 20, this.ship.x));
        this.ship.y = Math.max(20, Math.min(this.canvas.height - 20, this.ship.y));
        
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
    
    // 游戏循环
    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
} 