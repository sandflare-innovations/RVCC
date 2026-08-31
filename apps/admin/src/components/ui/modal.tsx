"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect } from "react";
import { createPortal } from "react-dom";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl";
  unmount?: boolean;
}

const MAX_WIDTHS = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "3xl": "max-w-3xl",
  "4xl": "max-w-4xl",
};

export function Modal({
  open,
  onClose,
  title,
  description,
  footer,
  children,
  maxWidth = "lg",
  unmount = true,
}: ModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  const content = (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-md"
            onClick={onClose}
            aria-hidden="true"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.3, type: "spring", bounce: 0.25, opacity: { duration: 0.2 } }}
            className={`relative z-10 w-full ${MAX_WIDTHS[maxWidth]} flex flex-col overflow-hidden rounded-2xl border border-white/20 bg-white/95 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] ring-1 ring-zinc-200/50 backdrop-blur-xl`}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? "modal-title" : undefined}
          >
            {title && (
              <div className="flex items-center justify-between border-b border-zinc-100/80 bg-white/50 px-6 py-5">
                <div className="flex flex-col">
                  <h2
                    id="modal-title"
                    className="text-xl font-semibold tracking-tight text-zinc-900"
                  >
                    {title}
                  </h2>
                  {description && (
                    <p className="mt-1.5 text-sm font-medium text-zinc-500">{description}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full p-2 text-zinc-400 transition-all hover:bg-zinc-100 hover:text-zinc-900 focus-visible:ring-2 focus-visible:outline-none"
                  aria-label="Close modal"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            )}

            <div className="max-h-[calc(100vh-10rem)] flex-1 scrollbar-thin scrollbar-thumb-zinc-200 overflow-y-auto px-6 py-6">
              {!title && (
                <button
                  type="button"
                  onClick={onClose}
                  className="absolute top-4 right-4 z-20 rounded-full p-2 text-zinc-400 transition-all hover:bg-zinc-100 hover:text-zinc-900 focus-visible:ring-2 focus-visible:outline-none"
                  aria-label="Close modal"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
              {children}
            </div>

            {footer && (
              <div className="flex items-center justify-end gap-3 border-t border-zinc-100/80 bg-zinc-50/80 px-6 py-4 backdrop-blur-md">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  if (!open && unmount) return null;
  if (typeof document === "undefined") return null;
  return createPortal(content, document.body);
}
