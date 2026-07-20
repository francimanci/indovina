# 🏛️ Quorum — versione mobile moderna

Reinterpretazione moderna e mobile-first del gioco politico **Quorum**.
App web installabile (PWA) che funziona **offline**.

## Come giocare
Apri `index.html` (o, con GitHub Pages attivo, `.../quorum/`) da telefono e
aggiungila alla schermata Home per installarla come app.

## Modalità
- **🤖 Sfida il Computer** — offline, 1 umano contro 1-3 IA (3 livelli di difficoltà).
- **👥 Multiplayer locale** — 2-4 giocatori sullo stesso telefono (pass-and-play).

## Regole in breve
- La mappa ha **6 regioni** per **100 seggi** totali.
- Ogni turno hai **2 azioni**: *Campagna* (Capitale Politico → consenso),
  *Raccogli Fondi* (+5 💰) o *Gioca Carta* (eventi come Comizio, Scandalo,
  Talk Show, Inchiesta, Voltagabbana…).
- In ogni regione chi ha più consenso conquista **tutti** i suoi seggi.
- Vince chi per primo raggiunge il **Quorum: 51 seggi**.

## Struttura tecnica
- `index.html` — app completa (UI + motore di gioco + IA), zero dipendenze.
- `manifest.webmanifest` + `sw.js` — PWA installabile e offline.
- `icon.svg`, `icon-192/512/180.png` — icone app.

Nessun backend richiesto: tutto gira sul dispositivo, salvataggio automatico via `localStorage`.
