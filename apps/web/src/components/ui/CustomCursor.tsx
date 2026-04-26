"use client";

import { useEffect, useState } from "react";
import { motion, useSpring, useMotionValue } from "framer-motion";
import { cn } from "@lib/utils";

export const CustomCursor = () => {
  const [cursorType, setCursorType] = useState<"default" | "image" | "link">("default");
  
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 250 };
  const cursorX = useSpring(mouseX, springConfig);
  const cursorY = useSpring(mouseY, springConfig);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);

      const target = e.target as HTMLElement;
      
      // Check if hovering over an image or a container with an image
      const isImage = target.tagName === "IMG" || target.closest(".cursor-image-trigger");
      const isLink = target.tagName === "A" || target.tagName === "BUTTON" || target.closest("a") || target.closest("button");

      if (isImage) {
        setCursorType("image");
      } else if (isLink) {
        setCursorType("link");
      } else {
        setCursorType("default");
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999] hidden md:block">
      {/* Outer Flash Circle */}
      <motion.div
        className={cn(
          "flex items-center justify-center rounded-full border-white mix-blend-difference",
          cursorType === "image" ? "h-24 w-24 bg-white" : "h-6 w-6 border-[1px] bg-transparent"
        )}
        style={{
          x: cursorX,
          y: cursorY,
          translateX: "-50%",
          translateY: "-50%",
        }}
        animate={{
          scale: cursorType === "image" ? 1 : 1,
          opacity: 1,
        }}
        transition={{ type: "spring", damping: 30, stiffness: 200 }}
      >
        {/* VIEW Text for Image Hover (Inside the circle) */}
        <motion.span
          className="text-[10px] font-bold tracking-widest text-black uppercase"
          animate={{
            opacity: cursorType === "image" ? 1 : 0,
            scale: cursorType === "image" ? 1 : 0,
          }}
        >
          View
        </motion.span>
      </motion.div>
      
      {/* Small Dot for Default State */}
      {cursorType !== "image" && (
        <motion.div
          className="h-1.5 w-1.5 bg-white rounded-full mix-blend-difference"
          style={{
            x: cursorX,
            y: cursorY,
            translateX: "-50%",
            translateY: "-50%",
          }}
        />
      )}
    </div>
  );
};
