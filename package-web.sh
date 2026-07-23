#!/usr/bin/env bash
# Build the web release and zip it into ./lhct-web.zip
# The zip holds the files at top level (index.html, assets/, …) — not nested in
# a dist/ folder — so it drops straight into S3 / AWS Amplify / Netlify.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"

"$ROOT/build-web.sh"

ZIP="$ROOT/lhct-web.zip"
rm -f "$ZIP"
( cd "$ROOT/dist" && zip -r -q "$ZIP" . -x '.*' )

echo
echo "✔ Zipped → $ZIP"
unzip -l "$ZIP"
