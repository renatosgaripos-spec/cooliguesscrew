#!/usr/bin/env bash
# ============================================================
# build-images.sh
# Builds light web previews from the collection originals.
#   in:   "Cool I Guess Crew/CIGC #<N>.png"  (2000x2000)
#   out:  "images/<N>.jpg"                    (480px, q80)
# Run from the project root:  bash scripts/build-images.sh
# Requires only macOS sips (built in).
# ============================================================
set -euo pipefail

SRC_DIR="Cool I Guess Crew"
OUT_DIR="images"
SIZE=480
QUALITY=80
COUNT=2000

mkdir -p "$OUT_DIR"

echo "Building $COUNT previews -> ${SIZE}px JPEG q${QUALITY} ..."
seq 1 "$COUNT" | xargs -P 8 -I{} \
  sips -s format jpeg -s formatOptions "$QUALITY" -Z "$SIZE" \
  "$SRC_DIR/CIGC #{}.png" --out "$OUT_DIR/{}.jpg" >/dev/null 2>&1

echo "Done: $(ls "$OUT_DIR"/*.jpg | wc -l | tr -d ' ') files, $(du -sh "$OUT_DIR" | cut -f1)"
