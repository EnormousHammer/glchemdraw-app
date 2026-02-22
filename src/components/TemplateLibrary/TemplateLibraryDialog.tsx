/**
 * TemplateLibraryDialog - ChemDraw-style template library
 * Amino acids, sugars, rings, steroids - click to add to canvas
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Tabs,
  Tab,
  Chip,
  Stack,
  TextField,
  InputAdornment,
} from '@mui/material';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import SearchIcon from '@mui/icons-material/Search';
import { TEMPLATE_LIBRARY, TEMPLATE_CATEGORIES, type TemplateItem } from './TEMPLATE_DATA';

interface TemplateLibraryDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (smiles: string) => Promise<void>;
}

export const TemplateLibraryDialog: React.FC<TemplateLibraryDialogProps> = ({
  open,
  onClose,
  onAdd,
}) => {
  const [tab, setTab] = useState(0);
  const [search, setSearch] = useState('');
  const [adding, setAdding] = useState(false);

  const filtered = TEMPLATE_LIBRARY.filter((t) => {
    const matchSearch = !search.trim() || 
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.category.toLowerCase().includes(search.toLowerCase());
    const matchTab = tab === 0 || t.category === TEMPLATE_CATEGORIES[tab - 1];
    return matchSearch && matchTab;
  });

  const handleAdd = async (item: TemplateItem) => {
    setAdding(true);
    try {
      await onAdd(item.smiles);
      onClose();
    } catch (err) {
      console.error('[TemplateLibrary] Add failed:', err);
    } finally {
      setAdding(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ 'data-glchemdraw-dialog': 'template-library' }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <LibraryBooksIcon color="primary" />
        Template Library
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Click a template to add it to the canvas. Connect it to your structure.
        </Typography>
        <TextField
          size="small"
          fullWidth
          placeholder="Search templates..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 2 }}
        />
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2, minHeight: 36 }}>
          <Tab label="All" sx={{ minHeight: 36, textTransform: 'none' }} />
          {TEMPLATE_CATEGORIES.map((cat, i) => (
            <Tab key={cat} label={cat} sx={{ minHeight: 36, textTransform: 'none' }} />
          ))}
        </Tabs>
        <Box sx={{ maxHeight: 320, overflow: 'auto' }}>
          <Stack direction="row" flexWrap="wrap" gap={0.75} useFlexGap>
            {filtered.map((item) => (
              <Chip
                key={`${item.category}-${item.name}`}
                label={item.name}
                size="small"
                onClick={() => handleAdd(item)}
                disabled={adding}
                sx={{ cursor: 'pointer', fontWeight: 500 }}
                variant="outlined"
              />
            ))}
          </Stack>
          {filtered.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
              No templates match your search.
            </Typography>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default TemplateLibraryDialog;
