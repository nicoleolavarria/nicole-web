import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import * as W from '../src/lib/web-render.mjs';
import { WEBS } from './_fixtures-web.mjs';

const src = readFileSync(new URL('../worker/index.js', import.meta.url), 'utf8');
const panel = readFileSync(new URL('../panel/admin/crm/index.html', import.meta.url), 'utf8');
const ctx = vm.createContext({ crearFuenteBinaria: null, Buffer, DataView });
vm.runInContext(src.slice(src.indexOf('const WEB_FUENTES'), src.indexOf('function webDeConfig')) + '\nthis.H = { sanearWeb, wLayout };', ctx);
const H = ctx.H;
const J = (x) => JSON.parse(JSON.stringify(x === undefined ? null : x));

const ENTRADAS = [
  { acerca: { secs: { intro: ['acerca.titulo', 'acerca.intro.1', 'acerca.titulo', 'x', '<b>'], bloques: ['acerca.bloques.0', '@cta'] }, tam: { 'acerca.intro.0': { w: 55, h: 200, wm: 90, hm: 120 }, 'acerca.sub': { w: 9999, h: -1 }, 'raro': { w: 1 } } } },
  { sesiones: { secs: { hero: ['sesiones.titulo', '@cta', 'sesiones.nota'], cards: ['@cta', 'sesiones.modalidades.2'] } } },
  { contacto: { secs: { top: ['contacto.titulo'], items: ['contacto.items.1', 'contacto.items.0'] }, tam: { 'contacto.items.0': { wm: 40 } } }, inicio: { secs: { top: ['inicio.sub', 'inicio.titulo'] } } },
  { falsa: { secs: { top: ['x'] } }, acerca: 'x' }, {}, null, 5, [], { acerca: { secs: { intro: 'no' }, tam: 7 } }
];

test('el worker y el render aceptan EXACTAMENTE lo mismo (mismas reglas, sin desvíos)', () => {
  for (const e of ENTRADAS) assert.deepEqual(J(H.wLayout(e)), Object.keys(W.layoutLimpio(e)).length ? J(W.layoutLimpio(e)) : null, JSON.stringify(e));
});

test('sanearWeb guarda el layout válido y lo devuelve igual al leerlo (ciclo guardar → leer)', () => {
  const entrada = Object.assign({}, WEBS.editada, { layout: ENTRADAS[0] });
  const guardado = J(H.sanearWeb(entrada, []));
  assert.ok(guardado.layout.acerca.tam['acerca.intro.0']);
  assert.deepEqual(J(H.sanearWeb(guardado, [])).layout, guardado.layout, 'sanear dos veces da lo mismo');
});

test('sanearWeb no inventa layout cuando no hay (webs de hoy)', () => {
  assert.ok(!('layout' in J(H.sanearWeb(WEBS.editada, []))));
  assert.ok(!('layout' in J(H.sanearWeb({}, []))));
  assert.ok(!('layout' in J(H.sanearWeb({ layout: { acerca: 'x' } }, []))));
});

test('lo que el worker guarda, el render lo dibuja con el orden y el tamaño pedidos', () => {
  const lay = { acerca: { secs: { intro: ['acerca.titulo', 'acerca.sub', 'acerca.intro.2', 'acerca.intro.0', 'acerca.intro.1'] }, tam: { 'acerca.intro.2': { w: 50, wm: 100 } } } };
  const guardado = J(H.sanearWeb(Object.assign({}, WEBS.editada, { layout: lay }), []));
  const h = W.htmlPagina('acerca', guardado);
  assert.ok(h.indexOf('data-ed="acerca.intro.2"') < h.indexOf('data-ed="acerca.intro.0"'));
  assert.match(h, /acerca\.intro\.2" class="nl-b nl-bw" style="--w:50%;--wm:100%"/);
});

test('el panel guarda lo movido en el historial (Deshacer) y limpia lo que cambia de posición', () => {
  assert.match(panel, /window\.edLayout = function\(m\)\{[\s\S]*?cambiarHist\(function\(\)\{/);
  assert.match(panel, /remapLayout\(m\[1\], "del", i\)/);
  assert.match(panel, /remapLayout\(m\[1\], "up", i\)/);
  assert.match(panel, /remapLayout\(m\[1\], "down", i\)/);
  assert.match(panel, /id="btnWebPosiciones"/);
  assert.match(panel, /htmlPagina\(pagina, d, \{ editable: true \}\)/);
  assert.match(panel, /edBloquesMain\.toString\(\)/);
});

test('Publicar manda web.layout al worker (viaja dentro de WEB)', () => {
  assert.match(panel, /body: JSON\.stringify\(\{ web: WEB \}\)/);
});
