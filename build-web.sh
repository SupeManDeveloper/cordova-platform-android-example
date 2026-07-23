#!/usr/bin/env bash
# Build the deployable web release of "Lật Hình Cổ Tích" into ./dist
# Usage:  ./build-web.sh
#
# It takes www/index_simple.html (the source) as the entry index.html and copies
# only the assets the simple build actually uses (drops bg-game.png ~2 MB and the
# other index_*.html files). Output in dist/ is a static site you can upload to
# any host (Netlify, Vercel, GitHub Pages, S3, nginx, …). Serve over HTTPS so the
# PWA / service worker + audio autoplay-unlock work.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
SRC="$ROOT/www"
OUT="$ROOT/dist"

echo "▶ Building web release into: $OUT"
rm -rf "$OUT"
mkdir -p "$OUT/assets"

# Entry point: the simple build becomes index.html
cp "$SRC/index_simple.html" "$OUT/index.html"

# PWA files
cp "$SRC/manifest.webmanifest" "$OUT/"
cp "$SRC/sw.js"                "$OUT/"
cp "$SRC/icon.svg"             "$OUT/"

# Only the audio the game references (SFX + 2 BGM tracks). bg-game.png is unused.
for a in click.mp3 matched.mp3 completed.mp3 BGM1.mp3 BGM2.mp3; do
  cp "$SRC/assets/$a" "$OUT/assets/$a"
done

# Share/thumbnail artwork (og:image). Include if present.
[ -f "$SRC/assets/logo.png" ] && cp "$SRC/assets/logo.png" "$OUT/assets/logo.png"

echo "✔ Done. Contents:"
du -ah "$OUT" | sort -k2
echo
echo "Preview locally:  python3 -m http.server 8091 --directory dist"
echo "Then open:        http://localhost:8091/"
