"use client";

import { ArrowRight } from "lucide-react";
import React from "react";

import { cn } from "@/lib/utils";

import { SubmitLoader } from "./loader";

type Variant = "solid" | "outline";

interface InteractiveHoverButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Label text. `children` wins when both are supplied. */
  text?: string;
  variant?: Variant;
  /** Shows a spinner, blocks clicks, and announces busy state. */
  pending?: boolean;
  /** Stretch to the container width — used for stacked mobile actions. */
  fullWidth?: boolean;
}

/**
 * Base sits in the resting colour; a dot expands on hover to flood the button
 * with the fill colour, swapping the label for label + arrow.
 *
 * `hover:` compiles to `@media (hover: hover)`, so touch devices keep the
 * resting state instead of latching the hover style after a tap.
 */
const VARIANTS: Record<Variant, { base: string; dot: string; reveal: string }> = {
  solid: {
    base: "border-brand-blue bg-brand-blue text-white",
    dot: "bg-white",
    reveal: "text-brand-blue",
  },
  outline: {
    base: "border-brand-blue bg-transparent text-brand-blue",
    dot: "bg-brand-blue",
    reveal: "text-white",
  },
};

const InteractiveHoverButton = React.forwardRef<HTMLButtonElement, InteractiveHoverButtonProps>(
  (
    {
      text = "Button",
      variant = "solid",
      pending = false,
      fullWidth = false,
      disabled,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const label = children ?? text;
    const styles = VARIANTS[variant];
    const isBlocked = disabled || pending;

    return (
      <button
        ref={ref}
        disabled={isBlocked}
        aria-busy={pending || undefined}
        className={cn(
          "group relative h-14 cursor-pointer overflow-hidden rounded-md border-2 px-8",
          "text-sm font-bold tracking-[0.1em] uppercase sm:text-base",
          // Snappy press feedback — the old 500ms transition read as lag.
          "transition-[transform,opacity,background-color] duration-200 ease-out",
          "active:scale-[0.98]",
          // Keyboard focus must stay visible once the fill floods the button.
          "focus-visible:ring-brand-blue focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
          // pointer-events-none stops the hover fill from firing on a dead
          // button, which otherwise reads as "this is clickable".
          "disabled:pointer-events-none disabled:opacity-55 disabled:active:scale-100",
          styles.base,
          // Callers pair `fullWidth` with `sm:w-auto`; the min-width keeps the
          // desktop row even instead of collapsing "Back" to its label.
          fullWidth ? "w-full sm:min-w-[190px]" : "w-auto min-w-[190px]",
          className
        )}
        {...props}
      >
        {pending ? (
          <span className="relative z-20 flex items-center justify-center">
            <SubmitLoader text={label as string} />
          </span>
        ) : (
          <>
            {/* Resting label — slides out and fades on hover. */}
            <span
              className={cn(
                "relative z-20 inline-block transition-all duration-300 ease-out",
                "group-hover:translate-x-10 group-hover:opacity-0",
                "motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
              )}
            >
              {label}
            </span>

            {/* Hover label — aria-hidden so the text is not announced twice. */}
            <span
              aria-hidden="true"
              className={cn(
                "absolute inset-0 z-20 flex -translate-x-10 items-center justify-center gap-2.5 opacity-0",
                "transition-all duration-300 ease-out",
                "group-hover:translate-x-0 group-hover:opacity-100",
                "motion-reduce:transition-none",
                styles.reveal
              )}
            >
              {label}
              <ArrowRight className="h-4 w-4" />
            </span>

            {/*
              Expanding dot → full-bleed fill. It rests inside the px-8 gutter
              rather than the original left-[20%], which landed on top of the
              centred label and read as a smudge rather than an accent.
            */}
            <span
              aria-hidden="true"
              className={cn(
                "absolute top-1/2 left-3 z-10 h-2 w-2 -translate-y-1/2 rounded-full",
                "transition-all duration-300 ease-out",
                "group-hover:top-0 group-hover:left-0 group-hover:h-full group-hover:w-full",
                "group-hover:translate-y-0 group-hover:scale-150 group-hover:rounded-none",
                "motion-reduce:transition-none",
                styles.dot
              )}
            />
          </>
        )}
      </button>
    );
  }
);

InteractiveHoverButton.displayName = "InteractiveHoverButton";

export { InteractiveHoverButton };
