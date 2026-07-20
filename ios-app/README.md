# 📱 Quorum — wrapper iOS per TestFlight

Questa cartella impacchetta la web app `docs/quorum` dentro un'app **iOS nativa**
(via [Capacitor](https://capacitorjs.com)) così puoi caricarla su **TestFlight**.

> ℹ️ **Perché serve questo?** Una PWA (app web) **non** si può caricare direttamente
> su TestFlight: TestFlight distribuisce solo app native firmate (`.ipa`) tramite
> App Store Connect. Questo wrapper crea l'app nativa che al suo interno mostra il gioco.

## Cosa ti serve (una volta sola)
- Un **Mac** con **Xcode** installato.
- **Node.js** (18+).
- Un account **Apple Developer** a pagamento (99 $/anno) — necessario per TestFlight.
- Il tuo **Team ID** e un **Bundle Identifier** (di default: `com.francimanci.quorum`).

## Passi (dal Mac, dentro `ios-app/`)

```bash
cd ios-app

# 1) installa le dipendenze
npm install

# 2) copia la web app in www/ e crea il progetto iOS
npm run add-ios          # = sync-web + npx cap add ios

# 3) (opzionale ma consigliato) genera le icone dell'app dai file in resources/
npm run icons            # richiede resources/icon.png (già incluso, 1024x1024)

# 4) sincronizza e apri in Xcode
npm run sync
npm run open
```

## In Xcode
1. Seleziona il target **App** → tab **Signing & Capabilities**:
   - spunta **Automatically manage signing**
   - scegli il tuo **Team**
   - imposta il **Bundle Identifier** (deve essere unico su App Store Connect)
2. In **General** imposta **Version** (es. `1.0`) e **Build** (es. `1`).
3. In alto scegli come destinazione **Any iOS Device (arm64)**.
4. Menu **Product → Archive**.
5. Ad archivio pronto: **Distribute App → App Store Connect → Upload**.

## Su App Store Connect
1. Crea una nuova **App** con lo stesso Bundle ID (se non esiste già).
2. Attendi che la build finisca l'**elaborazione** (qualche minuto).
3. Vai in **TestFlight**, seleziona la build, compila le note e (per test interni)
   aggiungi te stesso come tester.
4. Apri l'app **TestFlight** sul tuo iPhone e installa Quorum. 🎉

## Aggiornare l'app dopo modifiche al gioco
Le modifiche vanno sempre fatte in `docs/quorum/` (fonte unica). Poi:

```bash
npm run sync     # ricopia www/ e aggiorna il progetto iOS
npm run open     # in Xcode: alza il numero Build, Archive, Upload
```

## Note tecniche
- La fonte del gioco è **una sola**: `docs/quorum/`. La cartella `www/` è generata
  dallo script `scripts/sync-web.sh` e **non** è versionata (`.gitignore`).
- Il `service worker` viene rimosso nel bundle nativo: non serve, perché gli asset
  sono già inclusi nell'app e il gioco funziona **offline** di suo.
- Orientamento **verticale**, colore di sfondo `#0c0f1c` (coerente con l'app).
- `localStorage` (salvataggio partita) funziona regolarmente dentro WKWebView.

## Alternativa senza riga di comando
In alternativa a Capacitor puoi usare **[PWABuilder](https://www.pwabuilder.com)**:
inserisci l'URL pubblico della PWA (una volta attivo GitHub Pages, es.
`https://<utente>.github.io/indovina/quorum/`), scarica il pacchetto iOS e segui
le stesse istruzioni di firma/upload in Xcode. Serve comunque un Mac per l'upload.
