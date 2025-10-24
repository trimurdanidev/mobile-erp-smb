  GNU nano 4.8                                                                 vite.config.ts
/// <reference types="vitest" />

import legacy from '@vitejs/plugin-legacy'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import { defineConfig } from 'vite'
import fs from 'fs'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    legacy()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom'
  },
  server: {
    host: true,
    https: {
      key: fs.readFileSync('/etc/nginx/certs/erpsmb.key'),
      cert: fs.readFileSync('/etc/nginx/certs/ssl_bundle.crt')
    },
    allowedHosts: ['erpsmb.cloud']
  }
})