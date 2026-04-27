"use client";

import React from "react";

import { motion } from "framer-motion";

import { cn } from "@lib/utils";

interface ButtonProps {
  children: React.ReactNode;
  className?: string;
  href?: string;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "outline" | "white" | "brand-outline";
  type?: "button" | "submit" | "reset";
}

export const Button = ({
  children,
  className,
  href,
  onClick,
  variant = "primary",
  type = "button",
}: ButtonProps) => {
  const isLink = !!href;
  const Tag = isLink ? motion.a : motion.button;

  const variants = {
    primary: "bg-brand-blue text-white border-brand-blue",
    secondary: "bg-white text-brand-blue border-white shadow-xl",
    outline: "bg-transparent text-white border-white",
    white: "bg-white text-brand-blue border-white",
    "brand-outline": "bg-transparent text-brand-blue border-brand-blue",
  };

  const fillColors = {
    primary: "bg-white",
    secondary: "bg-brand-blue",
    outline: "bg-brand-blue", // Changed to brand-blue for better visibility on both dark/light backgrounds
    white: "bg-brand-blue",
    "brand-outline": "bg-brand-blue",
  };

  const hoverTextColors = {
    primary: "group-hover:text-brand-blue",
    secondary: "group-hover:text-white",
    outline: "group-hover:text-white", // White text on blue fill
    white: "group-hover:text-white",
    "brand-outline": "group-hover:text-white",
  };

  return (
    <Tag
      href={href}
      onClick={onClick}
      type={!isLink ? type : undefined}
      className={cn(
        "group relative inline-flex h-14 min-w-[200px] items-center justify-center overflow-hidden border-2 px-8 py-4 text-[10px] font-black tracking-[0.3em] uppercase transition-all duration-500",
        variants[variant],
        className
      )}
      whileHover="hover"
      initial="initial"
    >
      {/* Label */}
      <span
        className={cn(
          "relative z-10 flex items-center gap-3 transition-colors duration-500",
          hoverTextColors[variant]
        )}
      >
        {children}
      </span>

      {/* Animation Fill */}
      <motion.div
        className={cn("absolute inset-0 z-0", fillColors[variant])}
        variants={{
          initial: { y: "100%" },
          hover: { y: 0 },
        }}
        transition={{
          duration: 0.4,
          ease: [0.19, 1, 0.22, 1],
        }}
      />
    </Tag>
  );
};
