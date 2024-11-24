class MazeGame {
    constructor() {
        this.level = 1;
        this.mazeWidth = 15 + Math.floor(this.level/2);
        this.mazeHeight = 14 + Math.floor(this.level/2);
        this.starsNeeded = 3 + Math.floor(this.level/2);
        this.enemyCount = 4 + Math.floor(this.level/3);
        this.score = 0;
        this.highScore = localStorage.getItem('mazeGameHighScore') || 0;
        this.starsCollected = 0;
        this.gameOver = false;
        
        // 检测是否为移动设备
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        if (this.isMobile) {
            document.querySelector('.instructions').textContent = '点击屏幕按钮移动飞船';
        }
        
        this.generateNewMaze();
        this.startEnemyMovement();
        this.initSounds();
    }

    restart() {
        this.level = 1;
        this.score = 0;
        this.starsCollected = 0;
        this.gameOver = false;
        this.mazeWidth = 15 + Math.floor(this.level/2);
        this.mazeHeight = 14 + Math.floor(this.level/2);
        this.starsNeeded = 3 + Math.floor(this.level/2);
        this.enemyCount = 4 + Math.floor(this.level/3);
        this.generateNewMaze();
    }

    initSounds() {
        this.sounds = {
            collect: new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU'),
            hit: new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU')
        };
    }

    generateNewMaze() {
        // 初始化空迷宫，全部填充为墙
        this.maze = Array(this.mazeHeight).fill().map(() => 
            Array(this.mazeWidth).fill(1)
        );
        
        // 使用深度优先搜索生成迷宫
        this.generateMazePath(1, 1);
        
        // 确保终点位置是路径
        const endY = this.mazeHeight - 2;
        const endX = this.mazeWidth - 3;
        
        // 确保终点和起点之间有路
        this.ensurePathToEnd(endX, endY);
        
        // 添加起点、玩家和终点
        this.maze[1][1] = 5; // 起点
        this.maze[1][2] = 2; // 玩家
        this.playerPos = { x: 2, y: 1 };
        this.maze[endY][endX] = 3; // 终点
        
        // 添加星星和敌人
        this.addStars(this.starsNeeded);
        this.addEnemies(this.enemyCount);
        
        this.enemies = this.findEnemies();
        this.initGame();
        this.updateMessage();
    }

    movePlayer(newX, newY) {
        if (this.gameOver) return;
        
        if (this.isValidMove(newX, newY)) {
            // 清除当前位置
            this.maze[this.playerPos.y][this.playerPos.x] = 0;
            
            // 检查是否收集到星星
            if (this.maze[newY][newX] === 6) {
                this.starsCollected++;
                this.score += 100 * this.level;
                this.sounds.collect.play().catch(() => {});
                this.updateMessage();
            }
            
            // 检查是否到达终点
            if (this.maze[newY][newX] === 3) {
                if (this.starsCollected >= this.starsNeeded) {
                    this.level++;
                    this.score += 500 * this.level;
                    if (this.score > this.highScore) {
                        this.highScore = this.score;
                        localStorage.setItem('mazeGameHighScore', this.highScore);
                    }
                    document.getElementById('message').textContent = 
                        `完成第${this.level-1}关！准备进入第${this.level}关...`;
                    setTimeout(() => {
                        this.mazeWidth = 15 + Math.floor(this.level/2);
                        this.mazeHeight = 14 + Math.floor(this.level/2);
                        this.starsNeeded = 3 + Math.floor(this.level/2);
                        this.enemyCount = 4 + Math.floor(this.level/3);
                        this.generateNewMaze();
                    }, 1500);
                    return;
                }
            }

            // 检查是否碰到敌人
            if (this.maze[newY][newX] === 4) {
                this.gameOver = true;
                this.sounds.hit.play().catch(() => {});
                document.getElementById('message').textContent = '飞船被外星人捕获！点击屏幕重新开始任务';
                return;
            }

            // 更新新位置
            this.maze[newY][newX] = 2;
            this.playerPos = { x: newX, y: newY };
            this.renderMaze();
        }
    }

    // 添加其他必要的方法
    generateMazePath(x, y) {
        const directions = [[0, -1], [0, 1], [-1, 0], [1, 0]];
        this.maze[y][x] = 0;
        
        let dirs = [...directions];
        for (let i = dirs.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [dirs[i], dirs[j]] = [dirs[j], dirs[i]];
        }
        
        for (let [dx, dy] of dirs) {
            const newX = x + (dx * 2);
            const newY = y + (dy * 2);
            
            if (newX > 0 && newX < this.mazeWidth - 1 && 
                newY > 0 && newY < this.mazeHeight - 1 && 
                this.maze[newY][newX] === 1) {
                this.maze[y + dy][x + dx] = 0;
                this.generateMazePath(newX, newY);
            }
        }
    }

    initGame() {
        this.renderMaze();
        this.setupControls();
    }

    renderMaze() {
        const mazeElement = document.getElementById('maze');
        mazeElement.innerHTML = '';

        this.maze.forEach((row, y) => {
            const rowElement = document.createElement('div');
            rowElement.className = 'row';

            row.forEach((cell, x) => {
                const cellElement = document.createElement('div');
                cellElement.className = 'cell';

                switch(cell) {
                    case 1: cellElement.classList.add('wall'); break;
                    case 2: cellElement.classList.add('player'); break;
                    case 3: cellElement.classList.add('goal'); break;
                    case 4: cellElement.classList.add('enemy'); break;
                    case 5: cellElement.classList.add('start'); break;
                    case 6: cellElement.classList.add('star'); break;
                }

                rowElement.appendChild(cellElement);
            });

            mazeElement.appendChild(rowElement);
        });
    }

    setupControls() {
        // 创建统一的移动处理函数
        const handleMove = (direction) => {
            if (this.gameOver) return;
            
            let newX = this.playerPos.x;
            let newY = this.playerPos.y;

            switch (direction) {
                case 'up': newY--; break;
                case 'down': newY++; break;
                case 'left': newX--; break;
                case 'right': newX++; break;
                default: return;
            }

            this.movePlayer(newX, newY);
        };

        // 键盘控制
        document.addEventListener('keydown', (e) => {
            switch (e.key) {
                case 'ArrowUp': handleMove('up'); break;
                case 'ArrowDown': handleMove('down'); break;
                case 'ArrowLeft': handleMove('left'); break;
                case 'ArrowRight': handleMove('right'); break;
            }
        });

        // 屏幕按钮控制
        const buttons = {
            'up-btn': 'up',
            'down-btn': 'down',
            'left-btn': 'left',
            'right-btn': 'right'
        };

        Object.entries(buttons).forEach(([id, direction]) => {
            const button = document.getElementById(id);
            if (button) {
                button.addEventListener('click', () => handleMove(direction));
                button.addEventListener('touchstart', (e) => {
                    e.preventDefault(); // 防止触摸事件的默认行为
                    handleMove(direction);
                });
            }
        });
    }

    isValidMove(x, y) {
        return x >= 0 && x < this.mazeWidth && 
               y >= 0 && y < this.mazeHeight && 
               this.maze[y][x] !== 1;
    }

    updateMessage() {
        const message = document.getElementById('message');
        const levelSpan = document.getElementById('level');
        const scoreSpan = document.getElementById('score');
        const highScoreSpan = document.getElementById('high-score');
        
        if (!this.gameOver) {
            message.textContent = `需要收集: ${this.starsCollected}/${this.starsNeeded} 颗星星`;
            levelSpan.textContent = `第 ${this.level} 关`;
            scoreSpan.textContent = `分数: ${this.score}`;
            highScoreSpan.textContent = `最高分: ${this.highScore}`;
        }
    }

    // 添加确保路径到终点的方法
    ensurePathToEnd(endX, endY) {
        let currentX = endX;
        let currentY = endY;
        
        while (currentY > 1 || currentX > 2) {
            if (currentY > 1 && Math.random() < 0.5) {
                this.maze[currentY][currentX] = 0;
                this.maze[currentY - 1][currentX] = 0;
                currentY -= 2;
            } else if (currentX > 2) {
                this.maze[currentY][currentX] = 0;
                this.maze[currentY][currentX - 1] = 0;
                currentX -= 2;
            }
        }
    }

    // 添加星星的方法
    addStars(count) {
        let added = 0;
        while (added < count) {
            const x = Math.floor(Math.random() * (this.mazeWidth - 2)) + 1;
            const y = Math.floor(Math.random() * (this.mazeHeight - 2)) + 1;
            
            if (this.maze[y][x] === 0 && 
                !(Math.abs(x - this.playerPos.x) < 2 && Math.abs(y - this.playerPos.y) < 2)) {
                this.maze[y][x] = 6;
                added++;
            }
        }
    }

    // 添加敌人的方法
    addEnemies(count) {
        let added = 0;
        while (added < count) {
            const x = Math.floor(Math.random() * (this.mazeWidth - 2)) + 1;
            const y = Math.floor(Math.random() * (this.mazeHeight - 2)) + 1;
            
            if (this.maze[y][x] === 0 && 
                !(Math.abs(x - this.playerPos.x) < 3 && Math.abs(y - this.playerPos.y) < 3)) {
                this.maze[y][x] = 4;
                added++;
            }
        }
    }

    // 查找所有敌人的方法
    findEnemies() {
        const enemies = [];
        this.maze.forEach((row, y) => {
            row.forEach((cell, x) => {
                if (cell === 4) {
                    enemies.push({ x, y });
                }
            });
        });
        return enemies;
    }

    // 启动敌人移动
    startEnemyMovement() {
        setInterval(() => {
            if (!this.gameOver) {
                this.moveEnemies();
            }
        }, 1000);
    }

    // 移动敌人的方法
    moveEnemies() {
        this.enemies.forEach(enemy => {
            const directions = [
                { dx: 0, dy: -1 },
                { dx: 0, dy: 1 },
                { dx: -1, dy: 0 },
                { dx: 1, dy: 0 }
            ];
            
            const validMoves = directions.filter(dir => {
                const newX = enemy.x + dir.dx;
                const newY = enemy.y + dir.dy;
                return this.isValidMove(newX, newY) && 
                       this.maze[newY][newX] !== 2 &&
                       this.maze[newY][newX] !== 3 &&
                       this.maze[newY][newX] !== 5;
            });

            if (validMoves.length > 0) {
                const move = validMoves[Math.floor(Math.random() * validMoves.length)];
                const newX = enemy.x + move.dx;
                const newY = enemy.y + move.dy;

                if (this.maze[newY][newX] === 0) {
                    this.maze[enemy.y][enemy.x] = 0;
                    enemy.x = newX;
                    enemy.y = newY;
                    this.maze[newY][newX] = 4;
                }
            }
        });
        
        this.renderMaze();
        this.checkCollision();
    }

    // 检查碰撞的方法
    checkCollision() {
        const playerHit = this.enemies.some(enemy => 
            enemy.x === this.playerPos.x && enemy.y === this.playerPos.y
        );

        if (playerHit) {
            this.gameOver = true;
            document.getElementById('message').textContent = '飞船被外星人捕获！点击屏幕重新开始任务';
        }
    }
}

document.addEventListener('click', () => {
    if (window.game && window.game.gameOver) {
        window.game.restart();
    }
});

window.onload = () => {
    window.game = new MazeGame();
}; 