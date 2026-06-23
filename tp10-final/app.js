// app.js

// 1. Obtenemos la referencia al elemento de video del HTML
const video = document.getElementById('video');

// 2. Función para solicitar acceso e iniciar la cámara
async function setupCamera() {
    try {
        // Pedimos permiso para usar la cámara (solo video, sin audio)
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { 
                width: { ideal: 1280 },
                height: { ideal: 720 },
                facingMode: "user" // Fuerza el uso de la cámara frontal en móviles
            },
            audio: false
        });
        
        // Conectamos el stream de la cámara a nuestra etiqueta de video
        video.srcObject = stream;
        
        // Devolvemos una promesa que avisa cuando el video ya tiene datos y dimensiones
        return new Promise((resolve) => {
            video.onloadedmetadata = () => {
                resolve(video);
            };
        });
    } catch (error) {
        console.error("Error al acceder a la cámara:", error);
        alert("Necesitas dar permiso a la cámara para que esto funcione.");
    }
}

// 3. Función principal que orquesta el arranque
async function main() {
    console.log("Iniciando cámara...");
    
    // Esperamos a que la cámara se configure
    await setupCamera();
    
    // Forzamos la reproducción del video
    video.play();

    await loadFaceModel();

    setupThreeJS();
    renderer.render(scene, camera);

    trackAndRender();   
    
    console.log("¡Cámara lista y reproduciendo!");
}

// Ejecutamos el programa
// Variable global para almacenar nuestro detector
let detector;

// 4. Función para cargar el modelo de FaceMesh
async function loadFaceModel() {
    console.log("Cargando el modelo FaceMesh... (esto puede tardar unos segundos)");
    
    const model = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;
    const detectorConfig = {
        runtime: 'tfjs', // Utiliza el motor WebGL que importamos
        refineLandmarks: true // Mejora la precisión en ojos e iris (clave para la rotación)
    };
    
    // Inicializamos el detector
    detector = await faceLandmarksDetection.createDetector(model, detectorConfig);
    console.log("¡Modelo FaceMesh cargado exitosamente!");
}

let scene, camera, renderer, faceMeshObject;

// 5. Función para configurar el entorno 3D
function setupThreeJS() {
    scene = new THREE.Scene();

    // Seteamos proporciones basadas en la CÁMARA, no en la pantalla
    const width = video.videoWidth;
    const height = video.videoHeight;

    camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 10; 

    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    // El lienzo 3D ahora tiene la resolución exacta de la webcam
    renderer.setSize(width, height);
    
    renderer.domElement.id = 'canvas3d'; 
    document.body.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(0, 1, 1);
    scene.add(directionalLight);

    const geometry = new THREE.BoxGeometry(2, 2, 2);
    const material = new THREE.MeshStandardMaterial({ color: 0x00ff00, wireframe: true });
    faceMeshObject = new THREE.Mesh(geometry, material);
    scene.add(faceMeshObject);

    console.log(`¡Entorno 3D configurado a ${width}x${height}!`);
}

// 6. El Bucle de Renderizado y Tracking en tiempo real
async function trackAndRender() {
    try {
        const faces = await detector.estimateFaces(video);

        if (faces.length > 0) {
            const keypoints = faces[0].keypoints;
            const nose = keypoints[1];

            // --- A. POSICIÓN (Matemática simplificada) ---
            // 1. Normalizamos las coordenadas de -1 a 1 (Invertimos la X por el espejo)
            const ndcX = -((nose.x / video.videoWidth) * 2 - 1);
            const ndcY = -((nose.y / video.videoHeight) * 2 + 1);

            // 2. Calculamos los límites físicos de nuestra cámara 3D
            const distance = camera.position.z;
            const vFov = (camera.fov * Math.PI) / 180;
            const planeHeight = 2 * Math.tan(vFov / 2) * distance;
            const planeWidth = planeHeight * camera.aspect;

            // 3. Multiplicamos la posición normalizada por los límites
            faceMeshObject.position.x = ndcX * (planeWidth / 2);
            faceMeshObject.position.y = ndcY * (planeHeight / 2);

            // --- B. ROTACIÓN ---
            const leftEye = keypoints[33];
            const rightEye = keypoints[263];
            const forehead = keypoints[10];
            const chin = keypoints[152];

            const roll = Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x);
            const yaw = Math.atan2(rightEye.z - leftEye.z, rightEye.x - leftEye.x);
            const pitch = Math.atan2(chin.z - forehead.z, chin.y - forehead.y);

            faceMeshObject.rotation.z = roll; 
            faceMeshObject.rotation.y = yaw;  
            faceMeshObject.rotation.x = pitch + Math.PI / 2; 
        }

        renderer.render(scene, camera);
        requestAnimationFrame(trackAndRender);

    } catch (error) {
        console.error("Error temporal en el tracking:", error);
        requestAnimationFrame(trackAndRender);
    }
}

main();