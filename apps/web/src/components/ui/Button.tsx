"use client";

import { ReactNode, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@lib/utils";

interface ButtonProps {
  children: ReactNode;
  className?: string;
  href?: string;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "outline";
}

export const Button = ({
  children,
  className,
  href,
  onClick,
  variant = "primary",
}: ButtonProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [direction, setDirection] = useState<"initial" | "enter" | "exit">("initial");
  const MotionComponent = motion[href ? "a" : "button"] as any;

  const baseStyles = "group relative inline-flex h-[54px] min-w-[180px] items-center justify-center overflow-hidden border-[1px] px-8 py-4 uppercase tracking-[0.2em] text-[10px] font-bold transition-all duration-300";

  const variants = {
    primary: "bg-brand-blue text-white border-brand-blue",
    secondary: "bg-white text-black border-white",
    outline: "bg-transparent text-white border-white",
  };

  const fillColors = {
    primary: "bg-white",
    secondary: "bg-brand-blue",
    outline: "bg-white",
  };

  const hoverTextColors = {
    primary: "group-hover:text-brand-blue",
    secondary: "group-hover:text-white",
    outline: "group-hover:text-black",
  };

  return (
    <MotionComponent
      href={href}
      onClick={onClick}
      onMouseEnter={() => {
        setIsHovered(true);
        setDirection("enter");
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        setDirection("exit");
      }}
      className={cn(baseStyles, variants[variant], className)}
    >
      <motion.span
        className={cn("relative z-10 transition-colors duration-300", hoverTextColors[variant])}
        animate={{
          y: isHovered ? -2 : 0,
        }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        {children}
      </motion.span>

      {/* SpaceX-style snappy vertical fill animation */}
      <motion.div
        className={cn("absolute inset-0 z-0", fillColors[variant])}
        initial={{ y: "100%" }}
        animate={{
          y: direction === "enter" ? "0%" : (direction === "exit" ? "-100%" : "100%")
        }}
        transition={{
          duration: direction === "initial" ? 0 : 0.4,
          ease: [0.19, 1, 0.22, 1]
        }}
        onAnimationComplete={() => {
          if (direction === "exit") {
            setDirection("initial");
          }
        }}
      />
    </MotionComponent>
  );
};
