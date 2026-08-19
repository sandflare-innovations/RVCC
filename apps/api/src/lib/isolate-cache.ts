/** Short-lived per-isolate cache — safe for shared read-only aggregates. */
type Entry = { at: number; value: unknown };

const store = new Map<string, Entry>();

export async function getIsolateCache<T>(
  key: string,
  ttlMs: number,
  loader: () => Promise<T>
): Promise<T> {
  const hit = store.get(key);
  if (hit && Date.now() - hit.at < ttlMs) return hit.value as T;
  const value = await loader();
  store.set(key, { at: Date.now(), value });
  return value;
}

export function clearIsolateCache(key?: string) {
  if (key) store.delete(key);
  else store.clear();
}
