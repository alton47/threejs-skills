# PROFILING.md — Three.js Performance Profiling Guide

## Contents

- Stats.js setup
- renderer.info
- Chrome DevTools GPU profiling
- Spector.js
- Three.js Inspector
- Common bottleneck patterns
- Mobile checklist

---

## Stats.js

```js
import Stats from "three/addons/libs/stats.module.js";

const stats = new Stats();
stats.showPanel(0); // 0=FPS, 1=MS per frame, 2=MB memory
document.body.appendChild(stats.dom);
stats.dom.style.position = "fixed";
stats.dom.style.top = "0px";
stats.dom.style.left = "0px";

function animate() {
  stats.begin();
  renderer.render(scene, camera);
  stats.end();
  requestAnimationFrame(animate);
}

// React Three Fiber — use drei's Stats
import { Stats } from "@react-three/drei";
<Stats showPanel={0} />;
```

---

## renderer.info

Read after `renderer.render()`:

```js
function animate() {
  renderer.render(scene, camera);

  const info = renderer.info;
  console.log({
    calls: info.render.calls, // draw calls this frame
    triangles: info.render.triangles, // triangles rendered
    points: info.render.points,
    lines: info.render.lines,
    geometries: info.memory.geometries, // GPU-uploaded geometries
    textures: info.memory.textures, // GPU-uploaded textures
    programs: info.programs.length, // compiled shader programs
  });

  // Reset auto-clears each frame — read before or same frame as render
}
```

**Target:** < 100 draw calls for 60fps on most hardware.

---

## Chrome DevTools GPU Profiling

1. Open DevTools → **Performance** tab
2. Click **Record**, run your scene for 3-5s, click **Stop**
3. Look for:
   - **Long frames** (> 16ms = below 60fps)
   - **GPU** section — long GPU tasks = fill-rate or overdraw issues
   - **Scripting** blocks — JavaScript heavy CPU usage

4. Enable **FPS meter**: DevTools → More tools → Rendering → FPS meter

5. For shader analysis: DevTools → More tools → **WebGL** (enable WebGL debug info)

---

## Spector.js

Best tool for inspecting individual WebGL calls per frame.

```bash
# Install browser extension:
# https://github.com/BabylonJS/Spector.js
# Chrome Web Store: "Spector.js"
```

Usage:

1. Install Spector.js extension
2. Open your Three.js page
3. Click Spector icon → **Capture frame**
4. Inspect every draw call, uniform, texture, and shader
5. Identify redundant state changes and large draw calls

---

## Three.js Inspector (browser extension)

Available for Chrome — lets you inspect scene graph, materials, geometries, and textures in real-time.

```
Chrome Web Store: "Three.js Inspector"
```

---

## Common Bottleneck Patterns

| Symptom                     | Likely Cause            | Fix                                                        |
| --------------------------- | ----------------------- | ---------------------------------------------------------- |
| FPS drops with many objects | Too many draw calls     | Use InstancedMesh                                          |
| FPS drops on close-up       | Fill rate / overdraw    | Reduce shader complexity, avoid alpha blending stacks      |
| FPS drops on texture change | Too many texture binds  | Texture atlas, share materials                             |
| Stutters on first render    | Shader compilation      | Pre-compile shaders with `renderer.compile(scene, camera)` |
| Memory growing over time    | Not disposing           | `geo.dispose()`, `mat.dispose()`, `tex.dispose()`          |
| CPU-bound                   | Heavy JS in loop        | Move work to workers, reduce per-frame allocations         |
| GPU memory high             | Too many large textures | Use KTX2 compression, reduce texture resolution            |

---

## Pre-compile Shaders

Prevents first-render stutter (shader compilation happens upfront instead):

```js
// After adding all objects to scene:
renderer.compile(scene, camera);
// Or for progressive loading:
renderer.compileAsync(scene, camera).then(() => {
  startAnimation();
});
```

---

## Mobile Performance Checklist

```js
// 1. Pixel ratio — never unclamp
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// 2. Shadows — disable or reduce
renderer.shadowMap.enabled = false; // or use mapSize 512 max

// 3. Antialiasing — consider disabling
// new THREE.WebGLRenderer({ antialias: false })

// 4. Compressed textures — KTX2 with ETC1S
// Saves 4-8x GPU memory vs uncompressed JPG

// 5. Draw calls — aim for < 20 on mobile
// 6. Polygon count — 100k triangles max for mobile
// 7. Post-processing — disable EffectComposer on mobile

// Detect mobile
const isMobile = /Mobi|Android/i.test(navigator.userAgent);
if (isMobile) {
  renderer.setPixelRatio(1);
  renderer.shadowMap.enabled = false;
}

// Detect GPU tier (via detect-gpu package)
import { getGPUTier } from "detect-gpu";
const gpuTier = await getGPUTier();
if (gpuTier.tier < 2) {
  // reduce quality
}
```
