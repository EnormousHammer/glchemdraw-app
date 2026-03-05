/**
 * Batch NMR - Paste multiple SMILES, get ¹H/¹³C predictions in a table
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

export const BatchNMRDialog: React.FC<BatchNMRDialogProps> = ({ open, onClose }) => {
  const [input, setInput] = useState('');
  const [results, setResults] = useState<RowResult[]>([]);
  const [loading, setLoading] = useState(false);
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

    try {
      const { fetchProton, fetchCarbon, proton, carbon } = await import('nmr-predictor');
      await Promise.all([fetchProton(), fetchCarbon()]);

      const rows: RowResult[] = [];
      for (const smi of lines) {
        const firstSmi = smi.includes('.') ? smi.split(/\s*\.\s*/)[0] || smi : smi;
        try {
          const [h1, c13] = await Promise.all([
            proton(firstSmi, { use: 'median', ignoreLabile: false }).catch(() => []),
            carbon(firstSmi, { use: 'median' }).catch(() => []),
          ]);
          const h1Arr = Array.isArray(h1) ? h1 : [];
          const c13Arr = Array.isArray(c13) ? c13 : [];
          const h1Summary = h1Arr
            .map((p: any) => `${typeof p.delta === 'number' ? p.delta.toFixed(2) : '?'} (${p.nbAtoms || 1}H)`)
            .join(', ');
          const c13Summary = c13Arr
            .map((p: any) => `${typeof p.delta === 'number' ? p.delta.toFixed(2) : '?'} (${p.nbAtoms || 1}C)`)
            .join(', ');
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
          Paste SMILES (one per line). Uses nmr-predictor for ¹H and ¹³C.
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
            <Typography variant="body2">Predicting…</Typography>
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
