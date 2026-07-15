import { z } from "zod";

/**
 * Shared validation schemas + types used by both client and server.
 * The server validates request bodies with these; the client reuses the
 * inferred types for its wizard state and API calls.
 */

export const euStatusValues = ["eu", "non_eu"] as const;
export const locationValues = ["in_italy", "abroad"] as const;
export const reasonValues = [
  "work",
  "study",
  "family",
  "elective_residence",
] as const;

// --- Auth (Phase 2) ---
export const credentialsSchema = z.object({
  email: z.string().email("Enter a valid email").max(255),
  password: z.string().min(8, "Password must be at least 8 characters").max(200),
});
export type Credentials = z.infer<typeof credentialsSchema>;

/** Current authenticated user as exposed to the client (never the hash). */
export interface AuthUser {
  id: string;
  email: string;
}

export const familyMemberSchema = z.object({
  relationship: z.string().min(1).max(60),
  nationality: z.string().min(1).max(60),
});

/** Body accepted by POST /api/profile — the intake wizard output. */
export const profileInputSchema = z.object({
  nationality: z.string().min(1, "Nationality is required").max(60),
  euStatus: z.enum(euStatusValues),
  location: z.enum(locationValues),
  reason: z.enum(reasonValues),
  city: z.string().min(1, "City / comune is required").max(120),
  hasPermesso: z.boolean(),
  hasCodiceFiscale: z.boolean(),
  familyMembers: z.array(familyMemberSchema).max(20).default([]),
});

export type ProfileInput = z.infer<typeof profileInputSchema>;
export type FamilyMemberInput = z.infer<typeof familyMemberSchema>;

/** Shape returned by GET /api/plan/:profileId (mock data in Phase 1). */
export interface PlanStepView {
  stepKey: string;
  order: number;
  title: string;
  description: string;
  dependsOn: string[]; // stepKeys this step requires
  status: "not_started" | "in_progress" | "completed";
  /** Whether this step is the product's primary focus (Codice Fiscale). */
  primary?: boolean;
}

export interface PlanView {
  profileId: string;
  title: string;
  steps: PlanStepView[];
}

// --- Codice Fiscale form (Phase 3) ---
export const sexValues = ["M", "F"] as const;
export const documentTypeValues = ["passport", "id_card", "permesso"] as const;

export const documentTypeLabels: Record<
  (typeof documentTypeValues)[number],
  string
> = {
  passport: "Passport",
  id_card: "National ID card",
  permesso: "Permesso di soggiorno",
};

/**
 * The personal identity data required to fill Modello AA4/8 (the official
 * Agenzia delle Entrate form for obtaining a Codice Fiscale). Collected in the
 * dedicated Codice Fiscale form, then persisted onto the profile.
 */
export const codiceFiscaleInputSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(120),
  lastName: z.string().min(1, "Last name is required").max(120),
  sex: z.enum(sexValues),
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use the date picker (YYYY-MM-DD)"),
  countryOfBirth: z.string().min(1, "Country of birth is required").max(80),
  cityOfBirth: z.string().min(1, "City/town of birth is required").max(120),
  provinceOfBirth: z.string().max(60).optional().default(""),
  addressComune: z.string().min(1, "Comune of residence is required").max(120),
  addressProvincia: z.string().max(60).optional().default(""),
  addressStreet: z
    .string()
    .min(1, "Street address (via + civico) is required")
    .max(200),
  addressCap: z
    .string()
    .regex(/^\d{5}$/, "CAP must be 5 digits")
    .optional()
    .or(z.literal("")),
  contactEmail: z.string().email("Enter a valid email").max(255),
  documentType: z.enum(documentTypeValues),
  documentNumber: z
    .string()
    .min(1, "Document number is required")
    .max(60),
  /** The 16-character Codice Fiscale, once obtained — used by later steps. */
  codiceFiscaleCode: z
    .string()
    .max(16)
    .optional()
    .or(z.literal("")),
});

export type CodiceFiscaleInput = z.infer<typeof codiceFiscaleInputSchema>;

/** A single field to transcribe onto the official form. */
export interface FormField {
  label: string;
  value: string;
  note?: string;
}

/** The generated artifact for a step: form fields + email + appointment script. */
export interface GeneratedKitContent {
  formFields: FormField[];
  email: { to?: string; subject: string; italian: string; english: string };
  appointmentScript: { bring: string[]; say: string };
}

/** Response of POST /api/steps/:stepKey/generate. */
export interface StepKit {
  stepKey: string;
  title: string;
  /** Official form/reference this kit targets, e.g. "Modello AA4/8". */
  form: string;
  /** How to submit: in-person / email / consulate, with official links. */
  channel: {
    method: "office_in_person_or_email" | "consulate";
    summary: string;
    officialFormUrl?: string;
    officeFinderUrl?: string;
  };
  content: GeneratedKitContent;
  /** Fields still needed before the request can be submitted. */
  missing: string[];
  source: "ai" | "deterministic";
  generatedAt: string;
}

/** Dashboard payload (Phase 2). */
export interface DashboardPlanSummary {
  profileId: string;
  title: string;
  city: string;
  reason: (typeof reasonValues)[number];
  createdAt: string;
}

export interface DashboardDocumentSummary {
  id: string;
  stepKey: string;
  createdAt: string;
}

export interface DashboardView {
  plans: DashboardPlanSummary[];
  documents: DashboardDocumentSummary[];
}

/** Human-readable labels for enum values (English). */
export const reasonLabels: Record<(typeof reasonValues)[number], string> = {
  work: "Work",
  study: "Study",
  family: "Family",
  elective_residence: "Elective residence",
};
