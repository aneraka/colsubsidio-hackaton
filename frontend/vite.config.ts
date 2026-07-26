import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['brand/icon-192.png', 'brand/icon-512.png', 'brand/logo.png'],
      manifest: {
        name: 'Agente de Inventario',
        short_name: 'Inventario',
        description: 'Toma física de inventarios por voz — Colsubsidio Piscilago',
        lang: 'es-CO',
        display: 'standalone',
        orientation: 'landscape',
        theme_color: '#FFD000',
        background_color: '#F4F5F7',
        start_url: '/',
        icons: [
          { src: 'brand/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'brand/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'brand/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,woff2}'],
        navigateFallback: '/index.html',
      },
    }),
  ],
  server: {
    port: 5121,
    host: true,
  },
})
