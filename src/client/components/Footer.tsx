export function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-5xl px-5 py-8">
        <p className="text-xs leading-relaxed text-ink-muted">
          <span className="font-medium text-ink-soft">Disclaimer:</span> Buddy is
          an information tool, not legal or tax advice. Always verify with
          official sources.
        </p>
        <p className="mt-3 text-xs text-ink-muted">
          © {new Date().getFullYear()} Buddy
        </p>
      </div>
    </footer>
  );
}
