import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  correctIndex,
  detectOptionStyle,
  fetchQuestions,
  fetchTests,
  normalizeSubject,
  parseOptions,
  type Question,
  type Test,
} from "@/lib/testApi";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  Clock,
  Flag,
  Grid3x3,
  Home,
  Maximize,
  PlayCircle,
  RefreshCw,
  Trophy,
  X,
  XCircle,
} from "lucide-react";
import logoVx from "@/assets/logo-vx.jpg";

export const Route = createFileRoute("/test/$testId")({
  component: TestRunner,
});

type Phase = "intro" | "active" | "result";
type Answer = number | null;
type Status = "answered" | "review" | "visited" | "unseen";

function enterFullscreen() {
  try {
    const el: any = document.documentElement;
    (el.requestFullscreen || el.webkitRequestFullscreen)?.call(el);
  } catch {}
}
function exitFullscreen() {
  try {
    if (document.fullscreenElement) {
      (document.exitFullscreen || (document as any).webkitExitFullscreen)?.call(document);
    }
  } catch {}
}

function TestRunner() {
  const { testId } = Route.useParams();
  const navigate = useNavigate();

  const testsQuery = useQuery({ queryKey: ["tests"], queryFn: fetchTests });
  const questionsQuery = useQuery({
    queryKey: ["questions", testId],
    queryFn: () => fetchQuestions(testId),
  });

  const test: Test | undefined = useMemo(
    () => testsQuery.data?.find((t) => t.id === testId),
    [testsQuery.data, testId],
  );
  const questions: Question[] = useMemo(() => {
    const raw = questionsQuery.data ?? [];
    const stream = test?.stream ?? "";
    return raw.map((q) => ({ ...q, subject: normalizeSubject(q.subject, stream) }));
  }, [questionsQuery.data, test?.stream]);

  const [phase, setPhase] = useState<Phase>("intro");
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [reviewed, setReviewed] = useState<boolean[]>([]);
  const [visited, setVisited] = useState<boolean[]>([]);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const submittedRef = useRef(false);
  const hydratedRef = useRef(false);

  const storageKey = `vidyax:test:${testId}`;

  // Initialise per-question state once questions arrive — restoring from
  // localStorage if the user had a session for this test in progress.
  useEffect(() => {
    if (phase !== "active" || !questions.length || answers.length) return;
    let restored = false;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const saved = JSON.parse(raw) as {
          answers?: Answer[];
          reviewed?: boolean[];
          visited?: boolean[];
          current?: number;
          secondsLeft?: number;
        };
        if (saved.answers?.length === questions.length) {
          setAnswers(saved.answers);
          setReviewed(saved.reviewed ?? Array(questions.length).fill(false));
          setVisited(saved.visited ?? Array(questions.length).fill(false));
          setCurrent(Math.min(saved.current ?? 0, questions.length - 1));
          if (typeof saved.secondsLeft === "number" && saved.secondsLeft > 0) {
            setSecondsLeft(saved.secondsLeft);
          }
          restored = true;
        }
      }
    } catch {
      /* ignore */
    }
    if (!restored) {
      setAnswers(Array(questions.length).fill(null));
      setReviewed(Array(questions.length).fill(false));
      const v = Array(questions.length).fill(false);
      v[0] = true;
      setVisited(v);
    }
    hydratedRef.current = true;
  }, [phase, questions.length, answers.length, storageKey]);

  // Persist on any change while active
  useEffect(() => {
    if (phase !== "active" || !hydratedRef.current) return;
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({ answers, reviewed, visited, current, secondsLeft }),
      );
    } catch {
      /* ignore quota */
    }
  }, [phase, answers, reviewed, visited, current, secondsLeft, storageKey]);

  // Countdown
  useEffect(() => {
    if (phase !== "active") return;
    if (secondsLeft <= 0) {
      if (!submittedRef.current) {
        submittedRef.current = true;
        exitFullscreen();
        setPhase("result");
      }
      return;
    }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, secondsLeft]);

  // Exit fullscreen when leaving active
  useEffect(() => {
    if (phase !== "active") exitFullscreen();
  }, [phase]);

  if (testsQuery.isLoading || questionsQuery.isLoading) return <FullPageLoader />;

  if (!test) {
    return (
      <CenterMessage
        title="Test not found"
        body="This test no longer exists or has been removed."
        actionLabel="Browse categories"
        actionTo="/categories"
      />
    );
  }

  if (phase === "intro") {
    return (
      <IntroScreen
        test={test}
        questionCount={questions.length}
        onStart={() => {
          setSecondsLeft(test.duration_minutes * 60);
          setPhase("active");
          // small delay so React commits before requesting fullscreen
          setTimeout(enterFullscreen, 50);
        }}
      />
    );
  }

  if (phase === "result") {
    return (
      <ResultScreen
        test={test}
        questions={questions}
        answers={answers}
        onRetake={() => {
          try { localStorage.removeItem(storageKey); } catch { /* ignore */ }
          hydratedRef.current = false;
          setAnswers([]);
          setReviewed([]);
          setVisited([]);
          setCurrent(0);
          submittedRef.current = false;
          setPhase("intro");
        }}
        onHome={() => {
          try { localStorage.removeItem(storageKey); } catch { /* ignore */ }
          navigate({ to: "/categories" });
        }}
      />
    );
  }

  // ===== ACTIVE =====
  const q = questions[current];
  const opts = parseOptions(q.options);
  const optionStyle = detectOptionStyle(opts);
  // When options are pure letters/numbers (image-based questions), the
  // option text *is* just "A"/"B"/... — render only the label, no duplicate.
  const labelOnly = optionStyle !== "text";
  const optionLabel = (i: number) =>
    optionStyle === "letter"
      ? opts[i].toUpperCase()
      : optionStyle === "number"
        ? opts[i]
        : String.fromCharCode(65 + i);

  const setAnswer = (i: number) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[current] = next[current] === i ? null : i; // tap again to clear
      return next;
    });
  };

  const go = (idx: number) => {
    setCurrent(idx);
    setVisited((prev) => {
      if (prev[idx]) return prev;
      const next = [...prev];
      next[idx] = true;
      return next;
    });
    setPaletteOpen(false);
  };

  const toggleReview = () => {
    setReviewed((prev) => {
      const next = [...prev];
      next[current] = !next[current];
      return next;
    });
  };

  const submit = () => {
    exitFullscreen();
    setPhase("result");
  };

  const quit = () => {
    if (!window.confirm("Quit this test? Your progress will be lost.")) return;
    try { localStorage.removeItem(storageKey); } catch { /* ignore */ }
    exitFullscreen();
    hydratedRef.current = false;
    submittedRef.current = false;
    setAnswers([]);
    setReviewed([]);
    setVisited([]);
    setCurrent(0);
    setPhase("intro");
    navigate({ to: "/categories" });
  };

  const statuses: Status[] = answers.map((a, i) => {
    if (reviewed[i]) return "review";
    if (a !== null && a !== undefined) return "answered";
    if (visited[i]) return "visited";
    return "unseen";
  });

  const answeredCount = answers.filter((a) => a !== null && a !== undefined).length;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Top exam bar */}
      <header className="sticky top-0 z-30 border-b-2 border-ink/10 bg-foreground text-background">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-2.5 sm:px-6 sm:py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <Link
              to="/"
              title="Home"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-background/25 bg-background/10 text-background transition-colors hover:bg-background hover:text-foreground"
            >
              <Home className="h-4 w-4" />
            </Link>
            <img src={logoVx} alt="" className="hidden h-9 w-9 shrink-0 rounded-lg ring-2 ring-background/20 sm:block" />
            <div className="min-w-0 leading-tight">
              <div className="truncate text-[10px] font-bold uppercase tracking-[0.18em] text-background/60">
                VidyaX · {test.stream ?? "Test"}
              </div>
              <div className="truncate font-display text-sm font-bold sm:text-base">
                {test.name}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <CountdownPill seconds={secondsLeft} />
            <button
              onClick={quit}
              title="Quit test"
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full border-2 border-destructive/60 bg-destructive/15 px-3 text-xs font-bold text-destructive-foreground transition-colors hover:bg-destructive hover:text-destructive-foreground"
            >
              <X className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Quit</span>
            </button>
            <button
              onClick={submit}
              className="hidden h-9 items-center rounded-full bg-primary px-4 text-xs font-bold text-primary-foreground shadow-soft transition-transform hover:scale-[1.03] active:scale-95 sm:inline-flex"
            >
              Submit
            </button>
          </div>
        </div>
        <div className="h-1.5 w-full bg-background/15">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${((current + 1) / questions.length) * 100}%` }}
          />
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-7xl flex-1 grid-cols-1 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[1fr_320px]">
        {/* Question card */}
        <main className="rounded-3xl border-2 border-ink/10 bg-card p-4 shadow-soft sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-3 py-1.5 text-xs font-bold text-background">
                Q {current + 1}
                <span className="text-background/60">/ {questions.length}</span>
              </span>
              {q.subject && (
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${subjectChipClass(q.subject)}`}>
                  {q.subject}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-[11px] font-bold">
              <span className="rounded-full bg-success/15 px-2.5 py-1 text-success">
                +{q.marks}
              </span>
              <span className="rounded-full bg-destructive/15 px-2.5 py-1 text-destructive">
                -{q.negative_marks}
              </span>
            </div>
          </div>


          {q.question_text ? (
            <h2 className="mt-4 text-[15px] font-semibold leading-relaxed text-foreground sm:text-base">
              {q.question_text}
            </h2>
          ) : q.image ? (
            <>
              <div className="mt-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Read the question from the image below
              </div>
              <img
                src={q.image}
                alt="Question"
                className="mt-3 w-full max-w-xl rounded-xl border-2 border-ink/10 bg-white object-contain p-2"
              />
            </>
          ) : null}

          {/* OPTIONS — always thin, horizontal rows */}
          <div className="mt-5 space-y-2.5">
            {opts.map((opt, i) => {
              const selected = answers[current] === i;
              const label = optionLabel(i);
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => setAnswer(i)}
                  className={`flex w-full items-center gap-3 rounded-xl border-2 px-3.5 py-3 text-left transition-colors ${
                    selected
                      ? "border-primary bg-primary/8"
                      : "border-ink/15 bg-background hover:border-foreground/60 hover:bg-accent/20"
                  }`}
                  aria-pressed={selected}
                >
                  <span
                    className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors ${
                      selected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-ink/25 bg-card text-foreground"
                    }`}
                  >
                    {label}
                  </span>
                  {!labelOnly && (
                    <span className="flex-1 text-sm font-semibold leading-snug text-foreground">
                      {opt}
                    </span>
                  )}
                  {labelOnly && (
                    <span className="flex-1 text-sm font-semibold text-muted-foreground">
                      Option {label}
                    </span>
                  )}
                  {selected && (
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Secondary actions */}
          <div className="mt-5 flex flex-wrap items-center gap-2 border-t-2 border-dashed border-ink/10 pt-4">
            <button
              onClick={toggleReview}
              className={`inline-flex items-center gap-1.5 rounded-full border-2 px-4 py-2 text-xs font-bold transition-colors ${
                reviewed[current]
                  ? "border-warning bg-warning text-warning-foreground"
                  : "border-ink/20 bg-card text-foreground hover:border-foreground hover:bg-accent/40"
              }`}
            >
              <Flag className="h-3.5 w-3.5" />
              {reviewed[current] ? "Marked for review" : "Mark for review"}
            </button>
            <button
              onClick={() => setAnswers((p) => { const n = [...p]; n[current] = null; return n; })}
              className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink/20 bg-card px-4 py-2 text-xs font-bold text-foreground transition-colors hover:border-foreground hover:bg-accent/40"
            >
              Clear answer
            </button>
            <button
              onClick={() => setPaletteOpen(true)}
              className="ml-auto inline-flex items-center gap-1.5 rounded-full border-2 border-foreground bg-foreground px-4 py-2 text-xs font-bold text-background transition-colors hover:bg-primary hover:border-primary lg:hidden"
            >
              <Grid3x3 className="h-3.5 w-3.5" />
              {answeredCount}/{questions.length}
            </button>
          </div>

          {/* PRIMARY NAV — Prev / Next */}
          <div className="mt-4 grid grid-cols-2 gap-3 sm:flex sm:justify-between">
            <button
              onClick={() => go(Math.max(0, current - 1))}
              disabled={current === 0}
              className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-ink bg-card px-5 py-3 text-sm font-bold text-foreground transition-all hover:bg-foreground hover:text-background disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-card disabled:hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" /> Previous
            </button>
            {current < questions.length - 1 ? (
              <button
                onClick={() => go(current + 1)}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground shadow-glow transition-transform hover:scale-[1.03] active:scale-95"
              >
                Next <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={submit}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-foreground px-5 py-3 text-sm font-bold text-background shadow-soft transition-transform hover:scale-[1.03] active:scale-95"
              >
                Submit Test
              </button>
            )}
          </div>
        </main>

        {/* Desktop palette */}
        <aside className="hidden rounded-3xl border-2 border-ink/10 bg-card p-5 shadow-soft lg:sticky lg:top-24 lg:block lg:self-start">
          <PaletteContent
            questions={questions}
            current={current}
            statuses={statuses}
            answeredCount={answeredCount}
            onPick={go}
            onSubmit={submit}
          />
        </aside>
      </div>

      {/* Mobile palette drawer */}
      {/* Side palette drawer (slides in from right on mobile) */}
      <div
        className={`fixed inset-0 z-50 lg:hidden ${paletteOpen ? "pointer-events-auto" : "pointer-events-none"}`}
        aria-hidden={!paletteOpen}
      >
        {/* Backdrop */}
        <div
          onClick={() => setPaletteOpen(false)}
          className={`absolute inset-0 bg-foreground/50 backdrop-blur-sm transition-opacity duration-300 ${
            paletteOpen ? "opacity-100" : "opacity-0"
          }`}
        />
        {/* Drawer panel */}
        <aside
          className={`absolute right-0 top-0 flex h-full w-[88%] max-w-sm flex-col border-l-2 border-ink/15 bg-card shadow-elevated transition-transform duration-300 ease-[cubic-bezier(0.2,0.7,0.2,1)] ${
            paletteOpen ? "translate-x-0" : "translate-x-full"
          }`}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-label="Question palette"
        >
          <div className="flex items-center justify-between border-b-2 border-ink/10 px-5 py-4">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                Navigate
              </div>
              <div className="font-display text-base font-bold">Question Palette</div>
            </div>
            <button
              onClick={() => setPaletteOpen(false)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border-2 border-ink/15 text-foreground transition-colors hover:bg-foreground hover:text-background hover:border-foreground"
              aria-label="Close palette"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-5 pb-5 pt-4">
            <PaletteContent
              questions={questions}
              current={current}
              statuses={statuses}
              answeredCount={answeredCount}
              onPick={go}
              onSubmit={submit}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}

function PaletteContent({
  questions,
  current,
  statuses,
  answeredCount,
  onPick,
  onSubmit,
}: {
  questions: Question[];
  current: number;
  statuses: Status[];
  answeredCount: number;
  onPick: (i: number) => void;
  onSubmit: () => void;
}) {
  // Group by subject, preserving the order subjects first appear in.
  const groups: { subject: string; items: { idx: number }[] }[] = [];
  const seen = new Map<string, number>();
  questions.forEach((q, idx) => {
    const subj = q.subject || "General";
    let gi = seen.get(subj);
    if (gi === undefined) {
      gi = groups.length;
      seen.set(subj, gi);
      groups.push({ subject: subj, items: [] });
    }
    groups[gi].items.push({ idx });
  });

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="font-display text-sm font-bold">Questions</div>
        <span className="rounded-full bg-foreground px-2.5 py-1 text-[11px] font-bold text-background">
          {answeredCount}/{questions.length}
        </span>
      </div>

      <div className="mt-4 max-h-[55vh] space-y-4 overflow-y-auto pr-1 lg:max-h-[60vh]">
        {groups.map((g) => {
          const answered = g.items.filter((it) => statuses[it.idx] === "answered").length;
          return (
            <div key={g.subject}>
              <div className="mb-2 flex items-center justify-between">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${subjectChipClass(g.subject)}`}>
                  {g.subject}
                </span>
                <span className="text-[10px] font-bold tabular-nums text-muted-foreground">
                  {answered}/{g.items.length}
                </span>
              </div>
              <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-8 lg:grid-cols-6">
                {g.items.map(({ idx }) => (
                  <button
                    key={idx}
                    onClick={() => onPick(idx)}
                    className={`aspect-square rounded-lg border-2 text-xs font-bold transition-colors ${paletteClass(
                      statuses[idx],
                      idx === current,
                    )}`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2 text-[11px] font-semibold">
        <Legend dot="bg-success" label="Answered" />
        <Legend dot="bg-warning" label="Review" />
        <Legend dot="bg-accent border border-ink/20" label="Visited" />
        <Legend dot="bg-card border-2 border-ink/15" label="Not seen" />
      </div>

      <button
        onClick={onSubmit}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow-glow transition-transform hover:scale-[1.02] active:scale-95"
      >
        Submit Test
      </button>
    </>
  );
}

/**
 * Colour-codes a subject chip. Matches Physics/Chemistry/Biology/Maths
 * (case-insensitive, partial match) so we don't have to enumerate every
 * stream's naming. Anything unrecognised falls back to a neutral slate.
 */
function subjectChipClass(subject: string): string {
  const s = subject.toLowerCase();
  if (s.includes("phys")) return "bg-indigo-100 text-indigo-700 border border-indigo-200";
  if (s.includes("chem")) return "bg-amber-100 text-amber-700 border border-amber-200";
  if (s.includes("bio") || s.includes("bot") || s.includes("zoo"))
    return "bg-emerald-100 text-emerald-700 border border-emerald-200";
  if (s.includes("math") || s.includes("maths"))
    return "bg-rose-100 text-rose-700 border border-rose-200";
  if (s.includes("eng")) return "bg-sky-100 text-sky-700 border border-sky-200";
  return "bg-slate-100 text-slate-700 border border-slate-200";
}

function paletteClass(status: Status, active: boolean) {
  // Active state: solid foreground ring INSIDE the button (no offset gap),
  // so the rounded corners stay clean instead of looking "cropped".
  const ring = active ? "shadow-[inset_0_0_0_2px_var(--foreground)] " : "";
  switch (status) {
    case "answered":
      return ring + "border-success bg-success text-success-foreground";
    case "review":
      return ring + "border-warning bg-warning text-warning-foreground";
    case "visited":
      return ring + "border-ink/20 bg-accent text-accent-foreground";
    default:
      return ring + "border-ink/15 bg-card text-muted-foreground";
  }
}


function Legend({ dot, label }: { dot: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`inline-block h-3.5 w-3.5 rounded ${dot}`} />
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
}

function CountdownPill({ seconds }: { seconds: number }) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  const low = seconds < 60;
  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1.5 text-sm font-bold tabular-nums ${
        low
          ? "border-destructive bg-destructive text-destructive-foreground"
          : "border-background/20 bg-background/10 text-background"
      }`}
      style={low ? { animation: "pulse-glow 1.5s ease-in-out infinite" } : undefined}
    >
      <Clock className="h-4 w-4" />
      {String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
    </div>
  );
}

function IntroScreen({
  test,
  questionCount,
  onStart,
}: {
  test: Test;
  questionCount: number;
  onStart: () => void;
}) {
  return (
    <div className="min-h-screen bg-card">
      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-8 sm:py-12">
        <Link
          to="/category/$stream"
          params={{ stream: encodeURIComponent(test.stream || "General") }}
          className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" /> Back to {test.stream ?? "tests"}
        </Link>

        <div
          className="mt-5 overflow-hidden rounded-3xl border-2 border-ink/10 shadow-elevated"
          style={{ animation: "fade-up 0.4s both" }}
        >
          <div className="relative bg-foreground p-7 text-background sm:p-10">
            <div className="absolute inset-0 grid-bg opacity-15" />
            <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary/40 blur-3xl" />
            <div className="relative">
              <div className="flex items-center gap-2">
                <img src={logoVx} alt="" className="h-9 w-9 rounded-lg ring-2 ring-background/20" />
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-background/60">
                  AdhyayX · {test.stream ?? "Test"} · {test.category ?? "Mock"}
                </div>
              </div>
              <h1 className="mt-3 font-display text-3xl font-bold sm:text-4xl">{test.name}</h1>
              {test.description && (
                <p className="mt-2 max-w-xl text-sm text-background/80">{test.description}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 border-b-2 border-ink/10 bg-background">
            <Stat label="Questions" value={String(questionCount || test.total_questions)} />
            <Stat label="Duration" value={`${test.duration_minutes} min`} border />
            <Stat label="Stream" value={test.stream ?? "—"} />
          </div>

          <div className="bg-background p-6 sm:p-10">
            <div className="font-display text-lg font-bold">Instructions</div>
            <ul className="mt-3 grid gap-2.5 text-sm text-foreground sm:grid-cols-2">
              {[
                { icon: Maximize, text: "The test will open in full-screen for a real exam feel." },
                { icon: Clock, text: "Timer starts on Start Test. Auto-submits when time ends." },
                { icon: Grid3x3, text: "Use the palette to jump between questions anytime." },
                { icon: Flag, text: "Mark tricky questions for review and revisit later." },
              ].map((t) => (
                <li key={t.text} className="flex items-start gap-2.5 rounded-xl border border-ink/10 bg-card p-3">
                  <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/15 text-primary">
                    <t.icon className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-muted-foreground">{t.text}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={onStart}
              disabled={questionCount === 0}
              className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-4 text-sm font-bold text-primary-foreground shadow-glow transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-60"
            >
              <PlayCircle className="h-5 w-5" />
              {questionCount === 0 ? "No questions available" : "Start Test in Full-Screen"}
            </button>
            <div className="mt-2 text-center text-[11px] font-semibold text-muted-foreground">
              Press <kbd className="rounded border border-ink/20 bg-muted px-1.5 py-0.5 text-[10px]">Esc</kbd> any time to exit full-screen
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, border }: { label: string; value: string; border?: boolean }) {
  return (
    <div className={`px-4 py-5 text-center ${border ? "border-x-2 border-ink/10" : ""}`}>
      <div className="font-display text-xl font-bold text-foreground sm:text-2xl">{value}</div>
      <div className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}

function ResultScreen({
  test,
  questions,
  answers,
  onRetake,
  onHome,
}: {
  test: Test;
  questions: Question[];
  answers: Answer[];
  onRetake: () => void;
  onHome: () => void;
}) {
  type Row = {
    q: Question;
    opts: string[];
    correctIdx: number;
    userIdx: number | null;
    state: "correct" | "wrong" | "skipped";
    delta: number;
  };

  const rows: Row[] = questions.map((q) => {
    const opts = parseOptions(q.options);
    const correctIdx = correctIndex(q.correct, opts);
    const userIdx = answers[questions.indexOf(q)] ?? null;
    let state: Row["state"] = "skipped";
    let delta = 0;
    if (userIdx === null || userIdx === undefined) {
      state = "skipped";
    } else if (correctIdx >= 0 && userIdx === correctIdx) {
      state = "correct";
      delta = q.marks || 0;
    } else {
      state = "wrong";
      delta = -(q.negative_marks || 0);
    }
    return { q, opts, correctIdx, userIdx, state, delta };
  });

  const correct = rows.filter((r) => r.state === "correct").length;
  const wrong = rows.filter((r) => r.state === "wrong").length;
  const skipped = rows.filter((r) => r.state === "skipped").length;
  const totalMarks = questions.reduce((s, q) => s + (q.marks || 0), 0);
  const score = rows.reduce((s, r) => s + r.delta, 0);
  const pct = totalMarks > 0 ? Math.max(0, Math.round((score / totalMarks) * 100)) : 0;

  const subjectMap = new Map<string, { total: number; correct: number }>();
  rows.forEach((r) => {
    const k = r.q.subject || "General";
    if (!subjectMap.has(k)) subjectMap.set(k, { total: 0, correct: 0 });
    const e = subjectMap.get(k)!;
    e.total += 1;
    if (r.state === "correct") e.correct += 1;
  });

  const [tab, setTab] = useState<"all" | "correct" | "wrong" | "skipped">("all");
  const filtered = rows
    .map((r, i) => ({ r, i }))
    .filter(({ r }) => (tab === "all" ? true : r.state === tab));

  const optionLabel = (i: number) => String.fromCharCode(65 + i);

  // A tiny grade rubric so the headline reads like a real score-card
  const grade =
    pct >= 85
      ? { label: "Outstanding", tone: "text-success", ring: "ring-success/40" }
      : pct >= 70
        ? { label: "Excellent", tone: "text-success", ring: "ring-success/40" }
        : pct >= 50
          ? { label: "Good", tone: "text-primary", ring: "ring-primary/40" }
          : pct >= 35
            ? { label: "Needs Work", tone: "text-warning", ring: "ring-warning/40" }
            : { label: "Keep Practising", tone: "text-destructive", ring: "ring-destructive/40" };

  const attempted = correct + wrong;
  const accuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;

  return (
    <div className="min-h-screen bg-card">
      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-8 sm:py-12">
        <div
          className="overflow-hidden rounded-3xl border-2 border-ink/10 shadow-elevated"
          style={{ animation: "fade-up 0.4s both" }}
        >
          {/* HEADER */}
          <div className="relative bg-foreground p-7 text-background sm:p-10">
            <div className="absolute inset-0 grid-bg opacity-15" />
            <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary/40 blur-3xl" />
            <div className="relative flex items-center gap-4">
              <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-glow">
                <Trophy className="h-7 w-7" />
              </span>
              <div className="min-w-0">
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-background/60">
                  AdhyayX · Score Report
                </div>
                <h1 className="mt-1 truncate font-display text-2xl font-bold sm:text-3xl">{test.name}</h1>
                <div className="mt-1 text-[11px] font-semibold text-background/70">
                  {test.stream ?? "Mock"} · {questions.length} questions · {test.duration_minutes} min
                </div>
              </div>
            </div>
          </div>

          {/* SCORE — circular gauge + key stats */}
          <div className="border-b-2 border-ink/10 bg-gradient-to-b from-surface to-card p-5 sm:p-8">
            <div className="grid items-center gap-6 sm:grid-cols-[auto_1fr]">
              <div className="mx-auto flex flex-col items-center">
                <div
                  className={`relative inline-flex h-36 w-36 items-center justify-center rounded-full ring-4 ring-offset-4 ring-offset-card ${grade.ring}`}
                  style={{
                    background: `conic-gradient(currentColor ${pct * 3.6}deg, oklch(0.92 0.02 250) 0deg)`,
                    color: pct >= 50 ? "var(--success)" : pct >= 35 ? "var(--warning)" : "var(--destructive)",
                  }}
                >
                  <div className="flex h-28 w-28 flex-col items-center justify-center rounded-full bg-card">
                    <div className={`font-display text-4xl font-bold leading-none ${grade.tone}`}>
                      {pct}%
                    </div>
                    <div className="mt-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Score
                    </div>
                  </div>
                </div>
                <div className={`mt-3 inline-flex items-center gap-1.5 rounded-full bg-card px-3 py-1 text-xs font-bold ${grade.tone}`}>
                  <Trophy className="h-3.5 w-3.5" />
                  {grade.label}
                </div>
              </div>

              <div className="space-y-3">
                <div className="rounded-2xl border-2 border-ink/10 bg-card p-4">
                  <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    <span>Marks obtained</span>
                    <span className="tabular-nums text-foreground">
                      {score.toFixed(2)} / {totalMarks}
                    </span>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-ink/10">
                    <div
                      className={`h-full rounded-full transition-all ${pct >= 35 ? "bg-success" : "bg-destructive"}`}
                      style={{ width: `${Math.max(2, pct)}%` }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <MiniStat label="Accuracy" value={`${accuracy}%`} hint={`${correct}/${attempted || 0} attempted`} />
                  <MiniStat label="Attempted" value={`${attempted}`} hint={`${skipped} skipped`} />
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3">
              <ResultStatBox label="Correct" value={correct} tone="success" />
              <ResultStatBox label="Wrong" value={wrong} tone="destructive" />
              <ResultStatBox label="Skipped" value={skipped} tone="muted" />
            </div>
          </div>

          {/* Subject-wise */}
          {subjectMap.size > 0 && (
            <div className="border-b-2 border-ink/10 p-5 sm:p-8">
              <div className="font-display text-base font-bold">Subject-wise performance</div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {Array.from(subjectMap.entries()).map(([k, v]) => {
                  const p = Math.round((v.correct / v.total) * 100);
                  return (
                    <div key={k} className="rounded-2xl border-2 border-ink/10 bg-background p-4">
                      <div className="flex items-center justify-between">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${subjectChipClass(k)}`}>
                          {k}
                        </span>
                        <span className="text-xs font-bold tabular-nums text-muted-foreground">
                          {v.correct} / {v.total}
                        </span>
                      </div>
                      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-ink/10">
                        <div
                          className={`h-full rounded-full ${p >= 50 ? "bg-success" : p >= 30 ? "bg-warning" : "bg-destructive"}`}
                          style={{ width: `${Math.max(2, p)}%` }}
                        />
                      </div>
                      <div className="mt-1.5 text-right text-[11px] font-bold tabular-nums text-foreground">
                        {p}%
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}


          {/* Answer review */}
          <div className="p-5 sm:p-8">
            <div className="flex items-center justify-between">
              <div className="font-display text-base font-bold">Answer review</div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {([
                ["all", `All (${rows.length})`],
                ["correct", `Correct (${correct})`],
                ["wrong", `Wrong (${wrong})`],
                ["skipped", `Skipped (${skipped})`],
              ] as const).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={`rounded-full border-2 px-3.5 py-1.5 text-xs font-bold transition-colors ${
                    tab === key
                      ? "border-foreground bg-foreground text-background"
                      : "border-ink/15 bg-card text-muted-foreground hover:border-foreground hover:text-foreground"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="mt-4 space-y-3">
              {filtered.length === 0 && (
                <div className="rounded-2xl border-2 border-dashed border-ink/15 p-6 text-center text-sm text-muted-foreground">
                  Nothing here.
                </div>
              )}
              {filtered.map(({ r, i }) => {
                const stateMeta =
                  r.state === "correct"
                    ? { label: "Correct", cls: "bg-success text-success-foreground", icon: CheckCircle2 }
                    : r.state === "wrong"
                      ? { label: "Wrong", cls: "bg-destructive text-destructive-foreground", icon: XCircle }
                      : { label: "Skipped", cls: "bg-muted text-muted-foreground", icon: Flag };
                const Icon = stateMeta.icon;
                return (
                  <div key={r.q.id} className="rounded-2xl border-2 border-ink/10 bg-card p-4 sm:p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${stateMeta.cls}`}>
                          <Icon className="h-3.5 w-3.5" />
                          {stateMeta.label}
                        </span>
                        {r.q.subject && (
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${subjectChipClass(r.q.subject)}`}>
                            {r.q.subject}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-bold text-muted-foreground">Q{i + 1}</span>
                    </div>

                    {r.q.question_text ? (
                      <p className="mt-3 text-sm font-semibold leading-relaxed text-foreground sm:text-base">
                        {r.q.question_text}
                      </p>
                    ) : r.q.image ? (
                      <img
                        src={r.q.image}
                        alt="Question"
                        className="mt-3 w-full max-w-xl rounded-xl border-2 border-ink/10 bg-white object-contain p-2"
                      />
                    ) : null}

                    <div className="mt-3 space-y-2">
                      {r.opts.map((opt, oi) => {
                        const isCorrect = oi === r.correctIdx;
                        const isUser = oi === r.userIdx;
                        const isWrongUser = isUser && !isCorrect;
                        const cls = isCorrect
                          ? "border-success bg-success/10 text-foreground"
                          : isWrongUser
                            ? "border-destructive bg-destructive/10 text-foreground"
                            : "border-ink/10 bg-background text-muted-foreground";
                        return (
                          <div
                            key={oi}
                            className={`flex items-start gap-3 rounded-xl border-2 px-3 py-2.5 text-sm ${cls}`}
                          >
                            <span
                              className={`mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                                isCorrect
                                  ? "bg-success text-success-foreground"
                                  : isWrongUser
                                    ? "bg-destructive text-destructive-foreground"
                                    : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {optionLabel(oi)}
                            </span>
                            <span className="flex-1 font-semibold leading-relaxed">{opt}</span>
                            {isCorrect && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-success">
                                <CheckCircle2 className="h-3.5 w-3.5" /> Correct
                              </span>
                            )}
                            {isWrongUser && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-destructive">
                                <XCircle className="h-3.5 w-3.5" /> Your answer
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] font-bold">
                      <span className="rounded-full bg-success/15 px-2.5 py-1 text-success">
                        +{r.q.marks}
                      </span>
                      <span className="rounded-full bg-destructive/15 px-2.5 py-1 text-destructive">
                        -{r.q.negative_marks}
                      </span>
                      <span
                        className={`ml-auto rounded-full px-2.5 py-1 ${
                          r.delta > 0
                            ? "bg-success/15 text-success"
                            : r.delta < 0
                              ? "bg-destructive/15 text-destructive"
                              : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {r.delta > 0 ? "+" : ""}
                        {r.delta} marks
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 grid grid-cols-1 gap-3 sm:flex sm:flex-wrap">
              <button
                onClick={onRetake}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground shadow-glow transition-transform hover:scale-[1.03] active:scale-95"
              >
                <RefreshCw className="h-4 w-4" /> Retake test
              </button>
              <button
                onClick={onHome}
                className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-ink bg-card px-5 py-3 text-sm font-bold text-foreground transition-colors hover:bg-foreground hover:text-background"
              >
                Browse categories
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ResultStatBox({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "success" | "destructive" | "muted";
}) {
  const toneCls =
    tone === "success"
      ? "text-success bg-success/10 border-success/30"
      : tone === "destructive"
        ? "text-destructive bg-destructive/10 border-destructive/30"
        : "text-muted-foreground bg-muted border-ink/10";
  return (
    <div className={`rounded-2xl border-2 p-4 text-center ${toneCls}`}>
      <div className="font-display text-3xl font-bold">{value}</div>
      <div className="mt-0.5 text-[10px] font-bold uppercase tracking-wider">{label}</div>
    </div>
  );
}

function MiniStat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border-2 border-ink/10 bg-card p-4">
      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-0.5 font-display text-2xl font-bold tabular-nums text-foreground">
        {value}
      </div>
      {hint && <div className="mt-0.5 text-[11px] font-semibold text-muted-foreground">{hint}</div>}
    </div>
  );
}



function FullPageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex items-center gap-3 text-muted-foreground">
        <span className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span className="text-sm font-semibold">Loading test…</span>
      </div>
    </div>
  );
}

function CenterMessage({
  title,
  body,
  actionLabel,
  actionTo,
}: {
  title: string;
  body: string;
  actionLabel: string;
  actionTo: string;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md rounded-3xl border-2 border-ink/10 bg-card p-10 text-center shadow-soft">
        <h1 className="font-display text-2xl font-bold">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{body}</p>
        <Link
          to={actionTo as any}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground shadow-glow"
        >
          {actionLabel}
        </Link>
      </div>
    </div>
  );
}