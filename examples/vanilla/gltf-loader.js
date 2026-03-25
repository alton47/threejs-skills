/**
 * examples/vanilla/gltf-loader.js
 * Async GLTFLoader with DRACOLoader, LoadingManager progress, and shadow setup
 */

import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";

// ─── Renderer ────────────────────────────────────────────────────────────────
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  100,
);
camera.position.set(0, 1.5, 4);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 1, 0);

// ─── Lights ───────────────────────────────────────────────────────────────────
const sun = new THREE.DirectionalLight(0xffffff, 2);
sun.position.set(5, 10, 5);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.bias = -0.001;
scene.add(sun);
scene.add(new THREE.AmbientLight(0xffffff, 0.5));

// ─── Loading Manager ──────────────────────────────────────────────────────────
const progressEl = document.getElementById("progress"); // optional UI element

const manager = new THREE.LoadingManager(
  () => {
    console.log("✓ All assets loaded");
    if (progressEl) progressEl.style.display = "none";
  },
  (url, loaded, total) => {
    const pct = Math.round((loaded / total) * 100);
    console.log(`Loading ${url}: ${pct}%`);
    if (progressEl) progressEl.textContent = `Loading... ${pct}%`;
  },
  (url) => console.error("Failed to load:", url),
);

// ─── Loaders ──────────────────────────────────────────────────────────────────
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("/draco/"); // copy from node_modules/three/examples/jsm/libs/draco/

const gltfLoader = new GLTFLoader(manager);
gltfLoader.setDRACOLoader(dracoLoader);

// ─── Load HDRI ────────────────────────────────────────────────────────────────
async function init() {
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();

  // Uncomment to use HDRI:
  // const hdr = await new RGBELoader(manager).loadAsync('/env/studio.hdr');
  // const envMap = pmrem.fromEquirectangular(hdr).texture;
  // scene.background = envMap;
  // scene.environment = envMap;
  // hdr.dispose();
  // pmrem.dispose();

  scene.background = new THREE.Color(0x111111);

  // ─── Load Model ─────────────────────────────────────────────────────────────
  const gltf = await gltfLoader.loadAsync("/models/your-model.glb");
  const model = gltf.scene;

  // Enable shadows on all meshes
  model.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
      // Optionally improve texture quality
      if (child.material.map) {
        child.material.map.anisotropy =
          renderer.capabilities.getMaxAnisotropy();
      }
    }
  });

  scene.add(model);

  // Ground
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 20),
    new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.9 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // ─── Animations ────────────────────────────────────────────────────────────
  let mixer;
  if (gltf.animations.length > 0) {
    mixer = new THREE.AnimationMixer(model);
    const action = mixer.clipAction(gltf.animations[0]);
    action.play();
  }

  // ─── Loop ──────────────────────────────────────────────────────────────────
  const clock = new THREE.Clock();
  function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    mixer?.update(delta);
    controls.update();
    renderer.render(scene, camera);
  }
  animate();
}

// ─── Resize ───────────────────────────────────────────────────────────────────
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

init().catch(console.error);
