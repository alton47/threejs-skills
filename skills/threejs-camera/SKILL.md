---
name: threejs-camera
description: Configures Three.js cameras and controls — PerspectiveCamera, OrthographicCamera, OrbitControls, FlyControls, PointerLockControls, and first-person setup. Use when the user asks about cameras, controls, orbit, fly, first-person, camera movement, or viewport setup. Trigger keywords: camera, OrbitControls, FlyControls, PointerLockControls, perspective, orthographic, first person, viewport, FOV.
---

# Three.js Camera & Controls

## PerspectiveCamera

```js
const camera = new THREE.PerspectiveCamera(
  75, // fov — vertical field of view in degrees
  window.innerWidth / window.innerHeight, // aspect ratio
  0.1, // near clipping plane
  1000, // far clipping plane
);
camera.position.set(0, 2, 5);
camera.lookAt(0, 0, 0);
scene.add(camera); // add to scene if it has audio listeners or children
```

**FOV guidelines:** 45–60° cinematic, 75° standard, 90–110° FPS/wide-angle

## OrthographicCamera

```js
const aspect = window.innerWidth / window.innerHeight;
const frustumSize = 10;
const camera = new THREE.OrthographicCamera(
  (-frustumSize * aspect) / 2, // left
  (frustumSize * aspect) / 2, // right
  frustumSize / 2, // top
  -frustumSize / 2, // bottom
  0.1, // near
  1000, // far
);
camera.position.set(0, 5, 5);
camera.lookAt(0, 0, 0);

// Resize — must recalculate frustum
window.addEventListener("resize", () => {
  const aspect = window.innerWidth / window.innerHeight;
  camera.left = (-frustumSize * aspect) / 2;
  camera.right = (frustumSize * aspect) / 2;
  camera.top = frustumSize / 2;
  camera.bottom = -frustumSize / 2;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
```

## OrbitControls

```js
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const controls = new OrbitControls(camera, renderer.domElement);

// Damping (smooth deceleration) — MUST call controls.update() in loop
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// Constraints
controls.minDistance = 2;
controls.maxDistance = 50;
controls.minPolarAngle = 0; // 0 = top
controls.maxPolarAngle = Math.PI / 2; // PI = bottom, PI/2 = equator
controls.minAzimuthAngle = -Math.PI / 4;
controls.maxAzimuthAngle = Math.PI / 4;

// Disable
controls.enableRotate = false;
controls.enableZoom = false;
controls.enablePan = false;

// Target
controls.target.set(0, 1, 0); // orbit around this point
controls.update();

// REQUIRED in render loop when enableDamping: true
function animate() {
  requestAnimationFrame(animate);
  controls.update(); // ← essential
  renderer.render(scene, camera);
}
```

## FlyControls

```js
import { FlyControls } from "three/addons/controls/FlyControls.js";

const flyControls = new FlyControls(camera, renderer.domElement);
flyControls.movementSpeed = 10;
flyControls.rollSpeed = Math.PI / 12;
flyControls.autoForward = false;
flyControls.dragToLook = true;

// REQUIRED in loop with delta
function animate() {
  const delta = clock.getDelta();
  flyControls.update(delta); // delta required
  renderer.render(scene, camera);
}
```

## PointerLockControls (FPS)

```js
import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";

const controls = new PointerLockControls(camera, document.body);
scene.add(controls.object); // controls wraps camera in a parent Object3D

// Lock pointer on click
document.addEventListener("click", () => controls.lock());

controls.addEventListener("lock", () => {
  /* hide crosshair UI */
});
controls.addEventListener("unlock", () => {
  /* show menu */
});

// WASD movement
const keys = {};
document.addEventListener("keydown", (e) => (keys[e.code] = true));
document.addEventListener("keyup", (e) => (keys[e.code] = false));

function animate() {
  const delta = clock.getDelta();
  if (controls.isLocked) {
    const speed = 5 * delta;
    if (keys["KeyW"]) controls.moveForward(speed);
    if (keys["KeyS"]) controls.moveForward(-speed);
    if (keys["KeyA"]) controls.moveRight(-speed);
    if (keys["KeyD"]) controls.moveRight(speed);
  }
  renderer.render(scene, camera);
}
```

## Camera Shake

```js
// Simple procedural camera shake
function shake(camera, intensity = 0.1, duration = 0.5) {
  const startTime = clock.getElapsedTime();
  const originalPos = camera.position.clone();

  function applyShake() {
    const elapsed = clock.getElapsedTime() - startTime;
    if (elapsed > duration) {
      camera.position.copy(originalPos);
      return;
    }
    const decay = 1 - elapsed / duration;
    camera.position.x =
      originalPos.x + (Math.random() - 0.5) * intensity * decay;
    camera.position.y =
      originalPos.y + (Math.random() - 0.5) * intensity * decay;
    requestAnimationFrame(applyShake);
  }
  applyShake();
}
```

## CameraHelper (debug)

```js
const helper = new THREE.CameraHelper(camera);
scene.add(helper);
// Update each frame if camera moves:
helper.update();
```

## Common Gotchas

- `controls.update()` must be called every frame when `enableDamping: true` — without it, damping doesn't work
- OrthographicCamera resize: recalculate left/right/top/bottom — not just aspect
- `PointerLockControls` wraps camera in a parent — add `controls.object` to scene, not the camera directly
- `camera.lookAt()` is overridden by controls — don't mix manual lookAt with OrbitControls
- FlyControls and PointerLockControls require `delta` in update — use `clock.getDelta()`
- Near/far range: keep ratio `far/near` below 10,000 to avoid z-fighting. Near=0.01, Far=100 is better than Near=0.001, Far=10000
