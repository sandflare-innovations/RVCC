"use client";

import { useRef } from "react";
import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * A 3D interactive card component that rotates based on mouse position.
 * Optimized for smoothness and anti-flicker.
 */
export const Interactive3DCard = ({
  children,
  className,
  rotationFactor = 0.6,
}: {
  children: React.ReactNode;
  className?: string;
  rotationFactor?: number;
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  // Raw motion values for mouse position (0 to 1)
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);

  // Smooth springs for tracking the mouse position
  const springConfig = { stiffness: 100, damping: 30, mass: 0.5 };
  const mouseXSpring = useSpring(mouseX, springConfig);
  const mouseYSpring = useSpring(mouseY, springConfig);

  // Map the smooth spring values to rotation angles
  const rotateX = useTransform(mouseYSpring, [0, 1], [rotationFactor * 15, -rotationFactor * 15]);
  const rotateY = useTransform(mouseXSpring, [0, 1], [-rotationFactor * 15, rotationFactor * 15]);

  const handlePointerMove = (e: React.PointerEvent) => {
    const bounds = cardRef.current?.getBoundingClientRect();
    if (!bounds) return;

    const px = (e.clientX - bounds.left) / bounds.width;
    const py = (e.clientY - bounds.top) / bounds.height;

    mouseX.set(px);
    mouseY.set(py);
  };

  const handlePointerLeave = () => {
    // Smoothly return to center
    mouseX.set(0.5);
    mouseY.set(0.5);
  };

  return (
    <div
      ref={cardRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className={cn("relative isolate w-full h-full", className)}
      style={{
        perspective: "1200px",
      }}
    >
      <motion.div
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        className="w-full h-full"
      >
        {children}
      </motion.div>
    </div>
  );
};

