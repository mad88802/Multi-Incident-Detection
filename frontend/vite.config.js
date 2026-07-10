import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Proxy /api to Flask during development (npm run dev).
  // Not needed in production — Flask serves the built frontend directly.
  server: {
    proxy: {
      '/api': { target: 'http://localhost:5001', changeOrigin: true }
    }
  }
})

