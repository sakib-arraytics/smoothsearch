import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react({ jsxRuntime: 'classic' })],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/setupTests.js',
  },
  build: {
    rollupOptions: {
      external: ['react', 'react-dom'],
      output: {
        format: 'iife',
        name: 'SmoothSearchAdmin',
        entryFileNames: 'assets/main.js',
        assetFileNames: 'assets/main.[ext]',
        globals: {
          react: 'window.wp.element',
          'react-dom': 'window.wp.element',
        },
      },
    },
  },
})
