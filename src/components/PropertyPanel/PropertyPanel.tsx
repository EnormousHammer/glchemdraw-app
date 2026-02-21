/**
 * PropertyPanel Component
 * Display molecular properties and descriptors with beautiful UI
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  Stack,
  Paper,
} from '@mui/material';
import * as rdkit from '@lib/chemistry/rdkit';
import * as ocl from '@lib/chemistry/openchemlib';

interface PropertyPanelProps {
  smiles?: string;
  molfile?: string;
}

export const PropertyPanel: React.FC<PropertyPanelProps> = ({ smiles, molfile }) => {
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [properties, setProperties] = useState<any>(null);
  const [descriptors, setDescriptors] = useState<any>(null);

  useEffect(() => {
    if (!smiles && !molfile) {
      setProperties(null);
      setDescriptors(null);
      return;
    }

    calculateProperties();
  }, [smiles, molfile]);

  const calculateProperties = async () => {
    setIsCalculating(true);
    setError(null);

    try {
      let smilesStr = smiles;
      
      // Convert molfile to SMILES if needed
      if (!smilesStr && molfile) {
        try {
          const converted = ocl.molfileToSmiles(molfile);
          smilesStr = converted || undefined;
        } catch (e) {
          console.warn('[PropertyPanel] Could not convert molfile to SMILES for OCL:', e);
        }
      }

      // Use OpenChemLib for calculations - handles multi-structure (uses first only)
      if (smilesStr) {
        const oclFormula = ocl.getMolecularFormulaFromSmiles(smilesStr);
        const oclMW = ocl.getMolecularWeightFromSmiles(smilesStr);
        setProperties({
          MolecularFormula: oclFormula,
          MolecularWeight: oclMW,
          InChI: 'OpenChemLib calculation',
          InChIKey: 'OpenChemLib calculation',
        });
        
        // Set basic descriptors
        setDescriptors({
          molecularWeight: oclMW || 0,
          logP: undefined,
          hBondDonors: undefined,
          hBondAcceptors: undefined,
          tpsa: undefined,
          rotatableBonds: undefined,
          rings: undefined,
          aromaticRings: undefined,
        });
      } else if (molfile) {
        // Convert molfile to SMILES first
        const molfileSmiles = ocl.molfileToSmiles(molfile);
        if (molfileSmiles) {
          const oclFormula = ocl.getMolecularFormulaFromSmiles(molfileSmiles);
          const oclMW = ocl.getMolecularWeightFromSmiles(molfileSmiles);
          setProperties({
            MolecularFormula: oclFormula,
            MolecularWeight: oclMW,
            InChI: 'OpenChemLib calculation',
            InChIKey: 'OpenChemLib calculation',
          });
          
          setDescriptors({
            molecularWeight: oclMW || 0,
            logP: undefined,
            hBondDonors: undefined,
            hBondAcceptors: undefined,
            tpsa: undefined,
            rotatableBonds: undefined,
            rings: undefined,
            aromaticRings: undefined,
          });
        } else {
          setProperties(null);
          setDescriptors(null);
        }
      } else {
        setProperties(null);
        setDescriptors(null);
      }

    } catch (e: any) {
      console.error('[PropertyPanel] Error calculating properties:', e);
      setError(`Failed to calculate properties: ${e.message}`);
      setProperties(null);
      setDescriptors(null);
    } finally {
      setIsCalculating(false);
    }
  };

  if (!smiles && !molfile) {
    return (
      <Box 
        sx={{ 
          p: 4, 
          height: '100%', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          textAlign: 'center',
        }}
      >
        <Box>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No Structure Yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Draw a chemical structure or search PubChem to see molecular properties
          </Typography>
        </Box>
      </Box>
    );
  }

  if (isCalculating) {
    return (
      <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" p={4} gap={2}>
        <CircularProgress size={40} />
        <Typography variant="body2" color="text.secondary">Calculating properties...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 2, overflowY: 'auto' }}>
      {/* Basic Properties Card */}
      {properties && (
        <Card 
          elevation={0}
          sx={{ 
            mb: 2,
            background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
            border: '1px solid',
            borderColor: 'primary.light',
          }}
        >
          <CardContent>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
              ⚗️ Basic Properties
            </Typography>
            <Divider sx={{ my: 1.5 }} />
            <Stack spacing={2}>
              {properties.MolecularFormula && (
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.7rem' }}>
                    Molecular Formula
                  </Typography>
                  <Typography variant="h6" sx={{ fontFamily: 'monospace', fontWeight: 600, color: 'primary.main' }}>
                    {properties.MolecularFormula}
                  </Typography>
                </Box>
              )}
              {properties.MolecularWeight !== undefined && (
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.7rem' }}>
                    Molecular Weight
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                    {typeof properties.MolecularWeight === 'number' ? properties.MolecularWeight.toFixed(2) : properties.MolecularWeight} <Typography component="span" variant="body2" color="text.secondary">g/mol</Typography>
                  </Typography>
                </Box>
              )}
              {properties.InChI && properties.InChI !== 'Calculation failed' && properties.InChI !== 'Needs molfile' && (
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.7rem' }}>
                    InChI
                  </Typography>
                  <Paper 
                    sx={{ 
                      p: 1,
                      bgcolor: 'background.paper',
                      fontFamily: 'monospace',
                      fontSize: '0.75rem',
                      wordBreak: 'break-all',
                      maxHeight: '100px',
                      overflowY: 'auto',
                    }}
                  >
                    {properties.InChI}
                  </Paper>
                </Box>
              )}
              {properties.InChIKey && properties.InChIKey !== 'Calculation failed' && properties.InChIKey !== 'Needs molfile' && (
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.7rem' }}>
                    InChIKey
                  </Typography>
                  <Paper 
                    sx={{ 
                      p: 1,
                      bgcolor: 'background.paper',
                      fontFamily: 'monospace',
                      fontSize: '0.85rem',
                      fontWeight: 500,
                    }}
                  >
                    {properties.InChIKey}
                  </Paper>
                </Box>
              )}
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Descriptors Card */}
      {descriptors && (
        <Card 
          elevation={0}
          sx={{
            background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.1) 0%, rgba(56, 142, 60, 0.1) 100%)',
            border: '1px solid',
            borderColor: 'success.light',
          }}
        >
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                📊 Calculated Descriptors
              </Typography>
              <Chip label="RDKit" size="small" color="success" sx={{ height: 20, fontSize: '0.7rem' }} />
            </Box>
            <Divider sx={{ mb: 1.5 }} />
            <Stack spacing={2}>
              {descriptors.MW !== undefined && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Molecular Weight
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700, color: 'success.main' }}>
                    {typeof descriptors.MW === 'number' ? descriptors.MW.toFixed(2) : descriptors.MW}
                  </Typography>
                </Box>
              )}
              {descriptors.LogP !== undefined && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    LogP (Lipophilicity)
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700, color: 'success.main' }}>
                    {typeof descriptors.LogP === 'number' ? descriptors.LogP.toFixed(2) : descriptors.LogP}
                  </Typography>
                </Box>
              )}
              {descriptors.TPSA !== undefined && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    TPSA (Polar Surface Area)
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700, color: 'success.main' }}>
                    {typeof descriptors.TPSA === 'number' ? descriptors.TPSA.toFixed(2) : descriptors.TPSA} Å²
                  </Typography>
                </Box>
              )}
            </Stack>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default PropertyPanel;
