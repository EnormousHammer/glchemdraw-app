#!/usr/bin/env node
/**
 * Install Python dependencies (cdx-mol) for Copy for FindMolecule.
 * Runs after npm install. Skips silently if Python is not available.
 */
const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const requirementsPath = path.join(__dirname, '..', 'requirements.txt');
if (!fs.existsSync(requirementsPath)) return;

function tryPip(python) {
  const r = spawnSync(python, ['-m', 'pip', 'install', '-r', requirementsPath, '-q'], {
    stdio: 'pipe',
    cwd: path.dirname(requirementsPath),
  });
  return r.status === 0;
}

if (tryPip('python') || tryPip('python3')) {
  // Installed
} else {
  // Python not found or pip failed - user can run: pip install -r requirements.txt
}
