import { Link } from "@tanstack/react-router";
import { Palette } from "lucide-react";

export function Navbar() {
  return (
    <header className="w-full border-b border-border/50 bg-background/40 backdrop-blur-md sticky top-0 z-40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="h-8 w-8 rounded-lg gradient-bg-primary grid place-items-center shadow-glow group-hover:scale-105 transition-transform">
            <Palette className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight">
            Scrible<span className="gradient-text">Clone</span>
          </span>
        </Link>
        <nav className="flex items-center gap-2 text-sm">
          <Link
            to="/create"
            className="px-3 py-1.5 rounded-lg hover:bg-secondary transition-colors"
          >
            Create
          </Link>
          <Link to="/join" className="px-3 py-1.5 rounded-lg hover:bg-secondary transition-colors">
            Join
          </Link>
        </nav>
      </div>
    </header>
  );
}
