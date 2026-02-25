#!/usr/bin/env node
/**
 * Create extension.zip and native-host.zip for FindMolecule setup downloads.
 * Run before deploy: npm run create-downloads
 */
const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');

const root = path.resolve(__dirname, '..');
const outDir = path.join(root, 'public', 'downloads');

function addDirToZip(zip, dirPath, prefix = '') {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dirPath, e.name);
    const name = path.join(prefix, e.name);
    if (e.isDirectory()) {
      addDirToZip(zip, full, name);
    } else {
      zip.file(name, fs.readFileSync(full));
    }
  }
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true });

  // Extension zip
  const extDir = path.join(root, 'extension');
  const extZip = new JSZip();
  addDirToZip(extZip, extDir);
  const extBuf = await extZip.generateAsync({ type: 'nodebuffer' });
  fs.writeFileSync(path.join(outDir, 'glchemdraw-clipboard-extension.zip'), extBuf);
  console.log('[create-downloads] Created glchemdraw-clipboard-extension.zip');

  // Native host zip
  const nhDir = path.join(root, 'native-host');
  const nhZip = new JSZip();
  addDirToZip(nhZip, nhDir);
  const nhBuf = await nhZip.generateAsync({ type: 'nodebuffer' });
  fs.writeFileSync(path.join(outDir, 'glchemdraw-native-host.zip'), nhBuf);
  console.log('[create-downloads] Created glchemdraw-native-host.zip');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
