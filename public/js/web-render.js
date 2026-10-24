/* GENERADO por scripts/build-web-render.mjs — no editar a mano.
   Fuente: src/lib/web-render.mjs */
(function (g) {
/* ============================================================================
   web-render — FUENTE ÚNICA del contenido y el diseño de nicoleolavarria.com
   ============================================================================
   Este módulo es el único lugar donde vive el markup de la web. Lo usan tres
   consumidores, siempre con la misma salida:

     1. Astro, en el BUILD  -> HTML estático real (SEO, sin flash de contenido).
     2. La web, en RUNTIME  -> si Nicole publicó algo después del último build,
                               el navegador re-renderiza al instante.
     3. El editor del CRM   -> la vista previa en vivo del panel "Mi web".

   El navegador lo consume como script clásico (window.WebRender): esa copia la
   genera `scripts/build-web-render.mjs` a partir de ESTE archivo. Editar solo
   aquí y correr `npm run render` (o `npm run build`, que ya lo encadena).

   Reglas de este archivo:
   - Sin imports ni `export default`: el generador solo sabe quitar `export `.
   - Todo texto que entra pasa por esc(); toda URL por urlSegura(). La data la
     escribe Nicole (admin autenticada) y además el worker la sanea, pero el
     render nunca confía en su entrada.
   - DEFAULTS = la web tal como se diseñó. Si Nicole no ha tocado nada, la
     salida debe ser byte por byte el diseño original.
   ========================================================================== */

/* ---------- valores por defecto = la web original ---------- */
const DEFAULTS = {
  v: 2,
  estilo: {
    fuente_titulos: "Cormorant Garamond",
    fuente_cuerpo: "Cormorant Garamond",
    escala: 100,             // tamaño de letra general, %
    escala_titulo: 100,      // extra solo para los títulos grandes, %
    color_fondo: "",
    color_texto: "",
    color_acento: "",
    ancho: 860,              // ancho máximo de las páginas interiores, px
    esquinas: 0,             // redondeo de las fotos, px
    fuentes_subidas: [],     // [{ id: "f_xxxxxxxx", nombre, formato }] (máximo 8)
    tipos: {}                // { menu, titulo_inicio, subtitulo_inicio, titulos, texto }: fuente, tam, tam_movil, peso, interlineado
  },
  marca: {
    nombre: "Nicole Olavarría",
    anuncio: ""              // barra opcional arriba de todas las páginas
  },
  nav: [
    { texto: "acerca de", url: "/acerca-de" },
    { texto: "trayectoria", url: "/trayectoria" },
    { texto: "formación", url: "/formacion" },
    { texto: "sesiones 1:1", url: "/sesiones" },
    { texto: "contacto", url: "/contacto" }
  ],
  inicio: {
    titulo: "Nicole Olavarría",
    sub: "Cantante y artista escénica. Su práctica se expande hacia la actuación, el movimiento y la creación.",
    foto: { url: "/images/sesiones.jpg", pos: "50% 50%", ratio: "3/4", ancho: 380 },
    enlaces: [
      { texto: "Acerca de", url: "/acerca-de" },
      { texto: "Sesiones 1:1", url: "/sesiones" },
      { texto: "Horarios disponibles", url: "/horarios" },
      { texto: "Portal del alumno", url: "/portal/index.html" },
      { texto: "Contacto", url: "/contacto" }
    ],
    enlaces_pos: "arriba",   // arriba | centro | abajo
    instagram: "https://www.instagram.com/nicoleolavarria_______/",
    whatsapp: "https://wa.me/51955127656"
  },
  acerca: {
    titulo: "Nicole Olavarría",
    sub: "soprano · artista escénica · compositora",
    intro: [
      "Cantante, artista escénica y compositora. Enseña técnica vocal y lenguaje musical desde 2020.",
      "Actualmente compone su primer álbum, se desempeña como soprano en el Polo Lírico \"Giuseppe Verdi\" del Opera Italia Program y lleva adelante el proyecto poético *al menos tenemos la poesía*. También facilita clubes de lectura."
    ],
    foto: { url: "/images/foto-1.jpg", pos: "50% 50%" },
    bloques: [
      { tipo: "titulo", texto: "Formación" },
      { tipo: "parrafo", texto: "Su formación musical comienza en 2015 en la Universidad Nacional de Música. Estudió técnica vocal de Música Comercial Contemporánea con Cleia Luna y pedagogía vocal con Marco Guzmán (Chile)." },
      { tipo: "parrafo", texto: "En 2020 ingresó al conjunto complementario del Coro Nacional del Perú, ocupando el primer lugar en su sección. En 2026 fue admitida al Opera Italia Program con beca." },
      { tipo: "parrafo", texto: "Su formación actoral proviene del programa \"De Stanislavski a Lecoq\" de Ciclorama y talleres con Francisco Lumerman y Alfonso Dibos. Desde 2021 estudia danza contemporánea y flexibilidad en la Academia de Danza Collage, y ballet con Verónica Uranga." },
      { tipo: "titulo", texto: "Trabajo" },
      { tipo: "parrafo", texto: "Ha participado en múltiples eventos del Ministerio de Cultura y del Coro Nacional. En 2023 presentó su performance unipersonal *qué hay dentro de los corazones de los que habitan en esta ciudad*." },
      { tipo: "parrafo", texto: "Compuso música en vivo para *La Odisea* (2024) y *Cecilia, muchas veces* (2025). Bailó en el largometraje *No te mueras por mí* (2023)." }
    ],
    galeria: [
      { url: "/images/foto-2.jpg", pos: "50% 50%" },
      { url: "/images/foto-3.jpg", pos: "50% 50%" },
      { url: "/images/foto-4.jpg", pos: "50% 50%" },
      { url: "/images/foto-5.jpg", pos: "50% 50%" }
    ]
  },
  /* Páginas propias (27-sep-2026, pedido de Nicole): antes eran secciones de /acerca-de. */
  trayectoria: {
    titulo: "Trayectoria",
    sub: "",
    foto: { url: "", pos: "50% 50%" },
    bloques: []
  },
  formacion: {
    titulo: "Formación",
    sub: "",
    foto: { url: "", pos: "50% 50%" },
    bloques: []
  },
  sesiones: {
    titulo: "Sesiones 1:1",
    intro: [
      "Clases individuales de técnica vocal y lenguaje musical. Duración de cada sesión: **1 hora**."
    ],
    nota: "Foto: Carlos Cabrera",
    foto: { url: "/images/sesiones.jpg", pos: "50% 50%" },
    cta: { texto: "agenda aquí", url: "https://wa.me/51955127656?text=hola%2C%20por%20favor%20podr%C3%ADas%20enviarme%20m%C3%A1s%20informaci%C3%B3n%20sobre%20las%20sesiones%201%3A1%3F" },
    titulo_modalidades: "modalidades",
    modalidades: [
      { nombre: "Descubrir mi voz", desc: "Pensadas para principiantes o personas sin experiencia en técnica vocal." },
      { nombre: "Cantores", desc: "Pensadas para personas con mediana experiencia en técnica vocal." },
      { nombre: "Lenguaje musical", desc: "Pensadas para aprender teoría musical, entrenamiento auditivo y lectura de partituras." }
    ],
    metas: ["Miraflores · online", "cupos limitados"]
  },
  contacto: {
    titulo: "Contacto",
    items: [
      { label: "whatsapp", valor: "+51 955 127 656", url: "https://wa.me/51955127656?text=hola%2C%20por%20favor%20podr%C3%ADas%20enviarme%20m%C3%A1s%20informaci%C3%B3n%20sobre%20las%20sesiones%201%3A1%3F" },
      { label: "correo", valor: "holanicoleolavarria@gmail.com", url: "mailto:holanicoleolavarria@gmail.com" },
      { label: "ubicación", valor: "San Isidro · Miraflores · online", url: "" },
      { label: "instagram", valor: "@nicoleolavarria_______", url: "https://www.instagram.com/nicoleolavarria_______/" }
    ]
  },
  pie: {
    gracias: "Gracias por visitar nicoleolavarria.com",
    blog_texto: "blog →",
    blog_url: "/blog",
    copy: "© 2025 Nicole Olavarría"
  }
};

/* Fuentes ofrecidas en el editor. Clave = lo que se guarda; valor = query de Google Fonts.
   "" (DM Mono) no está acá porque ya viene cargada en el <head> de la web. */
const FUENTES = {
  "Bebas Neue": "family=Bebas+Neue",
  "Bricolage Grotesque": "family=Bricolage+Grotesque:wght@400;500;700",
  "Cormorant Garamond": "family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400",
  "DM Sans": "family=DM+Sans:ital,wght@0,400;0,500;0,700;1,400",
  "EB Garamond": "family=EB+Garamond:ital,wght@0,400;0,600;1,400",
  "Homemade Apple": "family=Homemade+Apple",
  "Inter Tight": "family=Inter+Tight:ital,wght@0,400;0,600;1,400",
  "Libre Baskerville": "family=Libre+Baskerville:ital,wght@0,400;0,700;1,400",
  "Playfair Display": "family=Playfair+Display:ital,wght@0,500;0,700;1,500",
  "Space Grotesk": "family=Space+Grotesk:wght@400;500;700",
  "Space Mono": "family=Space+Mono:ital,wght@0,400;0,700;1,400",
  "Work Sans": "family=Work+Sans:ital,wght@0,400;0,500;0,700;1,400"
};

/* ---------- utilidades ---------- */
function esc(s){
  return String(s == null ? "" : s).replace(/[&<>"']/g, function (m){
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m];
  });
}

/* Marcado mínimo para que Nicole conserve las cursivas y negritas escribiendo
   texto plano: *cursiva* y **negrita**. Se escapa ANTES, así nunca entra HTML. */
function texto(s){
  var t = esc(s);
  t = t.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  t = t.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  return t.replace(/\n/g, "<br />");
}

/* Solo rutas internas y esquemas conocidos. Cualquier otra cosa (javascript:,
   data:, etc.) se convierte en "#". */
function urlSegura(u){
  var s = String(u == null ? "" : u).trim();
  if (!s) return "";
  if (/^(https?:\/\/|mailto:|tel:)/i.test(s)) return esc(s);
  if (/^[/#]/.test(s)) return esc(s);
  return "#";
}

function num(v, def, min, max){
  var n = Number(v);
  if (!isFinite(n)) return def;
  return Math.min(max, Math.max(min, n));
}

function hex(v){ return /^#[0-9a-fA-F]{6}$/.test(String(v || "").trim()) ? String(v).trim() : ""; }

/* Mezcla la data guardada con los DEFAULTS: lo ausente se completa, lo presente
   manda (una lista vacía a propósito SIGUE vacía; solo lo `undefined` cae al
   default). Devuelve siempre un objeto completo y seguro de renderizar. */
function mezclar(data){
  var d = data && typeof data === "object" ? data : {};
  var out = JSON.parse(JSON.stringify(DEFAULTS));
  function unir(dest, src){
    for (var k in src){
      if (!Object.prototype.hasOwnProperty.call(src, k) || ["__proto__", "constructor", "prototype"].indexOf(k) >= 0) continue;
      var v = src[k];
      if (v === undefined || v === null) continue;
      if (Array.isArray(v)) dest[k] = v;
      else if (typeof v === "object" && dest[k] && typeof dest[k] === "object" && !Array.isArray(dest[k])) unir(dest[k], v);
      else dest[k] = v;
    }
  }
  unir(out, d);
  // Datos anteriores a los tipos y las fuentes subidas: quedan con valores vacíos.
  if (!Array.isArray(out.estilo.fuentes_subidas)) out.estilo.fuentes_subidas = [];
  if (!out.estilo.tipos || typeof out.estilo.tipos !== "object" || Array.isArray(out.estilo.tipos)) out.estilo.tipos = {};
  // Adaptación local del diseño anterior; no escribe ni borra datos del CRM.
  // v2 se conserva al guardar desde el panel: las ediciones posteriores mandan.
  if (Number(d.v || 1) < 2) {
    out.nav = JSON.parse(JSON.stringify(DEFAULTS.nav));
    out.estilo.fuente_titulos = out.estilo.fuente_cuerpo = "Cormorant Garamond";
    out.estilo.escala = out.estilo.escala_titulo = 100;
    out.estilo.color_fondo = "#fafaf8";
    out.estilo.color_texto = "#0a0a0a";
    if (out.inicio.sub === "soprano · artista escénica · compositora") out.inicio.sub = DEFAULTS.inicio.sub;
  }
  out.v = 2;
  return out;
}

/* ---------- estilo (CSS variables que sobreescriben global.css) ---------- */
/* Origen de las fuentes subidas por Nicole (el worker las sirve con CORS). */
var ORIGEN_FUENTES = "https://nicole-crm-worker.nicoleolavarria.workers.dev";
function origenFuentes(){
  return typeof location !== "undefined" && /^(localhost|127\.0\.0\.1)$/.test(location.hostname) ? location.origin : ORIGEN_FUENTES;
}
/* Tipos de texto editables: clave en estilo.tipos, nombre en CSS y rango del tamaño en px. */
var TIPOS_EDITABLES = [
  { clave: "menu", css: "menu", min: 12, max: 60 },
  { clave: "titulo_inicio", css: "titulo-inicio", min: 24, max: 200 },
  { clave: "subtitulo_inicio", css: "subtitulo-inicio", min: 10, max: 48 },
  { clave: "titulos", css: "titulos", min: 14, max: 100 },
  { clave: "texto", css: "texto", min: 10, max: 36 },
  { clave: "pie", css: "pie", min: 10, max: 36 },
  { clave: "tarjetas", css: "tarjetas", min: 14, max: 100 },
  { clave: "nombre_sitio", css: "nombre-sitio", min: 12, max: 60 }
];
var FORMATOS_FUENTE = { woff2: "woff2", woff: "woff", ttf: "truetype", otf: "opentype" };

function enFuentes(f){
  return Object.prototype.hasOwnProperty.call(FUENTES, f);
}

/* Fuentes subidas válidas (id, formato) y sin repetir. Ignora lo que no cumple. */
function fuentesSubidas(data){
  var lista = mezclar(data).estilo.fuentes_subidas;
  if (!Array.isArray(lista)) return [];
  var out = [];
  lista.forEach(function (f){
    if (!f || typeof f !== "object") return;
    var id = String(f.id == null ? "" : f.id);
    var formato = String(f.formato == null ? "" : f.formato);
    if (!/^f_[a-z0-9]{8}$/.test(id) || !Object.prototype.hasOwnProperty.call(FORMATOS_FUENTE, formato)) return;
    if (out.some(function (x){ return x.id === id; })) return;
    out.push({ id: id, nombre: String(f.nombre || ""), formato: formato });
  });
  return out.slice(0, 8);
}

/* Nombre de familia seguro para CSS: solo claves de FUENTES o "up:<id>" de una fuente subida. */
function familiaCss(v, subidas){
  var s = String(v == null ? "" : v).trim();
  if (enFuentes(s)) return "'" + s + "'";
  var m = /^up:(f_[a-z0-9]{8})$/.exec(s);
  if (m && subidas.some(function (f){ return f.id === m[1]; })) return "'nicole-up-" + m[1] + "'";
  return "";
}

/* Tamaño en px dentro del rango. 0 o vacío = automático (no genera variable). */
function tamCss(v, min, max){
  if (v == null || v === "" || Number(v) === 0) return "";
  var n = Number(v);
  if (!isFinite(n)) return "";
  return (Math.round(Math.min(max, Math.max(min, n)) * 10) / 10) + "px";
}

function pesoCss(v){
  var s = String(v == null ? "" : v).trim();
  return s === "400" || s === "700" ? s : "";
}

/* Interlineado: número entre 1 y 3. Vacío o 0 = el de la web. */
function lhCss(v){
  if (v == null || v === "" || Number(v) === 0) return "";
  var n = Number(v);
  if (!isFinite(n)) return "";
  return String(Math.round(Math.min(3, Math.max(1, n)) * 100) / 100);
}

function tipoDe(e, clave){
  var t = e.tipos && typeof e.tipos === "object" && !Array.isArray(e.tipos) ? e.tipos[clave] : null;
  return t && typeof t === "object" ? t : {};
}

function estiloCss(data){
  var e = mezclar(data).estilo;
  var r = [];
  var ft = e.fuente_titulos && enFuentes(e.fuente_titulos) ? "'" + e.fuente_titulos + "', " : "";
  var fc = e.fuente_cuerpo && enFuentes(e.fuente_cuerpo) ? "'" + e.fuente_cuerpo + "', " : "";
  if (ft) r.push("--font-titulo:" + ft + (e.fuente_titulos === "Cormorant Garamond" ? "Georgia,serif" : "var(--mono)"));
  if (fc) r.push("--font-cuerpo:" + fc + (e.fuente_cuerpo === "Cormorant Garamond" ? "Georgia,serif" : "var(--mono)"));
  // Los valores Cormorant del contrato viejo significaban original. Se conservan.
  var subidaGeneral = fuentesSubidas(data);
  var generalT = familiaCss(e.fuente_titulos, subidaGeneral), generalC = familiaCss(e.fuente_cuerpo, subidaGeneral);
  if (generalT && e.fuente_titulos !== DEFAULTS.estilo.fuente_titulos) r.push("--g-titulos:" + generalT);
  if (generalC && e.fuente_cuerpo !== DEFAULTS.estilo.fuente_cuerpo) r.push("--g-cuerpo:" + generalC);
  var esc1 = num(e.escala, 100, 70, 150) / 100;
  var esc2 = num(e.escala_titulo, 100, 70, 200) / 100;
  if (esc1 !== 1) r.push("--esc:" + esc1);
  if (esc2 !== 1) r.push("--esc-tit:" + esc2);
  if (hex(e.color_fondo)) r.push("--bg:" + hex(e.color_fondo));
  if (hex(e.color_texto)) r.push("--fg:" + hex(e.color_texto));
  if (hex(e.color_acento)) r.push("--accent:" + hex(e.color_acento));
  var ancho = num(e.ancho, 860, 620, 1200);
  if (ancho !== 860) r.push("--ancho:" + ancho + "px");
  var esq = num(e.esquinas, 0, 0, 40);
  if (esq) r.push("--radio-foto:" + esq + "px");
  // Tipos de texto: solo generan variable los valores que existen y son válidos.
  var subidas = fuentesSubidas(data);
  TIPOS_EDITABLES.forEach(function (tp){
    var t = tipoDe(e, tp.clave);
    var p = "--t-" + tp.css + "-";
    var fam = familiaCss(t.fuente, subidas);
    if (fam) r.push(p + "fuente:" + fam);
    var tam = tamCss(t.tam, tp.min, tp.max);
    if (tam) r.push(p + "tam:" + tam);
    var tamM = tamCss(t.tam_movil, tp.min, tp.max);
    if (tamM) r.push(p + "tam-m:" + tamM);
    var peso = pesoCss(t.peso);
    if (peso) r.push(p + "peso:" + peso);
    var lh = lhCss(t.interlineado);
    if (lh) r.push(p + "lh:" + lh);
  });
  return r.length ? ":root{" + r.join(";") + "}" : "";
}

/* @font-face de las fuentes subidas por Nicole (familia 'up-<id>'). Vacío si no hay ninguna.
   Se carga solo cuando algún texto la usa, así que no pesa si no se elige. */
function fontFacesCss(data, origenLocal){
  var origen = /^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(origenLocal || "") ? origenLocal : origenFuentes();
  return fuentesSubidas(data).map(function (f){
    return "@font-face{font-family:'nicole-up-" + f.id + "';font-style:normal;font-weight:400;font-display:swap;" +
      "src:url('" + origen + "/fuentes/" + f.id + "." + f.formato + "') format('" + FORMATOS_FUENTE[f.formato] + "')}";
  }).join("");
}

/* <link> de Google Fonts para las fuentes elegidas (vacío si usa la original).
   Las fuentes subidas ("up:<id>") nunca se piden a Google. */
function fuentesHref(data){
  var e = mezclar(data).estilo;
  var familias = ["Cormorant Garamond", "DM Sans", "Homemade Apple", "Space Mono", e.fuente_titulos, e.fuente_cuerpo];
  TIPOS_EDITABLES.forEach(function (tp){ familias.push(tipoDe(e, tp.clave).fuente); });
  var qs = [];
  familias.forEach(function (f){
    if (f && enFuentes(f) && qs.indexOf(FUENTES[f]) === -1) qs.push(FUENTES[f]);
  });
  return qs.length ? "https://fonts.googleapis.com/css2?" + qs.join("&") + "&display=swap" : "";
}

/* ---------- descripciones de las fotos (alt) ----------
   Hasta el 6-set-2026 todas las fotos salían con alt="": para un lector de pantalla la
   página no tenía imágenes, y para Google tampoco.

   El alt va atado a LA FOTO, no al hueco donde está, porque Nicole reordena su galería
   desde el CRM y los arreglos guardados PISAN a los DEFAULTS enteros (mezclar()). Si ella
   sube una foto nueva, cae al genérico — que sigue siendo cierto — y si escribe su propia
   descripción desde el CRM, esa manda sobre todo lo de aquí. */
const ALT_FOTOS = {
  "/images/sesiones.jpg": "Nicole Olavarría recostada sobre telas blancas, fotografía en blanco y negro",
  "/images/foto-1.jpg": "Retrato en movimiento de Nicole Olavarría, en blanco y negro",
  "/images/foto-2.jpg": "Nicole Olavarría inclinada hacia atrás sobre un fondo de tela blanca",
  "/images/foto-3.jpg": "Nicole Olavarría de espaldas, con camisa clara, sobre un fondo blanco",
  "/images/foto-4.jpg": "Nicole Olavarría con el torso arqueado y el brazo sobre la cabeza",
  "/images/foto-5.jpg": "Nicole Olavarría de espaldas, con el brazo extendido hacia una cortina blanca"
};
const ALT_GENERICO = "Nicole Olavarría, soprano y artista escénica";

function altFoto(o){
  if (o && o.alt) return String(o.alt);
  var u = String((o && o.url) || "").split("?")[0].split("#")[0];
  return ALT_FOTOS[u] || ALT_GENERICO;
}

/* ---------- piezas comunes ---------- */
function fotoImg(f, clase, extra, ed){
  var o = f && typeof f === "object" ? f : {};
  var st = "object-position:" + escPos(o.pos) + ";" + (extra || "");
  return '<img src="' + urlSegura(o.url || "") + '" alt="' + esc(altFoto(o)) + '" class="' + (clase || "") + '"' +
         (ed ? ' data-ed="' + esc(ed) + '"' : "") + ' style="' + st + '" loading="lazy" />';
}
function escPos(p){
  var s = String(p || "50% 50%").trim();
  return /^-?\d{1,3}(\.\d+)?% -?\d{1,3}(\.\d+)?%$/.test(s) ? s : "50% 50%";
}

const SVG_IG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".6" fill="currentColor" stroke="none"/></svg>';
const SVG_WA = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>';

/* Barra de anuncio (vacía = no existe). */
function anuncioHtml(data){
  var m = mezclar(data).marca;
  if (!m.anuncio) return "";
  return '<div class="anuncio" data-ed="marca.anuncio">' + esc(m.anuncio) + "</div>";
}

/* Header compartido por la portada, interiores y vista previa editable. */
function headerHtml(data){
  var d = mezclar(data);
  var links = (d.nav || []).map(function (n, i){
    return '<a href="' + urlSegura(n.url) + '"' + (n.destacado ? ' class="nav-portal"' : "") +
           ' data-ed="nav.' + i + '">' + esc(n.texto) + "</a>";
  }).join("");
  return '<header>' +
    '<a href="/" class="site-name" data-ed="marca.nombre">' + esc(d.marca.nombre || d.inicio.titulo) + "</a>" +
    '<nav aria-label="Navegación principal">' + links + "</nav>" +
    '<button class="menu-toggle" aria-label="menú" aria-expanded="false"><span></span><span></span></button>' +
    "</header>";
}

function pieHtml(data){
  var p = mezclar(data).pie;
  return '<footer>' +
    '<span class="footer-thanks" data-ed="pie.gracias">' + esc(p.gracias) + "</span>" +
    (p.blog_texto ? '<a href="' + urlSegura(p.blog_url) + '" class="footer-blog" data-ed="pie.blog_texto">' + esc(p.blog_texto) + "</a>" : "") +
    '<p class="footer-copy" data-ed="pie.copy">' + esc(p.copy) + "</p>" +
    "</footer>";
}

/* Subtítulo de la portada en líneas cortas, como el boceto de Nicole: un salto después de
   cada punto y, en las frases largas, después de la primera coma. Si ella ya escribió sus
   propios saltos de línea, se respetan tal cual. También corrige "artísta" (tilde de más). */
function subPortada(sub){
  var t = String(sub == null ? "" : sub).replace(/art\u00edsta/gi, function (m){ return m.replace(/\u00ed/g, "i"); });
  if (/\n/.test(t)) return esc(t).replace(/\n/g, "<br />");
  var frases = t.split(/(?<=\.)\s+/);
  return frases.map(function (f){
    var e = esc(f);
    var i = f.indexOf(", ");
    if (f.length > 44 && i > 20) e = esc(f.slice(0, i + 1)) + "<br />" + esc(f.slice(i + 2));
    return e;
  }).join("<br />");
}

/* ---------- bloques que se pueden mover y estirar (24-oct-2026) ----------
   Pedido de Nicole: poder arrastrar un texto a otro lugar y controlar el tamaño de un párrafo.
   Un BLOQUE es un título, un párrafo, una tarjeta o un dato de contacto; su id es su `data-ed`
   (por ejemplo "acerca.bloques.2"). Cada página tiene CONTENEDORES (columnas de bloques) y la
   dueña puede reordenar los bloques o pasarlos de un contenedor a otro DE LA MISMA PÁGINA.
   Se guarda en `web.layout.<pagina> = { secs: {contenedor: [ids]}, tam: {id: {w,h,wm,hm}} }`:
   w/h = ancho (% del contenedor) y alto mínimo (px) en computador; wm/hm = lo mismo en celular.
   SIN `layout` el HTML sale idéntico, byte por byte, al de siempre (lo prueban los tests). */
var LAYOUT_CONTENEDORES = {
  inicio: ["top"], acerca: ["intro", "bloques"], trayectoria: ["intro", "bloques"], formacion: ["intro", "bloques"],
  sesiones: ["hero", "cards"], contacto: ["top", "items"]
};
var LAYOUT_ID = {
  inicio: /^inicio\.(titulo|sub)$/,
  acerca: /^acerca\.(titulo|sub|intro\.\d{1,2}|bloques\.\d{1,2})$/,
  trayectoria: /^trayectoria\.(titulo|sub|bloques\.\d{1,2})$/,
  formacion: /^formacion\.(titulo|sub|bloques\.\d{1,2})$/,
  sesiones: /^sesiones\.(titulo|nota|titulo_modalidades|intro\.\d{1,2}|modalidades\.\d{1,2})$/,
  contacto: /^contacto\.(titulo|items\.\d{1,2})$/
};
var LAYOUT_ANCHO_MIN = 15, LAYOUT_ALTO_MAX = 800;

/* Layout validado. También se llama al RENDERIZAR: lo guardado nunca se da por bueno. */
function layoutLimpio(raw){
  var out = {};
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return out;
  Object.keys(LAYOUT_CONTENEDORES).forEach(function (pg){
    var l = Object.prototype.hasOwnProperty.call(raw, pg) ? raw[pg] : null;
    if (!l || typeof l !== "object") return;
    var r = {};
    if (l.secs && typeof l.secs === "object"){
      var vistos = {}, secs = {};
      LAYOUT_CONTENEDORES[pg].forEach(function (c){
        var arr = Object.prototype.hasOwnProperty.call(l.secs, c) ? l.secs[c] : null;
        if (!Array.isArray(arr)) return;
        var lista = [];
        arr.slice(0, 80).forEach(function (id){
          if (id === "@cta"){ if (pg === "sesiones" && c === "hero" && lista.indexOf(id) < 0) lista.push(id); return; }
          if (typeof id !== "string" || !LAYOUT_ID[pg].test(id) || vistos[id]) return;
          vistos[id] = 1; lista.push(id);
        });
        secs[c] = lista;
      });
      if (Object.keys(secs).length) r.secs = secs;
    }
    if (l.tam && typeof l.tam === "object"){
      var tam = {};
      Object.keys(l.tam).slice(0, 200).forEach(function (id){
        if (!LAYOUT_ID[pg].test(id)) return;
        var b = l.tam[id], t = {};
        if (!b || typeof b !== "object") return;
        [["w", LAYOUT_ANCHO_MIN, 100], ["wm", LAYOUT_ANCHO_MIN, 100], ["h", 0, LAYOUT_ALTO_MAX], ["hm", 0, LAYOUT_ALTO_MAX]].forEach(function (c){
          var n = Math.round(Number(b[c[0]]));
          if (isFinite(n) && n > 0) t[c[0]] = Math.min(c[2], Math.max(c[1], n));
        });
        if (Object.keys(t).length) tam[id] = t;
      });
      if (Object.keys(tam).length) r.tam = tam;
    }
    if (Object.keys(r).length) out[pg] = r;
  });
  return out;
}

/* Listas por defecto de cada contenedor: lo que hay hoy en la página, en su orden de siempre. */
function listasDefecto(pagina, d){
  var L = {};
  function n(a){ return Array.isArray(a) ? a.length : 0; }
  function rango(pre, cant){ var o = []; for (var i = 0; i < cant; i++) o.push(pre + "." + i); return o; }
  if (pagina === "inicio"){
    L.top = ["inicio.titulo"].concat(d.inicio.sub ? ["inicio.sub"] : []);
  } else if (pagina === "acerca"){
    var a = d.acerca;
    L.intro = ["acerca.titulo"].concat(a.sub ? ["acerca.sub"] : [], rango("acerca.intro", n(a.intro)));
    L.bloques = rango("acerca.bloques", n(a.bloques));
  } else if (pagina === "trayectoria" || pagina === "formacion"){
    var b = d[pagina] || {};
    L.intro = [pagina + ".titulo"].concat(b.sub ? [pagina + ".sub"] : []);
    L.bloques = rango(pagina + ".bloques", n(b.bloques));
  } else if (pagina === "sesiones"){
    var s = d.sesiones;
    L.hero = ["sesiones.titulo"].concat(rango("sesiones.intro", n(s.intro)), s.nota ? ["sesiones.nota"] : [], s.cta && s.cta.texto ? ["@cta"] : []);
    L.cards = (s.titulo_modalidades ? ["sesiones.titulo_modalidades"] : []).concat(rango("sesiones.modalidades", n(s.modalidades)));
  } else if (pagina === "contacto"){
    L.top = ["contacto.titulo"];
    L.items = rango("contacto.items", n(d.contacto.items));
  }
  return L;
}

/* Qué bloque va en qué contenedor y en qué orden (por defecto + lo que movió la dueña). */
function planPagina(pagina, d, lay){
  var def = listasDefecto(pagina, d), plan = {};
  var existe = {}; Object.keys(def).forEach(function (c){ def[c].forEach(function (id){ existe[id] = c; }); });
  var secs = lay && lay.secs ? lay.secs : null, colocados = {};
  if (secs) Object.keys(secs).forEach(function (c){ secs[c].forEach(function (id){ if (existe[id] && id !== "@cta") colocados[id] = c; }); });
  Object.keys(def).forEach(function (c){
    if (secs && secs[c]){
      var lista = secs[c].filter(function (id){ return id === "@cta" ? def[c].indexOf("@cta") >= 0 : !!existe[id]; });
      def[c].forEach(function (id){ if ((id === "@cta" || !colocados[id]) && lista.indexOf(id) < 0) lista.push(id); });
      plan[c] = lista;
    } else {
      plan[c] = def[c].filter(function (id){ return id === "@cta" || !colocados[id]; });
    }
  });
  return plan;
}

/* Mete clase, estilo y atributos en la etiqueta de apertura de un bloque (sin envolverlo). */
function conMarcas(html, clases, estilo, attrs){
  var m = /^<([a-zA-Z0-9]+)((?:\s[^>]*)?)>/.exec(html);
  if (!m) return html;
  var at = m[2] || "";
  if (clases){
    if (/\sclass="/.test(at)) at = at.replace(/\sclass="([^"]*)"/, function (x, c){ return ' class="' + c + " " + clases + '"'; });
    else at += ' class="' + clases + '"';
  }
  if (estilo){
    if (/\sstyle="/.test(at)) at = at.replace(/\sstyle="([^"]*)"/, function (x, c){ return ' style="' + c + (/;\s*$/.test(c) || !c ? "" : ";") + estilo + '"'; });
    else at += ' style="' + estilo + '"';
  }
  return "<" + m[1] + at + (attrs || "") + ">" + html.slice(m[0].length);
}
function bloqueHtml(id, html, st){
  if (!html) return "";
  var t = st.lay && st.lay.tam && st.lay.tam[id];
  var ed = st.editable ? ' data-b="' + id + '"' : "";
  if (!t && !ed) return html;
  var vars = [];
  if (t){
    if (t.w) vars.push("--w:" + t.w + "%");
    if (t.h) vars.push("--h:" + t.h + "px");
    if (t.wm) vars.push("--wm:" + t.wm + "%");
    if (t.hm) vars.push("--hm:" + t.hm + "px");
  }
  return conMarcas(html, t ? "nl-b" + (t.w || t.wm ? " nl-bw" : "") : "", vars.join(";"), ed);
}
function contMarca(st, nombre){ return st.editable ? ' data-s="' + nombre + '"' : ""; }
function estadoLayout(pagina, d, opciones){
  var lay = layoutLimpio(d.layout)[pagina] || null;
  return { lay: lay, editable: !!(opciones && opciones.editable), plan: planPagina(pagina, d, lay), pagina: pagina };
}
function lista(st, cont, htmlDe){
  return (st.plan[cont] || []).map(function (id){ return bloqueHtml(id, htmlDe(id), st); }).join("");
}

/* ---------- páginas ---------- */
function paginaInicio(d, op){
  var h = d.inicio, st = estadoLayout("inicio", d, op);
  var de = function (id){
    if (id === "inicio.titulo") return '<h1 id="portada-titulo" data-ed="inicio.titulo">' + esc(h.titulo) + "</h1>";
    if (id === "inicio.sub") return h.sub ? '<p class="home-sub" data-ed="inicio.sub">' + subPortada(h.sub) + "</p>" : "";
    return "";
  };
  return '<section class="home" aria-labelledby="portada-titulo">' +
    '<div class="home-top"' + contMarca(st, "top") + ">" + lista(st, "top", de) + "</div></section>";
}

function paginaAcerca(d, op){
  var a = d.acerca, st = estadoLayout("acerca", d, op);
  var de = function (id){
    var m = /^acerca\.(intro|bloques)\.(\d+)$/.exec(id);
    if (id === "acerca.titulo") return '<h1 data-ed="acerca.titulo">' + esc(a.titulo) + "</h1>";
    if (id === "acerca.sub") return a.sub ? '<p class="role" data-ed="acerca.sub">' + esc(a.sub) + "</p>" : "";
    if (m && m[1] === "intro") return '<p data-ed="' + id + '">' + texto((a.intro || [])[Number(m[2])]) + "</p>";
    if (m){
      var b = (a.bloques || [])[Number(m[2])], ed = ' data-ed="' + id + '"';
      if (b && b.tipo === "titulo") return "<h2" + ed + ' id="' + String(b.texto || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") +
        '"' + (Number(m[2]) ? ' style="margin-top:40px;scroll-margin-top:24px"' : "") + ">" + esc(b.texto) + "</h2>";
      if (b && b.tipo === "foto") return '<div' + ed + ' style="margin:0 0 18px">' + fotoImg(b, "about-photo", "") + "</div>";
      return "<p" + ed + ">" + texto(b && b.texto) + "</p>";
    }
    return "";
  };
  var galeria = (a.galeria || []).map(function (g, i){
    return fotoImg(g, "", "", "acerca.galeria." + i);
  }).join("");

  return '<div class="wrap">' +
    '<div class="about-intro"' + contMarca(st, "intro") + ">" + lista(st, "intro", de) + "</div>" +
    '<div class="about-grid">' +
      "<div>" + (a.foto && a.foto.url ? fotoImg(a.foto, "about-photo", "", "acerca.foto") : "") + "</div>" +
      "<div" + contMarca(st, "bloques") + ">" + lista(st, "bloques", de) + "</div>" +
    "</div>" +
    (galeria ? '<div class="about-photos-strip">' + galeria + "</div>" : "") +
    "</div>";
}

function paginaSesiones(d, op){
  var s = d.sesiones, st = estadoLayout("sesiones", d, op);
  var cta = s.cta && s.cta.texto
    ? '<a href="' + urlSegura(s.cta.url) + '" class="btn-agenda" target="_blank" rel="noopener" data-ed="sesiones.cta">' + esc(s.cta.texto) + "</a>"
    : "";
  var de = function (id){
    var m = /^sesiones\.(intro|modalidades)\.(\d+)$/.exec(id);
    if (id === "sesiones.titulo") return '<h1 data-ed="sesiones.titulo">' + esc(s.titulo) + "</h1>";
    if (id === "sesiones.nota") return s.nota ? '<p class="muted small" data-ed="sesiones.nota">' + esc(s.nota) + "</p>" : "";
    if (id === "sesiones.titulo_modalidades") return s.titulo_modalidades ? '<h2 data-ed="sesiones.titulo_modalidades">' + esc(s.titulo_modalidades) + "</h2>" : "";
    if (id === "@cta") return st.editable && cta ? conMarcas(cta, "", "", ' data-m="cta"') : cta;
    if (m && m[1] === "intro") return '<p data-ed="' + id + '">' + texto((s.intro || [])[Number(m[2])]) + "</p>";
    if (m){
      var mo = (s.modalidades || [])[Number(m[2])] || {};
      return '<div class="sesion-card" data-ed="' + id + '">' + "<h3>" + esc(mo.nombre) + "</h3>" + (mo.desc ? "<p>" + texto(mo.desc) + "</p>" : "") + "</div>";
    }
    return "";
  };
  var metas = (s.metas || []).map(function (m, i){
    return '<span data-ed="sesiones.metas.' + i + '">' + esc(m) + "</span>";
  }).join("");
  var tarjetas = lista(st, "cards", de);

  return '<div class="wrap">' +
    '<div class="sesiones-hero">' +
      "<div" + contMarca(st, "hero") + ">" + lista(st, "hero", de) + "</div>" +
      "<div>" + (s.foto && s.foto.url ? fotoImg(s.foto, "", "width:100%;object-fit:cover;", "sesiones.foto") : "") + "</div>" +
    "</div>" +
    (st.editable ? '<div data-s="cards">' + tarjetas + "</div>" : tarjetas) +
    (metas ? '<div class="sesiones-meta">' + metas + "</div>" : "") +
    cta +
    "</div>";
}

function paginaContacto(d, op){
  var c = d.contacto, st = estadoLayout("contacto", d, op);
  var de = function (id){
    var m = /^contacto\.items\.(\d+)$/.exec(id);
    if (id === "contacto.titulo") return '<h1 data-ed="contacto.titulo">' + esc(c.titulo) + "</h1>";
    if (m){
      var it = (c.items || [])[Number(m[1])] || {};
      var val = it.url
        ? '<a href="' + urlSegura(it.url) + '"' + (/^https?:/i.test(it.url) ? ' target="_blank" rel="noopener"' : "") + ">" + esc(it.valor) + "</a>"
        : '<span class="muted">' + esc(it.valor) + "</span>";
      return '<div class="contact-item" data-ed="' + id + '">' +
        '<div class="contact-label">' + esc(it.label) + "</div>" +
        '<div class="contact-value">' + val + "</div></div>";
    }
    return "";
  };
  var top = lista(st, "top", de);
  return '<div class="wrap-narrow">' +
    (st.editable ? '<div data-s="top">' + top + "</div>" : top) +
    '<div style="margin-top:48px"' + contMarca(st, "items") + ">" + lista(st, "items", de) + "</div>" +
    "</div>";
}

/* HTML del <main> de una página. `pagina`: inicio | acerca | sesiones | contacto */
function slug(t){
  return String(t || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

/* Página propia de bloques (Trayectoria, Formación): título + bloques, y foto al costado
   solo si Nicole puso una. Mismo marcado y clases que "Acerca de" para heredar su diseño. */
function paginaBloques(d, clave, op){
  var a = d[clave] || {}, st = estadoLayout(clave, d, op);
  var de = function (id){
    var m = /^[a-z]+\.bloques\.(\d+)$/.exec(id);
    if (id === clave + ".titulo") return '<h1 data-ed="' + clave + '.titulo">' + esc(a.titulo) + "</h1>";
    if (id === clave + ".sub") return a.sub ? '<p class="role" data-ed="' + clave + '.sub">' + esc(a.sub) + "</p>" : "";
    if (m){
      var i = Number(m[1]), b = (a.bloques || [])[i], ed = ' data-ed="' + id + '"';
      if (b && b.tipo === "titulo") return "<h2" + ed + ' id="' + slug(b.texto) + '"' + (i ? ' style="margin-top:40px;scroll-margin-top:24px"' : "") + ">" + esc(b.texto) + "</h2>";
      if (b && b.tipo === "foto") return '<div' + ed + ' style="margin:0 0 18px">' + fotoImg(b, "about-photo", "") + "</div>";
      return "<p" + ed + ">" + texto(b && b.texto) + "</p>";
    }
    return "";
  };
  var bloques = lista(st, "bloques", de);
  var conFoto = a.foto && a.foto.url;
  return '<div class="wrap">' +
    '<div class="about-intro"' + contMarca(st, "intro") + ">" + lista(st, "intro", de) + "</div>" +
    (conFoto
      ? '<div class="about-grid"><div>' + fotoImg(a.foto, "about-photo", "", clave + ".foto") + "</div><div" + contMarca(st, "bloques") + ">" + bloques + "</div></div>"
      : "<div" + contMarca(st, "bloques") + ">" + bloques + "</div>") +
    "</div>";
}

function htmlPagina(pagina, data, opciones){
  var d = mezclar(data);
  if (pagina === "acerca") return paginaAcerca(d, opciones);
  if (pagina === "trayectoria" || pagina === "formacion") return paginaBloques(d, pagina, opciones);
  if (pagina === "sesiones") return paginaSesiones(d, opciones);
  if (pagina === "contacto") return paginaContacto(d, opciones);
  return paginaInicio(d, opciones);
}

/* Documento completo — lo usa la vista previa del editor (iframe). */
function htmlDocumento(pagina, data, opciones){
  var o = opciones || {};
  var d = mezclar(data);
  var href = fuentesHref(d);
  return "<!doctype html><html lang=\"es\"><head><meta charset=\"UTF-8\" />" +
    '<meta name="viewport" content="width=device-width, initial-scale=1.0" />' +
    '<link rel="preconnect" href="https://fonts.googleapis.com" />' +
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />' +
    '<link href="https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,300;0,400;0,500;1,300;1,400&display=swap" rel="stylesheet" />' +
    (href ? '<link href="' + esc(href) + '" rel="stylesheet" />' : "") +
    '<link rel="stylesheet" href="' + esc(o.css || "/web/global.css") + '" />' +
    "<style>" + estiloCss(d) + fontFacesCss(d) + (o.extraCss || "") + '</style></head><body data-pagina="' + esc(pagina) + '">' +
    anuncioHtml(d) +
    headerHtml(d) +
    "<main>" + htmlPagina(pagina, d) + "</main>" +
    pieHtml(d) +
    (o.script ? "<script>" + o.script + "</script>" : "") +
    "</body></html>";
}

  g.WebRender = { DEFAULTS, FUENTES, esc, texto, urlSegura, mezclar, estiloCss, fontFacesCss, fuentesHref, ALT_FOTOS, ALT_GENERICO, altFoto, anuncioHtml, headerHtml, pieHtml, layoutLimpio, htmlPagina, htmlDocumento };
})(typeof window !== "undefined" ? window : globalThis);
