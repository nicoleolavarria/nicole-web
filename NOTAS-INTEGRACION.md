# Notas de integración: agente C (interfaz del panel)

Rama `panel-C-ui`. Cambios solo en `panel/admin/crm/index.html` y `tests/panel-letras.test.mjs`.

## Qué hace la interfaz (Mi web > Diseño)
- **Letras de tu web**: lista de 5 partes (menú, «Hola» de la portada, texto bajo el «Hola», títulos, texto). Por parte: letra (selector con cada nombre en su tipografía, incluidas las subidas), tamaño en computador y en celular (deslizador, número y botones − / + de 1 en 1, rangos del contrato), grosor (Original / Normal / Negrita), espacio entre renglones (1.0 a 3.0), y "Volver al original de esta parte". Botón general "Volver al original (todas las partes)".
- Escribe solo en `estilo.tipos.<parte>.{fuente,tam,tam_movil,peso,interlineado}` con valores vacíos o "" cuando está en original. Se guarda con "Publicar cambios" como el resto de Mi web.
- Clic en una parte de la vista previa (solo estando en Diseño) elige esa parte en el editor. En la vista previa, la parte elegida se resalta con un contorno.
- **Deshacer / Rehacer** (botones y Ctrl/Cmd + Z, Ctrl/Cmd + Y o Ctrl/Cmd + Shift + Z), hasta 50 pasos. Dentro de cajas de texto se deja el comportamiento normal del navegador.
- **Ver en: Computador | Celular**: cambia el iframe entre 1440 px (escalado para caber) y 390 px con marco de teléfono, sin recargar el contenido. Las @media se evalúan con el ancho real.
- **Mis tipografías**: botón "Subir mi tipografía" (.woff2, .woff, .ttf, .otf; 1 MB; máximo 8), progreso, nombre editable, lista con "Quitar".
- Ya no aparece el selector nativo `<select>` de letras: los selectores generales (letra de títulos y de textos) usan el mismo selector con vista previa.
- El botón superior "Deshacer" (que descartaba todo lo no publicado) pasó a llamarse **Descartar cambios**. "Deshacer" y "Rehacer" ahora son los de un paso.

## Contrato que consume (agentes A y B)
1. **Agente B (render)**: la vista previa solo cambia tamaños, grosor, interlineado y letras de las partes si `web-render.mjs` / `estiloCss` generan:
   - variables `--t-<menu|titulo-inicio|subtitulo-inicio|titulos|texto>-{fuente,tam,tam-m,peso,lh}` (según el contrato) y las reglas de CSS que las usan;
   - `@font-face` para cada `estilo.fuentes_subidas`, con **familia `nicole-up-<id>`** (así lo define el panel para las listas) y `src: url(<ORIGEN>/fuentes/<id>.<formato>)`. Si B usa otro nombre de familia, hay que cambiarlo en `cssFuentesSubidas()` del panel (una sola línea) o usar el mismo.
   - Hoy, con el render actual, los cambios de tamaño no se ven en la vista previa. Es lo esperado hasta que B entregue el CSS.
   - La vista previa carga Google Fonts de `estilo.tipos` por su cuenta (`prepararFrame`), así que no depende de B para cargar letras.
2. **Agente A (worker)**:
   - `POST /api/web/fuente` (multipart `archivo` + `nombre`), autenticado con `Authorization: Bearer <token>` (el mismo que la subida de fotos, que hoy usa `/api/admin/web/foto`). El panel espera JSON `{id, nombre, formato}`; ignora `url`.
   - Códigos que el panel traduce a mensajes: 409 (nombre en uso), 413 (pesa más de 1 MB), 415 (tipo de archivo), 400 (archivo no válido), 401/403 (sesión). Cualquier otro error, o que el endpoint no exista (404), muestra "todavía no está disponible". Al responder 404 el panel no rompe nada.
   - `DELETE /api/web/fuente/<id>`: 200 o 404 (404 se trata como ya quitada). 409 con `{usos: [...]}` (textos o objetos con `etiqueta`/`donde`) para mostrar dónde está en uso.
   - El saneo de `estilo.fuentes_subidas` debe aceptar `{id, nombre, formato}` con `id` `[a-z0-9_]+` y formatos woff2/woff/ttf/otf. El panel valida lo mismo antes de guardar.
   - El panel usa rutas relativas `/api/...` (mismo origen que el CRM).
3. **Publicación**: la lista de tipografías subidas se guarda en `web_json` solo al pulsar "Publicar cambios". Si Nicole sube una fuente y no publica, el archivo queda en R2 sin estar en la lista. Decidir si conviene guardarla al subir o limpiar huérfanas.

## Pruebas
- `node --test tests/portada.test.mjs tests/panel-letras.test.mjs`: pasan.
- Chrome headless (Playwright sobre Google Chrome instalado) con API simulada: partes, selector con 13 letras + subidas, tamaños con ±, grosor, interlineado, deshacer (22 pasos), publicar (payload con `estilo.tipos`), vista Celular a 390 px, subida con progreso, errores 409/413/415/404, validación de tipo y tamaño en el panel, quitar. Capturas revisadas: escritorio, selector, editor, vista celular, formulario de subida y panel en 390 px sin scroll horizontal.
- Las pruebas de navegador están en la carpeta de trabajo (no en el repo) porque dependen de Playwright global.
