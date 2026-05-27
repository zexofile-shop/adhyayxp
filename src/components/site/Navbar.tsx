import { Link } from "@tanstack/react-router";
import { Brand } from "./Brand";

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 w-full border-b-2 border-ink/10 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="transition-transform hover:scale-[1.02]">
          <Brand />
        </Link>
        <nav className="hidden items-center gap-7 text-sm font-semibold text-muted-foreground md:flex">
          <Link to="/" className="hover:text-foreground transition-colors" activeOptions={{ exact: true }} activeProps={{ className: "text-foreground" }}>Home</Link>
          <Link to="/categories" className="hover:text-foreground transition-colors" activeProps={{ className: "text-foreground" }}>Categories</Link>
          <Link to="/news" className="hover:text-foreground transition-colors" activeProps={{ className: "text-foreground" }}>News</Link>
          <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
        </nav>
        <Link
          to="/categories"
          className="inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-bold text-background shadow-soft transition-transform hover:scale-[1.03] active:scale-95"
        >
          Start Practicing
        </Link>
      </div>
    </header>
  );
}