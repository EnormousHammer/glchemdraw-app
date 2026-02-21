/**
 * HELM (Hierarchical Editing Language for Macromolecules) format helpers
 * Used for peptide/DNA/RNA sequence import into Ketcher
 */

/**
 * Convert peptide sequence (single-letter codes) to HELM format
 * e.g. "MVDG" -> "PEPTIDE1{M.V.D.G}|PEPTIDE1$PEPTIDE1,1:1$"
 */
export function peptideToHelm(sequence: string): string {
  const cleaned = sequence.toUpperCase().replace(/\s/g, '');
  const parts = cleaned.split('').filter((c) => /[A-Z]/.test(c));
  if (parts.length === 0) return '';
  const helmSeq = parts.join('.');
  return `PEPTIDE1{${helmSeq}}|PEPTIDE1$PEPTIDE1,1:1$`;
}

/**
 * Convert DNA sequence to HELM-like format (simplified)
 * HELM oligonucleotide format is complex; this is a best-effort attempt
 */
export function dnaToHelm(sequence: string): string {
  const cleaned = sequence.toUpperCase().replace(/\s/g, '').replace(/U/g, 'T');
  const valid = cleaned.split('').filter((c) => /[ATGC]/.test(c));
  if (valid.length === 0) return '';
  const parts = valid.map((c) => `[d${c}]`);
  return `RNA1{${parts.join('.')}}|RNA1$RNA1,1:1$`;
}

/**
 * Convert RNA sequence to HELM-like format
 */
export function rnaToHelm(sequence: string): string {
  const cleaned = sequence.toUpperCase().replace(/\s/g, '').replace(/T/g, 'U');
  const valid = cleaned.split('').filter((c) => /[AUGC]/.test(c));
  if (valid.length === 0) return '';
  const parts = valid.map((c) => `[${c}]`);
  return `RNA1{${parts.join('.')}}|RNA1$RNA1,1:1$`;
}
