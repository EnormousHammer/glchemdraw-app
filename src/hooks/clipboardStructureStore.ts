/**
 * Stores MOL from our Ctrl+C so canvas paste gets exact structure.
 * Clipboard has image only (for Word/PPT); we use stored MOL for canvas paste.
 */

const STALE_MS = 10000; // 10 seconds

let storedMol: string | null = null;
let storedAt = 0;

export function setStoredMol(mol: string): void {
  storedMol = mol;
  storedAt = Date.now();
}

export function getStoredMolIfFresh(): string | null {
  if (!storedMol) return null;
  if (Date.now() - storedAt > STALE_MS) {
    storedMol = null;
    return null;
  }
  return storedMol;
}

export function takeStoredMol(): string | null {
  const mol = getStoredMolIfFresh();
  storedMol = null;
  return mol;
}

export function clearStoredMol(): void {
  storedMol = null;
}
