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
    <div className={cn("group relative pt-2", className)}>
      {children}
      <label className="peer-focus:text-brand-blue pointer-events-none absolute top-5 left-3 z-10 origin-[0] -translate-y-6 scale-75 transform rounded-sm bg-white px-1 text-sm font-medium text-zinc-500 transition-all duration-200 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:left-3 peer-focus:-translate-y-6 peer-focus:scale-75 peer-data-[empty=true]:translate-y-0 peer-data-[empty=true]:scale-100">
        {label}
        {required ? (
          <span aria-hidden="true" className="text-brand-blue ml-1">
            *
          </span>
        ) : null}
      </label>
      {hint ? (
        <p className="mt-1.5 text-sm leading-relaxed text-zinc-500 sm:text-base">{hint}</p>
      ) : null}
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
  "peer w-full rounded-xl border border-zinc-200 bg-transparent px-4 py-3 min-h-[52px] text-base text-zinc-900 tabular-nums outline-none transition-[color,border-color,box-shadow,background-color] placeholder-transparent focus-visible:placeholder-transparent hover:bg-zinc-50 focus-visible:border-brand-blue focus-visible:ring-1 focus-visible:ring-brand-blue focus-visible:bg-transparent disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-400 aria-invalid:border-red-500 aria-invalid:ring-1 aria-invalid:ring-red-500 sm:text-[15px]";

export const enquireInputClass = controlBase;

/*
 * Native appearance is kept on purpose: the previous `appearance-none` removed
 * the chevron without drawing a replacement, so selects were indistinguishable
 * from text inputs.
 */
export const enquireSelectClass = cn(controlBase, "cursor-pointer pr-2");

export const enquireTextareaClass = cn(controlBase, "min-h-[110px] resize-y leading-relaxed");
