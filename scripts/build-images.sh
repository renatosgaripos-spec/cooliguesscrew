#!/usr/bin/env bash
# ============================================================
# build-images.sh
# Генерит лёгкие веб-превью из оригиналов коллекции.
#   вход:  "Cool I Guess Crew/CIGC #<N>.png"  (2000x2000)
#   выход: "images/<N>.jpg"                    (480px, q80)
# Запуск из корня проекта:  bash scripts/build-images.sh
# Требует только macOS sips (встроенный).
# ============================================================
set -euo pipefail

SRC_DIR="Cool I Guess Crew"
OUT_DIR="images"
SIZE=480
QUALITY=80
COUNT=2000

mkdir -p "$OUT_DIR"

echo "Конвертирую $COUNT работ -> ${SIZE}px JPEG q${QUALITY} ..."
seq 1 "$COUNT" | xargs -P 8 -I{} \
  sips -s format jpeg -s formatOptions "$QUALITY" -Z "$SIZE" \
  "$SRC_DIR/CIGC #{}.png" --out "$OUT_DIR/{}.jpg" >/dev/null 2>&1

echo "Готово: $(ls "$OUT_DIR"/*.jpg | wc -l | tr -d ' ') файлов, $(du -sh "$OUT_DIR" | cut -f1)"
