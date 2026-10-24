import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as W from '../src/lib/web-render.mjs';
import { PAGINAS, WEBS } from './_fixtures-web.mjs';

const GOLDEN = JSON.parse(readFileSync(new URL('./golden-paginas.json', import.meta.url), 'utf8'));
const con = (layout, base = WEBS.editada) => Object.assign({}, base, { layout });
const pos = (h, s) => h.indexOf(s);

test('sin layout, las seis páginas salen IDÉNTICAS a como salían antes (byte por byte)', () => {
  for (const [w, d] of Object.entries(WEBS)) {
    for (const pg of PAGINAS) assert.equal(W.htmlPagina(pg, d), GOLDEN[`${w}/${pg}`], `${w}/${pg}`);
  }
  for (const pg of PAGINAS) assert.equal(W.htmlDocumento(pg, WEBS.editada), GOLDEN.__docs[pg], `documento ${pg}`);
});

test('un layout vacío o basura tampoco cambia nada', () => {
  for (const basura of [{}, { acerca: {} }, { acerca: { secs: {}, tam: {} } }, { acerca: 'x' }, { __proto__: { acerca: 1 } }, null, 7, [], { acerca: { secs: { intro: 'no' } } }, { acerca: { tam: { 'cosa.rara': { w: 50 } } } }]) {
    for (const pg of PAGINAS) assert.equal(W.htmlPagina(pg, con(basura)), GOLDEN[`editada/${pg}`], JSON.stringify(basura) + ' ' + pg);
  }
});

test('layoutLimpio descarta ids inventados, repetidos o de otra página, y topa las medidas', () => {
  const l = W.layoutLimpio({
    acerca: { secs: { intro: ['acerca.titulo', 'acerca.titulo', 'acerca.intro.1', '<script>', 'sesiones.titulo', 'acerca.bloques.1', '@cta'], mensual: ['x'] },
              tam: { 'acerca.intro.0': { w: 5000, h: -3, wm: 'abc', hm: 99999 }, 'otra.cosa': { w: 50 }, 'acerca.sub': { w: 0, h: 0 } } },
    pagina_falsa: { secs: { top: ['x'] } },
    sesiones: { secs: { hero: ['sesiones.titulo', '@cta'], cards: ['@cta'] } }
  });
  assert.deepEqual(JSON.parse(JSON.stringify(l.acerca.secs.intro)), ['acerca.titulo', 'acerca.intro.1', 'acerca.bloques.1']);
  assert.ok(!('mensual' in l.acerca.secs));
  assert.deepEqual(JSON.parse(JSON.stringify(l.acerca.tam['acerca.intro.0'])), { w: 100, hm: 800 });
  assert.ok(!('otra.cosa' in l.acerca.tam) && !('acerca.sub' in l.acerca.tam));
  assert.ok(!('pagina_falsa' in l));
  assert.deepEqual(JSON.parse(JSON.stringify(l.sesiones.secs)), { hero: ['sesiones.titulo', '@cta'], cards: [] });
});

test('reordenar dentro de un contenedor: el segundo párrafo sube', () => {
  const h = W.htmlPagina('acerca', con({ acerca: { secs: { intro: ['acerca.titulo', 'acerca.sub', 'acerca.intro.2', 'acerca.intro.0', 'acerca.intro.1'] } } }));
  assert.ok(pos(h, 'data-ed="acerca.intro.2"') < pos(h, 'data-ed="acerca.intro.0"'));
  assert.ok(pos(h, 'data-ed="acerca.intro.0"') < pos(h, 'data-ed="acerca.intro.1"'));
  assert.equal(h.split('data-ed="acerca.intro.2"').length, 2, 'cada bloque sale una sola vez');
});

test('mover un bloque a otro contenedor de la MISMA página', () => {
  const h = W.htmlPagina('acerca', con({ acerca: { secs: { bloques: ['acerca.bloques.0', 'acerca.intro.0', 'acerca.bloques.1'] } } }));
  assert.ok(pos(h, 'data-ed="acerca.bloques.0"') < pos(h, 'data-ed="acerca.intro.0"') && pos(h, 'data-ed="acerca.intro.0"') < pos(h, 'data-ed="acerca.bloques.1"'));
  assert.ok(pos(h, 'data-ed="acerca.intro.0"') > pos(h, 'class="about-grid"'), 'ahora está en la columna de la derecha');
  assert.equal(h.split('data-ed="acerca.intro.0"').length, 2, 'y ya no sale arriba');
  assert.ok(pos(h, 'data-ed="acerca.intro.1"') < pos(h, 'class="about-grid"'), 'los demás párrafos se quedan donde estaban');
});

test('el botón de Sesiones se mueve dentro de su columna sin duplicarse', () => {
  const h = W.htmlPagina('sesiones', con({ sesiones: { secs: { hero: ['sesiones.titulo', '@cta', 'sesiones.intro.0', 'sesiones.intro.1', 'sesiones.nota'] } } }));
  assert.ok(pos(h, 'data-ed="sesiones.cta"') < pos(h, 'data-ed="sesiones.intro.0"'));
  assert.equal(h.split('data-ed="sesiones.cta"').length, 3, 'el de arriba (movido) + el de abajo (fijo)');
});

test('los bloques nuevos o sin lugar guardado caen en su contenedor de siempre', () => {
  const sin = JSON.parse(JSON.stringify(WEBS.editada)); sin.acerca.intro.push('Cuarto nuevo.');
  const h = W.htmlPagina('acerca', con({ acerca: { secs: { intro: ['acerca.titulo', 'acerca.intro.1'] } } }, sin));
  assert.ok(h.includes('Cuarto nuevo.') && h.includes('data-ed="acerca.intro.0"') && h.includes('data-ed="acerca.sub"'));
});

test('un id que ya no existe (se borró el párrafo) se ignora sin romper', () => {
  const h = W.htmlPagina('acerca', con({ acerca: { secs: { intro: ['acerca.titulo', 'acerca.intro.9', 'acerca.intro.0'] }, tam: { 'acerca.intro.9': { w: 50 } } } }));
  assert.ok(!h.includes('acerca.intro.9') && h.includes('data-ed="acerca.intro.0"'));
});

test('tamaño: ancho y alto en computador y celular, sin envolver ni duplicar', () => {
  const h = W.htmlPagina('acerca', con({ acerca: { tam: { 'acerca.intro.0': { w: 55, h: 200, wm: 90, hm: 120 } } } }));
  assert.match(h, /<p data-ed="acerca\.intro\.0" class="nl-b nl-bw" style="--w:55%;--h:200px;--wm:90%;--hm:120px">/);
  assert.equal(h.split('acerca.intro.0').length, 2);
  const solo = W.htmlPagina('contacto', con({ contacto: { tam: { 'contacto.items.0': { hm: 90 } } } }));
  assert.match(solo, /<div class="contact-item nl-b" data-ed="contacto\.items\.0" style="--hm:90px">/);
});

test('un estilo que ya existía en la etiqueta se conserva al sumar el tamaño', () => {
  const h = W.htmlPagina('acerca', con({ acerca: { tam: { 'acerca.bloques.3': { w: 60 } } } }));
  assert.match(h, /<h2 data-ed="acerca\.bloques\.3" id="trabajo" style="margin-top:40px;scroll-margin-top:24px;--w:60%" class="nl-b nl-bw"|<h2 data-ed="acerca\.bloques\.3" id="trabajo" class="nl-b nl-bw" style="margin-top:40px;scroll-margin-top:24px;--w:60%">/);
});

test('seguridad: ids con comillas o medidas con CSS no llegan al HTML', () => {
  const h = W.htmlPagina('acerca', con({ acerca: { secs: { intro: ['acerca.titulo" onmouseover="x', 'acerca.intro.0'] }, tam: { 'acerca.intro.0': { w: '50%;background:url(x)' } } } }));
  assert.ok(!/onmouseover/.test(h) && !/background:url/.test(h));
});

test('la vista previa marca bloques y contenedores; la web pública no', () => {
  const ed = W.htmlPagina('acerca', WEBS.editada, { editable: true });
  assert.match(ed, /data-b="acerca\.intro\.0"/);
  assert.match(ed, /data-s="intro"/);
  assert.match(ed, /data-s="bloques"/);
  assert.ok(!/data-b=|data-s=/.test(W.htmlPagina('acerca', WEBS.editada)));
  for (const pg of PAGINAS) assert.match(W.htmlPagina(pg, WEBS.editada, { editable: true }), /data-s="/, pg);
});

test('«Volver al diseño original» (mezclar({})) no deja layout', () => {
  assert.equal(W.mezclar({}).layout, undefined);
});
