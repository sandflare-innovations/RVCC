"use client";

import { cn } from "@lib/utils";

type FieldProps = {
  label: string;
  required?: boolean;
  className?: string;
  /** Short helper shown under the control. */
  hint?: string;
  children: React.ReactNode;
};

export function EnquireField({ label, required, className, hint, children }: FieldProps) {
  return (
    <div className={cn("group space-y-2", className)}>
      {/*
        Was text-[10px] + zinc-400 (~2.6:1 on white) — under the 4.5:1 AA floor
        and hard to read at that size. zinc-600 clears 7:1 at 12px.
      */}
      <label className="group-focus-within:text-brand-blue flex items-center gap-1 text-xs font-bold tracking-[0.14em] text-zinc-600 uppercase transition-colors">
        {label}
        {required ? (
          <>
            <span aria-hidden="true" className="text-brand-blue">
              *
            </span>
            <span className="sr-only">(required)</span>
          </>
        ) : null}
      </label>
      {children}
      {hint ? <p className="text-xs leading-relaxed text-zinc-500">{hint}</p> : null}
    </div>
  );
}

/*
 * Boxed control treatment adapted from the supplied form reference. Its
 * `border-input` / `ring-ring` / `bg-background` tokens are shadcn-only and are
 * not defined in this Tailwind v4 @theme, so they are mapped to brand-blue.
 *
 * 16px base is deliberate: iOS Safari auto-zooms the viewport on focus for any
 * input under 16px, which was making the form jump on every tap. py-2.5 at that
 * size clears the 44px minimum touch target.
 *
 * tabular-nums keeps IBANs, CR/VAT numbers and postal codes aligned.
 */
const controlBase =
  "w-full rounded-md border border-zinc-300 bg-white px-3.5 py-2.5 text-base text-zinc-950 tabular-nums shadow-xs outline-none transition-[color,border-color,box-shadow] placeholder:text-zinc-500 hover:border-zinc-400 focus-visible:border-brand-blue focus-visible:ring-[3px] focus-visible:ring-brand-blue/25 disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-500 aria-invalid:border-red-500 aria-invalid:ring-[3px] aria-invalid:ring-red-500/20";

export const enquireInputClass = controlBase;

/*
 * Native appearance is kept on purpose: the previous `appearance-none` removed
 * the chevron without drawing a replacement, so selects were indistinguishable
 * from text inputs.
 */
export const enquireSelectClass = cn(controlBase, "cursor-pointer pr-2");

export const enquireTextareaClass = cn(controlBase, "min-h-[110px] resize-y leading-relaxed");
