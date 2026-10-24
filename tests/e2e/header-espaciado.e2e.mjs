/* El header de Nicole: todo a la misma distancia (24-oct-2026).
   Dibuja las páginas con el render real y el CSS real (servidos desde un servidor local temporal) y mide la
   separación entre cada par de elementos vecinos del header en 1440, 1024, 768 y 390 px.
   Uso: node tests/e2e/header-espaciado.e2e.mjs   (necesita Playwright global) */
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { extname, join } from "node:path";
import * as W from "../../src/lib/web-render.mjs";
const require = createRequire("/usr/local/lib/node_modules/@playwright/test/");
const { chromium } = require("playwright-core");
const RAIZ = new URL("../../public/", import.meta.url).pathname;
const MIME = { ".css": "text/css", ".woff2": "font/woff2", ".jpg": "image/jpeg", ".js": "text/javascript" };
let pagina = "";
const srv = createServer((q, r) => {
  if (q.url.startsWith("/_p")) { r.setHeader("content-type", "text/html; charset=utf-8"); return r.end(pagina); }
  const f = join(RAIZ, decodeURIComponent(q.url.split("?")[0]));
  if (f.startsWith(RAIZ) && existsSync(f)) { r.setHeader("content-type", MIME[extname(f)] || "application/octet-stream"); return r.end(readFileSync(f)); }
  r.statusCode = 404; r.end();
});
await new Promise((ok) => srv.listen(0, "127.0.0.1", ok));
const base = "http://127.0.0.1:" + srv.address().port;
let fallos = 0;
const comprobar = (t, ok, extra) => { console.log(`  ${ok ? "✅" : "🔴"} ${t}${extra ? " · " + extra : ""}`); if (!ok) fallos++; };
const b = await chromium.launch();
for (const ancho of [1440, 1024, 768, 390]) {
  console.log(`── ${ancho} px ──`);
  for (const pg of ["inicio", "acerca", "sesiones", "contacto"]) {
    pagina = W.htmlDocumento(pg, {}, { css: base + "/styles/global.css" });
    const p = await b.newPage({ viewport: { width: ancho, height: 900 } });
    await p.goto(base + "/_p"); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(300);
    const r = await p.evaluate(() => {
      const items = [...document.querySelectorAll("header .site-name, header nav a")].filter((n) => n.offsetParent !== null).map((n) => n.getBoundingClientRect());
      const horiz = [], vert = [];
      for (let i = 1; i < items.length; i++) {
        const a = items[i - 1], c = items[i];
        if (Math.abs(a.top - c.top) < a.height / 2) horiz.push(Math.round(c.left - a.right)); else vert.push(Math.round(c.top - a.bottom));
      }
      return { horiz, vert, n: items.length, desborde: document.documentElement.scrollWidth > innerWidth + 1 };
    });
    const hMin = Math.min(...r.horiz), hMax = Math.max(...r.horiz);
    comprobar(`${pg}: ${r.n} elementos, separación horizontal pareja`, r.horiz.length === 0 || hMax - hMin <= 2, `entre ${hMin} y ${hMax} px`);
    if (r.vert.length) comprobar(`${pg}: al pasar de renglón la separación vertical es la misma que la horizontal`, r.vert.every((v) => Math.abs(v - hMax) <= Math.max(2, hMax * 0.5)) , `vertical ${r.vert.join(",")} vs horizontal ${hMax}`);
    comprobar(`${pg}: sin desborde horizontal`, !r.desborde);
    if (pg === "inicio") await p.screenshot({ path: process.env.SHOTS ? process.env.SHOTS + "/header-" + ancho + ".png" : "/dev/null", clip: { x: 0, y: 0, width: ancho, height: 260 } }).catch(() => {});
    await p.close();
  }
}
await b.close(); srv.close();
console.log(fallos ? `\n🔴 ${fallos} EN ROJO` : "\n✅ TODO EN VERDE");
process.exit(fallos ? 1 : 0);
