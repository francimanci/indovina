# Insieme — Organizer famiglia 🏡

App **gratuita** (nessuna pubblicità, nessun abbonamento) per organizzare la vita di famiglia,
ispirata al concetto delle app tipo *family organizer* ma completamente originale.

Pensata per **due persone** (es. tu e tua moglie): ognuno inserisce le proprie cose dal
proprio telefono e l'altro le vede in tempo reale.

## Cosa fa

- **🏠 Bacheca** — panoramica del giorno: saldo spese, prossimi impegni, attività da fare e una bacheca di note condivise.
- **📅 Calendario** — eventi e appuntamenti condivisi, colorati per persona, con **ricorrenze** (ogni giorno/settimana/mese).
- **✅ Liste** — attività da fare (assegnabili a ciascuno, modificabili) + lista della spesa con spunta.
- **💶 Spese** — categorie, totali del mese e **bilancio automatico multi-persona**: split in parti uguali o **personalizzato**, spese **ricorrenti** (es. affitto), e "rimborsi consigliati" (chi deve dare quanto a chi).
- **💬 Chat** — messaggi di famiglia in tempo reale.
- **🍽️ Pasti & Ricette** — pianificatore settimanale dei pasti + ricettario condiviso.
- **📇 Rubrica** — contatti condivisi (con chiamata/SMS/email diretti).
- **🔔 Promemoria** — notifiche per eventi e attività (quando l'app è installata come PWA).
- **👨‍👩‍👧 Membri** — più di due persone, con nomi e colori; modifica di ogni elemento (spese, attività, eventi).

I dati si **sincronizzano in tempo reale** tra i telefoni tramite Firebase (piano gratuito).

> Nota sui promemoria: le notifiche in **background** su iPhone sono limitate dal sistema; funzionano quando l'app è aperta o installata in schermata Home. Per notifiche push totalmente affidabili servirebbe l'app nativa (percorso TestFlight, a parte).

## Come si usa (2 minuti, una sola volta)

1. Apri l'app: <https://francimanci.github.io/indovina/> *(GitHub Pages sulla cartella `docs/`)*.
2. Segui la schermata di configurazione:
   - Crea un progetto gratuito su [console.firebase.google.com](https://console.firebase.google.com).
   - **Build → Firestore Database → Crea database → modalità test**.
   - **⚙️ Impostazioni progetto → Le tue app → Web `</>`** e copia l'oggetto `firebaseConfig`.
   - Incolla la configurazione, scegli un **codice famiglia** (parola segreta) e i vostri nomi.
3. Sull'**altro telefono** (modo più semplice): dalla sezione *Altro → Invita il partner* premi **Invia link d'invito** e mandalo via WhatsApp. Aprendo quel link, l'app si collega da sola alla vostra famiglia: basta scegliere il proprio nome. (In alternativa si possono incollare a mano la stessa configurazione e lo stesso codice famiglia.)
4. Su iPhone/Android: *Condividi → Aggiungi alla schermata Home* per usarla come una vera app (icona in home, a schermo intero — una **PWA**).

## Regole di sicurezza consigliate (Firestore)

La modalità *test* scade dopo 30 giorni. Per continuare a usarla, sostituisci le regole in
**Firestore → Regole** con queste (i dati restano accessibili solo a chi conosce il codice famiglia):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /families/{familyCode}/{document=**} {
      allow read, write: if true;
    }
  }
}
```

> Nota: senza login, chiunque conosca il codice famiglia **e** la configurazione può accedere ai
> dati. Per un uso familiare va bene; scegli un codice famiglia difficile da indovinare e non
> condividere pubblicamente la configurazione. (In futuro si può aggiungere l'autenticazione per
> maggiore sicurezza.)

## Gratuito?

Sì. GitHub Pages ospita l'app senza costi e il piano *Spark* di Firebase (gratuito) è più che
sufficiente per l'uso di una famiglia.
