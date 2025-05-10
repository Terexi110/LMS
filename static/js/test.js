const SOLAR_SETTINGS = {
    background: {
        size: 5000,
        texture: '/static/textures/stars.jpg',
        repeats: 8
    },
    sun: {
        radius: 5,
        texture: '/static/textures/sun.jpg'
    },
    planets: [
        { name: "Mercury", radius: 0.8, distance: 12, speed: 0.00047 },
        { name: "Venus", radius: 1.2, distance: 16, speed: 0.00035 },
        { name: "Earth", radius: 1.5, distance: 20, speed: 0.0003, moons: [
            { radius: 0.4, distance: 3, speed: 0.002, texture: 'moon.jpg' }
        ]},
        { name: "Mars", radius: 1.0, distance: 25, speed: 0.00024 },
        { name: "Jupiter", radius: 3.5, distance: 35, speed: 0.00013 },
        { name: "Saturn", radius: 3.0, distance: 45, speed: 0.00009, rings: {
            inner: 4, outer: 6, texture: '/static/textures/saturn_ring.png'
        }},
        { name: "Uranus", radius: 2.5, distance: 55, speed: 0.00007 },
        { name: "Neptune", radius: 2.4, distance: 65, speed: 0.00005 }
    ]
};

class SolarSystem {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.selectedPlanet = null;
        
        this.init();
    }

    init() {
        this.setupScene();
        this.createCelestialBodies();
        this.setupEventListeners();
        this.animate();
    }

    setupScene() {
        // Background
        const bgGeometry = new THREE.SphereGeometry(SOLAR_SETTINGS.background.size, 32, 32);
        const bgTexture = new THREE.TextureLoader().load(SOLAR_SETTINGS.background.texture);
        bgTexture.wrapS = bgTexture.wrapT = THREE.RepeatWrapping;
        bgTexture.repeat.set(SOLAR_SETTINGS.background.repeats, SOLAR_SETTINGS.background.repeats);
        
        this.scene.add(new THREE.Mesh(
            bgGeometry,
            new THREE.MeshBasicMaterial({ map: bgTexture, side: THREE.BackSide })
        ));

        // Camera
        this.camera.position.set(0, 50, 100);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);

        // Lighting
        this.scene.add(new THREE.PointLight(0xffffff, 1.5));
        
        // Controls
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
    }

    createCelestialBodies() {
        // Sun
        const sun = this.createBody(SOLAR_SETTINGS.sun.radius, SOLAR_SETTINGS.sun.texture.split('/').pop());
        sun.material = new THREE.MeshBasicMaterial({ map: sun.material.map });
        sun.name = "Sun";
        this.scene.add(sun);

        // Planets
        SOLAR_SETTINGS.planets.forEach(config => {
            const planet = this.createBody(config.radius, `${config.name.toLowerCase()}.jpg`);
            planet.name = config.name;
            planet.position.x = config.distance;
            planet.angle = Math.random() * Math.PI * 2;
            planet.speed = config.speed;
            planet.initialDistance = config.distance;

            // Кольца
            if(config.rings) {
                const ringGeometry = new THREE.RingGeometry(config.rings.inner, config.rings.outer, 64);
                const ringTexture = new THREE.TextureLoader().load(config.rings.texture);
                const ring = new THREE.Mesh(
                    ringGeometry,
                    new THREE.MeshPhongMaterial({ map: ringTexture, side: THREE.DoubleSide })
                );
                ring.rotation.x = -Math.PI/2;
                planet.add(ring);
            }

            this.scene.add(planet);
            this.createOrbit(config.distance);

            // Луны
            config.moons?.forEach(moonConfig => {
                const moon = this.createMoon(moonConfig);
                planet.add(moon);
            });
        });
    }

    createMoon(config) {
        const moon = new THREE.Mesh(
            new THREE.SphereGeometry(config.radius, 32, 32),
            new THREE.MeshPhongMaterial({
                map: new THREE.TextureLoader().load(`/static/textures/${config.texture}`)
            })
        );
        moon.name = "Moon";
        moon.angle = 0;
        moon.orbitRadius = config.distance;
        moon.orbitalSpeed = config.speed;
        moon.rotationSpeed = 0.01;
        moon.position.set(moon.orbitRadius, 0, 0);
        return moon;
    }

    createBody(radius, texture) {
        return new THREE.Mesh(
            new THREE.SphereGeometry(radius, 32, 32),
            new THREE.MeshPhongMaterial({ 
                map: new THREE.TextureLoader().load(`/static/textures/${texture}`)
            })
        );
    }

    createOrbit(distance) {
        const orbit = new THREE.Line(
            new THREE.RingGeometry(distance - 0.1, distance + 0.1, 64),
            new THREE.LineBasicMaterial({ color: 0x444444 })
        );
        orbit.rotation.x = -Math.PI/2;
        this.scene.add(orbit);
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        if(this.selectedPlanet) {
            this.controls.target.copy(this.selectedPlanet.getWorldPosition(new THREE.Vector3()));
        }
        
        this.scene.children.forEach(obj => {
            if(!obj.isMesh || obj.name === "Sun") return;
            
            // Planet movement
            if(obj.parent === this.scene) {
                obj.angle += obj.speed;
                obj.position.x = Math.cos(obj.angle) * obj.initialDistance;
                obj.position.z = Math.sin(obj.angle) * obj.initialDistance;
                obj.rotation.y += 0.01;
            }

            if (obj.name === "Moon") {
                obj.angle += obj.orbitalSpeed;
                obj.position.x = Math.cos(obj.angle) * obj.orbitRadius;
                obj.position.z = Math.sin(obj.angle) * obj.orbitRadius;
                obj.rotation.y += obj.rotationSpeed;
            }

        });

        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }

    setupEventListeners() {
        let originalMaterial = null;

        document.addEventListener('click', (e) => {
            const raycaster = new THREE.Raycaster();
            const mouse = new THREE.Vector2(
                (e.clientX / window.innerWidth) * 2 - 1,
                -(e.clientY / window.innerHeight) * 2 + 1
            );

            // Собираем все кликабельные объекты включая вложенные
            const meshes = [];
            this.scene.traverse(obj => {
                if (obj.isMesh && !obj.isOrbit) meshes.push(obj);
            });

            raycaster.setFromCamera(mouse, this.camera);
            const [intersect] = raycaster.intersectObjects(meshes);

            if (e.button === 0 && intersect) {
                // Сброс предыдущей подсветки
                if (this.selectedPlanet) {
                    this.selectedPlanet.material = originalMaterial;
                }

                // Установка новой подсветки
                this.selectedPlanet = intersect.object;
                originalMaterial = this.selectedPlanet.material;
                
                this.selectedPlanet.material = new THREE.MeshPhongMaterial({
                    map: originalMaterial.map,
                    emissive: 0xFFA500, // Оранжевое свечение
                    emissiveIntensity: 1
                });

                // Обновление цели камеры
                this.controls.target.copy(this.selectedPlanet.getWorldPosition(new THREE.Vector3()));
            }

            // Сброс правой кнопкой
            if (e.button === 2) {
                if (this.selectedPlanet) {
                    this.selectedPlanet.material = originalMaterial;
                }
                this.controls.target.set(0, 0, 0);
                this.selectedPlanet = null;
            }
        });

        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }
}

new SolarSystem();