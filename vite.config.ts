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
      // Force Ketcher and all deps to use the same React as the main app (fixes Invalid hook call)
      'react': resolve(__dirname, 'node_modules/react'),
      'react-dom': resolve(__dirname, 'node_modules/react-dom'),
      'react/jsx-runtime': resolve(__dirname, 'node_modules/react/jsx-runtime'),
      'react/jsx-dev-runtime': resolve(__dirname, 'node_modules/react/jsx-dev-runtime'),
      '@emotion/react': resolve(__dirname, 'node_modules/@emotion/react'),
      '@emotion/styled': resolve(__dirname, 'node_modules/@emotion/styled'),
    },
    // Force single React instance and Emotion
    dedupe: ['react', 'react-dom', '@emotion/react', '@emotion/styled', 'react/jsx-runtime', 'react/jsx-dev-runtime'],
  },

  // Force Vite to optimize these dependencies and dedupe React
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react/jsx-runtime',
      '@emotion/react',
      '@emotion/styled',
      'ketcher-react',
      'ketcher-core',
      'ketcher-standalone',
    ],
    exclude: [],
    esbuildOptions: {
      // Ensure single React instance
      define: {
        global: 'globalThis',
      },
    },
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
    // Proxy for NMR API in web mode
    proxy: {
      '/api/nmr-proxy': {
        target: 'https://www.nmrdb.org',
        changeOrigin: true,
        secure: true,
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            // Extract target URL from query params
            const url = new URL(req.url || '', `http://${req.headers.host}`);
            const targetUrl = url.searchParams.get('url');
            
            if (targetUrl) {
              try {
                const target = new URL(targetUrl);
                proxyReq.path = target.pathname + target.search;
                proxyReq.setHeader('host', target.host);
                proxyReq.setHeader('referer', target.origin);
                console.log('[Vite Proxy] Proxying to:', targetUrl);
              } catch (e) {
                console.error('[Vite Proxy] Invalid URL:', targetUrl);
              }
            }
          });
          
          proxy.on('proxyRes', (proxyRes, req, res) => {
            // Add CORS headers
            proxyRes.headers['access-control-allow-origin'] = '*';
            proxyRes.headers['access-control-allow-methods'] = 'GET, POST, OPTIONS';
            proxyRes.headers['access-control-allow-headers'] = 'Content-Type';
          });
        },
      },
    },
  },

  // Performance optimizations
  build: {
    target: process.env.TAURI_PLATFORM == "windows" ? "chrome105" : "safari13",
    minify: !process.env.TAURI_DEBUG ? "esbuild" : false,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    sourcemap: !!process.env.TAURI_DEBUG,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-mui': ['@mui/material', '@emotion/react', '@emotion/styled'],
          'vendor-ketcher': ['ketcher-core', 'ketcher-react'],
          'vendor-nmrium': ['nmrium'],
        },
      },
    },
  },
});
