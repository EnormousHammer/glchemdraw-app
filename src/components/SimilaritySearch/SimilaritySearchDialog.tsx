/**
 * Similarity Search Dialog - Search PubChem by structure
 */

import React from 'react';
import { Dialog, DialogTitle, DialogContent } from '@mui/material';
import { SimilaritySearch } from './SimilaritySearch';

interface SimilaritySearchDialogProps {
  open: boolean;
  onClose: () => void;
  smiles: string | null;
  onCompoundSelect?: (cid: number, smiles: string, name: string) => void;
}

export const SimilaritySearchDialog: React.FC<SimilaritySearchDialogProps> = ({
  open,
  onClose,
  smiles,
  onCompoundSelect,
}) => (
  <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
    <DialogTitle>Search by structure</DialogTitle>
    <DialogContent>
      <SimilaritySearch
        smiles={smiles ?? undefined}
        onCompoundSelect={(cid, smi, name) => {
          onCompoundSelect?.(cid, smi, name);
          onClose();
        }}
      />
    </DialogContent>
  </Dialog>
);
