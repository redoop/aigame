class Building {
    constructor(position, size) {
        this.mesh = new THREE.Group();
        this.createBuilding(size);
        this.mesh.position.copy(position);
    }

    createBuilding(size) {
        // 主体建筑
        const buildingGeometry = new THREE.BoxGeometry(
            size.width,
            size.height,
            size.depth
        );
        const buildingMaterial = new THREE.MeshPhongMaterial({
            color: this.getRandomBuildingColor(),
            metalness: 0.2,
            roughness: 0.8
        });
        const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
        building.position.y = size.height / 2;
        building.castShadow = true;
        this.mesh.add(building);

        // 添加窗户
        this.addWindows(size);

        // 添加屋顶
        this.addRoof(size);
    }

    addWindows(size) {
        const windowGeometry = new THREE.PlaneGeometry(1.5, 2);
        const windowMaterial = new THREE.MeshPhongMaterial({
            color: 0x88ccff,
            emissive: 0x88ccff,
            emissiveIntensity: 0.2,
            transparent: true,
            opacity: 0.9
        });

        // 计算每面墙的窗户数量
        const rows = Math.floor(size.height / 4);
        const cols = Math.floor(size.width / 3);

        // 添加前后墙的窗户
        [-1, 1].forEach(side => {
            for (let row = 0; row < rows; row++) {
                for (let col = 0; col < cols; col++) {
                    const window = new THREE.Mesh(windowGeometry, windowMaterial);
                    window.position.set(
                        (col - (cols - 1) / 2) * 3,
                        2 + row * 4,
                        side * (size.depth / 2 + 0.1)
                    );
                    window.rotation.y = side < 0 ? Math.PI : 0;
                    this.mesh.add(window);
                }
            }
        });

        // 添加侧面的窗户
        const sideCols = Math.floor(size.depth / 3);
        [-1, 1].forEach(side => {
            for (let row = 0; row < rows; row++) {
                for (let col = 0; col < sideCols; col++) {
                    const window = new THREE.Mesh(windowGeometry, windowMaterial);
                    window.position.set(
                        side * (size.width / 2 + 0.1),
                        2 + row * 4,
                        (col - (sideCols - 1) / 2) * 3
                    );
                    window.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2;
                    this.mesh.add(window);
                }
            }
        });
    }

    addRoof(size) {
        const roofGeometry = new THREE.ConeGeometry(
            size.width / 1.5,
            size.height / 4,
            4
        );
        const roofMaterial = new THREE.MeshPhongMaterial({
            color: 0x884422,
            metalness: 0.1,
            roughness: 0.9
        });
        const roof = new THREE.Mesh(roofGeometry, roofMaterial);
        roof.position.y = size.height + size.height / 8;
        roof.rotation.y = Math.PI / 4;
        this.mesh.add(roof);
    }

    getRandomBuildingColor() {
        const colors = [
            0xcccccc, // 灰色
            0xdddddd, // 浅灰
            0xeeeeee, // 米白
            0xffcccc, // 粉色
            0xccffcc  // 浅绿
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }
} 