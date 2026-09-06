#!/usr/bin/env node
/* Despachador de los avisos de WhatsApp de Nicole.
   ────────────────────────────────────────────────────────────────────────────
   El worker no puede escribirle a Nicole por su cuenta: su número no tiene API
   oficial. Así que cada reserva hecha desde nicoleolavarria.com/horarios deja
   el mensaje en la tabla `avisos_wa` (Cloudflare D1) y ESTE proceso, que corre
   en la Mac cada 60 s por LaunchAgent, lo saca de la cola y lo manda por el bot
   de la casa (~/Code/wa-asistentes), al que solo se le habla por HTTP local.

   NO toca el repo del bot: usa su endpoint interno POST /campana, el mismo que
   ya usa bin/campana.js, con la clave compartida de data/.clave-interna.

   Interruptores (variables de entorno):
     SECO=1        no manda nada: escribe en el log lo que habría mandado, y
                   DEJA el aviso pendiente. Es como nace instalado.
     PUERTO_BOT    puerto de la línea del bot (default 3402 = Batuta).
     WORKER        base del worker de Nicole.

   Salidas: 0 siempre que el ciclo termine (que la línea esté caída no es un
   error del poller: el aviso se queda en la cola y sale en la próxima vuelta).
   ──────────────────────────────────────────────────────────────────────────── */

import { readFileSync, mkdirSync, appendFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import http from 'node:http';

const RAIZ = new URL('..', import.meta.url).pathname;
const LOG_DIR = join(RAIZ, 'logs');
const LOG = join(LOG_DIR, 'avisos-wa.log');

const WORKER = process.env.WORKER || 'https://nicole-crm-worker.nicoleolavarria.workers.dev';
const PUERTO_BOT = Number(process.env.PUERTO_BOT || 3402);
const SECO = process.env.SECO === '1';
const CAMPANA = 'aviso-nicole';
const ARCHIVO_TOKEN = join(homedir(), '.claude', 'scheduled-tasks', '.secrets', 'nicole-avisos.key');
const ARCHIVO_CLAVE_BOT = join(homedir(), 'Code', 'wa-asistentes', 'data', '.clave-interna');

function log(msg) {
  const linea = new Date().toISOString() + '  ' + msg + '\n';
  try { mkdirSync(LOG_DIR, { recursive: true }); appendFileSync(LOG, linea); } catch (_) {}
  process.stdout.write(linea);
}

function leerArchivo(ruta, que) {
  try {
    const v = readFileSync(ruta, 'utf8').trim();
    if (!v) throw new Error('vacío');
    return v;
  } catch (e) {
    log(`ERROR: no pude leer ${que} (${ruta}): ${e.message}`);
    return null;
  }
}

/* POST al bot local. Devuelve {status, error?}. Nunca lanza. */
function postBot(ruta, cuerpo) {
  const body = JSON.stringify(cuerpo);
  return new Promise((resolve) => {
    const req = http.request(
      { host: '127.0.0.1', port: PUERTO_BOT, path: ruta, method: 'POST', timeout: 15000,
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } },
      (res) => {
        let d = '';
        res.on('data', (x) => { d += x; });
        res.on('end', () => { let j = {}; try { j = JSON.parse(d); } catch (_) {} resolve({ status: res.statusCode, ...j }); });
      }
    );
    req.on('timeout', () => { req.destroy(); resolve({ status: 0, error: 'timeout' }); });
    req.on('error', (e) => resolve({ status: 0, error: e.message }));
    req.write(body);
    req.end();
  });
}

const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const token = leerArchivo(ARCHIVO_TOKEN, 'el token de avisos');
  if (!token) process.exit(0);

  let avisos = [];
  try {
    const r = await fetch(`${WORKER}/api/admin/avisos-wa?k=${encodeURIComponent(token)}`, {
      signal: AbortSignal.timeout(20000)
    });
    if (!r.ok) { log(`la cola respondió ${r.status}; no hago nada esta vuelta`); process.exit(0); }
    avisos = (await r.json()).avisos || [];
  } catch (e) {
    log(`no pude leer la cola: ${e.message}`);
    process.exit(0);
  }

  if (!avisos.length) process.exit(0);   // silencio cuando no hay nada: el log no se llena de ruido
  log(`${avisos.length} aviso(s) pendiente(s)${SECO ? ' — MODO SECO, no se manda nada' : ''}`);

  const claveBot = SECO ? null : leerArchivo(ARCHIVO_CLAVE_BOT, 'la clave interna del bot');
  if (!SECO && !claveBot) process.exit(0);

  for (const a of avisos) {
    const numero = String(a.para || '').replace(/[^\d]/g, '');
    if (!/^\d{8,15}$/.test(numero)) { log(`aviso ${a.id}: número inválido (${a.para}), lo salto`); continue; }
    const jid = numero + '@s.whatsapp.net';

    if (SECO) {
      log(`[SECO] a +${numero}: ${a.texto}`);
      continue;                          // no se marca enviado: cuando se encienda, sale de verdad
    }

    const r = await postBot('/campana', { clave: claveBot, jid, texto: a.texto, campana: CAMPANA });
    if (r.status === 200) {
      try {
        await fetch(`${WORKER}/api/admin/avisos-wa/enviado`, {
          method: 'POST', headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ k: token, id: a.id }), signal: AbortSignal.timeout(20000)
        });
        log(`enviado a +${numero} (aviso ${a.id})`);
      } catch (e) {
        // Se mandó pero no pude marcarlo: se reintentaría y le llegaría dos veces. Lo digo fuerte.
        log(`OJO: mandé el aviso ${a.id} pero no pude marcarlo como enviado (${e.message}); puede repetirse`);
      }
    } else {
      log(`no salió el aviso ${a.id}: ${r.error || 'HTTP ' + r.status} (queda en la cola)`);
    }
    await dormir(1500);                  // el bot frena los envíos a menos de 1.2 s; le doy aire
  }
  process.exit(0);
})();
