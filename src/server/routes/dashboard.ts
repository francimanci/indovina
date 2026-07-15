import { Router } from "express";
import { desc, eq } from "drizzle-orm";
import { db } from "@server/db";
import { profiles, generatedDocuments } from "@shared/schema";
import type { DashboardView } from "@shared/types";
import { requireAuth } from "@server/lib/auth";

export const dashboardRouter = Router();

dashboardRouter.use(requireAuth);

/**
 * GET /api/dashboard — the user's saved plans and generated documents.
 *
 * Phase 2: plans are still derived from the profile (mock steps), so each
 * profile surfaces as one openable plan. Generated documents are empty until
 * Phase 3 persists them.
 */
dashboardRouter.get("/", async (req, res) => {
  const userId = req.session.userId!;

  const profileRows = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, userId))
    .orderBy(desc(profiles.createdAt));

  const docRows = await db
    .select({
      id: generatedDocuments.id,
      stepKey: generatedDocuments.stepKey,
      createdAt: generatedDocuments.createdAt,
    })
    .from(generatedDocuments)
    .where(eq(generatedDocuments.userId, userId))
    .orderBy(desc(generatedDocuments.createdAt));

  const view: DashboardView = {
    plans: profileRows.map((p) => ({
      profileId: p.id,
      title: "Your Italian bureaucracy plan",
      city: p.city,
      reason: p.reason,
      createdAt: p.createdAt.toISOString(),
    })),
    documents: docRows.map((d) => ({
      id: d.id,
      stepKey: d.stepKey,
      createdAt: d.createdAt.toISOString(),
    })),
  };

  return res.json(view);
});
