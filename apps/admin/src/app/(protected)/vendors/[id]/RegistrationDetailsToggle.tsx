"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

export function RegistrationDetailsToggle({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="space-y-6 border-t border-zinc-100 pt-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-tight text-zinc-950">Registration Details</h2>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-brand-blue ring-brand-blue/20 hover:bg-brand-blue/5 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold shadow-sm ring-1 transition-colors ring-inset"
        >
          {isOpen ? (
            <>
              Hide Details <ChevronUp className="h-4 w-4" />
            </>
          ) : (
            <>
              View Details <ChevronDown className="h-4 w-4" />
            </>
          )}
        </button>
      </div>

      {isOpen && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-500">{children}</div>
      )}
    </div>
  );
}
