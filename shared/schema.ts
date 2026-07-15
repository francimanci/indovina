import {
  pgTable,
  uuid,
  text,
  boolean,
  integer,
  timestamp,
  jsonb,
  pgEnum,
  unique,
} from "drizzle-orm/pg-core";

/**
 * Buddy data model.
 *
 * Single source of truth for both server (Drizzle queries + migrations) and
 * client (inferred types). All six tables exist from Phase 1 so migrations stay
 * stable across phases; auth/Stripe columns are populated in later phases.
 */

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------
export const euStatusEnum = pgEnum("eu_status", ["eu", "non_eu"]);
export const locationEnum = pgEnum("location_status", ["in_italy", "abroad"]);
export const reasonEnum = pgEnum("reason", [
  "work",
  "study",
  "family",
  "elective_residence",
]);
export const stepStatusEnum = pgEnum("plan_step_status", [
  "not_started",
  "in_progress",
  "completed",
]);

// ---------------------------------------------------------------------------
// users — authentication lands in Phase 2, table exists now.
// ---------------------------------------------------------------------------
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(), // argon2 (Phase 2)
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ---------------------------------------------------------------------------
// profiles — 1:1 with a user. userId is nullable in Phase 1 (no auth yet); the
// unique constraint enforces one profile per user once auth links them.
// ---------------------------------------------------------------------------
export type FamilyMember = {
  relationship: string; // spouse, child, parent, ...
  nationality: string;
};

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .unique(),
  nationality: text("nationality").notNull(),
  euStatus: euStatusEnum("eu_status").notNull(),
  location: locationEnum("location_status").notNull(), // in_italy | abroad
  reason: reasonEnum("reason").notNull(),
  city: text("city").notNull(), // city / comune
  hasPermesso: boolean("has_permesso").notNull().default(false),
  hasCodiceFiscale: boolean("has_codice_fiscale").notNull().default(false),
  familyMembers: jsonb("family_members")
    .$type<FamilyMember[]>()
    .notNull()
    .default([]),

  // --- Personal identity (Phase 3) ---
  // Nullable: collected in the dedicated Codice Fiscale form, not the initial
  // intake. These are the fields Modello AA4/8 actually requires.
  firstName: text("first_name"),
  lastName: text("last_name"),
  sex: text("sex"), // 'M' | 'F'
  dateOfBirth: text("date_of_birth"), // ISO 'YYYY-MM-DD'
  countryOfBirth: text("country_of_birth"),
  cityOfBirth: text("city_of_birth"),
  provinceOfBirth: text("province_of_birth"), // sigla (IT-born) or empty
  addressComune: text("address_comune"), // residence comune in Italy
  addressProvincia: text("address_provincia"),
  addressStreet: text("address_street"), // via/piazza + civico
  addressCap: text("address_cap"),
  contactEmail: text("contact_email"),
  documentType: text("document_type"), // passport | id_card | permesso
  documentNumber: text("document_number"),
  codiceFiscaleCode: text("codice_fiscale_code"), // the 16-char code, once obtained

  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ---------------------------------------------------------------------------
// plans — 1:N per profile.
// ---------------------------------------------------------------------------
export const plans = pgTable("plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  profileId: uuid("profile_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  title: text("title").notNull().default("Your Italian bureaucracy plan"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ---------------------------------------------------------------------------
// plan_steps — ordered steps with dependencies expressed by stepKey.
// ---------------------------------------------------------------------------
export const planSteps = pgTable("plan_steps", {
  id: uuid("id").primaryKey().defaultRandom(),
  planId: uuid("plan_id")
    .notNull()
    .references(() => plans.id, { onDelete: "cascade" }),
  stepKey: text("step_key").notNull(), // 'codice_fiscale', 'iscrizione_anagrafica', ...
  orderIndex: integer("order_index").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  dependsOn: jsonb("depends_on").$type<string[]>().notNull().default([]), // stepKeys
  status: stepStatusEnum("status").notNull().default("not_started"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ---------------------------------------------------------------------------
// generated_documents — AI output persisted so users can return to it (Phase 3).
// ---------------------------------------------------------------------------
export type GeneratedContent = {
  formFields: { label: string; value: string; note?: string }[];
  email: { subject: string; italian: string; english: string; to?: string };
  appointmentScript: { bring: string[]; say: string };
};

export const generatedDocuments = pgTable("generated_documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  // Nullable: kits are keyed by (user, stepKey) and can be generated before the
  // plan's steps are persisted to plan_steps (Phase 3).
  planStepId: uuid("plan_step_id").references(() => planSteps.id, {
    onDelete: "cascade",
  }),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  stepKey: text("step_key").notNull(),
  content: jsonb("content").$type<GeneratedContent>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ---------------------------------------------------------------------------
// unlocks — one-time Stripe payment per (user, step) (Phase 4).
// ---------------------------------------------------------------------------
export const unlocks = pgTable(
  "unlocks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    stepKey: text("step_key").notNull(),
    stripeSessionId: text("stripe_session_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    userStep: unique("unlocks_user_step").on(t.userId, t.stepKey),
  }),
);

// ---------------------------------------------------------------------------
// Inferred row types
// ---------------------------------------------------------------------------
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
export type Plan = typeof plans.$inferSelect;
export type PlanStep = typeof planSteps.$inferSelect;
export type GeneratedDocument = typeof generatedDocuments.$inferSelect;
export type Unlock = typeof unlocks.$inferSelect;
