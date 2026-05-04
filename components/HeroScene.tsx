"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Sparkles } from "@react-three/drei";
import { useRef } from "react";
import * as THREE from "three";

function OctagonCage() {
  const group = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (group.current) {
      group.current.rotation.y += delta * 0.25;
    }
  });

  return (
    <group ref={group}>
      <mesh>
        <cylinderGeometry args={[2.2, 2.2, 2.6, 8, 1, true]} />
        <meshBasicMaterial
          color="#dc2626"
          wireframe
          transparent
          opacity={0.6}
        />
      </mesh>

      <mesh position={[0, 1.3, 0]}>
        <torusGeometry args={[2.2, 0.04, 8, 8]} />
        <meshStandardMaterial
          color="#dc2626"
          emissive="#dc2626"
          emissiveIntensity={1.5}
        />
      </mesh>
      <mesh position={[0, -1.3, 0]}>
        <torusGeometry args={[2.2, 0.04, 8, 8]} />
        <meshStandardMaterial
          color="#dc2626"
          emissive="#dc2626"
          emissiveIntensity={1.5}
        />
      </mesh>
    </group>
  );
}

function Glove() {
  const ref = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (!ref.current) return;
    ref.current.rotation.y -= delta * 0.6;
    ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.7) * 0.15;
  });

  return (
    <group ref={ref}>
      <mesh position={[0, 0.1, 0]} castShadow>
        <sphereGeometry args={[0.85, 32, 32]} />
        <meshStandardMaterial
          color="#1a1a1a"
          metalness={0.4}
          roughness={0.35}
          emissive="#dc2626"
          emissiveIntensity={0.25}
        />
      </mesh>
      <mesh position={[0.55, -0.55, 0]} rotation={[0, 0, -0.5]}>
        <cylinderGeometry args={[0.45, 0.55, 0.7, 24]} />
        <meshStandardMaterial
          color="#0a0a0a"
          metalness={0.3}
          roughness={0.5}
        />
      </mesh>
      <mesh position={[-0.4, 0.5, 0.75]}>
        <torusGeometry args={[0.18, 0.04, 16, 32]} />
        <meshStandardMaterial
          color="#dc2626"
          emissive="#dc2626"
          emissiveIntensity={2}
        />
      </mesh>
    </group>
  );
}

export default function HeroScene() {
  return (
    <Canvas
      camera={{ position: [0, 0.2, 5.5], fov: 45 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true }}
    >
      <color attach="background" args={["#050505"]} />
      <fog attach="fog" args={["#050505", 6, 14]} />

      <ambientLight intensity={0.25} />
      <directionalLight position={[3, 4, 5]} intensity={0.8} />
      <pointLight position={[-3, -2, 2]} intensity={2} color="#dc2626" />
      <pointLight position={[3, 2, -2]} intensity={1.5} color="#dc2626" />

      <Float speed={1.4} rotationIntensity={0.4} floatIntensity={0.6}>
        <Glove />
      </Float>

      <OctagonCage />

      <Sparkles
        count={60}
        scale={6}
        size={2}
        speed={0.3}
        opacity={0.6}
        color="#dc2626"
      />
    </Canvas>
  );
}
