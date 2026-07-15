import type { PlanStepView } from "@shared/types";
import type { Profile } from "@shared/schema";

/**
 * Phase 1 mock plan. In Phase 3 this is replaced by AI generation from the
 * saved profile. Ordering + dependencies match the real Italian sequence.
 *
 * The Codice Fiscale is Buddy's PRIMARY focus — it is the prerequisite for
 * almost everything else, so it comes first and is flagged `primary`.
 */
export function buildMockPlan(profile: Profile): PlanStepView[] {
  const alreadyHasCf = profile.hasCodiceFiscale;

  const steps: PlanStepView[] = [
    {
      stepKey: "codice_fiscale",
      order: 1,
      title: "Get your Codice Fiscale",
      description:
        "Your Italian tax code — the single most important first step. Almost every other procedure (residency, health card, contracts, bank account) requires it. Buddy focuses here first.",
      dependsOn: [],
      status: alreadyHasCf ? "completed" : "not_started",
      primary: true,
    },
    {
      stepKey: "iscrizione_anagrafica",
      order: 2,
      title: "Register your residency (iscrizione anagrafica)",
      description:
        "Register your address with the Comune of " +
        profile.city +
        ". This makes you an official resident and unlocks local services.",
      dependsOn: ["codice_fiscale"],
      status: "not_started",
    },
    {
      stepKey: "tessera_sanitaria",
      order: 3,
      title: "Get your Tessera Sanitaria (health card)",
      description:
        "Enrol in the Servizio Sanitario Nazionale and receive your health card, giving you access to a doctor and public healthcare.",
      dependsOn: ["codice_fiscale", "iscrizione_anagrafica"],
      status: "not_started",
    },
  ];

  return steps;
}
