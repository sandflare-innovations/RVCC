"use client";

import { useEffect, useRef } from "react";

import { LuX as X } from "react-icons/lu";

import { cn } from "@/lib/utils";

/**
 * Built on the native <dialog> element so focus trapping, Escape-to-close,
 * inert background content, and the top-layer backdrop come from the platform
 * rather than being re-implemented (and usually got subtly wrong) in React.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "md" | "lg";
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  // Escape and backdrop dismissal both surface as `cancel`/`close`.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handleClose = () => onClose();
    el.addEventListener("close", handleClose);
    return () => el.removeEventListener("close", handleClose);
  }, [onClose]);

  return (
    <dialog
      ref={ref}
      aria-labelledby="modal-title"
      onClick={(e) => {
        // Clicks land on the dialog itself only when they hit the backdrop.
        if (e.target === ref.current) ref.current?.close();
      }}
      className={cn(
        "w-[calc(100vw-2rem)] rounded-lg border border-zinc-200 bg-white p-0 text-zinc-950 shadow-xl backdrop:bg-black/50",
        "m-auto max-h-[85vh] open:flex open:flex-col",
        size === "lg" ? "max-w-3xl" : "max-w-lg"
      )}
    >
      <header className="flex shrink-0 items-start justify-between gap-4 border-b border-zinc-200 px-5 py-4">
        <div>
          <h2 id="modal-title" className="text-base font-semibold text-zinc-950">
            {title}
          </h2>
          {description && <p className="mt-0.5 text-sm text-zinc-600">{description}</p>}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="-mt-1 -mr-1 rounded-md p-1.5 text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-950"
        >
          <X className="h-4 w-4" />
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>

      {footer && (
        <footer className="flex shrink-0 flex-wrap justify-end gap-3 border-t border-zinc-200 bg-zinc-50 px-5 py-4">
          {footer}
        </footer>
      )}
    </dialog>
  );
}
