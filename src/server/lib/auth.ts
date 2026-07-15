import type { Request, Response, NextFunction } from "express";

/**
 * Guard for protected API routes. Rejects with 401 when there is no
 * authenticated session. Downstream handlers can rely on `req.session.userId`.
 */
export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!req.session.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  next();
}
