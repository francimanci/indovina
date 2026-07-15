import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { pool } from "@server/db";
import { env, isDev } from "@server/env";

/**
 * Server-side sessions stored in Postgres (connect-pg-simple). The session id
 * lives in an httpOnly cookie — no JWT in localStorage. The `session` table is
 * created automatically on first boot.
 */
const PgStore = connectPgSimple(session);

export const sessionMiddleware = session({
  store: new PgStore({
    pool,
    tableName: "session",
    createTableIfMissing: true,
  }),
  name: "buddy.sid",
  secret: env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: !isDev, // HTTPS-only cookies in production
    maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
  },
});

// Augment the session type with our fields.
declare module "express-session" {
  interface SessionData {
    userId?: string;
  }
}
