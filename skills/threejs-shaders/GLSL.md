# GLSL.md — Three.js Shader Reference

## Contents

- Precision
- Built-in uniforms (ShaderMaterial)
- Built-in attributes (ShaderMaterial)
- Math functions
- Noise functions
- Common visual effects
- Shader chunks (#include)

---

## Precision

```glsl
// ShaderMaterial injects this automatically — don't add it manually
precision highp float;
precision highp int;

// For performance on mobile, use mediump in fragment shader
// RawShaderMaterial requires you to write this yourself
```

---

## Built-in Uniforms (ShaderMaterial auto-injects)

```glsl
uniform mat4 modelMatrix;          // object world transform
uniform mat4 modelViewMatrix;      // object * camera view
uniform mat4 projectionMatrix;     // camera projection
uniform mat4 viewMatrix;           // camera view
uniform mat3 normalMatrix;         // transpose(inverse(modelViewMatrix)) — for normals
uniform vec3 cameraPosition;       // world-space camera position
```

---

## Built-in Attributes (ShaderMaterial)

```glsl
attribute vec3 position;   // vertex position (object space)
attribute vec3 normal;     // vertex normal (object space)
attribute vec2 uv;         // primary UV
attribute vec2 uv2;        // secondary UV (aoMap, lightMap)
attribute vec4 tangent;    // tangent for normal mapping (if computed)
attribute vec3 color;      // vertex color (if geo has color attribute)
```

---

## Math Functions

```glsl
// Remapping
float remap(float v, float a, float b, float c, float d) {
  return c + (d - c) * ((v - a) / (b - a));
}

// Smooth step variants
float smootherstep(float e0, float e1, float x) {
  float t = clamp((x - e0) / (e1 - e0), 0.0, 1.0);
  return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
}

// Rotation 2D
vec2 rotate2D(vec2 v, float a) {
  float s = sin(a), c = cos(a);
  return mat2(c, -s, s, c) * v;
}

// Random
float random(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}
```

---

## Noise Functions

### Value Noise (2D)

```glsl
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}
float valueNoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1,0)), u.x),
    mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), u.x), u.y
  );
}
```

### FBM (Fractal Brownian Motion)

```glsl
float fbm(vec2 p) {
  float value = 0.0, amplitude = 0.5, freq = 1.0;
  for (int i = 0; i < 6; i++) {
    value += amplitude * valueNoise(p * freq);
    amplitude *= 0.5;
    freq *= 2.0;
  }
  return value;
}
```

### Simplex Noise (3D) — compact version

```glsl
vec3 mod289(vec3 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x*34.0)+10.0)*x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(
    i.z + vec4(0.0, i1.z, i2.z, 1.0))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.5 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 105.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}
```

---

## Common Visual Effects

### Rim / Fresnel

```glsl
float fresnel = pow(1.0 - dot(normalize(vNormal), normalize(vViewDir)), 3.0);
vec3 rimColor = mix(baseColor, vec3(1.0), fresnel * rimStrength);
```

### Dissolve

```glsl
float n = fbm(vUv * 4.0 + uTime * 0.2);
float alpha = smoothstep(uProgress - 0.05, uProgress + 0.05, n);
if (alpha < 0.01) discard;
```

### Screen-space UV

```glsl
// Fragment shader — gives UV relative to screen position
vec2 screenUv = gl_FragCoord.xy / uResolution.xy;
```

### Chromatic Aberration

```glsl
float r = texture2D(uTexture, vUv + vec2(uStrength, 0.0)).r;
float g = texture2D(uTexture, vUv).g;
float b = texture2D(uTexture, vUv - vec2(uStrength, 0.0)).b;
gl_FragColor = vec4(r, g, b, 1.0);
```

---

## Shader Chunks (#include)

Three.js splits its built-in shaders into reusable chunks. In `onBeforeCompile`, inject after any chunk:

```js
shader.vertexShader = shader.vertexShader.replace(
  "#include <begin_vertex>",
  `#include <begin_vertex>
   transformed.y += sin(transformed.x + uTime) * 0.1;`,
);
```

Common chunk injection points:

| Chunk                             | When to inject                   |
| --------------------------------- | -------------------------------- |
| `#include <begin_vertex>`         | Modify `transformed` (local pos) |
| `#include <project_vertex>`       | After `mvPosition` is computed   |
| `#include <beginnormal_vertex>`   | Modify `objectNormal`            |
| `#include <color_fragment>`       | Modify `diffuseColor`            |
| `#include <output_fragment>`      | Before final `gl_FragColor`      |
| `#include <emissivemap_fragment>` | After emissive is applied        |

Full chunk list: `node_modules/three/src/renderers/shaders/ShaderChunk/`
