/* Trae lo que Nicole publicó desde su CRM para que Astro lo renderice EN EL
   BUILD (HTML estático real: bueno para Google y sin parpadeo al cargar).

   Si el worker no responde, la web se construye con el diseño original — este
   fetch nunca puede tumbar un deploy. */
const ORIGEN = 'https://nicole-crm-worker.nicoleolavarria.workers.dev';

let promesa = null;

export function obtenerWeb(){
  if (promesa) return promesa;
  promesa = (async () => {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 8000);
      const r = await fetch(ORIGEN + '/api/publico', { signal: ctrl.signal });
      clearTimeout(t);
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const d = await r.json();
      return {
        web: (d && d.web) || {},
        version: (d && d.web_version) || ''
      };
    } catch (e) {
      console.warn('[web-data] no se pudo leer el CRM, se usa el diseño original:', e.message);
      return { web: {}, version: '' };
    }
  })();
  return promesa;
}

export { ORIGEN };
