import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import { format } from "date-fns";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ArrowRight,
  X,
  FileText,
  Loader2,
} from "lucide-react";
import {
  fetchAffairsRange,
  fetchAffairsForDate,
  fetchAffairById,
  type AffairListItem,
} from "@/lib/affairsApi";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";

// Earliest date we know the upstream feed covers.
const MIN_DATE = new Date("2020-03-01T00:00:00");

export const Route = createFileRoute("/current-affairs")({
  head: () => ({
    meta: [
      { title: "Current Affairs — AdhyayX" },
      {
        name: "description",
        content:
          "Date-wise current affairs daily digests for JEE, NEET, UPSC and other competitive exams.",
      },
      { property: "og:title", content: "Current Affairs — AdhyayX" },
      {
        property: "og:description",
        content: "Pick a date and read that day's current affairs digest.",
      },
    ],
  }),
  component: CurrentAffairsPage,
});

function parseDate(s: string): Date | null {
  if (!s) return null;
  const d = new Date(s + "T00:00:00");
  return Number.isNaN(d.getTime()) ? null : d;
}

function CurrentAffairsPage() {
  const router = useRouter();
  const [pages, setPages] = useState(3);
  const [pickedDate, setPickedDate] = useState<Date | undefined>(undefined);
  const [openId, setOpenId] = useState<number | null>(null);

  // Default browse: paginated list, newest first.
  const browseQuery = useQuery({
    queryKey: ["affairs", "range", pages],
    queryFn: () => fetchAffairsRange(1, pages),
    enabled: !pickedDate,
    placeholderData: (prev) => prev,
  });

  // Date-picked mode: jump directly to the date in the upstream feed.
  const dateKey = pickedDate ? format(pickedDate, "yyyy-MM-dd") : null;
  const dateQuery = useQuery({
    queryKey: ["affairs", "date", dateKey],
    queryFn: () => fetchAffairsForDate(pickedDate!),
    enabled: !!pickedDate,
  });

  const isLoading = pickedDate ? dateQuery.isLoading : browseQuery.isLoading;
  const list = pickedDate ? dateQuery.data ?? [] : browseQuery.data ?? [];

  const loadMore = useCallback(() => {
    if (!browseQuery.isFetching && !pickedDate) {
      setPages((p) => p + 3);
    }
  }, [browseQuery.isFetching, pickedDate]);

  const sentinelRef = useInfiniteScroll(loadMore, {
    enabled: !pickedDate && !browseQuery.isLoading && pages < 60,
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden border-b-2 border-ink/10 bg-foreground text-background">
        <div className="absolute inset-0 grid-bg opacity-15" />
        <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-primary/40 blur-3xl" />
        <div className="relative mx-auto max-w-5xl px-5 py-6 sm:px-6 sm:py-10">
          <button
            type="button"
            onClick={() => router.history.back()}
            className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-background/70 hover:text-background"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Back
          </button>
          <h1 className="mt-3 font-display text-xl font-bold leading-tight sm:text-3xl">
            Current Affairs
          </h1>
          <p className="mt-1 max-w-xl text-xs text-background/75 sm:text-sm">
            Date-wise daily digests, curated for competitive exams.
          </p>
        </div>
      </section>

      {/* Date picker */}
      <section className="sticky top-14 z-20 border-b-2 border-ink/10 bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-2 px-5 py-3 sm:px-6">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "h-9 justify-start gap-2 rounded-full border-2 border-ink/15 px-3 text-xs font-bold",
                  !pickedDate && "text-muted-foreground",
                )}
              >
                <CalendarIcon className="h-3.5 w-3.5 text-primary" />
                {pickedDate ? format(pickedDate, "d MMM yyyy") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={pickedDate}
                onSelect={(d) => {
                  setPickedDate(d ?? undefined);
                  setOpenId(null);
                }}
                defaultMonth={pickedDate ?? new Date()}
                disabled={(d) => d > new Date() || d < MIN_DATE}
                startMonth={MIN_DATE}
                endMonth={new Date()}
                captionLayout="dropdown"
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
          {pickedDate && (
            <button
              onClick={() => setPickedDate(undefined)}
              className="inline-flex h-9 items-center gap-1 rounded-full border-2 border-ink/10 bg-card px-3 text-[11px] font-bold text-foreground hover:border-foreground"
            >
              <X className="h-3 w-3" /> Clear
            </button>
          )}
          <div className="ml-auto text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            {list.length} {list.length === 1 ? "digest" : "digests"}
          </div>
        </div>
      </section>

      {/* List */}
      <section className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />
            ))}
            {pickedDate && (
              <div className="flex items-center justify-center gap-2 pt-4 text-xs text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Jumping to {format(pickedDate, "d MMM yyyy")}…
              </div>
            )}
          </div>
        ) : list.length === 0 ? (
          <EmptyState
            title={pickedDate ? "No digest for this date" : "No digests available"}
            body={
              pickedDate
                ? "The upstream feed didn't publish a digest on this exact date. Try a nearby date."
                : "Check back soon."
            }
          />
        ) : (
          <ul className="divide-y-2 divide-ink/5 overflow-hidden rounded-2xl border-2 border-ink/10 bg-card">
            {list.map((a) => (
              <li key={a.id}>
                <AffairRow
                  item={a}
                  open={openId === a.id}
                  onToggle={() => setOpenId(openId === a.id ? null : a.id)}
                />
              </li>
            ))}
          </ul>
        )}

        {/* Infinite scroll sentinel */}
        {!pickedDate && !browseQuery.isLoading && (
          <div
            ref={sentinelRef}
            className="mt-6 flex justify-center py-4 text-xs text-muted-foreground"
          >
            {browseQuery.isFetching && pages > 3 ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading older digests…
              </span>
            ) : pages >= 60 ? (
              <span>You've reached the end of the archive.</span>
            ) : (
              <span className="opacity-0">.</span>
            )}
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}

function AffairRow({
  item,
  open,
  onToggle,
}: {
  item: AffairListItem;
  open: boolean;
  onToggle: () => void;
}) {
  const dt = parseDate(item.date);
  const day = dt ? dt.getDate() : "—";
  const mo = dt ? dt.toLocaleString("en-US", { month: "short" }) : "";
  const yr = dt ? dt.getFullYear() : "";

  return (
    <div className={cn("transition-colors", open && "bg-muted/40")}>
      <button
        type="button"
        onClick={onToggle}
        className="group flex w-full items-center gap-3 px-3 py-3 text-left sm:px-4"
      >
        <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl border-2 border-ink/10 bg-background">
          <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
            {mo}
          </span>
          <span className="font-display text-lg font-bold leading-none tabular-nums text-primary">
            {day}
          </span>
          <span className="mt-0.5 text-[9px] font-semibold text-muted-foreground tabular-nums">
            {yr}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-primary">
            Daily Digest
          </div>
          <div className="line-clamp-2 text-xs font-bold leading-snug text-foreground group-hover:text-primary sm:text-sm">
            {item.title}
          </div>
        </div>
        <span
          className={cn(
            "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-all",
            open
              ? "border-foreground bg-foreground text-background"
              : "border-ink/15 text-foreground",
          )}
        >
          <ArrowRight className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-90")} />
        </span>
      </button>
      {open && <AffairBody id={item.id} />}
    </div>
  );
}

function AffairBody({ id }: { id: number }) {
  const { data, isLoading } = useQuery({
    queryKey: ["affair", id],
    queryFn: () => fetchAffairById(id),
  });

  return (
    <div className="px-3 pb-4 sm:px-4">
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-3.5 w-full animate-pulse rounded bg-muted" />
          ))}
        </div>
      ) : (data?.blocks?.length ?? 0) === 0 ? (
        <p className="text-xs text-muted-foreground">No content available.</p>
      ) : (
        <div className="space-y-2.5">
          {(data?.blocks ?? []).map((b, i) => (
            <div
              key={i}
              className="rounded-xl border-2 border-ink/10 bg-gradient-to-br from-background to-primary/5 p-3.5 text-[13px] leading-relaxed text-foreground
                [&_a]:font-semibold [&_a]:text-primary [&_a]:underline [&_a]:decoration-primary/40 hover:[&_a]:decoration-primary
                [&_b]:font-bold [&_b]:text-foreground
                [&_strong]:font-bold [&_strong]:text-primary
                [&_em]:not-italic [&_em]:rounded [&_em]:bg-amber-100 [&_em]:px-1 [&_em]:py-0.5 [&_em]:text-amber-900 [&_em]:font-semibold
                [&_mark]:rounded [&_mark]:bg-amber-200 [&_mark]:px-1 [&_mark]:text-amber-950
                [&_h1]:mt-2 [&_h1]:mb-1.5 [&_h1]:font-display [&_h1]:text-base [&_h1]:font-bold [&_h1]:text-primary
                [&_h2]:mt-2 [&_h2]:mb-1.5 [&_h2]:font-display [&_h2]:text-[15px] [&_h2]:font-bold [&_h2]:text-primary
                [&_h3]:mt-2 [&_h3]:mb-1 [&_h3]:font-display [&_h3]:text-sm [&_h3]:font-bold [&_h3]:text-foreground
                [&_h4]:mt-2 [&_h4]:mb-1 [&_h4]:font-bold [&_h4]:text-sm [&_h4]:text-foreground
                [&_p]:my-1.5
                [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1
                [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1
                [&_li]:text-[13px] [&_li]:marker:text-primary
                [&_blockquote]:my-2 [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:bg-primary/5 [&_blockquote]:px-3 [&_blockquote]:py-1.5 [&_blockquote]:text-foreground
                [&_table]:my-2 [&_table]:w-full [&_table]:border-collapse [&_table]:text-[12px]
                [&_th]:border [&_th]:border-ink/15 [&_th]:bg-primary/10 [&_th]:px-2 [&_th]:py-1 [&_th]:text-left [&_th]:font-bold [&_th]:text-primary
                [&_td]:border [&_td]:border-ink/15 [&_td]:px-2 [&_td]:py-1
                [&_img]:my-2 [&_img]:rounded-lg [&_img]:border [&_img]:border-ink/10"
              dangerouslySetInnerHTML={{ __html: b }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-ink/15 bg-card p-8 text-center">
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <FileText className="h-4 w-4" />
      </span>
      <div className="mt-2 font-display text-sm font-bold">{title}</div>
      <p className="mt-1 text-[11px] text-muted-foreground">{body}</p>
    </div>
  );
}
