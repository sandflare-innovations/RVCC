"use client";

import React, { Suspense, useRef } from "react";

import { Center, ContactShadows, Environment, OrbitControls, useGLTF } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { MotionValue } from "framer-motion";
import * as THREE from "three";

function Model({
  url,
  rotationY,
  rotationX,
  positionY,
}: {
  url: string;
  rotationY: MotionValue<number>;
  rotationX: MotionValue<number>;
  positionY: MotionValue<number>;
}) {
  const { scene } = useGLTF(url);
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (groupRef.current) {
      // We apply the scroll position, but let OrbitControls handle the rotation interaction
      groupRef.current.position.y = THREE.MathUtils.lerp(
        groupRef.current.position.y,
        positionY.get(),
        0.05
      );

      // If we want scroll to still influence rotation while allowing drag,
      // it's tricky with OrbitControls.
      // For now, let's keep the scroll rotation as a "base" but OrbitControls will override camera.
    }
  });

  return (
    <Center top>
      <group ref={groupRef}>
        <primitive object={scene} />
      </group>
    </Center>
  );
}

interface SkyscraperCanvasProps {
  rotationY: MotionValue<number>;
  rotationX: MotionValue<number>;
  positionY: MotionValue<number>;
}

export const SkyscraperCanvas: React.FC<SkyscraperCanvasProps> = ({
  rotationY,
  rotationX,
  positionY,
}) => {
  return (
    <div className="h-full w-full cursor-grab active:cursor-grabbing">
      <Canvas dpr={[1, 2]} camera={{ position: [0, 20, 180], fov: 35 }} gl={{ alpha: true }}>
        <Suspense fallback={null}>
          <ambientLight intensity={0.4} />
          <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} />
          <pointLight position={[-10, -10, -10]} intensity={0.5} />

          <Model
            url="/3D-Objects/skyscraper.glb"
            rotationY={rotationY}
            rotationX={rotationX}
            positionY={positionY}
          />

          <OrbitControls
            enableZoom={false}
            enablePan={false}
            makeDefault
            autoRotate
            autoRotateSpeed={0.5}
            minPolarAngle={Math.PI / 4}
            maxPolarAngle={Math.PI / 1.5}
          />

          <Environment preset="city" />
          <ContactShadows position={[0, -40, 0]} opacity={0.4} scale={100} blur={2.5} far={40} />
        </Suspense>
      </Canvas>
    </div>
  );
};
