import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { env } from "@server/env";
import * as schema from "@shared/schema";

/**
 * Shared Postgres pool + Drizzle client. Imported anywhere the server needs DB
 * access. The pool is also reused by connect-pg-simple for the session store
 * in Phase 2.
 */
export const pool = new pg.Pool({ connectionString: env.DATABASE_URL });

export const db = drizzle(pool, { schema });

export { schema };
