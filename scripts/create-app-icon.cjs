#!/usr/bin/env node
/**
 * Create a square 512x512 app icon from GLC_icon.png for Tauri.
 * Run: node scripts/create-app-icon.cjs
 */
const path = require('path');
const fs = require('fs');

async function main() {
  const sharp = (await import('sharp')).default;
  const root = path.resolve(__dirname, '..');
  const src = path.join(root, 'public', 'GLC_icon.png');
  const out = path.join(root, 'src-tauri', 'icons', 'icon.png');

  if (!fs.existsSync(src)) {
    console.error('Source not found:', src);
    process.exit(1);
  }

  await sharp(src)
    .resize(512, 512, {
      fit: 'contain',
      position: 'centre',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .toFile(out);

  console.log('Created square icon:', out);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
