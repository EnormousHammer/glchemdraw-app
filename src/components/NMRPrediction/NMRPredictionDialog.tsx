/**
 * NMRPredictionDialog - Multi-nucleus NMR prediction
 * AI (OpenAI): ¹H, ¹³C, ¹⁵N, ³¹P, ¹⁹F
 * nmrdb/nmr-predictor: ¹H, ¹³C only
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Stack,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
} from '@mui/material';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import PsychologyIcon from '@mui/icons-material/Psychology';
import { useAIContext, appendUserContext } from '@/contexts/AIContext';
import { formatChemistryText } from '@/lib/utils/stripMarkdown';
import { CHEMISTRY_FORMATTING_INSTRUCTION } from '@/lib/openai/chemistryFormatting';

interface NMRPredictionDialogProps {
  open: boolean;
  onClose: () => void;
  smiles: string | null;
  molfile?: string | null;
  autoExplain?: boolean;
}

interface PredictedPeak {
  delta: number | null;
  atomIDs: number[];
  atomLabel: string;
  std?: number;
  min?: number;
  max?: number;
  nbAtoms: number
}

export type NucleusKey = '1H' | '13C' | '15N' | '31P' | '19F';

const NUCLEUS_CONFIG: Record<NucleusKey, { label: string; suffix: string; tol: number; min: number; max: number }> = {
  '1H': { label: '¹H NMR', suffix: 'H', tol: 0.05, min: 0, max: 15 },
  '13C': { label: '¹³C NMR', suffix: 'C', tol: 0.5, min: 0, max: 250 },
  '15N': { label: '¹⁵N NMR', suffix: 'N', tol: 1, min: -50, max: 400 },
  '31P': { label: '³¹P NMR', suffix: 'P', tol: 1, min: -250, max: 250 },
  '19F': { label: '¹⁹F NMR', suffix: 'F', tol: 1, min: -200, max: 100 },
};

export type NucleusPeaks = Record<NucleusKey, PredictedPeak[]>;

/** Parse AI response into peaks for ¹H, ¹³C, ¹⁵N, ³¹P, ¹⁹F. Extracts ALL matches from content. */
function parseAINMRResponse(content: string): NucleusPeaks {
  const peaks: NucleusPeaks = { '1H': [], '13C': [], '15N': [], '31P': [], '19F': [] };

  /** Find ALL matches for a nucleus in the full content (AI often puts multiple signals on one line). */
  const addAllNucleusPeaks = (nuc: NucleusKey, patterns: RegExp[], text: string) => {
    const cfg = NUCLEUS_CONFIG[nuc];
    const seen = new Set<string>();
    for (const re of patterns) {
      const globalRe = new RegExp(re.source, 'gi');
      for (const m of text.matchAll(globalRe)) {
        const delta = parseFloat(m[1]);
        const n = parseInt(m[2] || '1', 10) || 1;
        if (!Number.isFinite(delta) || delta < cfg.min || delta > cfg.max) continue;
        const key = `${delta.toFixed(2)}_${n}`;
        if (seen.has(key)) continue;
        seen.add(key);
        peaks[nuc].push({ delta, atomIDs: [], atomLabel: '', nbAtoms: n });
      }
    }
  };

  addAllNucleusPeaks('1H', [
    /(?:1H|proton|¹H)[:\s]*(?:δ\s*)?([-\d.]+)\s*(?:ppm\s*)?\((\d*)H\)/i,
    /(?:δ\s*)?([-\d.]+)\s*ppm\s*\((\d*)H\)/i,
    /(?:δ\s*)?([-\d.]+)\s*\((\d*)H\)/i,
    /(?:δ\s*)?([-\d.]+)\s*[,\:]\s*(\d*)H\b/i,
    /(?:δ\s*)?([-\d.]+)\s+(\d*)H\b/i,
  ], content);
  addAllNucleusPeaks('13C', [
    /(?:13C|carbon|¹³C)[:\s]*(?:δ\s*)?([-\d.]+)\s*(?:ppm\s*)?\((\d*)C\)/i,
    /(?:δ\s*)?([-\d.]+)\s*ppm\s*\((\d*)C\)/i,
    /(?:δ\s*)?([-\d.]+)\s*\((\d*)C\)/i,
    /(?:δ\s*)?([-\d.]+)\s*[,\:]\s*(\d*)C\b/i,
    /(?:δ\s*)?([-\d.]+)\s+(\d*)C\b/i,
  ], content);
  addAllNucleusPeaks('15N', [
    /(?:15N|nitrogen|¹⁵N)[:\s]*(?:δ\s*)?([-\d.]+)\s*(?:ppm\s*)?\((\d*)N\)/i,
    /(?:δ\s*)?([-\d.]+)\s*ppm\s*\((\d*)N\)/i,
    /(?:δ\s*)?([-\d.]+)\s*\((\d*)N\)/i,
  ], content);
  addAllNucleusPeaks('31P', [
    /(?:31P|phosphorus|³¹P)[:\s]*(?:δ\s*)?([-\d.]+)\s*(?:ppm\s*)?\((\d*)P\)/i,
    /(?:δ\s*)?([-\d.]+)\s*ppm\s*\((\d*)P\)/i,
    /(?:δ\s*)?([-\d.]+)\s*\((\d*)P\)/i,
  ], content);
  addAllNucleusPeaks('19F', [
    /(?:19F|fluorine|¹⁹F)[:\s]*(?:δ\s*)?([-\d.]+)\s*(?:ppm\s*)?\((\d*)F\)/i,
    /(?:δ\s*)?([-\d.]+)\s*ppm\s*\((\d*)F\)/i,
    /(?:δ\s*)?([-\d.]+)\s*\((\d*)F\)/i,
  ], content);

  // Bare ppm without nucleus: assign by range (only if we didn't get nucleus-specific matches)
  if (peaks['1H'].length === 0 && peaks['13C'].length === 0) {
    const lines = content.split(/[\n,;•·–-]/);
    for (const line of lines) {
      const bare = line.match(/(?:δ\s*)?([-\d.]+)\s*ppm/i);
      if (bare) {
        const delta = parseFloat(bare[1]);
        if (delta >= 0 && delta <= 15) peaks['1H'].push({ delta, atomIDs: [], atomLabel: '', nbAtoms: 1 });
        else if (delta > 15 && delta <= 250) peaks['13C'].push({ delta, atomIDs: [], atomLabel: '', nbAtoms: 1 });
      }
    }
  }

  return peaks;
}

function groupPeaks(peaks: PredictedPeak[], tolerance: number): { delta: number; count: number; atomIDs: number[] }[] {
  const sorted = [...peaks].filter((p) => p.delta != null).sort((a, b) => (a.delta ?? 0) - (b.delta ?? 0));
  const groups: { delta: number; count: number; atomIDs: number[] }[] = [];
  for (const p of sorted) {
    const d = p.delta!;
    const last = groups[groups.length - 1];
    if (last && Math.abs(last.delta - d) <= tolerance) {
      last.count += p.nbAtoms;
      last.atomIDs.push(...p.atomIDs);
    } else {
      groups.push({ delta: d, count: p.nbAtoms, atomIDs: [...p.atomIDs] });
    }
  }
  return groups;
}

export const NMRPredictionDialog: React.FC<NMRPredictionDialogProps> = ({
  open,
  onClose,
  smiles,
  molfile,
  autoExplain = false,
  
}) => {
  const [loading, setLoading] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState<'openai' | 'nmrdb' | 'loading-db' | 'predicting'>('openai');
  const [error, setError] = useState<string | null>(null);
  const [peaks, setPeaks] = useState<NucleusPeaks>({
    '1H': [], '13C': [], '15N': [], '31P': [], '19F': [],
  });
  const [dbReady, setDbReady] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [explainLoading, setExplainLoading] = useState(false);
  const [explainText, setExplainText] = useState<string | null>(null);
  const [explainError, setExplainError] = useState<string | null>(null);
  const explainSectionRef = useRef<HTMLDivElement>(null);
  const hasAutoExplainedRef = useRef(false);

  const { context: aiContext } = useAIContext();

  useEffect(() => {
    if (!open) hasAutoExplainedRef.current = false;
  }, [open]);

  useEffect(() => {
    if ((explainText || explainError) && explainSectionRef.current) {
      explainSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [explainText, explainError]);

  const runPrediction = useCallback(async () => {
    if (!smiles && !molfile) {
      setError('No structure to predict');
      return;
    }
    let input: string = molfile || smiles || '';
    // Use first structure only if multi-structure SMILES (e.g. "C1ccccc1.Oc" from disconnected fragments)
    if (typeof input === 'string' && !input.includes('\n') && input.includes('.')) {
      const parts = input.split(/\s*\.\s*/);
      input = parts[0] || input;
    }
    // Get SMILES for nmrdb and AI (convert molfile if needed)
    let smilesForNmrdb = input.includes('\n') ? null : input;
    if (!smilesForNmrdb && molfile) {
      const { molfileToSmiles } = await import('@/lib/chemistry/openchemlib');
      smilesForNmrdb = molfileToSmiles(molfile);
    }
    // Use first structure only for multi-structure SMILES
    if (smilesForNmrdb && smilesForNmrdb.includes('.')) {
      const { getFirstStructureSmiles } = await import('@/lib/chemistry/openchemlib');
      smilesForNmrdb = getFirstStructureSmiles(smilesForNmrdb);
    }

    setLoading(true);
    setError(null);
    setPeaks({ '1H': [], '13C': [], '15N': [], '31P': [], '19F': [] });
    setExplainText(null);
    setExplainError(null);

    try {
      // 1. Try OpenAI first - needs valid SMILES (2-500 chars), single structure, never molfile
      const { prepareSmilesForAI } = await import('@/lib/openai/chemistry');
      const smiForAI = prepareSmilesForAI(smilesForNmrdb ?? '', 500);
      setLoadingPhase('openai');
      if (smiForAI) {
      try {
        const { chatWithOpenAI } = await import('@/lib/openai');
        const userMsg = `Predict ALL NMR chemical shifts for SMILES: ${smiForAI}. This will be reviewed by PhD chemists—provide accurate, literature-typical values. List every ¹H and ¹³C signal. If the molecule contains N, P, or F, also list ¹⁵N, ³¹P, or ¹⁹F. One signal per line. Do not omit any signals.`;
        const content = await chatWithOpenAI([
          {
            role: 'system',
            content: 'You are an expert organic chemist. Predict NMR chemical shifts from SMILES. Your output will be used by PhD chemists and must be ACCURATE and COMPLETE. Use literature-typical chemical shift values (e.g. aliphatic CH3 ~0.9–1.3, aromatic ~7–8, carbonyl C ~170–220 ppm). List EVERY chemically distinct signal. Format: 1H: δ X.XX ppm (nH), 13C: δ X.XX ppm (nC), 15N: δ X.XX ppm (nN), 31P: δ X.XX ppm (nP), 19F: δ X.XX ppm (nF). Include all ¹H and ¹³C signals. Include ¹⁵N, ³¹P, ¹⁹F only if the molecule contains N, P, or F. Be precise: equivalent nuclei share one signal with correct multiplicity count. Reply with ONLY the signals, one per line. No other text.',
          },
          {
            role: 'user',
            content: appendUserContext(userMsg, aiContext),
          },
        ]);
        const aiResult = parseAINMRResponse(content);
        const hasAny = Object.values(aiResult).some((arr) => arr.length > 0);
        if (hasAny) {
          setPeaks(aiResult);
          setLoading(false);
          return;
        }
      } catch (aiErr) {
        console.warn('[NMR] OpenAI prediction failed, trying nmrdb:', aiErr);
      }
      } else {
        console.log('[NMR] Skipping AI (no valid SMILES), trying nmrdb/nmr-predictor');
      }

      // 2. Try nmrdb.org (¹H, ¹³C only)
      if (smilesForNmrdb) {
        setLoadingPhase('nmrdb');
        const { fetchNMRFromNmrdb } = await import('@/lib/chemistry/nmrdb');
        const nmrdbResult = await fetchNMRFromNmrdb(smilesForNmrdb);
        if (nmrdbResult && (nmrdbResult.protonPeaks.length > 0 || nmrdbResult.carbonPeaks.length > 0)) {
          setPeaks({
            '1H': nmrdbResult.protonPeaks,
            '13C': nmrdbResult.carbonPeaks,
            '15N': [], '31P': [], '19F': [],
          });
          setLoading(false);
          return;
        }
      }

      // 3. Fall back to nmr-predictor (¹H, ¹³C only)
      setLoadingPhase('loading-db');
      const { preloadNmrPredictor, getNmrPreloadPromise } = await import('@/lib/nmr/preloadNmrPredictor');
      preloadNmrPredictor();
      const preload = getNmrPreloadPromise();
      if (preload) await preload;
      const { fetchProton, fetchCarbon, proton, carbon } = await import('nmr-predictor');
      if (!dbReady) {
        await Promise.all([fetchProton(), fetchCarbon()]);
        setDbReady(true);
      }
      setLoadingPhase('predicting');
      const runProton = async (): Promise<PredictedPeak[]> => {
        try {
          const result = proton(input, { use: 'median', ignoreLabile: false });
          return Array.isArray(result) ? (result as PredictedPeak[]) : [];
        } catch (e) {
          console.warn('[NMR] Proton prediction failed:', e);
          return [];
        }
      };
      const runCarbon = async (): Promise<PredictedPeak[]> => {
        try {
          const result = carbon(input, { use: 'median' });
          return Array.isArray(result) ? (result as PredictedPeak[]) : [];
        } catch (e) {
          console.warn('[NMR] Carbon prediction failed:', e);
          return [];
        }
      };
      const [protonResult, carbonResult] = await Promise.all([runProton(), runCarbon()]);
      setPeaks({
        '1H': protonResult,
        '13C': carbonResult,
        '15N': [], '31P': [], '19F': [],
      });
    } catch (err) {
      console.error('[NMRPrediction] Error:', err);
      setError(err instanceof Error ? err.message : 'NMR prediction failed');
    } finally {
      setLoading(false);
    }
  }, [smiles, molfile, dbReady, aiContext]);

  /** AI-only retry when nmrdb/nmr-predictor returned 0. Does not fall through to other backends. */
  const runAIONlyPrediction = useCallback(async () => {
    if (!smiles && !molfile) {
      setError('No structure to predict');
      return;
    }
    let smilesForAI = (smiles ?? '').trim();
    if (!smilesForAI && molfile) {
      const { molfileToSmiles } = await import('@/lib/chemistry/openchemlib');
      smilesForAI = molfileToSmiles(molfile) ?? '';
    }
    const { prepareSmilesForAI } = await import('@/lib/openai/chemistry');
    const smiForAI = prepareSmilesForAI(smilesForAI, 500);
    if (!smiForAI) {
      setError('No valid SMILES for AI prediction');
      return;
    }
    setLoading(true);
    setLoadingPhase('openai');
    setError(null);
    setExplainText(null);
    setExplainError(null);
    try {
      const { chatWithOpenAI } = await import('@/lib/openai');
      const userMsg = `Predict ALL NMR chemical shifts for SMILES: ${smiForAI}. This will be reviewed by PhD chemists—provide accurate, literature-typical values. List every ¹H and ¹³C signal. If the molecule contains N, P, or F, also list ¹⁵N, ³¹P, or ¹⁹F. One signal per line. Do not omit any signals.`;
      const content = await chatWithOpenAI([
        {
          role: 'system',
          content: 'You are an expert organic chemist. Predict NMR chemical shifts from SMILES. Your output will be used by PhD chemists and must be ACCURATE and COMPLETE. Use literature-typical chemical shift values (e.g. aliphatic CH3 ~0.9–1.3, aromatic ~7–8, carbonyl C ~170–220 ppm). List EVERY chemically distinct signal. Format: 1H: δ X.XX ppm (nH), 13C: δ X.XX ppm (nC), 15N: δ X.XX ppm (nN), 31P: δ X.XX ppm (nP), 19F: δ X.XX ppm (nF). Include all ¹H and ¹³C signals. Include ¹⁵N, ³¹P, ¹⁹F only if the molecule contains N, P, or F. Be precise: equivalent nuclei share one signal with correct multiplicity count. Reply with ONLY the signals, one per line. No other text.',
        },
        {
          role: 'user',
          content: appendUserContext(userMsg, aiContext),
        },
      ]);
      const aiResult = parseAINMRResponse(content);
      setPeaks(aiResult);
      const hasAny = Object.values(aiResult).some((arr) => arr.length > 0);
      if (!hasAny) {
        setError('AI could not extract NMR signals. Try "Recalculate" for nmrdb/nmr-predictor.');
      }
    } catch (err) {
      console.error('[NMR] AI-only prediction failed:', err);
      setError(err instanceof Error ? err.message : 'AI NMR prediction failed');
    } finally {
      setLoading(false);
    }
  }, [smiles, molfile, aiContext]);

  useEffect(() => {
    if (open && (smiles || molfile)) {
      runPrediction();
    }
  }, [open, smiles, molfile]);

  const nucleusGroups: Record<NucleusKey, { delta: number; count: number; atomIDs: number[] }[]> = {
    '1H': groupPeaks(peaks['1H'], 0.05),
    '13C': groupPeaks(peaks['13C'], 0.5),
    '15N': groupPeaks(peaks['15N'], 1),
    '31P': groupPeaks(peaks['31P'], 1),
    '19F': groupPeaks(peaks['19F'], 1),
  };

  const visibleNuclei = (['1H', '13C', '15N', '31P', '19F'] as NucleusKey[]).filter(
    (n) => nucleusGroups[n].length > 0 || !loading
  );

  const handleCopyPeaks = (nucleus: NucleusKey) => {
    const groups = nucleusGroups[nucleus];
    const cfg = NUCLEUS_CONFIG[nucleus];
    const text = groups
      .map((g) => `δ ${g.delta.toFixed(2)} ppm (${g.count}${cfg.suffix})`)
      .join('\n');
    navigator.clipboard.writeText(text);
  };

  const handleExplainNMR = useCallback(async () => {
    if (!smiles && !molfile) {
      setExplainError('No structure to explain');
      return;
    }
    setExplainLoading(true);
    setExplainError(null);
    setExplainText(null);
    try {
      let smiForPrompt = (smiles ?? '').trim();
      if (!smiForPrompt && molfile) {
        try {
          const { molfileToSmiles } = await import('@/lib/chemistry/openchemlib');
          smiForPrompt = molfileToSmiles(molfile) ?? '';
          if (!smiForPrompt) {
            const { molfileToSmiles: rdkitMol } = await import('@/lib/chemistry/rdkit');
            smiForPrompt = (await rdkitMol(molfile)) ?? '';
          }
        } catch {
          /* ignore */
        }
      }
      const { prepareSmilesForAI } = await import('@/lib/openai/chemistry');
      const prepared = prepareSmilesForAI(smiForPrompt, 500);
      if (!prepared) {
        setExplainError('Could not get valid SMILES for structure');
        return;
      }
      smiForPrompt = prepared;
      const parts: string[] = [];
      for (const n of ['1H', '13C', '15N', '31P', '19F'] as NucleusKey[]) {
        const p = peaks[n];
        const gs = groupPeaks(p, NUCLEUS_CONFIG[n].tol);
        if (gs.length > 0) {
          const cfg = NUCLEUS_CONFIG[n];
          parts.push(`${cfg.label}: ${gs.map((g) => `δ ${g.delta.toFixed(2)} ppm (${g.count}${cfg.suffix})`).join(', ')}`);
        }
      }
      const signalsStr = parts.length > 0 ? parts.join('\n') : 'none';
      const explainUserMsg = `Interpret this NMR spectrum for the compound (structure: ${smiForPrompt}):\n\n${signalsStr}\n\nWrite a concise, in-app style explanation: link each signal to its structural origin, vary your phrasing, and avoid redundant justification.`;
      const { chatWithOpenAI } = await import('@/lib/openai');
      const content = await chatWithOpenAI([
        {
          role: 'system',
content: `You are an expert organic chemist writing an in-app NMR interpretation for professional chemistry software (equivalent to Mnova, ChemDraw, or ACD/Labs). Interpret spectra for all nuclei including ¹H, ¹³C, ¹⁵N, ³¹P, and ¹⁹F. Your explanations must be production-quality, accurate, concise, and based strictly on the provided structure and NMR data.

STRUCTURE-FIRST APPROACH:
The provided structure is authoritative. Parse it to count environments and verify substituent identity—do not infer structure from signals alone.
Always begin with the structure, not the molecule name. Describe the key substituents and how they create distinct chemical environments. Then connect those environments to the observed NMR signals. Only optionally confirm the molecule name in the final sentence. Never start by naming the compound.

CORE INTERPRETATION LOGIC:

1. Structure → environment → signal → confirmation.
Derive chemical environments from the structure first. Then interpret how each environment produces the observed signals. Do not rely on memorized spectral patterns.

2. Observed signals vs chemical environments:
The number of observed signals may be equal to, fewer than, or greater than the number of environments due to symmetry, overlap, or closely spaced resonances. When multiple atoms contribute to one signal, explain whether this is due to equivalent environments or overlapping signals. Do NOT assume symmetry solely from the number of signals.

3. Integration rules:
Only ¹H NMR integration reliably corresponds to proton count.
Use phrases such as:
“integrates to three protons”
“3H signal”

NEVER describe integration, atom counts, or peak intensity for:
¹³C, ¹⁵N, ³¹P, or ¹⁹F.

For these nuclei, describe only distinct signals and environments.

4. Splitting and multiplicity:
If multiplicity is provided, explain it in terms of neighboring atoms and structural connectivity. Use splitting to support assignments. If splitting is not provided, do not invent it or speculate.

5. Aromatic and conjugated systems:
Describe signals as arising from atoms in similar or distinct electronic environments.
Avoid definitive positional assignments (ortho, meta, para) unless uniquely determined.
Avoid memorized pattern phrases such as “expected pattern.”

6. Equivalence and symmetry:
Only state equivalence when supported by structural symmetry and connectivity.
Do NOT infer equivalence from signal height, formatting, or appearance.

7. Overlapping or closely spaced signals:
When signals appear grouped, explain that similar environments can produce closely spaced or overlapping resonances.
Do NOT imply fewer environments exist unless supported structurally.

8. No unsupported measurements:
Do NOT infer:
• carbon integration
• peak intensity meaning
• number of atoms from peak height
• symmetry from signal appearance alone

Only use structural logic and provided data.

9. Structure-specific interpretation only:
Base every explanation strictly on the given structure and spectrum.
Do NOT apply assumptions from unrelated molecules.

10. Alkyl chain length verification (critical):
Derive the number of aliphatic environments from the structure. Ethylbenzene has 2 (benzylic CH2, methyl CH3); n-propylbenzene has 3 (benzylic CH2, internal CH2, methyl CH3). Never invent extra environments.
Never name or describe substituent chain length (e.g. ethyl vs propyl) unless directly confirmed from the provided structure and integration totals.
Before describing alkyl chain length, verify: (a) the structure shows that chain, and (b) the total ¹H integration for the aliphatic region matches the proposed substituent (e.g. ethyl = 5H, n-propyl = 7H).
If uncertain, describe as "alkyl substituent" or "alkyl chain" without specifying length.

11. Aromatic ¹H overlap:
When fewer aromatic signals appear than aromatic proton environments, always use the word "overlap" (or "overlapping") when explaining the grouping.
Avoid implying which specific positions (ortho/meta/para) fall into which signal unless uniquely determined.

12. ¹³C aromatic assignments:
Do NOT state that specific positions (e.g. "ortho and meta overlap into one peak") unless the spectrum actually shows that pattern.
Use safer phrasing: "signals in this region correspond to the protonated aromatic carbons, which can appear close together and may overlap."
For the quaternary aromatic carbon bonded to the substituent, prefer "corresponds to the quaternary aromatic carbon bonded to the substituent" over "assigned to the quaternary ipso carbon"—avoids over-specific positional labeling.
This keeps the explanation correct whether ortho/meta are resolved or not.

STYLE AND QUALITY:

Write clear, concise, professional paragraphs suitable for production chemistry software.

Avoid:
• generic textbook explanations
• filler language
• speculative language
• internal identifiers
• atom numbering
• SMILES references

Prefer direct structural reasoning.

Use plain, professional chemical language.

Example preferred wording:
“deshielded due to direct attachment to the aromatic ring”
NOT:
“conjugation effects from the pi system”

Avoid overconfident positional assignments unless fully justified.

CONCLUSION:

End with a brief confirmation that the spectral data are consistent with the structure.

Optionally confirm the molecule name in the final sentence only.

FORMAT:

${CHEMISTRY_FORMATTING_INSTRUCTION}

Clear paragraphs only.
No bullet points.
Professional interpretation tone.
No conversational language.
No mention of AI or analysis process.`,
        },
        {
          role: 'user',
          content: appendUserContext(explainUserMsg, aiContext),
        },
      ]);
      setExplainText(content);
    } catch (err) {
      setExplainError(err instanceof Error ? err.message : 'AI explanation failed');
    } finally {
      setExplainLoading(false);
    }
  }, [smiles, molfile, peaks, aiContext]);

  useEffect(() => {
    if (open && !loading && autoExplain && !hasAutoExplainedRef.current && (smiles || molfile)) {
      hasAutoExplainedRef.current = true;
      handleExplainNMR();
    }
  }, [open, loading, autoExplain, smiles, molfile, handleExplainNMR]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          margin: '56px auto 48px', // Below top header (56px), above bottom (48px), centered
          maxHeight: 'calc(100vh - 56px - 48px)', // Fit between top and bottom headers
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 2,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)',
          border: '1px solid',
          borderColor: 'divider',
          overflow: 'hidden',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          flexShrink: 0,
          flex: '0 0 auto',
          py: 2,
          px: 3,
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: 'action.hover',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 40,
            height: 40,
            borderRadius: 1.5,
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
          }}
        >
          <ShowChartIcon sx={{ fontSize: 22 }} />
        </Box>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600, letterSpacing: '0.02em' }}>
            NMR Prediction
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: '0.04em' }}>
            ¹H, ¹³C, ¹⁵N, ³¹P, ¹⁹F
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ overflow: 'auto', display: 'flex', flexDirection: 'column', minHeight: 0, px: 3, py: 2.5 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 1.5 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        {loading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 6, gap: 2.5 }}>
            <CircularProgress size={48} thickness={4} sx={{ color: 'primary.main' }} />
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
              {loadingPhase === 'openai' && 'Asking AI for NMR prediction...'}
              {loadingPhase === 'nmrdb' && 'Querying nmrdb.org...'}
              {loadingPhase === 'loading-db' && 'Loading NMR databases (first time may take 15–30s)...'}
              {loadingPhase === 'predicting' && 'Predicting chemical shifts...'}
            </Typography>
          </Box>
        ) : (
          <Box sx={{ mt: 0.5 }}>
            <Tabs
              value={Math.min(activeTab, 4)}
              onChange={(_, v) => setActiveTab(v)}
              sx={{
                mb: 2,
                minHeight: 40,
                '& .MuiTab-root': { fontWeight: 500, fontSize: '0.8rem', textTransform: 'none' },
                '& .MuiTabs-indicator': { height: 3, borderRadius: '3px 3px 0 0' },
              }}
            >
              {(['1H', '13C', '15N', '31P', '19F'] as NucleusKey[]).map((n, i) => (
                <Tab key={n} label={`${NUCLEUS_CONFIG[n].label} (${nucleusGroups[n].length})`} />
              ))}
            </Tabs>
            {(() => {
              const nuc = (['1H', '13C', '15N', '31P', '19F'] as NucleusKey[])[activeTab] ?? '1H';
              return (
                <Stack key={nuc} spacing={1.5}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: '0.05em' }}>
                      Chemical shifts
                    </Typography>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<ContentCopyIcon sx={{ fontSize: 16 }} />}
                      onClick={() => handleCopyPeaks(nuc)}
                      disabled={nucleusGroups[nuc].length === 0}
                      sx={{ textTransform: 'none', fontSize: '0.75rem', py: 0.5 }}
                    >
                      Copy
                    </Button>
                  </Box>
                  <TableContainer
                    component={Paper}
                    variant="outlined"
                    sx={{
                      maxHeight: 220,
                      borderRadius: 1.5,
                      overflow: 'hidden',
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow sx={{ '& th': { bgcolor: 'action.hover', fontWeight: 600, fontSize: '0.75rem', letterSpacing: '0.05em', py: 1.25 } }}>
                          <TableCell>δ (ppm)</TableCell>
                          <TableCell>Count</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {nucleusGroups[nuc].map((g, i) => (
                          <TableRow
                            key={i}
                            sx={{
                              '&:hover': { bgcolor: 'action.hover' },
                              '&:last-child td': { borderBottom: 0 },
                            }}
                          >
                            <TableCell sx={{ fontFamily: '"JetBrains Mono", "Fira Code", monospace', fontSize: '0.875rem', fontWeight: 500 }}>
                              {g.delta.toFixed(2)}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={`${g.count}${NUCLEUS_CONFIG[nuc].suffix}`}
                                size="small"
                                sx={{ fontWeight: 600, fontSize: '0.7rem' }}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                        {nucleusGroups[nuc].length === 0 && !loading && (
                          <TableRow>
                            <TableCell colSpan={2} align="center" sx={{ py: 3 }}>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                                No {NUCLEUS_CONFIG[nuc].label} signals
                              </Typography>
                              <Button size="small" variant="outlined" onClick={runAIONlyPrediction} startIcon={<PsychologyIcon />} sx={{ textTransform: 'none' }}>
                                Ask AI for NMR
                              </Button>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Stack>
              );
            })()}
            <Box ref={explainSectionRef} sx={{ minHeight: explainText || explainError ? undefined : 0, mt: 2 }}>
              {explainError && (
                <Alert severity="error" sx={{ borderRadius: 1.5 }} onClose={() => setExplainError(null)}>
                  {explainError}
                </Alert>
              )}
              {explainText && (
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    borderRadius: 1.5,
                    bgcolor: 'action.hover',
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5, pb: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 0.75, fontWeight: 600 }}>
                      <PsychologyIcon fontSize="small" color="primary" />
                      AI Explanation
                    </Typography>
                    <Button
                      size="small"
                      variant="text"
                      startIcon={<ContentCopyIcon sx={{ fontSize: 14 }} />}
                      onClick={() => navigator.clipboard.writeText(formatChemistryText(explainText))}
                      sx={{ minWidth: 0, px: 1, fontSize: '0.75rem', textTransform: 'none' }}
                    >
                      Copy
                    </Button>
                  </Box>
                  <Typography
                    variant="body2"
                    sx={{
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      lineHeight: 1.6,
                      fontSize: '0.8125rem',
                    }}
                  >
                    {formatChemistryText(explainText)}
                  </Typography>
                </Paper>
              )}
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions
        sx={{
          flexShrink: 0,
          flex: '0 0 auto',
          px: 3,
          py: 2,
          gap: 1,
          borderTop: '1px solid',
          borderColor: 'divider',
          bgcolor: 'action.hover',
        }}
      >
        <Button onClick={onClose} sx={{ textTransform: 'none', fontWeight: 500 }}>
          Close
        </Button>
        <Box sx={{ flex: 1 }} />
        {!loading && (smiles || molfile) && (
          <>
            <Button
              onClick={handleExplainNMR}
              variant="outlined"
              disabled={explainLoading}
              startIcon={explainLoading ? <CircularProgress size={16} /> : <PsychologyIcon />}
              sx={{ textTransform: 'none', fontWeight: 500 }}
            >
              {explainLoading ? 'Explaining...' : 'Explain with AI'}
            </Button>
            <Button onClick={runPrediction} variant="contained" sx={{ textTransform: 'none', fontWeight: 600 }}>
              Recalculate
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default NMRPredictionDialog;
