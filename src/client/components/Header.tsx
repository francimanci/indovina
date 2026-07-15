import { Link } from "wouter";

export function Header() {
  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-semibold text-ink"
        >
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent-600 text-white">
            B
          </span>
          Buddy
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link
            href="/intake"
            className="rounded-lg px-3 py-2 font-medium text-ink-soft hover:bg-slate-100"
          >
            Start
          </Link>
        </nav>
      </div>
    </header>
  );
}
