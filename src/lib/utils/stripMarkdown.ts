/**
 * Strip markdown symbols for plain display.
 * Keeps content (including SMILES, formulas) but removes formatting (**, ##, *, etc).
 */
export function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*\*(.+?)\*\*\*/g, '$1')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/_([^_\n]+)_/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*[-*]\s+/gm, '  ')
    .replace(/^\s*\d+\.\s+/gm, '  ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\*\*/g, '')
    .replace(/^#+\s*/gm, '')
    .trim();
}
