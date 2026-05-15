"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useMotionValue, useTransform, useSpring, animate } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * A 3D interactive card component that rotates based on mouse position.
 * Features an automatic "floating" animation when not hovered.
 */
export const Interactive3DCard = ({
  children,
  className,
  rotationFactor = 0.6,
  autoAnimate = true,
  initialOffset = { x: 0, y: 0 }, // Offset from center for auto-animation
}: {
  children: React.ReactNode;
  className?: string;
  rotationFactor?: number;
  autoAnimate?: boolean;
  initialOffset?: { x: number; y: number };
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Raw motion values for mouse position (0 to 1)
  const mouseX = useMotionValue(0.5 + initialOffset.x);
  const mouseY = useMotionValue(0.5 + initialOffset.y);

  // Smooth springs for tracking the mouse position
  const springConfig = { stiffness: 100, damping: 30, mass: 0.5 };
  const mouseXSpring = useSpring(mouseX, springConfig);
  const mouseYSpring = useSpring(mouseY, springConfig);

  // Map the smooth spring values to rotation angles
  const rotateX = useTransform(mouseYSpring, [0, 1], [rotationFactor * 15, -rotationFactor * 15]);
  const rotateY = useTransform(mouseXSpring, [0, 1], [-rotationFactor * 15, rotationFactor * 15]);

  // Handle Automatic Animation
  useEffect(() => {
    if (!autoAnimate || isHovered) return;

    // Create a gentle floating oscillation
    const controlsX = animate(mouseX, [0.5 + initialOffset.x, 0.5 - initialOffset.x, 0.5 + initialOffset.x], {
      duration: 4,
      repeat: Infinity,
      ease: "easeInOut",
    });

    const controlsY = animate(mouseY, [0.5 + initialOffset.y, 0.5 - initialOffset.y, 0.5 + initialOffset.y], {
      duration: 5,
      repeat: Infinity,
      ease: "easeInOut",
    });

    return () => {
      controlsX.stop();
      controlsY.stop();
    };
  }, [autoAnimate, isHovered, mouseX, mouseY, initialOffset]);

  const handlePointerMove = (e: React.PointerEvent) => {
    setIsHovered(true);
    const bounds = cardRef.current?.getBoundingClientRect();
    if (!bounds) return;

    const px = (e.clientX - bounds.left) / bounds.width;
    const py = (e.clientY - bounds.top) / bounds.height;

    mouseX.set(px);
    mouseY.set(py);
  };

  const handlePointerLeave = () => {
    setIsHovered(false);
    // Return to center (or will be picked up by auto-animation effect)
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


