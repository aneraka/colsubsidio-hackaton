import { defineConfig } from 'vitest/config'

// Config de tests separada de vite.config.ts para no cargar el plugin PWA en Vitest.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
