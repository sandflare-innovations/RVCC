"use client";

import React, { Suspense, useMemo, useRef } from "react";

import { Decal, Float, OrbitControls, Stage, useGLTF, useTexture } from "@react-three/drei";
import { Canvas, createPortal } from "@react-three/fiber";
import * as THREE from "three";

/**
 * Helmet Model with RVCC logo decal printed on the front.
 *
 * GLB structure (from inspection):
 *   Mesh 0  "pSphere1"  – helmet shell  (3 486 verts)
 *       X [-47.7 … 47.7], Y [-17.7 … 43.8], Z [-62.3 … 45.1]
 *   Mesh 1  "sweep1"    – chin strap    (488 verts)
 *
 * The front of the helmet (brim) extends towards negative-Z.
 * We place the logo on the front-center forehead area.
 */
function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  const logoTexture = useTexture("/images/logo/logo.png");

  // White glossy helmet shell material
  const shellMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#ffffff",
        roughness: 0.15,
        metalness: 0.05,
      }),
    []
  );

  // Brand blue chin strap material
  const strapMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#0073bc",
        roughness: 0.8,
        metalness: 0.1,
      }),
    []
  );

  const [shellMesh, setShellMesh] = React.useState<THREE.Mesh | null>(null);

  React.useLayoutEffect(() => {
    let largestMesh: THREE.Mesh | null = null;

    // Find the largest mesh (helmet shell)
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

    // Apply materials
    scene.traverse((child: THREE.Object3D) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.material = mesh === largestMesh ? shellMaterial : strapMaterial;
      }
    });

    setShellMesh(largestMesh);
  }, [scene, shellMaterial, strapMaterial]);

  // Flip the logo texture horizontally to fix mirroring issue
  const decalTexture = React.useMemo(() => {
    const tex = logoTexture.clone();
    tex.wrapS = THREE.RepeatWrapping;
    tex.repeat.x = -1;
    tex.needsUpdate = true;
    return tex;
  }, [logoTexture]);

  return (
    <group>
      <primitive object={scene} />
      {shellMesh &&
        createPortal(
          <Decal
            position={[0, 17, -50]}
            rotation={[0, 0, 0]}
            scale={[40, 15, 40]} // Increased width, height, and depth to fully wrap the curvature without clipping
          >
            <meshBasicMaterial
              map={decalTexture}
              transparent={true}
              polygonOffset={true}
              polygonOffsetFactor={-4}
              depthTest={true}
              depthWrite={false}
              toneMapped={false}
              onBeforeCompile={(shader: THREE.Shader) => {
                shader.fragmentShader = shader.fragmentShader.replace(
                  "#include <map_fragment>",
                  `
                #ifdef USE_MAP
                  vec4 sampledDiffuseColor = texture2D( map, vMapUv );
                  // Key out white background pixels
                  float brightness = (sampledDiffuseColor.r + sampledDiffuseColor.g + sampledDiffuseColor.b) / 3.0;
                  if (brightness > 0.85) {
                    discard;
                  }
                  diffuseColor *= sampledDiffuseColor;
                #endif
                `
                );
              }}
            />
          </Decal>,
          shellMesh
        )}
    </group>
  );
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
              <group rotation={[0, Math.PI, 0]}>
                <Model url={modelUrl} />
              </group>
            </Float>
          </Stage>
        </Suspense>
        <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.5} />
      </Canvas>
    </div>
  );
};
