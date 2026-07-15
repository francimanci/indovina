import { Router } from "express";
import { and, eq } from "drizzle-orm";
import { db } from "@server/db";
import { profiles } from "@shared/schema";
import type { PlanView } from "@shared/types";
import { buildMockPlan } from "@server/lib/mockPlan";
import { requireAuth } from "@server/lib/auth";

export const planRouter = Router();

planRouter.use(requireAuth);

/**
 * GET /api/plan/:profileId
 * Phase 1: returns a hardcoded, sequenced plan derived from the saved profile.
 * Phase 2: only the profile owner may load it.
 * Phase 3 replaces buildMockPlan with AI generation persisted to plan_steps.
 */
planRouter.get("/:profileId", async (req, res) => {
  const [profile] = await db
    .select()
    .from(profiles)
    .where(
      and(
        eq(profiles.id, req.params.profileId),
        eq(profiles.userId, req.session.userId!),
      ),
    )
    .limit(1);

  if (!profile) return res.status(404).json({ error: "Profile not found" });

  const plan: PlanView = {
    profileId: profile.id,
    title: "Your Italian bureaucracy plan",
    steps: buildMockPlan(profile),
  };

  return res.json(plan);
});
