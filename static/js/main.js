let scene, camera, renderer, controls;

function init() {
    scene = new THREE.Scene();

    // Фон
    const backgroundGeometry = new THREE.SphereGeometry(5000, 32, 32);
    const backgroundTexture = new THREE.TextureLoader().load('/static/textures/stars.jpg');

    // Настройка повторения текстуры
    backgroundTexture.wrapS = THREE.RepeatWrapping;
    backgroundTexture.wrapT = THREE.RepeatWrapping;
    backgroundTexture.repeat.set(8, 8);

    const backgroundMaterial = new THREE.MeshBasicMaterial({
        map: backgroundTexture,
        side: THREE.BackSide
    });

    const background = new THREE.Mesh(backgroundGeometry, backgroundMaterial);
    scene.add(background);

    // Камера
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 50, 100);

    // Рендер
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Управление камерой
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // Освещение
    const light = new THREE.PointLight(0xffffff, 1.5);
    light.position.set(0, 0, 0);
    scene.add(light);

    createSolarSystem();
    document.addEventListener('click', onDocumentClick, false);

    animate();
}

function createSolarSystem() {
    // Солнце
    const sunGeometry = new THREE.SphereGeometry(5, 32, 32);
    const sunTexture = new THREE.TextureLoader().load('/static/textures/sun.jpg');
    const sun = new THREE.Mesh(sunGeometry, new THREE.MeshBasicMaterial({ map: sunTexture }));
    sun.name = "Sun"
    scene.add(sun);

    // Параметры планет
    const planets = [
        { name: "Mercury", radius: 0.8, distance: 12, speed: 4.7, texture: 'mercury.jpg' },
        { name: "Venus", radius: 1.2, distance: 16, speed: 3.5, texture: 'venus.jpg' },
        { name: "Earth", radius: 1.5, distance: 20, speed: 3.0, texture: 'earth.jpg' },
        { name: "Mars", radius: 1.0, distance: 25, speed: 2.4, texture: 'mars.jpg' },
        { name: "Jupiter", radius: 3.5, distance: 35, speed: 1.3, texture: 'jupiter.jpg' },
        { name: "Saturn", radius: 3.0, distance: 45, speed: 0.9, texture: 'saturn.jpg' },
        { name: "Uranus", radius: 2.5, distance: 55, speed: 0.7, texture: 'uranus.jpg' },
        { name: "Neptune", radius: 2.4, distance: 65, speed: 0.5, texture: 'neptune.jpg' }
    ];

    planets.forEach(planet => {
        // Создание планеты
        const geometry = new THREE.SphereGeometry(planet.radius, 32, 32);
        const texture = new THREE.TextureLoader().load(`/static/textures/${planet.texture}`);
        const material = new THREE.MeshPhongMaterial({ map: texture });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.name = planet.name;

        // Позиционирование на орбите
        mesh.position.x = planet.distance;
        scene.add(mesh);

        // Добавление орбитальной линии
        const orbitGeometry = new THREE.RingGeometry(
            planet.distance - 0.1,
            planet.distance + 0.1,
            64
        );
        const orbitMaterial = new THREE.LineBasicMaterial({ color: 0x444444 });
        const orbit = new THREE.Line(orbitGeometry, orbitMaterial);
        orbit.rotation.x = -Math.PI / 2;
        scene.add(orbit);

        // Добавление свойств для анимации
        mesh.angle = Math.random() * Math.PI * 2; // Начальный случайный угол
        mesh.speed = planet.speed * 0.0001; // Скорость вращения

        mesh.initialDistance = planet.distance;
    });

    // Луна
    const earth = scene.getObjectByName("Earth");
    const moonGeometry = new THREE.SphereGeometry(0.4, 32, 32);
    const moonTexture = new THREE.TextureLoader().load('/static/textures/moon.jpg');
    const moon = new THREE.Mesh(moonGeometry, new THREE.MeshPhongMaterial({ map: moonTexture }));
    moon.name = "Moon";
    moon.position.x = 2;
    earth.add(moon);

    // Свойства для анимации Луны
    moon.angle = 0;
    moon.speed = 0.2; // Скорость вращения вокруг Земли

    // Кольца Сатурна
    const saturnRingGeometry = new THREE.RingGeometry(4, 6, 64);
    const saturnRingTexture = new THREE.TextureLoader().load('/static/textures/saturn_ring.png');
    const saturnRingMaterial = new THREE.MeshPhongMaterial({
        map: saturnRingTexture,
        side: THREE.DoubleSide
    });
    const saturnRing = new THREE.Mesh(saturnRingGeometry, saturnRingMaterial);
    saturnRing.rotation.x = -Math.PI / 2;
    saturnRing.name = "Saturn Rings";
    scene.getObjectByName("Saturn").add(saturnRing);

    // Пояс Койпера и астероиды
    /*const asteroidGeometry = new THREE.SphereGeometry(0.2, 8, 8);
    const asteroidMaterial = new THREE.MeshPhongMaterial({ color: 0x888888 });
    for (let i = 0; i < 1000; i++) {
        const asteroid = new THREE.Mesh(asteroidGeometry, asteroidMaterial);
        asteroid.position.set(
            Math.random() * 100 - 50,
            Math.random() * 10 - 5,
            Math.random() * 100 - 50
        );
    scene.add(asteroid);
    }*/
}

// Raycasting для кликов
function onDocumentClick(event) {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children);

    if (intersects.length > 0) {
        const planet = intersects[0].object;
        showPlanetInfo(planet.name); // Реализовать функцию
    }
}

function animate() {
    requestAnimationFrame(animate);

    // Обновление позиций планет и вращение
    scene.traverse(obj => {
        if (obj.isMesh && obj.name !== "Sun" && obj.parent === scene) {
            // Вращение вокруг Солнца
            obj.angle += obj.speed;
            obj.position.x = obj.initialDistance * Math.cos(obj.angle);
            obj.position.z = obj.initialDistance * Math.sin(obj.angle);

            // Вращение вокруг своей оси
            obj.rotation.y += 0.01;
        }

        if (obj.name === "Moon") {
            obj.angle += obj.speed * 0.1;
            obj.position.x = 3 * Math.cos(obj.angle);
            obj.position.z = 3 * Math.sin(obj.angle);
            obj.rotation.y += 0.02;
        }
    });

    controls.update();
    renderer.render(scene, camera);
}

init();
window.addEventListener('resize', onWindowResize);

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}