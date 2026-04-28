"use client";

import React from "react";

import { motion } from "framer-motion";

import { cn } from "@lib/utils";

interface ButtonProps {
  children: React.ReactNode;
  className?: string;
  href?: string;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "outline" | "white" | "brand-outline" | "none";
  type?: "button" | "submit" | "reset";
  // Custom Color Props
  borderColor?: string;
  textColor?: string;
  bgColor?: string;
  hoverFillColor?: string;
  hoverTextColor?: string;
}

export const Button = ({
  children,
  className,
  href,
  onClick,
  variant = "none",
  type = "button",
  borderColor,
  textColor,
  bgColor,
  hoverFillColor,
  hoverTextColor,
}: ButtonProps) => {
  const isLink = !!href;
  const Tag = isLink ? motion.a : motion.button;

  // Defaults based on variant if custom props are not provided
  const variantStyles = {
    primary: {
      border: "border-brand-blue",
      text: "text-white",
      bg: "bg-brand-blue",
      fill: "bg-white",
      hoverText: "group-hover:text-brand-blue",
    },
    secondary: {
      border: "border-white",
      text: "text-brand-blue",
      bg: "bg-white",
      fill: "bg-brand-blue",
      hoverText: "group-hover:text-background",
    },
    outline: {
      border: "border-white",
      text: "text-white",
      bg: "bg-transparent",
      fill: "bg-white",
      hoverText: "group-hover:text-brand-blue",
    },
    white: {
      border: "border-white",
      text: "text-brand-blue",
      bg: "bg-white",
      fill: "bg-brand-blue",
      hoverText: "group-hover:text-background",
    },
    "brand-outline": {
      border: "border-brand-blue",
      text: "text-brand-blue",
      bg: "bg-transparent",
      fill: "bg-brand-blue",
      hoverText: "group-hover:text-background",
    },
    none: {
      border: "",
      text: "",
      bg: "",
      fill: "",
      hoverText: "",
    },
  };

  const currentStyles = variantStyles[variant];

  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <Tag
      href={href}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      type={!isLink ? type : undefined}
      className={cn(
        "group relative inline-flex h-14 min-w-[200px] items-center justify-center overflow-hidden border-2 px-8 py-4 text-[10px] font-black tracking-[0.3em] uppercase transition-all duration-500",
        borderColor || currentStyles.border,
        textColor || currentStyles.text,
        bgColor || currentStyles.bg,
        className
      )}
    >
      {/* Label */}
      <span
        className={cn(
          "relative z-10 flex items-center gap-3 transition-colors duration-500",
          isHovered ? hoverTextColor || currentStyles.hoverText : ""
        )}
      >
        {children}
      </span>

      {/* Animation Fill - Key reset ensures entry from bottom and exit from bottom to top */}
      <motion.div
        key={isHovered ? "hover" : "exit"}
        className={cn("absolute inset-0 z-0", hoverFillColor || currentStyles.fill)}
        initial={{ clipPath: isHovered ? "inset(100% 0 0 0)" : "inset(0% 0 0% 0)" }}
        animate={{ clipPath: isHovered ? "inset(0% 0 0% 0)" : "inset(0% 0 100% 0)" }}
        transition={{
          duration: 0.6,
          ease: [0.19, 1, 0.22, 1],
        }}
      />
    </Tag>
  );
};
