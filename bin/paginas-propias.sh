#!/bin/bash
# Trayectoria y Formación como páginas propias (27-sep-2026).
#  1) Sube el worker + panel (Cloudflare): el panel gana las pestañas Trayectoria y Formación.
#  2) Mueve el contenido de esas secciones desde "Acerca de" a sus páginas (sin reescribir nada),
#     apunta el menú de la portada a /trayectoria y /formacion y las agrega al header.
#  3) Publica la web (Vercel vía GitHub).
# Guarda respaldo del web_json antes de escribir. Uso: cd ~/Code/nicole-web && bin/paginas-propias.sh
set -euo pipefail
cd "$(dirname "$0")/.."
if [ -f .cf-api-token.local ]; then export CLOUDFLARE_API_TOKEN="$(tr -d '[:space:]' < .cf-api-token.local)"; export CLOUDFLARE_ACCOUNT_ID=75cb4a4b2c79cc325e43d7ce7192fb28; fi
mkdir -p logs
q(){ npx wrangler d1 execute nicole-crm --remote --json --command "$1" 2>/dev/null; }

echo "① Render + worker y panel (Cloudflare)…"
npm run render >/dev/null
npx wrangler deploy >/dev/null && echo "   ✅ Worker y panel publicados"

echo "② Moviendo contenido a sus páginas…"
STAMP=$(date +%Y%m%d-%H%M%S)
q "SELECT clave, valor FROM config WHERE clave IN ('web_json','web_version')" > "logs/web-antes-$STAMP.json"
echo "   Respaldo: logs/web-antes-$STAMP.json"
python3 bin/migrar-paginas-propias.py "logs/web-antes-$STAMP.json" "logs/web-cambio-$STAMP.sql"
npx wrangler d1 execute nicole-crm --remote --file "logs/web-cambio-$STAMP.sql" >/dev/null
q "SELECT valor FROM config WHERE clave='web_json'" | python3 -c "
import json,sys
w=json.loads(json.load(sys.stdin)[0]['results'][0]['valor'])
t=len(w.get('trayectoria',{}).get('bloques',[])); f=len(w.get('formacion',{}).get('bloques',[]))
print('   En la base: Trayectoria', t, 'bloques · Formación', f, 'bloques · Acerca de', len(w['acerca'].get('bloques',[])), 'bloques')
print('   Header:', ' · '.join(n['texto'] for n in w.get('nav',[])))
sys.exit(0 if t and f else 1)" || { echo "⚠️ No se escribió (Nicole publicó algo justo ahora). Vuelve a correr el script."; exit 1; }

echo "③ Web (Vercel vía GitHub)…"
git add src/lib/web-render.mjs public/js/web-render.js panel/web/web-render.js panel/web/global.css src/layouts/Layout.astro \
  src/pages/trayectoria.astro src/pages/formacion.astro bin/postbuild.mjs worker/index.js panel/admin/crm/index.html \
  bin/paginas-propias.sh bin/migrar-paginas-propias.py bin/menu-acerca.sh
git commit -q -m "Trayectoria y Formación como páginas propias, editables desde el panel y en el header" || true
git push -q && echo "   ✅ Publicado; Vercel tarda ~1 min"
echo "✅ Listo"
