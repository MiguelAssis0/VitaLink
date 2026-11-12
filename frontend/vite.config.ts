import { defineConfig } from 'vitest/config'
import { loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')
  return {
  plugins: [react(), VitePWA({
    registerType: 'prompt',
    includeAssets: ['favicon.svg'],
    manifest: {
      name: 'VitaLink — Ambiente de simulação',
      short_name: 'VitaLink DEMO',
      description: 'Demonstração fictícia de coordenação de emergência. Não aciona serviços reais.',
      start_url: '/',
      display: 'standalone',
      background_color: '#f7f9fb',
      theme_color: '#12304a',
      icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }]
    },
    workbox: {
      navigateFallback: '/index.html',
      navigateFallbackDenylist: [/^\/api\//],
      globPatterns: ['**/*.{js,css,html,svg,ico,png,woff2}'],
      runtimeCaching: [{ urlPattern: ({ url }) => url.pathname.startsWith('/api/'), handler: 'NetworkOnly' }]
    }
  })],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: Object.fromEntries(['/api', '/webauthn', '/login/webauthn'].map((path) => [path, { target: env.VITE_API_TARGET || 'http://localhost:8080', changeOrigin: true }]))
  },
  test: { environment: 'jsdom', setupFiles: './src/test-setup.ts' }
  }
})
