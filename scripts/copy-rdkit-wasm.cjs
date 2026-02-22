#!/usr/bin/env node
/** Copy RDKit WASM to public folder for Vite to serve */
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const src = path.join(root, 'node_modules/@rdkit/rdkit/dist/RDKit_minimal.wasm');
const dest = path.join(root, 'public/RDKit_minimal.wasm');
if (fs.existsSync(src)) {
  fs.copyFileSync(src, dest);
  console.log('[postinstall] Copied RDKit_minimal.wasm to public/');
} else {
  console.warn('[postinstall] RDKit WASM not found at', src);
}
