// examples/shaders/noise.glsl
// Classic value noise + FBM (Fractal Brownian Motion)
// Paste into ShaderMaterial's fragmentShader or vertexShader

// ─── Hash / Value Noise ──────────────────────────────────────────────────────

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float valueNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f); // smoothstep
  return mix(
    mix(hash(i + vec2(0,0)), hash(i + vec2(1,0)), u.x),
    mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), u.x),
    u.y
  );
}

// ─── FBM (6 octaves) ─────────────────────────────────────────────────────────

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  float frequency = 1.0;
  for (int i = 0; i < 6; i++) {
    value += amplitude * valueNoise(p * frequency);
    amplitude *= 0.5;
    frequency *= 2.0;
  }
  return value;
}

// ─── Usage Example ────────────────────────────────────────────────────────────

// In fragment shader main():
//
// float n = fbm(vUv * 4.0 + uTime * 0.1);
// vec3 color = mix(colorA, colorB, n);
// gl_FragColor = vec4(color, 1.0);
