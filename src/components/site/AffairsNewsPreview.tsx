import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Calendar, Newspaper } from "lucide-react";
import { fetchAffairs, fetchNews, type AffairListItem, type NewsItem } from "@/lib/affairsApi";

function formatDate(iso: string): string {
  try {
    return new Date(iso + "T00:00:00").toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function timeAgo(iso: string): string {
  const t = new Date((iso ?? "").replace(" ", "T")).getTime();
  if (!t) return "";
  const diff = (Date.now() - t) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function AffairsNewsPreview() {
  const affairs = useQuery({ queryKey: ["affairs", 1], queryFn: () => fetchAffairs(1) });
  const news = useQuery({ queryKey: ["news", 1], queryFn: () => fetchNews(1) });

  const topAffairs: AffairListItem[] = (affairs.data ?? []).slice(0, 4);
  const topNews: NewsItem[] = (news.data ?? []).slice(0, 4);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Current Affairs */}
      <div className="flex flex-col overflow-hidden rounded-3xl border-2 border-ink/10 bg-card shadow-soft transition-all hover:border-foreground">
        <div className="flex items-center justify-between border-b-2 border-ink/10 bg-foreground px-5 py-4 text-background">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-background">
              <Calendar className="h-4 w-4" />
            </span>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-background/70">
                Today
              </div>
              <h3 className="font-display text-base font-bold leading-tight">
                Current Affairs
              </h3>
            </div>
          </div>
          <Link
            to="/current-affairs"
            className="inline-flex items-center gap-1 rounded-full bg-background/10 px-3 py-1.5 text-[11px] font-bold text-background ring-1 ring-background/20 transition-colors hover:bg-background/20"
          >
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="flex-1 divide-y divide-ink/5 p-2">
          {affairs.isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-14 animate-pulse rounded-xl bg-muted/60 m-1" />
            ))
          ) : topAffairs.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              Couldn't load affairs right now.
            </div>
          ) : (
            topAffairs.map((a) => (
              <Link
                key={a.id}
                to="/current-affairs"
                className="group flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-muted/50"
              >
                <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl border-2 border-ink/10 bg-background">
                  <span className="font-display text-base font-bold leading-none tabular-nums">
                    {new Date(a.date + "T00:00:00").getDate()}
                  </span>
                  <span className="mt-0.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                    {new Date(a.date + "T00:00:00").toLocaleString("en-US", { month: "short" })}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-primary">
                    Digest
                  </div>
                  <div className="line-clamp-2 text-sm font-semibold leading-snug text-foreground group-hover:text-primary">
                    {a.title}
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
              </Link>
            ))
          )}
        </div>
      </div>

      {/* Daily News */}
      <div className="flex flex-col overflow-hidden rounded-3xl border-2 border-ink/10 bg-card shadow-soft transition-all hover:border-foreground">
        <div className="flex items-center justify-between border-b-2 border-ink/10 bg-foreground px-5 py-4 text-background">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-background">
              <Newspaper className="h-4 w-4" />
            </span>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-background/70">
                Latest
              </div>
              <h3 className="font-display text-base font-bold leading-tight">
                Daily News
              </h3>
            </div>
          </div>
          <Link
            to="/daily-news"
            className="inline-flex items-center gap-1 rounded-full bg-background/10 px-3 py-1.5 text-[11px] font-bold text-background ring-1 ring-background/20 transition-colors hover:bg-background/20"
          >
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="flex-1 divide-y divide-ink/5 p-2">
          {news.isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-muted/60 m-1" />
            ))
          ) : topNews.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              Couldn't load news right now.
            </div>
          ) : (
            topNews.map((n) => (
              <Link
                key={n.id}
                to="/daily-news"
                className="group flex items-start gap-3 rounded-xl p-3 transition-colors hover:bg-muted/50"
              >
                {n.image ? (
                  <img
                    src={n.image}
                    alt=""
                    loading="lazy"
                    className="h-14 w-14 shrink-0 rounded-xl border border-ink/10 object-cover"
                  />
                ) : (
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-ink/10 bg-muted">
                    <Newspaper className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="line-clamp-2 text-sm font-semibold leading-snug text-foreground group-hover:text-primary">
                    {n.title}
                  </div>
                  <div className="mt-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {timeAgo(n.createdAt)}
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
