import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Calendar, Newspaper } from "lucide-react";
import { fetchAffairs, fetchNews, type AffairListItem, type NewsItem } from "@/lib/affairsApi";

function timeAgo(iso: string): string {
  const t = new Date((iso ?? "").replace(" ", "T")).getTime();
  if (!t) return "";
  const diff = (Date.now() - t) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function shortDate(iso: string): string {
  const d = new Date((iso ?? "").replace(" ", "T"));
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export function AffairsNewsPreview() {
  const affairs = useQuery({ queryKey: ["affairs", 1], queryFn: () => fetchAffairs(1) });
  const news = useQuery({ queryKey: ["news", 1], queryFn: () => fetchNews(1) });

  const topAffairs: AffairListItem[] = (affairs.data ?? []).slice(0, 4);
  const topNews: NewsItem[] = (news.data ?? []).slice(0, 4);

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {/* Current Affairs */}
      <div className="flex flex-col overflow-hidden rounded-2xl border-2 border-ink/10 bg-card shadow-soft transition-all hover:border-foreground">
        <div className="flex items-center justify-between border-b-2 border-ink/10 bg-foreground px-3.5 py-2.5 text-background">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-background">
              <Calendar className="h-3.5 w-3.5" />
            </span>
            <div>
              <div className="text-[9px] font-bold uppercase tracking-[0.18em] text-background/70">
                Today
              </div>
              <h3 className="font-display text-[13px] font-bold leading-tight">
                Current Affairs
              </h3>
            </div>
          </div>
          <Link
            to="/current-affairs"
            className="inline-flex items-center gap-1 rounded-full bg-background/10 px-2.5 py-1 text-[10px] font-bold text-background ring-1 ring-background/20 transition-colors hover:bg-background/20"
          >
            View all <ArrowRight className="h-2.5 w-2.5" />
          </Link>
        </div>
        <div className="flex-1 divide-y divide-ink/5 p-1.5">
          {affairs.isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-lg bg-muted/60 m-1" />
            ))
          ) : topAffairs.length === 0 ? (
            <div className="p-5 text-center text-xs text-muted-foreground">
              Couldn't load affairs right now.
            </div>
          ) : (
            topAffairs.map((a) => (
              <Link
                key={a.id}
                to="/current-affairs"
                className="group flex items-center gap-2.5 rounded-lg p-2 transition-colors hover:bg-muted/50"
              >
                <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg border-2 border-ink/10 bg-background">
                  <span className="font-display text-sm font-bold leading-none tabular-nums">
                    {new Date(a.date + "T00:00:00").getDate()}
                  </span>
                  <span className="mt-0.5 text-[8px] font-bold uppercase tracking-wider text-muted-foreground">
                    {new Date(a.date + "T00:00:00").toLocaleString("en-US", { month: "short" })}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[9px] font-bold uppercase tracking-wider text-primary">
                    Digest
                  </div>
                  <div className="line-clamp-2 text-[12px] font-semibold leading-snug text-foreground group-hover:text-primary">
                    {a.title}
                  </div>
                </div>
                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
              </Link>
            ))
          )}
        </div>
      </div>

      {/* Daily News */}
      <div className="flex flex-col overflow-hidden rounded-2xl border-2 border-ink/10 bg-card shadow-soft transition-all hover:border-foreground">
        <div className="flex items-center justify-between border-b-2 border-ink/10 bg-foreground px-3.5 py-2.5 text-background">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-background">
              <Newspaper className="h-3.5 w-3.5" />
            </span>
            <div>
              <div className="text-[9px] font-bold uppercase tracking-[0.18em] text-background/70">
                Latest
              </div>
              <h3 className="font-display text-[13px] font-bold leading-tight">
                Daily News
              </h3>
            </div>
          </div>
          <Link
            to="/daily-news"
            className="inline-flex items-center gap-1 rounded-full bg-background/10 px-2.5 py-1 text-[10px] font-bold text-background ring-1 ring-background/20 transition-colors hover:bg-background/20"
          >
            View all <ArrowRight className="h-2.5 w-2.5" />
          </Link>
        </div>
        <div className="flex-1 divide-y divide-ink/5 p-1.5">
          {news.isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-14 animate-pulse rounded-lg bg-muted/60 m-1" />
            ))
          ) : topNews.length === 0 ? (
            <div className="p-5 text-center text-xs text-muted-foreground">
              Couldn't load news right now.
            </div>
          ) : (
            topNews.map((n) => (
              <Link
                key={n.id}
                to="/daily-news"
                className="group flex items-start gap-2.5 rounded-lg p-2 transition-colors hover:bg-muted/50"
              >
                {n.image ? (
                  <img
                    src={n.image}
                    alt=""
                    loading="lazy"
                    className="h-11 w-11 shrink-0 rounded-lg border border-ink/10 object-cover"
                  />
                ) : (
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-ink/10 bg-muted">
                    <Newspaper className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="mb-0.5 flex flex-wrap items-center gap-x-1.5 text-[9px] font-bold uppercase tracking-wider">
                    <span className="text-primary">{shortDate(n.createdAt)}</span>
                    <span className="text-muted-foreground">· {timeAgo(n.createdAt)}</span>
                  </div>
                  <div className="line-clamp-2 text-[12px] font-semibold leading-snug text-foreground group-hover:text-primary">
                    {n.title}
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
