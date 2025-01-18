class Game {
    constructor() {
        this.init();
        this.setupControls();
        this.createStars();
        this.animate();
    }

    createStars() {
        this.stars = [];
        const starCount = 20;
        const radius = 100;

        for (let i = 0; i < starCount; i++) {
            const star = new Star();
            const angle = (i / starCount) * Math.PI * 2;
            const distance = radius + Math.random() * 50;
            
            star.mesh.position.set(
                Math.cos(angle) * distance,
                3,
                Math.sin(angle) * distance
            );
            
            this.scene.add(star.mesh);
            this.stars.push(star);
        }
    }

    init() {
        // 创建场景
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB); // 天空蓝

        // 创建相机
        this.camera = new THREE.PerspectiveCamera(
            60,
            window.innerWidth / window.innerHeight,
            0.1,
            2000
        );
        this.camera.position.set(0, 30, 50);

        // 创建渲染器
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        document.body.appendChild(this.renderer.domElement);

        // 添加光源
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const sunLight = new THREE.DirectionalLight(0xffffff, 1);
        sunLight.position.set(100, 100, 50);
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.width = 2048;
        sunLight.shadow.mapSize.height = 2048;
        sunLight.shadow.camera.near = 0.5;
        sunLight.shadow.camera.far = 500;
        sunLight.shadow.camera.left = -100;
        sunLight.shadow.camera.right = 100;
        sunLight.shadow.camera.top = 100;
        sunLight.shadow.camera.bottom = -100;
        this.scene.add(sunLight);

        // 创建自然环境
        this.nature = new Nature();
        this.scene.add(this.nature.mesh);

        // 创建赛道
        this.track = new Track();
        this.scene.add(this.track.mesh);

        // 创建车辆
        this.car = new Car();
        this.scene.add(this.car.mesh);

        // 初始化音频（需要用户交互）
        document.addEventListener('click', () => {
            if (this.car.audioContext.state === 'suspended') {
                this.car.audioContext.resume();
            }
        }, { once: true });

        // 初始化分数
        this.score = {
            checkpoints: 0,
            stars: 0
        };
        this.scoreElement = document.getElementById('score-value');
        this.setupScoreDisplay();

        // 窗口大小调整
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    setupScoreDisplay() {
        const scoreDiv = document.getElementById('score');
        scoreDiv.innerHTML = `
            得分: <span id="score-value">0</span>
             星星: <span id="stars-value">0</span>
        `;
        this.scoreElement = document.getElementById('score-value');
        this.starsElement = document.getElementById('stars-value');
    }

    setupControls() {
        this.keys = {
            ArrowUp: false,
            ArrowDown: false,
            ArrowLeft: false,
            ArrowRight: false,
            Space: false
        };

        document.addEventListener('keydown', (e) => {
            if (this.keys.hasOwnProperty(e.key)) {
                this.keys[e.key] = true;
            }
            if (e.code === 'Space') {
                this.car.isHonking = true;
            }
        });

        document.addEventListener('keyup', (e) => {
            if (this.keys.hasOwnProperty(e.key)) {
                this.keys[e.key] = false;
            }
            if (e.code === 'Space') {
                this.car.isHonking = false;
            }
        });
    }

    updateCamera() {
        const carPosition = this.car.mesh.position;
        const cameraOffset = new THREE.Vector3(
            -Math.sin(this.car.mesh.rotation.y) * 20,
            10,
            -Math.cos(this.car.mesh.rotation.y) * 20
        );

        this.camera.position.lerp(carPosition.clone().add(cameraOffset), 0.1);
        this.camera.lookAt(carPosition);
    }

    update() {
        // 更新车辆
        this.car.update(this.keys);
        
        // 更新相机
        this.updateCamera();
        
        // 更新自然环境
        this.nature.update();

        // 更新星星
        this.stars.forEach(star => {
            if (!star.collected) {
                star.update();
                const distance = this.car.mesh.position.distanceTo(star.mesh.position);
                if (distance < 8) {
                    star.collected = true;
                    star.mesh.visible = false;
                    this.score.stars += 10;
                    this.starsElement.textContent = this.score.stars;
                    this.playStarCollectSound();
                }
            }
        });
        
        // 检查碰撞和得分
        const result = this.track.checkCollisions(this.car);
        if (result && typeof result === 'number') {
            this.score.checkpoints += result;
            this.scoreElement.textContent = this.score.checkpoints;
        }
    }

    playStarCollectSound() {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(
            440, audioContext.currentTime + 0.2
        );

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(
            0.01, audioContext.currentTime + 0.2
        );

        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.2);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.update();
        this.renderer.render(this.scene, this.camera);
    }

    // 添加清理方法
    cleanup() {
        if (this.car) {
            this.car.cleanup();
        }
    }
}

// 启动游戏
window.onload = () => new Game(); 