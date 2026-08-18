"use client";

import { cn } from "@lib/utils";

/**
 * Action row for a step footer.
 *
 * `flex-col-reverse` on mobile puts the primary action (last in DOM, so it
 * keeps a natural tab order) at the top of the stack where the thumb lands.
 */
export function EnquireActions({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col-reverse gap-3 border-t border-zinc-200 pt-6 sm:flex-row sm:flex-wrap sm:items-center",
        className
      )}
    >
      {children}
    </div>
  );
}
