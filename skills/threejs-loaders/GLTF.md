# GLTF.md — GLTFLoader Deep Reference

## Contents

- Loader setup with all decoders
- GLTF scene graph traversal
- Animations
- KTX2 compressed textures
- Morph targets
- Instancing from GLTF
- Common errors

---

## Full Loader Setup

```js
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { KTX2Loader } from "three/addons/loaders/KTX2Loader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("/draco/"); // copy from node_modules/three/examples/jsm/libs/draco/

const ktx2Loader = new KTX2Loader();
ktx2Loader.setTranscoderPath("/basis/"); // copy from node_modules/three/examples/jsm/libs/basis/
ktx2Loader.detectSupport(renderer);

const loader = new GLTFLoader();
loader.setDRACOLoader(dracoLoader);
loader.setKTX2Loader(ktx2Loader);
loader.setMeshoptDecoder(MeshoptDecoder);
```

---

## Scene Graph Traversal

```js
const gltf = await loader.loadAsync("/model.glb");
const model = gltf.scene;

// Traverse all nodes
model.traverse((child) => {
  if (child.isMesh) {
    child.castShadow = true;
    child.receiveShadow = true;

    // Improve material quality
    if (child.material.map) {
      child.material.map.anisotropy = renderer.capabilities.getMaxAnisotropy();
    }
  }
  if (child.isLight) {
    // Handle embedded lights
    child.intensity *= 0.1; // GLTF lights are often too bright
  }
});

// Get named object
const wheel = model.getObjectByName("WheelFront");

// Get all meshes
const meshes = [];
model.traverse((child) => {
  if (child.isMesh) meshes.push(child);
});
```

---

## Animations

```js
const { scene: model, animations } = await loader.loadAsync("/character.glb");
console.log(animations.map((a) => a.name)); // list all clip names

const mixer = new THREE.AnimationMixer(model);

// Play by name
const idleClip = THREE.AnimationClip.findByName(animations, "idle");
const idleAction = mixer.clipAction(idleClip);
idleAction.play();

// Cross-fade between clips
const walkClip = THREE.AnimationClip.findByName(animations, "walk");
const walkAction = mixer.clipAction(walkClip);
idleAction.fadeOut(0.5);
walkAction.reset().fadeIn(0.5).play();

// Update in loop
mixer.update(clock.getDelta());
```

---

## KTX2 / Compressed Textures

KTX2 textures reduce GPU memory and bandwidth significantly.

```bash
# Install glTF-Transform to compress textures
npm install -g @gltf-transform/cli

# Compress geometry with Draco + textures with KTX2/ETC1S
gltf-transform optimize input.glb output.glb --compress draco --texture-compress etc1s

# Or for higher quality (UASTC):
gltf-transform optimize input.glb output.glb --compress draco --texture-compress uastc
```

Use ETC1S for diffuse/color maps (smaller, lower quality).
Use UASTC for normal/roughness maps (larger, higher quality, needed for correct normals).

---

## Morph Targets from GLTF

```js
const { scene: model } = await loader.loadAsync("/face.glb");

model.traverse((child) => {
  if (child.isMesh && child.morphTargetInfluences) {
    console.log("Morph targets:", child.morphTargetDictionary);
    // e.g. { smile: 0, blink: 1, angry: 2 }

    // Set by index
    child.morphTargetInfluences[0] = 0.5;

    // Set by name (safer)
    const smileIdx = child.morphTargetDictionary["smile"];
    if (smileIdx !== undefined) {
      child.morphTargetInfluences[smileIdx] = 1.0;
    }
  }
});
```

---

## Instancing from GLTF

```js
// Load model once, instance it many times
const gltf = await loader.loadAsync("/tree.glb");
const templateMesh = gltf.scene.children[0]; // get the mesh

const count = 500;
const instancedMesh = new THREE.InstancedMesh(
  templateMesh.geometry,
  templateMesh.material,
  count,
);

const dummy = new THREE.Object3D();
for (let i = 0; i < count; i++) {
  dummy.position.set(
    (Math.random() - 0.5) * 100,
    0,
    (Math.random() - 0.5) * 100,
  );
  dummy.rotation.y = Math.random() * Math.PI * 2;
  dummy.scale.setScalar(0.8 + Math.random() * 0.4);
  dummy.updateMatrix();
  instancedMesh.setMatrixAt(i, dummy.matrix);
}
instancedMesh.instanceMatrix.needsUpdate = true;
scene.add(instancedMesh);
```

---

## Common Errors

| Error                                    | Cause                                    | Fix                                                             |
| ---------------------------------------- | ---------------------------------------- | --------------------------------------------------------------- |
| `No DRACOLoader instance provided`       | GLTF uses Draco, no decoder              | `loader.setDRACOLoader(dracoLoader)`                            |
| `KTX2Loader: Transcoder not initialized` | KTX2 textures, no transcoder path        | `ktx2Loader.setTranscoderPath(...)` + `detectSupport(renderer)` |
| Model appears black                      | No lights, or materials need env map     | Add lights or `scene.environment = envMap`                      |
| Model too large/small                    | GLTF units are meters — 1 unit = 1 meter | Scale model: `model.scale.setScalar(0.01)`                      |
| Animations don't play                    | `mixer.update(delta)` not called         | Add to render loop                                              |
| Textures blurry                          | Anisotropy not set                       | `texture.anisotropy = renderer.capabilities.getMaxAnisotropy()` |
