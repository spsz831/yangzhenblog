import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: cloudflare(),
  site: 'https://yangzhen.de5.net',
  prefetch: true,
  integrations: [react(), tailwind({
    applyBaseStyles: false,
  })],
});
