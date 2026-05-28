import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import pwLogo from "@/assets/pw-logo.jpg";

const HIDDEN_PREFIXES = ["/pw", "/test/"];

export function PwFloatingIcon() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [showTip, setShowTip] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShowTip(true), 1200);
    return () => clearTimeout(t);
  }, [pathname]);

  if (HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) return null;
  if (pathname === "/") return null; // only on inner pages — categories, etc.

  return (
    <div className="fixed bottom-5 right-4 z-50 flex flex-col items-end gap-2 sm:bottom-6 sm:right-6">
      {showTip && !dismissed && (
        <div
          className="relative max-w-[240px] rounded-2xl border-2 border-ink/10 bg-card px-3.5 py-2.5 text-xs font-medium leading-snug text-foreground shadow-elevated"
          style={{ animation: "fade-up 0.35s both" }}
        >
          <button
            onClick={() => setDismissed(true)}
            aria-label="Dismiss"
            className="absolute -right-1.5 -top-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full border border-ink/20 bg-background text-foreground hover:bg-muted"
          >
            <X className="h-3 w-3" />
          </button>
          <span className="font-semibold">Hi there</span> — attempt{" "}
          <span className="font-bold">Physics Wallah</span> tests and highlight your preparation.
          <span
            aria-hidden
            className="absolute -bottom-1.5 right-5 h-3 w-3 rotate-45 border-b-2 border-r-2 border-ink/10 bg-card"
          />
        </div>
      )}
      <Link
        to="/pw"
        aria-label="Open Physics Wallah tests"
        className="group relative inline-flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border-2 border-ink bg-background shadow-elevated transition-transform hover:scale-105 active:scale-95 sm:h-16 sm:w-16"
      >
        <img src={pwLogo} alt="PW" className="h-full w-full object-cover" />
        <span className="absolute inset-0 rounded-full ring-2 ring-primary/0 transition group-hover:ring-primary/40" />
      </Link>
    </div>
  );
}
