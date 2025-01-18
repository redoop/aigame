class Game {
    constructor() {
        this.score = 0;
        this.health = 100;
        this.isPlaying = false;
        this.foodParticle = document.getElementById('food');
        this.scoreElement = document.getElementById('score');
        this.healthElement = document.getElementById('health');
        this.currentPathIndex = 0;
        
        // 定义食物类型
        this.foodTypes = {
            vegetable: { color: '#4CAF50', points: 10, health: 5, speed: 1 },
            fruit: { color: '#FF9800', points: 15, health: 8, speed: 1.2 },
            meat: { color: '#F44336', points: 20, health: 10, speed: 0.8 },
            junkFood: { color: '#9C27B0', points: 5, health: -5, speed: 1.5 }
        };

        // 定义病毒类型
        this.virusTypes = {
            common: { color: '#ff0000', damage: 5, speed: 1, points: 5 },
            fast: { color: '#ff00ff', damage: 3, speed: 2, points: 10 },
            strong: { color: '#800000', damage: 10, speed: 0.5, points: 15 }
        };

        // 消化路径
        this.digestivePath = [
            { organ: 'mouth', y: 80, action: this.digestInMouth.bind(this) },
            { organ: 'stomach', y: 200, action: this.digestInStomach.bind(this) },
            { organ: 'liver', y: 250, action: this.processInLiver.bind(this) },
            { organ: 'small-intestine', y: 350, action: this.absorbNutrients.bind(this) },
            { organ: 'large-intestine', y: 450, action: this.finalProcess.bind(this) },
            { organ: 'exit', y: 550 }
        ];

        // 添加器官描述
        this.organDescriptions = {
            '心脏': '心脏是人体的血液泵，负责将血液输送到全身',
            '肺部': '肺部负责呼吸，为血液提供氧气并排出二氧化碳',
            '肝脏': '肝脏负责解毒和产生胆汁，帮助消化脂肪',
            '胃': '胃负责消化食物，分泌胃酸帮助分解食物',
            '小肠': '小肠是主要的营养吸收场所，将食物转化为身体可用的营养',
            '大肠': '大肠负责吸收水分，处理食物残渣'
        };

        // 初始化音频上下文
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // 创建不同类型的音效
        this.sounds = {
            click: this.createClickSound(),
            digest: this.createDigestSound(),
            virus: this.createVirusSound(),
            gameOver: this.createGameOverSound()
        };

        this.setupOrganHighlighting();

        // 创建战斗机元素
        this.createFighter();
        
        // 添加鼠标移动监听
        document.addEventListener('mousemove', this.moveFighter.bind(this));

        // 添加器官音符频率
        this.organNotes = {
            '心脏': 523.25,  // C5
            '肺部': 587.33,  // D5
            '肝脏': 659.25,  // E5
            '胃': 698.46,    // F5
            '小肠': 783.99,  // G5
            '大肠': 880.00   // A5
        };
    }

    setupGameControls() {
        const foodButtons = document.createElement('div');
        foodButtons.className = 'food-buttons';
        Object.keys(this.foodTypes).forEach(type => {
            const btn = document.createElement('button');
            btn.textContent = this.getFoodName(type);
            btn.style.backgroundColor = this.foodTypes[type].color;
            btn.onclick = () => {
                if (this.isPlaying) {
                    this.startDigestion(type);
                }
            };
            foodButtons.appendChild(btn);
        });
        document.querySelector('.game-controls').appendChild(foodButtons);
    }

    getFoodName(type) {
        const names = {
            vegetable: '蔬菜',
            fruit: '水果',
            meat: '肉类',
            junkFood: '垃圾食品'
        };
        return names[type];
    }

    start() {
        this.isPlaying = true;
        this.score = 0;
        this.health = 100;
        this.updateUI();
        // 清除之前的食物按钮
        const oldFoodButtons = document.querySelector('.food-buttons');
        if (oldFoodButtons) {
            oldFoodButtons.remove();
        }
        // 初始化食物按钮
        this.setupGameControls();
        this.spawnVirus();
    }

    updateUI() {
        this.scoreElement.textContent = this.score;
        this.healthElement.textContent = this.health;
        
        // 根据健康值改变显示效果
        if (this.health < 30) {
            this.healthElement.style.color = '#ff0000';
        } else if (this.health < 60) {
            this.healthElement.style.color = '#ffa500';
        } else {
            this.healthElement.style.color = '#4CAF50';
        }
    }

    startDigestion(foodType) {
        if (!this.isPlaying || this.foodParticle.style.display === 'block') {
            return; // 如果已经有食物在消化，则不允许新的食物进入
        }
        
        this.currentFood = this.foodTypes[foodType];
        this.currentPathIndex = 0;
        this.foodParticle.style.display = 'block';
        this.foodParticle.style.backgroundColor = this.currentFood.color;
        this.foodParticle.style.top = '80px';
        this.foodParticle.style.left = '150px';
        this.moveFood();
    }

    moveFood() {
        if (!this.isPlaying) return;

        const currentPosition = this.digestivePath[this.currentPathIndex];
        this.foodParticle.style.top = currentPosition.y + 'px';

        // 执行当前器官的消化动作
        if (currentPosition.action) {
            currentPosition.action(this.currentFood);
        }

        this.currentPathIndex++;
        if (this.currentPathIndex >= this.digestivePath.length) {
            this.finishDigestion();
        } else {
            setTimeout(() => this.moveFood(), 1000 / this.currentFood.speed);
        }
    }

    // 各个器官的消化过程
    digestInMouth(food) {
        // 咀嚼动画效果
        this.foodParticle.style.animation = 'chew 0.5s ease-in-out';
    }

    digestInStomach(food) {
        this.sounds.digest();
        const stomach = document.querySelector('.stomach');
        stomach.classList.add('digesting');
        setTimeout(() => stomach.classList.remove('digesting'), 1000);
    }

    processInLiver(food) {
        // 如果是垃圾食品，会损失健康值
        if (food === this.foodTypes.junkFood) {
            this.health = Math.max(0, this.health - 5);
            this.updateUI();
        }
    }

    absorbNutrients(food) {
        // 增加分数和健康值
        this.score += food.points;
        this.health = Math.min(100, this.health + food.health);
        this.updateUI();
    }

    finalProcess(food) {
        // 最终处理
        if (this.health < 30) {
            this.gameOver();
        }
    }

    spawnVirus() {
        if (!this.isPlaying) return;

        const virusType = this.getRandomVirusType();
        const virus = this.createVirus(virusType);
        document.querySelector('.virus-container').appendChild(virus);

        // 病毒移动
        this.moveVirus(virus, virusType);

        setTimeout(() => this.spawnVirus(), 2000);
    }

    getRandomVirusType() {
        const types = Object.keys(this.virusTypes);
        return this.virusTypes[types[Math.floor(Math.random() * types.length)]];
    }

    createVirus(virusType) {
        const virus = document.createElement('div');
        virus.className = 'virus';
        virus.style.backgroundColor = virusType.color;
        
        // 设置病毒初始位置
        const organs = [
            {top: 80, left: 150},  // 头部
            {top: 200, left: 150}, // 胃
            {top: 250, left: 150}, // 肝脏
            {top: 350, left: 150}, // 小肠
            {top: 450, left: 150}  // 大肠
        ];
        
        const position = organs[Math.floor(Math.random() * organs.length)];
        virus.style.left = (position.left + (Math.random() * 60 - 30)) + 'px';
        virus.style.top = (position.top + (Math.random() * 60 - 30)) + 'px';

        virus.onclick = () => this.destroyVirus(virus, virusType);
        
        return virus;
    }

    moveVirus(virus, virusType) {
        const speed = virusType.speed;
        const angle = Math.random() * Math.PI * 2;
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;

        const interval = setInterval(() => {
            if (!this.isPlaying) {
                clearInterval(interval);
                return;
            }

            const left = parseFloat(virus.style.left);
            const top = parseFloat(virus.style.top);

            virus.style.left = (left + vx) + 'px';
            virus.style.top = (top + vy) + 'px';

            // 检查是否击中器官
            this.checkVirusCollision(virus, virusType);
        }, 50);
    }

    checkVirusCollision(virus, virusType) {
        // 如果病毒接触到器官，扣除健康值
        const organs = document.querySelectorAll('.organ');
        organs.forEach(organ => {
            if (this.isColliding(virus, organ)) {
                this.health = Math.max(0, this.health - virusType.damage);
                this.updateUI();
                this.destroyVirus(virus, virusType);
                
                if (this.health <= 0) {
                    this.gameOver();
                }
            }
        });
    }

    isColliding(virus, organ) {
        const virusRect = virus.getBoundingClientRect();
        const organRect = organ.getBoundingClientRect();
        
        return !(virusRect.right < organRect.left || 
                virusRect.left > organRect.right || 
                virusRect.bottom < organRect.top || 
                virusRect.top > organRect.bottom);
    }

    destroyVirus(virus, virusType) {
        this.sounds.virus();
        this.score += virusType.points;
        this.updateUI();
        this.createVirusDestroyEffect(virus);
        virus.remove();
    }

    gameOver() {
        this.sounds.gameOver();
        this.isPlaying = false;
        alert(`游戏结束！\n最终得分：${this.score}`);
        document.getElementById('start-game').textContent = '重新开始';
    }

    setupOrganHighlighting() {
        const organs = document.querySelectorAll('[data-organ]');
        organs.forEach(organ => {
            // 为每个器官设置基础颜色
            const baseColor = this.getOrganBaseColor(organ.getAttribute('data-organ'));
            organ.style.backgroundColor = baseColor;
            
            organ.addEventListener('click', () => {
                const organName = organ.getAttribute('data-organ');
                // 播放对应器官的音符
                const woodfishSound = this.createWoodfishSound(organName);
                woodfishSound();

                // 添加木鱼敲击效果和颜色变化
                organ.classList.add('organ-hit');
                organ.style.backgroundColor = this.getOrganActiveColor(organ.getAttribute('data-organ'));
                
                // 添加发光效果
                organ.style.boxShadow = '0 0 20px ' + this.getOrganGlowColor(organ.getAttribute('data-organ'));

                // 恢复原始状态
                setTimeout(() => {
                    organ.classList.remove('organ-hit');
                    organ.style.backgroundColor = baseColor;
                    organ.style.boxShadow = 'none';
                }, 200);

                // 显示器官信息
                const description = this.organDescriptions[organName];
                
                // 创建或更新提示框
                let tooltip = document.getElementById('organ-tooltip');
                if (!tooltip) {
                    tooltip = document.createElement('div');
                    tooltip.id = 'organ-tooltip';
                    document.body.appendChild(tooltip);
                }

                tooltip.textContent = `${organName}: ${description}`;
                tooltip.style.display = 'block';
                
                // 定位提示框
                const rect = organ.getBoundingClientRect();
                tooltip.style.left = `${rect.left}px`;
                tooltip.style.top = `${rect.top - tooltip.offsetHeight - 10}px`;

                // 3秒后隐藏提示框
                setTimeout(() => {
                    tooltip.style.display = 'none';
                }, 3000);
            });
        });
    }

    // 添加器官基础颜色
    getOrganBaseColor(organName) {
        const colors = {
            '心脏': '#ff6b6b',
            '肺部': '#ffa07a',
            '肝脏': '#8b4513',
            '胃': '#ff9f7f',
            '小肠': '#ffd700',
            '大肠': '#deb887'
        };
        return colors[organName] || '#ff9f7f';
    }

    // 添加器官激活时的颜色
    getOrganActiveColor(organName) {
        const colors = {
            '心脏': '#ff4444',
            '肺部': '#ff8855',
            '肝脏': '#a52a2a',
            '胃': '#ff7744',
            '小肠': '#ffc125',
            '大肠': '#cd853f'
        };
        return colors[organName] || '#ff7744';
    }

    // 添加器官发光颜色
    getOrganGlowColor(organName) {
        const colors = {
            '心脏': 'rgba(255, 105, 105, 0.6)',
            '肺部': 'rgba(255, 160, 122, 0.6)',
            '肝脏': 'rgba(139, 69, 19, 0.6)',
            '胃': 'rgba(255, 159, 127, 0.6)',
            '小肠': 'rgba(255, 215, 0, 0.6)',
            '大肠': 'rgba(222, 184, 135, 0.6)'
        };
        return colors[organName] || 'rgba(255, 159, 127, 0.6)';
    }

    finishDigestion() {
        // 完成一次消化过程
        this.score += this.currentFood.points;
        this.updateUI();
        this.foodParticle.style.display = 'none';
    }

    createVirusDestroyEffect(virus) {
        const effect = document.createElement('div');
        effect.style.position = 'absolute';
        effect.style.left = virus.style.left;
        effect.style.top = virus.style.top;
        effect.style.width = '30px';
        effect.style.height = '30px';
        effect.style.background = 'radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,0,0,0) 70%)';
        effect.style.animation = 'explode 0.5s ease-out forwards';
        document.querySelector('.virus-container').appendChild(effect);
        
        setTimeout(() => effect.remove(), 500);
    }

    // 创建点击音效
    createClickSound() {
        return () => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
            
            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + 0.1);
        };
    }

    // 创建消化音效
    createDigestSound() {
        return () => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.type = 'triangle';
            oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);
            oscillator.frequency.linearRampToValueAtTime(100, this.audioContext.currentTime + 0.2);
            
            gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
            
            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + 0.2);
        };
    }

    // 创建病毒消灭音效
    createVirusSound() {
        return () => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(600, this.audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(200, this.audioContext.currentTime + 0.1);
            
            gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
            
            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + 0.1);
        };
    }

    // 创建游戏结束音效
    createGameOverSound() {
        return () => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.type = 'sawtooth';
            oscillator.frequency.setValueAtTime(400, this.audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.5);
            
            gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
            
            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + 0.5);
        };
    }

    createFighter() {
        const fighter = document.createElement('div');
        fighter.className = 'fighter';
        fighter.innerHTML = `
            <svg width="40" height="40" viewBox="0 0 40 40">
                <!-- 木槌 -->
                <g class="mallet">
                    <rect x="15" y="2" width="6" height="20" fill="#8B4513" />
                    <rect x="12" y="2" width="12" height="8" fill="#A0522D" rx="2" />
                </g>
                <!-- 木鱼 -->
                <g class="woodfish">
                    <path d="M8 28 Q20 22 32 28 Q20 32 8 28" fill="#CD853F" />
                    <path d="M8 28 Q20 24 32 28" fill="none" stroke="#8B4513" stroke-width="1" />
                </g>
            </svg>
        `;
        document.body.appendChild(fighter);
        this.fighter = fighter;

        // 隐藏默认光标
        document.body.style.cursor = 'none';
    }

    moveFighter(e) {
        if (this.fighter) {
            this.fighter.style.left = (e.clientX - 20) + 'px';
            this.fighter.style.top = (e.clientY - 20) + 'px';
            
            // 当点击时添加敲击动画
            document.addEventListener('mousedown', () => {
                this.fighter.classList.add('hitting');
            });
            
            document.addEventListener('mouseup', () => {
                this.fighter.classList.remove('hitting');
            });
        }
    }

    // 添加木鱼音效
    createWoodfishSound(organName) {
        return () => {
            const frequency = this.organNotes[organName] || 523.25; // 默认 C5
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            // 木鱼的音色
            oscillator.type = 'triangle';
            oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
            
            // 音量包络
            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.5, this.audioContext.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
            
            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + 0.3);

            // 添加泛音
            this.addHarmonics(frequency);
        };
    }

    // 添加泛音来模拟木鱼的谐波
    addHarmonics(fundamental) {
        const harmonics = [2, 3, 4]; // 泛音序列
        harmonics.forEach((harmonic, index) => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.type = 'triangle';
            oscillator.frequency.setValueAtTime(fundamental * harmonic, this.audioContext.currentTime);
            
            // 泛音音量递减
            const volume = 0.2 / (index + 2);
            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
            
            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + 0.2);
        });
    }
}

class HumanBodyDrawer {
    constructor() {
        this.bodyCanvas = document.getElementById('bodyCanvas');
        this.skeletonCanvas = document.getElementById('skeletonCanvas');
        this.organsCanvas = document.getElementById('organsCanvas');

        this.canvases = [this.bodyCanvas, this.skeletonCanvas, this.organsCanvas];
        this.canvases.forEach(canvas => {
            canvas.width = 300;
            canvas.height = 600;
        });

        this.bodyCtx = this.bodyCanvas.getContext('2d');
        this.skeletonCtx = this.skeletonCanvas.getContext('2d');
        this.organsCtx = this.organsCanvas.getContext('2d');

        this.drawAll();
    }

    drawBody() {
        const ctx = this.bodyCtx;
        ctx.fillStyle = '#ffdbac';
        
        // 头部
        ctx.beginPath();
        ctx.arc(150, 50, 30, 0, Math.PI * 2);
        ctx.fill();
        
        // 颈部
        ctx.beginPath();
        ctx.moveTo(140, 75);
        ctx.lineTo(160, 75);
        ctx.lineTo(157, 95);
        ctx.lineTo(143, 95);
        ctx.closePath();
        ctx.fill();
        
        // 躯干
        ctx.beginPath();
        ctx.moveTo(130, 95);  // 肩部起点
        ctx.lineTo(170, 95);  // 肩部宽度
        ctx.lineTo(175, 280); // 腰部
        ctx.lineTo(165, 400); // 臀部
        ctx.lineTo(135, 400);
        ctx.lineTo(125, 280);
        ctx.closePath();
        ctx.fill();
        
        // 左手臂
        ctx.beginPath();
        ctx.moveTo(130, 95);  // 肩部连接点
        ctx.lineTo(110, 200); // 上臂
        ctx.lineTo(105, 300); // 前臂
        ctx.lineTo(115, 300);
        ctx.lineTo(120, 200);
        ctx.closePath();
        ctx.fill();
        
        // 右手臂
        ctx.beginPath();
        ctx.moveTo(170, 95);  // 肩部连接点
        ctx.lineTo(190, 200); // 上臂
        ctx.lineTo(195, 300); // 前臂
        ctx.lineTo(185, 300);
        ctx.lineTo(180, 200);
        ctx.closePath();
        ctx.fill();
        
        // 左腿
        ctx.beginPath();
        ctx.moveTo(135, 400);
        ctx.lineTo(125, 500);
        ctx.lineTo(130, 580);
        ctx.lineTo(145, 580);
        ctx.lineTo(150, 500);
        ctx.closePath();
        ctx.fill();
        
        // 右腿
        ctx.beginPath();
        ctx.moveTo(165, 400);
        ctx.lineTo(175, 500);
        ctx.lineTo(170, 580);
        ctx.lineTo(155, 580);
        ctx.lineTo(150, 500);
        ctx.closePath();
        ctx.fill();
    }

    drawSkeleton() {
        const ctx = this.skeletonCtx;
        ctx.strokeStyle = '#e0e0e0';
        ctx.lineWidth = 2;
        
        // 头骨
        ctx.beginPath();
        ctx.arc(150, 50, 25, 0, Math.PI * 2);
        ctx.stroke();
        
        // 颈椎
        ctx.beginPath();
        ctx.moveTo(150, 75);
        ctx.lineTo(150, 95);
        ctx.stroke();
        
        // 脊椎
        ctx.beginPath();
        ctx.moveTo(150, 95);
        for(let y = 95; y < 400; y += 15) {
            ctx.lineTo(150, y + 7);
            ctx.moveTo(150, y + 15);
        }
        ctx.stroke();
        
        // 肋骨（更自然的弧度）
        for(let y = 120; y < 250; y += 25) {
            ctx.beginPath();
            // 左侧肋骨
            ctx.moveTo(150, y);
            ctx.bezierCurveTo(130, y-5, 120, y, 115, y+5);
            // 右侧肋骨
            ctx.moveTo(150, y);
            ctx.bezierCurveTo(170, y-5, 180, y, 185, y+5);
            ctx.stroke();
        }
        
        // 锁骨
        ctx.beginPath();
        ctx.moveTo(130, 95);
        ctx.quadraticCurveTo(150, 85, 170, 95);
        ctx.stroke();
        
        // 骨盆
        ctx.beginPath();
        ctx.moveTo(125, 380);
        ctx.bezierCurveTo(150, 400, 150, 390, 175, 380);
        ctx.stroke();
        
        // 手臂骨骼
        this.drawLimb(ctx, 130, 95, 110, 200, 105, 300); // 左臂
        this.drawLimb(ctx, 170, 95, 190, 200, 195, 300); // 右臂
        
        // 腿部骨骼
        this.drawLimb(ctx, 135, 400, 125, 500, 130, 580); // 左腿
        this.drawLimb(ctx, 165, 400, 175, 500, 170, 580); // 右腿
    }

    drawLimb(ctx, x1, y1, x2, y2, x3, y3) {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.lineTo(x3, y3);
        ctx.stroke();
    }

    drawOrgans() {
        const ctx = this.organsCtx;
        
        // 心脏（更自然的形状）
        ctx.fillStyle = '#ff6b6b';
        ctx.beginPath();
        ctx.moveTo(150, 160);
        ctx.bezierCurveTo(170, 140, 170, 180, 150, 200);
        ctx.bezierCurveTo(130, 180, 130, 140, 150, 160);
        ctx.fill();
        
        // 肺部（更自然的形状）
        ctx.fillStyle = '#ffa07a';
        // 左肺
        ctx.beginPath();
        ctx.moveTo(120, 150);
        ctx.bezierCurveTo(100, 170, 100, 220, 120, 240);
        ctx.bezierCurveTo(130, 220, 130, 170, 120, 150);
        ctx.fill();
        // 右肺
        ctx.beginPath();
        ctx.moveTo(180, 150);
        ctx.bezierCurveTo(200, 170, 200, 220, 180, 240);
        ctx.bezierCurveTo(170, 220, 170, 170, 180, 150);
        ctx.fill();
        
        // 肝脏
        ctx.fillStyle = '#8b4513';
        ctx.beginPath();
        ctx.moveTo(130, 250);
        ctx.bezierCurveTo(170, 240, 190, 260, 170, 280);
        ctx.bezierCurveTo(150, 290, 130, 280, 130, 250);
        ctx.fill();
        
        // 胃
        ctx.fillStyle = '#ff9f7f';
        ctx.beginPath();
        ctx.moveTo(140, 290);
        ctx.bezierCurveTo(160, 280, 170, 310, 160, 330);
        ctx.bezierCurveTo(140, 340, 130, 310, 140, 290);
        ctx.fill();
        
        // 小肠（更自然的蜿蜒形状）
        ctx.fillStyle = '#ffd700';
        this.drawIntestine(ctx, 150, 350, 35, 8, 0.15);
        
        // 大肠
        ctx.fillStyle = '#deb887';
        this.drawIntestine(ctx, 150, 420, 45, 3, 0.25);
    }

    drawIntestine(ctx, x, y, radius, loops, wavelength) {
        ctx.beginPath();
        for(let i = 0; i < Math.PI * 2 * loops; i += 0.1) {
            const dx = Math.cos(i) * radius + Math.sin(i * 8) * wavelength;
            const dy = Math.sin(i) * radius + Math.cos(i * 8) * wavelength;
            if(i === 0) {
                ctx.moveTo(x + dx, y + dy);
            } else {
                ctx.lineTo(x + dx, y + dy);
            }
        }
        ctx.fill();
    }

    drawAll() {
        this.drawBody();
        this.drawSkeleton();
        this.drawOrgans();
    }
}

// 初始化游戏和人体绘制
document.addEventListener('DOMContentLoaded', () => {
    const humanBodyDrawer = new HumanBodyDrawer();
    const game = new Game();
    
    document.getElementById('start-game').addEventListener('click', () => {
        game.start();
    });
});

const style = document.createElement('style');
style.textContent = `
    @keyframes explode {
        0% { transform: scale(0.3); opacity: 1; }
        100% { transform: scale(2); opacity: 0; }
    }
`;
document.head.appendChild(style); 