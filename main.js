import * as THREE from "three";

// --- Scene & Camera ---
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x050505, 0.02);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.z = 30;

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.getElementById("webgl-container").appendChild(renderer.domElement);

// --- Particle System ---
const particleCount = 6000;
const geometry = new THREE.BufferGeometry();
const positions = new Float32Array(particleCount * 3);
const currentPositions = new Float32Array(particleCount * 3);

// Shapes
const shapes = {
  GALAXY: new Float32Array(particleCount * 3),
  SATURN: new Float32Array(particleCount * 3),
  PLANET: new Float32Array(particleCount * 3),
  FIREWORK: new Float32Array(particleCount * 3),
};
const shapeNames = Object.keys(shapes);
let currentShapeIndex = 0;

// Generate particles for shapes
for (let i = 0; i < particleCount; i++) {
  const i3 = i * 3;

  // Galaxy
  const radiusG = Math.random() * 20;
  const spinAngle = radiusG * 0.5;
  const branchAngle = ((i % 3) / 3) * Math.PI * 2;
  shapes.GALAXY[i3] = Math.cos(branchAngle + spinAngle) * radiusG;
  shapes.GALAXY[i3 + 1] = (Math.random() - 0.5) * 2 * (1 - radiusG / 20);
  shapes.GALAXY[i3 + 2] = Math.sin(branchAngle + spinAngle) * radiusG;

  // Saturn (sphere + rings)
  if (i < particleCount * 0.4) {
    const r = 6;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos((Math.random() * 2) - 1);
    shapes.SATURN[i3] = r * Math.sin(phi) * Math.cos(theta);
    shapes.SATURN[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    shapes.SATURN[i3 + 2] = r * Math.cos(phi);
  } else {
    const r = 9 + Math.random() * 8;
    const theta = Math.random() * Math.PI * 2;
    shapes.SATURN[i3] = r * Math.cos(theta);
    shapes.SATURN[i3 + 1] = (Math.random() - 0.5) * 0.5;
    shapes.SATURN[i3 + 2] = r * Math.sin(theta);
  }

  // Planet
  const rP = 12 * Math.cbrt(Math.random());
  const thetaP = Math.random() * Math.PI * 2;
  const phiP = Math.acos((Math.random() * 2) - 1);
  shapes.PLANET[i3] = rP * Math.sin(phiP) * Math.cos(thetaP);
  shapes.PLANET[i3 + 1] = rP * Math.sin(phiP) * Math.sin(thetaP);
  shapes.PLANET[i3 + 2] = rP * Math.cos(phiP);

  // Firework
  const rF = 25 + Math.random() * 15;
  const thetaF = Math.random() * Math.PI * 2;
  const phiF = Math.acos((Math.random() * 2) - 1);
  shapes.FIREWORK[i3] = rF * Math.sin(phiF) * Math.cos(thetaF);
  shapes.FIREWORK[i3 + 1] = rF * Math.sin(phiF) * Math.sin(thetaF);
  shapes.FIREWORK[i3 + 2] = rF * Math.cos(phiF);

  // Initial positions
  currentPositions[i3] = shapes.GALAXY[i3];
  currentPositions[i3 + 1] = shapes.GALAXY[i3 + 1];
  currentPositions[i3 + 2] = shapes.GALAXY[i3 + 2];
}

geometry.setAttribute("position", new THREE.BufferAttribute(currentPositions, 3));

const material = new THREE.PointsMaterial({
  size: 0.15,
  color: 0x00ffff,
  transparent: true,
  opacity: 0.8,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
});

const particleSystem = new THREE.Points(geometry, material);
scene.add(particleSystem);

// --- MediaPipe Hand Tracking ---
const videoElement = document.getElementById("webcam");
let targetRotationX = 0;
let targetRotationY = 0;
let targetScale = 1;
let targetHue = 0.5;
let isPinched = false;

const hands = new Hands({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
});

hands.setOptions({
  maxNumHands: 1,
  modelComplexity: 1,
  minDetectionConfidence: 0.7,
  minTrackingConfidence: 0.7,
});

hands.onResults((results) => {
  if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
    const hand = results.multiHandLandmarks[0];
    const thumbTip = hand[4];
    const indexTip = hand[8];
    const wrist = hand[0];

    const dx = thumbTip.x - indexTip.x;
    const dy = thumbTip.y - indexTip.y;
    const dz = thumbTip.z - indexTip.z;
    const pinchDistance = Math.sqrt(dx * dx + dy * dy + dz * dz);

    if (pinchDistance < 0.05 && !isPinched) {
      isPinched = true;
      currentShapeIndex = (currentShapeIndex + 1) % shapeNames.length;
      document.getElementById("shape-name").innerText =
        shapeNames[currentShapeIndex];
    } else if (pinchDistance >= 0.07) {
      isPinched = false;
    }

    targetRotationY = (wrist.x - 0.5) * Math.PI * 2;
    targetRotationX = (wrist.y - 0.5) * Math.PI * 2;
    targetScale = 1 + (1 - wrist.y) * 2;
    targetHue = wrist.x;
  } else {
    targetScale = 1;
    targetRotationY += 0.01;
  }
});

const cameraUtils = new Camera(videoElement, {
  onFrame: async () => await hands.send({ image: videoElement }),
  width: 640,
  height: 480,
});
cameraUtils.start();

// --- Animation Loop ---
const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();

  // Smooth color
  const currentHSL = material.color.getHSL({});
  material.color.setHSL(THREE.MathUtils.lerp(currentHSL.h, targetHue, 0.05), 1, 0.6);

  // Smooth rotation & scale
  particleSystem.rotation.x = THREE.MathUtils.lerp(
    particleSystem.rotation.x,
    targetRotationX,
    0.05
  );
  particleSystem.rotation.y = THREE.MathUtils.lerp(
    particleSystem.rotation.y,
    targetRotationY,
    0.05
  );
  particleSystem.scale.setScalar(
    THREE.MathUtils.lerp(particleSystem.scale.x, targetScale, 0.1)
  );

  // Morph shapes
  const positionsAttr = geometry.attributes.position;
  const targetArray = shapes[shapeNames[currentShapeIndex]];
  for (let i = 0; i < particleCount * 3; i++) {
    currentPositions[i] += (targetArray[i] - currentPositions[i]) * 0.04;
  }
  positionsAttr.needsUpdate = true;

  // Slight rotation
  particleSystem.rotation.z += 0.002;

  renderer.render(scene, camera);
}
animate();

// Handle resize
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
