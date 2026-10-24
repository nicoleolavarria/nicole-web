/* ─────────────────────────────────────────────────────────────────────────────
   «MI WEB» DE NICOLE: ARRASTRAR Y ESTIRAR TEXTOS, CON UN NAVEGADOR            (24-oct-2026)
   Prueba de punta a punta contra el panel LOCAL (wrangler dev --local con D1 y R2 locales, sin cuenta,
   sin IA, sin cron; nunca toca producción). Con mouse y con dedo (touch) mueve un párrafo, lo pasa a
   otra columna, lo estira (computador y celular), deshace/rehace, publica y mira la web resultante.
   Uso:  E2E_TOKEN=<ADMIN_TOKEN local> [BASE=http://127.0.0.1:18790] node tests/e2e/mi-web-arrastrar.e2e.mjs
   Cómo se levanta el servidor local: ver PLAN-DESPLIEGUE-arrastrar-texto.md (sección «Probar en local»).
   Necesita Playwright global (/usr/local/lib/node_modules/@playwright/test) y Chrome/Chromium de Playwright.
   ───────────────────────────────────────────────────────────────────────────── */
import { createRequire } from "node:module";
import * as W from "../../src/lib/web-render.mjs";
const require = createRequire("/usr/local/lib/node_modules/@playwright/test/");
const { chromium } = require("playwright-core");
const BASE = process.env.BASE || "http://127.0.0.1:18790";
const TOKEN = process.env.E2E_TOKEN || "";
let fallos = 0;
const comprobar = (t, ok, extra) => { console.log(`  ${ok ? "✅" : "🔴"} ${t}${extra ? " · " + extra : ""}`); if (!ok) fallos++; };
if (!TOKEN){ console.log("⚪ Falta E2E_TOKEN (el ADMIN_TOKEN del servidor LOCAL): prueba omitida."); process.exit(0); }
if (!/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(BASE)){ console.log("🔴 BASE tiene que ser local (127.0.0.1 o localhost). Nunca producción."); process.exit(1); }
try { await fetch(BASE + "/api/publico"); } catch (e) { console.log("⚪ No hay servidor local en " + BASE + ": prueba omitida."); process.exit(0); }

const H = { authorization: "Bearer " + TOKEN, "content-type": "application/json" };
const WEB0 = { v: 2,
  acerca: { titulo: "Nicole", sub: "soprano", intro: ["Primer párrafo de la presentación. ".repeat(3), "Segundo párrafo, que cuenta otra cosa. ".repeat(3), "Tercer párrafo de cierre. ".repeat(3)],
    foto: { url: "/images/foto-1.jpg", pos: "50% 50%" },
    bloques: [{ tipo: "titulo", texto: "Formación" }, { tipo: "parrafo", texto: "Estudió canto durante años en distintos lugares. ".repeat(6) }, { tipo: "parrafo", texto: "Luego trabajó en escena. ".repeat(4) }] } };
const guardar = (web) => fetch(BASE + "/api/admin/web", { method: "POST", headers: H, body: JSON.stringify({ web }) }).then((r) => r.json());
const r0 = await guardar(WEB0);
if (r0.error){ console.log("🔴 no pude guardar el diseño de prueba:", r0.error); process.exit(1); }

const browser = await chromium.launch();
const nuevoCtx = (o) => browser.newContext(Object.assign({ viewport: { width: 1500, height: 1500 }, hasTouch: true }, o || {}));
const ctx = await nuevoCtx();
await ctx.addInitScript((t) => { try { localStorage.setItem("nic_admin_token", t); localStorage.setItem("nic_tour_visto", "1"); } catch (e) {} }, TOKEN);
const page = await ctx.newPage();
page.on("pageerror", (e) => console.log("   (error de página: " + e.message + ")"));
let ultimoPublicado = null, ultimaPrev = Date.now();
page.on("request", (r) => { if (r.url().endsWith("/api/admin/web") && r.method() === "POST") { try { ultimoPublicado = JSON.parse(r.postData()).web; } catch (e) {} } });
async function abrirMiWeb(pg, pagina){
  await pg.goto(BASE + "/admin/crm/");
  await pg.waitForSelector('.tab[data-tab="web"]', { state: "attached", timeout: 20000 });
  await pg.evaluate(() => { document.querySelectorAll(".tour-veil.on,#tourVeil").forEach((n) => n.remove && n.classList && n.classList.remove("on")); });
  await pg.evaluate(() => document.querySelector('.tab[data-tab="web"]').click());
  await pg.waitForSelector("#webPrev", { state: "visible", timeout: 15000 });
  await pg.evaluate((p) => document.querySelector('.webpg[data-pg="' + p + '"]').click(), pagina);
  await pg.waitForTimeout(1200);
}
const frameDe = async (pg) => { const f = await (await pg.$("#webPrev")).contentFrame(); await f.waitForSelector("[data-b]"); return f; };
const orden = (f, cont) => f.evaluate((c) => [...document.querySelectorAll('[data-s="' + c + '"] [data-b]')].map((n) => n.getAttribute("data-b")), cont);
async function tocar(pg, id){
  let f = await frameDe(pg);
  await (await f.$(`[data-b="${id}"]`)).scrollIntoViewIfNeeded();
  await (await f.$(`[data-b="${id}"]`)).click();
  await pg.waitForTimeout(500);
  f = await frameDe(pg);
  await f.waitForSelector('[data-bt="grip"]');
  return f;
}
async function arrastrar(pg, f, desdeId, haciaSel, dy){
  const g = await (await f.$('[data-bt="grip"]')).boundingBox();
  const t = await (await f.$(haciaSel)).boundingBox();
  await pg.mouse.move(g.x + g.width / 2, g.y + g.height / 2); await pg.mouse.down();
  await pg.mouse.move(t.x + 40, t.y + (dy === "fin" ? t.height - 4 : 4), { steps: 14 });
  await pg.mouse.up(); await pg.waitForTimeout(700);
}

await abrirMiWeb(page, "acerca");
let f = await frameDe(page);

console.log("── 1. Mover con el mouse dentro de la misma columna ──");
comprobar("al inicio: título, subtítulo y los tres párrafos en su orden", JSON.stringify(await orden(f, "intro")) === JSON.stringify(["acerca.titulo", "acerca.sub", "acerca.intro.0", "acerca.intro.1", "acerca.intro.2"]), JSON.stringify(await orden(f, "intro")));
f = await tocar(page, "acerca.intro.2");
comprobar("al tocar un texto aparece «Mover»", !!(await f.$('[data-bt="grip"]')));
await arrastrar(page, f, "acerca.intro.2", '[data-b="acerca.intro.0"]', "inicio");
f = await frameDe(page);
comprobar("el tercer párrafo quedó antes del primero", JSON.stringify(await orden(f, "intro")) === JSON.stringify(["acerca.titulo", "acerca.sub", "acerca.intro.2", "acerca.intro.0", "acerca.intro.1"]), JSON.stringify(await orden(f, "intro")));
comprobar("«Deshacer» se habilitó", await page.$eval("#btnWebDeshacer", (b) => !b.disabled));
comprobar("marca «cambios sin publicar»", /sin publicar/.test(await page.$eval("#webEstado", (e) => e.textContent)));

console.log("\n── 2. Deshacer y rehacer (el historial de siempre) ──");
await page.click("#btnWebDeshacer"); await page.waitForTimeout(700);
f = await frameDe(page);
comprobar("Deshacer devuelve el orden original", JSON.stringify(await orden(f, "intro")) === JSON.stringify(["acerca.titulo", "acerca.sub", "acerca.intro.0", "acerca.intro.1", "acerca.intro.2"]));
await page.click("#btnWebRehacer"); await page.waitForTimeout(700);
f = await frameDe(page);
comprobar("Rehacer lo vuelve a mover", (await orden(f, "intro"))[2] === "acerca.intro.2");
await page.click("#btnWebDeshacer"); await page.waitForTimeout(500);

console.log("\n── 3. Pasar un texto a OTRA columna de la misma página ──");
f = await tocar(page, "acerca.intro.0");
await arrastrar(page, f, "acerca.intro.0", '[data-b="acerca.bloques.2"]', "fin");
f = await frameDe(page);
const der = await orden(f, "bloques");
comprobar("el primer párrafo ahora vive en la columna de la derecha, al final", der[der.length - 1] === "acerca.intro.0", JSON.stringify(der));
comprobar("y ya no está arriba", !(await orden(f, "intro")).includes("acerca.intro.0"));

console.log("\n── 4. Estirar el ancho y el reflujo del texto (computador) ──");
f = await tocar(page, "acerca.bloques.1");
const hb = await (await f.waitForSelector('[data-bt="handle"]')).boundingBox();
const antes = await (await f.$('[data-b="acerca.bloques.1"]')).boundingBox();
await page.mouse.move(hb.x + hb.width / 2, hb.y + hb.height / 2); await page.mouse.down();
await page.mouse.move(hb.x - 200, hb.y + 60, { steps: 12 });
const vivo = await (await f.$('[data-b="acerca.bloques.1"]')).boundingBox();
comprobar("mientras estira, el texto se reacomoda (más angosto y más alto)", vivo.width < antes.width - 60 && vivo.height > antes.height);
await page.mouse.up(); await page.waitForTimeout(800);
f = await frameDe(page);
const despues = await (await f.$('[data-b="acerca.bloques.1"]')).boundingBox();
comprobar("redibujado desde el render real, sigue angosto", despues.width < antes.width - 60, Math.round(antes.width) + "→" + Math.round(despues.width));
comprobar("sin desborde: el texto cabe en su caja", await f.evaluate(() => { const n = document.querySelector('[data-b="acerca.bloques.1"]'); return n.scrollWidth <= n.clientWidth + 1; }));

console.log("\n── 5. Estirar en la vista «Celular» guarda medidas de celular ──");
await page.click('.webdev[data-dev="movil"]'); await page.waitForTimeout(1200);
f = await tocar(page, "acerca.bloques.1");
const hm = await (await f.waitForSelector('[data-bt="handle"]')).boundingBox();
await page.mouse.move(hm.x + hm.width / 2, hm.y + hm.height / 2); await page.mouse.down(); await page.mouse.move(hm.x - 70, hm.y + 40, { steps: 8 }); await page.mouse.up();
await page.waitForTimeout(800);

console.log("\n── 6. Publicar y leer lo guardado ──");
await page.click('.webdev[data-dev="desktop"]'); await page.waitForTimeout(600);
await page.click("#btnWebPublicar"); await page.waitForTimeout(1800);
const publico = await (await fetch(BASE + "/api/publico")).json();
const L = publico.web.layout && publico.web.layout.acerca;
comprobar("el worker guardó el orden (el párrafo pasó a la derecha)", L && L.secs && L.secs.bloques && L.secs.bloques.includes("acerca.intro.0") && !L.secs.intro.includes("acerca.intro.0"), JSON.stringify(L && L.secs));
comprobar("guardó ancho de computador y de celular por separado", L && L.tam["acerca.bloques.1"].w < 100 && L.tam["acerca.bloques.1"].wm < 100, JSON.stringify(L && L.tam));
const html = W.htmlDocumento("acerca", publico.web, { css: BASE + "/web/global.css" });
comprobar("el HTML público trae el orden y los tamaños (con el mismo render de la web)", /nl-b nl-bw/.test(html) && html.indexOf("acerca.bloques.2") < html.indexOf("acerca.intro.0"));
comprobar("y NO trae marcas de editor", !/data-b=|data-s=|nl-ui/.test(html));

console.log("\n── 7. La web publicada en PC y en celular ──");
const pc = await (await nuevoCtx()).newPage(); await pc.setViewportSize({ width: 1440, height: 900 });
await pc.setContent(html, { waitUntil: "networkidle" }).catch(() => {});
comprobar("en PC el párrafo estirado ocupa menos que su columna", await pc.evaluate(() => { const n = document.querySelector('[data-ed="acerca.bloques.1"]'); return n.getBoundingClientRect().width < n.parentElement.getBoundingClientRect().width - 40; }));
const mctx = await nuevoCtx({ viewport: { width: 375, height: 800 }, isMobile: true });
const mp = await mctx.newPage(); await mp.setContent(html, { waitUntil: "networkidle" }).catch(() => {});
comprobar("en celular no hay desborde horizontal", await mp.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
comprobar("en celular el párrafo usa SU medida de celular (distinta de la de PC)", await mp.evaluate(() => { const n = document.querySelector('[data-ed="acerca.bloques.1"]'); const r = n.getBoundingClientRect().width / n.parentElement.getBoundingClientRect().width; return r < 0.97 && r > 0.3; }));

console.log("\n── 8. Con el DEDO (touch): mover un texto ──");
const tctx = await nuevoCtx();
await tctx.addInitScript((t) => { try { localStorage.setItem("nic_admin_token", t); localStorage.setItem("nic_tour_visto", "1"); } catch (e) {} }, TOKEN);
const tp = await tctx.newPage();
await abrirMiWeb(tp, "acerca");
let tf = await frameDe(tp);
const cdp = await tctx.newCDPSession(tp);
const cuerpoId = (await orden(tf, "intro")).includes("acerca.intro.1") ? "acerca.intro.1" : (await orden(tf, "intro")).find((x) => /intro/.test(x));
await (await tf.$(`[data-b="${cuerpoId}"]`)).scrollIntoViewIfNeeded();
const bb = await (await tf.$(`[data-b="${cuerpoId}"]`)).boundingBox();
await tp.touchscreen.tap(bb.x + 20, bb.y + 10); await tp.waitForTimeout(500);
tf = await frameDe(tp); await tf.waitForSelector('[data-bt="grip"]');
const g2 = await (await tf.$('[data-bt="grip"]')).boundingBox();
const t2 = await (await tf.$('[data-b="acerca.titulo"]')).boundingBox();
const toque = (type, x, y) => cdp.send("Input.dispatchTouchEvent", { type, touchPoints: type === "touchEnd" ? [] : [{ x, y, id: 1 }] });
const antesT = await orden(tf, "intro");
await toque("touchStart", g2.x + g2.width / 2, g2.y + g2.height / 2);
for (let i = 1; i <= 10; i++) await toque("touchMove", g2.x + g2.width / 2, g2.y + g2.height / 2 + (t2.y - g2.y - 6) * i / 10);
await toque("touchEnd"); await tp.waitForTimeout(900);
tf = await frameDe(tp);
const despuesT = await orden(tf, "intro");
comprobar("con el dedo, el texto cambió de lugar", JSON.stringify(despuesT) !== JSON.stringify(antesT) && despuesT.indexOf(cuerpoId) < antesT.indexOf(cuerpoId), JSON.stringify(antesT) + " → " + JSON.stringify(despuesT));

console.log("\n── 9. «Volver a como estaba (lugares y tamaños)» ──");
page.once("dialog", (d) => d.accept());
await page.click("#btnWebPosiciones"); await page.waitForTimeout(1000);
f = await frameDe(page);
comprobar("todo vuelve a su lugar original", JSON.stringify(await orden(f, "intro")) === JSON.stringify(["acerca.titulo", "acerca.sub", "acerca.intro.0", "acerca.intro.1", "acerca.intro.2"]) && (await orden(f, "bloques")).join() === "acerca.bloques.0,acerca.bloques.1,acerca.bloques.2");
comprobar("los textos no cambiaron", await f.evaluate(() => document.body.textContent.includes("Primer párrafo") && document.body.textContent.includes("Estudió canto")));

await guardar({ v: 2 });   /* deja la base LOCAL limpia */
await browser.close();
console.log(fallos ? `\n🔴 ${fallos} EN ROJO` : "\n✅ TODO EN VERDE");
process.exit(fallos ? 1 : 0);
