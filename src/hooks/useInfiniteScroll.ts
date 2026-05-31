import { useEffect, useRef } from "react";

/**
 * Trigger a callback when the sentinel element scrolls into view.
 * Used to power infinite-scroll lists without a "load more" button.
 */
export function useInfiniteScroll(
  onIntersect: () => void,
  options?: { enabled?: boolean; rootMargin?: string },
) {
  const ref = useRef<HTMLDivElement | null>(null);
  const enabled = options?.enabled ?? true;
  const rootMargin = options?.rootMargin ?? "400px";

  useEffect(() => {
    if (!enabled) return;
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) onIntersect();
        }
      },
      { rootMargin },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [enabled, onIntersect, rootMargin]);

  return ref;
}
