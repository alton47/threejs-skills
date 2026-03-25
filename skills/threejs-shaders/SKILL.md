---
name: threejs-shaders
description: Writes custom GLSL shaders in Three.js using ShaderMaterial and RawShaderMaterial — uniforms, varyings, vertex displacement, fragment effects, noise, fresnel, dissolve, and shader chunk injection. Use when the user asks about custom shaders, GLSL, ShaderMaterial, uniforms, vertex shaders, fragment shaders, noise effects, or GPU-based effects. Trigger keywords: shader, GLSL, ShaderMaterial, uniform, vertex shader, fragment shader, noise, fresnel, dissolve, GPU effect.
---

# Three.js Shaders

## ShaderMaterial vs RawShaderMaterial

- **ShaderMaterial**: Three.js auto-injects built-in uniforms (`projectionMatrix`, `modelViewMatrix`, `normalMatrix`, `cameraPosition`) and precision headers. Use this 99% of the time.
- **RawShaderMaterial**: No auto-injection — you write everything. Use when you need full control.

## Minimal ShaderMaterial

```js
const mat = new THREE.ShaderMaterial({
  uniforms: {
    uTime: { value: 0 },
    uColor: { value: new THREE.Color(0x4488ff) },
  },
  vertexShader: /* glsl */ `
    uniform float uTime;
    varying vec2 vUv;
    varying vec3 vNormal;

    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);

      vec3 pos = position;
      pos.y += sin(pos.x * 3.0 + uTime) * 0.1;

      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform vec3 uColor;
    varying vec2 vUv;
    varying vec3 vNormal;

    void main() {
      float light = dot(vNormal, normalize(vec3(1.0, 1.0, 1.0))) * 0.5 + 0.5;
      gl_FragColor = vec4(uColor * light, 1.0);
    }
  `,
});

// Update uniforms in render loop
function animate() {
  requestAnimationFrame(animate);
  mat.uniforms.uTime.value = clock.getElapsedTime();
  renderer.render(scene, camera);
}
```

## Uniform Types

```glsl
// In JS:
uniforms: {
  uFloat:   { value: 1.0 },
  uVec2:    { value: new THREE.Vector2(0, 0) },
  uVec3:    { value: new THREE.Vector3(1, 0, 0) },
  uVec4:    { value: new THREE.Vector4() },
  uColor:   { value: new THREE.Color(0xff0000) },
  uMatrix:  { value: new THREE.Matrix4() },
  uTexture: { value: texture },           // sampler2D
  uCubemap: { value: cubeTexture },       // samplerCube
  uBool:    { value: true },              // bool (avoid — use float instead)
  uInt:     { value: 42 },               // int
}

// In GLSL:
uniform float uFloat;
uniform vec2  uVec2;
uniform vec3  uVec3;
uniform vec4  uVec4;
uniform vec3  uColor;      // THREE.Color maps to vec3
uniform mat4  uMatrix;
uniform sampler2D uTexture;
uniform samplerCube uCubemap;
```

## Common GLSL Patterns

See [GLSL.md](GLSL.md) for the complete pattern library.

### Noise (Classic Perlin)

```glsl
// Classic value noise — paste above main()
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f); // smoothstep
  return mix(
    mix(hash(i), hash(i + vec2(1,0)), u.x),
    mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), u.x),
    u.y
  );
}
```

### Fresnel Effect

```glsl
// In vertex shader:
varying vec3 vViewDirection;
void main() {
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vViewDirection = normalize(cameraPosition - worldPos.xyz);
  vNormal = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}

// In fragment shader:
varying vec3 vNormal;
varying vec3 vViewDirection;
void main() {
  float fresnel = pow(1.0 - dot(vNormal, vViewDirection), 3.0);
  gl_FragColor = vec4(vec3(fresnel), 1.0);
}
```

### UV Distortion

```glsl
vec2 distortedUv = vUv + vec2(
  sin(vUv.y * 10.0 + uTime) * 0.02,
  cos(vUv.x * 10.0 + uTime) * 0.02
);
vec4 color = texture2D(uTexture, distortedUv);
```

### Dissolve with Noise

```glsl
uniform float uProgress; // 0 to 1
// ...
float n = noise(vUv * 5.0);
float edge = 0.05;
float alpha = smoothstep(uProgress - edge, uProgress + edge, n);
if (alpha < 0.01) discard;
gl_FragColor = vec4(color.rgb, alpha);
```

## Inject Custom Code into Built-in Materials

```js
// Extend MeshStandardMaterial without full custom shader
const mat = new THREE.MeshStandardMaterial({ color: 0x4488ff });

mat.onBeforeCompile = (shader) => {
  shader.uniforms.uTime = { value: 0 };

  shader.vertexShader = shader.vertexShader.replace(
    "#include <begin_vertex>",
    `
    #include <begin_vertex>
    float wave = sin(position.x * 3.0 + uTime) * 0.1;
    transformed.y += wave;
    `,
  );

  mat.userData.shader = shader; // store ref to update uniforms
};

// Update in loop:
if (mat.userData.shader) {
  mat.userData.shader.uniforms.uTime.value = clock.getElapsedTime();
}
```

## ShaderMaterial Options

```js
new THREE.ShaderMaterial({
  transparent: true,
  depthWrite: false,
  depthTest: true,
  side: THREE.DoubleSide,
  blending: THREE.AdditiveBlending,
  wireframe: false,
  clipping: false,
  defines: {
    MY_DEFINE: "", // #define MY_DEFINE in GLSL
    STEPS: "8", // #define STEPS 8
  },
  glslVersion: THREE.GLSL3, // use WebGL2 GLSL (in/out instead of varying)
});
```

## GLSL3 (WebGL2) Syntax

```glsl
// Vertex shader — GLSL3
in vec3 position;     // attribute
in vec2 uv;
out vec2 vUv;         // varying (out)

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}

// Fragment shader — GLSL3
in vec2 vUv;          // varying (in)
out vec4 fragColor;   // replaces gl_FragColor

void main() {
  fragColor = vec4(vUv, 0.0, 1.0);
}
```

## Common Gotchas

- Always `{ value: ... }` wrapping for uniforms — just passing the raw value won't work
- `THREE.Color` maps to `vec3` in GLSL, not `vec4`
- Updating `uniforms.uX.value = newVal` is correct — don't replace `uniforms.uX` itself
- `onBeforeCompile` runs once per material compile — store `shader` ref in `userData`
- `glslVersion: THREE.GLSL3` requires WebGL2 (all modern browsers) — removes `gl_FragColor`, use `out vec4 fragColor`
- `/* glsl */` template literal tag is just a hint to IDE syntax highlighting — no runtime effect
