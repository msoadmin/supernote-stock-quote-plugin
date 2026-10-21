#!/bin/bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
NAME="StockQuote"
GEN="$ROOT/build/generated"
OUT="$ROOT/build/outputs"
rm -rf "$GEN" && mkdir -p "$GEN" "$OUT"
cd "$ROOT"
npx react-native bundle --entry-file index.js --bundle-output "$GEN/$NAME.bundle" --platform android --assets-dest "$GEN" --dev false
cp PluginConfig.json "$GEN/PluginConfig.json"
cp assets/icon/icon.png "$GEN/icon.png"
python3 - <<'PY'
import json
p='build/generated/PluginConfig.json'
d=json.load(open(p)); d['iconPath']='/icon.png'; json.dump(d,open(p,'w'),indent=2)
PY
rm -f "$OUT/$NAME.zip" "$OUT/$NAME.snplg"
(cd "$GEN" && zip -r "$OUT/$NAME.zip" .)
cp "$OUT/$NAME.zip" "$OUT/$NAME.snplg"
echo "Built: $OUT/$NAME.snplg"
