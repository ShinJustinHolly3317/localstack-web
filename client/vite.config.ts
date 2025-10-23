import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  envPrefix: ['VITE_', 'BACKEND_'],
  resolve: {
    alias: {
      '@api': path.resolve(__dirname, 'src/api'),
      '@components': path.resolve(__dirname, 'src/components'),
      '@pages': path.resolve(__dirname, 'src/pages'),
    }
  },
  server: {
    port: Number(process.env.FRONTEND_PORT || 5173),
    proxy: {
      '/api': {
        target: `http://${process.env.BACKEND_HOST || 'localhost'}:${process.env.BACKEND_PORT || '3000'}`,
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist'
  }
})

