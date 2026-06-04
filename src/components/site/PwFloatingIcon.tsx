import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Compass, X } from "lucide-react";
import pwLogo from "@/assets/pw-logo.jpg";
import eduKhajanaLogo from "@/assets/edu-khajana-logo.jpg";

export function PwFloatingIcon() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  // Close menu on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Outside click to close
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [open]);

  if (pathname !== "/categories") return null;

  return (
    <div
      ref={wrapRef}
      className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6"
    >
      {/* Fan-out children */}
      {open && (
        <>
          <FabChild
            to="/pw"
            label="Physics Wallah"
            img={pwLogo}
            alt="PW"
            delay={0}
            badgeClass="bg-primary"
          />
          <FabChild
            to="/books"
            label="Edu's Khazana"
            img={eduKhajanaLogo}
            alt="Books"
            delay={60}
            badgeClass="bg-foreground"
          />
        </>
      )}

      {/* Toggle */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close shortcuts" : "Open shortcuts"}
        aria-expanded={open}
        className="group relative inline-flex h-14 w-14 items-center justify-center rounded-full border-2 border-ink bg-foreground text-background shadow-elevated transition-transform hover:scale-105 active:scale-95 sm:h-16 sm:w-16"
      >
        <span
          className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${
            open ? "rotate-90 opacity-0" : "rotate-0 opacity-100"
          }`}
        >
          <Compass className="h-6 w-6 sm:h-7 sm:w-7" />
        </span>
        <span
          className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${
            open ? "rotate-0 opacity-100" : "-rotate-90 opacity-0"
          }`}
        >
          <X className="h-6 w-6 sm:h-7 sm:w-7" />
        </span>
        <span className="absolute -right-0.5 -top-0.5 inline-flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-background bg-primary" />
      </button>
    </div>
  );
}

function FabChild({
  to,
  label,
  img,
  alt,
  delay,
  badgeClass,
}: {
  to: string;
  label: string;
  img: string;
  alt: string;
  delay: number;
  badgeClass: string;
}) {
  return (
    <div
      className="flex items-center gap-2"
      style={{ animation: `fade-up 0.35s ${delay}ms both` }}
    >
      <span className="rounded-full border-2 border-ink bg-foreground px-2.5 py-1 text-[11px] font-bold text-background shadow-soft">
        {label}
      </span>
      <Link
        to={to}
        aria-label={label}
        className="group relative inline-flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border-2 border-ink bg-background shadow-elevated transition-transform hover:scale-105 active:scale-95 sm:h-14 sm:w-14"
      >
        <img src={img} alt={alt} className="h-full w-full object-cover" />
        <span
          className={`absolute -right-0.5 -top-0.5 inline-flex h-3 w-3 rounded-full border-2 border-background ${badgeClass}`}
        />
      </Link>
    </div>
  );
}
