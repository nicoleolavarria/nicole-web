#!/usr/bin/env node
/**
 * Post-build de nicoleolavarria.com.
 *
 * @astrojs/sitemap 3.2.1 escribe `sitemap-index.xml` + `sitemap-0.xml` y no deja
 * renombrarlos. Pero Google Search Console, Bing, los auditores y los rastreadores de
 * IA prueban primero `/sitemap.xml`, y ahí el sitio devolvía 404. Se publica el índice
 * también con ese nombre: un índice de sitemaps vale con CUALQUIER nombre de archivo y
 * las URLs de adentro son absolutas, así que la copia apunta al mismo sitemap-0.xml.
 *
 * Falla RUIDOSO si el sitemap no existe o sale vacío: una copia que no se hizo en
 * silencio es exactamente el bug que se está arreglando.
 */
import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const DIST = join(process.cwd(), 'dist');
const ORIGEN = join(DIST, 'sitemap-index.xml');
const DESTINO = join(DIST, 'sitemap.xml');

if (!existsSync(ORIGEN)) {
  console.error('✖ postbuild: no existe dist/sitemap-index.xml. ¿Se cayó @astrojs/sitemap?');
  process.exit(1);
}

copyFileSync(ORIGEN, DESTINO);

const xml = readFileSync(DESTINO, 'utf8');
const n = (xml.match(/<loc>/g) || []).length;
if (n === 0) {
  console.error('✖ postbuild: dist/sitemap.xml salió sin ni un <loc>.');
  process.exit(1);
}

/* El sitemap real (sitemap-0.xml) es el que lleva las páginas: se comprueba que estén
   todas y en www, porque un <loc> que redirige es un aviso en Search Console. */
const HOJA = join(DIST, 'sitemap-0.xml');
if (existsSync(HOJA)) {
  const hoja = readFileSync(HOJA, 'utf8');
  const urls = [...hoja.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const malas = urls.filter((u) => !u.startsWith('https://www.nicoleolavarria.com'));
  if (malas.length) {
    console.error('✖ postbuild: hay URLs fuera del dominio canónico www:', malas.join(', '));
    process.exit(1);
  }
  console.log(`✔ postbuild: sitemap.xml publicado · ${urls.length} URLs en www`);
} else {
  console.log(`✔ postbuild: sitemap.xml publicado (índice con ${n} sitemap${n === 1 ? '' : 's'}).`);
}

/* ---------------------------------------------------------------------------
   /llms-full.txt — el texto de las páginas, para los asistentes de IA.

   Se GENERA del HTML recién construido en vez de escribirse a mano: el contenido de
   esta web lo edita Nicole desde su CRM, así que un archivo fijo empezaría a mentir
   la primera vez que ella cambie un párrafo. Acá siempre dice lo que la página dice.
   El resumen curado (quién es, qué enseña, cómo se reserva) sí es fijo y vive en
   public/llms.txt.
--------------------------------------------------------------------------- */
const CANONICO = 'https://www.nicoleolavarria.com';
const PAGINAS = [
  ['/', 'index.html'],
  ['/acerca-de', 'acerca-de/index.html'],
  ['/sesiones', 'sesiones/index.html'],
  ['/horarios', 'horarios/index.html'],
  ['/contacto', 'contacto/index.html'],
];

function textoDe(html) {
  const cuerpo = (html.split(/<body[^>]*>/i)[1] || '').split(/<\/body>/i)[0];
  return cuerpo
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<svg[\s\S]*?<\/svg>/gi, '')
    .replace(/<\/(h[1-6]|p|div|li|section|header|footer|tr)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .split('\n')
    .map((l) => l.replace(/[ \t]+/g, ' ').trim())
    .filter(Boolean)
    .join('\n');
}

const partes = [
  '# nicoleolavarria.com — texto completo del sitio',
  '',
  'Generado en cada despliegue a partir de las páginas publicadas. Resumen corto en',
  CANONICO + '/llms.txt',
  '',
];
let hechas = 0;
for (const [ruta, archivo] of PAGINAS) {
  const f = join(DIST, archivo);
  if (!existsSync(f)) continue;
  const html = readFileSync(f, 'utf8');
  const titulo = (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [, ''])[1].trim();
  partes.push('---', '', `## ${titulo}`, CANONICO + ruta, '', textoDe(html), '');
  hechas++;
}
if (hechas < PAGINAS.length) {
  console.error(`✖ postbuild: llms-full.txt solo pudo leer ${hechas} de ${PAGINAS.length} páginas.`);
  process.exit(1);
}
writeFileSync(join(DIST, 'llms-full.txt'), partes.join('\n'));
console.log(`✔ postbuild: llms-full.txt generado · ${hechas} páginas`);
