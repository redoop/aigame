class Star {
    constructor() {
        this.mesh = new THREE.Group();
        this.createStar();
        this.rotationSpeed = 0.02;
        this.floatSpeed = 0.01;
        this.floatOffset = 0;
        this.collected = false;
    }

    createStar() {
        // 创建五角星形状
        const starShape = new THREE.Shape();
        const points = 5;
        const outerRadius = 2;
        const innerRadius = 0.8;

        for (let i = 0; i < points * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (i / (points * 2)) * Math.PI * 2;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            if (i === 0) {
                starShape.moveTo(x, y);
            } else {
                starShape.lineTo(x, y);
            }
        }

        const geometry = new THREE.ExtrudeGeometry(starShape, {
            depth: 0.4,
            bevelEnabled: false
        });

        const material = new THREE.MeshPhongMaterial({
            color: 0xFFD700,
            emissive: 0xFFD700,
            emissiveIntensity: 0.8,
            shininess: 100
        });

        const starMesh = new THREE.Mesh(geometry, material);
        starMesh.scale.set(1, 1, 1);
        starMesh.rotation.set(0, 0, 0);
        this.mesh.add(starMesh);

        // 添加光晕效果
        const glowGeometry = new THREE.CircleGeometry(3, 32);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0xFFFF00,
            transparent: true,
            opacity: 0.4,
            side: THREE.DoubleSide
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.scale.set(1, 1, 1);
        glow.rotation.set(0, 0, 0);
        this.mesh.add(glow);
    }

    update() {
        if (this.collected) return;

        // 旋转动画
        this.mesh.rotation.y += this.rotationSpeed;

        // 上下浮动动画
        this.floatOffset += this.floatSpeed;
        this.mesh.position.y = Math.sin(this.floatOffset) * 0.8 + 3;
    }
} 