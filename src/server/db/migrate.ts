import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db, pool } from "@server/db";

/**
 * Apply generated SQL migrations from ./drizzle. Run with `npm run db:migrate`.
 */
async function main() {
  console.log("Running migrations...");
  await migrate(db, { migrationsFolder: "./drizzle" });
  console.log("✅ Migrations applied.");
  await pool.end();
}

main().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
