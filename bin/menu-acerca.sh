#!/bin/bash
# Cambia SOLO el menú sobre la foto de la portada (inicio.enlaces) en la web de Nicole.
# No toca ningún otro texto, foto ni sección. Guarda respaldo del web_json antes de escribir.
set -euo pipefail
cd "$(dirname "$0")/.."
if [ -f .cf-api-token.local ]; then export CLOUDFLARE_API_TOKEN="$(tr -d '[:space:]' < .cf-api-token.local)"; export CLOUDFLARE_ACCOUNT_ID=75cb4a4b2c79cc325e43d7ce7192fb28; fi
mkdir -p logs
q(){ npx wrangler d1 execute nicole-crm --remote --json --command "$1" 2>/dev/null; }

STAMP=$(date +%Y%m%d-%H%M%S)
q "SELECT clave, valor FROM config WHERE clave IN ('web_json','web_version','vercel_deploy_hook')" > "logs/web-antes-$STAMP.json"
echo "Respaldo: logs/web-antes-$STAMP.json"

python3 - "$STAMP" <<'PY'
import json, sys
stamp = sys.argv[1]
rows = {r["clave"]: r["valor"] for r in json.load(open(f"logs/web-antes-{stamp}.json"))[0]["results"]}
web = json.loads(rows["web_json"])
antes = [e.get("texto") for e in web.get("inicio", {}).get("enlaces", [])]
web.setdefault("inicio", {})["enlaces"] = [
  {"texto": "Acerca de", "url": "/acerca-de"},
  {"texto": "Trayectoria", "url": "/acerca-de#trayectoria"},
  {"texto": "Formación", "url": "/acerca-de#formacion"},
  {"texto": "Sesiones 1:1", "url": "/sesiones"},
  {"texto": "Portal del alumno", "url": "/portal/index.html"},
  {"texto": "Contacto", "url": "/contacto"},
]
texto = json.dumps(web, ensure_ascii=False).replace("'", "''")
ver = rows.get("web_version", "").replace("'", "''")
open(f"logs/web-cambio-{stamp}.sql", "w").write(
  # Solo escribe si nadie publicó desde la lectura (misma web_version).
  f"UPDATE config SET valor = '{texto}' WHERE clave = 'web_json' AND (SELECT valor FROM config WHERE clave='web_version') = '{ver}';\n"
  f"UPDATE config SET valor = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE clave = 'web_version' AND valor = '{ver}';\n")
print("Menú antes:  ", " · ".join(antes))
print("Menú después:", " · ".join(e["texto"] for e in web["inicio"]["enlaces"]))
open(f"logs/hook-{stamp}.txt", "w").write(rows.get("vercel_deploy_hook", ""))
PY

npx wrangler d1 execute nicole-crm --remote --file "logs/web-cambio-$STAMP.sql" >/dev/null
NUEVO=$(q "SELECT valor FROM config WHERE clave='web_json'" | python3 -c "import json,sys;w=json.loads(json.load(sys.stdin)[0]['results'][0]['valor']);print(' · '.join(e['texto'] for e in w['inicio']['enlaces']))")
echo "En la base ahora: $NUEVO"
case "$NUEVO" in *Trayectoria*) echo "✅ Menú actualizado";; *) echo "⚠️ No se escribió (Nicole publicó algo justo ahora). Vuelve a correr el script."; exit 1;; esac

HOOK=$(cat "logs/hook-$STAMP.txt"); rm -f "logs/hook-$STAMP.txt"
if [[ "$HOOK" == https://api.vercel.com/* ]]; then curl -s -X POST "$HOOK" >/dev/null && echo "✅ Web reconstruyéndose en Vercel (~1 min)"; fi
