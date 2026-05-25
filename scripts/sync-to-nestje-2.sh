#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEST="${1:-$ROOT/../nestje-2/public/assets/brio}"
DRY_RUN=false

for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=true ;;
  esac
done

if [[ ! -d "$DEST" ]]; then
  echo "Destination not found: $DEST" >&2
  exit 1
fi

FILES=(
  src/utils.js
  src/actions.js
  src/binding.js
  src/dialogs.js
  src/feedback.js
  dist/brio.css
)

echo "Sync Brio → $DEST"
for rel in "${FILES[@]}"; do
  src="$ROOT/$rel"
  base="$(basename "$rel")"
  if [[ "$rel" == dist/brio.css ]]; then
    target="$DEST/brio.css"
  else
    target="$DEST/$base"
  fi
  if $DRY_RUN; then
    echo "  would copy $rel → $target"
  else
    cp "$src" "$target"
    echo "  copied $base"
  fi
done

echo "Done."
