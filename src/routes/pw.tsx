import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { fetchPwBatches, fetchPwTests, PW_CLASSES, PW_EXAMS } from "@/lib/pwApi";
import { ArrowRight, ChevronLeft, Clock, FileText, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import pwLogo from "@/assets/pw-logo.jpg";


export const Route = createFileRoute("/pw")({
  head: () => ({
    meta: [
      { title: "Physics Wallah Tests — AdhyayX" },
      {
        name: "description",
        content: "Attempt Physics Wallah batch tests for JEE & NEET inside AdhyayX.",
      },
    ],
  }),
  component: PwPage,
  errorComponent: ({ error }) => (
    <div className="p-10 text-center text-sm text-muted-foreground">
      Failed to load: {error.message}
    </div>
  ),
});

function PwPage() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const [exam, setExam] = useState<(typeof PW_EXAMS)[number]>("IIT-JEE");
  const [klass, setKlass] = useState<(typeof PW_CLASSES)[number]>("12");
  const [batch, setBatch] = useState<{ id: string; catId: string; name: string } | null>(null);


  const batches = useQuery({
    queryKey: ["pw", "batches", exam, klass],
    queryFn: () => fetchPwBatches(exam, klass),
  });

  const tests = useQuery({
    queryKey: ["pw", "tests", batch?.id, batch?.catId],
    queryFn: () => fetchPwTests(batch!.id, batch!.catId),
    enabled: !!batch,
  });

  // If a child route (e.g. /pw/test/$testId) is active, render it instead.
  if (pathname !== "/pw" && pathname !== "/pw/") {
    return <Outlet />;
  }


  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="border-b-2 border-ink/10 bg-surface">
        <div className="mx-auto max-w-7xl px-5 py-7 sm:px-6 sm:py-10">
          <Link
            to="/categories"
            className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </Link>
          <div className="mt-3 flex items-center gap-3">
            <div className="inline-flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl border-2 border-ink bg-background sm:h-12 sm:w-12">
              <img src={pwLogo} alt="PW" className="h-full w-full object-cover" />
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
                Physics Wallah
              </div>
              <h1 className="font-display text-xl font-bold tracking-tight sm:text-3xl">
                Batch tests &amp; mock papers
              </h1>
            </div>
          </div>
          <p className="mt-2 max-w-xl text-xs text-muted-foreground sm:text-sm">
            Pick your exam and class to browse all PW batches. Open any test to attempt it right
            here.
          </p>

          {/* Selectors */}
          <div className="mt-5 grid grid-cols-1 gap-3 sm:max-w-md sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                Exam
              </label>
              <Select
                value={exam}
                onValueChange={(v) => {
                  setExam(v as (typeof PW_EXAMS)[number]);
                  setBatch(null);
                }}
              >
                <SelectTrigger className="h-10 rounded-xl border-2 border-ink/10 bg-card font-bold text-foreground">
                  <SelectValue placeholder="Select exam" />
                </SelectTrigger>
                <SelectContent>
                  {PW_EXAMS.map((e) => (
                    <SelectItem key={e} value={e} className="font-semibold">
                      {e}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                Class
              </label>
              <Select
                value={klass}
                onValueChange={(v) => {
                  setKlass(v as (typeof PW_CLASSES)[number]);
                  setBatch(null);
                }}
              >
                <SelectTrigger className="h-10 rounded-xl border-2 border-ink/10 bg-card font-bold text-foreground">
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {PW_CLASSES.map((c) => (
                    <SelectItem key={c} value={c} className="font-semibold">
                      {c === "Dropper" ? "Dropper" : `Class ${c}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        {!batch && (
          <>
            <div className="mb-4 text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
              Batches
            </div>
            {batches.isLoading ? (
              <SkeletonGrid />
            ) : batches.isError ? (
              <ErrorBox message="Couldn't load batches. Try a different combination." />
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
                {(batches.data ?? []).map((b, i) => (
                  <button
                    key={b._id}
                    onClick={() => setBatch({ id: b._id, catId: b.testCatId, name: b.name })}
                    className="group flex flex-col overflow-hidden rounded-2xl border-2 border-ink/10 bg-card text-left transition-all hover:-translate-y-0.5 hover:border-foreground hover:shadow-elevated"
                    style={{ animation: `fade-up 0.35s ${i * 20}ms both` }}
                  >
                    <div className="aspect-[16/10] w-full overflow-hidden bg-muted">
                      {b.previewImage ? (
                        <img
                          src={b.previewImage}
                          alt={b.name}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                          No image
                        </div>
                      )}
                    </div>
                    <div className="flex flex-1 items-center justify-between gap-2 p-3 sm:p-3.5">
                      <div className="line-clamp-2 font-display text-xs font-bold leading-snug text-foreground sm:text-sm">
                        {b.name}
                      </div>
                      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {batch && (
          <>
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <button
                  onClick={() => setBatch(null)}
                  className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground"
                >
                  <ChevronLeft className="h-3.5 w-3.5" /> All batches
                </button>
                <h2 className="mt-1 font-display text-lg font-bold sm:text-2xl">{batch.name}</h2>
              </div>
            </div>

            {tests.isLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading tests…
              </div>
            ) : tests.isError ? (
              <ErrorBox message="Couldn't load tests for this batch." />
            ) : (tests.data ?? []).length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-ink/10 p-8 text-center text-sm text-muted-foreground">
                No tests in this batch yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
                {(tests.data ?? []).map((t, i) => (
                  <Link
                    key={t._id}
                    to="/pw/test/$testId"
                    params={{ testId: t._id }}
                    className="group flex flex-col rounded-2xl border-2 border-ink/10 bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-foreground hover:shadow-elevated sm:p-5"
                    style={{ animation: `fade-up 0.35s ${i * 20}ms both` }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
                        PW Mock
                      </span>
                      <span className="text-[10px] font-semibold text-muted-foreground">
                        {t.totalMarks} marks
                      </span>
                    </div>
                    <h3 className="mt-3 line-clamp-2 font-display text-sm font-bold leading-snug text-foreground sm:text-base">
                      {t.name}
                    </h3>
                    <div className="mt-4 flex items-center justify-between border-t-2 border-dashed border-ink/10 pt-3">
                      <div className="flex items-center gap-3 text-[11px] font-semibold text-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-primary" />
                          {t.maxDuration}m
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <FileText className="h-3.5 w-3.5 text-primary" />
                          {t.totalQuestions} Qs
                        </span>
                      </div>
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-foreground text-background transition-transform group-hover:translate-x-0.5">
                        <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </section>
      <Footer />
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="h-48 animate-pulse rounded-2xl border-2 border-ink/10 bg-muted"
        />
      ))}
    </div>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border-2 border-destructive/30 bg-destructive/5 p-5 text-sm text-destructive">
      {message}
    </div>
  );
}
