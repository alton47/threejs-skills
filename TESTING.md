# TESTING.md — How to Test Three.js AI Skills

Skills are only useful if they produce correct Three.js. Here's how to verify they do.

---

## Manual Testing

### Claude Code

```bash
# Install the skill
cp -r skills/threejs-core ~/.claude/skills/

# Open a new Claude Code session (not the same one — metadata loads at startup)
# Give it a representative task:
```

**Test prompts by skill:**

| Skill                    | Test Prompt                                                                                                     |
| ------------------------ | --------------------------------------------------------------------------------------------------------------- |
| `threejs-core`           | "Set up a basic Three.js scene with a renderer, camera, and a spinning cube. Include resize handling."          |
| `threejs-geometry`       | "Create a custom BufferGeometry torus with manual normals and UVs."                                             |
| `threejs-materials`      | "Create a PBR material with a roughness map, normal map, and metalness map loaded from files."                  |
| `threejs-lighting`       | "Set up a scene with a DirectionalLight casting PCF soft shadows onto a MeshStandardMaterial plane."            |
| `threejs-camera`         | "Add OrbitControls with damping to a Three.js scene. Make sure the render loop calls controls.update()."        |
| `threejs-animation`      | "Load a GLTF with animations and play the 'walk' clip using AnimationMixer."                                    |
| `threejs-physics`        | "Integrate cannon-es with Three.js. Drop 10 boxes onto a static plane."                                         |
| `threejs-shaders`        | "Write a ShaderMaterial with a vertex shader that displaces vertices along their normals using a time uniform." |
| `threejs-postprocessing` | "Add UnrealBloomPass to an EffectComposer on a Three.js scene."                                                 |
| `threejs-loaders`        | "Load a compressed GLTF using GLTFLoader + DRACOLoader asynchronously, show a loading bar."                     |
| `threejs-react`          | "Create a React Three Fiber scene with a rotating box, OrbitControls, and ambient + directional lighting."      |
| `threejs-performance`    | "Render 10,000 boxes using InstancedMesh instead of individual Mesh objects."                                   |
| `threejs-xr`             | "Add a VRButton to a Three.js scene and set up basic WebXR rendering."                                          |
| `threejs-audio`          | "Attach a PositionalAudio source to a mesh so the volume decreases with camera distance."                       |

---

## What to Check in the Output

**Correctness:**

- [ ] Uses `three/addons/` imports (not `three/examples/jsm/`)
- [ ] Calls `controls.update()` in the render loop when `enableDamping: true`
- [ ] Handles window resize (aspect, updateProjectionMatrix, setSize, setPixelRatio)
- [ ] Uses `THREE.PCFSoftShadowMap` or appropriate shadow type
- [ ] Uses `THREE.ACESFilmicToneMapping` (not `THREE.sRGBEncoding` which was removed)
- [ ] Uses `renderer.outputColorSpace = THREE.SRGBColorSpace` (r152+)
- [ ] No `BoxBufferGeometry` — removed in r160
- [ ] No `Geometry` class — removed in r125

**Style:**

- [ ] No redundant comments (`// This creates a box` above `new THREE.BoxGeometry()`)
- [ ] Code is readable and follows the canonical patterns in this repo
- [ ] Shader uniforms have correct types (`{ value: ... }`)

---

## Automated Evaluation Structure

Evaluations are JSON files that describe expected behavior:

```json
{
  "skills": ["threejs-core"],
  "query": "Set up a basic Three.js scene with a rotating cube and resize handling",
  "expected_behavior": [
    "Creates a WebGLRenderer with antialias: true",
    "Sets pixelRatio with Math.min(window.devicePixelRatio, 2)",
    "Creates PerspectiveCamera with correct aspect ratio",
    "Adds a resize event listener that updates camera.aspect and calls updateProjectionMatrix",
    "Uses requestAnimationFrame for the render loop",
    "Mesh rotates in the animation loop"
  ]
}
```

Store evaluation files in `evals/` (not committed by default — add to `.gitignore` if they contain sensitive project context).

---

## Testing Across Models

| Model         | What to verify                                                                       |
| ------------- | ------------------------------------------------------------------------------------ |
| Claude Haiku  | Skill fires correctly. Basic patterns work without extra hand-holding.               |
| Claude Sonnet | Skill is efficient. Output is clean and doesn't over-generate.                       |
| Claude Opus   | Skill doesn't over-explain. Advanced patterns (shaders, physics) are used correctly. |

---

## Regression Testing After Skill Edits

1. Pick 2–3 test prompts for the skill you edited
2. Run them in a fresh session with the updated skill
3. Compare output to the previous version's output
4. Confirm the change fixed the issue without breaking other patterns

---

## Reporting Failures

If a skill produces incorrect output:

1. Open a GitHub Issue with label `hallucination` or `outdated`
2. Include: the test prompt, the incorrect output, and the correct Three.js API
3. Reference the Three.js docs version if relevant (e.g., "removed in r160")
