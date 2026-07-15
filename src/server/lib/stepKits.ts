import type { Profile } from "@shared/schema";
import type { GeneratedKitContent, StepKit, FormField } from "@shared/types";
import { documentTypeLabels } from "@shared/types";
import {
  buildCodiceFiscaleKit,
  isFilled,
  formatItalianDate,
} from "@server/lib/codiceFiscale";

/**
 * Registry of deterministic step-kit builders. The Codice Fiscale is the
 * product's primary focus; the residency and health-card steps are secondary
 * and reuse the identity data already collected for Modello AA4/8.
 */
export const stepBuilders: Record<
  string,
  (profile: Profile) => StepKit
> = {
  codice_fiscale: buildCodiceFiscaleKit,
  iscrizione_anagrafica: buildResidencyKit,
  tessera_sanitaria: buildHealthCardKit,
};

/** System-prompt file used when AI refinement is enabled, per step. */
export const stepPromptFile: Record<string, string> = {
  codice_fiscale: "codice-fiscale.md",
  iscrizione_anagrafica: "step.md",
  tessera_sanitaria: "step.md",
};

export function buildStepKit(stepKey: string, profile: Profile): StepKit | null {
  const builder = stepBuilders[stepKey];
  return builder ? builder(profile) : null;
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------
type Row = { label: string; value: string | null | undefined; note?: string; required?: boolean };

function toFields(rows: Row[]): { formFields: FormField[]; missing: string[] } {
  const formFields = rows.map((r) => ({
    label: r.label,
    value: (r.value ?? "").toString().trim(),
    note:
      r.note ??
      (r.required && !isFilled(r.value)
        ? "Campo obbligatorio: da completare. — Required: please complete."
        : undefined),
  }));
  const missing = rows
    .filter((r) => r.required && !isFilled(r.value))
    .map((r) => r.label);
  return { formFields, missing };
}

function identity(profile: Profile) {
  return {
    fullName: [profile.firstName, profile.lastName].filter(Boolean).join(" "),
    birthPlace: [profile.cityOfBirth, profile.countryOfBirth]
      .filter(Boolean)
      .join(", "),
    address: [
      profile.addressStreet,
      [profile.addressCap, profile.addressComune].filter(Boolean).join(" "),
      profile.addressProvincia ? `(${profile.addressProvincia})` : "",
    ]
      .filter(Boolean)
      .join(", "),
    doc: profile.documentType
      ? `${documentTypeLabels[profile.documentType as keyof typeof documentTypeLabels] ?? profile.documentType} n. ${profile.documentNumber ?? ""}`.trim()
      : "",
    cf: profile.codiceFiscaleCode ?? "",
  };
}

// ---------------------------------------------------------------------------
// Iscrizione anagrafica (residency registration at the Comune)
// ---------------------------------------------------------------------------
function buildResidencyKit(profile: Profile): StepKit {
  const id = identity(profile);
  const comune = profile.addressComune || profile.city;

  const { formFields, missing } = toFields([
    { label: "Tipo di dichiarazione", value: "Iscrizione anagrafica con provenienza dall'estero" },
    { label: "Cognome / Surname", value: profile.lastName, required: true },
    { label: "Nome / First name", value: profile.firstName, required: true },
    {
      label: "Data e luogo di nascita / Date & place of birth",
      value: [formatItalianDate(profile.dateOfBirth), id.birthPlace]
        .filter(Boolean)
        .join(" — "),
      required: true,
    },
    { label: "Cittadinanza / Citizenship", value: profile.nationality },
    { label: "Codice fiscale", value: id.cf, required: true },
    {
      label: "Nuovo indirizzo nel Comune / New address",
      value: [profile.addressStreet, profile.addressCap, comune]
        .filter(Boolean)
        .join(", "),
      required: true,
    },
    {
      label: "Titolo di occupazione dell'alloggio / Right to occupy",
      value: "",
      required: true,
      note: "Es. contratto di locazione registrato, atto di proprietà, ospitalità. Indica gli estremi. — e.g. registered lease, ownership deed, host declaration; provide the details.",
    },
    {
      label: "Permesso di soggiorno",
      value: profile.hasPermesso ? "Sì (allegare copia)" : "",
      note: profile.euStatus === "non_eu"
        ? "Obbligatorio per cittadini non-UE. — Required for non-EU citizens."
        : "Non richiesto per cittadini UE. — Not required for EU citizens.",
      required: profile.euStatus === "non_eu",
    },
  ]);

  const name = id.fullName || "[Nome e cognome]";
  const italian = `Oggetto: Dichiarazione di residenza — iscrizione anagrafica

Spett.le Ufficio Anagrafe del Comune di ${comune || "[Comune]"},

il/la sottoscritto/a ${name}, codice fiscale ${id.cf || "[codice fiscale]"}, chiede l'iscrizione anagrafica con residenza in ${[profile.addressStreet, profile.addressCap, comune].filter(Boolean).join(", ") || "[nuovo indirizzo]"}, con provenienza dall'estero.

In allegato trasmetto: modulo di dichiarazione di residenza compilato e firmato, copia del documento di identità${profile.euStatus === "non_eu" ? ", copia del permesso di soggiorno" : ""}, e documentazione del titolo di occupazione dell'alloggio.

Resto a disposizione per ogni verifica. Cordiali saluti,
${name}
${profile.contactEmail ?? "[la tua email]"}`;

  const english = `Subject: Declaration of residence — anagrafica registration

To the Registry Office (Anagrafe) of the Comune of ${comune || "[Comune]"},

I, ${name}, tax code ${id.cf || "[codice fiscale]"}, request registration of my residence at ${[profile.addressStreet, profile.addressCap, comune].filter(Boolean).join(", ") || "[new address]"}, arriving from abroad.

Attached: the completed and signed declaration-of-residence form, a copy of my ID${profile.euStatus === "non_eu" ? ", a copy of my permesso di soggiorno" : ""}, and proof of my right to occupy the dwelling.

Kind regards,
${name}`;

  const content: GeneratedKitContent = {
    formFields,
    email: {
      to: `[PEC dell'Ufficio Anagrafe del Comune di ${comune || "[Comune]"} — sul sito del Comune]`,
      subject: "Dichiarazione di residenza — iscrizione anagrafica",
      italian,
      english,
    },
    appointmentScript: {
      bring: [
        "The completed declaration-of-residence form, signed",
        "Your passport / ID (original + photocopy)",
        "Your Codice Fiscale",
        ...(profile.euStatus === "non_eu"
          ? ["Your permesso di soggiorno (or the request receipt)"]
          : []),
        "Proof of your right to occupy the home (lease, deed, or host declaration)",
      ],
      say: `At the Anagrafe say: «Buongiorno, vorrei presentare la dichiarazione di residenza. Ho compilato il modulo e allego i documenti.» ("Hello, I'd like to submit my declaration of residence; I filled the form and attach the documents.") Registration is free; a check of the address usually follows within 45 days.`,
    },
  };

  return {
    stepKey: "iscrizione_anagrafica",
    title: "Residency registration (iscrizione anagrafica)",
    form: "Dichiarazione di residenza (modello ministeriale)",
    channel: {
      method: "office_in_person_or_email",
      summary: `Submit the declaration of residence to the Anagrafe of the Comune of ${comune || "your comune"} — in person, by PEC/email, or by registered post (raccomandata A/R). It is free. Requires your Codice Fiscale first.`,
    },
    content,
    missing,
    source: "deterministic",
    generatedAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Tessera Sanitaria (enrolment in the SSN at the ASL)
// ---------------------------------------------------------------------------
function buildHealthCardKit(profile: Profile): StepKit {
  const id = identity(profile);
  const comune = profile.addressComune || profile.city;

  const { formFields, missing } = toFields([
    { label: "Richiesta", value: "Iscrizione al Servizio Sanitario Nazionale (SSN)" },
    { label: "Cognome e nome / Full name", value: id.fullName, required: true },
    { label: "Codice fiscale", value: id.cf, required: true },
    {
      label: "Residenza / Residence",
      value: [profile.addressStreet, profile.addressCap, comune]
        .filter(Boolean)
        .join(", "),
      required: true,
      note: "Richiede l'iscrizione anagrafica già effettuata. — Requires residency registration first.",
    },
    { label: "Cittadinanza / Citizenship", value: profile.nationality },
    {
      label: "Titolo di iscrizione / Basis of enrolment",
      value: reasonToEnrolmentBasis(profile.reason),
      note: "Es. lavoro, familiare, iscrizione volontaria. — e.g. employment, family, voluntary.",
    },
    {
      label: "Permesso di soggiorno",
      value: profile.hasPermesso ? "Sì (allegare copia)" : "",
      required: profile.euStatus === "non_eu",
      note: profile.euStatus === "non_eu"
        ? "Obbligatorio per non-UE. — Required for non-EU."
        : undefined,
    },
    {
      label: "Scelta del medico di base / GP choice",
      value: "",
      note: "Da indicare allo sportello ASL tra i medici disponibili. — Chosen at the ASL desk.",
    },
  ]);

  const name = id.fullName || "[Nome e cognome]";
  const italian = `Oggetto: Richiesta di iscrizione al Servizio Sanitario Nazionale

Spett.le ASL competente per il Comune di ${comune || "[Comune]"},

il/la sottoscritto/a ${name}, codice fiscale ${id.cf || "[codice fiscale]"}, residente in ${[profile.addressStreet, profile.addressCap, comune].filter(Boolean).join(", ") || "[indirizzo]"}, chiede l'iscrizione al Servizio Sanitario Nazionale e l'assegnazione del medico di base, con conseguente rilascio della Tessera Sanitaria.

In allegato: documento di identità, codice fiscale${profile.euStatus === "non_eu" ? ", permesso di soggiorno" : ""}, e certificato di residenza / autocertificazione.

Cordiali saluti,
${name}
${profile.contactEmail ?? "[la tua email]"}`;

  const english = `Subject: Request to enrol in the National Health Service (SSN)

To the ASL responsible for the Comune of ${comune || "[Comune]"},

I, ${name}, tax code ${id.cf || "[codice fiscale]"}, resident at ${[profile.addressStreet, profile.addressCap, comune].filter(Boolean).join(", ") || "[address]"}, request enrolment in the National Health Service and assignment of a GP, with issuance of the Tessera Sanitaria.

Attached: ID, Codice Fiscale${profile.euStatus === "non_eu" ? ", permesso di soggiorno" : ""}, and proof of residence.

Kind regards,
${name}`;

  const content: GeneratedKitContent = {
    formFields,
    email: {
      to: "[email/PEC della ASL competente per il tuo Comune — sul sito della Regione/ASL]",
      subject: "Richiesta di iscrizione al Servizio Sanitario Nazionale",
      italian,
      english,
    },
    appointmentScript: {
      bring: [
        "Your Codice Fiscale",
        "Your passport / ID",
        ...(profile.euStatus === "non_eu"
          ? ["Your permesso di soggiorno"]
          : ["Proof of EU health-cover status, if applicable"]),
        "Proof of residence (or self-declaration)",
      ],
      say: `At the ASL desk say: «Buongiorno, vorrei iscrivermi al Servizio Sanitario Nazionale e scegliere il medico di base.» ("Hello, I'd like to enrol in the National Health Service and choose a GP.") You'll pick a doctor and receive the Tessera Sanitaria.`,
    },
  };

  return {
    stepKey: "tessera_sanitaria",
    title: "Tessera Sanitaria (health card)",
    form: "Iscrizione al SSN presso la ASL",
    channel: {
      method: "office_in_person_or_email",
      summary: `Enrol at the ASL responsible for the Comune of ${comune || "your comune"}. Requires your Codice Fiscale and completed residency registration.`,
    },
    content,
    missing,
    source: "deterministic",
    generatedAt: new Date().toISOString(),
  };
}

function reasonToEnrolmentBasis(reason: Profile["reason"]): string {
  switch (reason) {
    case "work":
      return "Lavoro (subordinato/autonomo) — Employment";
    case "study":
      return "Studio (spesso iscrizione volontaria) — Study (often voluntary)";
    case "family":
      return "Familiare a carico — Family member";
    case "elective_residence":
      return "Residenza elettiva (iscrizione volontaria) — Elective residence (voluntary)";
    default:
      return "";
  }
}
