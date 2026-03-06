/**
 * Structure utilities - detect empty/invalid structures from Ketcher
 */

/** Regex to detect molfile format (Ketcher sometimes returns molfile as smiles when empty) */
const LOOKS_LIKE_MOL = /V2000|V3000|-INDIGO-|0999\s+V|M\s+END/i;

/** MOL V2000 counts line: "  N M  0  0  0  0  0  0  0  0999 V2000" - first two numbers are atom and bond count */
const MOL_V2000_COUNTS = /(\d+)\s+(\d+)\s+[\d\s]+0999\s+V2000/i;

/** MOL V3000 empty: "M  V30 COUNTS 0 0" or similar */
const MOL_V3000_EMPTY = /M\s+V30\s+COUNTS\s+0\s+0/i;

/**
 * Returns true when the structure represents an empty canvas (0 atoms).
 * Ketcher may return molfile-as-smiles or empty molfile when canvas is blank.
 * Valid SMILES never contain V2000, V3000, -INDIGO-, or M END.
 */
export function isStructureEmpty(molfile: string, smiles: string): boolean {
  const m = (molfile || '').trim();
  const s = (smiles || '').trim();

  if (!m && !s) return true;

  // Valid SMILES never contain molfile markers - if they do, it's molfile-as-smiles (invalid)
  const sLooksLikeMol = LOOKS_LIKE_MOL.test(s);
  const mLooksLikeMol = LOOKS_LIKE_MOL.test(m);

  if (sLooksLikeMol || mLooksLikeMol) {
    const toParse = m || s;
    // V2000: match counts line " 0 0 0 0 0 0 0 0 0 0999 V2000"
    const v2000 = toParse.match(MOL_V2000_COUNTS);
    if (v2000) {
      const atoms = parseInt(v2000[1], 10);
      return atoms === 0;
    }
    if (MOL_V3000_EMPTY.test(toParse)) return true;
    // Molfile format but couldn't parse counts - treat as empty (avoids Invalid SMILES errors)
    return true;
  }

  return false;
}
