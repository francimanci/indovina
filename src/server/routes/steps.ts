import { Router } from "express";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@server/db";
import { profiles, generatedDocuments } from "@shared/schema";
import type { Profile } from "@shared/schema";
import type { GeneratedKitContent, StepKit } from "@shared/types";
import { requireAuth } from "@server/lib/auth";
import { buildCodiceFiscaleKit } from "@server/lib/codiceFiscale";
import {
  isAiEnabled,
  loadPrompt,
  generateStructured,
} from "@server/ai/anthropic";

export const stepsRouter = Router();
stepsRouter.use(requireAuth);

// zod schema for AI-generated kit content (validated, retried once — see anthropic.ts)
const kitContentSchema: z.ZodType<GeneratedKitContent> = z.object({
  formFields: z
    .array(
      z.object({
        label: z.string(),
        value: z.string(),
        note: z.string().optional(),
      }),
    )
    .min(1),
  email: z.object({
    to: z.string().optional(),
    subject: z.string().min(1),
    italian: z.string().min(1),
    english: z.string().min(1),
  }),
  appointmentScript: z.object({
    bring: z.array(z.string()).min(1),
    say: z.string().min(1),
  }),
});

async function loadProfile(userId: string): Promise<Profile | null> {
  const [row] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, userId))
    .limit(1);
  return row ?? null;
}

/**
 * Build the kit for a step. The Codice Fiscale kit is deterministic-first
 * (correct Modello AA4/8 mapping, no hallucinated fields). If an Anthropic key
 * is configured, we let the model refine the artifact content, but the channel,
 * form identity and `missing` list are always computed deterministically.
 */
async function buildKit(stepKey: string, profile: Profile): Promise<StepKit | null> {
  if (stepKey !== "codice_fiscale") return null;

  const base = buildCodiceFiscaleKit(profile);

  if (isAiEnabled) {
    try {
      const aiContent = await generateStructured(
        loadPrompt("codice-fiscale.md"),
        `Applicant profile (JSON):\n${JSON.stringify(profileForPrompt(profile), null, 2)}`,
        kitContentSchema,
      );
      return { ...base, content: aiContent, source: "ai" };
    } catch (err) {
      // Deterministic builder is correct on its own — fall back rather than fail.
      console.error("AI kit generation failed, using deterministic kit:", err);
    }
  }
  return base;
}

function profileForPrompt(p: Profile) {
  return {
    firstName: p.firstName,
    lastName: p.lastName,
    sex: p.sex,
    dateOfBirth: p.dateOfBirth,
    countryOfBirth: p.countryOfBirth,
    cityOfBirth: p.cityOfBirth,
    provinceOfBirth: p.provinceOfBirth,
    nationality: p.nationality,
    euStatus: p.euStatus,
    location: p.location,
    hasPermesso: p.hasPermesso,
    addressComune: p.addressComune,
    addressProvincia: p.addressProvincia,
    addressStreet: p.addressStreet,
    addressCap: p.addressCap,
    contactEmail: p.contactEmail,
    documentType: p.documentType,
    documentNumber: p.documentNumber,
  };
}

/**
 * POST /api/steps/:stepKey/generate
 * Generate (and persist) the kit for the authenticated user's profile.
 */
stepsRouter.post("/:stepKey/generate", async (req, res) => {
  const profile = await loadProfile(req.session.userId!);
  if (!profile) return res.status(404).json({ error: "Profile not found" });

  const kit = await buildKit(req.params.stepKey, profile);
  if (!kit) {
    return res.status(400).json({
      error: `Generation is not available yet for step "${req.params.stepKey}".`,
    });
  }

  // Persist as the current document for (user, stepKey).
  await db
    .delete(generatedDocuments)
    .where(
      and(
        eq(generatedDocuments.userId, profile.userId!),
        eq(generatedDocuments.stepKey, kit.stepKey),
      ),
    );
  await db.insert(generatedDocuments).values({
    userId: profile.userId!,
    stepKey: kit.stepKey,
    content: kit.content,
  });

  return res.json(kit);
});

/**
 * GET /api/steps/:stepKey
 * Return the previously generated kit (404 if none). Channel / form / missing
 * are recomputed from the current profile so they stay accurate.
 */
stepsRouter.get("/:stepKey", async (req, res) => {
  const profile = await loadProfile(req.session.userId!);
  if (!profile) return res.status(404).json({ error: "Profile not found" });
  if (req.params.stepKey !== "codice_fiscale") {
    return res.status(404).json({ error: "No document" });
  }

  const [doc] = await db
    .select()
    .from(generatedDocuments)
    .where(
      and(
        eq(generatedDocuments.userId, profile.userId!),
        eq(generatedDocuments.stepKey, "codice_fiscale"),
      ),
    )
    .orderBy(desc(generatedDocuments.createdAt))
    .limit(1);

  if (!doc) return res.status(404).json({ error: "Not generated yet" });

  const base = buildCodiceFiscaleKit(profile);
  const kit: StepKit = {
    ...base,
    content: doc.content as GeneratedKitContent,
    generatedAt: doc.createdAt.toISOString(),
  };
  return res.json(kit);
});
