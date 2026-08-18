import Link from "next/link";

export function KpiCard({ label, value, href }: { label: string; value: number; href?: string }) {
  const body = (
    <>
      <p className="text-xs font-semibold tracking-[0.12em] text-zinc-600 uppercase">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-zinc-950 tabular-nums">{value}</p>
    </>
  );

  const shell = "rounded-lg border border-zinc-200 bg-white p-5";

  if (!href) return <div className={shell}>{body}</div>;

  return (
    <Link
      href={href}
      className={`${shell} hover:border-brand-blue focus-visible:ring-brand-blue block transition-colors focus-visible:ring-2 focus-visible:outline-none`}
    >
      {body}
    </Link>
  );
}
