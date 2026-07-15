import { Link, useRoute } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Card } from "@client/components/ui";
import { KitView } from "@client/components/KitView";
import { api, ApiError } from "@client/lib/api";
import type { StepKit } from "@shared/types";

const STEP_META: Record<string, { title: string; intro: string }> = {
  iscrizione_anagrafica: {
    title: "Register your residency",
    intro:
      "Buddy prepares your Dichiarazione di residenza for the Comune — field values, the email, and what to bring. It reuses the details from your Codice Fiscale form.",
  },
  tessera_sanitaria: {
    title: "Get your Tessera Sanitaria",
    intro:
      "Buddy prepares your enrolment in the National Health Service (SSN) at the ASL. It reuses the details from your Codice Fiscale form.",
  },
};

export function StepKitPage() {
  const [, params] = useRoute("/step/:stepKey/:profileId");
  const stepKey = params?.stepKey ?? "";
  const profileId = params?.profileId ?? "";
  const qc = useQueryClient();
  const meta = STEP_META[stepKey];

  const kitQuery = useQuery({
    queryKey: ["step-kit", stepKey],
    queryFn: async () => {
      try {
        return await api.get<StepKit>(`/api/steps/${stepKey}`);
      } catch (e) {
        if (e instanceof ApiError && e.status === 404) return null;
        throw e;
      }
    },
    enabled: !!stepKey,
  });

  const generate = useMutation({
    mutationFn: () => api.post<StepKit>(`/api/steps/${stepKey}/generate`),
    onSuccess: (kit) => qc.setQueryData(["step-kit", stepKey], kit),
  });

  const kit = kitQuery.data ?? null;

  return (
    <div className="mx-auto max-w-3xl px-5 py-10">
      <div className="mb-2 text-sm text-ink-muted">
        <Link
          href={`/plan/${profileId}`}
          className="hover:text-ink hover:underline"
        >
          ← Back to your plan
        </Link>
      </div>

      <header className="mb-6">
        <h1 className="text-2xl font-bold text-ink">
          {meta?.title ?? "Prepare this step"}
        </h1>
        {meta && (
          <p className="mt-1 text-sm leading-relaxed text-ink-soft">
            {meta.intro}
          </p>
        )}
      </header>

      <Card>
        <p className="text-sm text-ink-soft">
          This request uses the personal details you saved in your{" "}
          <Link
            href={`/codice-fiscale/${profileId}`}
            className="font-medium text-accent-700 hover:underline"
          >
            Codice Fiscale form
          </Link>
          . Anything still missing will be listed after you generate it.
        </p>
        <div className="mt-4 flex items-center gap-3">
          <Button onClick={() => generate.mutate()} disabled={generate.isPending}>
            {generate.isPending
              ? "Preparing…"
              : kit
                ? "Regenerate my request"
                : "Generate my request"}
          </Button>
          {generate.isError && (
            <span className="text-sm text-red-600">
              {generate.error instanceof ApiError
                ? generate.error.message
                : "Something went wrong."}
            </span>
          )}
        </div>
      </Card>

      {kit && <KitView kit={kit} />}
    </div>
  );
}
