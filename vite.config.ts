import { defineConfig } from 'vite'
import fs from 'node:fs'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import legacy from '@vitejs/plugin-legacy'

export default defineConfig({
  plugins: [
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
    legacy({
      targets: ['defaults', 'not IE 11', 'Chrome >= 79', 'Safari >= 13'],
      modernPolyfills: true,
      renderLegacyChunks: true,
    }),
    {
      name: 'copy-transaction-log-pages',
      closeBundle() {
        const outputDirectory = path.resolve(__dirname, 'dist/jvf-transaction-log')
        fs.mkdirSync(outputDirectory, { recursive: true })
        for (const page of ['jvf-log.html', 'jvf-input.html']) {
          fs.copyFileSync(
            path.resolve(__dirname, `jvf-transaction-log/${page}`),
            path.resolve(outputDirectory, page),
          )
        }
      },
    },
  ],
  resolve: {
    alias: {
      // Alias @ to the app directory
      '@': path.resolve(__dirname, './app'),
    },
  },

  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        transactionLog: path.resolve(__dirname, 'jvf-transaction-log/jvf-log.html'),
        transactionInput: path.resolve(__dirname, 'jvf-transaction-log/jvf-input.html'),
      },
    },
  },

  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],
})
