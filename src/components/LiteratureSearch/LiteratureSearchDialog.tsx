/**
 * Literature Search - Find papers mentioning this structure (PubChem)
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
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Alert,
  Link,
} from '@mui/material';
import { searchLiterature, type LiteratureReference, type PatentReference } from '@/lib/pubchem/literature';

interface LiteratureSearchDialogProps {
  open: boolean;
  onClose: () => void;
  cid: number | null;
  compoundName?: string;
}

export const LiteratureSearchDialog: React.FC<LiteratureSearchDialogProps> = ({
  open,
  onClose,
  cid,
  compoundName,
}) => {
  const [results, setResults] = useState<(LiteratureReference | PatentReference)[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLiterature = useCallback(async () => {
    if (!cid || cid <= 0) {
      setError('No compound selected');
      return;
    }
    setLoading(true);
    setError(null);
    setResults([]);
    try {
      const refs = await searchLiterature(cid, 15);
      setResults(refs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Literature search failed');
    } finally {
      setLoading(false);
    }
  }, [cid]);

  useEffect(() => {
    if (open && cid) fetchLiterature();
  }, [open, cid, fetchLiterature]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Find papers — {compoundName || `CID ${cid}`}
      </DialogTitle>
      <DialogContent>
        {loading && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 2 }}>
            <CircularProgress size={24} />
            <Typography variant="body2">Searching PubMed & patents…</Typography>
          </Box>
        )}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        {!loading && results.length === 0 && !error && cid && (
          <Typography variant="body2" color="text.secondary">
            No literature found for this compound.
          </Typography>
        )}
        {!loading && results.length > 0 && (
          <List dense>
            {results.map((r, i) => (
              <ListItem key={r.id + i} alignItems="flex-start" sx={{ flexDirection: 'column', alignItems: 'stretch', py: 1 }}>
                <Link href={r.url} target="_blank" rel="noopener noreferrer" underline="hover" sx={{ fontWeight: 500, fontSize: '0.85rem' }}>
                  {r.title}
                </Link>
                <ListItemText
                  secondary={
                    'authors' in r
                      ? `${(r.authors || []).slice(0, 3).join(', ')}${(r.authors?.length || 0) > 3 ? ' et al.' : ''} — ${r.journal || ''} (${r.year || ''})`
                      : 'patentNumber' in r
                        ? `Patent ${r.patentNumber}`
                        : ''
                  }
                  sx={{ '& .MuiListItemText-secondary': { fontSize: '0.75rem', color: 'text.secondary' } }}
                />
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        {cid && (
          <Button variant="contained" href={`https://pubchem.ncbi.nlm.nih.gov/compound/${cid}#literature`} target="_blank" rel="noopener noreferrer">
            View on PubChem
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};
