"use client";

import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";

import { Decal, OrbitControls, Stage, useGLTF, useTexture } from "@react-three/drei";
import { Canvas, createPortal, useFrame } from "@react-three/fiber";
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
  const logoTexture = useTexture("/images/logo/logo.webp");

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

    // Set shell mesh asynchronously to avoid synchronous setState in effect warning
    const timer = setTimeout(() => {
      setShellMesh(largestMesh);
    }, 0);

    return () => clearTimeout(timer);
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
              onBeforeCompile={(shader: { fragmentShader: string }) => {
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

function InteractiveRig({ children }: { children: React.ReactNode }) {
  const groupRef = useRef<THREE.Group>(null);
  const [isIdle, setIsIdle] = useState(true);
  const mousePos = useRef({ x: 0, y: 0, lastMove: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Map global window coordinates to [-1, 1] range
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = -(e.clientY / window.innerHeight) * 2 + 1;
      mousePos.current = { x, y, lastMove: Date.now() };
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useFrame((state) => {
    if (!groupRef.current) return;

    const t = state.clock.getElapsedTime();
    const { x, y, lastMove } = mousePos.current;

    // Detect inactivity (2.5s)
    const hasMovedRecently = Date.now() - lastMove < 2500;

    if (hasMovedRecently && isIdle) {
      setIsIdle(false);
    } else if (!hasMovedRecently && !isIdle) {
      setIsIdle(true);
    }

    let targetX = 0;
    let targetY = 0; // Relative to base rotation

    if (isIdle) {
      // Idle Animation: "Inspection Mode"
      targetY = Math.sin(t * 0.5) * 0.25; // Horizontal ± ~14°
      targetX = Math.cos(t * 0.4) * 0.12; // Vertical ± ~7°
    } else {
      // Cursor Tracking (Window-wide):
      targetY = x * 0.52; // Horizontal (Y-axis): ±30°
      targetX = -y * 0.26; // Vertical (X-axis): ±15°
    }

    // Apply smooth rotation using lerp
    groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetX, 0.07);
    groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetY, 0.07);
  });

  return <group ref={groupRef}>{children}</group>;
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
            <InteractiveRig>
              <group rotation={[0, Math.PI, 0]}>
                <Model url={modelUrl} />
              </group>
            </InteractiveRig>
          </Stage>
        </Suspense>
        <OrbitControls enableZoom={false} enablePan={false} />
      </Canvas>
    </div>
  );
};
