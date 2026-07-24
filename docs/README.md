> 🃏 **Burraco — Segnapunti**: app per calcolare i punti del Burraco fotografando le carte,
> con due squadre e storico delle mani. Installabile come PWA.
> → <https://francimanci.github.io/indovina/burraco.html>

# Insieme — Organizer famiglia 🏡

App **gratuita** (nessuna pubblicità, nessun abbonamento) per organizzare la vita di famiglia,
ispirata al concetto delle app tipo *family organizer* ma completamente originale.

Pensata per **due persone** (es. tu e tua moglie): ognuno inserisce le proprie cose dal
proprio telefono e l'altro le vede in tempo reale.

## Cosa fa

- **🏠 Bacheca** — panoramica del giorno: bilancio spese, prossimi impegni, attività da fare e una bacheca di note condivise.
- **📅 Calendario** — eventi e appuntamenti condivisi, colorati per persona (tu / partner / famiglia).
- **✅ Liste** — attività da fare (assegnabili a ciascuno) + lista della spesa con spunta.
- **💶 Spese** — spese familiari con categorie, totali del mese e **bilancio automatico** (chi deve dare quanto all'altro, diviso 50/50 sulle spese condivise).
- **⚙️ Altro** — cambio profilo, modifica nomi, invito del partner.

I dati si **sincronizzano in tempo reale** tra i due telefoni tramite Firebase (piano gratuito).

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
