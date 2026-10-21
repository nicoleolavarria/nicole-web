import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const html = readFileSync(new URL('../panel/admin/crm/index.html', import.meta.url), 'utf8');
const inline = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);

test('every inline script of the CRM panel compiles', () => {
  for (const code of inline) assert.doesNotThrow(() => new vm.Script(code));
});

test('Mi web letras use the contract endpoints and size ranges', () => {
  assert.match(html, /"\/api\/web\/fuente"/);
  assert.match(html, /"\/api\/web\/fuente\/"/);
  assert.match(html, /nicole-crm-worker\.nicoleolavarria\.workers\.dev/);
  for (const [k, min, max] of [['menu', 12, 60], ['titulo_inicio', 24, 200], ['subtitulo_inicio', 10, 48], ['titulos', 14, 100], ['texto', 10, 36]]) {
    assert.match(html, new RegExp('k: "' + k + '"[^}]*min: ' + min + ', max: ' + max + ' \\}'));
  }
});

test('upload shows friendly Spanish messages for 409, 413 and 415', () => {
  assert.match(html, /409\) return "Ese nombre ya está en uso/);
  assert.match(html, /413\) return "Esa tipografía pesa más de 1 MB/);
  assert.match(html, /415\) return "Ese tipo de archivo no sirve/);
});
