import { Link } from "@tanstack/react-router";
import { Clock, FileText, ArrowRight } from "lucide-react";
import type { Test } from "@/lib/testApi";

export function TestCard({ test, index }: { test: Test; index: number }) {
  return (
    <Link
      to="/test/$testId"
      params={{ testId: test.id }}
      className="group relative flex flex-col rounded-2xl border-2 border-ink/10 bg-card p-5 transition-all hover:border-primary hover:-translate-y-1 hover:shadow-elevated"
      style={{ animation: `fade-up 0.5s ${index * 30}ms both` }}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-primary">
          {test.stream ?? "Test"}
        </span>
        <span className="text-[11px] font-semibold text-muted-foreground">
          {test.category ?? "Mock"}
        </span>
      </div>
      <h3 className="mt-4 line-clamp-2 font-display text-base font-bold leading-snug text-foreground">
        {test.name}
      </h3>
      <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground">
        {test.description?.trim() || "Curated mock test with instant attempt review."}
      </p>
      <div className="mt-5 flex items-center justify-between border-t-2 border-dashed border-ink/10 pt-4">
        <div className="flex items-center gap-3 text-xs font-semibold text-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-primary" />
            {test.duration_minutes}m
          </span>
          <span className="inline-flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5 text-primary" />
            {test.total_questions} Qs
          </span>
        </div>
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-foreground text-background transition-transform group-hover:translate-x-1">
          <ArrowRight className="h-4 w-4" />
        </span>
      </div>
    </Link>
  );
}