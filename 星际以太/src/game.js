class SpaceGame {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({
            canvas: document.getElementById('game-canvas')
        });
        this.web3Handler = new Web3Handler();
        this.init();
    }

    async init() {
        this.setupScene();
        await this.connectWallet();
        this.animate();
    }

    setupScene() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.camera.position.z = 5;
        
        // 添加星空背景
        const starsGeometry = new THREE.BufferGeometry();
        const starsMaterial = new THREE.PointsMaterial({color: 0xFFFFFF});
        
        const starsVertices = [];
        for(let i = 0; i < 1000; i++) {
            starsVertices.push(
                Math.random() * 2000 - 1000,
                Math.random() * 2000 - 1000,
                Math.random() * 2000 - 1000
            );
        }
        
        starsGeometry.setAttribute('position', 
            new THREE.Float32BufferAttribute(starsVertices, 3)
        );
        
        const starField = new THREE.Points(starsGeometry, starsMaterial);
        this.scene.add(starField);
    }

    async connectWallet() {
        const connected = await this.web3Handler.connect();
        if (connected) {
            document.getElementById('wallet-address').textContent = 
                this.web3Handler.account.slice(0, 6) + '...' + 
                this.web3Handler.account.slice(-4);
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.renderer.render(this.scene, this.camera);
    }
}

// 启动游戏
window.onload = () => {
    const game = new SpaceGame();
}; 