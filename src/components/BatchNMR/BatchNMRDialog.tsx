/**
 * Batch NMR - Paste multiple SMILES, get ¹H/¹³C predictions in a table
 * Uses nmrdb.org (browser-compatible via proxy). Falls back to nmr-predictor when nmrdb unavailable.
 */

import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
} from '@mui/material';

interface BatchNMRDialogProps {
  open: boolean;
  onClose: () => void;
}

interface RowResult {
  smiles: string;
  h1Count: number;
  c13Count: number;
  h1Summary: string;
  c13Summary: string;
  error?: string;
}

function formatProtonPeaks(peaks: Array<{ delta: number | null; nbAtoms?: number }>): string {
  return peaks
    .map((p) => `${typeof p.delta === 'number' ? p.delta.toFixed(2) : '?'} (${p.nbAtoms || 1}H)`)
    .join(', ');
}

function formatCarbonPeaks(peaks: Array<{ delta: number | null; nbAtoms?: number }>): string {
  return peaks
    .map((p) => `${typeof p.delta === 'number' ? p.delta.toFixed(2) : '?'} (${p.nbAtoms || 1}C)`)
    .join(', ');
}

export const BatchNMRDialog: React.FC<BatchNMRDialogProps> = ({ open, onClose }) => {
  const [input, setInput] = useState('');
  const [results, setResults] = useState<RowResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number; smiles: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runBatch = useCallback(async () => {
    const lines = input
      .split(/\n/)
      .map((s) => s.trim())
      .filter((s) => s && !s.startsWith('#'));
    if (lines.length === 0) {
      setError('Paste SMILES (one per line)');
      return;
    }
    setLoading(true);
    setError(null);
    setResults([]);
    setProgress(null);

    try {
      const { fetchNMRFromNmrdb } = await import('@/lib/chemistry/nmrdb');
      const rows: RowResult[] = [];

      for (let i = 0; i < lines.length; i++) {
        const smi = lines[i];
        const firstSmi = smi.includes('.') ? smi.split(/\s*\.\s*/)[0] || smi : smi;
        setProgress({ current: i + 1, total: lines.length, smiles: firstSmi.length > 20 ? firstSmi.slice(0, 17) + '...' : firstSmi });
        try {
          // Primary: nmrdb.org (works in browser via proxy)
          const nmrdbResult = await fetchNMRFromNmrdb(firstSmi);
          if (nmrdbResult && (nmrdbResult.protonPeaks.length > 0 || nmrdbResult.carbonPeaks.length > 0)) {
            const h1Summary = formatProtonPeaks(nmrdbResult.protonPeaks);
            const c13Summary = formatCarbonPeaks(nmrdbResult.carbonPeaks);
            rows.push({
              smiles: firstSmi.length > 40 ? firstSmi.slice(0, 37) + '...' : firstSmi,
              h1Count: nmrdbResult.protonPeaks.length,
              c13Count: nmrdbResult.carbonPeaks.length,
              h1Summary: h1Summary || '—',
              c13Summary: c13Summary || '—',
            });
            continue;
          }

          // Fallback: nmr-predictor (may fail in browser due to CORS)
          let h1Arr: any[] = [];
          let c13Arr: any[] = [];
          try {
            const { fetchProton, fetchCarbon, proton, carbon } = await import('nmr-predictor');
            await Promise.all([fetchProton(), fetchCarbon()]);
            const [h1, c13] = await Promise.all([
              proton(firstSmi, { use: 'median', ignoreLabile: false }).catch(() => []),
              carbon(firstSmi, { use: 'median' }).catch(() => []),
            ]);
            h1Arr = Array.isArray(h1) ? h1 : [];
            c13Arr = Array.isArray(c13) ? c13 : [];
          } catch (_) {
            /* nmr-predictor failed (e.g. CORS in browser) */
          }
          const h1Summary = h1Arr.map((p: any) => `${typeof p.delta === 'number' ? p.delta.toFixed(2) : '?'} (${p.nbAtoms || 1}H)`).join(', ');
          const c13Summary = c13Arr.map((p: any) => `${typeof p.delta === 'number' ? p.delta.toFixed(2) : '?'} (${p.nbAtoms || 1}C)`).join(', ');
          rows.push({
            smiles: firstSmi.length > 40 ? firstSmi.slice(0, 37) + '...' : firstSmi,
            h1Count: h1Arr.length,
            c13Count: c13Arr.length,
            h1Summary: h1Summary || '—',
            c13Summary: c13Summary || '—',
          });
        } catch (e) {
          rows.push({
            smiles: firstSmi.length > 40 ? firstSmi.slice(0, 37) + '...' : firstSmi,
            h1Count: 0,
            c13Count: 0,
            h1Summary: '—',
            c13Summary: '—',
            error: e instanceof Error ? e.message : 'Failed',
          });
        }
      }
      setResults(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Batch NMR failed');
    } finally {
      setLoading(false);
      setProgress(null);
    }
  }, [input]);

  const handleClose = () => {
    setInput('');
    setResults([]);
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Batch NMR Prediction</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Paste SMILES (one per line). Uses nmrdb.org for ¹H and ¹³C (run <code>npm run dev:proxy</code> for best results).
        </Typography>
        <TextField
          fullWidth
          multiline
          rows={4}
          placeholder={'CCO\nc1ccccc1\nCC(=O)O'}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          sx={{ mb: 2 }}
        />
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        {loading && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <CircularProgress size={20} />
            <Typography variant="body2">
              {progress ? `Predicting ${progress.smiles}… ${progress.current}/${progress.total}` : 'Predicting…'}
            </Typography>
          </Box>
        )}
        {results.length > 0 && (
          <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 320 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>SMILES</TableCell>
                  <TableCell align="center">¹H</TableCell>
                  <TableCell align="center">¹³C</TableCell>
                  <TableCell>¹H signals</TableCell>
                  <TableCell>¹³C signals</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {results.map((r, i) => (
                  <TableRow key={i}>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.7rem' }}>{r.smiles}</TableCell>
                    <TableCell align="center">{r.h1Count}</TableCell>
                    <TableCell align="center">{r.c13Count}</TableCell>
                    <TableCell sx={{ fontSize: '0.7rem', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis' }} title={r.h1Summary}>
                      {r.h1Summary}
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.7rem', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis' }} title={r.c13Summary}>
                      {r.c13Summary}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Close</Button>
        <Button variant="contained" onClick={runBatch} disabled={loading}>
          Run batch
        </Button>
      </DialogActions>
    </Dialog>
  );
};
