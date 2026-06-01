import { Link, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, X } from "lucide-react";
import pwLogo from "@/assets/pw-logo.jpg";

const HIDDEN_PREFIXES = ["/pw", "/test/"];

export function PwFloatingIcon() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  if (HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) return null;
  if (pathname === "/") return null;

  return (
    <>
      <div className="fixed bottom-20 right-4 z-40 sm:bottom-24 sm:right-6">
        <button
          onClick={() => setOpen(true)}
          aria-label="Open Physics Wallah tests"
          className="group relative inline-flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border-2 border-ink bg-background shadow-elevated transition-transform hover:scale-105 active:scale-95 sm:h-16 sm:w-16"
        >
          <img src={pwLogo} alt="PW" className="h-full w-full object-cover" />
          <span className="absolute inset-0 rounded-full ring-2 ring-primary/0 transition group-hover:ring-primary/40" />
          <span className="absolute -right-0.5 -top-0.5 inline-flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-background bg-primary" />
        </button>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 px-4 backdrop-blur-sm"
          style={{ animation: "fade-up 0.2s both" }}
          onClick={() => setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-sm rounded-2xl border-2 border-ink/10 bg-card p-6 shadow-elevated"
            style={{ animation: "fade-up 0.3s both" }}
          >
            <button
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="absolute right-3 top-3 inline-flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-3">
              <div className="inline-flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border-2 border-ink bg-background">
                <img src={pwLogo} alt="PW" className="h-full w-full object-cover" />
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
                  Physics Wallah
                </div>
                <div className="font-display text-base font-bold text-foreground">Hi there 👋</div>
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-foreground">
              Attempt <span className="font-bold">Physics Wallah</span> batch tests and highlight
              your preparation. Pick your exam, choose a batch, and take a real mock — right inside
              AdhyayX.
            </p>
            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setOpen(false)}
                className="flex-1 rounded-full border-2 border-ink/10 bg-card px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-foreground hover:border-foreground"
              >
                Maybe later
              </button>
              <Link
                to="/pw"
                onClick={() => setOpen(false)}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-foreground px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-background hover:bg-foreground/90"
              >
                Open PW <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
