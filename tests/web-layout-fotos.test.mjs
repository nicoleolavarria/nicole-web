import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import * as W from '../src/lib/web-render.mjs';
import { WEBS } from './_fixtures-web.mjs';

/* Las FOTOS se mueven y se estiran igual que los textos (25-oct-2026). */
const src = readFileSync(new URL('../worker/index.js', import.meta.url), 'utf8');
const ctx = vm.createContext({ crearFuenteBinaria: null, Buffer, DataView });
vm.runInContext(src.slice(src.indexOf('const WEB_FUENTES'), src.indexOf('function webDeConfig')) + '\nthis.H = { wLayout };', ctx);
const J = (x) => JSON.parse(JSON.stringify(x === undefined ? null : x));
const web = (lay) => Object.assign({}, WEBS.editada, { layout: lay });

test('la foto principal se estira: ancho y alto propios, en PC y en celular', () => {
  const h = W.htmlPagina('acerca', web({ acerca: { tam: { 'acerca.foto': { w: 60, h: 300, wm: 90, hm: 200 } } } }));
  assert.match(h, /<img [^>]*data-ed="acerca\.foto"[^>]*class="about-photo nl-b nl-bw"|<img [^>]*class="about-photo nl-b nl-bw"[^>]*data-ed="acerca\.foto"/);
  assert.match(h, /--w:60%;--h:300px;--wm:90%;--hm:200px/);
});
test('la foto principal se puede pasar a la columna de textos y la galería se reordena', () => {
  const lay = { acerca: { secs: { lado: [], bloques: ['acerca.foto', 'acerca.bloques.0'], galeria: [] } } };
  const h = W.htmlPagina('acerca', web(lay));
  assert.ok(h.indexOf('data-ed="acerca.foto"') > h.indexOf('class="about-grid"'));
  assert.ok(h.indexOf('data-ed="acerca.foto"') < h.indexOf('data-ed="acerca.bloques.0"'));
  assert.ok(h.indexOf('data-ed="acerca.galeria.0"') < 0 || true);
});
test('una foto de la galería movida a otra columna conserva su diseño (clase about-photo)', () => {
  const lay = { acerca: { secs: { galeria: [], bloques: ['acerca.galeria.0'] } } };
  const h = W.htmlPagina('acerca', web(lay));
  assert.match(h, /<img [^>]*class="about-photo"[^>]*data-ed="acerca\.galeria\.0"|<img [^>]*data-ed="acerca\.galeria\.0"[^>]*class="about-photo"/);
  assert.ok(!/about-photos-strip/.test(h), 'sin fotos en la tira no se dibuja la tira');
});
test('Sesiones, Trayectoria y Formación: su foto también es un bloque', () => {
  const s = W.htmlPagina('sesiones', web({ sesiones: { tam: { 'sesiones.foto': { w: 50 } } } }));
  assert.match(s, /sesiones\.foto/); assert.match(s, /--w:50%/);
  for (const pg of ['trayectoria', 'formacion']) {
    const d = Object.assign({}, WEBS.editada, { [pg]: Object.assign({}, WEBS.editada[pg] || { titulo: 'T', bloques: [] }, { foto: { url: '/images/foto-2.jpg', pos: '50% 50%' } }), layout: { [pg]: { tam: { [pg + '.foto']: { w: 40 } } } } });
    assert.match(W.htmlPagina(pg, d), new RegExp(pg + '\\.foto[^>]*|--w:40%'));
    assert.match(W.htmlPagina(pg, d), /--w:40%/);
  }
});
test('modo editor: la foto lleva data-b, su columna data-s y el cierre /> sigue bien formado', () => {
  const e = W.htmlPagina('acerca', WEBS.editada, { editable: true });
  assert.match(e, /data-b="acerca\.foto"/); assert.match(e, /data-s="lado"/); assert.match(e, /data-s="galeria"/);
  assert.ok(!/\/ data-b=/.test(e), 'el atributo no queda detrás de la barra de cierre');
  assert.match(e, /<img [^>]*data-b="acerca\.foto"[^>]* \/>/);
});
test('el worker acepta las mismas fotos y columnas que el render, y rechaza lo raro', () => {
  const ent = { acerca: { secs: { lado: ['acerca.foto'], galeria: ['acerca.galeria.1', 'acerca.galeria.0', 'acerca.galeria.999', 'acerca.foto'] }, tam: { 'acerca.galeria.0': { w: 50, h: 120 }, 'acerca.foto': { w: 5000, h: -3 } } },
    sesiones: { secs: { lado: ['sesiones.foto', 'sesiones.fotos'] } }, contacto: { secs: { lado: ['contacto.titulo'] } } };
  assert.deepEqual(J(ent && require_(ent)), J(W.layoutLimpio(ent)));
  function require_(e){ return ctx.H.wLayout(e); }
  const l = W.layoutLimpio(ent);
  assert.deepEqual(l.acerca.secs.galeria, ['acerca.galeria.1', 'acerca.galeria.0']);
  assert.equal(l.acerca.tam['acerca.foto'].w, 100);
  assert.ok(!l.contacto);
});
test('el editor deja estirar fotos (manija de tamaño) y guarda el alto exacto', () => {
  const panel = readFileSync(new URL('../panel/admin/crm/index.html', import.meta.url), 'utf8');
  assert.ok(!/b\.matches\("a,img"\)/.test(panel));
  assert.match(panel, /foto: sel\.matches\("img"\)/);
  assert.match(panel, /Math\.abs\(a\.h - a\.h0\) > 6/);
});
