import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    ViteImageOptimizer({
      jpeg: { quality: 80 },
      webp: { quality: 80 },
      avif: { quality: 70 },
      png: { quality: 80 },
    }),
  ],
  // Read .env.local from the monorepo root so all templates share one file.
  envDir: '..',
  // VITE_SITE_SLUG identifies this template to archetype-service. It is a
  // static identity so it lives here rather than in an env file.
  define: {
    'import.meta.env.VITE_SITE_SLUG': JSON.stringify('mesa'),
  },
  resolve: { alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@apotome/archetype-shared/': fileURLToPath(new URL('./src/_shared/', import.meta.url)),
      '@apotome/archetype-shared': fileURLToPath(new URL('./src/_shared/index.ts', import.meta.url)),
    } },
})
