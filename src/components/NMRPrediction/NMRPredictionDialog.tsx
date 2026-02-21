/**
 * NMRPredictionDialog - 1H and 13C NMR prediction
 * Uses nmrdb.org (NMRShiftDB, larger database) when proxy is available,
 * falls back to nmr-predictor (HOSE) otherwise.
 */

import React, { useState, useEffect, useCallback } from 'react';
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

// Group peaks by similar chemical shift (within 0.05 ppm for 1H, 0.5 for 13C)
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
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [protonPeaks, setProtonPeaks] = useState<PredictedPeak[]>([]);
  const [carbonPeaks, setCarbonPeaks] = useState<PredictedPeak[]>([]);
  const [dbReady, setDbReady] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

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
    // Get SMILES for nmrdb (convert molfile if needed)
    let smilesForNmrdb = input.includes('\n') ? null : input;
    if (!smilesForNmrdb && molfile) {
      const { molfileToSmiles } = await import('@/lib/chemistry/openchemlib');
      smilesForNmrdb = molfileToSmiles(molfile);
    }

    setLoading(true);
    setError(null);
    setProtonPeaks([]);
    setCarbonPeaks([]);

    try {
      // 1. Try nmrdb.org first (larger NMRShiftDB database, better ¹H coverage)
      if (smilesForNmrdb) {
        const { fetchNMRFromNmrdb } = await import('@/lib/chemistry/nmrdb');
        const nmrdbResult = await fetchNMRFromNmrdb(smilesForNmrdb);
        if (nmrdbResult && (nmrdbResult.protonPeaks.length > 0 || nmrdbResult.carbonPeaks.length > 0)) {
          setProtonPeaks(nmrdbResult.protonPeaks);
          setCarbonPeaks(nmrdbResult.carbonPeaks);
          setLoading(false);
          return;
        }
      }

      // 2. Fall back to nmr-predictor (HOSE)
      const { fetchProton, fetchCarbon, proton, carbon } = await import('nmr-predictor');
      if (!dbReady) {
        await Promise.all([fetchProton(), fetchCarbon()]);
        setDbReady(true);
      }
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
      setProtonPeaks(protonResult);
      setCarbonPeaks(carbonResult);
    } catch (err) {
      console.error('[NMRPrediction] Error:', err);
      setError(err instanceof Error ? err.message : 'NMR prediction failed');
    } finally {
      setLoading(false);
    }
  }, [smiles, molfile, dbReady]);

  useEffect(() => {
    if (open && (smiles || molfile)) {
      runPrediction();
    }
  }, [open, smiles, molfile]);

  const handleCopyPeaks = (nucleus: '1H' | '13C') => {
    const peaks = nucleus === '1H' ? protonPeaks : carbonPeaks;
    const groups = groupPeaks(peaks, nucleus === '1H' ? 0.05 : 0.5);
    const text = groups
      .map((g) => nucleus === '1H' ? `δ ${g.delta.toFixed(2)} ppm (${g.count}H)` : `δ ${g.delta.toFixed(2)} ppm (${g.count}C)`)
      .join('\n');
    navigator.clipboard.writeText(text);
  };

  const protonGroups = groupPeaks(protonPeaks, 0.05);
  const carbonGroups = groupPeaks(carbonPeaks, 0.5);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <ShowChartIcon color="primary" />
        NMR Prediction (¹H & ¹³C)
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
            <Typography color="text.secondary">Predicting chemical shifts...</Typography>
          </Box>
        ) : (
          <Box sx={{ mt: 1 }}>
            <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 2 }}>
              <Tab label={`¹H NMR (${protonGroups.length} signals)`} />
              <Tab label={`¹³C NMR (${carbonGroups.length} signals)`} />
            </Tabs>
            {activeTab === 0 && (
              <Stack spacing={1}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    size="small"
                    startIcon={<ContentCopyIcon />}
                    onClick={() => handleCopyPeaks('1H')}
                    disabled={protonGroups.length === 0}
                  >
                    Copy
                  </Button>
                </Box>
                <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 280 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>δ (ppm)</strong></TableCell>
                        <TableCell><strong>Integral</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {protonGroups.map((g, i) => (
                        <TableRow key={i}>
                          <TableCell sx={{ fontFamily: 'monospace' }}>
                            {g.delta.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Chip label={`${g.count}H`} size="small" />
                          </TableCell>
                        </TableRow>
                      ))}
                      {protonGroups.length === 0 && !loading && (
                        <TableRow>
                          <TableCell colSpan={2} align="center" color="text.secondary">
                            No ¹H signals predicted (try running npm run dev:proxy for nmrdb.org backend)
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Stack>
            )}
            {activeTab === 1 && (
              <Stack spacing={1}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    size="small"
                    startIcon={<ContentCopyIcon />}
                    onClick={() => handleCopyPeaks('13C')}
                    disabled={carbonGroups.length === 0}
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
                      {carbonGroups.map((g, i) => (
                        <TableRow key={i}>
                          <TableCell sx={{ fontFamily: 'monospace' }}>
                            {g.delta.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Chip label={`${g.count}C`} size="small" />
                          </TableCell>
                        </TableRow>
                      ))}
                      {carbonGroups.length === 0 && !loading && (
                        <TableRow>
                          <TableCell colSpan={2} align="center" color="text.secondary">
                            No ¹³C signals predicted
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Stack>
            )}
            <Alert severity="info" sx={{ mt: 2 }} variant="outlined">
              <Typography variant="caption" component="div">
                <strong>Backend:</strong> Uses nmrdb.org (NMRShiftDB) when proxy is running (npm run dev:proxy); otherwise nmr-predictor. ¹H coverage is better with nmrdb. Not suitable as sole verification for PhD-level custom synthesis — use alongside experimental data or dedicated NMR software.
              </Typography>
            </Alert>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        {!loading && (smiles || molfile) && (
          <Button onClick={runPrediction} variant="outlined">
            Recalculate
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default NMRPredictionDialog;
