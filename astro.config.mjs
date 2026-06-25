import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://nicoleolavarria.com',
  integrations: [sitemap()],
  output: 'static',
  server: { port: 4322 },
});
