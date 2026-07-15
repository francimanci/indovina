import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Anthropic from "@anthropic-ai/sdk";
import type { ZodType } from "zod";
import { env } from "@server/env";

/**
 * Server-side Anthropic access. AI calls are ONLY made here — never client-side.
 *
 * The model is asked for STRICT JSON (no prose, no fences). We parse it, validate
 * with the caller's zod schema, retry once on failure, and otherwise throw so the
 * route fails loudly (per the Phase 3 contract).
 *
 * AI is optional: when ANTHROPIC_API_KEY is unset, `isAiEnabled` is false and
 * callers fall back to their deterministic builders.
 */

export const isAiEnabled = Boolean(env.ANTHROPIC_API_KEY);

const client = isAiEnabled
  ? new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })
  : null;

const promptsDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "prompts",
);

export function loadPrompt(name: string): string {
  return readFileSync(path.join(promptsDir, name), "utf8");
}

function extractJson(text: string): unknown {
  const trimmed = text.trim();
  // Tolerate accidental ```json fences without depending on them.
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = fenced ? fenced[1] : trimmed;
  return JSON.parse(body);
}

async function callOnce(systemPrompt: string, userContent: string): Promise<string> {
  if (!client) throw new Error("AI is not enabled (ANTHROPIC_API_KEY unset)");
  const res = await client.messages.create({
    model: env.ANTHROPIC_MODEL,
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: "user", content: userContent }],
  });
  const block = res.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") {
    throw new Error("AI returned no text content");
  }
  return block.text;
}

/**
 * Generate strict-JSON output validated against `schema`. Retries once on a
 * parse/validation failure, then throws.
 */
export async function generateStructured<T>(
  systemPrompt: string,
  userContent: string,
  schema: ZodType<T>,
): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    const raw = await callOnce(
      systemPrompt,
      attempt === 0
        ? userContent
        : `${userContent}\n\nYour previous reply was not valid JSON matching the schema. Reply again with STRICT JSON only.`,
    );
    try {
      return schema.parse(extractJson(raw));
    } catch (err) {
      lastErr = err;
    }
  }
  throw new Error(
    `AI response failed schema validation after retry: ${
      lastErr instanceof Error ? lastErr.message : String(lastErr)
    }`,
  );
}
