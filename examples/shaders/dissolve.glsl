// examples/shaders/dissolve.glsl
// Dissolve / burn effect — object disappears from noise pattern edge

// ─── Vertex Shader ───────────────────────────────────────────────────────────

/*
varying vec2 vUv;
varying vec3 vPosition;

void main() {
  vUv = uv;
  vPosition = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
*/

// ─── Fragment Shader ─────────────────────────────────────────────────────────

/*
uniform float uProgress;      // 0.0 = fully visible, 1.0 = fully dissolved
uniform vec3 uEdgeColor;      // burn/glow color at dissolve edge
uniform float uEdgeWidth;     // width of glow band (0.0 to 0.1)
uniform sampler2D uTexture;   // object texture (optional)

varying vec2 vUv;
varying vec3 vPosition;

// Value noise
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i+vec2(1,0)), u.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5, fr = 1.0;
  for (int i = 0; i < 5; i++) { v += a * noise(p * fr); a *= 0.5; fr *= 2.0; }
  return v;
}

void main() {
  // Sample dissolve pattern
  float n = fbm(vUv * 4.0 + vPosition.y * 0.5);

  // Hard dissolve (discard below threshold)
  if (n < uProgress) discard;

  // Edge glow
  float edge = smoothstep(uProgress, uProgress + uEdgeWidth, n);

  // Base color (from texture or flat)
  vec4 base = texture2D(uTexture, vUv);

  // Add glow at edge
  vec3 color = mix(uEdgeColor, base.rgb, edge);
  float alpha = edge < 0.01 ? 0.0 : base.a;

  gl_FragColor = vec4(color, alpha);
}
*/

// ─── Usage ────────────────────────────────────────────────────────────────────

/*
const dissolveMat = new THREE.ShaderMaterial({
  uniforms: {
    uProgress:  { value: 0.0 },
    uEdgeColor: { value: new THREE.Color(0xff4400) },
    uEdgeWidth: { value: 0.05 },
    uTexture:   { value: yourTexture },
  },
  vertexShader: VERTEX_STRING,
  fragmentShader: FRAGMENT_STRING,
  transparent: true,
  side: THREE.DoubleSide,
  depthWrite: false,
});

// Animate dissolve with GSAP:
import gsap from 'gsap';
gsap.to(dissolveMat.uniforms.uProgress, {
  value: 1.0,
  duration: 2,
  ease: 'power2.inOut',
  onComplete: () => scene.remove(mesh),
});
*/
