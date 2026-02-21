/**
 * AI chemistry helpers - name-to-SMILES, SMILES-to-IUPAC
 * Used as fallback when PubChem has no match
 */

import { chatWithOpenAI } from '../openai';
import { getFirstStructureSmiles } from '../chemistry/openchemlib';

function sanitizeForAI(input: string, maxLen: number = 500): string {
  const s = String(input ?? '').trim();
  return s.length > maxLen ? s.slice(0, maxLen) : s;
}

/** Prepare SMILES for AI: single structure, 2-500 chars, valid chars only */
export function prepareSmilesForAI(smiles: string | null | undefined, maxLen: number = 500): string | null {
  if (!smiles || typeof smiles !== 'string') return null;
  const single = getFirstStructureSmiles(smiles.trim());
  if (single.length < 2 || single.length > maxLen) return null;
  if (!/[A-Za-z\[\]\(\)=#@\+\-\d]/.test(single)) return null;
  return single;
}

/**
 * Append user context to a user message if present.
 * Used in chemistry helpers (avoid circular deps with AIContext).
 */
function appendUserContextToPrompt(userMessage: string, context: string | undefined): string {
  const trimmed = (context ?? '').trim();
  if (!trimmed) return userMessage;
  return `${userMessage}\n\nUser context (use this to tailor your response):\n${trimmed}`;
}

/**
 * Convert chemical name to SMILES using AI when PubChem fails.
 * @param name - Chemical name to convert
 * @param userContext - Optional extra context (e.g. "prefer common name", "for patent")
 * @returns SMILES string or null if AI fails
 */
export async function aiNameToSmiles(name: string, userContext?: string): Promise<string | null> {
  const cleanName = sanitizeForAI(name, 200);
  if (!cleanName || cleanName.length < 2) return null;
  try {
    const userMsg = appendUserContextToPrompt(`Convert this chemical name to SMILES: ${cleanName}`, userContext);
    const content = await chatWithOpenAI([
      {
        role: 'system',
        content: 'You are a chemistry expert. Convert chemical names to SMILES. Reply with ONLY the SMILES string, nothing else. No explanation. If unsure, give your best guess.',
      },
      { role: 'user', content: userMsg },
    ]);
    const smiles = content.trim().split(/\s/)[0]?.trim();
    if (smiles && smiles.length > 2 && /[A-Za-z\[\]\(\)=#@\+\-\d]/.test(smiles)) {
      return smiles;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Convert SMILES to IUPAC name using AI when PubChem has no match.
 * @param smiles - SMILES string
 * @param userContext - Optional extra context (experimental data, preferences, etc.)
 * @returns IUPAC name or null if AI fails
 */
export async function aiSmilesToIupac(smiles: string, userContext?: string): Promise<string | null> {
  const cleanSmiles = prepareSmilesForAI(smiles, 500);
  if (!cleanSmiles) return null;
  try {
    const userMsg = appendUserContextToPrompt(`Give the IUPAC name for SMILES: ${cleanSmiles}`, userContext);
    const content = await chatWithOpenAI([
      {
        role: 'system',
        content: 'You are a chemistry expert. Convert SMILES to IUPAC name. Reply with ONLY the IUPAC name on the first line. If there is a common name, add it in parentheses on the same line. No other text.',
      },
      { role: 'user', content: userMsg },
    ]);
    const name = content.trim().split('\n')[0]?.trim();
    if (name && name.length > 2) return name;
    return null;
  } catch {
    return null;
  }
}
