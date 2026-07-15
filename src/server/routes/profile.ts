import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "@server/db";
import { profiles } from "@shared/schema";
import { profileInputSchema } from "@shared/types";

export const profileRouter = Router();

/**
 * POST /api/profile
 * Create a profile from the intake wizard. In Phase 1 there is no auth, so
 * profiles are anonymous (userId null) and the created id is returned to the
 * client to load the plan. Phase 2 links the profile to the logged-in user.
 */
profileRouter.post("/", async (req, res) => {
  const parsed = profileInputSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid profile",
      details: parsed.error.flatten().fieldErrors,
    });
  }

  const [row] = await db
    .insert(profiles)
    .values({ ...parsed.data })
    .returning();

  return res.status(201).json({ id: row.id });
});

/**
 * GET /api/profile/:id
 */
profileRouter.get("/:id", async (req, res) => {
  const [row] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, req.params.id))
    .limit(1);

  if (!row) return res.status(404).json({ error: "Profile not found" });
  return res.json(row);
});
