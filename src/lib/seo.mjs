/* ============================================================================
   seo — datos estructurados y URL canónica de nicoleolavarria.com
   ============================================================================
   Se arma con la MISMA data que pinta la web (la que Nicole publica desde su CRM),
   no con una copia a mano: si ella cambia una modalidad, un correo o su Instagram,
   el marcado la sigue en el siguiente deploy y nunca queda diciendo algo que la
   página ya no dice.

   Regla: acá solo entra lo que está EN el sitio. Nada de precios (no los publica),
   nada de horarios de atención, nada de FAQ (no hay preguntas visibles: marcar unas
   inventadas es justo lo que Google llama spam de datos estructurados).
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

/* Una Service por cada modalidad que describe /sesiones. Sin `offers`: la web no publica
   precios y un precio inventado en el marcado es una promesa que después hay que sostener. */
function servicios(data) {
  const s = data.sesiones || {};
  return (s.modalidades || [])
    .filter((m) => m && m.nombre)
    .map((m) => {
      const esLenguaje = /lenguaje|teor[ií]a|solfeo/i.test(m.nombre);
      const svc = {
        '@type': 'Service',
        name: String(m.nombre),
        serviceType: esLenguaje ? 'Clases de lenguaje musical' : 'Clases de canto y técnica vocal',
        provider: { '@id': ID_PERSONA },
        areaServed: [
          { '@type': 'City', name: 'Lima', containedInPlace: { '@type': 'Country', name: 'Perú' } },
        ],
        availableChannel: [
          {
            '@type': 'ServiceChannel',
            name: 'Presencial en Miraflores',
            serviceLocation: {
              '@type': 'Place',
              name: 'Miraflores, Lima',
              address: {
                '@type': 'PostalAddress',
                addressLocality: 'Miraflores',
                addressRegion: 'Lima',
                addressCountry: 'PE',
              },
            },
          },
          { '@type': 'ServiceChannel', name: 'Online', serviceUrl: CANONICO + '/horarios' },
        ],
        url: CANONICO + '/sesiones',
      };
      /* La descripción sale tal cual de lo que ella escribió, sin el marcado *cursiva*. */
      if (m.desc) svc.description = String(m.desc).replace(/\*+/g, '');
      return svc;
    });
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
  if (pagina === 'sesiones') grafo.push(...servicios(data));
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': grafo }).replace(/</g, '\\u003c');
}
