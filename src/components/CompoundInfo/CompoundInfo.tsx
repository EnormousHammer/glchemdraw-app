/**
 * Compound Info Display Component
 * Beautiful display of all PubChem compound data
 */

import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Grid,
  Divider,
  Avatar,
  Stack,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Science as ScienceIcon,
  Functions as FormulaIcon,
  Scale as WeightIcon,
  Fingerprint as FingerprintIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckIcon,
  Info as InfoIcon,
  Category as CategoryIcon,
  Link as LinkIcon,
} from '@mui/icons-material';
import type { SearchResult } from '@lib/pubchem/cache';

interface CompoundInfoProps {
  compound: SearchResult;
  isSearching?: boolean;
}

export const CompoundInfo: React.FC<CompoundInfoProps> = ({ compound, isSearching }) => {
  const { cid, properties, summary, fromCache } = compound;

  return (
    <Box sx={{ p: 2 }}>
      {/* Header Card */}
      <Card 
        elevation={0}
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          mb: 2,
        }}
      >
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Avatar 
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.2)', 
                width: 56, 
                height: 56,
                backdropFilter: 'blur(10px)',
              }}
            >
              <CheckIcon sx={{ fontSize: 32 }} />
            </Avatar>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="overline" sx={{ opacity: 0.9, fontSize: '0.7rem' }}>
                PubChem Compound
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                {properties.IUPACName || `CID ${cid}`}
              </Typography>
              <Stack direction="row" spacing={1}>
                <Chip 
                  label={`CID: ${cid}`}
                  size="small"
                  sx={{ 
                    bgcolor: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    fontWeight: 600,
                  }}
                />
                {fromCache && (
                  <Chip 
                    label="Cached"
                    size="small"
                    sx={{ 
                      bgcolor: 'rgba(255,255,255,0.2)',
                      color: 'white',
                    }}
                  />
                )}
              </Stack>
            </Box>
          </Box>

          {/* Quick Stats Grid */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Box sx={{ flex: 1 }}>
              <Paper sx={{ p: 1.5, bgcolor: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)' }}>
                <Typography variant="caption" sx={{ opacity: 0.9, display: 'block' }}>
                  Formula
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 700, fontFamily: 'monospace' }}>
                  {properties.MolecularFormula}
                </Typography>
              </Paper>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Paper sx={{ p: 1.5, bgcolor: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)' }}>
                <Typography variant="caption" sx={{ opacity: 0.9, display: 'block' }}>
                  Mol. Weight
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 700 }}>
                  {properties.MolecularWeight} g/mol
                </Typography>
              </Paper>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Detailed Properties */}
      <Card elevation={0} variant="outlined" sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CategoryIcon color="primary" />
            <strong>Molecular Identifiers</strong>
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Stack spacing={2}>
            {/* SMILES */}
            {properties.CanonicalSMILES && (
              <Box>
                <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                  Canonical SMILES
                </Typography>
                <Paper 
                  sx={{ 
                    p: 1.5, 
                    bgcolor: 'action.hover',
                    fontFamily: 'monospace',
                    fontSize: '0.85rem',
                    wordBreak: 'break-all',
                  }}
                >
                  {properties.CanonicalSMILES}
                </Paper>
              </Box>
            )}

            {/* Isomeric SMILES */}
            {properties.IsomericSMILES && properties.IsomericSMILES !== properties.CanonicalSMILES && (
              <Box>
                <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                  Isomeric SMILES
                </Typography>
                <Paper 
                  sx={{ 
                    p: 1.5, 
                    bgcolor: 'action.hover',
                    fontFamily: 'monospace',
                    fontSize: '0.85rem',
                    wordBreak: 'break-all',
                  }}
                >
                  {properties.IsomericSMILES}
                </Paper>
              </Box>
            )}

            {/* InChI */}
            {properties.InChI && (
              <Box>
                <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                  InChI
                </Typography>
                <Paper 
                  sx={{ 
                    p: 1.5, 
                    bgcolor: 'action.hover',
                    fontFamily: 'monospace',
                    fontSize: '0.75rem',
                    wordBreak: 'break-all',
                    maxHeight: '120px',
                    overflowY: 'auto',
                  }}
                >
                  {properties.InChI}
                </Paper>
              </Box>
            )}

            {/* InChIKey */}
            {properties.InChIKey && (
              <Box>
                <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                  InChIKey
                </Typography>
                <Paper 
                  sx={{ 
                    p: 1.5, 
                    bgcolor: 'action.hover',
                    fontFamily: 'monospace',
                    fontSize: '0.85rem',
                  }}
                >
                  {properties.InChIKey}
                </Paper>
              </Box>
            )}
          </Stack>
        </CardContent>
      </Card>

      {/* Additional Properties */}
      {Object.keys(properties).some(key => 
        !['CID', 'MolecularFormula', 'MolecularWeight', 'IUPACName', 'InChI', 'InChIKey', 'CanonicalSMILES', 'IsomericSMILES'].includes(key)
      ) && (
        <Accordion elevation={0} variant="outlined">
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <InfoIcon fontSize="small" color="primary" />
              Additional Properties
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={1.5}>
              {Object.entries(properties).map(([key, value]) => {
                if (['CID', 'MolecularFormula', 'MolecularWeight', 'IUPACName', 'InChI', 'InChIKey', 'CanonicalSMILES', 'IsomericSMILES'].includes(key)) {
                  return null;
                }
                return (
                  <Box key={key}>
                    <Typography variant="caption" color="text.secondary">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {String(value)}
                    </Typography>
                  </Box>
                );
              })}
            </Stack>
          </AccordionDetails>
        </Accordion>
      )}

      {/* Summary Info */}
      {summary && (
        <Card elevation={0} variant="outlined" sx={{ mt: 2 }}>
          <CardContent>
            <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <InfoIcon color="primary" />
              <strong>Summary</strong>
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            {summary.title && (
              <Typography variant="body2" gutterBottom>
                <strong>Title:</strong> {summary.title}
              </Typography>
            )}
            
            {summary.description && (
              <Typography variant="body2" paragraph>
                {summary.description}
              </Typography>
            )}

            {summary.synonyms && summary.synonyms.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                  Common Names (showing first 10)
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                  {summary.synonyms.slice(0, 10).map((synonym, idx) => (
                    <Chip 
                      key={idx}
                      label={synonym}
                      size="small"
                      variant="outlined"
                    />
                  ))}
                  {summary.synonyms.length > 10 && (
                    <Chip 
                      label={`+${summary.synonyms.length - 10} more`}
                      size="small"
                      color="primary"
                    />
                  )}
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* External Link */}
      <Box sx={{ mt: 2, textAlign: 'center' }}>
        <Chip
          icon={<LinkIcon />}
          label="View on PubChem"
          component="a"
          href={`https://pubchem.ncbi.nlm.nih.gov/compound/${cid}`}
          target="_blank"
          rel="noopener noreferrer"
          clickable
          color="primary"
          sx={{ fontWeight: 600 }}
        />
      </Box>
    </Box>
  );
};

export default CompoundInfo;

