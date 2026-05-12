"use client";

import React, { Suspense, useMemo } from "react";

import { Float, OrbitControls, Stage, useGLTF, useTexture } from "@react-three/drei";
import { Canvas, useGraph } from "@react-three/fiber";
import * as THREE from "three";

function HelmetLogo({ texture }: { texture: THREE.Texture }) {
  return (
    <mesh position={[0.4, 0.45, 0.5]} rotation={[0, Math.PI / 4, 0]}>
      <planeGeometry args={[0.5, 0.5]} />
      <meshBasicMaterial
        map={texture}
        transparent={true}
        polygonOffset={true}
        polygonOffsetFactor={-10}
        depthWrite={false}
        side={THREE.DoubleSide}
        onBeforeCompile={(shader) => {
          shader.fragmentShader = shader.fragmentShader.replace(
            "gl_FragColor = vec4( outgoingLight, diffuseColor.a );",
            "gl_FragColor = vec4( vec3(1.0, 1.0, 1.0), diffuseColor.a );"
          );
        }}
      />
    </mesh>
  );
}

function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url);

  const cleanYellowMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#ffffff",
        roughness: 0.15,
        metalness: 0.05,
      }),
    []
  );

  const blackMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#0073bc",
        roughness: 0.8,
        metalness: 0.1,
      }),
    []
  );

  React.useLayoutEffect(() => {
    let largestMesh: THREE.Mesh | null = null;

    // First pass to find the shell (largest mesh)
    scene.traverse((child: THREE.Object3D) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (
          !largestMesh ||
          mesh.geometry.attributes.position.count > largestMesh.geometry.attributes.position.count
        ) {
          largestMesh = mesh;
        }
      }
    });

    scene.traverse((child: THREE.Object3D) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (mesh === largestMesh) {
          mesh.material = cleanYellowMaterial;
        } else {
          mesh.material = blackMaterial;
        }
      }
    });
  }, [scene, cleanYellowMaterial, blackMaterial]);

  return <primitive object={scene} />;
}

interface ThreeDCanvasProps {
  modelUrl: string;
}

export const ThreeDCanvas: React.FC<ThreeDCanvasProps> = ({ modelUrl }) => {
  return (
    <div className="h-full w-full">
      <Canvas dpr={[1, 2]} camera={{ fov: 45 }} shadows={false}>
        <Suspense fallback={null}>
          <Stage environment="city" intensity={0.5} shadows={false}>
            <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.5}>
              <Model url={modelUrl} />
            </Float>
          </Stage>
        </Suspense>
        <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.5} />
      </Canvas>
    </div>
  );
};
