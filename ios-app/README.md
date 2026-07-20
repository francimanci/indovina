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

## 🚀 Caricamento AUTOMATICO su TestFlight (senza Mac)

C'è un workflow GitHub Actions (`.github/workflows/ios-testflight.yml`) che gira su
un **runner macOS di GitHub** e fa tutto da solo: compila, firma e **carica la build
su TestFlight**. Tu non devi possedere un Mac: bastano le credenziali Apple salvate
come *Secrets* del repository.

### 1) Cosa ti serve dall'account Apple Developer
- **Chiave API App Store Connect** (App Store Connect → *Users and Access* → *Integrations/Keys* →
  crea una chiave con ruolo *App Manager*). Ottieni: **Key ID**, **Issuer ID** e il file **`.p8`**.
- **Team ID** (App Store Connect → *Membership*).
- Un'**app registrata** con Bundle ID `com.francimanci.quorum` (o quello che scegli;
  se lo cambi, aggiornalo anche in `capacitor.config.json`).
- Un **certificato di distribuzione** in formato **`.p12`** (vedi sotto come crearlo
  anche senza Mac).

### 2) Segreti da aggiungere su GitHub
Repo → *Settings* → *Secrets and variables* → *Actions* → **New repository secret**:

| Secret | Contenuto |
| --- | --- |
| `ASC_KEY_ID` | Key ID della chiave API |
| `ASC_ISSUER_ID` | Issuer ID |
| `ASC_KEY_P8` | Contenuto **integrale** del file `.p8` (incolla tutto, righe `-----BEGIN...`) |
| `APPLE_TEAM_ID` | Il tuo Team ID (10 caratteri) |
| `DIST_CERT_P12_BASE64` | Il certificato `.p12` codificato in base64 |
| `DIST_CERT_PASSWORD` | La password del `.p12` (vuota se non impostata) |

Per ottenere `DIST_CERT_P12_BASE64` da un file `dist.p12`:
```bash
base64 -i dist.p12 | tr -d '\n'      # macOS/Linux: copia l'output nel secret
```

### 3) Creare il certificato `.p12` SENZA un Mac (con openssl)
```bash
# a) chiave privata + richiesta certificato (CSR)
openssl genrsa -out dist.key 2048
openssl req -new -key dist.key -out dist.csr -subj "/CN=Quorum Distribution/O=Quorum"

# b) su developer.apple.com → Certificates → "+" → "Apple Distribution",
#    carica dist.csr e scarica il file distribution.cer

# c) converti in PEM e crea il .p12
openssl x509 -in distribution.cer -inform DER -out dist.pem -outform PEM
openssl pkcs12 -export -out dist.p12 -inkey dist.key -in dist.pem -passout pass:MiaPassword
```
Usa `dist.p12` per `DIST_CERT_P12_BASE64` e `MiaPassword` per `DIST_CERT_PASSWORD`.

### 4) Avviare
- Vai nella tab **Actions** → workflow **iOS · TestFlight** → **Run workflow**,
  **oppure** pubblica un tag: `git tag ios-v1.0.0 && git push origin ios-v1.0.0`.
- A fine job la build compare in **App Store Connect → TestFlight** (dopo qualche
  minuto di elaborazione). Aggiungi te stesso come tester e installala da TestFlight.

> ⚠️ Non ho potuto eseguire/validare questa pipeline da qui (serve macOS + le tue
> credenziali Apple). È costruita sulla ricetta standard fastlane; al primo giro
> potrebbe servire un piccolo aggiustamento (di solito Bundle ID o Team ID). Se un
> run fallisce, incollami il log del job e lo sistemo.

## Alternativa senza riga di comando
In alternativa a Capacitor puoi usare **[PWABuilder](https://www.pwabuilder.com)**:
inserisci l'URL pubblico della PWA (una volta attivo GitHub Pages, es.
`https://<utente>.github.io/indovina/quorum/`), scarica il pacchetto iOS e segui
le stesse istruzioni di firma/upload in Xcode. Serve comunque un Mac per l'upload.
