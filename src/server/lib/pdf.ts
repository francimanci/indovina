import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { StepKit } from "@shared/types";

/**
 * Render a printable, pre-filled **module to sign and submit** for a step's kit.
 *
 * It reproduces the field values in a form layout, then adds a request/
 * declaration paragraph, a place-and-date line and a signature line — so the
 * user prints it, signs it, and sends it (by PEC/email or in person) together
 * with a copy of their ID. It is an applicant-side request module derived from
 * the official form's fields, not a reproduction of the government form itself.
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
  const line = rgb(0.82, 0.86, 0.86);

  let page = doc.addPage([A4.w, A4.h]);
  let y = A4.h - margin;
  const maxW = A4.w - margin * 2;

  const ensure = (needed: number) => {
    if (y - needed < margin) {
      page = doc.addPage([A4.w, A4.h]);
      y = A4.h - margin;
    }
  };

  const wrap = (text: string, f: typeof font, size: number, w: number) => {
    const words = text.split(/\s+/);
    const lines: string[] = [];
    let ln = "";
    for (const word of words) {
      const trial = ln ? `${ln} ${word}` : word;
      if (f.widthOfTextAtSize(sanitize(trial), size) > w && ln) {
        lines.push(ln);
        ln = word;
      } else ln = trial;
    }
    if (ln) lines.push(ln);
    return lines;
  };

  const draw = (
    text: string,
    opts: { f?: typeof font; size?: number; color?: typeof ink; gap?: number; indent?: number } = {},
  ) => {
    const f = opts.f ?? font;
    const size = opts.size ?? 10;
    const x = margin + (opts.indent ?? 0);
    for (const ln of wrap(text, f, size, maxW - (opts.indent ?? 0))) {
      ensure(size + 4);
      page.drawText(sanitize(ln), { x, y, size, font: f, color: opts.color ?? ink });
      y -= size + 3;
    }
    y -= opts.gap ?? 0;
  };

  const rule = (gap = 8) => {
    ensure(gap + 2);
    page.drawLine({ start: { x: margin, y }, end: { x: A4.w - margin, y }, thickness: 0.7, color: line });
    y -= gap;
  };

  // Header
  draw("Buddy", { f: bold, size: 15, color: accent });
  draw(kit.form, { f: bold, size: 17, color: ink, gap: 2 });
  draw(
    "Modulo precompilato da firmare e inviare (PEC/email o di persona) con copia di un documento d'identità. — Pre-filled module to sign and submit with a copy of your ID.",
    { size: 8.5, color: muted, gap: 8 },
  );
  rule(10);

  // Applicant data
  draw("RICHIEDENTE / APPLICANT", { f: bold, size: 11, color: accent, gap: 6 });
  for (const fld of kit.content.formFields) {
    ensure(26);
    draw(fld.label.toUpperCase(), { f: bold, size: 7.5, color: muted });
    draw(fld.value || "________________________________", { size: 11, color: ink });
    if (fld.note) draw(fld.note, { size: 7.5, color: muted });
    y -= 4;
  }

  if (kit.missing.length) {
    y -= 4;
    draw("DA COMPLETARE PRIMA DELL'INVIO / STILL NEEDED", { f: bold, size: 10, color: accent, gap: 4 });
    for (const m of kit.missing) draw(`•  ${m}`, { size: 9.5, color: ink });
  }

  // Declaration + request
  y -= 6;
  rule(10);
  draw("DICHIARAZIONE E RICHIESTA / DECLARATION AND REQUEST", { f: bold, size: 11, color: accent, gap: 6 });
  draw(declarationFor(kit.stepKey), { size: 10, color: ink, gap: 4 });
  draw(
    "Dichiara inoltre che i dati sopra riportati corrispondono al vero e allega copia di un documento d'identità valido. — I declare the above data is true and attach a copy of a valid ID.",
    { size: 9, color: muted, gap: 18 },
  );

  // Place/date + signature
  ensure(64);
  const colGap = 24;
  const colW = (maxW - colGap) / 2;
  const labelY = y;
  page.drawText("Luogo e data / Place and date", { x: margin, y: labelY, size: 8.5, font, color: muted });
  page.drawText("Firma / Signature", { x: margin + colW + colGap, y: labelY, size: 8.5, font, color: muted });
  y -= 34;
  page.drawLine({ start: { x: margin, y }, end: { x: margin + colW, y }, thickness: 0.8, color: ink });
  page.drawLine({
    start: { x: margin + colW + colGap, y },
    end: { x: margin + maxW, y },
    thickness: 0.8,
    color: ink,
  });
  y -= 26;

  draw(
    "Buddy è uno strumento informativo, non consulenza legale o fiscale. Verifica l'ufficio competente e i requisiti aggiornati sulle fonti ufficiali.",
    { size: 8, color: muted },
  );

  return doc.save();
}

function declarationFor(stepKey: string): string {
  switch (stepKey) {
    case "codice_fiscale":
      return "Il/La sottoscritto/a, identificato/a dai dati sopra riportati, CHIEDE l'attribuzione del codice fiscale ai sensi della normativa vigente. — The undersigned requests the attribution of the Codice Fiscale.";
    case "iscrizione_anagrafica":
      return "Il/La sottoscritto/a CHIEDE l'iscrizione anagrafica con residenza all'indirizzo sopra indicato, con provenienza dall'estero, e si impegna a esibire la documentazione richiesta. — The undersigned requests residence registration at the address above.";
    case "tessera_sanitaria":
      return "Il/La sottoscritto/a CHIEDE l'iscrizione al Servizio Sanitario Nazionale e l'assegnazione del medico di base, con rilascio della Tessera Sanitaria. — The undersigned requests enrolment in the National Health Service.";
    default:
      return "Il/La sottoscritto/a presenta la presente richiesta e dichiara la veridicità dei dati riportati.";
  }
}

/** pdf-lib's standard fonts are WinAnsi — strip characters they can't encode. */
function sanitize(s: string): string {
  return s
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/…/g, "...")
    .replace(/[^\x09\x0A\x0D\x20-\xFF]/g, "?");
}
