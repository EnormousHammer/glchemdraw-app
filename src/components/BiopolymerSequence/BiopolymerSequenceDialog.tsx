/**
 * BiopolymerSequenceDialog - Sequence input for peptides/DNA/RNA
 * Workaround when Ketcher's changeSequenceTypeEnterMode is not available.
 * Tries setMolecule with HELM format for peptides.
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Tabs,
  Tab,
  Alert,
  Stack,
} from '@mui/material';
import BiotechIcon from '@mui/icons-material/Biotech';

interface BiopolymerSequenceDialogProps {
  open: boolean;
  onClose: () => void;
  initialMode?: 'PEPTIDE' | 'DNA' | 'RNA';
  onSubmit: (sequence: string, mode: 'PEPTIDE' | 'DNA' | 'RNA') => Promise<{ success: boolean; error?: string }>;
}

const PEPTIDE_HELP = 'Single-letter codes: A=Ala, C=Cys, D=Asp, E=Glu, F=Phe, G=Gly, H=His, I=Ile, K=Lys, L=Leu, M=Met, N=Asn, P=Pro, Q=Gln, R=Arg, S=Ser, T=Thr, V=Val, W=Trp, Y=Tyr. Example: MVDG';
const DNA_HELP = 'Single-letter codes: A, T, G, C. Example: ATGCATGC';
const RNA_HELP = 'Single-letter codes: A, U, G, C. Example: AUGCAUGC';

export const BiopolymerSequenceDialog: React.FC<BiopolymerSequenceDialogProps> = ({
  open,
  onClose,
  initialMode = 'PEPTIDE',
  onSubmit,
}) => {
  const [sequence, setSequence] = useState('');
  const [mode, setMode] = useState<'PEPTIDE' | 'DNA' | 'RNA'>(initialMode);

  React.useEffect(() => {
    if (open) setMode(initialMode);
  }, [open, initialMode]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    const seq = sequence.trim().toUpperCase();
    if (!seq) {
      setError('Enter a sequence');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await onSubmit(seq, mode);
      if (result.success) {
        onClose();
        setSequence('');
      } else {
        setError(result.error || 'Failed to create structure');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const getHelp = () => {
    if (mode === 'PEPTIDE') return PEPTIDE_HELP;
    if (mode === 'DNA') return DNA_HELP;
    return RNA_HELP;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <BiotechIcon color="primary" />
        Biopolymer Sequence Input
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Ketcher&apos;s built-in macromolecule mode may not be available. Enter a sequence below to try HELM format import.
        </Typography>
        <Tabs value={mode} onChange={(_, v: 'PEPTIDE' | 'DNA' | 'RNA') => { setMode(v); setError(null); }} sx={{ mb: 2 }}>
          <Tab value="PEPTIDE" label="Peptide" />
          <Tab value="DNA" label="DNA" />
          <Tab value="RNA" label="RNA" />
        </Tabs>
        <Stack spacing={2}>
          <TextField
            label="Sequence"
            placeholder={mode === 'PEPTIDE' ? 'e.g. MVDG' : mode === 'DNA' ? 'e.g. ATGCATGC' : 'e.g. AUGCAUGC'}
            value={sequence}
            onChange={(e) => setSequence(e.target.value)}
            fullWidth
            autoFocus
            helperText={getHelp()}
            inputProps={{ style: { fontFamily: 'monospace', fontSize: '1.1rem' } }}
          />
          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading || !sequence.trim()}>
          {loading ? 'Creating...' : 'Create Structure'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BiopolymerSequenceDialog;
