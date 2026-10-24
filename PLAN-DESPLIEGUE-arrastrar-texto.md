# Nicole: arrastrar y estirar textos en «Mi web» — plan de despliegue y rollback

Rama local `nicole-arrastrar-texto-24oct` (worktree `/Users/andres/Code/nicole-web-arrastrar`, sale de `main` = `817b5e2`).
**Nada se desplegó, nada se empujó, no se tocó producción ni su D1/R2.** Pensado para aplicarlo mañana temprano, con el OK de Andrés, cuando Nicole no esté editando.

## Qué hace

En Mi web, al tocar un título, párrafo o dato en la vista previa aparece **«⠿ Mover»** (con mouse o con el dedo) y un cuadrito en la esquina:
- **Mover** a otro lugar de la misma columna o a otra columna de la **misma página** (Acerca de: intro ↔ columna derecha; Sesiones: texto ↔ tarjetas; Contacto: título ↔ datos…). No se mueven textos entre páginas distintas.
- **Estirar** ancho (% de su columna) y alto mínimo; el texto se reacomoda sin desbordar. En la vista «Celular» el tamaño se guarda aparte (vale solo para celular); en «Computador», aparte.
- **Deshacer / Rehacer / Descartar cambios** (los de siempre) también deshacen esto. Botón nuevo **«Volver a como estaba (lugares y tamaños)»**: quita lo movido y estirado, no toca los textos.
- Se guarda dentro de `web_json` como `layout` y sale con «Publicar cambios». La web pública lo respeta y en celular usa las medidas de celular.

**Compatibilidad:** sin `layout`, el HTML de las 6 páginas sale **idéntico byte por byte** al de hoy (probado contra una foto del render anterior). Las webs ya publicadas no cambian.
**Base de datos:** SIN migración. `layout` vive dentro del JSON de `config.web_json` (la tabla ya existe). Las claves nuevas son opcionales.

## Qué se cambió (6 archivos fuente + 3 generados)
`src/lib/web-render.mjs` (render por bloques + `layoutLimpio`), `worker/index.js` (`wLayout` en `sanearWeb`: sin esto el worker borraría el layout al guardar), `panel/admin/crm/index.html` (editor, historial, botón), `public/styles/global.css` (clases `.nl-b`), y los generados por `npm run render`: `public/js/web-render.js`, `panel/web/web-render.js`, `panel/web/global.css`. Tests nuevos: `tests/web-layout.test.mjs`, `tests/web-layout-worker.test.mjs`, `tests/_fixtures-web.mjs`, `tests/golden-paginas.json`, `tests/e2e/mi-web-arrastrar.e2e.mjs`.

## Cómo se probó (todo local)
| Prueba | Resultado |
|---|---|
| `node --test tests/*.test.mjs` (con fontkit de `nicole-web-wt/INT/node_modules`) | **62/62** (los 43 de antes + 19 nuevos: compatibilidad byte a byte, reglas de validación, worker = render, orden/mover/estirar, seguridad) |
| Navegador real (Playwright) contra `wrangler dev --local` con D1/R2 locales, sin cuenta ni IA ni cron: mover con mouse, deshacer/rehacer, pasar a otra columna, estirar PC y celular, publicar, leer lo guardado, web publicada en 1440 y 375 px sin desborde, **mover con el dedo (touch)**, «volver a como estaba» | **todo verde** |
Nota: en el entorno de QA la antigua `fuentes.test.mjs` necesita `fontkit`; el checkout principal no lo tiene instalado (ya fallaba antes de estos cambios). Con `npm ci` pasa.

## Antes de desplegar (preflight, ~15 min)
1. **Confirmar qué hay en producción.** Esta rama sale de `main`, que ya incluye el panel de letras del 22-oct. Ver si está desplegado: `wrangler deployments list` y abrir `/admin/crm/` → Mi web → Diseño: ¿existen «Mis tipografías»? Si **no** está desplegado, este despliegue sube ambas cosas juntas: seguir también `GUIA-DESPLIEGUE-Y-ROLLBACK.md` del panel de letras (respaldo D1 + fuentes R2).
2. Anotar el **ID de versión actual** del worker (para rollback) y el despliegue actual de Vercel.
3. Respaldo (solo Andrés, cuenta de Nicole): `wrangler d1 export nicole-crm --remote --output <ruta-privada>.sql`. No se agrega SQL nuevo, pero la tabla `config` guarda `web_json`.
4. Asegurar que Nicole **no tiene cambios sin publicar abiertos** en el editor: recargar el panel descarta lo que esté solo en su navegador (lo publicado no se pierde).
5. En el checkout de despliegue: `npm ci && npm run render && node --test tests/*.test.mjs` (62/62).
6. No crear `layout` a mano en producción ni usar los datos de prueba.

## Orden recomendado
1. **Web primero (Git → Vercel).** Integrar la rama a la rama de producción de Vercel (Andrés confirma cuál es; no asumir `main`). El render nuevo es idéntico sin datos, así que es seguro y deja la web lista para leer `layout` en cuanto exista. Verificar `nicoleolavarria.com` igual que antes (portada, acerca, sesiones, contacto a 375 y 1440).
2. **Worker + panel (mismo `wrangler deploy`).** Desde el mismo commit: `wrangler deploy`. Verificar `GET /api/publico` (200, igual que antes) y `POST /api/admin/web` sin token → 401.
3. **Validar con Nicole o con Andrés** en `/admin/crm/` → Mi web → una página (p. ej. Acerca de): tocar un párrafo → «Mover» → arrastrar → «Deshacer» → mover otra vez → «Publicar cambios» → recargar y comprobar → abrir la web pública (desde el celular también) → «Volver a como estaba» → «Publicar cambios» para dejarlo como estaba si fue solo prueba.
(Si se hace al revés —worker antes que la web— no pasa nada grave: lo que Nicole publique con lugares/tamaños se verá en la web pública solo cuando suba el render nuevo.)

## Rollback
- **Worker + panel:** `wrangler rollback <VERSION_ANTERIOR_CONFIRMADA>`. Verificar que `/admin/crm/` ya no muestra «⠿ Mover» ni el botón «Volver a como estaba…». Un worker viejo **ignora** `layout` y lo descarta si Nicole publica de nuevo: se pierde solo la personalización de lugares/tamaños, nunca los textos. No toca D1 ni R2.
- **Web:** restaurar el despliegue anterior en Vercel (o revertir el commit y empujar a la rama de producción). El render viejo ignora `layout`: la web vuelve a su orden de siempre.
- **Datos:** no hay migración que deshacer. Si hubiera que quitar el layout de la web sin revertir código: en el panel, «Volver a como estaba (lugares y tamaños)» + «Publicar cambios».
- No restaurar D1 completa por este cambio: pisaría lo que Nicole haya hecho mientras tanto.

## Riesgos conocidos y límites
- Los lugares se guardan por **posición** del texto (`acerca.bloques.2`). Si Nicole sube/baja/borra párrafos con los botones de la lista, el panel mueve sus lugares y tamaños con ellos (probado). Si cambia datos fuera del editor, un id viejo se ignora sin romper.
- No se mueven textos entre páginas ni se mueven fotos; el botón «agenda aquí» de Sesiones se mueve dentro de su columna, pero su copia de abajo es fija.
- La vista previa en el celular (panel abierto desde un teléfono) funciona con pointer events, pero arrastrar en una pantalla muy chica es incómodo; en tablet/PC va bien.
- Probado solo en Chromium. Falta una pasada manual en Safari/iPhone real antes de avisar a Nicole.

## Probar en local (para reproducir las pruebas de navegador)
```sh
# configuración local SIN account_id, IA ni cron (el wrangler.toml real NO se usa)
wrangler d1 execute DB --local --config <wrangler.local.toml> --persist-to <estado-nuevo> --file <db/schema.sql + schema-v2..v18 concatenados>
wrangler dev --local --config <wrangler.local.toml> --persist-to <estado-nuevo> --ip 127.0.0.1 --port 18790 --var ADMIN_TOKEN:<token-local-aleatorio>
E2E_TOKEN=<token-local-aleatorio> node tests/e2e/mi-web-arrastrar.e2e.mjs
```
`wrangler.local.toml`: nombre `nicole-local-qa`, `main` = `worker/index.js`, `[assets] directory=./panel`, `run_worker_first=["/api/*","/r/*"]`, D1 `DB` y R2 `RECURSOS_R2` locales con ids de relleno. La prueba rechaza cualquier `BASE` que no sea 127.0.0.1/localhost.

---
## Añadido el 24-oct-2026 (pedido de Andrés para mañana): header parejo y favicon

### Header con el mismo espaciado
Causa: cada enlace del menú de la portada llevaba un margen puesto a mano (`nth-child(2..5)`, uno incluso negativo) y el nombre del sitio quedaba en la otra punta. Se quitaron y ahora **todo** el header (nombre del sitio y enlaces) usa una sola variable `--hgap` (`clamp(22px, 4.6·u, 76px)`; en celular 16–24px), igual en horizontal y vertical cuando los enlaces pasan a otro renglón. Solo CSS (`public/styles/global.css` + su copia generada). Medido con navegador en 1440/1024/768/390 px, en inicio, acerca, sesiones y contacto: separación idéntica entre cada par (66 px a 1440), sin desborde. Prueba: `node tests/e2e/header-espaciado.e2e.mjs`.
Rollback: revertir ese CSS; no toca datos.

### Favicon (BORRADOR, falta la referencia de AMAIA)
No pude ver el favicon de AMAIA (no encontré su sitio oficial desde aquí). Quedó un borrador: **«N» en Homemade Apple** (la tipografía de los títulos de nicoleolavarria.com) convertida a curva, sobre el rosa actual. `node scripts/build-favicon.mjs` regenera `public/favicon.svg`, `favicon-32.png`, `apple-touch-icon.png` e `icon-512.png`; acepta `FONDO`, `TINTA` y `LETRA` para ajustar colores/forma en cuanto Andrés pase la referencia (captura o link). Pendiente confirmar: color de fondo y de la letra, si va con fondo cuadrado o redondo, y el margen de la letra.
Despliegue: viaja con la web (Vercel). Los navegadores cachean favicons: puede tardar en verse; `og-nicole-olavarria.png` no se tocó.
