import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as W from '../src/lib/web-render.mjs';

const ID = 'f_abcd1234';
const subida = { id: ID, nombre: 'Mi Fuente', formato: 'woff2' };

test('sin datos nuevos no se generan variables de tipos ni @font-face', () => {
  const sinTipos = { v: 2, estilo: { escala: 100 } };
  assert.doesNotMatch(W.estiloCss(sinTipos), /--t-/);
  assert.equal(W.fontFacesCss(sinTipos), '');
  assert.equal(W.estiloCss({}), W.estiloCss(W.mezclar({})));
  assert.doesNotMatch(W.estiloCss({}), /--t-/);
});

test('estiloCss genera variables con rangos y formatos del contrato', () => {
  const css = W.estiloCss({ estilo: { tipos: {
    menu: { fuente: 'Space Mono', tam: 24, tam_movil: 18, peso: '700', interlineado: 2 },
    titulo_inicio: { tam: 80, fuente: 'Bebas Neue', peso: '400', interlineado: 1.1 },
    subtitulo_inicio: { tam: 20 },
    titulos: { tam: 60 },
    texto: { fuente: 'Playfair Display', tam: 18, interlineado: '2.2' }
  } } });
  assert.match(css, /--t-menu-fuente:'Space Mono'/);
  assert.match(css, /--t-menu-tam:24px/);
  assert.match(css, /--t-menu-tam-m:18px/);
  assert.match(css, /--t-menu-peso:700/);
  assert.match(css, /--t-menu-lh:2/);
  assert.match(css, /--t-titulo-inicio-tam:80px/);
  assert.match(css, /--t-titulo-inicio-fuente:'Bebas Neue'/);
  assert.match(css, /--t-titulo-inicio-peso:400/);
  assert.match(css, /--t-titulo-inicio-lh:1\.1/);
  assert.match(css, /--t-subtitulo-inicio-tam:20px/);
  assert.match(css, /--t-titulos-tam:60px/);
  assert.match(css, /--t-texto-fuente:'Playfair Display'/);
  assert.match(css, /--t-texto-lh:2\.2/);
});

test('estiloCss acota valores fuera de rango y descarta los inválidos', () => {
  const css = W.estiloCss({ estilo: { tipos: {
    menu: { tam: 999, tam_movil: 1 },
    titulo_inicio: { tam: -5 },
    subtitulo_inicio: { tam: 'abc', interlineado: 9 },
    titulos: { tam: 0, peso: '900' },
    texto: { fuente: 'constructor', tam: 36.4, interlineado: 0.2 }
  } } });
  assert.match(css, /--t-menu-tam:60px/);
  assert.match(css, /--t-menu-tam-m:12px/);
  assert.match(css, /--t-titulo-inicio-tam:24px/);
  assert.doesNotMatch(css, /--t-subtitulo-inicio-tam/);
  assert.match(css, /--t-subtitulo-inicio-lh:3/);
  assert.doesNotMatch(css, /--t-titulos-tam/);
  assert.doesNotMatch(css, /--t-titulos-peso/);
  assert.doesNotMatch(css, /--t-texto-fuente/);
  assert.match(css, /--t-texto-tam:36px/);
  assert.match(css, /--t-texto-lh:1/);
});

test('nunca se inyecta texto arbitrario en el CSS', () => {
  const css = W.estiloCss({ estilo: { tipos: {
    menu: { fuente: "x';} body{display:none} /*", peso: '700;color:red', tam: '12px}' },
    texto: { fuente: 'up:f_zz; } a{' }
  } } });
  assert.doesNotMatch(css, /display|color:red|body|a\{/);
  assert.doesNotMatch(css, /--t-menu-fuente/);
  assert.doesNotMatch(css, /--t-menu-peso/);
  assert.doesNotMatch(css, /--t-texto-fuente/);
});

test('una fuente subida solo se referencia si su id existe en fuentes_subidas', () => {
  const con = W.estiloCss({ estilo: { fuentes_subidas: [subida], tipos: { titulos: { fuente: 'up:' + ID } } } });
  assert.match(con, /--t-titulos-fuente:'up-f_abcd1234'/);
  const sin = W.estiloCss({ estilo: { fuentes_subidas: [], tipos: { titulos: { fuente: 'up:' + ID } } } });
  assert.doesNotMatch(sin, /--t-titulos-fuente/);
});

test('fontFacesCss emite un @font-face por fuente subida, con origen del worker y swap', () => {
  const css = W.fontFacesCss({ estilo: { fuentes_subidas: [subida, { id: 'f_otra0002', nombre: 'Dos', formato: 'ttf' }] } });
  assert.match(css, /@font-face\{font-family:'up-f_abcd1234'/);
  assert.match(css, /url\('https:\/\/nicole-crm-worker\.nicoleolavarria\.workers\.dev\/fuentes\/f_abcd1234\.woff2'\) format\('woff2'\)/);
  assert.match(css, /font-display:swap/);
  assert.match(css, /format\('truetype'\)/);
  assert.equal((css.match(/@font-face/g) || []).length, 2);
});

test('fontFacesCss descarta ids y formatos inválidos y no repite', () => {
  const css = W.fontFacesCss({ estilo: { fuentes_subidas: [
    subida, subida,
    { id: "f_x');}body{", nombre: 'x', formato: 'woff2' },
    { id: 'f_abcd9999', nombre: 'y', formato: 'exe' },
    'basura', null
  ] } });
  assert.equal((css.match(/@font-face/g) || []).length, 1);
  assert.doesNotMatch(css, /body/);
});

test('fontFacesCss admite como máximo 8 fuentes', () => {
  const lista = Array.from({ length: 12 }, (_, i) => ({ id: 'f_0000000' + (i % 10) + 'a'.repeat(0), nombre: 'n', formato: 'woff' }));
  const unicas = lista.map((f, i) => ({ ...f, id: 'f_aaaaaa' + String.fromCharCode(97 + i) + 'b' }));
  assert.equal((W.fontFacesCss({ estilo: { fuentes_subidas: unicas } }).match(/@font-face/g) || []).length, 8);
});

test('mezclar completa tipos y fuentes_subidas en datos viejos y tolera tipos mal formados', () => {
  const viejo = W.mezclar({ v: 2, estilo: { escala: 110 } });
  assert.deepEqual(viejo.estilo.tipos, {});
  assert.deepEqual(viejo.estilo.fuentes_subidas, []);
  assert.equal(viejo.estilo.escala, 110);
  assert.deepEqual(W.mezclar({ v: 2, estilo: { tipos: 'roto', fuentes_subidas: 'roto' } }).estilo.tipos, {});
  assert.deepEqual(W.mezclar({ v: 2, estilo: { tipos: ['x'] } }).estilo.tipos, {});
  assert.deepEqual(W.mezclar({ v: 2, estilo: { fuentes_subidas: 'roto' } }).estilo.fuentes_subidas, []);
  const nuevo = { v: 2, estilo: { tipos: { menu: { tam: 30 } }, fuentes_subidas: [subida] } };
  const m = W.mezclar(nuevo);
  assert.equal(m.estilo.tipos.menu.tam, 30);
  assert.deepEqual(m.estilo.fuentes_subidas, [subida]);
  assert.deepEqual(nuevo.estilo.tipos, { menu: { tam: 30 } });
});

test('fuentesHref pide a Google las fuentes de los tipos pero nunca las subidas', () => {
  const sin = W.fuentesHref({ v: 2, estilo: {} });
  const con = W.fuentesHref({ v: 2, estilo: { tipos: { titulos: { fuente: 'Bebas Neue' }, texto: { fuente: 'up:' + ID } } } });
  assert.match(con, /Bebas\+Neue/);
  assert.doesNotMatch(con, /up/);
  assert.equal(sin.includes('Bebas'), false);
});

test('htmlDocumento incluye las fuentes subidas y el estilo de tipos', () => {
  const html = W.htmlDocumento('inicio', { v: 2, estilo: { fuentes_subidas: [subida], tipos: { menu: { tam: 24 } } } });
  assert.match(html, /--t-menu-tam:24px/);
  assert.match(html, /@font-face\{font-family:'up-f_abcd1234'/);
});

test('htmlDocumento sin datos nuevos no cambia la salida base', () => {
  const html = W.htmlDocumento('acerca', { v: 2 });
  assert.doesNotMatch(html, /--t-|@font-face/);
});
