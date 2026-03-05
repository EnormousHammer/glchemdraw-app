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

  // Native host zip (exclude build artifacts)
  const nhDir = path.join(root, 'native-host');
  const nhZip = new JSZip();
  const exclude = new Set(['dist', 'dist-host', 'build', '__pycache__', '.spec']);
  function addDirFiltered(zip, dirPath, prefix = '') {
    if (!fs.existsSync(dirPath)) return;
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const e of entries) {
      if (exclude.has(e.name) || e.name.endsWith('.spec')) continue;
      const full = path.join(dirPath, e.name);
      const name = path.join(prefix, e.name);
      if (e.isDirectory()) addDirFiltered(zip, full, name);
      else zip.file(name, fs.readFileSync(full));
    }
  }
  addDirFiltered(nhZip, nhDir);
  const nhBuf = await nhZip.generateAsync({ type: 'nodebuffer' });
  fs.writeFileSync(path.join(outDir, 'glchemdraw-native-host.zip'), nhBuf);
  console.log('[create-downloads] Created glchemdraw-native-host.zip');

  // One-click installer (if built: run native-host/build-installer.ps1 first)
  const setupExe = path.join(root, 'native-host', 'dist', 'GL-ChemDraw-Setup.exe');
  if (fs.existsSync(setupExe)) {
    fs.copyFileSync(setupExe, path.join(outDir, 'GL-ChemDraw-Setup.exe'));
    console.log('[create-downloads] Copied GL-ChemDraw-Setup.exe (one-click installer)');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
