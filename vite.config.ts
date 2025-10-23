import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

const host = process.env.TAURI_DEV_HOST;

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  // Define global variables for browser compatibility
  define: {
    'process.env': {},
    'global': 'globalThis',
  },

  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
      "@components": resolve(__dirname, "./src/components"),
      "@lib": resolve(__dirname, "./src/lib"),
      "@hooks": resolve(__dirname, "./src/hooks"),
      "@types": resolve(__dirname, "./src/types"),
      // Force single React instance - critical for preventing hook errors
      "react": resolve(__dirname, "node_modules/react"),
      "react-dom": resolve(__dirname, "node_modules/react-dom"),
      "@emotion/react": resolve(__dirname, "node_modules/@emotion/react"),
      "@emotion/styled": resolve(__dirname, "node_modules/@emotion/styled"),
      // Force ketcher to use our React instance
      "ketcher-react": resolve(__dirname, "node_modules/ketcher-react"),
    },
    // Force single React instance and Emotion - more comprehensive
    dedupe: [
      'react', 
      'react-dom', 
      '@emotion/react', 
      '@emotion/styled',
      'ketcher-react',
      'ketcher-core'
    ],
  },

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent Vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // 3. tell Vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },

  // Performance optimizations
  build: {
    target: process.env.TAURI_PLATFORM == "windows" ? "chrome105" : "safari13",
    minify: !process.env.TAURI_DEBUG ? "esbuild" : false,
    sourcemap: !!process.env.TAURI_DEBUG,
    chunkSizeWarningLimit: 2000,
    // Increase memory limit for large builds
    rollupOptions: {
      maxParallelFileOps: 2,
      output: {
        manualChunks: (id) => {
          // Force React into a single chunk
          if (id.includes('react') || id.includes('react-dom')) {
            return 'vendor-react';
          }
          // MUI and Emotion together
          if (id.includes('@mui') || id.includes('@emotion')) {
            return 'vendor-mui';
          }
          // Ketcher components - split into smaller chunks
          if (id.includes('ketcher-core')) {
            return 'vendor-ketcher-core';
          }
          if (id.includes('ketcher-react')) {
            return 'vendor-ketcher-react';
          }
          if (id.includes('ketcher-standalone')) {
            return 'vendor-ketcher-standalone';
          }
          // NMRium
          if (id.includes('nmrium')) {
            return 'vendor-nmrium';
          }
          // RDKit
          if (id.includes('@rdkit')) {
            return 'vendor-rdkit';
          }
          // Other large dependencies
          if (id.includes('node_modules')) {
            return 'vendor-other';
          }
        },
      },
      external: [],
    },
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true,
    },
  },
});
