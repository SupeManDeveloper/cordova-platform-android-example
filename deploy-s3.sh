#!/usr/bin/env bash
# Deploy dist/ to an S3 bucket with correct MIME types + cache headers.
#
#   ./deploy-s3.sh <bucket-name> [cloudfront-distribution-id]
#
# Prereqs:
#   - aws CLI configured:  aws configure   (needs s3:PutObject/DeleteObject on the bucket)
#   - build first:         ./build-web.sh   (or ./package-web.sh)
#
# IMPORTANT — HTTPS: the PWA (installable + offline service worker) and the audio
# autoplay-unlock only work over HTTPS. The S3 *website* endpoint is HTTP-only, so
# put **CloudFront** (with an ACM certificate) in front of the bucket and pass its
# distribution id as the 2nd arg to auto-invalidate on each deploy.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
DIST="$ROOT/dist"
BUCKET="${1:?Usage: ./deploy-s3.sh <bucket-name> [cloudfront-distribution-id]}"
CF_ID="${2:-}"

[ -f "$DIST/index.html" ] || { echo "dist/ missing — run ./build-web.sh first"; exit 1; }

# 1) Everything except the entry/PWA-control files → long, immutable cache.
echo "▶ Syncing assets (long cache) → s3://$BUCKET"
aws s3 sync "$DIST/" "s3://$BUCKET/" --delete \
  --cache-control "public,max-age=31536000,immutable" \
  --exclude "index.html" --exclude "sw.js" --exclude "manifest.webmanifest"

# 2) index.html / sw.js / manifest → no-cache so new deploys show up immediately.
#    (.webmanifest is not in awscli's mime table, so set it explicitly.)
echo "▶ Uploading entry + PWA files (no-cache)"
aws s3 cp "$DIST/index.html" "s3://$BUCKET/index.html" \
  --cache-control "no-cache" --content-type "text/html; charset=utf-8"
aws s3 cp "$DIST/sw.js" "s3://$BUCKET/sw.js" \
  --cache-control "no-cache" --content-type "text/javascript; charset=utf-8"
aws s3 cp "$DIST/manifest.webmanifest" "s3://$BUCKET/manifest.webmanifest" \
  --cache-control "no-cache" --content-type "application/manifest+json; charset=utf-8"

# 3) Optional CloudFront invalidation.
if [ -n "$CF_ID" ]; then
  echo "▶ Invalidating CloudFront $CF_ID"
  aws cloudfront create-invalidation --distribution-id "$CF_ID" --paths "/*" >/dev/null
fi

echo "✔ Deployed to s3://$BUCKET"
