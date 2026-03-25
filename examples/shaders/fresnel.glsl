// examples/shaders/fresnel.glsl
// Fresnel rim effect — glows at silhouette edges
// Split into vertex + fragment sections below

// ─── Vertex Shader ───────────────────────────────────────────────────────────

/*
varying vec3 vNormal;
varying vec3 vViewDirection;

void main() {
  vec4 worldPosition = modelMatrix * vec4(position, 1.0);
  vViewDirection = normalize(cameraPosition - worldPosition.xyz);
  vNormal = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
*/

// ─── Fragment Shader ─────────────────────────────────────────────────────────

/*
uniform vec3 uRimColor;
uniform float uRimPower;    // 1.0 = soft, 3.0 = sharp, 5.0+ = very sharp

varying vec3 vNormal;
varying vec3 vViewDirection;

void main() {
  float fresnel = dot(normalize(vNormal), normalize(vViewDirection));
  fresnel = pow(1.0 - fresnel, uRimPower);
  vec3 finalColor = uRimColor * fresnel;
  gl_FragColor = vec4(finalColor, fresnel);
}
*/

// ─── Full ShaderMaterial Usage ────────────────────────────────────────────────

/*
const fresnelMat = new THREE.ShaderMaterial({
  uniforms: {
    uRimColor: { value: new THREE.Color(0x00ccff) },
    uRimPower: { value: 3.0 },
  },
  vertexShader: VERTEX_SHADER_STRING,
  fragmentShader: FRAGMENT_SHADER_STRING,
  transparent: true,
  side: THREE.BackSide, // render inside for holographic effect
  blending: THREE.AdditiveBlending,
  depthWrite: false,
});

const fresnelMesh = new THREE.Mesh(geometry, fresnelMat);
fresnelMesh.scale.setScalar(1.02); // slightly larger than original
scene.add(fresnelMesh);
*/
