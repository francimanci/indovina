import { Router } from "express";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@server/db";
import { profiles, generatedDocuments } from "@shared/schema";
import type { Profile } from "@shared/schema";
import type { GeneratedKitContent, StepKit } from "@shared/types";
import { requireAuth } from "@server/lib/auth";
import { buildStepKit, stepPromptFile } from "@server/lib/stepKits";
import { buildStepPdf } from "@server/lib/pdf";
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
 * Build the kit for a step. Deterministic-first (correct official mapping, no
 * hallucinated fields). If an Anthropic key is configured, the model refines the
 * artifact content; the form identity, channel and `missing` list are always
 * computed deterministically.
 */
async function buildKit(stepKey: string, profile: Profile): Promise<StepKit | null> {
  const base = buildStepKit(stepKey, profile);
  if (!base) return null;

  if (isAiEnabled) {
    try {
      const aiContent = await generateStructured(
        loadPrompt(stepPromptFile[stepKey] ?? "step.md"),
        `Step: ${stepKey} (${base.title})\nTarget form: ${base.form}\nApplicant profile (JSON):\n${JSON.stringify(profileForPrompt(profile), null, 2)}`,
        kitContentSchema,
      );
      return { ...base, content: aiContent, source: "ai" };
    } catch (err) {
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
    reason: p.reason,
    hasPermesso: p.hasPermesso,
    codiceFiscaleCode: p.codiceFiscaleCode,
    addressComune: p.addressComune ?? p.city,
    addressProvincia: p.addressProvincia,
    addressStreet: p.addressStreet,
    addressCap: p.addressCap,
    contactEmail: p.contactEmail,
    documentType: p.documentType,
    documentNumber: p.documentNumber,
  };
}

/**
 * POST /api/steps/:stepKey/generate — generate (and persist) the kit.
 */
stepsRouter.post("/:stepKey/generate", async (req, res) => {
  const profile = await loadProfile(req.session.userId!);
  if (!profile) return res.status(404).json({ error: "Profile not found" });

  const kit = await buildKit(req.params.stepKey, profile);
  if (!kit) {
    return res
      .status(400)
      .json({ error: `Generation is not available for step "${req.params.stepKey}".` });
  }

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
 * GET /api/steps/:stepKey — the previously generated kit (404 if none).
 */
stepsRouter.get("/:stepKey", async (req, res) => {
  const profile = await loadProfile(req.session.userId!);
  if (!profile) return res.status(404).json({ error: "Profile not found" });

  const base = buildStepKit(req.params.stepKey, profile);
  if (!base) return res.status(404).json({ error: "Unknown step" });

  const [doc] = await db
    .select()
    .from(generatedDocuments)
    .where(
      and(
        eq(generatedDocuments.userId, profile.userId!),
        eq(generatedDocuments.stepKey, req.params.stepKey),
      ),
    )
    .orderBy(desc(generatedDocuments.createdAt))
    .limit(1);

  if (!doc) return res.status(404).json({ error: "Not generated yet" });

  const kit: StepKit = {
    ...base,
    content: doc.content as GeneratedKitContent,
    generatedAt: doc.createdAt.toISOString(),
  };
  return res.json(kit);
});

/**
 * GET /api/steps/:stepKey/pdf — printable pre-filled data sheet for the step.
 */
stepsRouter.get("/:stepKey/pdf", async (req, res) => {
  const profile = await loadProfile(req.session.userId!);
  if (!profile) return res.status(404).json({ error: "Profile not found" });

  const kit = buildStepKit(req.params.stepKey, profile);
  if (!kit) return res.status(404).json({ error: "Unknown step" });

  const pdf = await buildStepPdf(kit);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `inline; filename="buddy-${kit.stepKey}.pdf"`,
  );
  return res.end(Buffer.from(pdf));
});
