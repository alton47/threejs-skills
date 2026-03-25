---
name: threejs-postprocessing
description: Adds post-processing effects to Three.js scenes using EffectComposer — bloom, SSAO, SMAA, depth of field, motion blur, and custom passes. Also covers pmndrs/postprocessing for React Three Fiber. Use when the user asks about post-processing, bloom, glow, SSAO, depth of field, vignette, chromatic aberration, or visual effects pipeline. Trigger keywords: post-processing, bloom, glow, EffectComposer, SSAO, depth of field, vignette, chromatic aberration, UnrealBloom.
---

# Three.js Post-Processing

## EffectComposer Setup

```js
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera)); // always first

// Add effect passes
composer.addPass(
  new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    1.5, // strength
    0.4, // radius
    0.85, // threshold — only fragments above this luminance bloom
  ),
);

composer.addPass(new OutputPass()); // always last — handles tone mapping + color space

// Render loop — use composer instead of renderer.render()
function animate() {
  requestAnimationFrame(animate);
  composer.render();
}

// Resize — update composer too
window.addEventListener("resize", () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});
```

## Available Passes

```js
import { SSAOPass } from "three/addons/postprocessing/SSAOPass.js";
import { SAOPass } from "three/addons/postprocessing/SAOPass.js";
import { SSRPass } from "three/addons/postprocessing/SSRPass.js";
import { BokehPass } from "three/addons/postprocessing/BokehPass.js";
import { FilmPass } from "three/addons/postprocessing/FilmPass.js";
import { GlitchPass } from "three/addons/postprocessing/GlitchPass.js";
import { DotScreenPass } from "three/addons/postprocessing/DotScreenPass.js";
import { HalftonePass } from "three/addons/postprocessing/HalftonePass.js";
import { OutlinePass } from "three/addons/postprocessing/OutlinePass.js";
import { SMAAPass } from "three/addons/postprocessing/SMAAPass.js";
import { FXAAShader } from "three/addons/shaders/FXAAShader.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
```

## SSAO

```js
const ssaoPass = new SSAOPass(
  scene,
  camera,
  window.innerWidth,
  window.innerHeight,
);
ssaoPass.kernelRadius = 16;
ssaoPass.minDistance = 0.005;
ssaoPass.maxDistance = 0.1;
composer.addPass(ssaoPass);
```

## Selective Bloom (bloom without overexposing everything)

```js
// Strategy: render scene twice — bloom layer separately, then merge
const BLOOM_LAYER = 1;
const bloomLayer = new THREE.Layers();
bloomLayer.set(BLOOM_LAYER);

// Mark objects to bloom
glowMesh.layers.enable(BLOOM_LAYER);

// 1. Render bloom layer with DarkenNonBloomed pass
// 2. Render full scene
// 3. Merge with MixPass / ShaderPass

// Simpler approach — use pmndrs/postprocessing (below) which handles this natively
```

## Custom ShaderPass

```js
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";

const vignetteShader = {
  uniforms: {
    tDiffuse: { value: null }, // auto-set by ShaderPass
    uStrength: { value: 1.5 },
    uOffset: { value: 1.0 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float uStrength;
    uniform float uOffset;
    varying vec2 vUv;
    void main() {
      vec4 color = texture2D(tDiffuse, vUv);
      vec2 uv = (vUv - 0.5) * 2.0;
      float vignette = 1.0 - smoothstep(uOffset - 0.5, uOffset + 0.5, length(uv) * uStrength);
      gl_FragColor = vec4(color.rgb * vignette, color.a);
    }
  `,
};

const vignettePass = new ShaderPass(vignetteShader);
composer.addPass(vignettePass);
// Update uniform:
vignettePass.uniforms.uStrength.value = 2.0;
```

## pmndrs/postprocessing (React Three Fiber)

```jsx
import {
  EffectComposer,
  Bloom,
  SSAO,
  ChromaticAberration,
  Vignette,
  DepthOfField,
  Noise,
  ToneMapping,
} from "@react-three/postprocessing";
import { BlendFunction, ToneMappingMode } from "postprocessing";

<EffectComposer>
  <Bloom
    intensity={1.5}
    luminanceThreshold={0.9}
    luminanceSmoothing={0.025}
    mipmapBlur
  />
  <SSAO radius={0.1} intensity={30} luminanceInfluence={0.6} color="black" />
  <ChromaticAberration offset={[0.002, 0.002]} />
  <Vignette offset={0.5} darkness={0.5} />
  <DepthOfField focusDistance={0} focalLength={0.02} bokehScale={2} />
  <Noise opacity={0.02} />
  <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
</EffectComposer>;
```

## Common Gotchas

- `OutputPass` must be the **last** pass — it applies tone mapping and color space conversion
- Without `OutputPass`, colors look washed out or incorrect after composer
- `composer.render()` replaces `renderer.render()` — don't call both
- `tDiffuse` in custom ShaderPass is auto-injected — don't set it manually
- SSAO and SSR are expensive on mobile — gate behind capability check
- If scene looks too dark after adding composer: check `OutputPass` is present and `renderer.toneMapping` is set
- Resize: always call `composer.setSize()` alongside `renderer.setSize()`
