"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import {
  Box,
  Download,
  Grid,
  Layers,
  Loader2,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  RotateCcw,
} from "lucide-react";

interface Model3DPreviewProps {
  url: string;
  name: string;
  originalName?: string;
  sizeBytes?: string | number | bigint;
  className?: string;
}

export const Model3DPreview: React.FC<Model3DPreviewProps> = ({
  url,
  name,
  originalName,
  sizeBytes,
  className,
}) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Control states
  const [autoRotate, setAutoRotate] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [wireframe, setWireframe] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Model stats
  const [stats, setStats] = useState<{
    triangles: number;
    vertices: number;
    meshes: number;
  } | null>(null);

  // References for Three.js state
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const modelGroupRef = useRef<THREE.Group | null>(null);
  const gridHelperRef = useRef<THREE.GridHelper | null>(null);
  const originalMaterialsRef = useRef<Map<THREE.Mesh, THREE.Material | THREE.Material[]>>(new Map());
  const initialCameraPosRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 5));
  const initialTargetRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));

  // Sync fullscreen state with document events (e.g. user hits ESC)
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentFullscreen = document.fullscreenElement === wrapperRef.current;
      setIsFullscreen(isCurrentFullscreen);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = async () => {
    if (!wrapperRef.current) return;
    try {
      if (!document.fullscreenElement) {
        await wrapperRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // Fallback toggle for browsers without Fullscreen API support
      setIsFullscreen((prev) => !prev);
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let isMounted = true;
    let animationFrameId: number;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Initial Dimensions
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    // 3. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 2000);
    camera.position.set(0, 2, 5);
    cameraRef.current = camera;

    // 4. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.innerHTML = "";
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 5. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.8;
    controls.enablePan = true;
    controls.enableZoom = true;
    controlsRef.current = controls;

    // 6. Studio Lighting Rig
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    keyLight.position.set(6, 12, 8);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xa5b4fc, 1.2);
    fillLight.position.set(-8, 3, -6);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffffff, 0.8);
    rimLight.position.set(0, -6, 0);
    scene.add(rimLight);

    // 7. Load GLB Model
    setLoading(true);
    setError(null);
    setLoadProgress(0);

    const loader = new GLTFLoader();
    loader.load(
      url,
      (gltf) => {
        if (!isMounted) return;

        const model = gltf.scene;
        modelGroupRef.current = model;

        // Accurate Bounding Box Calculation
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z, 0.001);

        // Center Model at Origin (0, 0, 0)
        model.position.x = -center.x;
        model.position.y = -center.y;
        model.position.z = -center.z;

        const rootGroup = new THREE.Group();
        rootGroup.add(model);
        scene.add(rootGroup);

        // Ground Reference Grid
        const gridHelper = new THREE.GridHelper(
          maxDim * 2.8,
          24,
          0x0073bc,
          0x3f3f46
        );
        gridHelper.position.y = -size.y / 2;
        gridHelperRef.current = gridHelper;
        scene.add(gridHelper);

        // Frame camera with proper vertical and horizontal FOV math
        const currentAspect = (container.clientWidth || 800) / (container.clientHeight || 500);
        camera.aspect = currentAspect;

        const fovRad = camera.fov * (Math.PI / 180);
        const vDistance = (size.y / 2) / Math.tan(fovRad / 2);
        const hFov = 2 * Math.atan(Math.tan(fovRad / 2) * currentAspect);
        const hDistance = (size.x / 2) / Math.tan(hFov / 2);
        const depthOffset = size.z / 2;

        // Ensure 35% comfortable breathing room so the model is never cut off
        const cameraDistance =
          Math.max(vDistance, hDistance, (maxDim / 2) / Math.tan(fovRad / 2)) * 1.35 +
          depthOffset;

        camera.near = Math.max(0.05, cameraDistance / 100);
        camera.far = cameraDistance * 100;
        camera.updateProjectionMatrix();

        const eyePos = new THREE.Vector3(
          cameraDistance * 0.65,
          cameraDistance * 0.45,
          cameraDistance * 0.85
        );
        camera.position.copy(eyePos);
        controls.target.set(0, 0, 0);
        controls.update();

        initialCameraPosRef.current = eyePos.clone();
        initialTargetRef.current = new THREE.Vector3(0, 0, 0);

        // Collect mesh statistics & cache materials
        let triCount = 0;
        let vertCount = 0;
        let meshCount = 0;

        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            meshCount++;
            originalMaterialsRef.current.set(mesh, mesh.material);

            if (mesh.geometry) {
              const geom = mesh.geometry;
              if (geom.index) {
                triCount += geom.index.count / 3;
              } else if (geom.attributes.position) {
                triCount += geom.attributes.position.count / 3;
              }
              if (geom.attributes.position) {
                vertCount += geom.attributes.position.count;
              }
            }
          }
        });

        setStats({
          triangles: Math.round(triCount),
          vertices: vertCount,
          meshes: meshCount,
        });

        setLoading(false);
      },
      (xhr) => {
        if (xhr.lengthComputable && xhr.total > 0) {
          const percent = Math.round((xhr.loaded / xhr.total) * 100);
          setLoadProgress(percent);
        }
      },
      (err) => {
        if (!isMounted) return;
        console.error("Failed to load 3D GLB model:", err);
        setError("Failed to load 3D model. The file format or network response may be invalid.");
        setLoading(false);
      }
    );

    // 8. Animation Loop
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // 9. ResizeObserver: Crucial for dynamic resize and fullscreen transitions
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: w, height: h } = entry.contentRect;
        if (w > 0 && h > 0 && camera && renderer) {
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h);
        }
      }
    });

    resizeObserver.observe(container);

    // Cleanup on unmount
    return () => {
      isMounted = false;
      resizeObserver.disconnect();
      cancelAnimationFrame(animationFrameId);

      controls.dispose();
      renderer.dispose();

      if (container && renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }

      // Dispose geometries and materials
      scene.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const mesh = obj as THREE.Mesh;
          mesh.geometry?.dispose();
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((m) => m.dispose());
          } else if (mesh.material) {
            mesh.material.dispose();
          }
        }
      });
    };
  }, [url]);

  // Sync Auto-Rotate
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = autoRotate;
    }
  }, [autoRotate]);

  // Sync Grid Visibility
  useEffect(() => {
    if (gridHelperRef.current) {
      gridHelperRef.current.visible = showGrid;
    }
  }, [showGrid]);

  // Sync Wireframe Mode
  useEffect(() => {
    if (!modelGroupRef.current) return;
    modelGroupRef.current.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (wireframe) {
          mesh.material = new THREE.MeshBasicMaterial({
            wireframe: true,
            color: 0x00a3ff,
          });
        } else {
          const orig = originalMaterialsRef.current.get(mesh);
          if (orig) mesh.material = orig;
        }
      }
    });
  }, [wireframe]);

  // Reset Camera Position
  const handleResetCamera = () => {
    if (!cameraRef.current || !controlsRef.current) return;
    const camera = cameraRef.current;
    const controls = controlsRef.current;

    camera.position.copy(initialCameraPosRef.current);
    controls.target.copy(initialTargetRef.current);
    controls.update();
  };

  const formattedSize = sizeBytes
    ? `${(Number(sizeBytes) / (1024 * 1024)).toFixed(2)} MB`
    : null;

  return (
    <div
      ref={wrapperRef}
      className={`relative w-full overflow-hidden rounded-2xl bg-gradient-to-b from-zinc-950 via-zinc-900 to-black select-none ${
        isFullscreen
          ? "fixed inset-0 z-[9999] h-screen w-screen rounded-none"
          : className || "h-[58vh] max-h-[640px] min-h-[380px]"
      }`}
    >
      {/* 3D WebGL Canvas Viewport */}
      <div
        ref={containerRef}
        className="h-full w-full cursor-grab active:cursor-grabbing"
      />

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/85 backdrop-blur-xs z-20">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0073bc]/10 text-[#0073bc] mb-4 border border-[#0073bc]/20 shadow-lg shadow-[#0073bc]/10">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
          <p className="text-sm font-semibold text-zinc-200">Loading 3D Model...</p>
          <p className="text-xs text-zinc-400 mt-1 max-w-xs text-center truncate">
            {originalName || name}
          </p>
          {loadProgress > 0 && (
            <div className="mt-4 w-48 bg-zinc-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-[#0073bc] h-full transition-all duration-200"
                style={{ width: `${loadProgress}%` }}
              />
            </div>
          )}
        </div>
      )}

      {/* Error Fallback */}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/95 p-8 text-center z-20">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500 mb-4 border border-rose-500/20">
            <Box className="h-8 w-8" />
          </div>
          <h4 className="text-base font-bold text-zinc-200 mb-2">Unable to render 3D Model</h4>
          <p className="text-xs text-zinc-400 max-w-sm mb-6">{error}</p>
          <a
            href={url}
            download={originalName || name}
            className="flex items-center gap-2 rounded-2xl bg-[#0073bc] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#005fa0] transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Download Model Directly</span>
          </a>
        </div>
      )}

      {/* Top Left: Model Info & Mesh Stats Badge */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 pointer-events-none">
        <div className="flex items-center gap-2 rounded-xl bg-zinc-900/85 px-3 py-1.5 border border-zinc-800/80 backdrop-blur-md text-xs text-zinc-300 shadow-lg">
          <Box className="h-3.5 w-3.5 text-[#0073bc]" />
          <span className="font-semibold text-zinc-100">{name}</span>
          <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] font-mono uppercase text-zinc-400">
            GLB 3D
          </span>
          {formattedSize && (
            <span className="text-[11px] text-zinc-400">• {formattedSize}</span>
          )}
        </div>

        {stats && (
          <div className="flex items-center gap-3 rounded-xl bg-zinc-900/70 px-3 py-1 border border-zinc-800/50 backdrop-blur-md text-[11px] text-zinc-400 shadow">
            <span>{stats.meshes} Meshes</span>
            <span>•</span>
            <span>{stats.vertices.toLocaleString()} Verts</span>
            <span>•</span>
            <span>{stats.triangles.toLocaleString()} Polys</span>
          </div>
        )}
      </div>

      {/* Top Right: Fullscreen Button */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5">
        <button
          onClick={toggleFullscreen}
          className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-900/85 border border-zinc-800/80 text-zinc-400 hover:text-white hover:bg-zinc-800 backdrop-blur-md transition-colors cursor-pointer shadow-lg"
          title={isFullscreen ? "Exit Fullscreen (Esc)" : "Fullscreen 3D View"}
        >
          {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </button>
      </div>

      {/* Bottom Floating Interactive Toolbar */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 rounded-2xl bg-zinc-900/85 border border-zinc-800/80 p-1.5 backdrop-blur-md shadow-2xl">
        <button
          onClick={() => setAutoRotate(!autoRotate)}
          className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
            autoRotate
              ? "bg-[#0073bc] text-white"
              : "text-zinc-400 hover:text-white hover:bg-zinc-800"
          }`}
          title="Toggle Auto Rotation"
        >
          {autoRotate ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          <span>Rotate</span>
        </button>

        <button
          onClick={handleResetCamera}
          className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          title="Reset Camera View"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Reset</span>
        </button>

        <div className="h-4 w-px bg-zinc-800 mx-0.5" />

        <button
          onClick={() => setShowGrid(!showGrid)}
          className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
            showGrid
              ? "bg-zinc-800 text-zinc-200"
              : "text-zinc-500 hover:text-white hover:bg-zinc-800/50"
          }`}
          title="Toggle Floor Grid"
        >
          <Grid className="h-3.5 w-3.5" />
          <span>Grid</span>
        </button>

        <button
          onClick={() => setWireframe(!wireframe)}
          className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
            wireframe
              ? "bg-[#0073bc] text-white"
              : "text-zinc-400 hover:text-white hover:bg-zinc-800"
          }`}
          title="Toggle Wireframe Topology"
        >
          <Layers className="h-3.5 w-3.5" />
          <span>Wireframe</span>
        </button>
      </div>

      {/* Bottom Hint */}
      <div className="absolute bottom-4 right-4 z-10 pointer-events-none hidden md:block">
        <span className="text-[10px] text-zinc-500 font-medium">
          Drag to rotate • Scroll to zoom • Right-click to pan
        </span>
      </div>
    </div>
  );
};
