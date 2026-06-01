// Light client for Current Affairs + Daily News.
// We proxy testegy.com through our own /api/public/* routes to bypass CORS
// and to hide the upstream origin from the browser network tab.

const BASE = "/api/public";

export type AffairListItem = {
  id: number;
  title: string;
  createdAt: string;
  date: string;
};

export type NewsItem = {
  id: number;
  title: string;
  summary: string;
  createdAt: string;
  image: string | null;
};

export type AffairDetail = {
  id: number;
  title: string;
  date: string;
  blocks: string[];
};

async function getJSON(url: string): Promise<any> {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Request failed: ${r.status}`);
  return r.json();
}

function absImg(p: string | null | undefined): string | null {
  if (!p) return null;
  if (p.startsWith("http")) return p;
  return `https://testegy.com${p}`;
}

/** Upstream page size for /currentAffairs (observed: 10 items/page). */
export const AFFAIRS_PER_PAGE = 10;

function parseAffairRow(row: any[]): AffairListItem {
  return { id: row[0], title: row[1], createdAt: row[2], date: row[3] };
}

function dedupe<T extends { id: number }>(items: T[]): T[] {
  const seen = new Set<number>();
  return items.filter((a) => (seen.has(a.id) ? false : (seen.add(a.id), true)));
}

/** Fetch a contiguous range of pages [startPage..endPage] in parallel. */
export async function fetchAffairsRange(
  startPage: number,
  endPage: number,
): Promise<AffairListItem[]> {
  const reqs: Promise<any>[] = [];
  for (let p = startPage; p <= endPage; p++) {
    reqs.push(getJSON(`${BASE}/affairs?page=${p}`).catch(() => null));
  }
  const all = await Promise.all(reqs);
  const out: AffairListItem[] = [];
  for (const r of all) {
    const rows: any[] = r?.result?.data?.data ?? [];
    for (const row of rows) out.push(parseAffairRow(row));
  }
  return dedupe(out);
}

/** Backwards-compatible: fetch first N pages. */
export async function fetchAffairs(pages = 3): Promise<AffairListItem[]> {
  return fetchAffairsRange(1, pages);
}

/**
 * Estimate which page contains a given date. Upstream is sorted
 * newest-first with ~1 entry per day (with some skips). days_diff/10
 * gives a good initial guess; callers should fetch a window around it.
 */
export function estimatePageForDate(date: Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  const daysDiff = Math.max(
    0,
    Math.floor((today.getTime() - target.getTime()) / 86_400_000),
  );
  return Math.max(1, Math.floor(daysDiff / AFFAIRS_PER_PAGE) + 1);
}

/**
 * Find affairs for an exact date. Walks pages outward from the estimated
 * page until either the date is matched, or scanned items have moved past
 * the target date on both sides.
 */
export async function fetchAffairsForDate(
  date: Date,
): Promise<AffairListItem[]> {
  const pad = (n: number) => String(n).padStart(2, "0");
  const key = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

  const center = estimatePageForDate(date);

  // Try expanding windows: ±3, ±8, ±15, ±25 pages — covers dates back to 2020.
  for (const radius of [3, 8, 15, 25]) {
    const start = Math.max(1, center - radius);
    const end = center + radius;
    const items = await fetchAffairsRange(start, end);
    const match = items.filter((a) => a.date === key);
    if (match.length > 0) return match;
    if (items.length > 0) {
      const dates = items.map((x) => x.date).filter(Boolean);
      const minDate = dates.reduce((m, x) => (x < m ? x : m), dates[0]);
      const maxDate = dates.reduce((m, x) => (x > m ? x : m), dates[0]);
      // If the target is inside the scanned window, upstream simply skipped this day.
      if (key >= minDate && key <= maxDate) return [];
    }
  }
  return [];
}

export async function fetchAffairById(id: number): Promise<AffairDetail> {
  const r = await getJSON(`${BASE}/affair/${id}`);
  const d = r?.result?.data ?? {};
  let blocks: string[] = [];
  try {
    const c = d.content;
    if (typeof c === "string") {
      const parsed = JSON.parse(c);
      if (Array.isArray(parsed)) blocks = parsed;
      else blocks = [String(parsed)];
    } else if (Array.isArray(c)) {
      blocks = c;
    }
  } catch {
    blocks = [String(d.content ?? "")];
  }
  return {
    id,
    title: d.title ?? "",
    date: d.date_created ?? "",
    blocks,
  };
}

export async function fetchNewsRange(
  startPage: number,
  endPage: number,
): Promise<NewsItem[]> {
  const reqs: Promise<any>[] = [];
  for (let p = startPage; p <= endPage; p++) {
    reqs.push(getJSON(`${BASE}/news?page=${p}`).catch(() => null));
  }
  const all = await Promise.all(reqs);
  const out: NewsItem[] = [];
  for (const r of all) {
    const rows: any[] = r?.result?.data?.data ?? [];
    for (const row of rows) {
      out.push({
        id: row[0],
        title: row[1],
        summary: row[2],
        createdAt: row[3],
        image: absImg(row[4]),
      });
    }
  }
  return dedupe(out);
}

export async function fetchNews(pages = 2): Promise<NewsItem[]> {
  return fetchNewsRange(1, pages);
}

export function newsDate(iso: string): string {
  return iso?.slice(0, 10) ?? "";
}
