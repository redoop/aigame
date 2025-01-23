class Car {
    constructor() {
        this.mesh = new THREE.Group();
        this.speed = 0;
        this.maxSpeed = 1.5;
        this.acceleration = 0.015;
        this.deceleration = 0.01;
        this.turnSpeed = 0.03;
        this.createCar();
        this.setupAudio();
        this.isHonking = false;
        
        // 添加机枪相关属性
        this.bullets = [];
        this.bulletSpeed = 2;
        this.lastShotTime = 0;
        this.shootingCooldown = 100;
        this.isAutoShooting = false;
        this.autoShootInterval = null;
        this.createGuns();
    }

    setupAudio() {
        // 创建音频上下文
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // 创建主音量控制
        this.masterGain = this.audioContext.createGain();
        this.masterGain.gain.value = 0.3;
        this.masterGain.connect(this.audioContext.destination);

        // 创建发动机声音
        this.engineSound = this.createEngineSound();
        
        // 创建刹车声音
        this.brakeSound = this.createBrakeSound();

        // 创建喇叭声音
        this.hornSound = this.createHornSound();
    }

    createEngineSound() {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        // 设置发动机声音特性
        oscillator.type = 'sawtooth';
        oscillator.frequency.value = 50;
        gainNode.gain.value = 0;

        // 连接节点
        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        // 启动振荡器
        oscillator.start();

        return { oscillator, gainNode };
    }

    createBrakeSound() {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.type = 'square';
        oscillator.frequency.value = 100;
        gainNode.gain.value = 0;

        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        oscillator.start();

        return { oscillator, gainNode };
    }

    createHornSound() {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        // 设置喇叭声音特性
        oscillator.type = 'square';
        oscillator.frequency.value = 400;  // 基础频率
        gainNode.gain.value = 0;  // 初始音量为0

        // 连接节点
        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        // 启动振荡器
        oscillator.start();

        return { oscillator, gainNode };
    }

    updateSounds() {
        // 更新发动机声音
        if (Math.abs(this.speed) > 0.01) {
            this.engineSound.gainNode.gain.value = Math.min(Math.abs(this.speed) / this.maxSpeed, 1) * 0.3;
            this.engineSound.oscillator.frequency.value = 50 + Math.abs(this.speed) * 100;
        } else {
            this.engineSound.gainNode.gain.value = 0.05; // 怠速声音
        }

        // 刹车声音
        if (this.isBraking) {
            this.brakeSound.gainNode.gain.value = 0.1;
        } else {
            this.brakeSound.gainNode.gain.value = 0;
        }

        // 喇叭声音
        if (this.isHonking) {
            this.hornSound.gainNode.gain.value = 0.3;
            this.hornSound.oscillator.frequency.value = 400 + Math.sin(Date.now() * 0.01) * 50;
        } else {
            this.hornSound.gainNode.gain.value = 0;
        }
    }

    createCar() {
        // 创建车身主体
        const bodyGeometry = new THREE.BoxGeometry(2, 0.5, 4.5);
        const bodyMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xFF0000,  // 法拉利红
            specular: 0x666666,
            shininess: 100
        });
        const mainBody = new THREE.Mesh(bodyGeometry, bodyMaterial);
        mainBody.position.y = 0.5;
        mainBody.castShadow = true;
        this.mesh.add(mainBody);

        // 创建车顶
        const roofGeometry = new THREE.BoxGeometry(1.8, 0.4, 2);
        const roof = new THREE.Mesh(roofGeometry, bodyMaterial);
        roof.position.set(0, 0.9, -0.3);
        roof.castShadow = true;
        this.mesh.add(roof);

        // 创建前挡风玻璃
        const windshieldGeometry = new THREE.PlaneGeometry(1.7, 0.7);
        const glassMaterial = new THREE.MeshPhongMaterial({
            color: 0x666666,
            transparent: true,
            opacity: 0.5,
            specular: 0xFFFFFF,
            shininess: 100
        });
        const frontWindshield = new THREE.Mesh(windshieldGeometry, glassMaterial);
        frontWindshield.position.set(0, 0.8, 0.7);
        frontWindshield.rotation.x = Math.PI * 0.25;
        this.mesh.add(frontWindshield);

        // 创建后挡风玻璃
        const rearWindshield = new THREE.Mesh(windshieldGeometry, glassMaterial);
        rearWindshield.position.set(0, 0.8, -1.3);
        rearWindshield.rotation.x = -Math.PI * 0.25;
        this.mesh.add(rearWindshield);

        // 创建前保险杠
        const frontBumperGeometry = new THREE.BoxGeometry(2, 0.2, 0.5);
        const bumperMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x111111,
            specular: 0x666666,
            shininess: 100
        });
        const frontBumper = new THREE.Mesh(frontBumperGeometry, bumperMaterial);
        frontBumper.position.set(0, 0.3, 2);
        this.mesh.add(frontBumper);

        // 创建进气格栅
        const grilleGeometry = new THREE.PlaneGeometry(1.5, 0.3);
        const grilleMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x111111,
            side: THREE.DoubleSide
        });
        const grille = new THREE.Mesh(grilleGeometry, grilleMaterial);
        grille.position.set(0, 0.4, 2.01);
        this.mesh.add(grille);

        // 创建法拉利标志
        const logoGeometry = new THREE.CircleGeometry(0.15, 32);
        const logoMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xFFD700,  // 金色
            specular: 0xFFFFFF,
            shininess: 200
        });
        const logo = new THREE.Mesh(logoGeometry, logoMaterial);
        logo.position.set(0, 0.7, 2.01);
        this.mesh.add(logo);

        // 创建车轮
        const wheelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 32);
        const wheelMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x111111,
            specular: 0x444444,
            shininess: 100
        });

        // 轮毂
        const hubGeometry = new THREE.CylinderGeometry(0.25, 0.25, 0.31, 16);
        const hubMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xCCCCCC,
            specular: 0xFFFFFF,
            shininess: 200
        });

        // 创建四个轮子
        const wheelPositions = [
            { x: -1, y: 0.4, z: 1.5 },   // 左前
            { x: 1, y: 0.4, z: 1.5 },    // 右前
            { x: -1, y: 0.4, z: -1.5 },  // 左后
            { x: 1, y: 0.4, z: -1.5 }    // 右后
        ];

        this.wheelMeshes = wheelPositions.map(pos => {
            const wheelGroup = new THREE.Group();
            
            const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
            wheel.rotation.z = Math.PI / 2;
            wheelGroup.add(wheel);

            const hub = new THREE.Mesh(hubGeometry, hubMaterial);
            hub.rotation.z = Math.PI / 2;
            wheelGroup.add(hub);

            wheelGroup.position.set(pos.x, pos.y, pos.z);
            wheelGroup.castShadow = true;
            this.mesh.add(wheelGroup);
            return wheelGroup;
        });

        // 创建侧裙
        const sideSkirtGeometry = new THREE.BoxGeometry(0.1, 0.2, 3);
        const sideSkirtMaterial = new THREE.MeshPhongMaterial({ color: 0x111111 });
        [-0.95, 0.95].forEach(x => {
            const sideSkirt = new THREE.Mesh(sideSkirtGeometry, sideSkirtMaterial);
            sideSkirt.position.set(x, 0.3, 0);
            this.mesh.add(sideSkirt);
        });

        // 创建尾翼
        const spoilerGeometry = new THREE.BoxGeometry(1.8, 0.1, 0.4);
        const spoiler = new THREE.Mesh(spoilerGeometry, bodyMaterial);
        spoiler.position.set(0, 0.9, -2);
        this.mesh.add(spoiler);

        // 创建尾灯
        const tailLightGeometry = new THREE.PlaneGeometry(0.3, 0.1);
        const tailLightMaterial = new THREE.MeshPhongMaterial({
            color: 0xFF0000,
            emissive: 0xFF0000,
            emissiveIntensity: 0.5
        });
        [-0.5, 0.5].forEach(x => {
            const tailLight = new THREE.Mesh(tailLightGeometry, tailLightMaterial);
            tailLight.position.set(x, 0.5, -2.01);
            this.mesh.add(tailLight);
        });

        // 创建前大灯
        const headlightGeometry = new THREE.CircleGeometry(0.15, 16);
        const headlightMaterial = new THREE.MeshPhongMaterial({
            color: 0xFFFFCC,
            emissive: 0xFFFFCC,
            emissiveIntensity: 0.5
        });
        [-0.6, 0.6].forEach(x => {
            const headlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
            headlight.position.set(x, 0.5, 2.01);
            this.mesh.add(headlight);
        });

        // 设置初始位置
        this.mesh.position.set(0, 0, 0);
    }

    createGuns() {
        // 创建左右两个机枪
        const gunGeometry = new THREE.BoxGeometry(0.2, 0.2, 1);
        const gunMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
        
        // 左机枪
        this.leftGun = new THREE.Mesh(gunGeometry, gunMaterial);
        this.leftGun.position.set(-0.8, 0.5, 2.2);
        this.mesh.add(this.leftGun);
        
        // 右机枪
        this.rightGun = new THREE.Mesh(gunGeometry, gunMaterial);
        this.rightGun.position.set(0.8, 0.5, 2.2);
        this.mesh.add(this.rightGun);
    }

    shoot() {
        const currentTime = Date.now();
        if (currentTime - this.lastShotTime < this.shootingCooldown) return;
        
        this.lastShotTime = currentTime;

        // 创建子弹几何体和材质
        const bulletGeometry = new THREE.SphereGeometry(0.1, 8, 8);
        const bulletMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xffff00,
            emissive: 0xffff00,
            emissiveIntensity: 0.5
        });

        // 从两个机枪发射子弹
        const gunPositions = [this.leftGun.position, this.rightGun.position];
        
        gunPositions.forEach(gunPos => {
            const bullet = new THREE.Mesh(bulletGeometry, bulletMaterial);
            
            // 设置子弹初始位置（相对于车的位置）
            bullet.position.copy(this.mesh.position);
            bullet.position.y += gunPos.y;
            bullet.position.x += Math.sin(this.mesh.rotation.y) * gunPos.z + Math.cos(this.mesh.rotation.y) * gunPos.x;
            bullet.position.z += Math.cos(this.mesh.rotation.y) * gunPos.z - Math.sin(this.mesh.rotation.y) * gunPos.x;

            // 设置子弹速度方向（基于车的朝向）
            bullet.userData = {
                velocity: new THREE.Vector3(
                    Math.sin(this.mesh.rotation.y) * this.bulletSpeed,
                    0,
                    Math.cos(this.mesh.rotation.y) * this.bulletSpeed
                ),
                timeCreated: currentTime
            };

            this.bullets.push(bullet);
            this.mesh.parent.add(bullet); // 添加到场景中
        });

        // 播放射击音效
        this.playShootSound();
    }

    playShootSound() {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(220, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(110, audioContext.currentTime + 0.1);

        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.1);
    }

    update(controls) {
        // 记录是否刹车
        this.isBraking = controls.ArrowUp && controls.ArrowDown;

        // 处理加速和减速
        if (controls.ArrowUp && !controls.ArrowDown) {
            this.speed = Math.min(this.speed + this.acceleration, this.maxSpeed);
        } else if (controls.ArrowDown && !controls.ArrowUp) {
            this.speed = Math.max(this.speed - this.acceleration, -this.maxSpeed * 0.5);
        } else {
            // 自然减速
            if (this.speed > 0) {
                this.speed = Math.max(this.speed - this.deceleration, 0);
            } else if (this.speed < 0) {
                this.speed = Math.min(this.speed + this.deceleration, 0);
            }
        }

        // 处理转向
        if (controls.ArrowLeft) {
            this.mesh.rotation.y += this.turnSpeed;
        }
        if (controls.ArrowRight) {
            this.mesh.rotation.y -= this.turnSpeed;
        }

        // 更新位置
        this.mesh.position.x += Math.sin(this.mesh.rotation.y) * this.speed;
        this.mesh.position.z += Math.cos(this.mesh.rotation.y) * this.speed;

        // 更新子弹位置
        this.bullets = this.bullets.filter(bullet => {
            // 移动子弹
            bullet.position.add(bullet.userData.velocity);
            
            // 检查子弹是否存在超过3秒
            const age = Date.now() - bullet.userData.timeCreated;
            if (age > 3000) {
                this.mesh.parent.remove(bullet);
                return false;
            }
            return true;
        });

        // 处理射击
        if (controls.Space) {
            if (!this.isAutoShooting) {
                this.isAutoShooting = true;
                this.shoot(); // 立即射击一次
                // 设置自动射击定时器
                this.autoShootInterval = setInterval(() => {
                    this.shoot();
                }, this.shootingCooldown);
            }
        } else {
            if (this.isAutoShooting) {
                this.isAutoShooting = false;
                // 清除自动射击定时器
                if (this.autoShootInterval) {
                    clearInterval(this.autoShootInterval);
                    this.autoShootInterval = null;
                }
            }
        }

        // 更新声音
        this.updateSounds();
    }

    // 获取当前所有子弹
    getBullets() {
        return this.bullets;
    }

    // 清理音频资源
    cleanup() {
        if (this.audioContext) {
            this.engineSound.oscillator.stop();
            this.brakeSound.oscillator.stop();
            this.hornSound.oscillator.stop();
            this.audioContext.close();
        }
        
        // 清理所有子弹
        this.bullets.forEach(bullet => {
            if (bullet.parent) {
                bullet.parent.remove(bullet);
            }
        });
        this.bullets = [];
        
        // 清理自动射击定时器
        if (this.autoShootInterval) {
            clearInterval(this.autoShootInterval);
            this.autoShootInterval = null;
        }
    }

    setupControls() {
        document.addEventListener('keydown', (e) => {
            if (this.keys.hasOwnProperty(e.key)) {
                this.keys[e.key] = true;
            }
            // 喇叭使用 'H' 键
            if (e.code === 'KeyH') {
                this.isHonking = true;
            }
        });

        document.addEventListener('keyup', (e) => {
            if (this.keys.hasOwnProperty(e.key)) {
                this.keys[e.key] = false;
            }
            // 喇叭使用 'H' 键
            if (e.code === 'KeyH') {
                this.isHonking = false;
            }
        });
    }
} 