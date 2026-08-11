export default function ProtectedLoading() {
  return (
    <div className="animate-pulse space-y-4 py-4" aria-hidden="true">
      <div className="h-8 w-56 rounded bg-zinc-200" />
      <div className="h-24 rounded-lg border border-zinc-100 bg-zinc-50" />
      <div className="h-24 rounded-lg border border-zinc-100 bg-zinc-50" />
    </div>
  );
}
