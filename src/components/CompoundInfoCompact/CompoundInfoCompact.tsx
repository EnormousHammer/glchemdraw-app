/**
 * CompoundInfoCompact Component
 * Clean, enterprise-level compound information display
 */

import React from 'react';
import {
  Box,
  Typography,
  Chip,
  Stack,
  Divider,
  Paper,
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Science as ScienceIcon,
} from '@mui/icons-material';

interface CompoundInfoCompactProps {
  compound: {
    cid: number;
    name: string;
    formula?: string;
    molecularWeight?: number;
    smiles?: string;
    iupacName?: string;
  };
}

export const CompoundInfoCompact: React.FC<CompoundInfoCompactProps> = ({ compound }) => {
  return (
    <Box sx={{ height: '100%', overflow: 'auto' }}>
      {/* Header */}
      <Paper 
        variant="outlined" 
        sx={{ 
          p: 1.5, 
          mb: 1, 
          bgcolor: 'primary.50',
          border: '1px solid',
          borderColor: 'primary.200',
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <CheckIcon color="success" fontSize="small" />
          <Typography variant="subtitle2" fontWeight={600} color="primary">
            {compound.name}
          </Typography>
          <Chip 
            label={`CID: ${compound.cid}`} 
            size="small" 
            color="primary" 
            variant="outlined"
          />
        </Stack>
      </Paper>

      {/* Properties Grid */}
      <Stack spacing={1}>
        {compound.formula && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              Formula
            </Typography>
            <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
              {compound.formula}
            </Typography>
          </Box>
        )}

        {compound.molecularWeight && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              Molecular Weight
            </Typography>
            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
              {typeof compound.molecularWeight === 'number' 
                ? compound.molecularWeight.toFixed(2) 
                : compound.molecularWeight} g/mol
            </Typography>
          </Box>
        )}

        {compound.iupacName && (
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
              IUPAC Name
            </Typography>
            <Typography variant="body2" sx={{ fontSize: '0.8rem', lineHeight: 1.3 }}>
              {compound.iupacName}
            </Typography>
          </Box>
        )}

        {compound.smiles && (
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
              SMILES
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                fontFamily: 'monospace', 
                fontSize: '0.75rem',
                wordBreak: 'break-all',
                overflowWrap: 'break-word',
                whiteSpace: 'pre-wrap',
                bgcolor: 'grey.50',
                p: 0.5,
                borderRadius: 0.5,
                border: '1px solid',
                borderColor: 'grey.200',
              }}
            >
              {compound.smiles}
            </Typography>
          </Box>
        )}
      </Stack>
    </Box>
  );
};

export default CompoundInfoCompact;
