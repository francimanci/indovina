import express from "express";
import { env, isDev } from "@server/env";
import { sessionMiddleware } from "@server/lib/session";
import { authRouter } from "@server/routes/auth";
import { profileRouter } from "@server/routes/profile";
import { planRouter } from "@server/routes/plan";
import { dashboardRouter } from "@server/routes/dashboard";
import { stepsRouter } from "@server/routes/steps";
import { codiceFiscaleRouter } from "@server/routes/codiceFiscale";

const app = express();

// Trust the reverse proxy in production so secure cookies work behind TLS.
if (!isDev) app.set("trust proxy", 1);

app.use(express.json());
app.use(sessionMiddleware);

// Health check
app.get("/api/health", (_req, res) => res.json({ ok: true }));

// API routes
app.use("/api/auth", authRouter);
app.use("/api/profile", profileRouter);
app.use("/api/plan", planRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/steps", stepsRouter);
app.use("/api/codice-fiscale", codiceFiscaleRouter);

// Unknown API routes → JSON 404 (never fall through to the SPA)
app.use("/api", (_req, res) => {
  res.status(404).json({ error: "Not found" });
});

/**
 * Static hosting.
 * - Dev: Vite serves the client on :5173 and proxies /api here, so the Express
 *   server only handles the API.
 * - Prod: serve the built SPA from dist/client with a catch-all fallback.
 */
if (!isDev) {
  const { default: path } = await import("node:path");
  const clientDir = path.resolve("dist/client");
  app.use(express.static(clientDir));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(clientDir, "index.html"));
  });
}

// Centralized error handler
app.use(
  (
    err: unknown,
    _req: express.Request,
    res: express.Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _next: express.NextFunction,
  ) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ error: "Internal server error" });
  },
);

app.listen(env.PORT, () => {
  console.log(
    `🚀 Buddy API listening on http://localhost:${env.PORT} (${env.NODE_ENV})`,
  );
  if (isDev) {
    console.log("   Client (Vite): http://localhost:5173");
  }
});
