import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

/* El dominio canónico es CON www: el no-www responde 308 hacia allá. Si `site`
   apunta al no-www, cada canonical y cada <loc> del sitemap manda a Google a una
   URL que redirige, y el sitemap entero queda "con avisos" en Search Console. */
export default defineConfig({
  site: 'https://www.nicoleolavarria.com',
  integrations: [
    sitemap({
      /* Vercel sirve el sitio SIN barra final (vercel.json: cleanUrls + trailingSlash:false),
         pero Astro construye en carpetas y el sitemap sale con "/sesiones/". Se normaliza
         acá para que cada <loc> sea exactamente la URL que responde 200. La raíz se queda
         con su barra, que es lo correcto. */
      serialize(item) {
        item.url = item.url.replace(/(.+)\/$/, '$1');
        return item;
      },
    }),
  ],
  output: 'static',
  server: { port: 4322 },
});
