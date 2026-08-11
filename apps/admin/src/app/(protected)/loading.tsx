export default function ProtectedLoading() {
  return (
    <div className="animate-pulse space-y-4" aria-hidden="true">
      <div className="h-8 w-48 rounded bg-zinc-200" />
      <div className="h-4 w-72 rounded bg-zinc-100" />
      <div className="mt-6 space-y-2">
        <div className="h-12 rounded-lg bg-zinc-100" />
        <div className="h-12 rounded-lg bg-zinc-100" />
        <div className="h-12 rounded-lg bg-zinc-100" />
        <div className="h-12 rounded-lg bg-zinc-100" />
      </div>
    </div>
  );
}
