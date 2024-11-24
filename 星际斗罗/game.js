class SoundManager {
    constructor() {
        this.sounds = {
            transform: this.createOscillator('transform'),
            robotShoot: this.createOscillator('robotShoot'),
            vehicleShoot: this.createOscillator('vehicleShoot'),
            explosion: this.createOscillator('explosion'),
            background: this.createOscillator('background'),
            collect: this.createOscillator('collect'),
            bombExplode: this.createOscillator('bombExplode')
        };
    }

    createOscillator(type) {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        return {
            play: () => {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);

                switch(type) {
                    case 'transform':
                        // 变形音效：从高到低的滑音
                        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
                        oscillator.frequency.linearRampToValueAtTime(200, audioContext.currentTime + 0.3);
                        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                        gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.3);
                        oscillator.start();
                        oscillator.stop(audioContext.currentTime + 0.3);
                        break;

                    case 'robotShoot':
                        // 机器人射击：短促的高音
                        oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
                        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
                        gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.1);
                        oscillator.start();
                        oscillator.stop(audioContext.currentTime + 0.1);
                        break;

                    case 'vehicleShoot':
                        // 车辆射击：三连发音效
                        oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
                        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
                        gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.05);
                        oscillator.start();
                        oscillator.stop(audioContext.currentTime + 0.05);
                        
                        // 延迟播放第二和第三发
                        setTimeout(() => this.createOscillator('vehicleShoot').play(), 50);
                        setTimeout(() => this.createOscillator('vehicleShoot').play(), 100);
                        break;

                    case 'explosion':
                        // 爆炸音效：低频噪音
                        oscillator.type = 'sawtooth';
                        oscillator.frequency.setValueAtTime(100, audioContext.currentTime);
                        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                        gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.3);
                        oscillator.start();
                        oscillator.stop(audioContext.currentTime + 0.3);
                        break;

                    case 'background':
                        // 背景音：持续的低音
                        oscillator.type = 'sine';
                        oscillator.frequency.setValueAtTime(80, audioContext.currentTime);
                        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                        oscillator.start();
                        return { oscillator, gainNode }; // 返回节点以便后续控制

                    case 'collect':
                        // 收集星星的音效：上升的音调
                        oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
                        oscillator.frequency.linearRampToValueAtTime(800, audioContext.currentTime + 0.1);
                        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
                        gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.1);
                        oscillator.start();
                        oscillator.stop(audioContext.currentTime + 0.1);
                        break;

                    case 'bombExplode':
                        // 炸弹爆炸音效：低沉的爆炸声
                        oscillator.type = 'sawtooth';
                        oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
                        oscillator.frequency.linearRampToValueAtTime(50, audioContext.currentTime + 0.5);
                        gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
                        gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.5);
                        oscillator.start();
                        oscillator.stop(audioContext.currentTime + 0.5);
                        break;
                }
            }
        };
    }
}

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.player = {
            x: 100,
            y: 300,
            width: 60,
            height: 60,
            speed: 5,
            isRobot: true,
            health: 100,
            transformCooldown: 0,
            bombs: 0  // 添加炸弹计数
        };
        this.bullets = [];
        this.enemies = [];
        this.keys = {};
        
        this.colors = {
            robot: {
                primary: '#3498db',    // 机器人主色调：蓝色
                secondary: '#2980b9',  // 机器人次色调：深蓝
                details: '#ecf0f1'     // 细节：白色
            },
            vehicle: {
                primary: '#e74c3c',    // 车辆主色调：红色
                secondary: '#c0392b',  // 车辆次色调：深红
                details: '#f1c40f'     // 细节：黄色
            },
            bullet: {
                robot: '#3498db',      // 机器人子弹：蓝色
                vehicle: '#e74c3c'     // 车辆子弹：红色
            },
            enemy: {
                primary: '#8e44ad',    // 敌人主色调：紫色
                secondary: '#6c3483'   // 敌人次色调：深紫
            },
            star: {
                primary: '#f1c40f',    // 星星颜色：金黄色
                glow: '#f39c12'        // 星星光晕：橙色
            },
            bomb: {
                primary: '#e74c3c',    // 炸弹颜色：红色
                explosion: '#f1c40f'    // 爆炸颜色：黄色
            }
        };
        
        this.soundManager = new SoundManager();
        
        this.backgroundMusic = null;
        
        this.stars = [];
        
        this.bombs = [];
        
        this.setupEventListeners();
        this.gameLoop();
    }

    setupEventListeners() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });
        
        window.addEventListener('keypress', (e) => {
            if (e.key === ' ') {
                this.shoot();
            }
            if (e.key === 't' && this.player.transformCooldown <= 0) {
                this.transform();
            }
            if (e.key === 'q' && this.player.bombs > 0) {
                this.launchBomb();
            }
        });
        
        window.addEventListener('click', () => {
            if (!this.backgroundMusic) {
                const music = this.soundManager.sounds.background.play();
                this.backgroundMusic = music;
            }
        }, { once: true });
    }

    transform() {
        this.player.isRobot = !this.player.isRobot;
        if (this.player.isRobot) {
            this.player.speed = 5;
            this.player.height = 60;
        } else {
            this.player.speed = 8;
            this.player.height = 40;
        }
        this.player.transformCooldown = 30;
        
        this.soundManager.sounds.transform.play();
    }

    shoot() {
        const bulletY = this.player.y + this.player.height / 2;
        const bulletType = this.player.isRobot ? 'normal' : 'rapid';
        
        if (bulletType === 'normal') {
            this.bullets.push({
                x: this.player.x + this.player.width,
                y: bulletY,
                width: 20,
                height: 8,
                speed: 12,
                damage: 20
            });
            this.soundManager.sounds.robotShoot.play();
        } else {
            for (let i = 0; i < 3; i++) {
                this.bullets.push({
                    x: this.player.x + this.player.width,
                    y: bulletY - 10 + i * 10,
                    width: 15,
                    height: 6,
                    speed: 15,
                    damage: 10
                });
            }
            this.soundManager.sounds.vehicleShoot.play();
        }
    }

    launchBomb() {
        this.player.bombs--;
        this.bombs.push({
            x: this.player.x + this.player.width,
            y: this.player.y + this.player.height / 2,
            width: 20,
            height: 20,
            speed: 8,
            radius: 100  // 爆炸半径
        });
    }

    update() {
        if (this.keys['ArrowUp']) {
            this.player.y -= this.player.speed;
        }
        if (this.keys['ArrowDown']) {
            this.player.y += this.player.speed;
        }
        if (this.keys['ArrowLeft']) {
            this.player.x -= this.player.speed;
        }
        if (this.keys['ArrowRight']) {
            this.player.x += this.player.speed;
        }

        this.bullets.forEach((bullet, index) => {
            bullet.x += bullet.speed;
            if (bullet.x > this.canvas.width) {
                this.bullets.splice(index, 1);
            }
        });

        if (Math.random() < 0.02) {
            this.enemies.push({
                x: this.canvas.width,
                y: Math.random() * (this.canvas.height - 50),
                width: 40,
                height: 40,
                speed: 3
            });
        }

        this.enemies.forEach((enemy, index) => {
            enemy.x -= enemy.speed;
            if (enemy.x < 0) {
                this.enemies.splice(index, 1);
            }
        });

        this.checkCollisions();

        if (this.player.transformCooldown > 0) {
            this.player.transformCooldown--;
        }

        this.player.x = Math.max(0, Math.min(this.player.x, this.canvas.width - this.player.width));
        this.player.y = Math.max(0, Math.min(this.player.y, this.canvas.height - this.player.height));

        // 生成星星
        if (Math.random() < 0.01) {  // 1%的概率生成星星
            this.stars.push({
                x: this.canvas.width,
                y: Math.random() * (this.canvas.height - 20),
                width: 20,
                height: 20,
                speed: 2,
                rotation: 0
            });
        }

        // 更新星星
        this.stars.forEach((star, index) => {
            star.x -= star.speed;
            star.rotation += 0.05;  // 旋转效果
            if (star.x < 0) {
                this.stars.splice(index, 1);
            }
        });

        // 更新炸弹
        this.bombs.forEach((bomb, bombIndex) => {
            bomb.x += bomb.speed;
            if (bomb.x > this.canvas.width) {
                this.bombs.splice(bombIndex, 1);
            }
        });

        // 检查星星收集
        this.checkStarCollection();
        
        // 检查炸弹爆炸
        this.checkBombExplosions();
    }

    checkCollisions() {
        this.bullets.forEach((bullet, bulletIndex) => {
            this.enemies.forEach((enemy, enemyIndex) => {
                if (this.isColliding(bullet, enemy)) {
                    this.bullets.splice(bulletIndex, 1);
                    this.enemies.splice(enemyIndex, 1);
                    this.soundManager.sounds.explosion.play();
                }
            });
        });
    }

    isColliding(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }

    checkStarCollection() {
        this.stars.forEach((star, starIndex) => {
            if (this.isColliding(this.player, star)) {
                this.stars.splice(starIndex, 1);
                this.player.bombs++;  // 获得炸弹
                this.soundManager.sounds.collect.play();
            }
        });
    }

    checkBombExplosions() {
        this.bombs.forEach((bomb, bombIndex) => {
            this.enemies.forEach((enemy, enemyIndex) => {
                const dx = bomb.x - enemy.x;
                const dy = bomb.y - enemy.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < bomb.radius) {
                    this.enemies.splice(enemyIndex, 1);
                    this.bombs.splice(bombIndex, 1);
                    this.soundManager.sounds.bombExplode.play();
                    this.createExplosionEffect(bomb.x, bomb.y);
                }
            });
        });
    }

    createExplosionEffect(x, y) {
        // 创建爆炸动画效果
        const explosion = {
            x: x,
            y: y,
            radius: 10,
            maxRadius: 100,
            alpha: 1
        };
        
        const animate = () => {
            this.ctx.beginPath();
            this.ctx.arc(explosion.x, explosion.y, explosion.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(241, 196, 15, ${explosion.alpha})`;
            this.ctx.fill();
            
            explosion.radius += 5;
            explosion.alpha -= 0.05;
            
            if (explosion.alpha > 0) {
                requestAnimationFrame(animate);
            }
        };
        
        animate();
    }

    draw() {
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.player.isRobot) {
            this.drawRobot();
        } else {
            this.drawVehicle();
        }

        this.bullets.forEach(bullet => {
            this.drawBullet(bullet);
        });

        this.enemies.forEach(enemy => {
            this.drawEnemy(enemy);
        });

        // 在绘制完其他内容后，添加按键提示
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '16px Arial';
        
        // 在右上角显示操作说明
        const instructions = [
            '操作说明:',
            '↑↓←→ : 移动',
            'T : 变形',
            '空格 : 射击',
            'Q : 发射炸弹'
        ];
        
        instructions.forEach((text, index) => {
            this.ctx.fillText(text, this.canvas.width - 150, 30 + index * 25);
        });

        // 保持原有的变形冷却和炸弹数量显示
        if (this.player.transformCooldown > 0) {
            this.ctx.fillText(`变形冷却: ${this.player.transformCooldown}`, 10, 30);
        }
        this.ctx.fillText(`炸弹: ${this.player.bombs}`, 10, 50);
    }

    drawRobot() {
        const {x, y, width, height} = this.player;
        const colors = this.colors.robot;

        this.ctx.fillStyle = colors.primary;
        this.ctx.fillRect(x, y, width, height);

        this.ctx.fillStyle = colors.secondary;
        this.ctx.fillRect(x + width * 0.3, y - height * 0.2, width * 0.4, height * 0.3);

        this.ctx.fillStyle = colors.details;
        this.ctx.fillRect(x + width * 0.4, y - height * 0.15, width * 0.1, height * 0.1);
        this.ctx.fillRect(x + width * 0.6, y - height * 0.15, width * 0.1, height * 0.1);

        this.ctx.fillStyle = colors.secondary;
        this.ctx.fillRect(x - width * 0.1, y + height * 0.2, width * 0.2, height * 0.4);
        this.ctx.fillRect(x + width * 0.9, y + height * 0.2, width * 0.2, height * 0.4);
    }

    drawVehicle() {
        const {x, y, width, height} = this.player;
        const colors = this.colors.vehicle;

        this.ctx.fillStyle = colors.primary;
        this.ctx.fillRect(x, y + height * 0.3, width, height * 0.4);

        this.ctx.beginPath();
        this.ctx.fillStyle = colors.secondary;
        this.ctx.moveTo(x + width * 0.3, y + height * 0.3);
        this.ctx.lineTo(x + width * 0.7, y + height * 0.3);
        this.ctx.lineTo(x + width * 0.6, y);
        this.ctx.lineTo(x + width * 0.4, y);
        this.ctx.closePath();
        this.ctx.fill();

        this.ctx.fillStyle = colors.details;
        this.ctx.beginPath();
        this.ctx.arc(x + width * 0.2, y + height * 0.7, height * 0.15, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.arc(x + width * 0.8, y + height * 0.7, height * 0.15, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawBullet(bullet) {
        const color = this.player.isRobot ? 
            this.colors.bullet.robot : 
            this.colors.bullet.vehicle;

        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.arc(bullet.x, bullet.y, bullet.height/2, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawEnemy(enemy) {
        const colors = this.colors.enemy;

        this.ctx.fillStyle = colors.primary;
        this.ctx.beginPath();
        this.ctx.moveTo(enemy.x, enemy.y + enemy.height/2);
        this.ctx.lineTo(enemy.x + enemy.width/2, enemy.y);
        this.ctx.lineTo(enemy.x + enemy.width, enemy.y + enemy.height/2);
        this.ctx.lineTo(enemy.x + enemy.width/2, enemy.y + enemy.height);
        this.ctx.closePath();
        this.ctx.fill();

        this.ctx.fillStyle = colors.secondary;
        this.ctx.beginPath();
        this.ctx.arc(enemy.x + enemy.width * 0.5, enemy.y + enemy.height * 0.5, 
                    enemy.width * 0.2, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawStar(star) {
        this.ctx.save();
        this.ctx.translate(star.x + star.width/2, star.y + star.height/2);
        this.ctx.rotate(star.rotation);
        
        this.ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            this.ctx.lineTo(
                Math.cos((18 + i * 72) * Math.PI / 180) * star.width/2,
                Math.sin((18 + i * 72) * Math.PI / 180) * star.height/2
            );
            this.ctx.lineTo(
                Math.cos((54 + i * 72) * Math.PI / 180) * star.width/4,
                Math.sin((54 + i * 72) * Math.PI / 180) * star.height/4
            );
        }
        this.ctx.closePath();
        
        this.ctx.fillStyle = this.colors.star.primary;
        this.ctx.fill();
        this.ctx.restore();
    }

    drawBomb(bomb) {
        this.ctx.fillStyle = this.colors.bomb.primary;
        this.ctx.beginPath();
        this.ctx.arc(bomb.x, bomb.y, bomb.width/2, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 绘制导火线
        this.ctx.beginPath();
        this.ctx.moveTo(bomb.x - bomb.width/2, bomb.y - bomb.height/2);
        this.ctx.lineTo(bomb.x - bomb.width, bomb.y - bomb.height);
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.stroke();
    }

    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

window.onload = () => {
    new Game();
}; 