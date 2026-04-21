import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        timeout: 660000 // 11 min - match test duration
      },
      '/reports': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  }
})
