---
name: threejs-animation
description: Animates Three.js objects using AnimationMixer, AnimationClip, keyframe tracks, morph targets, skeletal animation, and GSAP integration. Use when the user asks about animations, AnimationMixer, play/pause animations, keyframes, GLTF animations, morph targets, bones, or GSAP with Three.js. Trigger keywords: animation, AnimationMixer, AnimationClip, keyframe, morph target, skeleton, bones, GSAP, tween, play animation.
---

# Three.js Animation

## AnimationMixer (GLTF animations)

```js
const { scene: model, animations } = await loader.loadAsync("/model.glb");
scene.add(model);

const mixer = new THREE.AnimationMixer(model);
const clock = new THREE.Clock();

// Play a clip
const clip = THREE.AnimationClip.findByName(animations, "walk");
const action = mixer.clipAction(clip);
action.play();

// Control playback
action.paused = false;
action.loop = THREE.LoopRepeat; // or LoopOnce, LoopPingPong
action.clampWhenFinished = true; // freeze on last frame (for LoopOnce)
action.timeScale = 1.5; // 1.5x speed
action.weight = 1.0; // blend weight 0–1

// Transition between clips
const runAction = mixer.clipAction(
  THREE.AnimationClip.findByName(animations, "run"),
);
action.fadeOut(0.3);
runAction.reset().fadeIn(0.3).play();

// Listen for finished (LoopOnce)
mixer.addEventListener("finished", (e) => {
  console.log("Animation finished:", e.action.getClip().name);
});

// Update in loop — required
function animate() {
  requestAnimationFrame(animate);
  mixer.update(clock.getDelta());
  renderer.render(scene, camera);
}
```

## Keyframe Animation (programmatic)

```js
// Position keyframes
const posKF = new THREE.VectorKeyframeTrack(
  ".position", // property path
  [0, 1, 2], // times (seconds)
  [0, 0, 0, 0, 2, 0, 0, 0, 0], // values (3 per time = xyz)
);

// Rotation keyframes (quaternion)
const rotKF = new THREE.QuaternionKeyframeTrack(
  ".quaternion",
  [0, 1, 2],
  [0, 0, 0, 1, 0, 0.707, 0, 0.707, 0, 0, 0, 1], // xyzw
);

// Scale keyframes
const scaleKF = new THREE.VectorKeyframeTrack(
  ".scale",
  [0, 0.5, 1],
  [1, 1, 1, 2, 2, 2, 1, 1, 1],
);

// Color keyframe (on material)
const colorKF = new THREE.ColorKeyframeTrack(
  ".material.color",
  [0, 1, 2],
  [1, 0, 0, 0, 1, 0, 0, 0, 1], // rgb values
);

// Bundle into a clip
const clip = new THREE.AnimationClip("my-animation", 2, [
  posKF,
  rotKF,
  scaleKF,
]);

// Play it
const mixer = new THREE.AnimationMixer(mesh);
const action = mixer.clipAction(clip);
action.play();
```

## Morph Targets

```js
// Geometry with morph targets (e.g., from GLTF)
// Access via mesh.morphTargetInfluences
const { scene: model } = await loader.loadAsync("/face.glb");
scene.add(model);

// Find mesh with morph targets
model.traverse((child) => {
  if (child.isMesh && child.morphTargetInfluences) {
    // Animate morph targets directly
    child.morphTargetInfluences[0] = 0.5; // 0–1

    // Or via AnimationMixer with MorphTarget keyframe track
    const morphKF = new THREE.NumberKeyframeTrack(
      ".morphTargetInfluences[0]",
      [0, 1, 2],
      [0, 1, 0],
    );
    const clip = new THREE.AnimationClip("blink", 2, [morphKF]);
    const mixer = new THREE.AnimationMixer(child);
    mixer.clipAction(clip).play();
  }
});
```

## Skeletal Animation

```js
// GLTF with skeleton — skinned mesh animates via AnimationMixer automatically
const { scene: model, animations } = await loader.loadAsync("/character.glb");

// Debug skeleton
const helper = new THREE.SkeletonHelper(model);
scene.add(helper);

// Manually access bones
model.traverse((child) => {
  if (child.isSkinnedMesh) {
    const skeleton = child.skeleton;
    const spineBone = skeleton.getBoneByName("spine");
    spineBone.rotation.z = Math.sin(elapsedTime) * 0.3;
  }
});
```

## GSAP Integration

```js
import gsap from "gsap";

// Tween position
gsap.to(mesh.position, {
  x: 3,
  y: 1,
  z: 0,
  duration: 2,
  ease: "power2.inOut",
  onUpdate: () => {
    /* runs each frame */
  },
});

// Tween rotation
gsap.to(mesh.rotation, {
  y: Math.PI * 2,
  duration: 3,
  ease: "none",
  repeat: -1,
});

// Tween material color
gsap.to(mat.color, { r: 1, g: 0, b: 0, duration: 1 });

// Tween uniform
gsap.to(mat.uniforms.uProgress, {
  value: 1,
  duration: 2,
  ease: "power1.inOut",
});

// Timeline
const tl = gsap.timeline();
tl.to(mesh.position, { y: 2, duration: 1 })
  .to(mesh.rotation, { y: Math.PI, duration: 0.5 }, "-=0.3")
  .to(mesh.scale, { x: 0.5, y: 0.5, z: 0.5, duration: 0.5 });
```

## Common Gotchas

- `mixer.update(delta)` is **required** every frame — animation doesn't advance otherwise
- `THREE.AnimationClip.findByName(animations, 'name')` — name must exactly match the GLTF clip name
- `LoopOnce` + `clampWhenFinished = true` to freeze on last frame
- `action.reset()` before `play()` if replaying from start
- GSAP and AnimationMixer can conflict on the same property — pick one per property
- `morphTargetDictionary` maps morph target names to indices — use `child.morphTargetDictionary['smile']` to find index
- SkeletonHelper must be added to the scene root, not as a child of the model
