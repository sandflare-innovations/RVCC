"use client"

import { cn } from "@/lib/utils"
import React from "react"

export interface LoaderProps {
  variant?:
    | "circular"
    | "classic"
    | "pulse"
    | "pulse-dot"
    | "dots"
    | "typing"
    | "wave"
    | "bars"
    | "terminal"
    | "text-blink"
    | "text-shimmer"
    | "loading-dots"
    | "logo-pulse"
  size?: "sm" | "md" | "lg"
  text?: string
  className?: string
}

export function LogoPulseLoader({
  className,
  size = "md",
}: {
  className?: string
  size?: "sm" | "md" | "lg"
}) {
  const containerSizes = {
    sm: "h-12 w-12",
    md: "h-16 w-16",
    lg: "h-24 w-24",
  }

  const textSizes = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-4xl",
  }

  return (
    <div className={cn("relative flex items-center justify-center", containerSizes[size], className)}>
      <div className="absolute inset-0 animate-[pulse-dot_2s_ease-in-out_infinite] rounded-lg bg-brand-blue/20" />
      <div className="absolute inset-2 animate-[pulse-dot_2s_ease-in-out_infinite_0.5s] rounded-lg bg-brand-blue/40" />
      <div className="relative flex h-full w-full items-center justify-center rounded-lg bg-brand-blue shadow-lg">
        <span className={cn("font-bold text-white tracking-tighter", textSizes[size])}>R</span>
      </div>
    </div>
  )
}

export function CircularLoader({
  className,
  size = "md",
}: {
  className?: string
  size?: "sm" | "md" | "lg"
}) {
  const sizeClasses = {
    sm: "size-4",
    md: "size-5",
    lg: "size-6",
  }

  return (
    <div
      className={cn(
        "border-brand-blue animate-spin rounded-full border-2 border-t-transparent",
        sizeClasses[size],
        className
      )}
    >
      <span className="sr-only">Loading</span>
    </div>
  )
}

export function ClassicLoader({
  className,
  size = "md",
}: {
  className?: string
  size?: "sm" | "md" | "lg"
}) {
  const sizeClasses = {
    sm: "size-4",
    md: "size-5",
    lg: "size-6",
  }

  const barSizes = {
    sm: { height: "6px", width: "1.5px" },
    md: { height: "8px", width: "2px" },
    lg: { height: "10px", width: "2.5px" },
  }

  return (
    <div className={cn("relative", sizeClasses[size], className)}>
      <div className="absolute h-full w-full">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="bg-brand-blue absolute animate-[spinner-fade_1.2s_linear_infinite] rounded-full"
            style={{
              top: "0",
              left: "50%",
              marginLeft:
                size === "sm" ? "-0.75px" : size === "lg" ? "-1.25px" : "-1px",
              transformOrigin: `${size === "sm" ? "0.75px" : size === "lg" ? "1.25px" : "1px"} ${size === "sm" ? "10px" : size === "lg" ? "14px" : "12px"}`,
              transform: `rotate(${i * 30}deg)`,
              opacity: 0,
              animationDelay: `${i * 0.1}s`,
              height: barSizes[size].height,
              width: barSizes[size].width,
            }}
          />
        ))}
      </div>
      <span className="sr-only">Loading</span>
    </div>
  )
}

export function PulseLoader({
  className,
  size = "md",
}: {
  className?: string
  size?: "sm" | "md" | "lg"
}) {
  const sizeClasses = {
    sm: "size-4",
    md: "size-5",
    lg: "size-6",
  }

  return (
    <div className={cn("relative", sizeClasses[size], className)}>
      <div className="border-brand-blue absolute inset-0 animate-[thin-pulse_1.5s_ease-in-out_infinite] rounded-full border-2" />
      <span className="sr-only">Loading</span>
    </div>
  )
}

export function PulseDotLoader({
  className,
  size = "md",
}: {
  className?: string
  size?: "sm" | "md" | "lg"
}) {
  const sizeClasses = {
    sm: "size-1",
    md: "size-2",
    lg: "size-3",
  }

  return (
    <div
      className={cn(
        "bg-brand-blue animate-[pulse-dot_1.2s_ease-in-out_infinite] rounded-full",
        sizeClasses[size],
        className
      )}
    >
      <span className="sr-only">Loading</span>
    </div>
  )
}

export function DotsLoader({
  className,
  size = "md",
}: {
  className?: string
  size?: "sm" | "md" | "lg"
}) {
  const dotSizes = {
    sm: "h-1.5 w-1.5",
    md: "h-2 w-2",
    lg: "h-2.5 w-2.5",
  }

  const containerSizes = {
    sm: "h-4",
    md: "h-5",
    lg: "h-6",
  }

  return (
    <div
      className={cn(
        "flex items-center space-x-1",
        containerSizes[size],
        className
      )}
    >
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className={cn(
            "bg-brand-blue animate-[bounce-dots_1.4s_ease-in-out_infinite] rounded-full",
            dotSizes[size]
          )}
          style={{
            animationDelay: `${i * 160}ms`,
          }}
        />
      ))}
      <span className="sr-only">Loading</span>
    </div>
  )
}

export function TypingLoader({
  className,
  size = "md",
}: {
  className?: string
  size?: "sm" | "md" | "lg"
}) {
  const dotSizes = {
    sm: "h-1 w-1",
    md: "h-1.5 w-1.5",
    lg: "h-2 w-2",
  }

  const containerSizes = {
    sm: "h-4",
    md: "h-5",
    lg: "h-6",
  }

  return (
    <div
      className={cn(
        "flex items-center space-x-1",
        containerSizes[size],
        className
      )}
    >
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className={cn(
            "bg-brand-blue animate-[typing_1s_infinite] rounded-full",
            dotSizes[size]
          )}
          style={{
            animationDelay: `${i * 250}ms`,
          }}
        />
      ))}
      <span className="sr-only">Loading</span>
    </div>
  )
}

export function WaveLoader({
  className,
  size = "md",
}: {
  className?: string
  size?: "sm" | "md" | "lg"
}) {
  const barWidths = {
    sm: "w-0.5",
    md: "w-0.5",
    lg: "w-1",
  }

  const containerSizes = {
    sm: "h-4",
    md: "h-5",
    lg: "h-6",
  }

  const heights = {
    sm: ["6px", "9px", "12px", "9px", "6px"],
    md: ["8px", "12px", "16px", "12px", "8px"],
    lg: ["10px", "15px", "20px", "15px", "10px"],
  }

  return (
    <div
      className={cn(
        "flex items-center gap-0.5",
        containerSizes[size],
        className
      )}
    >
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className={cn(
            "bg-brand-blue animate-[wave_1s_ease-in-out_infinite] rounded-full",
            barWidths[size]
          )}
          style={{
            animationDelay: `${i * 100}ms`,
            height: heights[size][i],
          }}
        />
      ))}
      <span className="sr-only">Loading</span>
    </div>
  )
}

export function BarsLoader({
  className,
  size = "md",
}: {
  className?: string
  size?: "sm" | "md" | "lg"
}) {
  const barWidths = {
    sm: "w-1",
    md: "w-1.5",
    lg: "w-2",
  }

  const containerSizes = {
    sm: "h-4 gap-1",
    md: "h-5 gap-1.5",
    lg: "h-6 gap-2",
  }

  return (
    <div className={cn("flex", containerSizes[size], className)}>
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className={cn(
            "bg-brand-blue h-full animate-[wave-bars_1.2s_ease-in-out_infinite]",
            barWidths[size]
          )}
          style={{
            animationDelay: `${i * 0.2}s`,
          }}
        />
      ))}
      <span className="sr-only">Loading</span>
    </div>
  )
}

export function TerminalLoader({
  className,
  size = "md",
}: {
  className?: string
  size?: "sm" | "md" | "lg"
}) {
  const cursorSizes = {
    sm: "h-3 w-1.5",
    md: "h-4 w-2",
    lg: "h-5 w-2.5",
  }

  const textSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  }

  const containerSizes = {
    sm: "h-4",
    md: "h-5",
    lg: "h-6",
  }

  return (
    <div
      className={cn(
        "flex items-center space-x-1",
        containerSizes[size],
        className
      )}
    >
      <span className={cn("text-brand-blue font-mono", textSizes[size])}>
        {">"}
      </span>
      <div
        className={cn(
          "bg-brand-blue animate-[blink_1s_step-end_infinite]",
          cursorSizes[size]
        )}
      />
      <span className="sr-only">Loading</span>
    </div>
  )
}

export function TextBlinkLoader({
  text = "Thinking",
  className,
  size = "md",
}: {
  text?: string
  className?: string
  size?: "sm" | "md" | "lg"
}) {
  const textSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  }

  return (
    <div
      className={cn(
        "animate-[text-blink_2s_ease-in-out_infinite] font-medium",
        textSizes[size],
        className
      )}
    >
      {text}
    </div>
  )
}

export function TextShimmerLoader({
  text = "Thinking",
  className,
  size = "md",
}: {
  text?: string
  className?: string
  size?: "sm" | "md" | "lg"
}) {
  const textSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  }

  return (
    <div
      className={cn(
        "bg-[linear-gradient(to_right,var(--zinc-400)_40%,var(--zinc-900)_60%,var(--zinc-400)_80%)]",
        "bg-size-[200%_auto] bg-clip-text font-medium text-transparent",
        "animate-[shimmer_4s_infinite_linear]",
        textSizes[size],
        className
      )}
    >
      {text}
    </div>
  )
}

export function TextDotsLoader({
  className,
  text = "Thinking",
  size = "md",
}: {
  className?: string
  text?: string
  size?: "sm" | "md" | "lg"
}) {
  const textSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  }

  return (
    <div
      className={cn("inline-flex items-center", className)}
    >
      <span className={cn("text-brand-blue font-medium", textSizes[size])}>
        {text}
      </span>
      <span className="inline-flex">
        <span className="text-brand-blue animate-[loading-dots_1.4s_infinite_0.2s]">
          .
        </span>
        <span className="text-brand-blue animate-[loading-dots_1.4s_infinite_0.4s]">
          .
        </span>
        <span className="text-brand-blue animate-[loading-dots_1.4s_infinite_0.6s]">
          .
        </span>
      </span>
    </div>
  )
}

export function Loader({
  variant = "logo-pulse",
  size = "md",
  text,
  className,
}: LoaderProps) {
  switch (variant) {
    case "logo-pulse":
      return (
        <div className={cn("flex flex-col items-center justify-center gap-4 p-8", className)}>
          <LogoPulseLoader size={size} />
          {text && <span className="text-sm font-medium tracking-widest text-zinc-500 uppercase">{text}</span>}
        </div>
      );
    case "circular":
      return <CircularLoader size={size} className={className} />
    case "classic":
      return <ClassicLoader size={size} className={className} />
    case "pulse":
      return <PulseLoader size={size} className={className} />
    case "pulse-dot":
      return <PulseDotLoader size={size} className={className} />
    case "dots":
      return <DotsLoader size={size} className={className} />
    case "typing":
      return <TypingLoader size={size} className={className} />
    case "wave":
      return <WaveLoader size={size} className={className} />
    case "bars":
      return <BarsLoader size={size} className={className} />
    case "terminal":
      return <TerminalLoader size={size} className={className} />
    case "text-blink":
      return <TextBlinkLoader text={text} size={size} className={className} />
    case "text-shimmer":
      return <TextShimmerLoader text={text} size={size} className={className} />
    case "loading-dots":
      return <TextDotsLoader text={text} size={size} className={className} />
    default:
      return <CircularLoader size={size} className={className} />
  }
}

// Preserve existing component names so imports don't break
export function PageLoader({ text = "Loading..." }: { text?: string }) {
  return <Loader variant="logo-pulse" size="md" text={text} className="min-h-[400px]" />;
}

export function SubmitLoader({ text = "Processing" }: { text?: string }) {
  return <Loader variant="typing" size="sm" text={text} />;
}

export function FullScreenLoader() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
      <PageLoader />
    </div>
  );
}
