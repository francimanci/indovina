import { Router } from "express";
import { and, eq } from "drizzle-orm";
import { db } from "@server/db";
import { profiles } from "@shared/schema";
import { profileInputSchema } from "@shared/types";
import { requireAuth } from "@server/lib/auth";

export const profileRouter = Router();

// All profile routes require authentication (Phase 2).
profileRouter.use(requireAuth);

/**
 * POST /api/profile
 * Create or update the authenticated user's profile. Profiles are 1:1 with a
 * user, so a second submission updates the existing row rather than creating a
 * duplicate. Returns the profile id used to route to the plan.
 */
profileRouter.post("/", async (req, res) => {
  const parsed = profileInputSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid profile",
      details: parsed.error.flatten().fieldErrors,
    });
  }

  const userId = req.session.userId!;

  const [existing] = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(eq(profiles.userId, userId))
    .limit(1);

  if (existing) {
    const [row] = await db
      .update(profiles)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(profiles.id, existing.id))
      .returning({ id: profiles.id });
    return res.json({ id: row.id });
  }

  const [row] = await db
    .insert(profiles)
    .values({ ...parsed.data, userId })
    .returning({ id: profiles.id });
  return res.status(201).json({ id: row.id });
});

/**
 * GET /api/profile/:id — only the owner may read it.
 */
profileRouter.get("/:id", async (req, res) => {
  const [row] = await db
    .select()
    .from(profiles)
    .where(
      and(
        eq(profiles.id, req.params.id),
        eq(profiles.userId, req.session.userId!),
      ),
    )
    .limit(1);

  if (!row) return res.status(404).json({ error: "Profile not found" });
  return res.json(row);
});
