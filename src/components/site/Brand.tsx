import logo from "@/assets/logo-vx.jpg";

export function Brand({ size = "md", showSub = true }: { size?: "sm" | "md" | "lg"; showSub?: boolean }) {
  const dims = size === "lg" ? "h-12 w-12" : size === "sm" ? "h-8 w-8" : "h-10 w-10";
  const title = size === "lg" ? "text-2xl" : size === "sm" ? "text-base" : "text-lg";
  return (
    <div className="flex items-center gap-2.5">
      <span className={`relative inline-flex ${dims} items-center justify-center overflow-hidden rounded-xl ring-2 ring-ink shadow-soft`}>
        <img src={logo} alt="AdhyayX" className="h-full w-full object-cover" />
      </span>
      <div className="leading-tight">
        <div className={`font-display ${title} font-bold tracking-tight text-foreground`}>
          Adhyay<span className="text-primary">X</span>
        </div>
        {showSub && (
          <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Har Adhyay, Ek Nayi Jeet
          </div>
        )}
      </div>
    </div>
  );
}
