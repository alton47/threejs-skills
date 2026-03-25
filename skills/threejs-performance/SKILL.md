---
name: threejs-performance
description: Optimizes Three.js performance — instancing, draw call reduction, LOD, frustum culling, geometry merging, texture compression, Stats.js profiling, and GPU debugging. Use when the user asks about performance, FPS, draw calls, instancing, optimization, lag, stuttering, or profiling a Three.js scene. Trigger keywords: performance, fps, draw calls, instancing, InstancedMesh, LOD, profiling, optimization, Stats.
---

# Three.js Performance

## Profiling First

```js
import Stats from "three/addons/libs/stats.module.js";

const stats = new Stats();
stats.showPanel(0); // 0=fps, 1=ms, 2=mb
document.body.appendChild(stats.dom);

function animate() {
  stats.begin();
  // ... render
  stats.end();
}
```

Open **Chrome DevTools → Performance** or install [Spector.js](https://spector.babylonjs.com/) for GPU frame capture.

`renderer.info` exposes draw call counts:

```js
console.log(renderer.info.render); // { calls, triangles, points, lines }
console.log(renderer.info.memory); // { geometries, textures }
```

## Instancing (biggest win)

```js
// One draw call for N meshes — critical for particles, trees, buildings
const count = 10000;
const geo = new THREE.SphereGeometry(0.1, 8, 4); // low-poly
const mat = new THREE.MeshStandardMaterial({ color: 0xff8800 });
const mesh = new THREE.InstancedMesh(geo, mat, count);
mesh.castShadow = true;
scene.add(mesh);

const dummy = new THREE.Object3D();
for (let i = 0; i < count; i++) {
  dummy.position.set(
    (Math.random() - 0.5) * 20,
    Math.random() * 5,
    (Math.random() - 0.5) * 20,
  );
  dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
  dummy.scale.setScalar(0.5 + Math.random());
  dummy.updateMatrix();
  mesh.setMatrixAt(i, dummy.matrix);
}
mesh.instanceMatrix.needsUpdate = true;

// Per-instance color
mesh.setColorAt(i, new THREE.Color(Math.random(), 0.5, 0.5));
mesh.instanceColor.needsUpdate = true;

// Animate instances
function animate() {
  // Update specific instances
  mesh.getMatrixAt(i, dummy.matrix);
  dummy.matrix.decompose(dummy.position, dummy.quaternion, dummy.scale);
  dummy.rotation.y += delta;
  dummy.updateMatrix();
  mesh.setMatrixAt(i, dummy.matrix);
  mesh.instanceMatrix.needsUpdate = true;
}
```

## Geometry Merging (static scenes)

```js
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

const geos = objects.map((obj) => {
  const g = obj.geometry.clone();
  g.applyMatrix4(obj.matrixWorld); // bake transform into geometry
  return g;
});
const merged = mergeGeometries(geos, true); // true = use groups for multi-material
const mesh = new THREE.Mesh(merged, materials);
scene.add(mesh);
// Replaces N draw calls with 1
```

## LOD (Level of Detail)

```js
const lod = new THREE.LOD();

const highGeo = new THREE.SphereGeometry(1, 64, 32);
const midGeo = new THREE.SphereGeometry(1, 16, 8);
const lowGeo = new THREE.SphereGeometry(1, 6, 3);
const mat = new THREE.MeshStandardMaterial();

lod.addLevel(new THREE.Mesh(highGeo, mat), 0); // within 0 units
lod.addLevel(new THREE.Mesh(midGeo, mat), 15); // within 15 units
lod.addLevel(new THREE.Mesh(lowGeo, mat), 50); // within 50 units

scene.add(lod);

// Must call in render loop:
function animate() {
  lod.update(camera);
  renderer.render(scene, camera);
}
```

## Frustum Culling

Three.js does frustum culling automatically. Make sure:

```js
mesh.frustumCulled = true; // default true — don't set to false unless needed
geo.computeBoundingSphere(); // required for culling — called automatically on most geo
geo.computeBoundingBox();
```

For InstancedMesh, culling applies to the whole mesh. Use custom culling per-instance for large sparse sets.

## Texture Optimization

```js
// Reduce resolution — don't use 4096x4096 unless necessary
// Use 512x512 or 1024x1024 for most objects

// Compress textures (KTX2 / Basis Universal)
import { KTX2Loader } from "three/addons/loaders/KTX2Loader.js";
const ktx2Loader = new KTX2Loader()
  .setTranscoderPath("/basis/")
  .detectSupport(renderer);
// Use .ktx2 textures for GPU-native compression (no CPU decompression)

// Mipmaps — auto-generated, ensure power-of-2 dimensions
texture.generateMipmaps = true;
texture.minFilter = THREE.LinearMipmapLinearFilter;
texture.anisotropy = renderer.capabilities.getMaxAnisotropy();

// Dispose textures no longer needed
texture.dispose();
```

## Material & Draw Call Tips

```js
// Share materials across meshes
const sharedMat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
mesh1.material = sharedMat;
mesh2.material = sharedMat; // same material = same draw call batch (sometimes)

// Avoid per-frame material changes — they break batching

// Use MeshBasicMaterial for UI/billboards that don't need lighting
const uiMat = new THREE.MeshBasicMaterial({ map: texture, transparent: true });

// Avoid transparent objects when possible — they break render order optimization
// Use alphaTest instead of transparent when possible
mat.alphaTest = 0.5;
mat.transparent = false; // faster than transparent: true
```

## Renderer Settings for Performance

```js
// Disable shadows for mobile / low-end
renderer.shadowMap.enabled = false;

// Reduce pixel ratio on high-DPI
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); // instead of 2

// Disable antialias if not needed
// new THREE.WebGLRenderer({ antialias: false })

// Use half-precision for render targets when possible
// renderTarget = new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType })

// Dispose everything when tearing down
renderer.dispose();
renderer.forceContextLoss();
```

## Common Gotchas

- Each unique material = one shader program = overhead at first render
- `mesh.visible = false` still costs a draw call check — use `scene.remove(mesh)` for long-lived invisible objects
- Avoid updating `instanceMatrix` every frame if only some instances change
- Skinned meshes (with bones) can't be instanced with standard InstancedMesh — use custom approach
- `renderer.info.render.calls` resets each frame — read it after render, not before
