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
  v: 1,
  estilo: {
    fuente_titulos: "",      // "" = DM Mono (la original)
    fuente_cuerpo: "",
    escala: 100,             // tamaño de letra general, %
    escala_titulo: 100,      // extra solo para los títulos grandes, %
    color_fondo: "",
    color_texto: "",
    color_acento: "",
    ancho: 860,              // ancho máximo de las páginas interiores, px
    esquinas: 0              // redondeo de las fotos, px
  },
  marca: {
    nombre: "Nicole Olavarría",
    anuncio: ""              // barra opcional arriba de todas las páginas
  },
  nav: [
    { texto: "inicio", url: "/" },
    { texto: "acerca de", url: "/acerca-de" },
    { texto: "sesiones 1:1", url: "/sesiones" },
    { texto: "contacto", url: "/contacto" },
    { texto: "portal alumno", url: "/portal/index.html", destacado: true }
  ],
  inicio: {
    titulo: "Nicole Olavarría",
    sub: "soprano · artista escénica · compositora",
    foto: { url: "/images/sesiones.jpg", pos: "50% 50%", ratio: "3/4", ancho: 380 },
    enlaces: [
      { texto: "Acerca de", url: "/acerca-de" },
      { texto: "Sesiones 1:1", url: "/sesiones" },
      { texto: "Horarios disponibles", url: "/sesiones" },
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
      if (!Object.prototype.hasOwnProperty.call(src, k)) continue;
      var v = src[k];
      if (v === undefined || v === null) continue;
      if (Array.isArray(v)) dest[k] = v;
      else if (typeof v === "object" && dest[k] && typeof dest[k] === "object" && !Array.isArray(dest[k])) unir(dest[k], v);
      else dest[k] = v;
    }
  }
  unir(out, d);
  return out;
}

/* ---------- estilo (CSS variables que sobreescriben global.css) ---------- */
function estiloCss(data){
  var e = mezclar(data).estilo;
  var r = [];
  var ft = e.fuente_titulos && FUENTES[e.fuente_titulos] ? "'" + e.fuente_titulos + "', " : "";
  var fc = e.fuente_cuerpo && FUENTES[e.fuente_cuerpo] ? "'" + e.fuente_cuerpo + "', " : "";
  if (ft) r.push("--font-titulo:" + ft + "var(--mono)");
  if (fc) r.push("--font-cuerpo:" + fc + "var(--mono)");
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
  return r.length ? ":root{" + r.join(";") + "}" : "";
}

/* <link> de Google Fonts para las fuentes elegidas (vacío si usa la original). */
function fuentesHref(data){
  var e = mezclar(data).estilo;
  var qs = [];
  [e.fuente_titulos, e.fuente_cuerpo].forEach(function (f){
    if (f && FUENTES[f] && qs.indexOf(FUENTES[f]) === -1) qs.push(FUENTES[f]);
  });
  return qs.length ? "https://fonts.googleapis.com/css2?" + qs.join("&") + "&display=swap" : "";
}

/* ---------- piezas comunes ---------- */
function fotoImg(f, clase, extra, ed){
  var o = f && typeof f === "object" ? f : {};
  var st = "object-position:" + escPos(o.pos) + ";" + (extra || "");
  return '<img src="' + urlSegura(o.url || "") + '" alt="' + esc(o.alt || "") + '" class="' + (clase || "") + '"' +
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

/* Header con navegación editable. El inicio no lo usa (va sin header). */
function headerHtml(data){
  var d = mezclar(data);
  var links = (d.nav || []).map(function (n, i){
    return '<a href="' + urlSegura(n.url) + '"' + (n.destacado ? ' class="nav-portal"' : "") +
           ' data-ed="nav.' + i + '">' + esc(n.texto) + "</a>";
  }).join("");
  return '<header>' +
    '<a href="/" class="site-name" data-ed="marca.nombre">' + esc(d.marca.nombre) + "</a>" +
    '<nav>' + links + "</nav>" +
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

/* ---------- páginas ---------- */
function paginaInicio(d){
  var h = d.inicio;
  var enlaces = (h.enlaces || []).map(function (a, i){
    return '<a href="' + urlSegura(a.url) + '" data-ed="inicio.enlaces.' + i + '">' + esc(a.texto) + "</a>";
  }).join("");
  var posClase = { arriba: "flex-start", centro: "center", abajo: "flex-end" }[h.enlaces_pos] || "flex-start";
  var anchoFoto = num(h.foto && h.foto.ancho, 380, 220, 720);
  var ratio = ["3/4", "1/1", "4/5", "4/3", "16/9"].indexOf(String(h.foto && h.foto.ratio)) >= 0 ? h.foto.ratio : "3/4";
  var redes = "";
  if (h.instagram) redes += '<a href="' + urlSegura(h.instagram) + '" target="_blank" rel="noopener" aria-label="Instagram" data-ed="inicio.instagram">' + SVG_IG + "</a>";
  if (h.whatsapp) redes += '<a href="' + urlSegura(h.whatsapp) + '" target="_blank" rel="noopener" aria-label="WhatsApp" data-ed="inicio.whatsapp">' + SVG_WA + "</a>";

  return '<div class="home">' +
    '<div class="home-top">' +
      '<h1 data-ed="inicio.titulo">' + esc(h.titulo) + "</h1>" +
      (h.sub ? '<p class="home-sub" data-ed="inicio.sub">' + esc(h.sub) + "</p>" : "") +
    "</div>" +
    '<div class="home-photo-box" style="max-width:min(' + anchoFoto + 'px,100%)">' +
      fotoImg(h.foto, "home-photo", "aspect-ratio:" + ratio + ";", "inicio.foto") +
      '<nav class="home-nav-overlay" style="justify-content:' + posClase + '">' + enlaces + "</nav>" +
    "</div>" +
    (redes ? '<div class="home-icons">' + redes + "</div>" : "") +
    "</div>";
}

function paginaAcerca(d){
  var a = d.acerca;
  var intro = (a.intro || []).map(function (p, i){
    return '<p data-ed="acerca.intro.' + i + '">' + texto(p) + "</p>";
  }).join("");
  var bloques = (a.bloques || []).map(function (b, i){
    var ed = ' data-ed="acerca.bloques.' + i + '"';
    if (b && b.tipo === "titulo") return "<h2" + ed + (i ? ' style="margin-top:40px"' : "") + ">" + esc(b.texto) + "</h2>";
    if (b && b.tipo === "foto") return '<div' + ed + ' style="margin:0 0 18px">' + fotoImg(b, "about-photo", "") + "</div>";
    return "<p" + ed + ">" + texto(b && b.texto) + "</p>";
  }).join("");
  var galeria = (a.galeria || []).map(function (g, i){
    return fotoImg(g, "", "", "acerca.galeria." + i);
  }).join("");

  return '<div class="wrap">' +
    '<div class="about-intro">' +
      '<h1 data-ed="acerca.titulo">' + esc(a.titulo) + "</h1>" +
      (a.sub ? '<p class="role" data-ed="acerca.sub">' + esc(a.sub) + "</p>" : "") +
      intro +
    "</div>" +
    '<div class="about-grid">' +
      "<div>" + (a.foto && a.foto.url ? fotoImg(a.foto, "about-photo", "", "acerca.foto") : "") + "</div>" +
      "<div>" + bloques + "</div>" +
    "</div>" +
    (galeria ? '<div class="about-photos-strip">' + galeria + "</div>" : "") +
    "</div>";
}

function paginaSesiones(d){
  var s = d.sesiones;
  var intro = (s.intro || []).map(function (p, i){
    return '<p data-ed="sesiones.intro.' + i + '">' + texto(p) + "</p>";
  }).join("");
  var cards = (s.modalidades || []).map(function (m, i){
    return '<div class="sesion-card" data-ed="sesiones.modalidades.' + i + '">' +
      "<h3>" + esc(m.nombre) + "</h3>" + (m.desc ? "<p>" + texto(m.desc) + "</p>" : "") + "</div>";
  }).join("");
  var metas = (s.metas || []).map(function (m, i){
    return '<span data-ed="sesiones.metas.' + i + '">' + esc(m) + "</span>";
  }).join("");
  var cta = s.cta && s.cta.texto
    ? '<a href="' + urlSegura(s.cta.url) + '" class="btn-agenda" target="_blank" rel="noopener" data-ed="sesiones.cta">' + esc(s.cta.texto) + "</a>"
    : "";

  return '<div class="wrap">' +
    '<div class="sesiones-hero">' +
      "<div>" +
        '<h1 data-ed="sesiones.titulo">' + esc(s.titulo) + "</h1>" + intro +
        (s.nota ? '<p class="muted small" data-ed="sesiones.nota">' + esc(s.nota) + "</p>" : "") +
        cta +
      "</div>" +
      "<div>" + (s.foto && s.foto.url ? fotoImg(s.foto, "", "width:100%;object-fit:cover;", "sesiones.foto") : "") + "</div>" +
    "</div>" +
    (s.titulo_modalidades ? '<h2 data-ed="sesiones.titulo_modalidades">' + esc(s.titulo_modalidades) + "</h2>" : "") +
    cards +
    (metas ? '<div class="sesiones-meta">' + metas + "</div>" : "") +
    cta +
    "</div>";
}

function paginaContacto(d){
  var c = d.contacto;
  var items = (c.items || []).map(function (it, i){
    var val = it.url
      ? '<a href="' + urlSegura(it.url) + '"' + (/^https?:/i.test(it.url) ? ' target="_blank" rel="noopener"' : "") + ">" + esc(it.valor) + "</a>"
      : '<span class="muted">' + esc(it.valor) + "</span>";
    return '<div class="contact-item" data-ed="contacto.items.' + i + '">' +
      '<div class="contact-label">' + esc(it.label) + "</div>" +
      '<div class="contact-value">' + val + "</div></div>";
  }).join("");
  return '<div class="wrap-narrow">' +
    '<h1 data-ed="contacto.titulo">' + esc(c.titulo) + "</h1>" +
    '<div style="margin-top:48px">' + items + "</div>" +
    "</div>";
}

/* HTML del <main> de una página. `pagina`: inicio | acerca | sesiones | contacto */
function htmlPagina(pagina, data){
  var d = mezclar(data);
  if (pagina === "acerca") return paginaAcerca(d);
  if (pagina === "sesiones") return paginaSesiones(d);
  if (pagina === "contacto") return paginaContacto(d);
  return paginaInicio(d);
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
    "<style>" + estiloCss(d) + (o.extraCss || "") + "</style></head><body>" +
    anuncioHtml(d) +
    (pagina === "inicio" ? "" : headerHtml(d)) +
    "<main>" + htmlPagina(pagina, d) + "</main>" +
    pieHtml(d) +
    (o.script ? "<script>" + o.script + "</script>" : "") +
    "</body></html>";
}

  g.WebRender = { DEFAULTS, FUENTES, esc, texto, urlSegura, mezclar, estiloCss, fuentesHref, anuncioHtml, headerHtml, pieHtml, htmlPagina, htmlDocumento };
})(typeof window !== "undefined" ? window : globalThis);
