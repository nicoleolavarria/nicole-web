#!/usr/bin/env python3
"""Mueve las secciones TRAYECTORIA y FORMACIÓN de acerca.bloques a sus páginas propias.
No reescribe texto: traslada los bloques tal cual. Idempotente: si ya se movieron, no hace nada.
Uso: migrar-paginas-propias.py <respaldo.json de wrangler> <salida.sql>"""
import json, sys, unicodedata, re

def slug(t):
    t = unicodedata.normalize("NFD", str(t or "").lower())
    t = "".join(c for c in t if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9]+", "-", t).strip("-")

entrada, salida = sys.argv[1], sys.argv[2]
rows = {r["clave"]: r["valor"] for r in json.load(open(entrada))[0]["results"]}
web = json.loads(rows["web_json"])
acerca = web.setdefault("acerca", {})
bloques = acerca.get("bloques", [])

PAGINAS = {"trayectoria": "Trayectoria", "formacion": "Formación"}
quedan, actual = [], None
movidos = {k: [] for k in PAGINAS}
for b in bloques:
    if b.get("tipo") == "titulo":
        s = slug(b.get("texto"))
        actual = s if s in PAGINAS else None
        if actual:
            continue  # el título pasa a ser el título de la página
    (movidos[actual] if actual else quedan).append(b)

for clave, titulo in PAGINAS.items():
    pag = web.setdefault(clave, {})
    if pag.get("bloques"):
        print(f"   {titulo}: ya tenía contenido, no se toca")
        continue
    pag["titulo"] = pag.get("titulo") or titulo
    pag["bloques"] = movidos[clave]
    print(f"   {titulo}: {len(movidos[clave])} bloques movidos")
if all(web[k].get("bloques") for k in PAGINAS):
    acerca["bloques"] = quedan

# Menú de la portada: de anclas a páginas.
for e in web.get("inicio", {}).get("enlaces", []):
    if e.get("url") == "/acerca-de#trayectoria": e["url"] = "/trayectoria"
    if e.get("url") == "/acerca-de#formacion": e["url"] = "/formacion"

# Header: agregar después de "acerca de", con el mismo estilo en minúsculas.
nav = web.get("nav") or []
urls = [n.get("url") for n in nav]
nuevos = [n for n in ({"texto": "trayectoria", "url": "/trayectoria"}, {"texto": "formación", "url": "/formacion"}) if n["url"] not in urls]
if nuevos and nav:
    pos = next((i + 1 for i, n in enumerate(nav) if n.get("url") == "/acerca-de"), len(nav))
    web["nav"] = nav[:pos] + nuevos + nav[pos:]

texto = json.dumps(web, ensure_ascii=False).replace("'", "''")
ver = rows.get("web_version", "").replace("'", "''")
open(salida, "w").write(
    f"UPDATE config SET valor = '{texto}' WHERE clave = 'web_json' AND (SELECT valor FROM config WHERE clave='web_version') = '{ver}';\n"
    f"UPDATE config SET valor = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE clave = 'web_version' AND valor = '{ver}';\n")
