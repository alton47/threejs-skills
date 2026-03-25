# FIBER.md — React Three Fiber Deep Reference

## Contents

- Canvas props
- useFrame advanced
- useThree
- useLoader and Suspense
- Events
- Portals
- Performance hooks

---

## Canvas Props

```jsx
<Canvas
  camera={{ position: [0, 2, 5], fov: 75, near: 0.1, far: 1000 }}
  orthographic           // switch to OrthographicCamera
  shadows                // enable shadow maps (PCFSoftShadowMap)
  shadows="soft"         // shorthand for PCFSoftShadowMap
  shadows="variance"     // VSMShadowMap
  dpr={[1, 2]}           // pixel ratio range [min, max]
  frameloop="demand"     // only render when state changes (great for static scenes)
  frameloop="never"      // manual render control
  gl={{
    antialias: true,
    toneMapping: THREE.ACESFilmicToneMapping,
    outputColorSpace: THREE.SRGBColorSpace,
  }}
  onCreated={({ gl, scene, camera }) => {
    // access Three.js objects at creation
  }}
>
```

---

## useFrame Advanced

```jsx
// Priority — lower number runs first (default 0)
useFrame(() => {
  /* runs first */
}, -1);
useFrame(() => {
  /* runs second */
}, 0);
useFrame(() => {
  /* runs after render */
}, 1);

// state object
useFrame((state) => {
  const { clock, camera, scene, gl, size, viewport } = state;
  // clock.elapsedTime, clock.getDelta()
  // camera — the current camera
  // gl — the renderer
  // size — { width, height }
  // viewport — { width, height, factor } in world units
});

// Subscribe to a specific render loop step
useFrame((state, delta, xrFrame) => {
  // xrFrame is non-null in XR sessions
});

// Stop rendering after first frame (static mesh)
const [stop, setStop] = useState(false);
useFrame(() => {
  if (stop) return;
  // ... animate once, then stop
  setStop(true);
});
```

---

## useThree

```jsx
const {
  camera, // current camera
  scene, // the scene
  gl, // WebGLRenderer
  size, // { width, height, top, left }
  viewport, // world-space { width, height, factor, distance, aspect }
  raycaster, // THREE.Raycaster
  events, // event system
  set, // update store
  get, // read store snapshot
  invalidate, // trigger re-render when frameloop="demand"
  advance, // manually advance one frame when frameloop="never"
  setEvents, // configure event system
} = useThree();

// Responsive sizing
const { width, height } = useThree((state) => state.size);
const { viewport } = useThree();
// viewport.width/height in world units at camera's current distance
```

---

## useLoader and Suspense

```jsx
import { useLoader } from "@react-three/fiber";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { TextureLoader } from "three";

// Must be inside <Suspense>
function Asset() {
  const gltf = useLoader(GLTFLoader, "/model.glb");
  const texture = useLoader(TextureLoader, "/diffuse.jpg");
  return <primitive object={gltf.scene} />;
}

// With loader configuration (e.g., DRACOLoader)
const gltf = useLoader(GLTFLoader, "/model.glb", (loader) => {
  const draco = new DRACOLoader();
  draco.setDecoderPath("/draco/");
  loader.setDRACOLoader(draco);
});

// Multiple assets
const [modelA, modelB] = useLoader(GLTFLoader, ["/a.glb", "/b.glb"]);

// Parent component:
<Suspense fallback={<LoadingSpinner />}>
  <Asset />
</Suspense>;
```

---

## Events

```jsx
<mesh
  onClick={(e) => {
    e.stopPropagation(); // stop event bubbling
    console.log('clicked', e.point, e.face, e.distance);
  }}
  onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
  onPointerOut={() => setHovered(false)}
  onPointerDown={(e) => { /* drag start */ }}
  onPointerUp={(e) => { /* drag end */ }}
  onPointerMove={(e) => { /* hovering */ }}
  onDoubleClick={(e) => { /* double click */ }}
  onWheel={(e) => { /* scroll */ }}
  onContextMenu={(e) => { /* right click */ }}
>
```

---

## Portals (render to texture)

```jsx
import { createPortal, useFrame } from "@react-three/fiber";
import { useFBO } from "@react-three/drei";

function Portal() {
  const renderTarget = useFBO(512, 512);
  const portalScene = useMemo(() => new THREE.Scene(), []);
  const portalCamera = useRef();

  useFrame(({ gl }) => {
    gl.setRenderTarget(renderTarget);
    gl.render(portalScene, portalCamera.current);
    gl.setRenderTarget(null);
  });

  return (
    <>
      {createPortal(<PortalContent ref={portalCamera} />, portalScene)}
      <mesh>
        <planeGeometry />
        <meshBasicMaterial map={renderTarget.texture} />
      </mesh>
    </>
  );
}
```

---

## Performance

```jsx
// Suspend + preload — prevents flash
useGLTF.preload('/model.glb');
useTexture.preload('/diffuse.jpg');

// frameloop="demand" — only render when needed
<Canvas frameloop="demand">

// invalidate triggers one frame
const { invalidate } = useThree();
useEffect(() => { invalidate(); }, [data]);

// Memoize expensive geometry/material
const geo = useMemo(() => new THREE.SphereGeometry(1, 32, 16), []);

// Avoid re-creating inline objects — they trigger re-renders
// ❌ Bad:
<mesh position={[0, 1, 0]} />  // new array every render

// ✓ Good:
const pos = useMemo(() => [0, 1, 0], []);
<mesh position={pos} />
// Or: <mesh position-y={1} />  (R3F prop drilling)
```
