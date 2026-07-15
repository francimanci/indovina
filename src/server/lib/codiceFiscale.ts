import type { Profile } from "@shared/schema";
import type {
  GeneratedKitContent,
  StepKit,
  FormField,
} from "@shared/types";
import { documentTypeLabels } from "@shared/types";

/**
 * Deterministic builder for the Codice Fiscale request kit.
 *
 * The Codice Fiscale is obtained with the official Agenzia delle Entrate form
 * **Modello AA4/8** ("Domanda di attribuzione codice fiscale…"). Because that is
 * a fixed official form, we map the user's data onto it deterministically rather
 * than letting a model invent field names — matching Buddy's hard rule: never
 * invent official-form content; if a field is missing, say what is needed.
 *
 * Submission channel depends on where the person is:
 *  - in Italy  → any Agenzia delle Entrate territorial office, in person or by
 *                PEC/email (the request + AA4/8 + ID).
 *  - abroad    → the competent Italian consulate, which requests the CF for you.
 *
 * We never hardcode a specific office/consulate email (it varies by comune and
 * country) — the email carries a clearly-marked placeholder and instructions to
 * find the correct address.
 */

const OFFICIAL_SITE = "https://www.agenziaentrate.gov.it";

type Field = {
  label: string;
  value: string | null | undefined;
  note?: string;
  /** required to submit */
  required?: boolean;
};

export function buildCodiceFiscaleKit(profile: Profile): StepKit {
  const abroad = profile.location === "abroad";
  const nonEu = profile.euStatus === "non_eu";

  const fullName = [profile.firstName, profile.lastName]
    .filter(Boolean)
    .join(" ");
  const birthPlace = [profile.cityOfBirth, profile.countryOfBirth]
    .filter(Boolean)
    .join(", ");
  const address = [
    profile.addressStreet,
    [profile.addressCap, profile.addressComune].filter(Boolean).join(" "),
    profile.addressProvincia ? `(${profile.addressProvincia})` : "",
  ]
    .filter(Boolean)
    .join(", ");
  const docLabel = profile.documentType
    ? documentTypeLabels[
        profile.documentType as keyof typeof documentTypeLabels
      ] ?? profile.documentType
    : "";

  // ---- Modello AA4/8 field mapping (Quadro A — attribuzione) --------------
  const fields: Field[] = [
    { label: "Tipo di richiesta", value: "Attribuzione codice fiscale (nuovo)" },
    { label: "Cognome / Surname", value: profile.lastName, required: true },
    { label: "Nome / First name", value: profile.firstName, required: true },
    {
      label: "Sesso / Sex",
      value: profile.sex === "M" ? "M" : profile.sex === "F" ? "F" : "",
      required: true,
    },
    {
      label: "Data di nascita / Date of birth",
      value: formatItalianDate(profile.dateOfBirth),
      required: true,
    },
    {
      label: "Comune (o Stato estero) di nascita / Place of birth",
      value: birthPlace,
      required: true,
    },
    {
      label: "Provincia di nascita / Province of birth",
      value: profile.provinceOfBirth,
      note: "Solo se nato/a in Italia; lasciare vuoto se nato/a all'estero. — Only if born in Italy.",
    },
    { label: "Cittadinanza / Citizenship", value: profile.nationality },
    {
      label: "Comune di domicilio in Italia / Comune of residence",
      value: profile.addressComune,
      note: abroad
        ? "Se non hai ancora un domicilio in Italia, indicalo appena disponibile. — Provide once you have an Italian address."
        : undefined,
      required: !abroad,
    },
    {
      label: "Provincia / Province",
      value: profile.addressProvincia,
    },
    {
      label: "Indirizzo (via e numero civico) / Street and number",
      value: profile.addressStreet,
      required: !abroad,
    },
    { label: "CAP / Postal code", value: profile.addressCap },
    {
      label: "Documento di riconoscimento / Identity document",
      value: docLabel ? `${docLabel} n. ${profile.documentNumber ?? ""}`.trim() : "",
      required: true,
      note: nonEu
        ? "Allega copia del passaporto e del permesso di soggiorno (o della ricevuta di richiesta). — Attach passport + permesso di soggiorno (or its receipt)."
        : "Allega copia di un documento d'identità valido. — Attach a valid ID.",
    },
    {
      label: "Email di contatto / Contact email",
      value: profile.contactEmail,
      required: true,
    },
  ];

  const formFields: FormField[] = fields.map((f) => ({
    label: f.label,
    value: (f.value ?? "").toString().trim(),
    note:
      f.note ??
      (f.required && !isFilled(f.value)
        ? "Campo obbligatorio: da compilare. — Required: please complete."
        : undefined),
  }));

  const missing = fields
    .filter((f) => f.required && !isFilled(f.value))
    .map((f) => f.label);

  // ---- Submission email --------------------------------------------------
  const email = abroad
    ? buildConsulateEmail(profile, fullName, birthPlace, address, docLabel)
    : buildOfficeEmail(profile, fullName, birthPlace, address, docLabel, nonEu);

  // ---- Appointment / what-to-bring script --------------------------------
  const appointmentScript = buildScript(abroad, nonEu);

  const content: GeneratedKitContent = { formFields, email, appointmentScript };

  return {
    stepKey: "codice_fiscale",
    title: "Codice Fiscale request",
    form: "Modello AA4/8 — Domanda di attribuzione del codice fiscale",
    channel: abroad
      ? {
          method: "consulate",
          summary:
            "You are abroad: submit the request through the Italian consulate responsible for your country of residence. The consulate forwards it to the Agenzia delle Entrate. It is free of charge.",
          officialFormUrl: OFFICIAL_SITE,
        }
      : {
          method: "office_in_person_or_email",
          summary:
            "You are in Italy: submit Modello AA4/8 to any Agenzia delle Entrate territorial office — in person, or by PEC/email to the competent office — together with a copy of your ID. It is free of charge and usually issued on the spot.",
          officialFormUrl: OFFICIAL_SITE,
          officeFinderUrl: OFFICIAL_SITE,
        },
    content,
    missing,
    source: "deterministic",
    generatedAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
function buildOfficeEmail(
  profile: Profile,
  fullName: string,
  birthPlace: string,
  address: string,
  docLabel: string,
  nonEu: boolean,
): GeneratedKitContent["email"] {
  const name = fullName || "[Nome e cognome]";
  const dob = formatItalianDate(profile.dateOfBirth) || "[data di nascita]";
  const doc =
    docLabel && profile.documentNumber
      ? `${docLabel} n. ${profile.documentNumber}`
      : "[documento di identità]";
  const attachments = nonEu
    ? "il Modello AA4/8 compilato, copia del passaporto e copia del permesso di soggiorno (o della ricevuta di richiesta)"
    : "il Modello AA4/8 compilato e copia di un documento d'identità valido";

  const italian = `Oggetto: Richiesta di attribuzione del codice fiscale

Spett.le Ufficio,

il/la sottoscritto/a ${name}, nato/a a ${birthPlace || "[luogo di nascita]"} il ${dob}, cittadinanza ${profile.nationality}, ${address ? `domiciliato/a in ${address}` : "attualmente in fase di registrazione del domicilio in Italia"}, identificato/a tramite ${doc}, chiede l'attribuzione del codice fiscale ai sensi della normativa vigente.

In allegato trasmetto ${attachments}.

Chiedo cortesemente di ricevere il certificato di attribuzione del codice fiscale a questo indirizzo email: ${profile.contactEmail ?? "[la tua email]"}.

Resto a disposizione per ogni ulteriore documento necessario.

Cordiali saluti,
${name}
${profile.contactEmail ?? "[la tua email]"}`;

  const english = `Subject: Request for attribution of the Codice Fiscale (Italian tax code)

To the Office,

I, ${name}, born in ${birthPlace || "[place of birth]"} on ${dob}, citizenship ${profile.nationality}, ${address ? `residing at ${address}` : "currently registering my address in Italy"}, identified by ${doc}, request the attribution of the Codice Fiscale under the applicable rules.

Attached you will find ${nonEu ? "the completed Modello AA4/8, a copy of my passport, and a copy of my permesso di soggiorno (or its request receipt)" : "the completed Modello AA4/8 and a copy of a valid ID"}.

Please send the certificate of attribution of the Codice Fiscale to this email address: ${profile.contactEmail ?? "[your email]"}.

I remain available for any further document required.

Kind regards,
${name}`;

  return {
    to: "[PEC o email dell'ufficio Agenzia delle Entrate competente — trova l'ufficio su agenziaentrate.gov.it]",
    subject: "Richiesta di attribuzione del codice fiscale",
    italian,
    english,
  };
}

function buildConsulateEmail(
  profile: Profile,
  fullName: string,
  birthPlace: string,
  address: string,
  docLabel: string,
): GeneratedKitContent["email"] {
  const name = fullName || "[Nome e cognome]";
  const dob = formatItalianDate(profile.dateOfBirth) || "[data di nascita]";
  const doc =
    docLabel && profile.documentNumber
      ? `${docLabel} n. ${profile.documentNumber}`
      : "[documento di identità]";

  const italian = `Oggetto: Richiesta di attribuzione del codice fiscale tramite Consolato

Spett.le Consolato,

il/la sottoscritto/a ${name}, nato/a a ${birthPlace || "[luogo di nascita]"} il ${dob}, cittadinanza ${profile.nationality}, residente all'estero ${address ? `(recapito: ${address})` : ""}, chiede l'attribuzione del codice fiscale italiano tramite codesto Consolato.

In allegato trasmetto il Modello AA4/8 compilato e copia del mio ${doc}.

Chiedo di ricevere il codice fiscale a questo indirizzo email: ${profile.contactEmail ?? "[la tua email]"}.

Cordiali saluti,
${name}
${profile.contactEmail ?? "[la tua email]"}`;

  const english = `Subject: Request for the Italian Codice Fiscale through the Consulate

To the Consulate,

I, ${name}, born in ${birthPlace || "[place of birth]"} on ${dob}, citizenship ${profile.nationality}, resident abroad ${address ? `(contact: ${address})` : ""}, request the attribution of the Italian Codice Fiscale through your Consulate.

Attached you will find the completed Modello AA4/8 and a copy of my ${doc}.

Please send the Codice Fiscale to this email address: ${profile.contactEmail ?? "[your email]"}.

Kind regards,
${name}`;

  return {
    to: "[email del Consolato italiano competente per il tuo Paese di residenza]",
    subject: "Richiesta di attribuzione del codice fiscale tramite Consolato",
    italian,
    english,
  };
}

function buildScript(
  abroad: boolean,
  nonEu: boolean,
): GeneratedKitContent["appointmentScript"] {
  const bring: string[] = [
    "A valid passport or national ID (original + a photocopy)",
    "The completed Modello AA4/8 (printed and signed)",
    "This pre-filled data sheet, to copy from",
  ];
  if (nonEu) {
    bring.splice(
      1,
      0,
      "Your permesso di soggiorno — or the receipt of your application, if still pending",
    );
  }
  if (!abroad) {
    bring.push("Proof of your Italian address, if you already have one");
  }

  const say = abroad
    ? "Ask the consulate: «Vorrei richiedere il codice fiscale. Ho compilato il Modello AA4/8 e allego il mio documento.» (\"I would like to request the Codice Fiscale. I have filled in Modello AA4/8 and attach my ID.\")"
    : "At the counter, say: «Buongiorno, vorrei richiedere il codice fiscale. Ho già compilato il Modello AA4/8 e ho con me il documento di identità.» (\"Hello, I would like to request the Codice Fiscale. I have already filled in Modello AA4/8 and I have my ID with me.\") The certificate is normally issued immediately, free of charge.";

  return { bring, say };
}

// ---------------------------------------------------------------------------
export function isFilled(v: string | null | undefined): boolean {
  return typeof v === "string" && v.trim().length > 0;
}

export function formatItalianDate(iso: string | null | undefined): string {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}
