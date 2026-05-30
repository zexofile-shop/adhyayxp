import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { format } from "date-fns";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Calendar as CalendarIcon, ChevronLeft, ArrowRight, X, FileText } from "lucide-react";
import {
  fetchAffairs,
  fetchAffairById,
  type AffairListItem,
} from "@/lib/affairsApi";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
  const [pages, setPages] = useState(3);
  const affairs = useQuery({
    queryKey: ["affairs", pages],
    queryFn: () => fetchAffairs(pages),
  });

  const [pickedDate, setPickedDate] = useState<Date | undefined>(undefined);
  const [openId, setOpenId] = useState<number | null>(null);

  const all = affairs.data ?? [];
  const list = useMemo(() => {
    if (!pickedDate) return all;
    const key = format(pickedDate, "yyyy-MM-dd");
    return all.filter((a) => a.date === key);
  }, [all, pickedDate]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero — compact */}
      <section className="relative overflow-hidden border-b-2 border-ink/10 bg-foreground text-background">
        <div className="absolute inset-0 grid-bg opacity-15" />
        <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-primary/40 blur-3xl" />
        <div className="relative mx-auto max-w-5xl px-5 py-6 sm:px-6 sm:py-10">
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-background/70 hover:text-background"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Home
          </Link>
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
                onSelect={(d) => setPickedDate(d ?? undefined)}
                disabled={(d) => d > new Date()}
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
        {affairs.isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : list.length === 0 ? (
          <EmptyState
            title={pickedDate ? "No digest for this date" : "No digests available"}
            body={pickedDate ? "Try a different date — not every day has a digest published." : "Check back soon."}
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

        {!pickedDate && !affairs.isLoading && list.length > 0 && (
          <div className="mt-6 flex justify-center">
            <button
              onClick={() => setPages((p) => p + 3)}
              className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-5 py-2.5 text-xs font-bold text-background shadow-soft transition-transform hover:scale-[1.03]"
            >
              Load older digests <ArrowRight className="h-3.5 w-3.5" />
            </button>
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
