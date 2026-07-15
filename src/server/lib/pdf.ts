import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { StepKit } from "@shared/types";

/**
 * Render a printable, pre-filled data sheet for a step's kit — the "sheet to
 * copy from" the user takes to the office, or attaches to their submission.
 *
 * This is a compilation aid that reproduces the field values; it is not the
 * official blank form (which the user downloads from the competent authority).
 */
export async function buildStepPdf(kit: StepKit): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const A4 = { w: 595.28, h: 841.89 };
  const margin = 48;
  const accent = rgb(0.05, 0.58, 0.53);
  const ink = rgb(0.06, 0.09, 0.16);
  const muted = rgb(0.39, 0.45, 0.55);

  let page = doc.addPage([A4.w, A4.h]);
  let y = A4.h - margin;

  const ensure = (needed: number) => {
    if (y - needed < margin) {
      page = doc.addPage([A4.w, A4.h]);
      y = A4.h - margin;
    }
  };

  const wrap = (text: string, f: typeof font, size: number, maxW: number) => {
    const words = text.split(/\s+/);
    const lines: string[] = [];
    let line = "";
    for (const w of words) {
      const trial = line ? `${line} ${w}` : w;
      if (f.widthOfTextAtSize(sanitize(trial), size) > maxW && line) {
        lines.push(line);
        line = w;
      } else {
        line = trial;
      }
    }
    if (line) lines.push(line);
    return lines;
  };

  const draw = (
    text: string,
    opts: { f?: typeof font; size?: number; color?: typeof ink; gap?: number },
  ) => {
    const f = opts.f ?? font;
    const size = opts.size ?? 10;
    const maxW = A4.w - margin * 2;
    for (const line of wrap(text, f, size, maxW)) {
      ensure(size + 4);
      page.drawText(sanitize(line), { x: margin, y, size, font: f, color: opts.color ?? ink });
      y -= size + 3;
    }
    y -= opts.gap ?? 0;
  };

  // Header
  draw("Buddy", { f: bold, size: 16, color: accent });
  draw(kit.title, { f: bold, size: 18, color: ink, gap: 2 });
  draw(`Modulo di riferimento: ${kit.form}`, { size: 10, color: muted, gap: 6 });
  draw(kit.channel.summary, { size: 9, color: muted, gap: 10 });

  // Field values
  draw("DATI PRECOMPILATI / PRE-FILLED VALUES", { f: bold, size: 11, color: accent, gap: 6 });
  for (const fld of kit.content.formFields) {
    ensure(28);
    draw(fld.label.toUpperCase(), { f: bold, size: 8, color: muted });
    draw(fld.value || "— da completare / to complete —", { size: 11, color: ink });
    if (fld.note) draw(fld.note, { size: 8, color: muted });
    y -= 5;
  }

  // Missing
  if (kit.missing.length) {
    y -= 6;
    draw("DA COMPLETARE PRIMA DELL'INVIO / STILL NEEDED", { f: bold, size: 11, color: accent, gap: 4 });
    for (const m of kit.missing) draw(`• ${m}`, { size: 10, color: ink });
  }

  // Footer note
  y -= 12;
  draw(
    "Buddy is an information tool, not legal or tax advice. Always verify the competent office and current requirements on official sources.",
    { size: 8, color: muted },
  );

  return doc.save();
}

/** pdf-lib's standard fonts are WinAnsi — strip characters they can't encode. */
function sanitize(s: string): string {
  return s
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/…/g, "...")
    // drop anything outside the printable Latin-1 range
    .replace(/[^\x09\x0A\x0D\x20-\xFF]/g, "?");
}
