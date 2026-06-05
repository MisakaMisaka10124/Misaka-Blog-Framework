import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  build: {
    cssMinify: false,
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/images/posts': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/images/backgrounds': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/images/avatars': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/images/friends': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/images/social': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/images/uploads': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
})