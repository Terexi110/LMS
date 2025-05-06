let scene, camera, renderer, controls;

function init() {
    // Сцена
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    // Камера
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 50, 100);

    // Рендерер
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

    // Создание Солнца и планет
    createSolarSystem();

    // Обработка кликов
    document.addEventListener('click', onDocumentClick, false);

    animate();
}

function createSolarSystem() {
    // Солнце (масштаб уменьшен для визуализации)
    const sunGeometry = new THREE.SphereGeometry(5, 32, 32);
    const sunTexture = new THREE.TextureLoader().load('/static/textures/sun.jpg');
    const sun = new THREE.Mesh(sunGeometry, new THREE.MeshBasicMaterial({ map: sunTexture }));
    scene.add(sun);

    // Пример: Земля
    const earthOrbitRadius = 20;
    const earthGeometry = new THREE.SphereGeometry(1.5, 32, 32);
    const earthTexture = new THREE.TextureLoader().load('/static/textures/earth.jpg');
    const earth = new THREE.Mesh(earthGeometry, new THREE.MeshPhongMaterial({ map: earthTexture }));
    earth.position.x = earthOrbitRadius;
    scene.add(earth);

    // Добавьте остальные планеты по аналогии...
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
        showPlanetInfo(planet.name); // Реализуйте эту функцию
    }
}

function animate() {
    requestAnimationFrame(animate);
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