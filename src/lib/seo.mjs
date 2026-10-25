/* ============================================================================
   seo — datos estructurados y URL canónica de nicoleolavarria.com
   ============================================================================
   Se arma con la MISMA data que pinta la web (la que Nicole publica desde su CRM),
   no con una copia a mano: si ella cambia una modalidad, un correo o su Instagram,
   el marcado la sigue en el siguiente deploy y nunca queda diciendo algo que la
   página ya no dice.

   Regla: acá solo entra lo que está EN el sitio. Nada de precios (no los publica),
   nada de horarios de atención. El FAQPage solo existe en /sesiones, donde el mismo bloque de
   preguntas está VISIBLE (marcar preguntas que la página no muestra es spam de datos estructurados).
   ========================================================================== */

export const CANONICO = 'https://www.nicoleolavarria.com';

/* Vercel sirve el sitio SIN barra final (cleanUrls + trailingSlash:false) pero Astro
   construye en carpetas, así que Astro.url.pathname llega como "/sesiones/". La raíz
   conserva su barra; el resto la pierde. */
export function canonicalDe(pathname) {
  const p = String(pathname || '/').replace(/(.+)\/$/, '$1');
  return CANONICO + (p.startsWith('/') ? p : '/' + p);
}

const ID_PERSONA = CANONICO + '/#nicole';
const ID_SITIO = CANONICO + '/#website';

/* Dominios que SÍ son un perfil público de ella. wa.me y mailto: son canales de
   contacto, no perfiles: van en telephone/email, no en sameAs. */
const REDES = [/(^|\.)instagram\.com$/i, /(^|\.)youtube\.com$/i, /(^|\.)tiktok\.com$/i, /(^|\.)spotify\.com$/i];

function esRed(url) {
  try {
    return REDES.some((re) => re.test(new URL(url).hostname));
  } catch {
    return false;
  }
}

/* Saca del contacto lo que esté publicado, sin inventar nada que falte. */
function contactos(data) {
  const items = (data.contacto && data.contacto.items) || [];
  const urls = items.map((i) => String((i && i.url) || '')).filter(Boolean);
  if (data.inicio && data.inicio.instagram) urls.push(String(data.inicio.instagram));
  if (data.inicio && data.inicio.whatsapp) urls.push(String(data.inicio.whatsapp));

  const correo = urls.find((u) => u.startsWith('mailto:'));
  const wa = urls.find((u) => /(^|\/\/)wa\.me\//.test(u) || u.includes('wa.me/'));
  const sameAs = [...new Set(urls.filter(esRed).map((u) => u.split('?')[0]))];

  const salida = { sameAs };
  if (correo) salida.email = correo.replace(/^mailto:/, '').split('?')[0];
  if (wa) {
    const num = (wa.match(/wa\.me\/(\d{6,15})/) || [])[1];
    if (num) salida.telephone = '+' + num;
  }
  return salida;
}

function persona(data) {
  const c = contactos(data);
  const p = {
    '@type': 'Person',
    '@id': ID_PERSONA,
    name: 'Nicole Olavarría',
    url: CANONICO + '/',
    jobTitle: 'Profesora de canto',
    description: 'Artista escénica, soprano y docente de canto. Enseña técnica vocal y lenguaje musical en Lima y online.',
    knowsAbout: ['Técnica vocal', 'Canto', 'Lenguaje musical'],
    image: CANONICO + '/images/foto-1.jpg',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Miraflores',
      addressRegion: 'Lima',
      addressCountry: 'PE',
    },
  };
  if (c.email) p.email = c.email;
  if (c.telephone) p.telephone = c.telephone;
  if (c.sameAs.length) p.sameAs = c.sameAs;
  return p;
}

function sitio() {
  return {
    '@type': 'WebSite',
    '@id': ID_SITIO,
    url: CANONICO + '/',
    name: 'Nicole Olavarría',
    inLanguage: 'es-PE',
    publisher: { '@id': ID_PERSONA },
  };
}

/* UN solo servicio: las sesiones individuales de canto. Las "modalidades" de /sesiones hoy son
   los dos formatos (Presencial / Online), no tres clases distintas, así que se leen como canales
   del mismo servicio y no como Service separados. Cada canal sale SOLO si la página lo publica.
   Sin `offers`: la web no publica precios y un precio inventado en el marcado es una promesa
   que después hay que sostener. */
function servicios(data) {
  const s = data.sesiones || {};
  const mods = (s.modalidades || []).filter((m) => m && m.nombre);
  const hay = (re) => mods.some((m) => re.test(String(m.nombre)));
  const canales = [];
  if (hay(/presencial/i)) {
    canales.push({
      '@type': 'ServiceChannel',
      name: 'Presencial en Miraflores',
      serviceLocation: {
        '@type': 'Place',
        name: 'Miraflores, Lima',
        address: { '@type': 'PostalAddress', addressLocality: 'Miraflores', addressRegion: 'Lima', addressCountry: 'PE' },
      },
    });
  }
  if (hay(/online|virtual|zoom|meet/i)) {
    canales.push({ '@type': 'ServiceChannel', name: 'Online (Meet/Zoom)', serviceUrl: CANONICO + '/horarios' });
  }
  const svc = {
    '@type': 'Service',
    name: 'Sesiones individuales de canto 1:1',
    serviceType: 'Clases de canto y técnica vocal',
    provider: { '@id': ID_PERSONA },
    areaServed: [{ '@type': 'City', name: 'Lima', containedInPlace: { '@type': 'Country', name: 'Perú' } }],
    url: CANONICO + '/sesiones',
  };
  if (canales.length) svc.availableChannel = canales;
  /* La descripción sale de lo que ella escribió en la página, sin marcado *cursiva*. */
  const partes = (s.intro || []).map(String).join('\n').replace(/\*+/g, '').split(/\n+/).map((t) => t.trim()).filter(Boolean);
  /* Un renglón corto sin punto es un subtítulo ("Sesiones individuales de canto"), no una frase. */
  const intro = partes.filter((t) => /[.!?]$/.test(t) || t.length > 60).map((t) => (/[.!?]$/.test(t) ? t : t + '.')).join(' ');
  if (intro) svc.description = intro;
  return [svc];
}

/* ---------- Preguntas frecuentes (AEO) ----------
   Cada respuesta usa SOLO lo que la web publica hoy (sesiones, contacto, horarios, acerca).
   Lo que la web no dice (precio, duración de la sesión) se responde con eso mismo: "la web no lo
   publica, escríbele". Los números salen del contacto publicado, no de una copia a mano.
   Las respuestas llevan enlaces internos con la marca [[texto|/ruta]]: en el marcado JSON-LD se
   quedan como texto plano y en la página se vuelven <a>. */
function telefonoLegible(tel) {
  const m = /^\+51(\d{3})(\d{3})(\d{3})$/.exec(tel || '');
  return m ? `+51 ${m[1]} ${m[2]} ${m[3]}` : tel || '';
}

export function preguntas(data) {
  const c = contactos(data);
  const wa = telefonoLegible(c.telephone);
  const canalesContacto = [wa && `por WhatsApp al ${wa}`, c.email && `al correo ${c.email}`].filter(Boolean).join(' o ');
  const escribir = canalesContacto ? `escríbele ${canalesContacto}` : 'escríbele desde la página de [[contacto|/contacto]]';
  return [
    {
      q: '¿Qué clases de canto da Nicole Olavarría?',
      a: 'Nicole da sesiones individuales 1:1 de canto desde su estudio en casa. Su trabajo vocal integra herramientas del canto lírico, la técnica vocal contemporánea y su formación en fisiología y resonancia de la voz. El detalle está en [[Sesiones 1:1|/sesiones]].',
    },
    {
      q: '¿Dónde son las clases de canto?',
      a: 'Las sesiones son presenciales en Miraflores, Lima, o en línea por Meet/Zoom. Al reservar en [[Horarios|/horarios]], Nicole coordina contigo si la clase es presencial u online.',
    },
    {
      q: '¿Puedo tomar clases si nunca he cantado?',
      a: `La modalidad presencial es para principiantes y no principiantes. Si tienes dudas sobre tu caso, ${escribir}.`,
    },
    {
      q: '¿Cómo reservo una clase?',
      a: 'Entra a [[Horarios|/horarios]], elige un día y una hora libres, y deja tu nombre y tu WhatsApp. Nicole te confirma por WhatsApp. Quien ya es alumna o alumno reserva desde su portal.',
    },
    {
      q: '¿Cuánto cuesta una sesión de canto?',
      a: `La web no publica precios. Para saber cuánto cuesta una sesión, ${escribir}.`,
    },
    {
      q: '¿Quién es Nicole Olavarría?',
      a: 'Es soprano y artista escénica de Lima. Inició su trayectoria musical en la Universidad Nacional de Música y cuenta con certificación en canto lírico por el Programa Ópera Italia. Más datos en [[Acerca de|/acerca-de]] y [[Formación|/formacion]].',
    },
    {
      q: '¿Cómo contacto a Nicole?',
      a: `Puedes ${escribir}. También está en Instagram y en la página de [[contacto|/contacto]].`,
    },
  ];
}

const quitarMarcas = (t) => String(t).replace(/\[\[([^|\]]+)\|[^\]]+\]\]/g, '$1');
const escHtml = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function faqPage(data) {
  return {
    '@type': 'FAQPage',
    '@id': CANONICO + '/sesiones#faq',
    url: CANONICO + '/sesiones',
    inLanguage: 'es-PE',
    mainEntity: preguntas(data).map((p) => ({
      '@type': 'Question',
      name: p.q,
      acceptedAnswer: { '@type': 'Answer', text: quitarMarcas(p.a) },
    })),
  };
}

/* HTML visible del bloque. Reusa las clases de las tarjetas de la página (sesion-card) para no
   inventar un diseño nuevo. Debe decir EXACTAMENTE lo mismo que el JSON-LD. */
export function faqHtml(data) {
  const items = preguntas(data)
    .map((p) => {
      const a = escHtml(p.a).replace(/\[\[([^|\]]+)\|(\/[a-z0-9/-]*)\]\]/g, '<a href="$2">$1</a>');
      return `<div class="sesion-card"><h3>${escHtml(p.q)}</h3><p>${a}</p></div>`;
    })
    .join('');
  return `<section class="wrap faq" aria-labelledby="faq-titulo"><h2 id="faq-titulo">Preguntas frecuentes</h2>${items}</section>`;
}

/* Devuelve el JSON-LD LISTO para meter en el <head>, ya como texto.
   El "<" se escapa: un </script> dentro del JSON cerraría la etiqueta antes de tiempo. */
export function jsonLd(pagina, data, canonical) {
  const grafo = [sitio(), persona(data)];
  if (canonical) {
    grafo.push({
      '@type': 'WebPage',
      '@id': canonical,
      url: canonical,
      isPartOf: { '@id': ID_SITIO },
      about: { '@id': ID_PERSONA },
      inLanguage: 'es-PE',
    });
  }
  if (pagina === 'sesiones') grafo.push(...servicios(data), faqPage(data));
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': grafo }).replace(/</g, '\\u003c');
}
