import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import pwLogo from "@/assets/pw-logo.jpg";

const HIDDEN_PREFIXES = ["/pw", "/test/"];

export function PwFloatingIcon() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [showTip, setShowTip] = useState(true);

  // Re-show the attention tooltip whenever we land on a new inner page
  useEffect(() => {
    setShowTip(true);
    const t = setTimeout(() => setShowTip(false), 6500);
    return () => clearTimeout(t);
  }, [pathname]);

  if (HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) return null;
  if (pathname === "/") return null;

  return (
    <div className="fixed bottom-20 right-4 z-40 sm:bottom-24 sm:right-6">
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
              Physics Wallah
            </div>
            <div className="mt-0.5 text-[12px] font-bold leading-snug">
              Hi there! Attempt PW mocks here
            </div>
            {/* Arrow pointing down to icon */}
            <div className="absolute -bottom-2 right-5 h-3 w-3 rotate-45 border-b-2 border-r-2 border-ink bg-foreground" />
          </div>
        </div>
      )}

      <Link
        to="/pw"
        aria-label="Open Physics Wallah tests"
        className="group relative inline-flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border-2 border-ink bg-background shadow-elevated transition-transform hover:scale-105 active:scale-95 sm:h-16 sm:w-16"
      >
        <img src={pwLogo} alt="PW" className="h-full w-full object-cover" />
        <span className="absolute inset-0 rounded-full ring-2 ring-primary/0 transition group-hover:ring-primary/40" />
        <span className="absolute -right-0.5 -top-0.5 inline-flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-background bg-primary" />
      </Link>
    </div>
  );
}
