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

/**
 * Format AI chemistry text for display.
 * Converts LaTeX, markdown tables, and chemistry notation to clean plain text.
 * Use for all AI-generated chemistry content (analysis, reactions, NMR explanation).
 */
export function formatChemistryText(text: string): string {
  let out = text;

  // Remove LaTeX display math \[ ... \] and \( ... \) — extract inner content
  out = out.replace(/\\\[([\s\S]*?)\\\]/g, (_, inner) => latexToPlain(inner));
  out = out.replace(/\\\(([\s\S]*?)\\\)/g, (_, inner) => latexToPlain(inner));

  // LaTeX \text{...} → content
  out = out.replace(/\\text\{([^}]*)\}/g, '$1');

  // \xrightarrow{...} or \rightarrow → arrow
  out = out.replace(/\\xrightarrow\{[^}]*\}/g, ' → ');
  out = out.replace(/\\rightarrow/g, '→');
  out = out.replace(/\\to\b/g, '→');
  out = out.replace(/\\leftrightarrow/g, '↔');
  out = out.replace(/\\rightleftharpoons/g, '⇌');
  out = out.replace(/\\Leftrightarrow/g, '⇔');

  // Subscripts _{n} → n (plain)
  out = out.replace(/\{(\d+)\}/g, '$1');
  out = out.replace(/_\{([^}]+)\}/g, '$1');
  out = out.replace(/_(\d)/g, '$1');

  // Common chemistry LaTeX
  out = out.replace(/\\Delta/g, 'Δ');
  out = out.replace(/\\delta/g, 'δ');
  out = out.replace(/\\nu/g, 'ν');
  out = out.replace(/\\times/g, '×');
  out = out.replace(/\\cdot/g, '·');
  out = out.replace(/\\pm/g, '±');
  out = out.replace(/\\degree/g, '°');
  out = out.replace(/\\circ/g, '°');
  out = out.replace(/\\ce\{([^}]*)\}/g, (_, inner) => inner.replace(/\\{/g, '').replace(/\\}/g, ''));

  // Chemistry: hν, hv → hν (standard)
  out = out.replace(/\bhv\b/g, 'hν');

  // Markdown tables: | a | b | c | → "a · b · c" per row; skip separator line (|---|---|)
  const lines = out.split('\n');
  const result: string[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (/^\|[\s\S]+\|$/.test(line)) {
      const cells = line.split('|').map((c) => c.trim()).filter(Boolean);
      const isSeparator = cells.every((c) => /^[-:]+$/.test(c));
      if (!isSeparator && cells.length > 0) {
        result.push(cells.join('  ·  '));
      }
      i++;
    } else {
      result.push(line);
      i++;
    }
  }
  out = result.join('\n');

  // Strip markdown after LaTeX/table cleanup
  out = stripMarkdown(out);

  // Normalize multiple blank lines
  out = out.replace(/\n{3,}/g, '\n\n');

  return out.trim();
}

/** @deprecated Use formatChemistryText. Kept for backward compatibility. */
export const formatAiAnalysisText = formatChemistryText;

function latexToPlain(inner: string): string {
  return inner
    .replace(/\\text\{([^}]*)\}/g, '$1')
    .replace(/\\xrightarrow\{[^}]*\}/g, ' → ')
    .replace(/\{(\d+)\}/g, '$1')
    .replace(/_\{([^}]+)\}/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}
