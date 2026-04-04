import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api-proxy': {
        target: 'https://api.maksym.site',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-proxy/, ''),
        headers: { origin: 'https://maksym.site' }
      }
    }
  }
})
