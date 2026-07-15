import { useQuery } from "@tanstack/react-query";
import { Link, useRoute } from "wouter";
import { Button, Card } from "@client/components/ui";
import { api } from "@client/lib/api";
import type { PlanView, PlanStepView } from "@shared/types";

const GENERATABLE_STEPS = new Set([
  "codice_fiscale",
  "iscrizione_anagrafica",
  "tessera_sanitaria",
]);

function stepCtaHref(step: PlanStepView, profileId: string): string | null {
  // The Codice Fiscale step has its own dedicated form; the secondary steps
  // reuse those details via the generic step builder.
  if (step.stepKey === "codice_fiscale") return `/codice-fiscale/${profileId}`;
  if (GENERATABLE_STEPS.has(step.stepKey))
    return `/step/${step.stepKey}/${profileId}`;
  return null;
}

export function Plan() {
  const [, params] = useRoute("/plan/:profileId");
  const profileId = params?.profileId;

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["plan", profileId],
    queryFn: () => api.get<PlanView>(`/api/plan/${profileId}`),
    enabled: !!profileId,
  });

  if (isLoading) {
    return (
      <Centered>
        <div className="animate-pulse text-ink-muted">Building your plan…</div>
      </Centered>
    );
  }

  if (isError || !data) {
    return (
      <Centered>
        <h1 className="text-xl font-semibold text-ink">
          We couldn’t load your plan
        </h1>
        <p className="mt-2 text-sm text-ink-muted">
          {(error as Error)?.message ?? "Please try again."}
        </p>
        <Link href="/intake">
          <Button className="mt-6">Start over</Button>
        </Link>
      </Centered>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-5 py-10">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-ink">{data.title}</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Follow these in order. Each step shows what it depends on.
        </p>
      </header>

      <ol className="space-y-4">
        {data.steps.map((step) => (
          <StepCard
            key={step.stepKey}
            step={step}
            allSteps={data.steps}
            profileId={data.profileId}
          />
        ))}
      </ol>

      <p className="mt-8 rounded-xl bg-slate-100 p-4 text-xs text-ink-muted">
        This plan is a preview built from your answers. In a later step you’ll be
        able to generate the exact forms, emails, and appointment scripts for
        each item.
      </p>
    </div>
  );
}

function StepCard({
  step,
  allSteps,
  profileId,
}: {
  step: PlanStepView;
  allSteps: PlanStepView[];
  profileId: string;
}) {
  const titleFor = (key: string) =>
    allSteps.find((s) => s.stepKey === key)?.title ?? key;
  const ctaHref = stepCtaHref(step, profileId);

  return (
    <li>
      <Card
        className={
          step.primary ? "border-accent-300 ring-1 ring-accent-100" : undefined
        }
      >
        <div className="flex items-start gap-4">
          <div
            className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-semibold ${
              step.status === "completed"
                ? "bg-accent-600 text-white"
                : "bg-accent-50 text-accent-700"
            }`}
          >
            {step.status === "completed" ? "✓" : step.order}
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-ink">{step.title}</h3>
              {step.primary && (
                <span className="rounded-full bg-accent-600 px-2 py-0.5 text-[11px] font-medium text-white">
                  Start here
                </span>
              )}
              {step.status === "completed" && (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-ink-muted">
                  Already done
                </span>
              )}
            </div>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
              {step.description}
            </p>

            {step.dependsOn.length > 0 && (
              <p className="mt-3 text-xs text-ink-muted">
                <span className="font-medium">Requires:</span>{" "}
                {step.dependsOn.map((k, i) => (
                  <span key={k}>
                    {i > 0 && ", "}
                    {titleFor(k)} completed
                  </span>
                ))}
              </p>
            )}

            {ctaHref ? (
              <Link href={ctaHref}>
                <Button size="md" className="mt-4">
                  Prepare my request →
                </Button>
              </Link>
            ) : (
              <p className="mt-4 text-xs text-ink-muted">
                Document generation for this step is coming next.
              </p>
            )}
          </div>
        </div>
      </Card>
    </li>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-md px-5 py-24 text-center">{children}</div>
  );
}
