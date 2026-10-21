import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { webcrypto } from 'node:crypto';

const src = readFileSync(new URL('../worker/index.js', import.meta.url), 'utf8');

/* 1) Funciones puras: el mismo trozo del worker que usa portada.test.mjs. */
const pure = vm.createContext({});
vm.runInContext(src.slice(src.indexOf('const WEB_FUENTES'), src.indexOf('function webDeConfig'))
  + '\nthis.H = { firmaFuente, validarFuente, wNombreFuente, generarIdFuente, wFuentesGuardadas, usosFuente, sanearWeb };', pure);
const H = pure.H;

const ID = 'f_abcdefgh';
// bytes ASCII de un texto seguido de bytes numéricos
const A = (s, ...n) => new Uint8Array([...s].map((c) => c.charCodeAt(0)).concat(n));
const bytesDe = (arr) => new Uint8Array(arr);
// los objetos que salen de la vm vienen de otro realm: se pasan a JSON para comparar
const J = (x) => JSON.parse(JSON.stringify(x === undefined ? null : x));
const fuenteWoff2 = Array.from(A("wOF2", ...new Array(60).fill(0)));
const guardada = { id: ID, nombre: 'Mi Fuente', formato: 'woff2' };

test('firma binaria reconoce cada formato y rechaza lo demás', () => {
  assert.equal(H.firmaFuente(A("wOF2", 0, 0, 0, 0)), 'woff2');
  assert.equal(H.firmaFuente(A("wOFF", 0, 0, 0, 0)), 'woff');
  assert.equal(H.firmaFuente(A("OTTO", 0, 0, 0, 0)), 'otf');
  assert.equal(H.firmaFuente(bytesDe([0, 1, 0, 0, 0])), 'ttf');
  assert.equal(H.firmaFuente(A("true", 0)), 'ttf');
  assert.equal(H.firmaFuente(A("<htm", 0)), null);
  assert.equal(H.firmaFuente(bytesDe([1, 2])), null);
});

test('validarFuente exige extensión, tamaño y firma que coincidan', () => {
  assert.deepEqual(J(H.validarFuente('Mi.woff2', bytesDe(fuenteWoff2))), { formato: 'woff2' });
  assert.deepEqual(J(H.validarFuente('MI.TTF', bytesDe([0, 1, 0, 0, 9, 9]))), { formato: 'ttf' });
  assert.match(H.validarFuente('Mi.woff', bytesDe(fuenteWoff2)).error, /woff/);       // firma de woff2 con extensión woff
  assert.match(H.validarFuente('Mi.exe', bytesDe(fuenteWoff2)).error, /woff2, woff, ttf u otf/);
  assert.match(H.validarFuente('Mi.woff2', A("<html", 0, 0, 0)).error, /no parece/);
  assert.match(H.validarFuente('Mi.woff2', new Uint8Array(1024 * 1024 + 1)).error, /1 MB/);
  assert.deepEqual(J(H.validarFuente('grande.otf', (() => { const b = new Uint8Array(1024 * 1024); b.set(A("OTTO")); return b; })())), { formato: 'otf' });
});

test('wNombreFuente deja letras, números, espacio, punto, guion y guion bajo', () => {
  assert.equal(H.wNombreFuente('Mi Fuente!!<script>'), 'Mi Fuentescript');
  assert.equal(H.wNombreFuente('  Ñandú   Sans_1.0-x '), 'Ñandú Sans_1.0-x');
  assert.equal(H.wNombreFuente('a'.repeat(50)).length, 40);
  assert.equal(H.wNombreFuente('!!!'), '');
  assert.equal(H.wNombreFuente(undefined), '');
});

test('generarIdFuente produce f_ + 8 caracteres [a-z0-9] y evita sesgo', () => {
  const cola = [new Uint8Array(16).fill(255), new Uint8Array(16).fill(36)];   // 255 se descarta; 36 % 36 = 0 -> 'a'
  assert.equal(H.generarIdFuente(() => cola.shift()), 'f_aaaaaaaa');
  for (let i = 0; i < 50; i++) {
    const id = H.generarIdFuente((n) => webcrypto.getRandomValues(new Uint8Array(n)));
    assert.match(id, /^f_[a-z0-9]{8}$/);
  }
});

test('wFuentesGuardadas descarta basura, duplicados y pasa de 8', () => {
  const entradas = [guardada, guardada, { id: 'malo', nombre: 'x', formato: 'woff2' },
    { id: 'f_bbbbbbbb', nombre: 'Otra', formato: 'exe' }, { id: 'f_cccccccc', nombre: '', formato: 'ttf' }];
  for (let i = 0; i < 10; i++) entradas.push({ id: 'f_0000000' + i, nombre: 'N' + i, formato: 'otf' });
  const lista = H.wFuentesGuardadas(JSON.stringify(entradas));
  assert.equal(lista.length, 8);
  assert.equal(lista[0].id, ID);
  assert.equal(H.wFuentesGuardadas('no es json').length, 0);
});

test('usosFuente encuentra dónde está la fuente en el diseño publicado', () => {
  const web = JSON.stringify({ v: 2, estilo: { fuente_cuerpo: 'up:' + ID, tipos: { menu: { fuente: 'up:' + ID }, texto: { fuente: 'DM Sans' } } } });
  assert.deepEqual(J(H.usosFuente(web, ID)), ['Letra del texto (diseño general)', 'Menú']);
  assert.deepEqual(J(H.usosFuente(web, 'f_zzzzzzzz')), []);
  assert.deepEqual(J(H.usosFuente('basura', ID)), []);
});

test('sanearWeb: sin datos nuevos la salida es igual que antes', () => {
  const out = H.sanearWeb({ v: 2, estilo: { escala: 110 } });
  assert.deepEqual(J(out), { v: 2, estilo: { escala: 110 } });
});

test('sanearWeb: fuentes_subidas solo con ids guardadas y nombre/formato de la lista', () => {
  const raw = { v: 2, estilo: { fuentes_subidas: [{ id: ID, nombre: 'HACK', formato: 'ttf' }, { id: 'f_zzzzzzzz', nombre: 'x', formato: 'otf' }] } };
  assert.deepEqual(J(H.sanearWeb(raw, [guardada]).estilo.fuentes_subidas), [guardada]);
  // si el cliente no manda lista, va la guardada completa
  assert.deepEqual(J(H.sanearWeb({ v: 2 }, [guardada]).estilo.fuentes_subidas), [guardada]);
  // sin lista guardada no aparece la clave
  assert.equal(H.sanearWeb(raw, []).estilo, undefined);
});

test('sanearWeb: tipos acota rangos, descarta lo desconocido y no deja pasar CSS', () => {
  const raw = { v: 2, estilo: { tipos: {
    menu: { fuente: 'up:' + ID, tam: 999, tam_movil: 5, peso: '700', interlineado: 9, extra: 'x' },
    titulo_inicio: { fuente: 'up:f_nope0000' },
    subtitulo_inicio: { fuente: 'Arial; } body{display:none', tam: '' },
    titulos: { fuente: 'Homemade Apple', tam: 0, peso: '900', interlineado: '1.456' },
    texto: { tam: 20, interlineado: 0 },
    foto: { tam: 30 }
  } } };
  const t = H.sanearWeb(raw, [guardada]).estilo.tipos;
  assert.deepEqual(J(t.menu), { fuente: 'up:' + ID, tam: 60, tam_movil: 12, peso: '700', interlineado: 3 });
  assert.equal(t.titulo_inicio, undefined);       // fuente de una subida que no existe
  assert.equal(t.subtitulo_inicio, undefined);    // CSS arbitrario -> sin fuente, tam vacío
  assert.deepEqual(J(t.titulos), { fuente: 'Homemade Apple', interlineado: 1.46 });
  assert.deepEqual(J(t.texto), { tam: 20 });
  assert.equal(t.foto, undefined);
});

test('sanearWeb: tipos sin fuentes subidas no acepta up:<id>', () => {
  const raw = { v: 2, estilo: { fuentes_subidas: [], tipos: { menu: { fuente: 'up:' + ID } } } };
  assert.equal(H.sanearWeb(raw, [guardada]).estilo, undefined);
});

/* 2) Rutas del worker de punta a punta, con D1 y R2 falsos. El módulo se carga igual que en
   producción, cambiando solo los imports de Cloudflare/npm por stubs y el export por una variable. */
function cargarWorker(){
  const cod = src
    .replace(/^import .*$/gm, '')
    .replace('export default {', 'const worker = {');
  const ctx = vm.createContext({
    Request, Response, FormData, File, URL, Headers, TextEncoder, TextDecoder, console,
    crypto: webcrypto,
    EmailMessage: function () {}, createMimeMessage: () => ({}), buildPushPayload: () => ({})
  });
  vm.runInContext(cod + '\nthis.worker = worker;', ctx);
  return ctx.worker;
}

function entorno(){
  const config = new Map();
  const r2 = new Map();
  function stmt(sql, args){
    return {
      bind: (...a) => stmt(sql, a),
      all: async () => {
        if (/FROM config/.test(sql)) return { results: [...config].map(([clave, valor]) => ({ clave, valor })) };
        return { results: [] };
      },
      first: async () => null,
      run: async () => {
        const m = sql.match(/INSERT INTO config \(clave, valor\) VALUES \('(\w+)', \?1\)/);
        if (m) config.set(m[1], args[0]);
        const m2 = sql.match(/INSERT INTO config \(clave, valor\) VALUES \(\?1, \?2\)/);
        if (m2) config.set(args[0], args[1]);
        return {};
      }
    };
  }
  const DB = {
    prepare: (sql) => stmt(sql, []),
    batch: (lista) => Promise.all(lista.map((s) => s.run()))
  };
  const RECURSOS_R2 = {
    put: async (key, body, opts) => { r2.set(key, { body: new Uint8Array(body), opts }); },
    get: async (key) => (r2.has(key) ? { body: r2.get(key).body, httpMetadata: r2.get(key).opts.httpMetadata } : null),
    delete: async (key) => { r2.delete(key); }
  };
  return { env: { DB, RECURSOS_R2, ADMIN_TOKEN: 'tok-prueba' }, config, r2 };
}

const ctx = { waitUntil() {} };
const AUTH = { authorization: 'Bearer tok-prueba' };
const ORIGEN = 'https://nicole-crm-worker.nicoleolavarria.workers.dev';

function formulario(nombre, contenido, archivoNombre){
  const f = new FormData();
  f.set('archivo', new File([new Uint8Array(contenido)], archivoNombre, { type: 'application/octet-stream' }));
  f.set('nombre', nombre);
  return f;
}
const subir = (worker, env, nombre, contenido, archivo, headers = AUTH) =>
  worker.fetch(new Request(ORIGEN + '/api/web/fuente', { method: 'POST', body: formulario(nombre, contenido, archivo), headers }), env, ctx);

test('POST /api/web/fuente sube, valida y devuelve id, nombre, formato y url', async () => {
  const worker = cargarWorker();
  const { env, config, r2 } = entorno();
  const r = await subir(worker, env, 'Mi Fuente', fuenteWoff2, 'letra.woff2');
  assert.equal(r.status, 200);
  const j = await r.json();
  assert.match(j.id, /^f_[a-z0-9]{8}$/);
  assert.deepEqual({ nombre: j.nombre, formato: j.formato, url: j.url }, { nombre: 'Mi Fuente', formato: 'woff2', url: `${ORIGEN}/fuentes/${j.id}.woff2` });
  assert.equal(r2.get('fuentes/' + j.id + '.woff2').opts.httpMetadata.contentType, 'font/woff2');
  assert.deepEqual(JSON.parse(config.get('web_fuentes')), [{ id: j.id, nombre: 'Mi Fuente', formato: 'woff2' }]);
});

test('POST /api/web/fuente rechaza sin sesión, firma falsa, extensión mala y nombre vacío sin guardar nada', async () => {
  const worker = cargarWorker();
  const { env, config, r2 } = entorno();
  assert.equal((await subir(worker, env, 'X', fuenteWoff2, 'a.woff2', {})).status, 401);
  assert.equal((await subir(worker, env, 'X', A("<html>", 0, 0), 'a.woff2')).status, 400);
  assert.equal((await subir(worker, env, 'X', fuenteWoff2, 'a.exe')).status, 400);
  assert.equal((await subir(worker, env, '!!!', fuenteWoff2, 'a.woff2')).status, 400);
  assert.equal((await subir(worker, env, 'X', new Array(1024 * 1024 + 1).fill(0), 'a.woff2')).status, 400);
  assert.equal(r2.size, 0);
  assert.equal(config.has('web_fuentes'), false);
});

test('POST /api/web/fuente admite 8 y no la novena', async () => {
  const worker = cargarWorker();
  const { env } = entorno();
  for (let i = 0; i < 8; i++) assert.equal((await subir(worker, env, 'F' + i, fuenteWoff2, 'f.woff2')).status, 200);
  const r = await subir(worker, env, 'Novena', fuenteWoff2, 'f.woff2');
  assert.equal(r.status, 400);
  assert.match((await r.json()).error, /8 fuentes/);
});

test('GET /fuentes/<id>.<formato> sirve con CORS, caché inmutable y 404 si no existe', async () => {
  const worker = cargarWorker();
  const { env } = entorno();
  const { id } = await (await subir(worker, env, 'Mi Fuente', fuenteWoff2, 'letra.woff2')).json();
  const r = await worker.fetch(new Request(`${ORIGEN}/fuentes/${id}.woff2`), env, ctx);
  assert.equal(r.status, 200);
  assert.equal(r.headers.get('content-type'), 'font/woff2');
  assert.equal(r.headers.get('access-control-allow-origin'), '*');
  assert.equal(r.headers.get('cache-control'), 'public, max-age=31536000, immutable');
  assert.equal(r.headers.get('x-content-type-options'), 'nosniff');
  assert.deepEqual([...new Uint8Array(await r.arrayBuffer())], fuenteWoff2);
  assert.equal((await worker.fetch(new Request(`${ORIGEN}/fuentes/${id}.ttf`), env, ctx)).status, 404);
  assert.equal((await worker.fetch(new Request(`${ORIGEN}/fuentes/f_zzzzzzzz.woff2`), env, ctx)).status, 404);
});

test('publicar con una fuente en uso bloquea el borrado (409) y, al quitarla, deja borrar', async () => {
  const worker = cargarWorker();
  const { env, config, r2 } = entorno();
  const { id } = await (await subir(worker, env, 'Mi Fuente', fuenteWoff2, 'letra.woff2')).json();
  const publicar = (web) => worker.fetch(new Request(ORIGEN + '/api/admin/web', {
    method: 'POST', headers: { ...AUTH, 'content-type': 'application/json' }, body: JSON.stringify({ web })
  }), env, ctx);

  const p = await publicar({ v: 2, estilo: { fuentes_subidas: [{ id, nombre: 'Mi Fuente', formato: 'woff2' }], tipos: { menu: { fuente: 'up:' + id, tam: 30 } } } });
  assert.equal(p.status, 200);
  assert.deepEqual((await p.json()).web.estilo.fuentes_subidas, [{ id, nombre: 'Mi Fuente', formato: 'woff2' }]);

  const pub = await (await worker.fetch(new Request(ORIGEN + '/api/publico'), env, ctx)).json();
  assert.equal(pub.web.estilo.tipos.menu.fuente, 'up:' + id);
  assert.equal(pub.fuentes_subidas.length, 1);

  const bloqueado = await worker.fetch(new Request(ORIGEN + '/api/web/fuente/' + id, { method: 'DELETE', headers: AUTH }), env, ctx);
  assert.equal(bloqueado.status, 409);
  const detalle = await bloqueado.json();
  assert.deepEqual(detalle.usos, ['Menú']);
  assert.match(detalle.error, /Menú/);

  await publicar({ v: 2, estilo: { escala: 100 } });
  const borrar = await worker.fetch(new Request(ORIGEN + '/api/web/fuente/' + id, { method: 'DELETE', headers: AUTH }), env, ctx);
  assert.equal(borrar.status, 200);
  assert.equal(r2.has('fuentes/' + id + '.woff2'), false);
  assert.equal(JSON.parse(config.get('web_fuentes')).length, 0);
  assert.equal((await worker.fetch(new Request(`${ORIGEN}/fuentes/${id}.woff2`), env, ctx)).status, 404);
  assert.equal((await worker.fetch(new Request(ORIGEN + '/api/web/fuente/' + id, { method: 'DELETE', headers: AUTH }), env, ctx)).status, 404);
  assert.equal((await worker.fetch(new Request(ORIGEN + '/api/web/fuente/' + id, { method: 'DELETE' }), env, ctx)).status, 401);
});
