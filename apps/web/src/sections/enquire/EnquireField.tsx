"use client";

import { cn } from "@lib/utils";

type FieldProps = {
  label: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
};

export function EnquireField({ label, required, className, children }: FieldProps) {
  return (
    <div className={cn("group space-y-2", className)}>
      <label className="group-focus-within:text-brand-blue text-[10px] font-black tracking-[0.2em] text-zinc-400 uppercase transition-colors">
        {label}
        {required ? <span className="text-brand-blue ml-1">*</span> : null}
      </label>
      {children}
    </div>
  );
}

export const enquireInputClass =
  "focus:border-brand-blue w-full border-b border-zinc-200 bg-transparent py-3 text-sm text-zinc-950 outline-none placeholder:text-zinc-300";

export const enquireSelectClass =
  "focus:border-brand-blue w-full appearance-none border-b border-zinc-200 bg-transparent py-3 text-sm text-zinc-950 outline-none";

export const enquireTextareaClass =
  "focus:border-brand-blue min-h-[100px] w-full resize-y border-b border-zinc-200 bg-transparent py-3 text-sm text-zinc-950 outline-none placeholder:text-zinc-300";
