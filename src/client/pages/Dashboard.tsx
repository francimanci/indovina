import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button, Card } from "@client/components/ui";
import { api } from "@client/lib/api";
import { useAuthUser } from "@client/lib/auth";
import { reasonLabels, type DashboardView } from "@shared/types";

export function Dashboard() {
  const { data: user } = useAuthUser();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => api.get<DashboardView>("/api/dashboard"),
  });

  return (
    <div className="mx-auto max-w-2xl px-5 py-10">
      <header className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink">Your dashboard</h1>
          {user && (
            <p className="mt-1 text-sm text-ink-muted">{user.email}</p>
          )}
        </div>
        <Link href="/intake">
          <Button>Start a new plan</Button>
        </Link>
      </header>

      {isLoading && <p className="text-ink-muted">Loading…</p>}
      {isError && (
        <p className="text-sm text-red-600">
          Couldn’t load your dashboard. Please refresh.
        </p>
      )}

      {data && (
        <div className="space-y-10">
          {/* Plans */}
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-muted">
              Saved plans
            </h2>
            {data.plans.length === 0 ? (
              <EmptyState
                title="No plans yet"
                body="Answer a few questions and Buddy builds your step-by-step plan — starting with your Codice Fiscale."
                cta={{ href: "/intake", label: "Create your plan" }}
              />
            ) : (
              <ul className="space-y-3">
                {data.plans.map((p) => (
                  <li key={p.profileId}>
                    <Link href={`/plan/${p.profileId}`}>
                      <Card className="cursor-pointer transition-colors hover:border-accent-200">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <h3 className="font-semibold text-ink">{p.title}</h3>
                            <p className="mt-0.5 text-sm text-ink-muted">
                              {p.city} · {reasonLabels[p.reason]}
                            </p>
                          </div>
                          <span className="text-sm font-medium text-accent-700">
                            Open →
                          </span>
                        </div>
                      </Card>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Documents */}
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-muted">
              Generated documents
            </h2>
            {data.documents.length === 0 ? (
              <EmptyState
                title="No documents yet"
                body="Once you generate the forms, emails, and appointment scripts for a step, they’ll appear here so you can return to them anytime."
              />
            ) : (
              <ul className="space-y-3">
                {data.documents.map((d) => (
                  <li key={d.id}>
                    <Card>
                      <div className="flex items-center justify-between gap-4">
                        <h3 className="font-medium text-ink">{d.stepKey}</h3>
                        <span className="text-xs text-ink-muted">
                          {new Date(d.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </Card>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function EmptyState({
  title,
  body,
  cta,
}: {
  title: string;
  body: string;
  cta?: { href: string; label: string };
}) {
  return (
    <Card className="border-dashed">
      <div className="py-4 text-center">
        <h3 className="font-semibold text-ink">{title}</h3>
        <p className="mx-auto mt-1 max-w-sm text-sm text-ink-muted">{body}</p>
        {cta && (
          <Link href={cta.href}>
            <Button className="mt-4">{cta.label}</Button>
          </Link>
        )}
      </div>
    </Card>
  );
}
