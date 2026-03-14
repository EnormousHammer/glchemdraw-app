import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

const host = process.env.TAURI_DEV_HOST;
// When building for ELN embed (e.g. GLCHEMDRAW_EMBED=1), use base path so assets load from /glchemdraw/
const base = process.env.GLCHEMDRAW_EMBED ? '/glchemdraw/' : '/';

// Ketcher's macromolecules editor is lazy-loaded. Two problems:
// 1. Eager (static) import: index.modern loads before ketcher-react finishes → circular dep → styled(undefined) → __emotion_real
// 2. Plain lazy import: Vite can re-optimize at runtime → second React instance → useRef is null
// Fix: Defer import to next microtask so it runs AFTER ketcher-react finishes. No circular dep, and
// the import is still dynamic so Vite knows the full graph at build time (no runtime re-optimization).
function ketcherDeferredMacromolecules(): Plugin {
  return {
    name: 'ketcher-deferred-macromolecules',
    enforce: 'pre',
    transform(code, id) {
      if (!id.includes('ketcher-react') || !id.includes('index')) return;
      if (!code.includes("import('./index.modern-")) return;
      const match = code.match(/lazy\s*\(\s*function\s*\(\)\s*\{\s*return\s*import\s*\(\s*'(\.\/index\.modern-[^']+)'\s*\)\s*\}\s*\)/);
      if (!match) return;
      const specifier = match[1];
      const patched = code.replace(
        match[0],
        `lazy(function () { return Promise.resolve().then(function () { return import('${specifier}'); }); })`
      );
      return { code: patched, map: null };
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [ketcherDeferredMacromolecules(), react()],

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
    // Proxy for API in web mode
    proxy: {
      '/api/ocsr': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/api/cdxml-to-cdx': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
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
    // For Tauri desktop builds use platform-specific targets; for web/Vercel use modern ES2020
    // (safari13 would force transpilation of modern JS, massively inflating the bundle)
    target: process.env.TAURI_PLATFORM
      ? (process.env.TAURI_PLATFORM === "windows" ? "chrome105" : "safari13")
      : "es2020",
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
          // Bundle Ketcher with MUI/Emotion so macromolecules chunk (which imports from
          // ketcher-react and uses styled(MUI components)) shares the same Emotion instance.
          // Splitting vendor-ketcher separately caused __emotion_real undefined on Vercel.
          'vendor-mui-ketcher': [
            '@mui/material',
            '@emotion/react',
            '@emotion/styled',
            'ketcher-core',
            'ketcher-react',
            'ketcher-standalone',
          ],
          'vendor-nmrium': ['nmrium'],
        },
      },
    },
  },
});
