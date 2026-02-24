import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-violet-100 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-6 px-4">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 text-white text-xs font-bold shadow-sm">
            概
          </span>
          <span>概念理解ノート</span>
        </Link>

        {/* Right side */}
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 text-xs font-bold text-white shadow-sm">
            Y
          </div>
        </div>
      </div>
    </header>
  );
}
