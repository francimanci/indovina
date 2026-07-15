import { Link } from "wouter";
import { Button, Card } from "@client/components/ui";

export function Landing() {
  return (
    <div className="mx-auto max-w-5xl px-5">
      {/* Hero */}
      <section className="pt-16 pb-12 sm:pt-24 sm:pb-16">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-50 px-3 py-1 text-xs font-medium text-accent-700">
            Starts with your Codice Fiscale
          </span>
          <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight text-ink sm:text-5xl">
            Stop reading endless guides.
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-ink-soft">
            Tell Buddy your situation once and get the exact forms, emails, and
            steps for Italian bureaucracy — starting with the one document
            everything else depends on: your{" "}
            <span className="font-semibold text-ink">Codice Fiscale</span>.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/intake">
              <Button size="lg" className="w-full sm:w-auto">
                Get my plan
              </Button>
            </Link>
            <a href="#how">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                How it works
              </Button>
            </a>
          </div>
          <p className="mt-4 text-sm text-ink-muted">
            Free to see your plan. No account needed to start.
          </p>
        </div>
      </section>

      {/* Value props */}
      <section id="how" className="grid gap-4 pb-12 sm:grid-cols-3">
        {[
          {
            title: "One short intake",
            body: "Answer a few questions about your nationality, status, and city — once.",
          },
          {
            title: "A real plan, in order",
            body: "A numbered sequence with dependencies, so you always know what comes next.",
          },
          {
            title: "Artifacts, not essays",
            body: "Pre-filled form fields, ready-to-send emails, and appointment scripts.",
          },
        ].map((f) => (
          <Card key={f.title}>
            <h3 className="font-semibold text-ink">{f.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">{f.body}</p>
          </Card>
        ))}
      </section>

      {/* Focus callout */}
      <section className="pb-16">
        <div className="rounded-2xl bg-accent-600 p-6 shadow-card sm:p-8">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">
                First things first: the Codice Fiscale
              </h2>
              <p className="mt-1 max-w-xl text-sm text-accent-50">
                It’s the key to residency, healthcare, contracts, and a bank
                account. Buddy gets you this first, then everything else follows.
              </p>
            </div>
            <Link href="/intake">
              <Button
                size="lg"
                variant="secondary"
                className="whitespace-nowrap"
              >
                Start now
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
