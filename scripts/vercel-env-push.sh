#!/usr/bin/env bash
# Carga variables de .env.local en Vercel (production, preview, development)
set -euo pipefail
cd "$(dirname "$0")/.."

if ! vercel whoami &>/dev/null; then
  echo "Primero ejecutá: vercel login"
  exit 1
fi

if [[ ! -f .env.local ]]; then
  echo "No existe .env.local"
  exit 1
fi

# Linkear proyecto si hace falta
if [[ ! -d .vercel ]]; then
  vercel link --yes --project iame-series-argentina 2>/dev/null || vercel link
fi

add_var() {
  local name="$1"
  local value="$2"
  for env in production preview development; do
    printf '%s' "$value" | vercel env add "$name" "$env" --force 2>/dev/null || \
      printf '%s' "$value" | vercel env add "$name" "$env"
  done
  echo "✓ $name"
}

while IFS= read -r line || [[ -n "$line" ]]; do
  [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue
  name="${line%%=*}"
  value="${line#*=}"
  name="$(echo "$name" | xargs)"
  [[ -z "$name" ]] && continue
  add_var "$name" "$value"
done < .env.local

echo ""
echo "Listo. Redeploy: vercel --prod"
