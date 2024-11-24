const BLOCK_SIZE = 30;
const ROWS = 20;
const COLS = 10;

// 在Game类定义之前添加颜色常量
const COLORS = {
    I: '#FF9900', // 进取号橙色
    L: '#0099FF', // 星际舰队蓝色
    J: '#FF3366', // 克林贡红色
    O: '#33CC33', // 瓦肯绿色
    Z: '#9933FF', // 罗慕兰紫色
    S: '#FFCC00', // 联邦金色
    T: '#00FFFF'  // 安多利蓝色
};

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.nextCanvas = document.getElementById('nextCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.nextCtx = this.nextCanvas.getContext('2d');
        
        this.canvas.width = COLS * BLOCK_SIZE;
        this.canvas.height = ROWS * BLOCK_SIZE;
        this.nextCanvas.width = 4 * BLOCK_SIZE;
        this.nextCanvas.height = 4 * BLOCK_SIZE;
        
        this.grid = Array(ROWS).fill().map(() => Array(COLS).fill(null));
        this.score = 0;
        this.level = 1;
        this.gameOver = false;
        
        this.pieces = [
            // I形状 - 进取号
            {shape: [[1,1,1,1]], type: 'I'},
            // L形状 - 星际舰队
            {shape: [[1,0], [1,0], [1,1]], type: 'L'},
            // J形状 - 克林贡
            {shape: [[0,1], [0,1], [1,1]], type: 'J'},
            // O形状 - 瓦肯
            {shape: [[1,1], [1,1]], type: 'O'},
            // Z形状 - 罗慕兰
            {shape: [[1,1,0], [0,1,1]], type: 'Z'},
            // S形状 - 联邦
            {shape: [[0,1,1], [1,1,0]], type: 'S'},
            // T形状 - 安多利
            {shape: [[1,1,1], [0,1,0]], type: 'T'}
        ];
        
        this.currentPiece = null;
        this.currentPiecePosition = {x: 0, y: 0};
        this.nextPiece = null;
        
        this.init();
    }
    
    init() {
        document.getElementById('startBtn').addEventListener('click', () => this.start());
        document.addEventListener('keydown', (e) => this.handleInput(e));
    }
    
    start() {
        this.grid = Array(ROWS).fill().map(() => Array(COLS).fill(null));
        this.score = 0;
        this.level = 1;
        this.gameOver = false;
        this.updateScore();
        this.generateNewPiece();
        this.gameLoop();
    }
    
    generateNewPiece() {
        if (!this.nextPiece) {
            this.nextPiece = this.pieces[Math.floor(Math.random() * this.pieces.length)];
        }
        this.currentPiece = this.nextPiece;
        this.nextPiece = this.pieces[Math.floor(Math.random() * this.pieces.length)];
        this.currentPiecePosition = {
            x: Math.floor((COLS - this.currentPiece.shape[0].length) / 2),
            y: 0
        };
        this.drawNextPiece();
        
        if (this.checkCollision()) {
            this.gameOver = true;
        }
    }
    
    checkCollision() {
        for (let y = 0; y < this.currentPiece.shape.length; y++) {
            for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                if (this.currentPiece.shape[y][x]) {
                    const newX = this.currentPiecePosition.x + x;
                    const newY = this.currentPiecePosition.y + y;
                    
                    if (newX < 0 || newX >= COLS || newY >= ROWS || 
                        (newY >= 0 && this.grid[newY][newX] !== null)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
    
    mergePiece() {
        for (let y = 0; y < this.currentPiece.shape.length; y++) {
            for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                if (this.currentPiece.shape[y][x]) {
                    const newY = this.currentPiecePosition.y + y;
                    if (newY >= 0) {
                        this.grid[newY][this.currentPiecePosition.x + x] = this.currentPiece.type;
                    }
                }
            }
        }
    }
    
    clearLines() {
        let linesCleared = 0;
        for (let y = ROWS - 1; y >= 0; y--) {
            if (this.grid[y].every(cell => cell !== null)) {
                this.grid.splice(y, 1);
                this.grid.unshift(Array(COLS).fill(null));
                linesCleared++;
                y++;
            }
        }
        if (linesCleared > 0) {
            this.score += linesCleared * 100 * this.level;
            this.level = Math.floor(this.score / 1000) + 1;
            this.updateScore();
        }
    }
    
    updateScore() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('level').textContent = this.level;
    }
    
    draw() {
        // 清空画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制网格
        for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
                if (this.grid[y][x]) {
                    this.ctx.fillStyle = COLORS[this.grid[y][x]];
                    this.ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE - 1, BLOCK_SIZE - 1);
                }
            }
        }
        
        // 绘制当前方块
        if (this.currentPiece) {
            this.ctx.fillStyle = COLORS[this.currentPiece.type];
            for (let y = 0; y < this.currentPiece.shape.length; y++) {
                for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                    if (this.currentPiece.shape[y][x]) {
                        this.ctx.fillRect(
                            (this.currentPiecePosition.x + x) * BLOCK_SIZE,
                            (this.currentPiecePosition.y + y) * BLOCK_SIZE,
                            BLOCK_SIZE - 1,
                            BLOCK_SIZE - 1
                        );
                    }
                }
            }
        }
    }
    
    drawNextPiece() {
        this.nextCtx.clearRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);
        if (this.nextPiece) {
            this.nextCtx.fillStyle = COLORS[this.nextPiece.type];
            for (let y = 0; y < this.nextPiece.shape.length; y++) {
                for (let x = 0; x < this.nextPiece.shape[y].length; x++) {
                    if (this.nextPiece.shape[y][x]) {
                        this.nextCtx.fillRect(
                            (x + 1) * BLOCK_SIZE,
                            (y + 1) * BLOCK_SIZE,
                            BLOCK_SIZE - 1,
                            BLOCK_SIZE - 1
                        );
                    }
                }
            }
        }
    }
    
    handleInput(e) {
        if (this.gameOver) return;
        
        switch(e.keyCode) {
            case 37: // 左箭头
                this.currentPiecePosition.x--;
                if (this.checkCollision()) {
                    this.currentPiecePosition.x++;
                }
                break;
            case 39: // 右箭头
                this.currentPiecePosition.x++;
                if (this.checkCollision()) {
                    this.currentPiecePosition.x--;
                }
                break;
            case 40: // 下箭头
                this.currentPiecePosition.y++;
                if (this.checkCollision()) {
                    this.currentPiecePosition.y--;
                    this.mergePiece();
                    this.clearLines();
                    this.generateNewPiece();
                }
                break;
            case 38: // 上箭头
                this.rotatePiece();
                break;
            case 32: // 空格
                while (!this.checkCollision()) {
                    this.currentPiecePosition.y++;
                }
                this.currentPiecePosition.y--;
                this.mergePiece();
                this.clearLines();
                this.generateNewPiece();
                break;
        }
        this.draw();
    }
    
    rotatePiece() {
        const rotated = [];
        for (let i = 0; i < this.currentPiece.shape[0].length; i++) {
            rotated.push([]);
            for (let j = this.currentPiece.shape.length - 1; j >= 0; j--) {
                rotated[i].push(this.currentPiece.shape[j][i]);
            }
        }
        
        const originalShape = this.currentPiece.shape;
        this.currentPiece.shape = rotated;
        
        if (this.checkCollision()) {
            this.currentPiece.shape = originalShape;
        }
    }
    
    gameLoop() {
        if (this.gameOver) {
            alert('游戏结束！得分：' + this.score);
            return;
        }
        
        this.currentPiecePosition.y++;
        if (this.checkCollision()) {
            this.currentPiecePosition.y--;
            this.mergePiece();
            this.clearLines();
            this.generateNewPiece();
        }
        
        this.draw();
        setTimeout(() => this.gameLoop(), 1000 / this.level);
    }
}

// 初始化游戏
const game = new Game(); 