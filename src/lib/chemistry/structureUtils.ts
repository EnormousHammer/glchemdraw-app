/**
 * Structure utilities - detect empty/invalid structures from Ketcher
 */

/** Regex to detect molfile format (Ketcher sometimes returns molfile as smiles when empty) */
const LOOKS_LIKE_MOL = /V2000|V3000|-INDIGO-|0999\s+V|\d{4}\s+-?\d+\.\d+\s+-?\d+\.\d+/;

/** MOL counts line: "  N M  0  0  0  0  0  0  0  0999 V2000" - first two numbers are atom and bond count */
const MOL_COUNTS = /(\d+)\s+(\d+)\s+.*?(?:V2000|V3000)/;

/**
 * Returns true when the structure represents an empty canvas (0 atoms).
 * Ketcher may return molfile-as-smiles or empty molfile when canvas is blank.
 */
export function isStructureEmpty(molfile: string, smiles: string): boolean {
  const m = (molfile || '').trim();
  const s = (smiles || '').trim();

  if (!m && !s) return true;

  // Ketcher returns molfile string as "smiles" when empty - detect and parse
  const toParse = m || (LOOKS_LIKE_MOL.test(s) ? s : '');
  if (toParse) {
    const match = toParse.match(MOL_COUNTS);
    if (match) {
      const atoms = parseInt(match[1], 10);
      return atoms === 0;
    }
    // Looks like mol but no counts - treat as empty
    if (LOOKS_LIKE_MOL.test(s) || LOOKS_LIKE_MOL.test(m)) return true;
  }

  // Valid-looking SMILES with no molfile - not empty
  return false;
}
