import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    // Em desenvolvimento, /api é repassado para o back-end Express.
    proxy: {
      '/api': 'http://localhost:3333',
    },
  },
})
