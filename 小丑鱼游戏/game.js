// 游戏对象
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        
        // 设置画布大小为屏幕大小
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        
        // 初始化游戏元素
        this.fishingRod = {
            x: this.width / 2,
            y: 50,
            lineLength: 100,     // 增加初始长度
            maxLength: 500,      // 增加最大长度
            hookSize: 8,
            isFishing: false,
            speed: 6             // 降低放线速度
        };
        
        // 获取游戏容器
        this.container = document.querySelector('.game-container');
        
        // 定义鱼的类型
        this.fishTypes = [
            {
                color: '#800080',     // 紫色 - 章鱼
                finColor: '#9932CC',
                score: 10,            // 章鱼分值最高
                size: 1.5,            // 章鱼最大
                isOctopus: true       // 标记为章鱼
            },
            {
                color: '#FF4D4D',     // 红色 - 核心组件
                finColor: '#FF8080',
                score: 1,
                size: 1.4            // 核心组件最大
            },
            {
                color: '#FFD700',     // 金色 - 数据处理
                finColor: '#FFF0B3',
                score: 2,
                size: 1.2            // 数据处理较大
            },
            {
                color: '#4D4DFF',     // 蓝色 - 数据存储
                finColor: '#8080FF',
                score: 3,
                size: 1.1            // 数据存储中等
            },
            {
                color: '#00FF00',     // 绿色 - 工具组件
                finColor: '#80FF80',
                score: 4,
                size: 1.0            // 工具组件标准大小
            }
        ];
        
        // 添加英语单词库
        this.words = [
            // 核心组件
            { word: 'Hadoop', meaning: '分布式计算平台' },
            { word: 'HDFS', meaning: '分布式文件系统' },
            { word: 'YARN', meaning: '集群资源管理系统' },
            { word: 'MapReduce', meaning: '分布式计算框架' },
            
            // 数据处理
            { word: 'Spark', meaning: '内存计算引擎' },
            { word: 'Flink', meaning: '流处理框架' },
            { word: 'Storm', meaning: '实时计算系统' },
            { word: 'Pig', meaning: '数据流处理语言' },
            
            // 数据存储
            { word: 'HBase', meaning: '分布式列式数据库' },
            { word: 'Cassandra', meaning: '分布式NoSQL数据库' },
            { word: 'Hive', meaning: '数据仓库工具' },
            { word: 'Phoenix', meaning: 'SQL层for HBase' },
            
            // 工具组件
            { word: 'ZooKeeper', meaning: '分布式协调服务' },
            { word: 'Sqoop', meaning: '数据导入导出工具' },
            { word: 'Flume', meaning: '日志收集系统' },
            { word: 'Ambari', meaning: '集群管理工具' },
            { word: 'Oozie', meaning: '工作流调度系统' },
            { word: 'Kafka', meaning: '分布式消息系统' }
        ];
        
        // 分开存储鱼和装饰物
        this.fishes = [];
        this.decorations = {
            seaweeds: [],
            starfish: []
        };
        
        // 先创建装饰物
        this.createSeaweed();
        this.createStarfish();
        
        // 再创建可钓的鱼
        this.createFishes();
        this.createOctopus();
        
        // 添加鼠标移动事件
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        
        // 添加触摸事件监听
        this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e));
        
        // 添加钓鱼按钮事件 - 触摸
        this.fishingButton = document.getElementById('fishingButton');
        this.fishingButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.fishingRod.isFishing = true;
            this.startFishing();
            this.fishingButton.classList.add('active');
        });
        
        this.fishingButton.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.fishingRod.isFishing = false;
            this.pullUp();
            this.fishingButton.classList.remove('active');
        });
        
        // 添加钓鱼按钮事件 - 鼠标
        this.fishingButton.addEventListener('mousedown', (e) => {
            this.fishingRod.isFishing = true;
            this.startFishing();
            this.fishingButton.classList.add('active');
        });
        
        this.fishingButton.addEventListener('mouseup', (e) => {
            this.fishingRod.isFishing = false;
            this.pullUp();
            this.fishingButton.classList.remove('active');
        });
        
        // 添加键盘事件监听
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && !this.fishingRod.isFishing) {
                this.fishingRod.isFishing = true;
                this.startFishing();
                this.fishingButton.classList.add('active');
            }
        });
        
        document.addEventListener('keyup', (e) => {
            if (e.code === 'Space') {
                this.fishingRod.isFishing = false;
                this.pullUp();
                this.fishingButton.classList.remove('active');
            }
        });
        
        // 添加窗口大小改变事件
        window.addEventListener('resize', () => this.handleResize());
        
        // 调整初始参数
        this.fishingRod.maxLength = this.height * 0.7;  // 根据屏幕高度调整最大长度
        
        // 添加分数
        this.score = 0;
        
        // 创建音频上下文
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // 创建音效生成器
        this.createSoundEffects();
        
        // 添加正在钓鱼的状态
        this.hasCaughtFish = false;
        
        // 开始游戏循环
        this.gameLoop();
    }
    
    // 恢复鼠标移动处理方法
    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.fishingRod.x = e.clientX - rect.left;
    }
    
    // 添加触摸移动处理方法
    handleTouchMove(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        this.fishingRod.x = touch.clientX - rect.left;
    }
    
    // 添加窗口大小改变处理方法
    handleResize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.fishingRod.maxLength = this.height * 0.7;
    }
    
    // 创建音效
    createSoundEffects() {
        // 下降音效生成器
        this.createDropSound = () => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);
            
            gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            return { oscillator, gainNode };
        };
        
        // 捕获音效
        this.playCatchSound = () => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(400, this.audioContext.currentTime + 0.1);
            
            gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + 0.1);
        };
    }
    
    // 开始钓鱼
    startFishing() {
        // 开始播放下降音效
        this.dropSound = this.createDropSound();
        this.dropSound.oscillator.start();
    }
    
    // 收竿
    pullUp() {
        // 停止下降音效
        if (this.dropSound) {
            this.dropSound.oscillator.stop();
            this.dropSound = null;
        }
    }
    
    update() {
        // 更新鱼线长度
        if (this.fishingRod.isFishing && this.fishingRod.lineLength < this.fishingRod.maxLength) {
            // 放线
            this.fishingRod.lineLength += this.fishingRod.speed;
            
            // 更新下降音效频率
            if (this.dropSound) {
                const freq = 200 + (this.fishingRod.lineLength / this.fishingRod.maxLength) * 100;
                this.dropSound.oscillator.frequency.setValueAtTime(freq, this.audioContext.currentTime);
            }
        } else if (!this.fishingRod.isFishing && this.fishingRod.lineLength > 50) {
            // 收线
            this.fishingRod.lineLength -= this.fishingRod.speed;
            
            // 停止下降音效
            if (this.dropSound) {
                this.dropSound.oscillator.stop();
                this.dropSound = null;
            }
            
            // 检查是否有鱼被钓上来
            this.fishes.forEach(fish => {
                if (fish.caught) {
                    fish.y = this.fishingRod.y + this.fishingRod.lineLength;
                }
            });
        }
        
        // 检测碰撞
        if (this.fishingRod.isFishing && !this.hasCaughtFish) {
            const hookX = this.fishingRod.x;
            const hookY = this.fishingRod.y + this.fishingRod.lineLength;
            
            for (let fish of this.fishes) {
                if (!fish.caught && this.checkCollision(hookX, hookY, fish)) {
                    fish.caught = true;
                    this.hasCaughtFish = true;
                    this.playCatchSound();
                    break;
                }
            }
        }
        
        // 只更新鱼的位置
        this.fishes.forEach(fish => {
            if (fish.caught) {
                const hookY = this.fishingRod.y + this.fishingRod.lineLength;
                fish.x = this.fishingRod.x - fish.width / 2;
                fish.y = hookY;
                
                // 如果鱼被拉到顶部，重置
                if (fish.y <= 100) {
                    this.addScore(fish);
                    this.resetFish(fish);
                    this.hasCaughtFish = false;  // 重置钓鱼状态
                }
            } else {
                fish.x += fish.speed * fish.direction;
                
                if (fish.x <= 0 || fish.x >= this.width) {
                    fish.direction *= -1;
                }
            }
            
            // 更新DOM元素位置
            if (fish.isOctopus) {
                // 章鱼的特殊处理
                fish.element.style.transform = `translate(${fish.x}px, ${fish.y}px)`;
                if (fish.direction < 0) {
                    fish.element.style.transform += ' scaleX(-1)';
                }
            } else {
                // 普通鱼的处理
                fish.element.style.transform = `translate(${fish.x}px, ${fish.y}px)`;
                const body = fish.element.querySelector('.fish-body');
                const tail = fish.element.querySelector('.fish-tail');
                const fin = fish.element.querySelector('.fish-fin');
                
                if (fish.direction < 0) {
                    body.style.transform = 'scaleX(-1)';
                    tail.style.transform = 'scaleX(-1)';
                    fin.style.transform = 'scaleX(-1)';
                } else {
                    body.style.transform = 'scaleX(1)';
                    tail.style.transform = 'scaleX(1)';
                    fin.style.transform = 'scaleX(1)';
                }
            }
        });
    }
    
    checkCollision(x, y, fish) {
        const tolerance = 10;
        return x > fish.x - tolerance && 
               x < fish.x + fish.width + tolerance && 
               y > fish.y - tolerance && 
               y < fish.y + fish.height + tolerance;
    }
    
    resetFish(fish) {
        if (fish.isOctopus) {
            // 章鱼重置到随机位置
            fish.x = Math.random() * this.width;
            fish.y = 400 + Math.random() * 100;
            fish.caught = false;
            fish.direction = Math.random() < 0.5 ? 1 : -1;
            return;
        }
        
        const fishType = this.fishTypes[Math.floor(Math.random() * this.fishTypes.length)];
        const wordObj = this.words[Math.floor(Math.random() * this.words.length)];
        
        // 更新鱼的大小
        const baseWidth = 40;
        const baseHeight = 24;
        const scale = fishType.size;
        
        fish.element.style.width = `${baseWidth * scale}px`;
        fish.element.style.height = `${baseHeight * scale}px`;
        fish.width = baseWidth * scale;
        fish.height = baseHeight * scale;
        
        fish.x = Math.random() * this.width;
        fish.y = 300 + Math.random() * 200;
        fish.caught = false;
        fish.direction = Math.random() < 0.5 ? 1 : -1;
        fish.speed = 1 + Math.random() * 2;
        fish.type = fishType;
        
        // 更新鱼的颜色
        const body = fish.element.querySelector('.fish-body');
        const tail = fish.element.querySelector('.fish-tail');
        const fin = fish.element.querySelector('.fish-fin');
        
        body.style.backgroundColor = fishType.color;
        tail.style.backgroundColor = fishType.color;
        fin.style.backgroundColor = fishType.finColor;
        
        // 更新单词
        fish.word = wordObj;
        const wordDiv = fish.element.querySelector('.fish-word');
        wordDiv.textContent = wordObj.word;
    }
    
    draw() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // 绘制鱼线
        this.ctx.beginPath();
        this.ctx.moveTo(this.fishingRod.x, 0);
        this.ctx.lineTo(this.fishingRod.x, this.fishingRod.y + this.fishingRod.lineLength);
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 2;  // 增加线的宽度使其更明显
        this.ctx.stroke();
        
        // 绘制鱼钩
        const hookY = this.fishingRod.y + this.fishingRod.lineLength;
        this.ctx.beginPath();
        this.ctx.arc(
            this.fishingRod.x,
            hookY,
            this.fishingRod.hookSize,
            0,
            Math.PI * 1.5,
            false
        );
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        // 绘制分数
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = 'bold 18px Arial';
        this.ctx.fillText(`总分: ${this.score}`, 10, 30);
        
        // 绘制鱼的说明
        this.ctx.font = '14px Arial';
        this.fishTypes.forEach((type, index) => {
            this.ctx.fillStyle = type.color;
            let category;
            switch(index) {
                case 0: category = '章鱼'; break;
                case 1: category = '核心组件'; break;
                case 2: category = '数据处理'; break;
                case 3: category = '数据存储'; break;
                case 4: category = '工具组件'; break;
            }
            this.ctx.fillText(`${category}: ${type.score}分`, 10, 50 + index * 20);
        });
        
        // 绘制操作提示
        this.ctx.font = '16px Arial';
        this.ctx.fillStyle = '#FFFFFF';
        if ('ontouchstart' in window) {
            // 移动设备显示触摸提示
            this.ctx.fillText('触摸屏幕移动鱼竿，按住按钮钓鱼', 10, this.height - 30);
        } else {
            // PC设备显示键鼠提示
            this.ctx.fillText('移动鼠标控制鱼竿，按住空格键或按钮钓鱼', 10, this.height - 30);
        }
    }
    
    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
    
    // 添加分数
    addScore(fish) {
        this.score += fish.type.score;
        this.playCatchSound();
        
        // 创建得分动画
        const scoreDiv = document.createElement('div');
        scoreDiv.className = 'score-popup';
        
        // 先只显示分数和软件名
        scoreDiv.innerHTML = `
            <div class="score-text">+${fish.type.score}</div>
            <div class="word-popup">
                <div class="english-word">${fish.word.word}</div>
            </div>
        `;
        scoreDiv.style.left = `${this.fishingRod.x}px`;
        scoreDiv.style.top = '100px';
        scoreDiv.style.color = fish.type.color;
        this.container.appendChild(scoreDiv);
        
        // 延迟1秒显示中文含义
        setTimeout(() => {
            const meaningDiv = document.createElement('div');
            meaningDiv.className = 'meaning';
            meaningDiv.textContent = fish.word.meaning;
            scoreDiv.querySelector('.word-popup').appendChild(meaningDiv);
        }, 1000);
        
        // 6秒后开始淡出动画
        setTimeout(() => {
            // 英文先淡出
            scoreDiv.querySelector('.score-text').style.animation = 'fadeOut 1s ease-out';
            scoreDiv.querySelector('.english-word').style.animation = 'fadeOut 1s ease-out';
            
            // 2秒后中文再淡出
            setTimeout(() => {
                scoreDiv.querySelector('.meaning').style.animation = 'fadeOut 1s ease-out';
                
                // 等待中文淡出完成后移除元素
                setTimeout(() => {
                    this.container.removeChild(scoreDiv);
                }, 1000);
            }, 2000);
        }, 6000);
    }
    
    // 创建海草
    createSeaweed() {
        // 根据屏幕宽度调整海草数量
        const seaweedCount = Math.floor(this.width / 100);
        for (let i = 0; i < seaweedCount; i++) {
            const seaweed = document.createElement('div');
            seaweed.className = 'seaweed';
            
            // 每株海草有3片叶子
            for (let j = 0; j < 3; j++) {
                const leaf = document.createElement('div');
                leaf.className = 'seaweed-leaf';
                leaf.style.bottom = `${j * 30}px`;
                // 随机调整动画延迟，使得摆动不同步
                leaf.style.animationDelay = `${Math.random() * 2}s`;
                seaweed.appendChild(leaf);
            }
            
            // 随机位置
            seaweed.style.left = `${(this.width / seaweedCount) * i + Math.random() * 20}px`;
            // 随机高度
            seaweed.style.height = `${80 + Math.random() * 40}px`;
            
            this.container.appendChild(seaweed);
        }
    }
    
    // 创建海星
    createStarfish() {
        // 根据屏幕宽度调整海星数量
        const starfishCount = Math.floor(this.width / 150);
        for (let i = 0; i < starfishCount; i++) {
            const starfish = document.createElement('div');
            starfish.className = 'starfish';
            
            // 固定位置在底部
            starfish.style.left = `${(this.width / starfishCount) * i + Math.random() * 30}px`;
            starfish.style.bottom = '20px';  // 使用 bottom 而不是 transform
            // 随机旋转
            starfish.style.transform = `rotate(${Math.random() * 360}deg)`;
            // 随机动画延迟
            starfish.style.animationDelay = `${Math.random() * 2}s`;
            
            this.container.appendChild(starfish);
            this.decorations.starfish.push(starfish);
        }
    }
    
    // 创建章鱼
    createOctopus() {
        const octopus = document.createElement('div');
        octopus.className = 'octopus';
        
        // 创建章鱼头部
        const head = document.createElement('div');
        head.className = 'octopus-head';
        
        // 创建眼睛
        const leftEye = document.createElement('div');
        leftEye.className = 'octopus-eye left';
        const rightEye = document.createElement('div');
        rightEye.className = 'octopus-eye right';
        
        head.appendChild(leftEye);
        head.appendChild(rightEye);
        octopus.appendChild(head);
        
        // 创建触手
        for (let i = 0; i < 8; i++) {
            const tentacle = document.createElement('div');
            tentacle.className = 'octopus-tentacle';
            tentacle.style.left = `${i * 9}px`;
            tentacle.style.animationDelay = `${i * 0.2}s`;
            octopus.appendChild(tentacle);
        }
        
        // 添加单词显示
        const wordDiv = document.createElement('div');
        wordDiv.className = 'fish-word';
        const wordObj = { word: 'Octopus', meaning: '章鱼 - 特殊奖励(+10分)' };
        const wordSpan = document.createElement('span');
        wordSpan.className = 'word-text';
        wordSpan.textContent = wordObj.word;
        wordDiv.appendChild(wordSpan);
        octopus.appendChild(wordDiv);
        
        this.container.appendChild(octopus);
        
        // 添加到鱼群中
        this.fishes.push({
            element: octopus,
            x: Math.random() * this.width,
            y: 400 + Math.random() * 100,
            width: 70,
            height: 70,
            speed: 0.5 + Math.random() * 1,  // 章鱼移动较慢
            direction: Math.random() < 0.5 ? 1 : -1,
            caught: false,
            type: this.fishTypes[0],  // 使用章鱼类型
            word: wordObj,
            isOctopus: true
        });
    }
    
    // 添加创建普通鱼的方法
    createFishes() {
        // 根据屏幕大小调整鱼的数量
        const fishCount = Math.floor(this.width / 100);
        for (let i = 0; i < fishCount; i++) {
            // 跳过章鱼类型
            const fishTypeIndex = 1 + Math.floor(Math.random() * (this.fishTypes.length - 1));
            const fishType = this.fishTypes[fishTypeIndex];
            const fishDiv = document.createElement('div');
            fishDiv.className = 'fish';
            
            // 设置鱼的基础大小
            const baseWidth = 40;
            const baseHeight = 24;
            const scale = fishType.size;
            
            fishDiv.style.width = `${baseWidth * scale}px`;
            fishDiv.style.height = `${baseHeight * scale}px`;
            
            // 创建鱼的身体部分
            const body = document.createElement('div');
            body.className = 'fish-body';
            body.style.backgroundColor = fishType.color;
            fishDiv.appendChild(body);
            
            // 创建鱼尾
            const tail = document.createElement('div');
            tail.className = 'fish-tail';
            tail.style.backgroundColor = fishType.color;
            fishDiv.appendChild(tail);
            
            // 创建鱼眼
            const eye = document.createElement('div');
            eye.className = 'fish-eye';
            fishDiv.appendChild(eye);
            
            // 创建鱼鳍
            const fin = document.createElement('div');
            fin.className = 'fish-fin';
            fin.style.backgroundColor = fishType.finColor;
            fishDiv.appendChild(fin);
            
            // 添加单词显示
            const wordDiv = document.createElement('div');
            wordDiv.className = 'fish-word';
            const wordObj = this.words[Math.floor(Math.random() * this.words.length)];
            const wordSpan = document.createElement('span');
            wordSpan.className = 'word-text';
            wordSpan.textContent = wordObj.word;
            wordDiv.appendChild(wordSpan);
            fishDiv.appendChild(wordDiv);
            
            this.container.appendChild(fishDiv);
            
            this.fishes.push({
                element: fishDiv,
                x: Math.random() * this.width,
                y: 300 + Math.random() * 200,
                width: baseWidth * scale,
                height: baseHeight * scale,
                speed: 1 + Math.random() * 2,
                direction: Math.random() < 0.5 ? 1 : -1,
                caught: false,
                type: fishType,
                word: wordObj
            });
        }
    }
}

// 初始化游戏
window.onload = () => {
    new Game();
};