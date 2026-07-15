import { Router } from "express";
import argon2 from "argon2";
import { eq } from "drizzle-orm";
import { db } from "@server/db";
import { users } from "@shared/schema";
import { credentialsSchema, type AuthUser } from "@shared/types";
import { requireAuth } from "@server/lib/auth";

export const authRouter = Router();

/**
 * POST /api/auth/signup — create an account and start a session.
 */
authRouter.post("/signup", async (req, res) => {
  const parsed = credentialsSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid credentials",
      details: parsed.error.flatten().fieldErrors,
    });
  }
  const email = parsed.data.email.trim().toLowerCase();

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (existing) {
    return res.status(409).json({ error: "An account with that email already exists" });
  }

  const passwordHash = await argon2.hash(parsed.data.password);
  const [user] = await db
    .insert(users)
    .values({ email, passwordHash })
    .returning({ id: users.id, email: users.email });

  req.session.userId = user.id;
  const authUser: AuthUser = { id: user.id, email: user.email };
  return res.status(201).json(authUser);
});

/**
 * POST /api/auth/login — verify credentials and start a session.
 * Uses a generic error to avoid leaking whether an email exists.
 */
authRouter.post("/login", async (req, res) => {
  const parsed = credentialsSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid credentials" });
  }
  const email = parsed.data.email.trim().toLowerCase();

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  const invalid = () =>
    res.status(401).json({ error: "Incorrect email or password" });

  if (!user) {
    // Perform a dummy hash to keep timing roughly constant.
    await argon2.hash(parsed.data.password).catch(() => undefined);
    return invalid();
  }

  const ok = await argon2.verify(user.passwordHash, parsed.data.password).catch(
    () => false,
  );
  if (!ok) return invalid();

  req.session.userId = user.id;
  const authUser: AuthUser = { id: user.id, email: user.email };
  return res.json(authUser);
});

/**
 * POST /api/auth/logout — destroy the session.
 */
authRouter.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: "Could not log out" });
    }
    res.clearCookie("buddy.sid");
    return res.json({ ok: true });
  });
});

/**
 * GET /api/auth/me — current user, or 401 if not logged in.
 */
authRouter.get("/me", requireAuth, async (req, res) => {
  const [user] = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(eq(users.id, req.session.userId!))
    .limit(1);

  if (!user) {
    // Session references a deleted user — clear it.
    req.session.destroy(() => undefined);
    return res.status(401).json({ error: "Not authenticated" });
  }
  const authUser: AuthUser = user;
  return res.json(authUser);
});
