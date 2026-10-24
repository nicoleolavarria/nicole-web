/* Genera el favicon de Nicole: una «N» en la tipografía de los títulos (Homemade Apple), como curva
   (sin depender de que la fuente cargue) sobre el fondo rosa de siempre. Salida: public/favicon.svg y los PNG.
   Uso: node scripts/build-favicon.mjs   (necesita fontkit y Playwright global para los PNG) */
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { create } from "fontkit";
const raiz = new URL("../", import.meta.url).pathname;
const FONDO = process.env.FONDO || "#fee1f2", TINTA = process.env.TINTA || "#0a0a0a", LETRA = process.env.LETRA || "N";
const fuente = create(readFileSync(raiz + "public/styles/fonts/homemade-apple-400.woff2"));
const g = fuente.layout(LETRA).glyphs[0];
const bb = g.path.bbox, upm = fuente.unitsPerEm;
const w = bb.maxX - bb.minX, h = bb.maxY - bb.minY;
const lado = 64, margen = 11, k = Math.min((lado - 2 * margen) / w, (lado - 2 * margen) / h);
const dx = (lado - w * k) / 2 - bb.minX * k, dy = (lado + h * k) / 2 + bb.minY * k;
const d = g.path.toSVG();
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${lado} ${lado}" role="img" aria-label="Nicole Olavarría">\n  <rect width="${lado}" height="${lado}" fill="${FONDO}"/>\n  <path fill="${TINTA}" transform="translate(${dx.toFixed(2)} ${dy.toFixed(2)}) scale(${k.toFixed(5)} ${(-k).toFixed(5)})" d="${d}"/>\n</svg>\n`;
writeFileSync(raiz + "public/favicon.svg", svg);
const { chromium } = createRequire("/usr/local/lib/node_modules/@playwright/test/")("playwright-core");
const b = await chromium.launch(), p = await b.newPage();
for (const [archivo, px] of [["favicon-32.png", 32], ["apple-touch-icon.png", 180], ["icon-512.png", 512]]) {
  await p.setViewportSize({ width: px, height: px });
  await p.setContent(`<body style="margin:0">${svg.replace("<svg ", `<svg width="${px}" height="${px}" `)}</body>`);
  await p.screenshot({ path: raiz + "public/" + archivo });
}
await b.close();
console.log("favicon listo (" + LETRA + ")");
