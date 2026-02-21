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

interface NMRPredictionDialogProps {
  open: boolean;
  onClose: () => void;
  smiles: string | null;
  molfile?: string | null;
}

interface PredictedPeak {
  delta: number | null;
  atomIDs: number[];
  atomLabel: string;
  std?: number;
  min?: number;
  max?: number;
  nbAtoms: number;
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
  ], content);
  addAllNucleusPeaks('13C', [
    /(?:13C|carbon|¹³C)[:\s]*(?:δ\s*)?([-\d.]+)\s*(?:ppm\s*)?\((\d*)C\)/i,
    /(?:δ\s*)?([-\d.]+)\s*ppm\s*\((\d*)C\)/i,
    /(?:δ\s*)?([-\d.]+)\s*\((\d*)C\)/i,
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
      const explainUserMsg = `Explain these predicted NMR signals for the compound with SMILES: ${smiForPrompt}\n\n${signalsStr}\n\nProvide a detailed, factual explanation of what functional groups or chemical environments cause each of these chemical shifts.`;
      const { chatWithOpenAI } = await import('@/lib/openai');
      const content = await chatWithOpenAI([
        {
          role: 'system',
          content: 'You are an expert organic chemist and NMR spectroscopist. Give detailed, factual, educational explanations of NMR spectra. Use real chemical shift values and reference typical ranges. Explain the structural reasons for each signal. Be thorough and cite well-established NMR principles. Cover ¹H, ¹³C, and any ¹⁵N, ³¹P, ¹⁹F if present.',
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
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <ShowChartIcon color="primary" />
        NMR Prediction (¹H, ¹³C, ¹⁵N, ³¹P, ¹⁹F)
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        {loading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4, gap: 2 }}>
            <CircularProgress />
            <Typography color="text.secondary">
              {loadingPhase === 'openai' && 'Asking AI for NMR prediction...'}
              {loadingPhase === 'nmrdb' && 'Trying nmrdb.org...'}
              {loadingPhase === 'loading-db' && 'Loading NMR databases (first time may take 15–30s)...'}
              {loadingPhase === 'predicting' && 'Predicting chemical shifts...'}
            </Typography>
          </Box>
        ) : (
          <Box sx={{ mt: 1 }}>
            <Tabs value={Math.min(activeTab, 4)} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 2 }}>
              {(['1H', '13C', '15N', '31P', '19F'] as NucleusKey[]).map((n, i) => (
                <Tab key={n} label={`${NUCLEUS_CONFIG[n].label} (${nucleusGroups[n].length})`} />
              ))}
            </Tabs>
            {(() => {
              const nuc = (['1H', '13C', '15N', '31P', '19F'] as NucleusKey[])[activeTab] ?? '1H';
              return (
                <Stack key={nuc} spacing={1}>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      size="small"
                      startIcon={<ContentCopyIcon />}
                      onClick={() => handleCopyPeaks(nuc)}
                      disabled={nucleusGroups[nuc].length === 0}
                    >
                      Copy
                    </Button>
                  </Box>
                  <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 280 }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell><strong>δ (ppm)</strong></TableCell>
                          <TableCell><strong>Count</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {nucleusGroups[nuc].map((g, i) => (
                          <TableRow key={i}>
                            <TableCell sx={{ fontFamily: 'monospace' }}>{g.delta.toFixed(2)}</TableCell>
                            <TableCell>
                              <Chip label={`${g.count}${NUCLEUS_CONFIG[nuc].suffix}`} size="small" />
                            </TableCell>
                          </TableRow>
                        ))}
                        {nucleusGroups[nuc].length === 0 && !loading && (
                          <TableRow>
                            <TableCell colSpan={2} align="center" sx={{ py: 2 }}>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                No {NUCLEUS_CONFIG[nuc].label} signals
                              </Typography>
                              <Button size="small" variant="outlined" onClick={runPrediction} startIcon={<PsychologyIcon />}>
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
            <Alert severity="info" sx={{ mt: 2 }} variant="outlined">
              <Typography variant="caption" component="div">
                <strong>NMR:</strong> AI (OpenAI) first; falls back to nmrdb.org or nmr-predictor. Use AI for missing info — run <em>npm run dev:proxy</em> for OpenAI. Not suitable as sole verification for PhD-level synthesis.
              </Typography>
            </Alert>
            <Box ref={explainSectionRef} sx={{ minHeight: explainText || explainError ? undefined : 0 }}>
              {explainError && (
                <Alert severity="error" sx={{ mt: 2 }} onClose={() => setExplainError(null)}>
                  {explainError}
                </Alert>
              )}
              {explainText && (
                <Paper variant="outlined" sx={{ mt: 2, p: 2, bgcolor: 'action.hover' }}>
                  <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <PsychologyIcon fontSize="small" color="primary" />
                    AI Explanation
                  </Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {explainText}
                  </Typography>
                </Paper>
              )}
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        {!loading && (smiles || molfile) && (
          <>
            <Button
              onClick={handleExplainNMR}
              variant="outlined"
              disabled={explainLoading}
              startIcon={explainLoading ? <CircularProgress size={16} /> : <PsychologyIcon />}
            >
              {explainLoading ? 'Explaining...' : 'Explain with AI'}
            </Button>
            <Button onClick={runPrediction} variant="outlined">
              Recalculate
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default NMRPredictionDialog;
