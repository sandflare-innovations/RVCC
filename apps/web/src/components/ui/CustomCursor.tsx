"use client";

import React, { useEffect, useState } from "react";

import { motion, useMotionValue, useSpring } from "framer-motion";

export const CustomCursor = () => {
  const [isMounted, setIsMounted] = useState(false);
  const [isPointer, setIsPointer] = useState(false);

  const [isIdle, setIsIdle] = useState(false);

  // Position of the cursor
  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);

  // Smooth springs for natural movement
  // Snappier springs for more direct feel
  const springConfig = { damping: 45, stiffness: 1000, restDelta: 0.001 };
  const edgeSpringX = useSpring(mouseX, springConfig);
  const edgeSpringY = useSpring(mouseY, springConfig);

  useEffect(() => {
    // Disable custom cursor on touch devices
    const isTouchDevice =
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0 ||
      window.matchMedia("(pointer: coarse)").matches;

    if (isTouchDevice) return;

    setIsMounted(true);

    let idleTimer: NodeJS.Timeout;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
      setIsIdle(false);

      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        setIsIdle(true);
      }, 2000);

      // Check if hovering over a clickable element
      const target = e.target as HTMLElement;
      const isClickable =
        target.closest('a, button, [role="button"], input, select, textarea') !== null ||
        window.getComputedStyle(target).cursor === "pointer";

      setIsPointer(isClickable);
    };

    window.addEventListener("mousemove", handleMouseMove);

    // Global style to hide default cursor
    document.body.style.cursor = "none";

    // Add style to interactive elements as well
    const style = document.createElement("style");
    style.innerHTML = `
      * { cursor: none !important; }
    `;
    document.head.appendChild(style);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.body.style.cursor = "auto";
      document.head.removeChild(style);
      clearTimeout(idleTimer);
    };
  }, [mouseX, mouseY]);

  if (!isMounted) return null;

  return (
    <motion.div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        x: edgeSpringX,
        y: edgeSpringY,
        pointerEvents: "none",
        zIndex: 999999,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "flex-start",
      }}
      animate={{
        scale: isPointer ? 1.2 : 1,
        opacity: isIdle ? 0 : 1,
      }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <svg
        width="30"
        height="30"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          filter: "drop-shadow(1px 2px 2px rgba(0,0,0,0.25))",
          transform: "translate(-1px, -1px)", // Exact tip alignment
        }}
      >
        <path
          d="M1 1V23.1L6.8 17.4L11.4 28L15.6 26.2L11 15.6L18.6 15.6L1 1Z"
          fill="#0073bc"
          stroke="white"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
      </svg>
    </motion.div>
  );
};
