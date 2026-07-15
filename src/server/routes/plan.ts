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

/**
 * POST /api/plan/generate
 * Produce the ordered plan from the saved profile. Deterministic today (the
 * Codice Fiscale is always first); the AI generator plugs in here in a later
 * iteration, replacing buildMockPlan while keeping this contract.
 */
planRouter.post("/generate", async (req, res) => {
  const profileId =
    typeof req.body?.profileId === "string" ? req.body.profileId : null;
  if (!profileId) {
    return res.status(400).json({ error: "profileId is required" });
  }

  const [profile] = await db
    .select()
    .from(profiles)
    .where(
      and(
        eq(profiles.id, profileId),
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
