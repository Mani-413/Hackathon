import * as THREE from 'three';

export class DottedSurface {
    constructor(container) {
        this.container = container;
        this.SEPARATION = 100;
        this.AMOUNTX = 50;
        this.AMOUNTY = 50;
        this.init();
    }

    init() {
        this.scene = new THREE.Scene();
        // Match the deep dark background of the page
        this.scene.fog = new THREE.Fog(0x020205, 2000, 10000);

        this.camera = new THREE.PerspectiveCamera(
            60,
            window.innerWidth / window.innerHeight,
            1,
            10000
        );
        this.camera.position.set(0, 355, 1220);

        this.renderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: true,
        });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);

        // Ensure the canvas is in the container
        this.container.appendChild(this.renderer.domElement);

        const positions = [];
        const colors = [];

        for (let ix = 0; ix < this.AMOUNTX; ix++) {
            for (let iy = 0; iy < this.AMOUNTY; iy++) {
                const x = ix * this.SEPARATION - (this.AMOUNTX * this.SEPARATION) / 2;
                const y = 0;
                const z = iy * this.SEPARATION - (this.AMOUNTY * this.SEPARATION) / 2;

                positions.push(x, y, z);

                // Color: Neon Cyan/Blue to match new theme (approx #00f3ff)
                // 0x00f3ff -> r:0, g:0.95, b:1.0
                colors.push(0, 0.95, 1.0);
            }
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
            size: 10, // Increased thickness as requested
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            sizeAttenuation: true,
        });

        this.points = new THREE.Points(geometry, material);
        this.points.position.y = 150; // Move background up
        this.scene.add(this.points);

        this.count = 0;
        this.animate = this.animate.bind(this);
        this.handleResize = this.handleResize.bind(this);

        window.addEventListener('resize', this.handleResize);

        this.animate();
    }

    animate() {
        requestAnimationFrame(this.animate);

        const positions = this.points.geometry.attributes.position.array;
        let i = 0;

        for (let ix = 0; ix < this.AMOUNTX; ix++) {
            for (let iy = 0; iy < this.AMOUNTY; iy++) {
                const index = i * 3;
                // Animate Y position with sine waves
                positions[index + 1] =
                    Math.sin((ix + this.count) * 0.3) * 50 +
                    Math.sin((iy + this.count) * 0.5) * 50;
                i++;
            }
        }

        this.points.geometry.attributes.position.needsUpdate = true;
        this.renderer.render(this.scene, this.camera);
        this.count += 0.1;
    }

    handleResize() {
        if (!this.camera || !this.renderer) return;
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}
