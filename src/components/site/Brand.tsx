import logo from "@/assets/logo-vx.jpg";

export function Brand({ size = "md", showSub = true }: { size?: "sm" | "md" | "lg"; showSub?: boolean }) {
  const dims = size === "lg" ? "h-11 w-11" : size === "sm" ? "h-7 w-7" : "h-9 w-9";
  const title = size === "lg" ? "text-xl" : size === "sm" ? "text-sm" : "text-base";
  return (
    <div className="flex items-center gap-2">
      <span className={`relative inline-flex ${dims} items-center justify-center overflow-hidden rounded-lg ring-2 ring-ink shadow-soft`}>
        <img src={logo} alt="AdhyayX" className="h-full w-full object-cover" />
      </span>
      <div className="leading-tight">
        <div className={`font-display ${title} font-bold tracking-tight text-foreground`}>
          Adhyay<span className="text-primary">X</span>
        </div>
        {showSub && (
          <div className="text-[8px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Har Adhyay, Ek Nayi Jeet
          </div>
        )}
      </div>
    </div>
  );
}
