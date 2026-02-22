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

/** Parsed AI-estimated physical properties and descriptors */
export interface AIEstimatedProperties {
  meltingPoint?: string;
  boilingPoint?: string;
  solubility?: string;
  logP?: number;
  tpsa?: number;
  pka?: string[];
  drugLikeness?: string;
}

/**
 * Estimate missing physical properties and descriptors using AI.
 * Enterprise-level fallback when PubChem data is incomplete.
 * @param smiles - SMILES string
 * @param existing - What we already have (AI will skip these)
 */
export async function aiEstimatePhysicalProperties(
  smiles: string,
  existing?: { meltingPoint?: string; boilingPoint?: string; logP?: number; tpsa?: number }
): Promise<AIEstimatedProperties | null> {
  const cleanSmiles = prepareSmilesForAI(smiles, 500);
  if (!cleanSmiles) return null;
  const skip: string[] = [];
  if (existing?.meltingPoint) skip.push('melting point');
  if (existing?.boilingPoint) skip.push('boiling point');
  if (existing?.logP != null) skip.push('logP');
  if (existing?.tpsa != null) skip.push('TPSA');
  const skipNote = skip.length > 0 ? ` Skip: ${skip.join(', ')} (already known).` : '';
  try {
    const content = await chatWithOpenAI([
      {
        role: 'system',
        content: `You are an expert medicinal chemist. Estimate physical/chemical properties for the given SMILES.${skipNote}
Reply in this exact format (one per line, use N/A if unknown):
Melting Point: [value with °C]
Boiling Point: [value with °C]
Aqueous Solubility: [e.g. "soluble", "slightly soluble", "insoluble", or mg/mL]
LogP: [number]
TPSA: [number] Å²
pKa (acidic/basic sites): [comma-separated values or "N/A"]
Drug-likeness (Lipinski): [brief assessment]`,
      },
      { role: 'user', content: `Estimate properties for SMILES: ${cleanSmiles}` },
    ]);
    const result: AIEstimatedProperties = {};
    const lines = content.split('\n').map((l) => l.trim()).filter(Boolean);
    for (const line of lines) {
      const m = line.match(/^([^:]+):\s*(.+)$/);
      if (!m) continue;
      const [, key, val] = m;
      const v = val.trim();
      if (/melting/i.test(key) && !existing?.meltingPoint) result.meltingPoint = v !== 'N/A' ? v : undefined;
      else if (/boiling/i.test(key) && !existing?.boilingPoint) result.boilingPoint = v !== 'N/A' ? v : undefined;
      else if (/solubility/i.test(key)) result.solubility = v !== 'N/A' ? v : undefined;
      else if (/^logp$/i.test(key.replace(/\s/g, '')) && existing?.logP == null) {
        const n = parseFloat(v);
        if (!Number.isNaN(n)) result.logP = n;
      } else if (/tpsa/i.test(key) && existing?.tpsa == null) {
        const n = parseFloat(v.replace(/[^\d.-]/g, ''));
        if (!Number.isNaN(n)) result.tpsa = n;
      } else if (/pka/i.test(key)) result.pka = v !== 'N/A' ? v.split(/[,;]/).map((s) => s.trim()).filter(Boolean) : undefined;
      else if (/drug-likeness|lipinski/i.test(key)) result.drugLikeness = v !== 'N/A' ? v : undefined;
    }
    return Object.keys(result).length > 0 ? result : null;
  } catch {
    return null;
  }
}

/** Common functional groups: name -> SMILES fragment (add to canvas, user connects) */
const COMMON_FG_SMILES: Record<string, string> = {
  OMe: 'CO',
  MeO: 'CO',
  OEt: 'CCO',
  EtO: 'CCO',
  CN: 'C#N',
  NC: 'C#N',
  OH: 'O',
  NH2: 'N',
  COOH: 'C(=O)O',
  Ac: 'CC(=O)C',
  Ph: 'c1ccccc1',
  Bn: 'Cc1ccccc1',
  SH: 'S',
  F: 'F',
  Cl: 'Cl',
  Br: 'Br',
  I: 'I',
  NO2: 'N(=O)=O',
  CF3: 'C(F)(F)F',
};

/**
 * Get SMILES for a functional group. Uses lookup for common FGs, AI for custom.
 * @param fgName - e.g. "OMe", "OEt", "CN", or custom like "cyclopropyl"
 * @returns SMILES fragment or null
 */
export async function aiFunctionalGroupToSmiles(fgName: string): Promise<string | null> {
  const key = String(fgName ?? '').trim();
  if (!key || key.length < 1) return null;
  const lookup = COMMON_FG_SMILES[key];
  if (lookup) return lookup;
  try {
    const content = await chatWithOpenAI([
      {
        role: 'system',
        content: 'You are a chemistry expert. Convert functional group names to SMILES. Reply with ONLY the SMILES string for the fragment, nothing else. Examples: OMe->CO, OEt->CCO, CN->C#N. For groups like "cyclopropyl" use c1cc1. No explanation.',
      },
      { role: 'user', content: `SMILES for functional group: ${key}` },
    ]);
    const smiles = content.trim().split(/\s/)[0]?.trim();
    if (smiles && smiles.length >= 2 && /[A-Za-z\[\]\(\)=#@\+\-\d]/.test(smiles)) {
      return smiles;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Estimate safety/hazard summary using AI when PubChem safety data is sparse.
 * @param smiles - SMILES string
 * @param name - Optional compound name
 */
export async function aiEstimateSafety(smiles: string, name?: string): Promise<string | null> {
  const cleanSmiles = prepareSmilesForAI(smiles, 500);
  if (!cleanSmiles) return null;
  try {
    const compound = name ? `${name} (${cleanSmiles})` : cleanSmiles;
    const content = await chatWithOpenAI([
      {
        role: 'system',
        content: 'You are a chemical safety expert. Provide a concise safety summary for the compound. Include: GHS hazard class if known, flammability, reactivity, handling precautions, and storage. Be conservative. Reply in 2-4 short paragraphs.',
      },
      { role: 'user', content: `Safety summary for: ${compound}` },
    ]);
    return content.trim().length > 20 ? content.trim() : null;
  } catch {
    return null;
  }
}
