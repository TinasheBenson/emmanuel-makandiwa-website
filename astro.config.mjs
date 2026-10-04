// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://emmanuelmakandiwa.com',
  trailingSlash: 'ignore',
  integrations: [sitemap()],
  // Keep links to the old WordPress URLs working.
  redirects: {
    '/who-is-emmanuel-makandiwa': '/about/',
  },
  prefetch: { prefetchAll: false, defaultStrategy: 'hover' },
  image: {
    responsiveStyles: true,
    layout: 'constrained',
  },
});
