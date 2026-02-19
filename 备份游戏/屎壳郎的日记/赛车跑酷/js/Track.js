class Track {
    constructor() {
        this.mesh = new THREE.Group();
        this.createTrack();
        this.createCheckpoints();
    }

    createTrack() {
        // 创建赛道路径点
        const trackPoints = [
            { x: 0, y: 0, z: 0 },
            { x: 50, y: 0, z: 50 },
            { x: 100, y: 0, z: 0 },
            { x: 50, y: 0, z: -50 },
            { x: -50, y: 0, z: -50 },
            { x: -100, y: 0, z: 0 },
            { x: -50, y: 0, z: 50 }
        ];

        // 创建曲线
        const curve = new THREE.CatmullRomCurve3(
            trackPoints.map(p => new THREE.Vector3(p.x, p.y, p.z))
        );
        curve.closed = true;

        // 创建赛道
        const trackWidth = 15;
        const trackGeometry = new THREE.BufferGeometry();
        const vertices = [];
        const uvs = [];

        // 生成赛道顶点
        const segments = 100;
        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const point = curve.getPoint(t);
            const tangent = curve.getTangent(t);
            const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

            vertices.push(
                point.x + normal.x * trackWidth, 0.01, point.z + normal.z * trackWidth,
                point.x - normal.x * trackWidth, 0.01, point.z - normal.z * trackWidth
            );

            uvs.push(0, t, 1, t);
        }

        // 创建面
        const indices = [];
        for (let i = 0; i < segments; i++) {
            const base = i * 2;
            indices.push(
                base, base + 1, base + 2,
                base + 1, base + 3, base + 2
            );
        }

        trackGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        trackGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
        trackGeometry.setIndex(indices);
        trackGeometry.computeVertexNormals();

        // 创建赛道材质
        const trackMaterial = new THREE.MeshPhongMaterial({
            color: 0x3a9d23,  // 草地颜色
            side: THREE.DoubleSide,
            map: this.createTrackTexture()
        });

        const track = new THREE.Mesh(trackGeometry, trackMaterial);
        track.receiveShadow = true;
        this.mesh.add(track);

        // 保存赛道曲线供其他方法使用
        this.trackCurve = curve;
    }

    createTrackTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const context = canvas.getContext('2d');

        // 绘制草地纹理
        context.fillStyle = '#3a9d23';
        context.fillRect(0, 0, 256, 256);

        // 添加草地细节
        for (let i = 0; i < 1000; i++) {
            const x = Math.random() * 256;
            const y = Math.random() * 256;
            const size = Math.random() * 3 + 1;
            context.fillStyle = Math.random() > 0.5 ? '#2d7a1c' : '#45b82b';
            context.fillRect(x, y, size, size);
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(10, 1);
        return texture;
    }

    createCheckpoints() {
        this.checkpoints = [];
        const checkpointCount = 8;

        for (let i = 0; i < checkpointCount; i++) {
            const t = i / checkpointCount;
            const position = this.trackCurve.getPoint(t);
            const checkpoint = {
                position: position,
                passed: false,
                points: 100
            };
            this.checkpoints.push(checkpoint);
        }
    }

    checkCollisions(car) {
        // 检查检查点
        for (let checkpoint of this.checkpoints) {
            if (!checkpoint.passed) {
                const distance = car.mesh.position.distanceTo(checkpoint.position);
                if (distance < 5) {
                    checkpoint.passed = true;
                    return checkpoint.points;
                }
            }
        }

        // 检查是否在赛道上
        const nearestPoint = this.findNearestTrackPoint(car.mesh.position);
        if (!nearestPoint || nearestPoint.distance > 15) {
            return null;
        }

        return null;
    }

    findNearestTrackPoint(position) {
        let minDistance = Infinity;
        let nearestPoint = null;

        for (let t = 0; t <= 1; t += 0.01) {
            const point = this.trackCurve.getPoint(t);
            const distance = position.distanceTo(point);
            if (distance < minDistance) {
                minDistance = distance;
                nearestPoint = {
                    point: point,
                    distance: distance,
                    t: t
                };
            }
        }

        return nearestPoint;
    }
} 