import React from "react";
import Link from "next/link";

import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  href?: string;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "link";
  size?: "sm" | "md" | "lg";
  target?: string;
  rel?: string;
}

export function Button({
  href,
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";

  const variantStyles = {
    primary: "bg-brand-blue text-white hover:bg-brand-blue/90 shadow-sm",
    secondary: "bg-zinc-900 text-white hover:bg-zinc-800 shadow-sm",
    outline: "border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50",
    ghost: "text-zinc-700 hover:bg-zinc-100",
    link: "text-brand-blue underline-offset-4 hover:underline p-0 h-auto",
  };

  const sizeStyles = {
    sm: "h-9 px-3 text-xs rounded-md",
    md: "h-11 px-5 text-sm rounded-lg",
    lg: "h-14 px-8 text-base rounded-lg",
  };

  const combinedClasses = cn(
    baseStyles,
    variantStyles[variant] || variantStyles.primary,
    sizeStyles[size] || sizeStyles.md,
    className
  );

  if (href) {
    return (
      <Link href={href} className={combinedClasses} target={props.target} rel={props.rel}>
        {children}
      </Link>
    );
  }

  return (
    <button className={combinedClasses} {...props}>
      {children}
    </button>
  );
}
