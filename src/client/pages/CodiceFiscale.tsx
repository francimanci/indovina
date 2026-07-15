import { useEffect, useState } from "react";
import { Link, useRoute } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Button,
  Card,
  Field,
  Input,
  Select,
  Textarea,
} from "@client/components/ui";
import { api, ApiError } from "@client/lib/api";
import {
  codiceFiscaleInputSchema,
  documentTypeLabels,
  documentTypeValues,
  sexValues,
  type CodiceFiscaleInput,
  type StepKit,
} from "@shared/types";

type Identity = CodiceFiscaleInput;

const EMPTY: Identity = {
  firstName: "",
  lastName: "",
  sex: "M",
  dateOfBirth: "",
  countryOfBirth: "",
  cityOfBirth: "",
  provinceOfBirth: "",
  addressComune: "",
  addressProvincia: "",
  addressStreet: "",
  addressCap: "",
  contactEmail: "",
  documentType: "passport",
  documentNumber: "",
};

export function CodiceFiscale() {
  const [, params] = useRoute("/codice-fiscale/:profileId");
  const profileId = params?.profileId;
  const qc = useQueryClient();

  const [form, setForm] = useState<Identity>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Prefill from saved identity.
  const { data: saved } = useQuery({
    queryKey: ["cf-identity", profileId],
    queryFn: () => api.get<Identity>(`/api/codice-fiscale/${profileId}`),
    enabled: !!profileId,
  });
  useEffect(() => {
    if (saved) setForm((f) => ({ ...EMPTY, ...saved, ...trimEmpty(f) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saved]);

  // Existing generated kit (if any).
  const kitQuery = useQuery({
    queryKey: ["cf-kit", profileId],
    queryFn: async () => {
      try {
        return await api.get<StepKit>("/api/steps/codice_fiscale");
      } catch (e) {
        if (e instanceof ApiError && e.status === 404) return null;
        throw e;
      }
    },
    enabled: !!profileId,
  });

  const save = useMutation({
    mutationFn: (input: Identity) =>
      api.post(`/api/codice-fiscale/${profileId}`, input),
  });

  const generate = useMutation({
    mutationFn: () => api.post<StepKit>("/api/steps/codice_fiscale/generate"),
    onSuccess: (kit) => {
      qc.setQueryData(["cf-kit", profileId], kit);
    },
  });

  const set = (patch: Partial<Identity>) =>
    setForm((f) => ({ ...f, ...patch }));

  const onGenerate = async () => {
    const parsed = codiceFiscaleInputSchema.safeParse(form);
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      const e: Record<string, string> = {};
      for (const [k, v] of Object.entries(flat)) if (v?.[0]) e[k] = v[0];
      setErrors(e);
      return;
    }
    setErrors({});
    await save.mutateAsync(parsed.data);
    await generate.mutateAsync();
  };

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
        <span className="inline-flex items-center rounded-full bg-accent-50 px-3 py-1 text-xs font-medium text-accent-700">
          Modello AA4/8 · Agenzia delle Entrate
        </span>
        <h1 className="mt-3 text-2xl font-bold text-ink">
          Request your Codice Fiscale
        </h1>
        <p className="mt-1 text-sm leading-relaxed text-ink-soft">
          Fill in the fields below once. Buddy maps them onto the official
          Modello AA4/8 and produces a ready-to-send request for the Agenzia
          delle Entrate — form values, the email, and what to say at the office.
        </p>
      </header>

      {/* The dedicated form */}
      <Card>
        <h2 className="mb-4 text-lg font-semibold text-ink">Your details</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="First name" error={errors.firstName}>
            <Input
              value={form.firstName}
              onChange={(e) => set({ firstName: e.target.value })}
            />
          </Field>
          <Field label="Last name (surname)" error={errors.lastName}>
            <Input
              value={form.lastName}
              onChange={(e) => set({ lastName: e.target.value })}
            />
          </Field>
          <Field label="Sex" error={errors.sex}>
            <Select
              value={form.sex}
              onChange={(e) => set({ sex: e.target.value as Identity["sex"] })}
            >
              {sexValues.map((s) => (
                <option key={s} value={s}>
                  {s === "M" ? "M — Male" : "F — Female"}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Date of birth" error={errors.dateOfBirth}>
            <Input
              type="date"
              value={form.dateOfBirth}
              onChange={(e) => set({ dateOfBirth: e.target.value })}
            />
          </Field>
          <Field label="Country of birth" error={errors.countryOfBirth}>
            <Input
              placeholder="e.g. Brazil, Italy"
              value={form.countryOfBirth}
              onChange={(e) => set({ countryOfBirth: e.target.value })}
            />
          </Field>
          <Field label="City / town of birth" error={errors.cityOfBirth}>
            <Input
              value={form.cityOfBirth}
              onChange={(e) => set({ cityOfBirth: e.target.value })}
            />
          </Field>
          <Field
            label="Province of birth"
            hint="Only if born in Italy (2-letter sigla)."
            error={errors.provinceOfBirth}
          >
            <Input
              placeholder="e.g. MI"
              value={form.provinceOfBirth}
              onChange={(e) => set({ provinceOfBirth: e.target.value })}
            />
          </Field>
          <div className="hidden sm:block" />

          <Field label="Comune of residence (Italy)" error={errors.addressComune}>
            <Input
              value={form.addressComune}
              onChange={(e) => set({ addressComune: e.target.value })}
            />
          </Field>
          <Field label="Province" error={errors.addressProvincia}>
            <Input
              placeholder="e.g. MI"
              value={form.addressProvincia}
              onChange={(e) => set({ addressProvincia: e.target.value })}
            />
          </Field>
          <Field
            label="Street and number (via + civico)"
            error={errors.addressStreet}
          >
            <Input
              placeholder="e.g. Via Roma 12"
              value={form.addressStreet}
              onChange={(e) => set({ addressStreet: e.target.value })}
            />
          </Field>
          <Field label="CAP (postal code)" error={errors.addressCap}>
            <Input
              placeholder="5 digits"
              value={form.addressCap ?? ""}
              onChange={(e) => set({ addressCap: e.target.value })}
            />
          </Field>

          <Field label="Contact email" error={errors.contactEmail}>
            <Input
              type="email"
              value={form.contactEmail}
              onChange={(e) => set({ contactEmail: e.target.value })}
            />
          </Field>
          <div className="hidden sm:block" />

          <Field label="Identity document" error={errors.documentType}>
            <Select
              value={form.documentType}
              onChange={(e) =>
                set({ documentType: e.target.value as Identity["documentType"] })
              }
            >
              {documentTypeValues.map((d) => (
                <option key={d} value={d}>
                  {documentTypeLabels[d]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Document number" error={errors.documentNumber}>
            <Input
              value={form.documentNumber}
              onChange={(e) => set({ documentNumber: e.target.value })}
            />
          </Field>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <Button
            onClick={onGenerate}
            disabled={save.isPending || generate.isPending}
          >
            {generate.isPending || save.isPending
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

      {/* Generated kit */}
      {kit && <KitView kit={kit} />}
    </div>
  );
}

// ---------------------------------------------------------------------------
function KitView({ kit }: { kit: StepKit }) {
  const mailtoBody = encodeURIComponent(kit.content.email.italian);
  const mailtoSubject = encodeURIComponent(kit.content.email.subject);

  return (
    <div className="mt-8 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-ink">Your ready-to-send request</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Target form: <span className="font-medium text-ink-soft">{kit.form}</span>
        </p>
      </div>

      {/* Missing fields */}
      {kit.missing.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-medium text-amber-800">
            Still needed before you submit
          </p>
          <ul className="mt-1 list-inside list-disc text-sm text-amber-700">
            {kit.missing.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Channel */}
      <Card>
        <h3 className="font-semibold text-ink">How to submit</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
          {kit.channel.summary}
        </p>
        <div className="mt-3 flex flex-wrap gap-3 text-sm">
          {kit.channel.officialFormUrl && (
            <a
              href={kit.channel.officialFormUrl}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-accent-700 hover:underline"
            >
              Agenzia delle Entrate ↗
            </a>
          )}
        </div>
      </Card>

      {/* Form fields */}
      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold text-ink">Form field values (AA4/8)</h3>
          <CopyButton
            label="Copy all"
            text={kit.content.formFields
              .map((f) => `${f.label}: ${f.value || "—"}`)
              .join("\n")}
          />
        </div>
        <dl className="divide-y divide-slate-100">
          {kit.content.formFields.map((f) => (
            <div key={f.label} className="py-2.5">
              <dt className="text-xs font-medium uppercase tracking-wide text-ink-muted">
                {f.label}
              </dt>
              <dd className="mt-0.5 text-sm text-ink">
                {f.value ? (
                  f.value
                ) : (
                  <span className="italic text-amber-700">— to complete —</span>
                )}
              </dd>
              {f.note && (
                <dd className="mt-0.5 text-xs text-ink-muted">{f.note}</dd>
              )}
            </div>
          ))}
        </dl>
      </Card>

      {/* Email */}
      <Card>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-semibold text-ink">
            Email to the office (Italian)
          </h3>
          <div className="flex gap-2">
            <CopyButton label="Copy Italian" text={kit.content.email.italian} />
            <a
              href={`mailto:?subject=${mailtoSubject}&body=${mailtoBody}`}
              className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-ink-soft hover:bg-slate-50"
            >
              Open in email
            </a>
          </div>
        </div>
        {kit.content.email.to && (
          <p className="mb-2 text-xs text-ink-muted">
            <span className="font-medium">To:</span> {kit.content.email.to}
          </p>
        )}
        <Textarea readOnly rows={14} value={kit.content.email.italian} />

        <div className="mb-2 mt-5 flex items-center justify-between">
          <h4 className="text-sm font-medium text-ink-soft">
            English translation (for your reference)
          </h4>
          <CopyButton label="Copy English" text={kit.content.email.english} />
        </div>
        <Textarea readOnly rows={12} value={kit.content.email.english} />
      </Card>

      {/* Appointment script */}
      <Card>
        <h3 className="font-semibold text-ink">At the office — what to bring</h3>
        <ul className="mt-2 space-y-1.5 text-sm text-ink-soft">
          {kit.content.appointmentScript.bring.map((b, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-accent-600">✓</span>
              <span>{b}</span>
            </li>
          ))}
        </ul>
        <h3 className="mt-5 font-semibold text-ink">What to say</h3>
        <p className="mt-2 rounded-xl bg-slate-50 p-3 text-sm leading-relaxed text-ink-soft">
          {kit.content.appointmentScript.say}
        </p>
      </Card>

      <p className="rounded-xl bg-slate-100 p-4 text-xs leading-relaxed text-ink-muted">
        Buddy is an information tool, not legal or tax advice. The Codice Fiscale
        is issued free of charge by the Agenzia delle Entrate — always verify the
        competent office and current requirements on official sources.
      </p>
    </div>
  );
}

function CopyButton({ label, text }: { label: string; text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          /* clipboard unavailable */
        }
      }}
      className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-ink-soft hover:bg-slate-50"
    >
      {copied ? "Copied ✓" : label}
    </button>
  );
}

function trimEmpty(f: Identity): Partial<Identity> {
  // Keep any values the user already typed (don't clobber with saved blanks).
  const out: Partial<Identity> = {};
  for (const [k, v] of Object.entries(f)) {
    if (typeof v === "string" && v.trim() !== "") {
      (out as Record<string, string>)[k] = v;
    }
  }
  return out;
}
