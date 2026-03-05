/**
 * Batch Export - Paste multiple SMILES, get properties table, export as CSV
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
import DownloadIcon from '@mui/icons-material/Download';

interface BatchExportDialogProps {
  open: boolean;
  onClose: () => void;
}

interface RowData {
  smiles: string;
  name?: string;
  formula?: string;
  mw?: number;
  logP?: number;
  cid?: number;
  error?: string;
}

export const BatchExportDialog: React.FC<BatchExportDialogProps> = ({ open, onClose }) => {
  const [input, setInput] = useState('');
  const [results, setResults] = useState<RowData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runBatch = useCallback(async () => {
    const lines = input.split(/\n/).map((s) => s.trim()).filter((s) => s && !s.startsWith('#'));
    if (lines.length === 0) {
      setError('Paste SMILES (one per line)');
      return;
    }
    setLoading(true);
    setError(null);
    setResults([]);

    try {
      const { getCIDBySMILES, getPropertiesByCID } = await import('@/lib/pubchem/api');
      const rows: RowData[] = [];
      for (const smi of lines) {
        const firstSmi = smi.includes('.') ? smi.split(/\s*\.\s*/)[0] || smi : smi;
        try {
          const { getCIDBySMILES: getCidBySmiles } = await import('@/lib/pubchem/api');
          const cid = await getCIDBySMILES(firstSmi);
          if (cid) {
            const props = await getPropertiesByCID(cid, ['MolecularFormula', 'MolecularWeight', 'IUPACName', 'XLogP']);
            rows.push({
              smiles: firstSmi,
              name: props?.IUPACName,
              formula: props?.MolecularFormula,
              mw: props?.MolecularWeight,
              logP: props?.XLogP,
              cid,
            });
          } else {
            rows.push({ smiles: firstSmi, error: 'Not in PubChem' });
          }
        } catch (e) {
          rows.push({ smiles: firstSmi, error: e instanceof Error ? e.message : 'Failed' });
        }
      }
      setResults(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Batch export failed');
    } finally {
      setLoading(false);
    }
  }, [input]);

  const exportCSV = useCallback(() => {
    if (results.length === 0) return;
    const headers = ['SMILES', 'Name', 'Formula', 'MW', 'LogP', 'CID'];
    const lines = [headers.join(',')];
    for (const r of results) {
      const row = [
        `"${(r.smiles || '').replace(/"/g, '""')}"`,
        `"${(r.name || '').replace(/"/g, '""')}"`,
        r.formula || '',
        r.mw ?? '',
        r.logP ?? '',
        r.cid ?? '',
      ];
      lines.push(row.join(','));
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `batch-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [results]);

  const handleClose = () => {
    setInput('');
    setResults([]);
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Batch Export (CSV)</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Paste SMILES (one per line). Fetches PubChem data and exports as CSV.
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
            <Typography variant="body2">Fetching PubChem data…</Typography>
          </Box>
        )}
        {results.length > 0 && (
          <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 280 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>SMILES</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Formula</TableCell>
                  <TableCell align="right">MW</TableCell>
                  <TableCell align="right">LogP</TableCell>
                  <TableCell align="right">CID</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {results.map((r, i) => (
                  <TableRow key={i}>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.7rem' }}>{r.smiles}</TableCell>
                    <TableCell sx={{ fontSize: '0.75rem', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis' }} title={r.name}>{r.name || r.error || '—'}</TableCell>
                    <TableCell>{r.formula || '—'}</TableCell>
                    <TableCell align="right">{r.mw ?? '—'}</TableCell>
                    <TableCell align="right">{r.logP ?? '—'}</TableCell>
                    <TableCell align="right">{r.cid ?? '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Close</Button>
        <Button variant="outlined" onClick={runBatch} disabled={loading}>
          Fetch data
        </Button>
        <Button variant="contained" onClick={exportCSV} disabled={results.length === 0} startIcon={<DownloadIcon />}>
          Export CSV
        </Button>
      </DialogActions>
    </Dialog>
  );
};
