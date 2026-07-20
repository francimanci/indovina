#!/usr/bin/env bash
# Copia l'app web (unica fonte di verità: ../docs/quorum) dentro www/
# così Capacitor la impacchetta nell'app iOS.
set -euo pipefail
HERE="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$HERE/../docs/quorum"
DST="$HERE/www"

if [ ! -f "$SRC/index.html" ]; then
  echo "❌ Non trovo $SRC/index.html" >&2
  exit 1
fi

rm -rf "$DST"
mkdir -p "$DST"
cp -R "$SRC/." "$DST/"
# il service worker non serve nell'app nativa (gli asset sono già in bundle e offline)
rm -f "$DST/sw.js"
echo "✅ Web app copiata in www/ ($(ls -1 "$DST" | wc -l | tr -d ' ') file)"
