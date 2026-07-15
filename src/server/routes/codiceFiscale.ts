import { Router } from "express";
import { and, eq } from "drizzle-orm";
import { db } from "@server/db";
import { profiles } from "@shared/schema";
import { codiceFiscaleInputSchema } from "@shared/types";
import { requireAuth } from "@server/lib/auth";

export const codiceFiscaleRouter = Router();
codiceFiscaleRouter.use(requireAuth);

async function ownedProfile(userId: string, profileId: string) {
  const [row] = await db
    .select()
    .from(profiles)
    .where(and(eq(profiles.id, profileId), eq(profiles.userId, userId)))
    .limit(1);
  return row ?? null;
}

/**
 * GET /api/codice-fiscale/:profileId
 * Return the personal-identity fields already saved (to prefill the form).
 */
codiceFiscaleRouter.get("/:profileId", async (req, res) => {
  const profile = await ownedProfile(req.session.userId!, req.params.profileId);
  if (!profile) return res.status(404).json({ error: "Profile not found" });

  return res.json({
    firstName: profile.firstName ?? "",
    lastName: profile.lastName ?? "",
    sex: profile.sex ?? "",
    dateOfBirth: profile.dateOfBirth ?? "",
    countryOfBirth: profile.countryOfBirth ?? "",
    cityOfBirth: profile.cityOfBirth ?? "",
    provinceOfBirth: profile.provinceOfBirth ?? "",
    addressComune: profile.addressComune ?? profile.city ?? "",
    addressProvincia: profile.addressProvincia ?? "",
    addressStreet: profile.addressStreet ?? "",
    addressCap: profile.addressCap ?? "",
    contactEmail: profile.contactEmail ?? "",
    documentType: profile.documentType ?? "",
    documentNumber: profile.documentNumber ?? "",
  });
});

/**
 * POST /api/codice-fiscale/:profileId
 * Save the identity fields required by Modello AA4/8 onto the profile.
 */
codiceFiscaleRouter.post("/:profileId", async (req, res) => {
  const profile = await ownedProfile(req.session.userId!, req.params.profileId);
  if (!profile) return res.status(404).json({ error: "Profile not found" });

  const parsed = codiceFiscaleInputSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid form",
      details: parsed.error.flatten().fieldErrors,
    });
  }
  const d = parsed.data;

  await db
    .update(profiles)
    .set({
      firstName: d.firstName,
      lastName: d.lastName,
      sex: d.sex,
      dateOfBirth: d.dateOfBirth,
      countryOfBirth: d.countryOfBirth,
      cityOfBirth: d.cityOfBirth,
      provinceOfBirth: d.provinceOfBirth ?? "",
      addressComune: d.addressComune,
      addressProvincia: d.addressProvincia ?? "",
      addressStreet: d.addressStreet,
      addressCap: d.addressCap ?? "",
      contactEmail: d.contactEmail,
      documentType: d.documentType,
      documentNumber: d.documentNumber,
      updatedAt: new Date(),
    })
    .where(eq(profiles.id, profile.id));

  return res.json({ ok: true });
});
