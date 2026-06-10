import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { BookOpen, Compass, X } from "lucide-react";
import pwLogo from "@/assets/pw-logo.jpg";
import eduKhajanaLogo from "@/assets/edu-khajana-logo.jpg";

export function PwFloatingIcon() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [showTip, setShowTip] = useState(true);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setShowTip(true);
    setOpen(false);
    const t = setTimeout(() => setShowTip(false), 6500);
    return () => clearTimeout(t);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    };
    window.addEventListener("pointerdown", close);
    return () => window.removeEventListener("pointerdown", close);
  }, [open]);

  if (pathname !== "/categories") return null;

  return (
    <div ref={wrapRef} className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      <div className="relative flex flex-col items-end gap-3">
        {showTip && (
          <div
            className="absolute bottom-full right-0 mb-2 w-[180px] sm:w-[200px]"
            style={{ animation: "fade-up 0.35s both" }}
          >
            <div className="relative rounded-2xl border-2 border-ink bg-foreground px-3 py-2.5 pr-7 text-background shadow-elevated">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  setShowTip(false);
                }}
                aria-label="Dismiss"
                className="absolute right-1.5 top-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full text-background/70 hover:bg-background/15 hover:text-background"
              >
                <X className="h-3 w-3" />
              </button>
              <div className="text-[9px] font-bold uppercase tracking-[0.18em] text-primary-glow">
                Quick access
              </div>
              <div className="mt-0.5 text-[12px] font-bold leading-snug">
                PW mocks aur books yahin se kholें
              </div>
              <div className="absolute -bottom-2 right-5 h-3 w-3 rotate-45 border-b-2 border-r-2 border-ink bg-foreground" />
            </div>
          </div>
        )}

        {open && (
          <div className="flex flex-col items-end gap-3">
            <Link
              to="/pw"
              aria-label="Open Physics Wallah tests"
              className="group relative inline-flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border-2 border-ink bg-background shadow-elevated transition-transform hover:scale-105 active:scale-95 sm:h-16 sm:w-16"
              style={{ animation: "fade-up 0.28s both" }}
            >
              <img src={pwLogo} alt="PW" className="h-full w-full object-cover" />
              <span className="absolute inset-0 rounded-full ring-2 ring-primary/0 transition group-hover:ring-primary/40" />
              <span className="absolute -right-0.5 -top-0.5 inline-flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-background bg-primary" />
            </Link>

            <Link
              to="/books"
              aria-label="Open Edu's Khazana — Free books library"
              className="group relative inline-flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border-2 border-ink bg-background shadow-elevated transition-transform hover:scale-105 active:scale-95 sm:h-16 sm:w-16"
              style={{ animation: "fade-up 0.28s 60ms both" }}
            >
              <img src={eduKhajanaLogo} alt="Edu's Khazana" className="h-full w-full object-cover" />
              <span className="absolute inset-0 rounded-full ring-2 ring-primary/0 transition group-hover:ring-primary/40" />
              <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full border-2 border-background bg-foreground text-background">
                <BookOpen className="h-2.5 w-2.5" />
              </span>
            </Link>
          </div>
        )}

        <button
          type="button"
          onClick={() => {
            setOpen((v) => !v);
            setShowTip(false);
          }}
          aria-label={open ? "Close quick access" : "Open quick access"}
          aria-expanded={open}
          className="group relative inline-flex h-14 w-14 items-center justify-center rounded-full border-2 border-ink bg-foreground text-background shadow-elevated transition-transform hover:scale-105 active:scale-95 sm:h-16 sm:w-16"
        >
          <Compass className={`h-6 w-6 transition-transform duration-300 ${open ? "rotate-45" : "group-hover:rotate-12"}`} />
          <span className="absolute -left-1 -top-1 inline-flex h-5 w-5 items-center justify-center rounded-full border-2 border-background bg-primary text-[9px] font-black text-primary-foreground">
            2
          </span>
        </button>
      </div>
    </div>
  );
}
