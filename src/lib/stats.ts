import { useEffect, useState } from "react";
import { onValue, ref, set } from "firebase/database";
import { getFirebase } from "./firebase";

/**
 * Subscribe to a numeric value at /stats/{key}. Returns fallback until
 * Firebase resolves. Updates in realtime via onValue.
 */
export function useLiveStat(key: string, fallback = 0): number {
  const [val, setVal] = useState<number>(fallback);

  useEffect(() => {
    const fb = getFirebase();
    if (!fb) return;
    const r = ref(fb.db, `stats/${key}`);
    const unsub = onValue(r, (snap) => {
      const v = snap.val();
      if (typeof v === "number") setVal(v);
    });
    return () => unsub();
  }, [key]);

  return val;
}

/** Fire-and-forget write — failures are silent (rules may be write:false). */
export async function publishStat(key: string, value: number): Promise<void> {
  const fb = getFirebase();
  if (!fb) return;
  try {
    await set(ref(fb.db, `stats/${key}`), value);
  } catch {
    /* ignore — DB is read-only by design */
  }
}

/** Read/write a per-book real page count, cached in localStorage + RTDB. */
export function useLiveBookPages(bookId: string, fallback?: number): number | undefined {
  const [val, setVal] = useState<number | undefined>(() => {
    if (typeof window === "undefined") return fallback;
    const cached = window.localStorage.getItem(`bp:${bookId}`);
    if (cached) {
      const n = parseInt(cached, 10);
      if (!isNaN(n) && n > 0) return n;
    }
    return fallback;
  });

  useEffect(() => {
    const fb = getFirebase();
    if (!fb) return;
    const r = ref(fb.db, `bookPages/${bookId}`);
    const unsub = onValue(r, (snap) => {
      const v = snap.val();
      if (typeof v === "number" && v > 0) {
        setVal(v);
        try {
          window.localStorage.setItem(`bp:${bookId}`, String(v));
        } catch {}
      }
    });
    return () => unsub();
  }, [bookId]);

  return val;
}

export async function publishBookPages(bookId: string, pages: number): Promise<void> {
  if (!pages || pages <= 0) return;
  try {
    window.localStorage.setItem(`bp:${bookId}`, String(pages));
  } catch {}
  const fb = getFirebase();
  if (!fb) return;
  try {
    await set(ref(fb.db, `bookPages/${bookId}`), pages);
  } catch {
    /* read-only DB — fine */
  }
}
