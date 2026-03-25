/**
 * examples/vanilla/custom-shader.js
 * ShaderMaterial demo — wave displacement vertex shader, noise fragment shader
 */

import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050505);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  100,
);
camera.position.set(0, 2, 4);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// ─── Shader Material ─────────────────────────────────────────────────────────
const waveMaterial = new THREE.ShaderMaterial({
  uniforms: {
    uTime: { value: 0 },
    uColorA: { value: new THREE.Color(0x0066ff) },
    uColorB: { value: new THREE.Color(0x00ffcc) },
    uWaveHeight: { value: 0.3 },
    uWaveFreq: { value: 3.0 },
  },
  vertexShader: /* glsl */ `
    uniform float uTime;
    uniform float uWaveHeight;
    uniform float uWaveFreq;

    varying vec2 vUv;
    varying float vElevation;

    void main() {
      vUv = uv;

      vec3 pos = position;
      float wave1 = sin(pos.x * uWaveFreq + uTime) * uWaveHeight;
      float wave2 = sin(pos.z * uWaveFreq * 0.8 + uTime * 1.2) * uWaveHeight * 0.5;
      pos.y += wave1 + wave2;
      vElevation = (wave1 + wave2) / (uWaveHeight * 1.5); // -1 to 1

      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform vec3 uColorA;
    uniform vec3 uColorB;

    varying vec2 vUv;
    varying float vElevation;

    void main() {
      float t = vElevation * 0.5 + 0.5; // 0 to 1
      vec3 color = mix(uColorA, uColorB, t);
      gl_FragColor = vec4(color, 1.0);
    }
  `,
  side: THREE.DoubleSide,
});

const plane = new THREE.Mesh(
  new THREE.PlaneGeometry(4, 4, 128, 128),
  waveMaterial,
);
plane.rotation.x = -Math.PI * 0.15;
scene.add(plane);

// ─── Resize + Loop ───────────────────────────────────────────────────────────
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  waveMaterial.uniforms.uTime.value = clock.getElapsedTime();
  controls.update();
  renderer.render(scene, camera);
}
animate();
