// Light client for Current Affairs + Daily News.
// We proxy testegy.com through our own /api/public/* routes to bypass CORS.

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

export async function fetchAffairs(pages = 3): Promise<AffairListItem[]> {
  const reqs = Array.from({ length: pages }, (_, i) =>
    getJSON(`${BASE}/affairs?page=${i + 1}`).catch(() => null),
  );
  const all = await Promise.all(reqs);
  const out: AffairListItem[] = [];
  for (const r of all) {
    const rows: any[] = r?.result?.data?.data ?? [];
    for (const row of rows) {
      out.push({
        id: row[0],
        title: row[1],
        createdAt: row[2],
        date: row[3],
      });
    }
  }
  const seen = new Set<number>();
  return out.filter((a) => (seen.has(a.id) ? false : (seen.add(a.id), true)));
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

export async function fetchNews(pages = 2): Promise<NewsItem[]> {
  const reqs = Array.from({ length: pages }, (_, i) =>
    getJSON(`${BASE}/news?page=${i + 1}`).catch(() => null),
  );
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
  const seen = new Set<number>();
  return out.filter((a) => (seen.has(a.id) ? false : (seen.add(a.id), true)));
}

export function newsDate(iso: string): string {
  return iso?.slice(0, 10) ?? "";
}
