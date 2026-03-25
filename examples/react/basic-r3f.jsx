/**
 * examples/react/basic-r3f.jsx
 * Minimal React Three Fiber scene — rotating box, OrbitControls, lighting
 */

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment, Stats } from "@react-three/drei";
import * as THREE from "three";

function Box({ position = [0, 0, 0], color = "royalblue" }) {
  const meshRef = useRef();

  useFrame((state, delta) => {
    meshRef.current.rotation.x += delta * 0.3;
    meshRef.current.rotation.y += delta * 0.5;
  });

  return (
    <mesh ref={meshRef} position={position} castShadow>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={color} roughness={0.4} metalness={0.1} />
    </mesh>
  );
}

function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[10, 10]} />
      <meshStandardMaterial color="#222222" roughness={0.8} />
    </mesh>
  );
}

export default function App() {
  return (
    <Canvas
      camera={{ position: [3, 3, 5], fov: 75 }}
      shadows
      gl={{
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1,
        outputColorSpace: THREE.SRGBColorSpace,
      }}
      style={{ width: "100vw", height: "100vh" }}
    >
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[5, 10, 5]}
        intensity={1.5}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.001}
      />

      {/* Environment (HDRI) */}
      <Environment preset="studio" />

      {/* Controls */}
      <OrbitControls enableDamping target={[0, 0.5, 0]} />

      {/* Scene */}
      <Box position={[0, 0.5, 0]} color="royalblue" />
      <Box position={[2, 0.5, 0]} color="#ff4400" />
      <Box position={[-2, 0.5, 0]} color="#00cc88" />
      <Ground />

      {/* Dev tools */}
      <Stats />
    </Canvas>
  );
}
