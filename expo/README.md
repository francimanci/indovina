# Insieme — wrapper Expo Go 📱

Questo è un piccolo "guscio" **Expo** che mostra l'app web *Insieme* dentro un WebView,
così puoi aprirla in **Expo Go** per testarla dal telefono.

> ⚠️ Importante: l'app web deve essere **online**. Expo Go carica l'indirizzo in
> `App.js` → `APP_URL` (di default `https://francimanci.github.io/indovina/`).
> Quindi prima attiva GitHub Pages (vedi `../docs/README.md`).
>
> Nota: dato che *Insieme* è un'app web, questo wrapper mostra esattamente le stesse
> cose della PWA ("Aggiungi a schermata Home"). Expo Go è utile soprattutto come
> primo passo verso un'app nativa/TestFlight.

## Modo più semplice: Expo Snack (solo browser + telefono, niente computer)

1. Sul telefono installa **Expo Go** (App Store / Play Store).
2. Vai su **snack.expo.dev** (da telefono o PC) e crea un nuovo Snack.
3. Nel file `App.js` incolla il contenuto di [`App.js`](./App.js) di questa cartella.
4. Snack rileva `react-native-webview` e lo aggiunge da solo (se chiede, conferma).
5. In alto scegli **My Device** → **Run** e apri in **Expo Go** (scansiona il QR o tocca "Open").

## Modo con computer (Node installato)

```bash
cd expo
npm install
npx expo start --tunnel   # --tunnel così il telefono si collega da qualsiasi rete
```

Poi apri **Expo Go** sul telefono e scansiona il QR mostrato nel terminale/browser.

## Cambiare l'indirizzo caricato

Modifica `APP_URL` in `App.js` se pubblichi l'app su un altro indirizzo.
