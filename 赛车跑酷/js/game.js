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

        // 处理屏幕旋转
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.camera.aspect = window.innerWidth / window.innerHeight;
                this.camera.updateProjectionMatrix();
                this.renderer.setSize(window.innerWidth, window.innerHeight);
            }, 100);
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
            if (e.code === 'Space') {
                this.keys.Space = true;
            } else if (this.keys.hasOwnProperty(e.key)) {
                this.keys[e.key] = true;
            }
        });

        document.addEventListener('keyup', (e) => {
            if (e.code === 'Space') {
                this.keys.Space = false;
            } else if (this.keys.hasOwnProperty(e.key)) {
                this.keys[e.key] = false;
            }
        });

        // 添加触摸控制
        this.setupTouchControls();
        
        // 添加设备方向控制
        this.setupDeviceOrientation();
    }

    setupTouchControls() {
        const buttons = {
            'btn-left': 'ArrowLeft',
            'btn-right': 'ArrowRight',
            'btn-accelerate': 'ArrowUp',
            'btn-brake': 'ArrowDown',
            'btn-shoot': 'Space'
        };

        // 处理触摸事件
        const handleTouch = (elementId, isPressed) => {
            const key = buttons[elementId];
            if (key) {
                this.keys[key] = isPressed;
            }
        };

        // 为每个按钮添加事件监听器
        Object.keys(buttons).forEach(btnId => {
            const element = document.getElementById(btnId);
            if (element) {
                // 触摸事件
                element.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleTouch(btnId, true);
                }, { passive: false });

                element.addEventListener('touchend', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleTouch(btnId, false);
                }, { passive: false });

                element.addEventListener('touchcancel', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleTouch(btnId, false);
                }, { passive: false });

                // 鼠标事件（用于桌面端测试）
                element.addEventListener('mousedown', (e) => {
                    e.preventDefault();
                    handleTouch(btnId, true);
                });

                element.addEventListener('mouseup', (e) => {
                    e.preventDefault();
                    handleTouch(btnId, false);
                });

                element.addEventListener('mouseleave', (e) => {
                    e.preventDefault();
                    handleTouch(btnId, false);
                });
            }
        });

        // 防止页面滚动
        document.addEventListener('touchmove', (e) => {
            if (e.target.closest('#mobile-controls')) {
                e.preventDefault();
            }
        }, { passive: false });
    }

    setupDeviceOrientation() {
        // 检查设备方向支持
        if (window.DeviceOrientationEvent) {
            window.addEventListener('deviceorientation', (e) => {
                if (e.gamma === null) return; // 如果没有陀螺仪数据，直接返回

                // 将手机倾斜角度转换为转向控制
                // gamma 是左右倾斜角度
                const tiltThreshold = 10; // 倾斜阈值
                if (e.gamma > tiltThreshold) {
                    this.keys.ArrowLeft = true;
                    this.keys.ArrowRight = false;
                } else if (e.gamma < -tiltThreshold) {
                    this.keys.ArrowLeft = false;
                    this.keys.ArrowRight = true;
                } else {
                    this.keys.ArrowLeft = false;
                    this.keys.ArrowRight = false;
                }
            });
        }
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

        // 检查车辆与动物的碰撞
        this.nature.checkCollisions(this.car);

        // 检查子弹碰撞
        this.nature.checkBulletCollisions(this.car.getBullets());
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