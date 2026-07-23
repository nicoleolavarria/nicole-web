/* Genera la copia "para navegador" de src/lib/web-render.mjs.
   El módulo ESM es la fuente única; de él salen dos artefactos idénticos en
   contenido, uno por consumidor:
     public/js/web-render.js  -> lo carga nicoleolavarria.com en runtime
     panel/web/web-render.js  -> lo carga el editor del CRM (mismo origen que
                                 el worker, así la vista previa no depende de
                                 que Vercel esté arriba)
   Además copia el CSS de la web a panel/web/global.css por la misma razón.
   Correr con `npm run render` (el build de Astro ya lo encadena). */
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const fuente = resolve(raiz, 'src/lib/web-render.mjs');
const src = readFileSync(fuente, 'utf8');

// Detección sobre código, no sobre comentarios: se quitan // … y /* … */ antes de mirar.
const sinComentarios = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/.*$/gm, '');
if (/^\s*import\s/m.test(sinComentarios) || /export\s+default/.test(sinComentarios)) {
  console.error('web-render.mjs no puede tener imports ni export default.');
  process.exit(1);
}

const nombres = [...src.matchAll(/^export\s+(?:const|function)\s+([A-Za-z0-9_]+)/gm)].map((m) => m[1]);
if (!nombres.length) {
  console.error('No se encontró nada exportado en web-render.mjs.');
  process.exit(1);
}

const salida =
  '/* GENERADO por scripts/build-web-render.mjs — no editar a mano.\n' +
  '   Fuente: src/lib/web-render.mjs */\n' +
  '(function (g) {\n' +
  src.replace(/^export\s+/gm, '') +
  '\n  g.WebRender = { ' + nombres.join(', ') + ' };\n' +
  '})(typeof window !== "undefined" ? window : globalThis);\n';

for (const destino of ['public/js/web-render.js', 'panel/web/web-render.js']) {
  const ruta = resolve(raiz, destino);
  mkdirSync(dirname(ruta), { recursive: true });
  writeFileSync(ruta, salida);
}
mkdirSync(resolve(raiz, 'panel/web'), { recursive: true });
copyFileSync(resolve(raiz, 'public/styles/global.css'), resolve(raiz, 'panel/web/global.css'));

console.log('web-render: ' + nombres.length + ' exports -> public/js/ y panel/web/ (+ global.css)');
