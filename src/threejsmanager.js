import * as THREE from 'three';
import { OrbitControls } from 'orbitControls';
import { GLTFLoader } from 'gltfLoaders';


const renderer = new THREE.WebGLRenderer();

var aspectRatio;
if (window.innerWidth >= window.innerHeight)
    aspectRatio = window.innerWidth / window.innerHeight;
else
    aspectRatio = window.innerHeight / window.innerWidth;
console.log("aspect: " + aspectRatio);

renderer.setSize(window.innerWidth, window.innerHeight);
var demoDom = document.getElementById("demos");
document.body.insertBefore(renderer.domElement, demoDom);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
    35,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

//console.log("getFilmWidth(): " + camera.getFilmWidth());
//console.log("getFilmHeight(): " + camera.getFilmHeight());
const streamPlaneGeometry = new THREE.PlaneGeometry(1, 1);
var streamMat = new THREE.MeshBasicMaterial();
var streamPlane = new THREE.Mesh(streamPlaneGeometry, streamMat);

//Load T-Shirt Model
const loader = new GLTFLoader();
var tshirtModel;
loader.load("./model/tshirt_new2.glb", function (gltf) {
    tshirtModel = gltf.scene;
    tshirtModel.material = new THREE.MeshBasicMaterial();
    scene.add(gltf.scene);
    gltf.animations;
    gltf.scene;
    gltf.scenes;
    gltf.cameras;
    gltf.asset;
}, function (xhr) {
    console.log((xhr.loaded / xhr.total * 100) + '% loaded');
}, function (error) {
    console.log('An error happened: ' + error);
});

//Add Light
const light = new THREE.DirectionalLight(0xFFFFFF, 1);
scene.add(light);

// Testing Axes
const axesHelper = new THREE.AxesHelper(5);
scene.add(axesHelper);


const orbit = new OrbitControls(camera, renderer.domElement);
//need to update orbit after changing camera setting
camera.position.set(0, 0, 5);
orbit.update();

let landmarks;

function animate() {
    requestAnimationFrame(animate);
    if (landmarks != null) {
        //updateCubes();
        updateModel();
    }
    renderer.render(scene, camera);
}

var cubeList = new Array();
setupCubList();

const cubeGroup = new THREE.Group();
scene.add(cubeGroup);

renderer.physicallyCorrectLights = true
renderer.outputEncoding = THREE.sRGBEncoding
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 0.6
//renderer.setAnimationLoop(animate);
animate();

var scaleX, scaleY;


function createCube(x, y, z) {
    const geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const cube = new THREE.Mesh(geometry, material);
    cube.position.set(x, y, z);
    return cube;
}

function updateCubes() {
    cubeGroup.clear();
    landmarks.forEach(landmark => {
        const x = (landmark.x - 0.5) * scaleX;
        const y = (landmark.y - 0.5) * scaleY;
        const z = -landmark.z; // Adjust Z position
        const cube = createCube(-x, -y, z); // Invert y to match Three.js coordinates

        cubeGroup.add(cube);
    });
}

var rotY = 0;
function updateModel() {
    for (var i = 0; i < landmarks.length; i++) {
        //cubeList[i].position.set((-landmarks[i].x + 0.5) * aspectRatio / 2 * scaleX, (-landmarks[i].y + 0.5) * aspectRatio / 2 * scaleY, -landmarks[i].z)
        cubeList[i].position.set((-landmarks[i].x + 0.5) * scaleX, (-landmarks[i].y + 0.5) * scaleY, -landmarks[i].z)
    }

    var centerX = (cubeList[11].position.x + cubeList[12].position.x) / 2;
    var centerY = (cubeList[11].position.y + cubeList[12].position.y) / 2;
    var centerZ = (cubeList[11].position.z + cubeList[12].position.z) / 2;
    tshirtModel.position.set(centerX, centerY, centerZ);

    var shoulderDistance = calculateDistance(cubeList[11].position, cubeList[12].position);

    const tshirtScaleX = shoulderDistance * 2.5;
    const tshirtScaleY = shoulderDistance * 2.5;
    const tshirtScaleZ = shoulderDistance * 2.5;
    tshirtModel.scale.set(tshirtScaleX, tshirtScaleY, tshirtScaleZ);

    //const rotations = getAngleBetweenVertices(landmarks[11], landmarks[12]);
    //console.log("x: " + rotations.x, "  y: " + rotations.y, +"  z: " + rotations.z);
    const rotations = calculateAngle(landmarks[11], landmarks[12]);
    const rotationX = getAngleY(cubeList[11].position, cubeList[23].position);
    const rotationY = getAngleY(cubeList[11].position, cubeList[12].position);
    const rotationZ = getAngleZ(cubeList[23].position, cubeList[24].position);
    rotY += 0.01;
    tshirtModel.rotation.set(0, (rotationY * (2 * Math.PI)), 0);

    console.log("rotation Y: " + (rotationY * (2 * Math.PI)));
    console.log("---------------------------------------------------------")

}

var texture;
export function startStreaming(video) {
    texture = new THREE.VideoTexture(video);
    texture.needsUpdate = true;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.format = THREE.RGBAFormat;
    texture.crossOrigin = 'anonymous';
    streamMat = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
    streamPlane = new THREE.Mesh(streamPlaneGeometry, streamMat);
    scene.add(streamPlane);

    const cameraZ = camera.position.z;
    const distance = cameraZ - streamPlane.position.z;
    const vFov = camera.fov * Math.PI / 180;
    scaleY = 2 * Math.tan(vFov / 2) * distance;
    scaleX = scaleY * camera.aspect;

    streamPlane.scale.set(-scaleX, scaleY, 1);
    //streamPlane.position.set(0, 0, 0.1);
    console.log("Start Streaming On ThreeJS");
    console.log("Stream ScaleX: " + scaleX + "   Stream ScaleY: " + scaleY);
}

function setupCubList() {
    for (var c = 0; c < 33; c++) {
        let geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1)
        let material = new THREE.MeshNormalMaterial()
        let cube = new THREE.Mesh(geometry, material)
        cube.renderOrder = 1;
        scene.add(cube)

        cubeList.push(cube);
    }
}

function calculateDistance(point1, point2) {
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    const dz = point2.z - point1.z;

    return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function getAngleX(point1, point2) {
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    const dz = point2.z - point1.z;

    return Math.atan2(dz, dx);
}

function getAngleY(point1, point2) {
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    const dz = point2.z - point1.z;

    return Math.atan2(dy, dx);
}

function getAngleZ(point1, point2) {
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    const dz = point2.z - point1.z;

    return Math.atan2(dy, dx)
}

function calculateAngle(point1, point2) {
    const angle = Math.atan2(point1.y - point2.y, point1.x - point2.x);
    return angle;
}

export function getLandmarks(landmarksList) {
    landmarks = landmarksList;
}