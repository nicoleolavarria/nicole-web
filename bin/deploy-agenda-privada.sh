#!/bin/bash
# Agenda privada de Nicole (26-sep-2026): sube el worker, crea los dos enlaces privados
# y publica las páginas nuevas. Uso:  bash ~/Code/nicole-web/bin/deploy-agenda-privada.sh
set -e
cd "$(dirname "$0")/.."
# La cuenta de Cloudflare es la de Nicole: se entra con su token local, no con el login de Andrés.
if [ -f .cf-api-token.local ]; then export CLOUDFLARE_API_TOKEN="$(tr -d '[:space:]' < .cf-api-token.local)"; export CLOUDFLARE_ACCOUNT_ID=75cb4a4b2c79cc325e43d7ce7192fb28; fi

echo "① Worker (Cloudflare)…"
npx wrangler deploy

echo "② Enlaces privados (solo se crean si no existen)…"
TR=$(openssl rand -hex 12); TL=$(openssl rand -hex 12); TP=$(openssl rand -hex 12)
npx wrangler d1 execute nicole-crm --remote --command \
  "INSERT OR IGNORE INTO config (clave,valor) VALUES ('priv_token_reserva','$TR'),('priv_token_libres','$TL'),('priv_token_panel','$TP');" >/dev/null
TR=$(npx wrangler d1 execute nicole-crm --remote --json --command "SELECT valor FROM config WHERE clave='priv_token_reserva'" | python3 -c "import json,sys;print(json.load(sys.stdin)[0]['results'][0]['valor'])")
TL=$(npx wrangler d1 execute nicole-crm --remote --json --command "SELECT valor FROM config WHERE clave='priv_token_libres'" | python3 -c "import json,sys;print(json.load(sys.stdin)[0]['results'][0]['valor'])")
TP=$(npx wrangler d1 execute nicole-crm --remote --json --command "SELECT valor FROM config WHERE clave='priv_token_panel'" | python3 -c "import json,sys;print(json.load(sys.stdin)[0]['results'][0]['valor'])")
# Enlaces cortos sin ?k= para reservar y reprogramar + PIN de 6 dígitos para Mi agenda.
PINNUEVO=$(python3 -c "import secrets;print(f'{secrets.randbelow(900000)+100000}')")
npx wrangler d1 execute nicole-crm --remote --command \
  "INSERT INTO config (clave,valor) VALUES ('priv_sin_clave','1') ON CONFLICT(clave) DO UPDATE SET valor='1'; INSERT OR IGNORE INTO config (clave,valor) VALUES ('priv_pin_panel','$PINNUEVO');" >/dev/null
PIN=$(npx wrangler d1 execute nicole-crm --remote --json --command "SELECT valor FROM config WHERE clave='priv_pin_panel'" | python3 -c "import json,sys;print(json.load(sys.stdin)[0]['results'][0]['valor'])")

echo "③ ¿Correo a alumnos configurado?"
if npx wrangler secret list 2>/dev/null | grep -q RESEND_API_KEY; then echo "   ✅ RESEND_API_KEY existe"; else echo "   ⚠️  Falta RESEND_API_KEY: la reserva funciona, pero el alumno no recibe correo"; fi

echo "④ Web (Vercel vía GitHub)…"
git add -A worker/index.js src/pages astro.config.mjs vercel.json bin/deploy-agenda-privada.sh
git commit -m "Agenda privada: reservas y reprogramaciones con confirmación de Nicole, WhatsApp y Google Calendar" || true
git push

cat <<FIN

════════ ENLACES DE NICOLE ════════
Separar horario del mes:  https://www.nicoleolavarria.com/horarios-disponibles
Reprogramaciones:         https://www.nicoleolavarria.com/reprogramaciones
Mi agenda (solo Nicole):  https://www.nicoleolavarria.com/mi-agenda   · PIN: $PIN
(Espera 1–2 minutos a que Vercel publique la web antes de probarlos.)
FIN
