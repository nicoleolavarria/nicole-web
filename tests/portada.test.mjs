import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import * as W from '../src/lib/web-render.mjs';
const worker = readFileSync(new URL('../worker/index.js', import.meta.url), 'utf8');
const sanitizer = worker.slice(worker.indexOf('const WEB_FUENTES'), worker.indexOf('function webDeConfig'));
const ctx = vm.createContext({});
vm.runInContext(sanitizer + '\nthis.sanitize = sanearWeb;', ctx);
const legacy = { v: 1, estilo: { fuente_titulos: 'Space Mono', fuente_cuerpo: 'Space Mono', escala: 90 }, inicio: { titulo: 'Nicole Olavarría', sub: W.DEFAULTS.inicio.sub, foto: { url: '/images/sesiones.jpg' } }, nav: [{texto:'inicio',url:'/'}], trayectoria: {bloques:[{tipo:'parrafo',texto:'Contenido conservado'}]} };
test('legacy design migrates without mutating source or deleting content', () => {
 const original = JSON.stringify(legacy), d = W.mezclar(legacy);
 assert.equal(JSON.stringify(legacy), original);
 assert.deepEqual(d.nav.map(n=>n.texto), ['acerca de','trayectoria','formación','sesiones 1:1','contacto']);
 assert.equal(d.estilo.fuente_cuerpo, 'Cormorant Garamond');
 assert.deepEqual(d.trayectoria.bloques, legacy.trayectoria.bloques);
 assert.equal(d.inicio.foto.url, legacy.inicio.foto.url);
 assert.doesNotMatch(W.htmlPagina('inicio',d), /<img/);
 assert.match(W.fuentesHref(d), /Cormorant\+Garamond.*display=swap/);
});
test('panel edits survive worker save, reload and repeated merges', () => {
 const edited = W.mezclar(legacy);
 edited.inicio.titulo = 'Título editado'; edited.inicio.sub = 'Párrafo editado <seguro>';
 edited.estilo.escala = 110;
 const saved = ctx.sanitize(edited);
 assert.equal(saved.v, 2);
 const loaded = W.mezclar(saved);
 assert.equal(loaded.inicio.titulo, edited.inicio.titulo);
 assert.equal(loaded.inicio.sub, edited.inicio.sub);
 assert.equal(loaded.estilo.escala, 110);
 assert.deepEqual(W.mezclar(loaded), loaded);
 assert.match(W.htmlPagina('inicio',loaded), /Párrafo editado &lt;seguro&gt;/);
 assert.match(W.htmlDocumento('inicio',loaded), /data-pagina="inicio"/);
 assert.match(W.htmlDocumento('inicio',loaded), /Navegación principal/);
 assert.equal(ctx.sanitize(legacy).v, 1);
});
test('browser and panel renderers match source for updates after build', () => {
 for(const file of ['../public/js/web-render.js','../panel/web/web-render.js']) {
  const c = vm.createContext({}); vm.runInContext(readFileSync(new URL(file,import.meta.url),'utf8'),c);
  assert.equal(c.WebRender.htmlDocumento('inicio',legacy), W.htmlDocumento('inicio',legacy));
 }
 assert.equal(readFileSync(new URL('../public/styles/global.css',import.meta.url),'utf8'),readFileSync(new URL('../panel/web/global.css',import.meta.url),'utf8'));
});
