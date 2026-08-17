import { cn } from "@lib/utils";

export const HeroClipPath = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 700 60"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("h-[60px] w-full max-w-[700px]", className)}
  >
    <path d="M50 0C120 0 120 60 200 60H500C580 60 580 0 650 0Z" fill="currentColor" />
  </svg>
);
