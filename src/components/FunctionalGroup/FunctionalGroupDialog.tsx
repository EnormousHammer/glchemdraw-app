/**
 * FunctionalGroupDialog - AI-powered functional group insertion
 * Replaces Ketcher's broken FG feature with addFragment using AI/lookup
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  CircularProgress,
  Chip,
  Stack,
} from '@mui/material';
import PsychologyIcon from '@mui/icons-material/Psychology';

const COMMON_FGS = ['OMe', 'OEt', 'CN', 'OH', 'NH2', 'COOH', 'Ac', 'Ph', 'Bn', 'SH', 'F', 'Cl', 'Br', 'NO2', 'CF3'];

interface FunctionalGroupDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (smiles: string) => Promise<void>;
}

export const FunctionalGroupDialog: React.FC<FunctionalGroupDialogProps> = ({
  open,
  onClose,
  onAdd,
}) => {
  const [customInput, setCustomInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAdd = async (fg: string) => {
    setError(null);
    setLoading(true);
    try {
      const { aiFunctionalGroupToSmiles } = await import('@/lib/openai/chemistry');
      const smiles = await aiFunctionalGroupToSmiles(fg);
      if (!smiles) {
        setError(`Could not get SMILES for "${fg}"`);
        return;
      }
      await onAdd(smiles);
      onClose();
      setCustomInput('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add functional group');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomSubmit = () => {
    const trimmed = customInput.trim();
    if (trimmed) handleAdd(trimmed);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ 'data-glchemdraw-dialog': 'functional-group' }}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <PsychologyIcon color="primary" />
        Add Functional Group (AI)
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Select a common group or enter a custom name. The fragment will be added to the canvas.
        </Typography>
        <Stack spacing={2}>
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 1 }}>
              Common groups
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {COMMON_FGS.map((fg) => (
                <Chip
                  key={fg}
                  label={fg}
                  size="small"
                  onClick={() => handleAdd(fg)}
                  disabled={loading}
                  sx={{ cursor: 'pointer' }}
                />
              ))}
            </Box>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 1 }}>
              Custom (e.g. cyclopropyl, tert-butyl)
            </Typography>
            <TextField
              size="small"
              fullWidth
              placeholder="Enter FG name"
              value={customInput}
              onChange={(e) => { setCustomInput(e.target.value); setError(null); }}
              onKeyDown={(e) => e.key === 'Enter' && handleCustomSubmit()}
              disabled={loading}
            />
          </Box>
          {error && (
            <Typography variant="body2" color="error">
              {error}
            </Typography>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleCustomSubmit}
          disabled={!customInput.trim() || loading}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
        >
          Add
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FunctionalGroupDialog;
