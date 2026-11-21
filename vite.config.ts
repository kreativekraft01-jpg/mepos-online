import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  base: './',
  plugins: [
    vue(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: true,
    port: 5173
  },
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        online: 'online.html',
      },
      output: {
        manualChunks: {
          vendor: ['vue', 'vue-router', 'pinia'],
          'web-llm': ['@mlc-ai/web-llm'],
        }
      }
    }
  }
})
