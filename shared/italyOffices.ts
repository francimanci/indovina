/**
 * Directory of Italian provinces → competent Questura (Ufficio Immigrazione).
 *
 * The Ufficio Immigrazione that handles permesso di soggiorno and related
 * procedures sits inside the **Questura**, and its territorial competence is the
 * **whole province** where you are domiciled. Provinces + their two-letter sigle
 * are stable public facts, so we seed them here.
 *
 * We deliberately DON'T hardcode each office's street address / phone / PEC:
 * those change and must not be guessed. Each entry links to the official
 * Polizia di Stato portal and a maps lookup, which resolve the current contacts.
 */

export interface Province {
  name: string; // province (= Questura city for most)
  sigla: string; // 2-letter code
}

export interface Region {
  name: string;
  provinces: Province[];
}

export const italyRegions: Region[] = [
  {
    name: "Abruzzo",
    provinces: [
      { name: "L'Aquila", sigla: "AQ" },
      { name: "Chieti", sigla: "CH" },
      { name: "Pescara", sigla: "PE" },
      { name: "Teramo", sigla: "TE" },
    ],
  },
  {
    name: "Basilicata",
    provinces: [
      { name: "Potenza", sigla: "PZ" },
      { name: "Matera", sigla: "MT" },
    ],
  },
  {
    name: "Calabria",
    provinces: [
      { name: "Catanzaro", sigla: "CZ" },
      { name: "Cosenza", sigla: "CS" },
      { name: "Crotone", sigla: "KR" },
      { name: "Reggio Calabria", sigla: "RC" },
      { name: "Vibo Valentia", sigla: "VV" },
    ],
  },
  {
    name: "Campania",
    provinces: [
      { name: "Napoli", sigla: "NA" },
      { name: "Avellino", sigla: "AV" },
      { name: "Benevento", sigla: "BN" },
      { name: "Caserta", sigla: "CE" },
      { name: "Salerno", sigla: "SA" },
    ],
  },
  {
    name: "Emilia-Romagna",
    provinces: [
      { name: "Bologna", sigla: "BO" },
      { name: "Ferrara", sigla: "FE" },
      { name: "Forlì-Cesena", sigla: "FC" },
      { name: "Modena", sigla: "MO" },
      { name: "Parma", sigla: "PR" },
      { name: "Piacenza", sigla: "PC" },
      { name: "Ravenna", sigla: "RA" },
      { name: "Reggio Emilia", sigla: "RE" },
      { name: "Rimini", sigla: "RN" },
    ],
  },
  {
    name: "Friuli-Venezia Giulia",
    provinces: [
      { name: "Trieste", sigla: "TS" },
      { name: "Gorizia", sigla: "GO" },
      { name: "Pordenone", sigla: "PN" },
      { name: "Udine", sigla: "UD" },
    ],
  },
  {
    name: "Lazio",
    provinces: [
      { name: "Roma", sigla: "RM" },
      { name: "Frosinone", sigla: "FR" },
      { name: "Latina", sigla: "LT" },
      { name: "Rieti", sigla: "RI" },
      { name: "Viterbo", sigla: "VT" },
    ],
  },
  {
    name: "Liguria",
    provinces: [
      { name: "Genova", sigla: "GE" },
      { name: "Imperia", sigla: "IM" },
      { name: "La Spezia", sigla: "SP" },
      { name: "Savona", sigla: "SV" },
    ],
  },
  {
    name: "Lombardia",
    provinces: [
      { name: "Milano", sigla: "MI" },
      { name: "Bergamo", sigla: "BG" },
      { name: "Brescia", sigla: "BS" },
      { name: "Como", sigla: "CO" },
      { name: "Cremona", sigla: "CR" },
      { name: "Lecco", sigla: "LC" },
      { name: "Lodi", sigla: "LO" },
      { name: "Mantova", sigla: "MN" },
      { name: "Monza e Brianza", sigla: "MB" },
      { name: "Pavia", sigla: "PV" },
      { name: "Sondrio", sigla: "SO" },
      { name: "Varese", sigla: "VA" },
    ],
  },
  {
    name: "Marche",
    provinces: [
      { name: "Ancona", sigla: "AN" },
      { name: "Ascoli Piceno", sigla: "AP" },
      { name: "Fermo", sigla: "FM" },
      { name: "Macerata", sigla: "MC" },
      { name: "Pesaro e Urbino", sigla: "PU" },
    ],
  },
  {
    name: "Molise",
    provinces: [
      { name: "Campobasso", sigla: "CB" },
      { name: "Isernia", sigla: "IS" },
    ],
  },
  {
    name: "Piemonte",
    provinces: [
      { name: "Torino", sigla: "TO" },
      { name: "Alessandria", sigla: "AL" },
      { name: "Asti", sigla: "AT" },
      { name: "Biella", sigla: "BI" },
      { name: "Cuneo", sigla: "CN" },
      { name: "Novara", sigla: "NO" },
      { name: "Verbano-Cusio-Ossola", sigla: "VB" },
      { name: "Vercelli", sigla: "VC" },
    ],
  },
  {
    name: "Puglia",
    provinces: [
      { name: "Bari", sigla: "BA" },
      { name: "Barletta-Andria-Trani", sigla: "BT" },
      { name: "Brindisi", sigla: "BR" },
      { name: "Foggia", sigla: "FG" },
      { name: "Lecce", sigla: "LE" },
      { name: "Taranto", sigla: "TA" },
    ],
  },
  {
    name: "Sardegna",
    provinces: [
      { name: "Cagliari", sigla: "CA" },
      { name: "Nuoro", sigla: "NU" },
      { name: "Oristano", sigla: "OR" },
      { name: "Sassari", sigla: "SS" },
      { name: "Sud Sardegna", sigla: "SU" },
    ],
  },
  {
    name: "Sicilia",
    provinces: [
      { name: "Palermo", sigla: "PA" },
      { name: "Agrigento", sigla: "AG" },
      { name: "Caltanissetta", sigla: "CL" },
      { name: "Catania", sigla: "CT" },
      { name: "Enna", sigla: "EN" },
      { name: "Messina", sigla: "ME" },
      { name: "Ragusa", sigla: "RG" },
      { name: "Siracusa", sigla: "SR" },
      { name: "Trapani", sigla: "TP" },
    ],
  },
  {
    name: "Toscana",
    provinces: [
      { name: "Firenze", sigla: "FI" },
      { name: "Arezzo", sigla: "AR" },
      { name: "Grosseto", sigla: "GR" },
      { name: "Livorno", sigla: "LI" },
      { name: "Lucca", sigla: "LU" },
      { name: "Massa-Carrara", sigla: "MS" },
      { name: "Pisa", sigla: "PI" },
      { name: "Pistoia", sigla: "PT" },
      { name: "Prato", sigla: "PO" },
      { name: "Siena", sigla: "SI" },
    ],
  },
  {
    name: "Trentino-Alto Adige",
    provinces: [
      { name: "Trento", sigla: "TN" },
      { name: "Bolzano", sigla: "BZ" },
    ],
  },
  {
    name: "Umbria",
    provinces: [
      { name: "Perugia", sigla: "PG" },
      { name: "Terni", sigla: "TR" },
    ],
  },
  {
    name: "Valle d'Aosta",
    provinces: [{ name: "Aosta", sigla: "AO" }],
  },
  {
    name: "Veneto",
    provinces: [
      { name: "Venezia", sigla: "VE" },
      { name: "Belluno", sigla: "BL" },
      { name: "Padova", sigla: "PD" },
      { name: "Rovigo", sigla: "RO" },
      { name: "Treviso", sigla: "TV" },
      { name: "Verona", sigla: "VR" },
      { name: "Vicenza", sigla: "VI" },
    ],
  },
];

/** What the Ufficio Immigrazione (inside the Questura) handles. */
export const ufficioImmigrazioneServices = [
  "Permesso di soggiorno — first issue, renewal, conversion, duplicate",
  "Carta di soggiorno / permesso UE per soggiornanti di lungo periodo",
  "Ricongiungimento familiare (nulla osta and follow-up)",
  "Dichiarazione di presenza / hospitality declarations",
  "Documents for citizenship and long-stay procedures",
];

export interface OfficeLinks {
  maps: string;
  commissariatiMaps: string;
  poliziaPortal: string;
}

/** Reliable lookup links (resolve current address/contacts; not fabricated). */
export function officeLinks(p: Province): OfficeLinks {
  const q = (s: string) =>
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s)}`;
  return {
    maps: q(`Questura di ${p.name} Ufficio Immigrazione`),
    commissariatiMaps: q(`Commissariato di Pubblica Sicurezza ${p.name}`),
    poliziaPortal: "https://www.poliziadistato.it/articolo/1087",
  };
}

export const provinceCount = italyRegions.reduce(
  (n, r) => n + r.provinces.length,
  0,
);
