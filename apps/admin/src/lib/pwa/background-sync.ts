/**
 * Background Sync Queue.
 * Stores failed POST/PUT/DELETE requests in IndexedDB and replays them
 * when the service worker fires a `sync` event.
 */

const DB_NAME = "rvcc-sync";
const DB_VERSION = 1;
const STORE_NAME = "queue";
const SYNC_TAG = "rvcc-sync-queue";

interface QueuedRequest {
  id?: number;
  url: string;
  method: string;
  headers: Record<string, string>;
  body: string | null;
  timestamp: number;
}

/** Open the IndexedDB database */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Queue a failed request for later replay.
 * Call this when a mutating fetch fails due to network issues.
 */
export async function queueForSync(
  url: string,
  method: string,
  headers: Record<string, string>,
  body: string | null
): Promise<void> {
  if (typeof window === "undefined") return;

  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);

    const entry: QueuedRequest = {
      url,
      method,
      headers,
      body,
      timestamp: Date.now(),
    };

    store.add(entry);

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });

    // Request a background sync if the API is available
    if ("serviceWorker" in navigator && "SyncManager" in window) {
      const registration = await navigator.serviceWorker.ready;
      // @ts-expect-error — SyncManager types may not be fully available
      await registration.sync.register(SYNC_TAG);
    }

    db.close();
  } catch (error) {
    console.error("[PWA] Failed to queue request for sync:", error);
  }
}

/**
 * Get the count of pending items in the sync queue.
 * Useful for showing a badge or indicator in the UI.
 */
export async function getSyncQueueCount(): Promise<number> {
  if (typeof window === "undefined") return 0;

  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);

    return new Promise<number>((resolve, reject) => {
      const countReq = store.count();
      countReq.onsuccess = () => {
        db.close();
        resolve(countReq.result);
      };
      countReq.onerror = () => {
        db.close();
        reject(countReq.error);
      };
    });
  } catch {
    return 0;
  }
}

/**
 * Clear the entire sync queue.
 * Useful after a successful manual replay or for cleanup.
 */
export async function clearSyncQueue(): Promise<void> {
  if (typeof window === "undefined") return;

  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).clear();
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch (error) {
    console.error("[PWA] Failed to clear sync queue:", error);
  }
}

/**
 * Manually replay all queued requests (client-side fallback).
 * Use when Background Sync API is not supported.
 * Returns the count of successfully replayed requests.
 */
export async function replayQueueManually(): Promise<number> {
  if (typeof window === "undefined") return 0;

  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);

    const allEntries = await new Promise<QueuedRequest[]>((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });

    let replayed = 0;

    for (const entry of allEntries) {
      try {
        const response = await fetch(entry.url, {
          method: entry.method,
          headers: entry.headers,
          body: entry.body,
        });

        if (response.ok) {
          store.delete(entry.id!);
          replayed++;
        }
      } catch {
        // Still offline — stop replaying
        break;
      }
    }

    db.close();
    return replayed;
  } catch {
    return 0;
  }
}
