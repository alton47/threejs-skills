---
name: threejs-react
description: Integrates Three.js in React using React Three Fiber (R3F), @react-three/drei, and @react-three/postprocessing. Use when the user asks about Three.js in React, React Three Fiber, R3F, @react-three/drei, useFrame, useThree, Canvas setup, or 3D in React components. Trigger keywords: React Three Fiber, R3F, drei, useFrame, useThree, Canvas, 3D React, @react-three.
---

# Three.js in React (React Three Fiber)

## Install

```bash
npm install three @react-three/fiber @react-three/drei
npm install @react-three/postprocessing   # optional, for post-processing
npm install @react-three/rapier           # optional, for physics
```

## Canonical Canvas Setup

```jsx
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";

export default function App() {
  return (
    <Canvas
      camera={{ position: [0, 2, 5], fov: 75 }}
      shadows
      gl={{
        antialias: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1,
      }}
    >
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 10, 5]} intensity={1.5} castShadow />
      <OrbitControls enableDamping />
      <Environment preset="studio" />
      <Box />
    </Canvas>
  );
}

function Box() {
  const meshRef = useRef();
  useFrame((state, delta) => {
    meshRef.current.rotation.y += delta * 0.5;
  });
  return (
    <mesh ref={meshRef} castShadow>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="royalblue" roughness={0.4} />
    </mesh>
  );
}
```

## Core Hooks

```jsx
import { useFrame, useThree, useLoader } from "@react-three/fiber";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

// useFrame — runs every frame, like requestAnimationFrame
// delta = seconds since last frame, state.clock.elapsedTime = total time
useFrame((state, delta) => {
  meshRef.current.rotation.y += delta;
  meshRef.current.position.y = Math.sin(state.clock.elapsedTime) * 0.5;
});

// useThree — access renderer, scene, camera, size
const { camera, renderer, scene, size } = useThree();

// useLoader — loads assets with Suspense
const gltf = useLoader(GLTFLoader, "/model.glb");
// Wrap component in <Suspense fallback={<Loading />}> in parent
```

## @react-three/drei Essentials

```jsx
import {
  OrbitControls, FlyControls, PointerLockControls,
  PerspectiveCamera, OrthographicCamera,
  Environment, Sky, Stars, Cloud,
  useGLTF, useTexture, useFBO,
  Text, Text3D, Billboard,
  Box, Sphere, Plane, Torus, Cylinder,
  RoundedBox, MeshDistortMaterial, MeshWobbleMaterial,
  shaderMaterial, MeshReflectorMaterial,
  Loader, Html, Stats,
  Center, Float, Sparkles,
  useProgress, useIntersect,
  Instances, Instance,
  BakeShadows, SoftShadows,
  TransformControls, GizmoHelper, GizmoViewport,
} from '@react-three/drei';

// Common patterns:
<Environment preset="studio" />   // HDRI lighting — preset or files={[...]}
<Stats />                         // FPS counter — dev only
<Html position={[0,1,0]}>        // DOM in 3D space
  <div>Hello World</div>
</Html>
<Text fontSize={0.5} color="white">Hello</Text>
<Float speed={2} floatIntensity={1}> {/* gentle bob animation */}
  <mesh />
</Float>
<BakeShadows />                   // freeze shadow map (static scenes)
<SoftShadows />                   // PCF soft shadows helper
```

## Loading GLTF

```jsx
import { useGLTF } from "@react-three/drei";

function Model() {
  const { scene, animations } = useGLTF("/model.glb");
  return <primitive object={scene} />;
}

// Preload before component mounts
useGLTF.preload("/model.glb");

// With DRACOLoader
import { useGLTF } from "@react-three/drei";
// drei handles DRACOLoader automatically when you use useGLTF
const { scene } = useGLTF("/model.glb"); // Draco supported by default via CDN
```

## Animations with useAnimations

```jsx
import { useGLTF, useAnimations } from "@react-three/drei";

function Character() {
  const group = useRef();
  const { scene, animations } = useGLTF("/character.glb");
  const { actions } = useAnimations(animations, group);

  useEffect(() => {
    actions["walk"]?.reset().fadeIn(0.2).play();
    return () => actions["walk"]?.fadeOut(0.2);
  }, [actions]);

  return <primitive ref={group} object={scene} />;
}
```

## Custom Shader Material with shaderMaterial

```jsx
import { shaderMaterial } from "@react-three/drei";
import { extend } from "@react-three/fiber";

const WaveMaterial = shaderMaterial(
  { uTime: 0, uColor: new THREE.Color(0x4488ff) },
  /* glsl */ `
    uniform float uTime;
    varying vec2 vUv;
    void main() {
      vUv = uv;
      vec3 pos = position;
      pos.y += sin(pos.x * 3.0 + uTime) * 0.1;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
  /* glsl */ `
    uniform vec3 uColor;
    varying vec2 vUv;
    void main() {
      gl_FragColor = vec4(uColor, 1.0);
    }
  `,
);
extend({ WaveMaterial });

// Usage in JSX:
function WaveMesh() {
  const matRef = useRef();
  useFrame(({ clock }) => {
    matRef.current.uTime = clock.elapsedTime;
  });
  return (
    <mesh>
      <planeGeometry args={[4, 4, 32, 32]} />
      <waveMaterial ref={matRef} />
    </mesh>
  );
}
```

## Post-Processing

```jsx
import {
  EffectComposer,
  Bloom,
  SSAO,
  ChromaticAberration,
} from "@react-three/postprocessing";

<Canvas>
  {/* scene */}
  <EffectComposer>
    <Bloom luminanceThreshold={0.9} intensity={1.5} />
    <SSAO radius={0.1} intensity={30} />
    <ChromaticAberration offset={[0.002, 0.002]} />
  </EffectComposer>
</Canvas>;
```

## Physics with @react-three/rapier

```jsx
import { Physics, RigidBody, CuboidCollider } from "@react-three/rapier";

<Canvas>
  <Physics gravity={[0, -9.81, 0]}>
    <RigidBody>
      <mesh castShadow>
        <boxGeometry />
        <meshStandardMaterial color="royalblue" />
      </mesh>
    </RigidBody>
    <RigidBody type="fixed">
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial />
      </mesh>
    </RigidBody>
  </Physics>
</Canvas>;
```

## Performance Tips

```jsx
// Dispose unused resources
useEffect(() => {
  return () => {
    geo.dispose();
    mat.dispose();
  };
}, []);

// Memoize geometries and materials
const geo = useMemo(() => new THREE.SphereGeometry(1, 32, 16), []);
const mat = useMemo(
  () => new THREE.MeshStandardMaterial({ color: "hotpink" }),
  [],
);

// Instancing via drei
<Instances limit={1000}>
  <sphereGeometry args={[0.1]} />
  <meshStandardMaterial color="orange" />
  {positions.map((p, i) => (
    <Instance key={i} position={p} />
  ))}
</Instances>;
```

## Common Gotchas

- `useFrame` runs outside React's render — don't call `setState` inside it (use ref)
- Always wrap `useLoader` components in `<Suspense>` or they'll throw
- `primitive` clones the scene graph — use `clone()` if you need multiple instances
- `extend` must be called before using custom JSX elements (`<waveMaterial>`)
- Canvas fills its container — set container width/height, not the Canvas itself
- `useGLTF` caches by URL — same URL returns the same object (use `clone()` for multiple)
