import { useMemo, useState } from "react";
import { Card } from "@client/components/ui";
import {
  italyRegions,
  officeLinks,
  ufficioImmigrazioneServices,
  provinceCount,
  type Province,
} from "@shared/italyOffices";

export function Offices() {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Province | null>(null);

  const q = query.trim().toLowerCase();
  const filtered = useMemo(() => {
    if (!q) return italyRegions;
    return italyRegions
      .map((r) => ({
        ...r,
        provinces: r.provinces.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.sigla.toLowerCase().includes(q) ||
            r.name.toLowerCase().includes(q),
        ),
      }))
      .filter((r) => r.provinces.length > 0);
  }, [q]);

  return (
    <div className="mx-auto max-w-5xl px-5 py-10">
      <header className="mb-6">
        <span className="inline-flex items-center rounded-full bg-accent-50 px-3 py-1 text-xs font-medium text-accent-700">
          Polizia di Stato · Ufficio Immigrazione
        </span>
        <h1 className="mt-3 text-2xl font-bold text-ink">
          Immigration offices (Questure)
        </h1>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-ink-soft">
          The <span className="font-medium text-ink">Ufficio Immigrazione</span>{" "}
          sits inside the <span className="font-medium text-ink">Questura</span>{" "}
          and handles your permesso di soggiorno and related procedures. The
          competent office is the one for the{" "}
          <span className="font-medium text-ink">province where you live</span>.
          Pick your province ({provinceCount} covered) to find it.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        {/* Left: searchable province list */}
        <div>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search a province, sigla or region (e.g. Milano, MI, Lombardia)"
            className="mb-4 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-muted focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-100"
          />
          <div className="max-h-[32rem] space-y-5 overflow-y-auto pr-1">
            {filtered.map((region) => (
              <div key={region.name}>
                <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  {region.name}
                </h2>
                <div className="flex flex-wrap gap-2">
                  {region.provinces.map((p) => {
                    const active = selected?.sigla === p.sigla;
                    return (
                      <button
                        key={p.sigla}
                        type="button"
                        onClick={() => setSelected(p)}
                        className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                          active
                            ? "border-accent-500 bg-accent-50 text-accent-800"
                            : "border-slate-200 bg-white text-ink-soft hover:border-slate-300"
                        }`}
                      >
                        {p.name}{" "}
                        <span className="text-ink-muted">({p.sigla})</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <p className="text-sm text-ink-muted">No province matches “{query}”.</p>
            )}
          </div>
        </div>

        {/* Right: selected office detail */}
        <div>
          {selected ? (
            <ProvinceDetail province={selected} />
          ) : (
            <Card className="border-dashed">
              <div className="py-10 text-center text-sm text-ink-muted">
                Select a province to see its competent Questura / Ufficio
                Immigrazione.
              </div>
            </Card>
          )}
        </div>
      </div>

      <p className="mt-8 rounded-xl bg-slate-100 p-4 text-xs leading-relaxed text-ink-muted">
        Buddy is an information tool, not legal advice. Office addresses, hours,
        and territorial competence can change — always confirm on the official
        Polizia di Stato sources linked above before travelling to an office.
      </p>
    </div>
  );
}

function ProvinceDetail({ province }: { province: Province }) {
  const links = officeLinks(province);
  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-ink">
            Questura di {province.name}
          </h3>
          <p className="text-sm text-ink-muted">Ufficio Immigrazione</p>
        </div>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-ink-soft">
          {province.sigla}
        </span>
      </div>

      <div className="mt-4 rounded-xl bg-accent-50 p-3 text-sm text-accent-800">
        <span className="font-medium">Territorial competence:</span> the whole
        province of {province.name} ({province.sigla}). If you live in this
        province, this is your Ufficio Immigrazione.
      </div>

      <h4 className="mt-5 text-sm font-semibold text-ink">What it handles</h4>
      <ul className="mt-2 space-y-1.5 text-sm text-ink-soft">
        {ufficioImmigrazioneServices.map((s) => (
          <li key={s} className="flex gap-2">
            <span className="text-accent-600">•</span>
            <span>{s}</span>
          </li>
        ))}
      </ul>

      <div className="mt-5 flex flex-wrap gap-3">
        <a
          href={links.maps}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center rounded-lg bg-accent-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-accent-700"
        >
          Find the office on the map ↗
        </a>
        <a
          href={links.poliziaPortal}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-ink-soft hover:bg-slate-50"
        >
          Polizia di Stato portal ↗
        </a>
      </div>

      {/* Commissariati */}
      <div className="mt-6 border-t border-slate-100 pt-5">
        <h4 className="text-sm font-semibold text-ink">
          Local commissariati in {province.name}
        </h4>
        <p className="mt-1 text-sm leading-relaxed text-ink-soft">
          Immigration matters are handled by the Questura above. Local{" "}
          <span className="font-medium">commissariati di P.S.</span> cover
          neighbourhood policing and some services; their exact street-level
          competence is set locally, so confirm with the office directly.
        </p>
        <a
          href={links.commissariatiMaps}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-flex items-center text-sm font-medium text-accent-700 hover:underline"
        >
          Find commissariati in {province.name} on the map ↗
        </a>
      </div>
    </Card>
  );
}
