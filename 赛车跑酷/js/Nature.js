class Nature {
    constructor() {
        this.mesh = new THREE.Group();
        this.createSky();
        this.createGrass();
        this.createYurts();
        this.createAnimals();
        this.createFlowers();
        this.createGinkgoTrees();
        this.createRoses();
    }

    createSky() {
        // 创建太阳
        const sunGeometry = new THREE.SphereGeometry(10, 32, 32);
        const sunMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xffff00,
            emissive: 0xffff00,
            emissiveIntensity: 1
        });
        const sun = new THREE.Mesh(sunGeometry, sunMaterial);
        sun.position.set(100, 100, -100);
        this.mesh.add(sun);
    }

    createGrass() {
        // 创建大片草地
        const grassGeometry = new THREE.PlaneGeometry(1000, 1000);
        const grassTexture = this.createGrassTexture();
        const grassMaterial = new THREE.MeshPhongMaterial({
            color: 0x3a9d23,
            map: grassTexture,
            side: THREE.DoubleSide
        });
        const grass = new THREE.Mesh(grassGeometry, grassMaterial);
        grass.rotation.x = -Math.PI / 2;
        grass.receiveShadow = true;
        this.mesh.add(grass);

        // 添加草丛
        for (let i = 0; i < 2000; i++) {
            const x = (Math.random() - 0.5) * 800;
            const z = (Math.random() - 0.5) * 800;
            // 避开赛道区域
            const distanceFromCenter = Math.sqrt(x * x + z * z);
            if (distanceFromCenter < 70) continue;

            const grassBlade = this.createGrassBlade();
            grassBlade.position.set(x, 0, z);
            grassBlade.rotation.y = Math.random() * Math.PI;
            this.mesh.add(grassBlade);
        }
    }

    createGrassTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const context = canvas.getContext('2d');

        context.fillStyle = '#3a9d23';
        context.fillRect(0, 0, 256, 256);

        // 添加纹理细节
        for (let i = 0; i < 1000; i++) {
            const x = Math.random() * 256;
            const y = Math.random() * 256;
            const size = Math.random() * 3 + 1;
            context.fillStyle = Math.random() > 0.5 ? '#2d7a1c' : '#45b82b';
            context.fillRect(x, y, size, size);
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(50, 50);
        return texture;
    }

    createGrassBlade() {
        const blade = new THREE.Mesh(
            new THREE.PlaneGeometry(0.1, 0.3 + Math.random() * 0.2),
            new THREE.MeshPhongMaterial({
                color: 0x3a9d23,
                side: THREE.DoubleSide
            })
        );
        blade.position.y = 0.15;
        return blade;
    }

    createYurts() {
        // 创建蒙古包
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const radius = 150 + Math.random() * 50;
            const yurt = this.createYurt();
            yurt.position.set(
                Math.cos(angle) * radius,
                0,
                Math.sin(angle) * radius
            );
            yurt.rotation.y = Math.random() * Math.PI * 2;
            this.mesh.add(yurt);
        }
    }

    createYurt() {
        const yurt = new THREE.Group();

        // 底座
        const baseGeometry = new THREE.CylinderGeometry(5, 5, 0.5, 16);
        const baseMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        yurt.add(base);

        // 墙壁
        const wallGeometry = new THREE.CylinderGeometry(5, 5, 4, 16);
        const wallMaterial = new THREE.MeshPhongMaterial({ color: 0xF5DEB3 });
        const wall = new THREE.Mesh(wallGeometry, wallMaterial);
        wall.position.y = 2.25;
        wall.castShadow = true;
        yurt.add(wall);

        // 屋顶
        const roofGeometry = new THREE.ConeGeometry(5.5, 3, 16);
        const roofMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
        const roof = new THREE.Mesh(roofGeometry, roofMaterial);
        roof.position.y = 5.75;
        roof.castShadow = true;
        yurt.add(roof);

        return yurt;
    }

    createAnimals() {
        // 创建羊群
        for (let i = 0; i < 20; i++) {
            const sheep = this.createSheep();
            const angle = Math.random() * Math.PI * 2;
            const radius = 100 + Math.random() * 200;
            sheep.position.set(
                Math.cos(angle) * radius,
                0,
                Math.sin(angle) * radius
            );
            sheep.rotation.y = Math.random() * Math.PI * 2;
            this.mesh.add(sheep);
        }

        // 创建牛群
        for (let i = 0; i < 10; i++) {
            const cow = this.createCow();
            const angle = Math.random() * Math.PI * 2;
            const radius = 100 + Math.random() * 200;
            cow.position.set(
                Math.cos(angle) * radius,
                0,
                Math.sin(angle) * radius
            );
            cow.rotation.y = Math.random() * Math.PI * 2;
            this.mesh.add(cow);
        }
    }

    createSheep() {
        const sheep = new THREE.Group();

        // 身体
        const body = new THREE.Mesh(
            new THREE.SphereGeometry(1, 16, 16),
            new THREE.MeshPhongMaterial({ color: 0xFFFFFF })
        );
        body.position.y = 1;
        sheep.add(body);

        // 头
        const head = new THREE.Mesh(
            new THREE.SphereGeometry(0.5, 16, 16),
            new THREE.MeshPhongMaterial({ color: 0xFFFFFF })
        );
        head.position.set(0.8, 1.5, 0);
        sheep.add(head);

        // 腿
        const legGeometry = new THREE.CylinderGeometry(0.15, 0.15, 1);
        const legMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
        const legPositions = [
            [-0.5, 0.5, 0.5], [0.5, 0.5, 0.5],
            [-0.5, 0.5, -0.5], [0.5, 0.5, -0.5]
        ];

        legPositions.forEach(pos => {
            const leg = new THREE.Mesh(legGeometry, legMaterial);
            leg.position.set(...pos);
            sheep.add(leg);
        });

        return sheep;
    }

    createCow() {
        const cow = new THREE.Group();

        // 身体
        const body = new THREE.Mesh(
            new THREE.BoxGeometry(2, 1.5, 1),
            new THREE.MeshPhongMaterial({ color: 0x8B4513 })
        );
        body.position.y = 1.5;
        cow.add(body);

        // 头
        const head = new THREE.Mesh(
            new THREE.BoxGeometry(1, 1, 0.8),
            new THREE.MeshPhongMaterial({ color: 0x8B4513 })
        );
        head.position.set(1.5, 1.8, 0);
        cow.add(head);

        // 腿
        const legGeometry = new THREE.CylinderGeometry(0.2, 0.2, 1.5);
        const legMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
        const legPositions = [
            [-0.7, 0.75, 0.3], [0.7, 0.75, 0.3],
            [-0.7, 0.75, -0.3], [0.7, 0.75, -0.3]
        ];

        legPositions.forEach(pos => {
            const leg = new THREE.Mesh(legGeometry, legMaterial);
            leg.position.set(...pos);
            cow.add(leg);
        });

        return cow;
    }

    createFlowers() {
        const flowerColors = [0xff69b4, 0xffd700, 0xff6347, 0x9370db];
        
        for (let i = 0; i < 300; i++) {
            const x = (Math.random() - 0.5) * 800;
            const z = (Math.random() - 0.5) * 800;
            // 避开赛道区域
            const distanceFromCenter = Math.sqrt(x * x + z * z);
            if (distanceFromCenter < 70) continue;

            const flower = this.createFlower(flowerColors[Math.floor(Math.random() * flowerColors.length)]);
            flower.position.set(x, 0, z);
            flower.rotation.y = Math.random() * Math.PI;
            this.mesh.add(flower);
        }
    }

    createFlower(color) {
        const flower = new THREE.Group();
        
        // 花瓣
        for (let i = 0; i < 5; i++) {
            const petal = new THREE.Mesh(
                new THREE.PlaneGeometry(0.2, 0.2),
                new THREE.MeshPhongMaterial({
                    color: color,
                    side: THREE.DoubleSide
                })
            );
            petal.rotation.y = (i / 5) * Math.PI * 2;
            petal.rotation.x = Math.PI / 4;
            petal.position.y = 0.3;
            flower.add(petal);
        }

        // 茎
        const stem = new THREE.Mesh(
            new THREE.CylinderGeometry(0.02, 0.02, 0.3),
            new THREE.MeshPhongMaterial({ color: 0x228B22 })
        );
        stem.position.y = 0.15;
        flower.add(stem);

        return flower;
    }

    update() {
        // 动物随机移动
        this.mesh.children.forEach(child => {
            if (child.isSheep || child.isCow) {
                if (Math.random() < 0.01) {
                    child.rotation.y += (Math.random() - 0.5) * 0.1;
                }
                const speed = 0.05;
                child.position.x += Math.sin(child.rotation.y) * speed;
                child.position.z += Math.cos(child.rotation.y) * speed;
            }
        });
    }

    createGinkgoTrees() {
        // 在场景边缘添加银杏树
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const radius = 250 + Math.random() * 50;
            const tree = this.createGinkgoTree();
            tree.position.set(
                Math.cos(angle) * radius,
                0,
                Math.sin(angle) * radius
            );
            tree.rotation.y = Math.random() * Math.PI * 2;
            const scale = 1 + Math.random() * 0.5;
            tree.scale.set(scale, scale, scale);
            this.mesh.add(tree);
        }
    }

    createGinkgoTree() {
        const tree = new THREE.Group();

        // 树干
        const trunkGeometry = new THREE.CylinderGeometry(0.5, 0.8, 8, 8);
        const trunkMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.y = 4;
        trunk.castShadow = true;
        tree.add(trunk);

        // 树叶（扇形）
        const leafCount = 50;
        const leafGeometry = new THREE.CircleGeometry(1, 5);  // 5边形接近银杏叶形状
        const leafMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xFFD700,  // 金黄色
            side: THREE.DoubleSide 
        });

        for (let i = 0; i < leafCount; i++) {
            const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
            
            // 随机位置和旋转
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI * 0.5;
            const radius = 3 + Math.random() * 2;
            
            leaf.position.set(
                Math.sin(phi) * Math.cos(theta) * radius,
                8 + Math.random() * 4,
                Math.sin(phi) * Math.sin(theta) * radius
            );
            
            leaf.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );
            
            leaf.castShadow = true;
            tree.add(leaf);
        }

        return tree;
    }

    createRoses() {
        // 在场景中添加玫瑰花丛
        for (let i = 0; i < 10; i++) {
            const angle = (i / 10) * Math.PI * 2;
            const radius = 180 + Math.random() * 30;
            const roseCluster = this.createRoseCluster();
            roseCluster.position.set(
                Math.cos(angle) * radius,
                0,
                Math.sin(angle) * radius
            );
            roseCluster.rotation.y = Math.random() * Math.PI * 2;
            this.mesh.add(roseCluster);
        }
    }

    createRoseCluster() {
        const cluster = new THREE.Group();
        
        // 创建多朵玫瑰
        for (let i = 0; i < 5; i++) {
            const rose = this.createRose();
            rose.position.set(
                (Math.random() - 0.5) * 3,
                0,
                (Math.random() - 0.5) * 3
            );
            cluster.add(rose);
        }
        
        return cluster;
    }

    createRose() {
        const rose = new THREE.Group();

        // 花茎
        const stemGeometry = new THREE.CylinderGeometry(0.05, 0.05, 2, 8);
        const stemMaterial = new THREE.MeshPhongMaterial({ color: 0x228B22 });
        const stem = new THREE.Mesh(stemGeometry, stemMaterial);
        stem.position.y = 1;
        rose.add(stem);

        // 花朵（多层花瓣）
        const petalCount = 15;
        const petalGeometry = new THREE.PlaneGeometry(0.3, 0.3);
        const petalMaterial = new THREE.MeshPhongMaterial({
            color: 0xFF0000,  // 红玫瑰
            side: THREE.DoubleSide,
            shininess: 50
        });

        for (let i = 0; i < petalCount; i++) {
            const petal = new THREE.Mesh(petalGeometry, petalMaterial);
            const angle = (i / petalCount) * Math.PI * 2;
            const radius = 0.15;
            
            petal.position.set(
                Math.cos(angle) * radius,
                2 + Math.random() * 0.1,
                Math.sin(angle) * radius
            );
            
            petal.rotation.set(
                Math.PI / 4 + Math.random() * 0.2,
                angle,
                Math.random() * 0.2
            );
            
            rose.add(petal);
        }

        // 叶子
        const leafGeometry = new THREE.PlaneGeometry(0.4, 0.2);
        const leafMaterial = new THREE.MeshPhongMaterial({
            color: 0x228B22,
            side: THREE.DoubleSide
        });

        for (let i = 0; i < 3; i++) {
            const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
            leaf.position.set(
                Math.random() * 0.2,
                0.5 + Math.random(),
                Math.random() * 0.2
            );
            leaf.rotation.set(
                Math.PI / 4,
                Math.random() * Math.PI * 2,
                0
            );
            rose.add(leaf);
        }

        return rose;
    }
} 