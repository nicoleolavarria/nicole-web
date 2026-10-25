import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import * as W from '../src/lib/web-render.mjs';
import { preguntas, faqHtml, jsonLd } from '../src/lib/seo.mjs';

const leer = (r) => readFileSync(new URL(r, import.meta.url), 'utf8');
const data = W.mezclar({});

test('título <=60 y descripción <=155 en cada página', () => {
  for (const f of readdirSync(new URL('../src/pages/', import.meta.url)).filter((x) => x.endsWith('.astro'))) {
    const s = leer('../src/pages/' + f);
    const t = (s.match(/title="([^"]+)"/) || s.match(/const title = '([^']+)'/) || [])[1];
    const d = (s.match(/description="([^"]+)"/) || [])[1];
    if (t) assert.ok(t.length <= 60, `${f}: título de ${t.length}`);
    if (d) assert.ok(d.length <= 155, `${f}: descripción de ${d.length}`);
  }
});

test('el FAQPage dice lo mismo que el bloque visible y no inventa datos', () => {
  const grafo = JSON.parse(jsonLd('sesiones', data, 'https://www.nicoleolavarria.com/sesiones'))['@graph'];
  const faq = grafo.find((x) => x['@type'] === 'FAQPage');
  const visible = faqHtml(data).replace(/<[^>]+>/g, ' ').replace(/&quot;/g, '"').replace(/\s+/g, ' ');
  assert.equal(faq.mainEntity.length, preguntas(data).length);
  for (const q of faq.mainEntity) {
    assert.ok(visible.includes(q.name), q.name);
    assert.ok(visible.replace(/\s+/g, '').includes(q.acceptedAnswer.text.replace(/\s+/g, '')), q.name);
  }
  assert.doesNotMatch(JSON.stringify(faq), /S\/\s?\d|PEN|USD|\b\d+ (minutos|hora)/i, 'sin precios ni duraciones');
  assert.equal(grafo.filter((x) => x['@type'] === 'Service').length, 1);
  assert.ok(!jsonLd('contacto', data, 'x').includes('FAQPage'), 'FAQPage solo en /sesiones');
});

test('enlaces internos del FAQ apuntan a páginas que existen', () => {
  const rutas = [...faqHtml(data).matchAll(/href="(\/[^"]*)"/g)].map((m) => m[1]);
  assert.ok(rutas.length >= 4);
  const pag = ['/', '/acerca-de', '/trayectoria', '/formacion', '/sesiones', '/horarios', '/contacto'];
  for (const r of rutas) assert.ok(pag.includes(r), r);
});

test('llms.txt: enlaces a nuestro dominio válidos y sin datos sin respaldo', () => {
  const t = leer('../public/llms.txt');
  const pag = ['/', '/acerca-de', '/trayectoria', '/formacion', '/sesiones', '/horarios', '/contacto', '/llms-full.txt'];
  for (const m of t.matchAll(/https:\/\/www\.nicoleolavarria\.com(\/[^\s)]*)/g)) assert.ok(pag.includes(m[1].replace(/[.,;:]+$/, '')), m[1]);
  assert.doesNotMatch(t, /beca|1 hora|cupos limitados/i);
});

test('si hay dist: enlaces internos sin rotos y sitemap sin páginas privadas', () => {
  const dist = new URL('../dist/', import.meta.url);
  if (!existsSync(new URL('sitemap-0.xml', dist))) return;
  const sm = readFileSync(new URL('sitemap-0.xml', dist), 'utf8');
  assert.doesNotMatch(sm, /mi-agenda|reprogramaciones|horarios-/);
  for (const f of ['index.html', 'sesiones/index.html', 'acerca-de/index.html', 'contacto/index.html', 'horarios/index.html', 'trayectoria/index.html', 'formacion/index.html']) {
    const h = readFileSync(new URL(f, dist), 'utf8');
    assert.equal((h.match(/<h1[ >]/g) || []).length, 1, `${f}: un solo H1`);
    assert.match(h, /<link rel="canonical" href="https:\/\/www\.nicoleolavarria\.com/);
    for (const m of h.matchAll(/href="(\/[^"#?]*)"/g)) {
      const p = m[1].replace(/\/$/, '');
      const ok = p === '' || existsSync(new URL(p.slice(1) + '/index.html', dist)) || existsSync(new URL(p.slice(1), dist));
      assert.ok(ok, `${f}: enlace roto ${m[1]}`);
    }
  }
});
