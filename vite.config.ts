/// <reference types="vitest" />

import legacy from "@vitejs/plugin-legacy";
import vue from "@vitejs/plugin-vue";
import path from "path";
import { defineConfig } from "vite";
// import fs from "fs"; // Ini Production Untuk Versi WEB

// https://vitejs.dev/config/
export default defineConfig({
  // WAJIB untuk mobile/Android agar path file bener
  base: "./",

  plugins: [vue(), legacy()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
  },
  server: {
    host: true,
    // https: {
    //   key: fs.readFileSync("/etc/nginx/certs/erpsmb.key"),
    //   cert: fs.readFileSync("/etc/nginx/certs/ssl_bundle.crt"),
    // }, // Ini Production Untuk Versi WEB
    proxy: {
      // with options: http://localhost:5173/api/bar-> http://jsonplaceholder.typicode.com/bar
      "/api": {
        target: 'http://202.10.42.150:8080/',
        // target: "https://erpsmb.cloud:8443/",
        changeOrigin: true,
        // rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 1600,
  },
});
