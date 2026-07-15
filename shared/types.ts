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

/** Human-readable labels for enum values (English). */
export const reasonLabels: Record<(typeof reasonValues)[number], string> = {
  work: "Work",
  study: "Study",
  family: "Family",
  elective_residence: "Elective residence",
};
