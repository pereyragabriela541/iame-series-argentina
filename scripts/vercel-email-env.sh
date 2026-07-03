#!/usr/bin/env bash
# Carga solo variables de email (Resend) en Vercel
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

if [[ ! -d .vercel ]]; then
  vercel link --yes --project iame-series-argentina 2>/dev/null || vercel link
fi

get_env() {
  local name="$1"
  grep "^${name}=" .env.local | head -1 | cut -d= -f2-
}

add_var() {
  local name="$1"
  local value="$2"
  for env in production preview development; do
    printf '%s' "$value" | vercel env add "$name" "$env" --force 2>/dev/null || \
      printf '%s' "$value" | vercel env add "$name" "$env"
  done
  echo "✓ $name"
}

RESEND_API_KEY="$(get_env RESEND_API_KEY)"
EMAIL_FROM="$(get_env EMAIL_FROM)"
EMAIL_NOTIFY_TO="$(get_env EMAIL_NOTIFY_TO)"

[[ -z "$RESEND_API_KEY" ]] && { echo "Falta RESEND_API_KEY en .env.local"; exit 1; }
[[ -z "$EMAIL_FROM" ]] && EMAIL_FROM="IAME Series Argentina <registracion@bsproyect.com>"
[[ -z "$EMAIL_NOTIFY_TO" ]] && EMAIL_NOTIFY_TO="iameseriesarg@gmail.com"

add_var "RESEND_API_KEY" "$RESEND_API_KEY"
add_var "EMAIL_FROM" "$EMAIL_FROM"
add_var "EMAIL_NOTIFY_TO" "$EMAIL_NOTIFY_TO"

echo ""
echo "Listo. Redeploy: vercel --prod"
