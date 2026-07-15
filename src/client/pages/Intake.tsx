import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import {
  Button,
  Card,
  Field,
  Input,
  OptionCards,
} from "@client/components/ui";
import { api, ApiError } from "@client/lib/api";
import {
  profileInputSchema,
  reasonLabels,
  type ProfileInput,
  type FamilyMemberInput,
} from "@shared/types";

type Draft = Partial<ProfileInput>;

const TOTAL_STEPS = 7;

export function Intake() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>({
    familyMembers: [],
    hasPermesso: false,
    hasCodiceFiscale: false,
  });

  const set = (patch: Draft) => setDraft((d) => ({ ...d, ...patch }));

  const mutation = useMutation({
    mutationFn: (input: ProfileInput) =>
      api.post<{ id: string }>("/api/profile", input),
    onSuccess: ({ id }) => navigate(`/plan/${id}`),
  });

  const next = () => setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const submit = () => {
    const parsed = profileInputSchema.safeParse(draft);
    if (!parsed.success) {
      // Should not happen: per-step gating prevents it. Jump to first step.
      setStep(0);
      return;
    }
    mutation.mutate(parsed.data);
  };

  const canContinue = stepIsValid(step, draft);

  return (
    <div className="mx-auto max-w-xl px-5 py-10">
      {/* Progress */}
      <div className="mb-8">
        <div className="mb-2 flex items-center justify-between text-xs text-ink-muted">
          <span>
            Step {step + 1} of {TOTAL_STEPS}
          </span>
          <span>{Math.round(((step + 1) / TOTAL_STEPS) * 100)}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-accent-500 transition-all"
            style={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }}
          />
        </div>
      </div>

      <Card>
        <StepBody step={step} draft={draft} set={set} />
      </Card>

      {mutation.isError && (
        <p className="mt-4 text-sm text-red-600">
          {mutation.error instanceof ApiError
            ? mutation.error.message
            : "Something went wrong. Please try again."}
        </p>
      )}

      {/* Nav */}
      <div className="mt-6 flex items-center justify-between">
        <Button variant="ghost" onClick={back} disabled={step === 0}>
          Back
        </Button>
        {step < TOTAL_STEPS - 1 ? (
          <Button onClick={next} disabled={!canContinue}>
            Continue
          </Button>
        ) : (
          <Button onClick={submit} disabled={mutation.isPending}>
            {mutation.isPending ? "Building your plan…" : "See my plan"}
          </Button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Per-step validation gating the Continue button
// ---------------------------------------------------------------------------
function stepIsValid(step: number, d: Draft): boolean {
  switch (step) {
    case 0:
      return !!d.nationality?.trim() && !!d.euStatus;
    case 1:
      return !!d.location;
    case 2:
      return !!d.reason;
    case 3:
      return !!d.city?.trim();
    case 4:
      return d.hasPermesso !== undefined && d.hasCodiceFiscale !== undefined;
    case 5:
      return true; // family members optional
    case 6:
      return profileInputSchema.safeParse(d).success;
    default:
      return false;
  }
}

// ---------------------------------------------------------------------------
// Step bodies
// ---------------------------------------------------------------------------
function StepBody({
  step,
  draft,
  set,
}: {
  step: number;
  draft: Draft;
  set: (patch: Draft) => void;
}) {
  switch (step) {
    case 0:
      return (
        <StepShell
          title="Where are you from?"
          subtitle="This determines which rules apply to you."
        >
          <Field label="Nationality">
            <Input
              placeholder="e.g. Brazilian, German, Indian"
              value={draft.nationality ?? ""}
              onChange={(e) => set({ nationality: e.target.value })}
            />
          </Field>
          <div className="mt-5">
            <p className="mb-2 text-sm font-medium text-ink">
              Are you an EU/EEA citizen?
            </p>
            <OptionCards
              value={draft.euStatus ?? null}
              onChange={(euStatus) => set({ euStatus })}
              options={[
                { value: "eu", label: "Yes — EU / EEA / Swiss" },
                { value: "non_eu", label: "No — non-EU" },
              ]}
            />
          </div>
        </StepShell>
      );

    case 1:
      return (
        <StepShell
          title="Where are you right now?"
          subtitle="Some steps differ depending on whether you’ve arrived yet."
        >
          <OptionCards
            value={draft.location ?? null}
            onChange={(location) => set({ location })}
            options={[
              {
                value: "in_italy",
                label: "I’m already in Italy",
                description: "You can start in-person steps.",
              },
              {
                value: "abroad",
                label: "I’m still abroad",
                description: "We’ll prep what you can do remotely first.",
              },
            ]}
          />
        </StepShell>
      );

    case 2:
      return (
        <StepShell
          title="Why are you in Italy?"
          subtitle="Your reason shapes the documents you’ll need."
        >
          <OptionCards
            value={draft.reason ?? null}
            onChange={(reason) => set({ reason })}
            options={(
              ["work", "study", "family", "elective_residence"] as const
            ).map((v) => ({ value: v, label: reasonLabels[v] }))}
          />
        </StepShell>
      );

    case 3:
      return (
        <StepShell
          title="Which city or comune?"
          subtitle="Your local office (Comune / Agenzia delle Entrate) depends on this."
        >
          <Field label="City / Comune">
            <Input
              placeholder="e.g. Milano, Bologna, Roma"
              value={draft.city ?? ""}
              onChange={(e) => set({ city: e.target.value })}
            />
          </Field>
        </StepShell>
      );

    case 4:
      return (
        <StepShell
          title="What do you already have?"
          subtitle="We’ll skip steps you’ve already completed."
        >
          <div className="space-y-5">
            <div>
              <p className="mb-2 text-sm font-medium text-ink">
                Do you have a permesso di soggiorno?
              </p>
              <OptionCards
                value={boolKey(draft.hasPermesso)}
                onChange={(v) => set({ hasPermesso: v === "yes" })}
                options={[
                  { value: "yes", label: "Yes" },
                  { value: "no", label: "No / not yet" },
                ]}
              />
            </div>
            <div>
              <p className="mb-2 text-sm font-medium text-ink">
                Do you have a Codice Fiscale?
              </p>
              <OptionCards
                value={boolKey(draft.hasCodiceFiscale)}
                onChange={(v) => set({ hasCodiceFiscale: v === "yes" })}
                options={[
                  { value: "yes", label: "Yes" },
                  { value: "no", label: "No / not yet" },
                ]}
              />
            </div>
          </div>
        </StepShell>
      );

    case 5:
      return (
        <FamilyStep
          members={draft.familyMembers ?? []}
          onChange={(familyMembers) => set({ familyMembers })}
        />
      );

    case 6:
      return <ReviewStep draft={draft} />;

    default:
      return null;
  }
}

function boolKey(v: boolean | undefined): "yes" | "no" | null {
  if (v === undefined) return null;
  return v ? "yes" : "no";
}

function StepShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-ink">{title}</h2>
      {subtitle && <p className="mt-1 text-sm text-ink-muted">{subtitle}</p>}
      <div className="mt-6">{children}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Family members step
// ---------------------------------------------------------------------------
function FamilyStep({
  members,
  onChange,
}: {
  members: FamilyMemberInput[];
  onChange: (members: FamilyMemberInput[]) => void;
}) {
  const [relationship, setRelationship] = useState("");
  const [nationality, setNationality] = useState("");

  const add = () => {
    if (!relationship.trim() || !nationality.trim()) return;
    onChange([...members, { relationship: relationship.trim(), nationality: nationality.trim() }]);
    setRelationship("");
    setNationality("");
  };

  const remove = (i: number) =>
    onChange(members.filter((_, idx) => idx !== i));

  return (
    <StepShell
      title="Any family members joining you?"
      subtitle="Optional — add anyone moving with you. You can skip this."
    >
      {members.length > 0 && (
        <ul className="mb-4 space-y-2">
          {members.map((m, i) => (
            <li
              key={i}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm"
            >
              <span>
                <span className="font-medium text-ink">{m.relationship}</span>
                <span className="text-ink-muted"> · {m.nationality}</span>
              </span>
              <button
                type="button"
                onClick={() => remove(i)}
                className="text-xs font-medium text-red-600 hover:underline"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Relationship">
          <Input
            placeholder="e.g. Spouse, Child"
            value={relationship}
            onChange={(e) => setRelationship(e.target.value)}
          />
        </Field>
        <Field label="Nationality">
          <Input
            placeholder="e.g. Brazilian"
            value={nationality}
            onChange={(e) => setNationality(e.target.value)}
          />
        </Field>
      </div>
      <Button variant="secondary" className="mt-3" onClick={add}>
        + Add family member
      </Button>
    </StepShell>
  );
}

// ---------------------------------------------------------------------------
// Review step
// ---------------------------------------------------------------------------
function ReviewStep({ draft }: { draft: Draft }) {
  const rows: [string, string][] = [
    ["Nationality", draft.nationality ?? "—"],
    ["EU status", draft.euStatus === "eu" ? "EU / EEA / Swiss" : "Non-EU"],
    [
      "Location",
      draft.location === "in_italy" ? "Already in Italy" : "Still abroad",
    ],
    ["Reason", draft.reason ? reasonLabels[draft.reason] : "—"],
    ["City / Comune", draft.city ?? "—"],
    ["Permesso di soggiorno", draft.hasPermesso ? "Yes" : "No / not yet"],
    ["Codice Fiscale", draft.hasCodiceFiscale ? "Yes" : "No / not yet"],
    [
      "Family members",
      draft.familyMembers && draft.familyMembers.length > 0
        ? draft.familyMembers
            .map((m) => `${m.relationship} (${m.nationality})`)
            .join(", ")
        : "None",
    ],
  ];

  return (
    <StepShell
      title="Does this look right?"
      subtitle="Review your details before we build your plan."
    >
      <dl className="divide-y divide-slate-100">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4 py-2.5 text-sm">
            <dt className="text-ink-muted">{label}</dt>
            <dd className="text-right font-medium text-ink">{value}</dd>
          </div>
        ))}
      </dl>
    </StepShell>
  );
}
