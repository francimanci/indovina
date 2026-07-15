import { useState } from "react";
import { Card } from "@client/components/ui";
import type { StepKit } from "@shared/types";

/**
 * Renders a generated step kit: submission channel, form field values, the
 * ready-to-send email (IT + EN), the appointment script, plus a printable PDF
 * download. Shared by the Codice Fiscale page and the generic step page.
 */
export function KitView({ kit }: { kit: StepKit }) {
  const mailtoBody = encodeURIComponent(kit.content.email.italian);
  const mailtoSubject = encodeURIComponent(kit.content.email.subject);
  const pdfHref = `/api/steps/${kit.stepKey}/pdf`;

  return (
    <div className="mt-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold text-ink">
            Your ready-to-send request
          </h2>
          <p className="mt-1 text-sm text-ink-muted">
            Target form:{" "}
            <span className="font-medium text-ink-soft">{kit.form}</span>
          </p>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
            kit.source === "ai"
              ? "bg-accent-50 text-accent-700"
              : "bg-slate-100 text-ink-muted"
          }`}
          title={
            kit.source === "ai"
              ? "Refined by AI from your profile"
              : "Generated from the official form mapping"
          }
        >
          {kit.source === "ai" ? "AI-refined" : "Standard"}
        </span>
      </div>

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

      <Card>
        <h3 className="font-semibold text-ink">How to submit</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
          {kit.channel.summary}
        </p>
        <div className="mt-3 flex flex-wrap gap-4 text-sm">
          <a
            href={pdfHref}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-accent-700 hover:underline"
          >
            Download pre-filled PDF ↓
          </a>
          {kit.channel.officialFormUrl && (
            <a
              href={kit.channel.officialFormUrl}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-accent-700 hover:underline"
            >
              Official site ↗
            </a>
          )}
        </div>
      </Card>

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold text-ink">Form field values</h3>
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

      <Card>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-semibold text-ink">Email to the office (Italian)</h3>
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
        <EmailBox value={kit.content.email.italian} rows={14} />

        <div className="mb-2 mt-5 flex items-center justify-between">
          <h4 className="text-sm font-medium text-ink-soft">
            English translation (for your reference)
          </h4>
          <CopyButton label="Copy English" text={kit.content.email.english} />
        </div>
        <EmailBox value={kit.content.email.english} rows={12} />
      </Card>

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
        Buddy is an information tool, not legal or tax advice. Always verify the
        competent office and current requirements on official sources.
      </p>
    </div>
  );
}

function EmailBox({ value, rows }: { value: string; rows: number }) {
  return (
    <textarea
      readOnly
      rows={rows}
      value={value}
      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 font-mono text-xs leading-relaxed text-ink focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-100"
    />
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
