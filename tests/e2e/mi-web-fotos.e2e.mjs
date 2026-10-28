/* ─────────────────────────────────────────────────────────────────────────────
   «MI WEB» DE NICOLE: MOVER Y ESTIRAR FOTOS, CON UN NAVEGADOR                  (25-oct-2026)
   Prueba de punta a punta contra el panel LOCAL (wrangler dev --local con D1 y R2 locales, sin cuenta,
   sin IA, sin cron; nunca toca producción). Con mouse y con dedo (touch) mueve un párrafo, lo pasa a
   otra columna, lo estira (computador y celular), deshace/rehace, publica y mira la web resultante.
   Uso:  SHOTS=<carpeta capturas> E2E_TOKEN=<ADMIN_TOKEN local> [BASE=http://127.0.0.1:18790] node tests/e2e/mi-web-arrastrar.e2e.mjs
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
    foto: { url: "/images/foto-1.jpg", pos: "50% 50%" }, galeria: [{ url: "/images/foto-3.jpg", pos: "50% 50%" }, { url: "/images/foto-4.jpg", pos: "50% 50%" }],
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


const SHOTS = process.env.SHOTS || "";
const shot = async (pg, n) => { if (SHOTS) await pg.screenshot({ path: SHOTS + "/" + n + ".png" }); };
const caja = (f, id) => f.evaluate((i) => { const n = document.querySelector('[data-b="' + i + '"]'); const r = n.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height, col: n.closest("[data-s]").getAttribute("data-s") }; }, id);

await abrirMiWeb(page, "acerca");
let f = await frameDe(page);
console.log("── 1. La foto es un bloque con «Mover» y manija de tamaño ──");
comprobar("la foto principal está en su columna", (await orden(f, "lado")).join() === "acerca.foto", (await orden(f, "lado")).join());
comprobar("la galería tiene sus dos fotos", (await orden(f, "galeria")).join() === "acerca.galeria.0,acerca.galeria.1");
f = await tocar(page, "acerca.foto");
comprobar("al tocar la foto aparece «Mover»", !!(await f.$('[data-bt="grip"]')));
comprobar("y la manija de tamaño", !!(await f.$('[data-bt="handle"]')));
await shot(page, "01-foto-seleccionada-pc");

console.log("\n── 2. Estirar la foto: más angosta y más baja, en computador ──");
const a0 = await caja(f, "acerca.foto");
const hb = await (await f.$('[data-bt="handle"]')).boundingBox();
await page.mouse.move(hb.x + hb.width / 2, hb.y + hb.height / 2); await page.mouse.down();
await page.mouse.move(hb.x - 120, hb.y - 140, { steps: 12 });
const vivo = await caja(f, "acerca.foto");
comprobar("mientras arrastra, la foto se achica en ancho y en alto", vivo.w < a0.w - 40 && vivo.h < a0.h - 60, Math.round(a0.w) + "x" + Math.round(a0.h) + " → " + Math.round(vivo.w) + "x" + Math.round(vivo.h));
await page.mouse.up(); await page.waitForTimeout(900);
f = await frameDe(page);
const a1 = await caja(f, "acerca.foto");
comprobar("redibujada por el render real, mantiene el tamaño", Math.abs(a1.w - vivo.w) < 6 && Math.abs(a1.h - vivo.h) < 6, Math.round(a1.w) + "x" + Math.round(a1.h));
await shot(page, "02-foto-achicada-pc");

console.log("\n── 3. Agrandar la foto de la galería (alto exacto) ──");
f = await tocar(page, "acerca.galeria.0");
const g0 = await caja(f, "acerca.galeria.0");
const hg = await (await f.$('[data-bt="handle"]')).boundingBox();
await page.mouse.move(hg.x + hg.width / 2, hg.y + hg.height / 2); await page.mouse.down();
await page.mouse.move(hg.x + 10, hg.y + 130, { steps: 10 }); await page.mouse.up(); await page.waitForTimeout(900);
f = await frameDe(page);
const g1 = await caja(f, "acerca.galeria.0");
comprobar("la foto de la galería quedó más alta", g1.h > g0.h + 60, Math.round(g0.h) + " → " + Math.round(g1.h));

console.log("\n── 4. Mover la foto principal a la columna de textos ──");
f = await tocar(page, "acerca.foto");
await arrastrar(page, f, "acerca.foto", '[data-b="acerca.bloques.1"]', "inicio");
f = await frameDe(page);
const bl = await orden(f, "bloques");
comprobar("la foto quedó entre los textos de la derecha", bl.includes("acerca.foto") && bl.length === 4, bl.join());
comprobar("y ya no está en su columna de origen", !(await orden(f, "lado")).includes("acerca.foto"));
await shot(page, "03-foto-movida-pc");

console.log("\n── 5. Reordenar la galería (la segunda pasa primero) ──");
f = await tocar(page, "acerca.galeria.1");
await arrastrar(page, f, "acerca.galeria.1", '[data-b="acerca.galeria.0"]', "inicio");
f = await frameDe(page);
comprobar("la galería cambió de orden", (await orden(f, "galeria")).join() === "acerca.galeria.1,acerca.galeria.0", (await orden(f, "galeria")).join());

console.log("\n── 6. En la vista «Celular» el tamaño se guarda aparte ──");
await page.click('.webdev[data-dev="movil"]'); await page.waitForTimeout(1200);
f = await tocar(page, "acerca.galeria.0");
const hm = await (await f.$('[data-bt="handle"]')).boundingBox();
await page.mouse.move(hm.x + hm.width / 2, hm.y + hm.height / 2); await page.mouse.down(); await page.mouse.move(hm.x - 60, hm.y - 90, { steps: 8 }); await page.mouse.up();
await page.waitForTimeout(900);
await shot(page, "04-editor-celular");

console.log("\n── 7. Publicar, RECARGAR el panel y comprobar que persiste ──");
await page.click('.webdev[data-dev="desktop"]'); await page.waitForTimeout(600);
const fotoAntes = await caja(await frameDe(page), "acerca.foto");
await page.click("#btnWebPublicar"); await page.waitForTimeout(1800);
const publico = await (await fetch(BASE + "/api/publico")).json();
const L = publico.web.layout && publico.web.layout.acerca;
comprobar("guardó la foto movida a la columna de textos", L && L.secs && L.secs.bloques.includes("acerca.foto") && L.secs.lado.length === 0, JSON.stringify(L && L.secs));
comprobar("guardó el tamaño de la foto (PC) y el de la galería (PC y celular)", L && L.tam["acerca.foto"].w < 100 && L.tam["acerca.foto"].h > 0 && L.tam["acerca.galeria.0"].h > 0 && L.tam["acerca.galeria.0"].wm < 100, JSON.stringify(L && L.tam));
comprobar("guardó el orden nuevo de la galería", L.secs.galeria.join() === "acerca.galeria.1,acerca.galeria.0");
await page.reload(); await abrirMiWeb(page, "acerca");
f = await frameDe(page);
const fotoDespues = await caja(f, "acerca.foto");
comprobar("tras recargar, la foto sigue en la columna de textos y del mismo tamaño", fotoDespues.col === "bloques" && Math.abs(fotoDespues.w - fotoAntes.w) < 8 && Math.abs(fotoDespues.h - fotoAntes.h) < 8, JSON.stringify(fotoAntes) + " → " + JSON.stringify(fotoDespues));
comprobar("tras recargar, la galería sigue en el orden nuevo", (await orden(f, "galeria")).join() === "acerca.galeria.1,acerca.galeria.0");
comprobar("«Deshacer» arranca vacío (no es un cambio sin publicar)", await page.$eval("#btnWebDeshacer", (b) => b.disabled));
await shot(page, "05-recargado-pc");

console.log("\n── 8. La web pública en 1440 y 390 px ──");
const html = W.htmlDocumento("acerca", publico.web, { css: BASE + "/web/global.css" });
comprobar("el HTML público no trae marcas de editor", !/data-b=|data-s=|nl-ui/.test(html));
const pc = await (await nuevoCtx()).newPage(); await pc.setViewportSize({ width: 1440, height: 1000 });
await pc.setContent(html, { waitUntil: "networkidle" }).catch(() => {});
const fp = await pc.evaluate(() => { const n = document.querySelector('[data-ed="acerca.foto"]'); const r = n.getBoundingClientRect(); const p = n.parentElement.getBoundingClientRect(); return { w: r.width, h: r.height, pw: p.width }; });
comprobar("en PC la foto ocupa menos que su columna y tiene el alto guardado", fp.w < fp.pw - 20 && Math.abs(fp.h - L.tam["acerca.foto"].h) < 3, JSON.stringify(fp));
comprobar("en PC no hay desborde horizontal", await pc.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
await shot(pc, "06-publica-1440");
const mctx = await nuevoCtx({ viewport: { width: 390, height: 844 }, isMobile: true });
const mp = await mctx.newPage(); await mp.setContent(html, { waitUntil: "networkidle" }).catch(() => {});
comprobar("en celular no hay desborde horizontal", await mp.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
const gm = await mp.evaluate(() => { const n = document.querySelector('[data-ed="acerca.galeria.0"]'); const r = n.getBoundingClientRect(); return { w: r.width, h: r.height, pw: n.parentElement.getBoundingClientRect().width }; });
comprobar("en celular la foto usa SU medida (ancho menor al de la columna)", gm.w < gm.pw - 20, JSON.stringify(gm));
await mp.screenshot({ path: (SHOTS || "/tmp") + "/07-publica-390.png", fullPage: true });

console.log("\n── 9. Con el DEDO (touch): mover una foto ──");
const tctx = await nuevoCtx();
await tctx.addInitScript((t) => { try { localStorage.setItem("nic_admin_token", t); localStorage.setItem("nic_tour_visto", "1"); } catch (e) {} }, TOKEN);
const tp = await tctx.newPage(); await abrirMiWeb(tp, "acerca");
let tf = await frameDe(tp);
const cdp = await tctx.newCDPSession(tp);
await (await tf.$('[data-b="acerca.galeria.0"]')).scrollIntoViewIfNeeded();
const bb = await (await tf.$('[data-b="acerca.galeria.0"]')).boundingBox();
await tp.touchscreen.tap(bb.x + 20, bb.y + 20); await tp.waitForTimeout(500);
tf = await frameDe(tp); await tf.waitForSelector('[data-bt="grip"]');
const g2 = await (await tf.$('[data-bt="grip"]')).boundingBox();
const t2 = await (await tf.$('[data-b="acerca.galeria.1"]')).boundingBox();
const toque = (type, x, y) => cdp.send("Input.dispatchTouchEvent", { type, touchPoints: type === "touchEnd" ? [] : [{ x, y, id: 1 }] });
const antesT = await orden(tf, "galeria");
await toque("touchStart", g2.x + g2.width / 2, g2.y + g2.height / 2);
for (let i = 1; i <= 10; i++) await toque("touchMove", g2.x + g2.width / 2 + (t2.x + 30 - g2.x - g2.width / 2) * i / 10, g2.y + g2.height / 2 + (t2.y + 6 - g2.y - g2.height / 2) * i / 10);
await toque("touchEnd"); await tp.waitForTimeout(900);
tf = await frameDe(tp);
const despT = await orden(tf, "galeria");
comprobar("con el dedo, la foto cambió de lugar en la galería", despT.join() === "acerca.galeria.0,acerca.galeria.1", antesT.join() + " → " + despT.join());

console.log("\n── 10. «Volver a como estaba» devuelve también las fotos ──");
page.once("dialog", (d) => d.accept());
await page.click("#btnWebPosiciones"); await page.waitForTimeout(1000);
f = await frameDe(page);
comprobar("la foto vuelve a su columna y la galería a su orden", (await orden(f, "lado")).join() === "acerca.foto" && (await orden(f, "galeria")).join() === "acerca.galeria.0,acerca.galeria.1");

await guardar({ v: 2 });
await browser.close();
console.log(fallos ? `\n🔴 ${fallos} EN ROJO` : "\n✅ TODO EN VERDE");
process.exit(fallos ? 1 : 0);
