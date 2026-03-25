---
name: threejs-loaders
description: Loads 3D assets in Three.js — GLTFLoader, DRACOLoader, KTX2Loader, TextureLoader, FontLoader, AudioLoader, LoadingManager, and async/await loading patterns. Use when the user asks about loading 3D models, GLTF, GLB, OBJ, textures, fonts, audio, or asset management. Trigger keywords: GLTFLoader, load model, GLTF, GLB, DRACOLoader, TextureLoader, LoadingManager, async load, asset.
---

# Three.js Loaders

## GLTFLoader (primary 3D format)

```js
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("/draco/"); // copy from node_modules/three/examples/jsm/libs/draco/

const loader = new GLTFLoader();
loader.setDRACOLoader(dracoLoader);

// Async/await (recommended)
async function loadModel() {
  const gltf = await loader.loadAsync("/models/scene.glb");
  const model = gltf.scene;
  model.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
  scene.add(model);
  return gltf;
}

// With animations
const { scene: model, animations } = await loader.loadAsync(
  "/models/character.glb",
);
const mixer = new THREE.AnimationMixer(model);
const action = mixer.clipAction(animations[0]);
action.play();
scene.add(model);

// In animate loop:
mixer.update(delta);
```

See [GLTF.md](GLTF.md) for compressed textures, KTX2, and optimization.

## TextureLoader

```js
const loader = new THREE.TextureLoader();

// Async
const texture = await loader.loadAsync("/textures/diffuse.jpg");
texture.colorSpace = THREE.SRGBColorSpace; // for color/albedo maps

// Multiple textures in parallel
const [diffuse, normal, roughness] = await Promise.all([
  loader.loadAsync("/t/diffuse.jpg"),
  loader.loadAsync("/t/normal.jpg"),
  loader.loadAsync("/t/roughness.jpg"),
]);
diffuse.colorSpace = THREE.SRGBColorSpace;

const mat = new THREE.MeshStandardMaterial({
  map: diffuse,
  normalMap: normal,
  roughnessMap: roughness,
});
```

## CubeTextureLoader (cube map)

```js
const cubeLoader = new THREE.CubeTextureLoader();
cubeLoader.setPath("/textures/cubemap/");
const cubeTexture = await cubeLoader.loadAsync([
  "px.jpg",
  "nx.jpg", // right, left
  "py.jpg",
  "ny.jpg", // top, bottom
  "pz.jpg",
  "nz.jpg", // front, back
]);
scene.background = cubeTexture;
scene.environment = cubeTexture; // use as env map
```

## LoadingManager (progress + errors)

```js
const manager = new THREE.LoadingManager(
  // onLoad
  () => {
    console.log("All assets loaded");
    hideLoadingScreen();
  },
  // onProgress
  (url, loaded, total) => {
    const progress = (loaded / total) * 100;
    updateProgressBar(progress);
  },
  // onError
  (url) => {
    console.error("Failed to load:", url);
  },
);

const gltfLoader = new GLTFLoader(manager);
const texLoader = new THREE.TextureLoader(manager);
// All loaders using same manager track together
```

## FontLoader (3D text)

```js
import { FontLoader } from "three/addons/loaders/FontLoader.js";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";

const fontLoader = new FontLoader();
const font = await fontLoader.loadAsync(
  "/fonts/helvetiker_regular.typeface.json",
);

const textGeo = new TextGeometry("Hello World", {
  font,
  size: 0.5,
  depth: 0.1, // was 'height' in older Three.js
  curveSegments: 12,
  bevelEnabled: true,
  bevelThickness: 0.02,
  bevelSize: 0.01,
  bevelSegments: 5,
});
textGeo.center(); // center geometry around origin
const textMesh = new THREE.Mesh(textGeo, mat);
scene.add(textMesh);
```

## RGBELoader (HDR / HDRI)

```js
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";

const pmrem = new THREE.PMREMGenerator(renderer);
const hdr = await new RGBELoader().loadAsync("/env/studio.hdr");
const envMap = pmrem.fromEquirectangular(hdr).texture;
scene.environment = envMap;
scene.background = envMap;
hdr.dispose();
pmrem.dispose();
```

## EXRLoader

```js
import { EXRLoader } from "three/addons/loaders/EXRLoader.js";
const exr = await new EXRLoader().loadAsync("/env/scene.exr");
const envMap = pmrem.fromEquirectangular(exr).texture;
```

## AudioLoader

```js
const audioListener = new THREE.AudioListener();
camera.add(audioListener);

const sound = new THREE.Audio(audioListener);
const audioLoader = new THREE.AudioLoader();
const buffer = await audioLoader.loadAsync("/audio/ambient.mp3");
sound.setBuffer(buffer);
sound.setLoop(true);
sound.setVolume(0.5);
sound.play();

// Positional audio
const posSound = new THREE.PositionalAudio(audioListener);
posSound.setBuffer(buffer);
posSound.setRefDistance(2);
posSound.setRolloffFactor(1);
mesh.add(posSound); // attach to mesh
```

## Common Gotchas

- `DRACOLoader` decoder path must point to actual decoder files — copy from `node_modules/three/examples/jsm/libs/draco/`
- `loadAsync` returns a Promise — always `await` or `.then()` — don't access `gltf.scene` before load completes
- `gltf.scene` is a `THREE.Group` — add it with `scene.add(gltf.scene)`
- `gltf.animations` is an array of `AnimationClip` — index 0 is first animation
- Font files must be in Three.js JSON format — convert with facetype.js or use built-in fonts from `node_modules/three/examples/fonts/`
- `loader.load()` (callback) vs `loader.loadAsync()` (Promise) — prefer async for cleaner code
- Always `dispose()` loaders and textures after use to free GPU memory
