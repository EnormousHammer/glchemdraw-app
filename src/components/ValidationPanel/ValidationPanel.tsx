/**
 * ValidationPanel Component
 * Displays real-time structure validation feedback, valence checks, and molecular formula
 */

import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  CircularProgress,
  Alert,
  Stack,
  Tooltip,
  Divider,
} from '@mui/material';
import {
  CheckCircle as ValidIcon,
  CheckCircle,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Science as FormulaIcon,
  Functions as StereoIcon,
} from '@mui/icons-material';
// import { validateStructure } from '@lib/chemistry/rdkit'; // Disabled due to RDKit WASM issues
import type { StructureValidation } from '@/types/chemistry';

interface ValidationPanelProps {
  smiles?: string;
  molfile?: string;
  onValidationChange?: (validation: StructureValidation) => void;
}

export const ValidationPanel: React.FC<ValidationPanelProps> = ({
  smiles,
  molfile,
  onValidationChange,
}) => {
  const [validation, setValidation] = useState<StructureValidation | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [molecularFormula, setMolecularFormula] = useState<string>('');
  const [stereoInfo, setStereoInfo] = useState<{
    defined: number;
    undefined: number;
  } | null>(null);

  // Real-time validation
  useEffect(() => {
    if (!smiles || smiles.length < 2) {
      setValidation(null);
      setMolecularFormula('');
      setStereoInfo(null);
      return;
    }

    const validateAsync = async () => {
      setIsValidating(true);
      try {
        // Simple validation using OpenChemLib (skip RDKit due to WASM issues)
        const { getMolecularFormulaFromSmiles } = await import('../../lib/chemistry/openchemlib');
        
        let isValid = true;
        const errors: string[] = [];
        const warnings: string[] = [];
        
        try {
          const formula = getMolecularFormulaFromSmiles(smiles);
          if (!formula) {
            isValid = false;
            errors.push('Invalid SMILES structure');
          }
        } catch (e) {
          isValid = false;
          errors.push('Invalid SMILES structure');
        }
        
        const result: StructureValidation = {
          isValid,
          errors,
          warnings,
        };
        
        setValidation(result);
        
        if (onValidationChange) {
          onValidationChange(result);
        }

        // Extract molecular formula and stereo info
        if (result.isValid) {
          await extractAdditionalInfo(smiles);
        }
      } catch (error) {
        console.error('[ValidationPanel] Validation error:', error);
        setValidation({
          isValid: false,
          errors: ['Validation failed: ' + (error as Error).message],
          warnings: [],
        });
      } finally {
        setIsValidating(false);
      }
    };

    // Debounce validation (300ms)
    const timer = setTimeout(validateAsync, 300);
    return () => clearTimeout(timer);
  }, [smiles, onValidationChange]);

  const extractAdditionalInfo = async (smilesStr: string) => {
    try {
      // Use OpenChemLib for basic info (skip RDKit due to WASM issues)
      const { getMolecularFormulaFromSmiles } = await import('../../lib/chemistry/openchemlib');
      
      const formula = getMolecularFormulaFromSmiles(smilesStr);
      setMolecularFormula(formula || '');
      
      // Set basic stereo info (RDKit not available)
      setStereoInfo({
        defined: 0,
        undefined: 0,
      });
      
      console.log('[ValidationPanel] Using OpenChemLib for basic info');
    } catch (error) {
      console.error('[ValidationPanel] Error extracting additional info:', error);
    }
  };

  // Empty state
  if (!smiles) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          minHeight: 80,
          bgcolor: 'background.default',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', lineHeight: 1.6 }}>
          Draw a structure to see validation feedback
        </Typography>
      </Paper>
    );
  }

  // Loading state
  if (isValidating) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 2,
          height: '100%',
          bgcolor: 'background.default',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <CircularProgress size={20} />
          <Typography variant="body2" color="text.secondary">
            Validating structure...
          </Typography>
        </Stack>
      </Paper>
    );
  }

  return (
    <Paper
      elevation={0}
      sx={{
        p: 1.5,
        height: '100%',
        bgcolor: 'background.default',
        overflow: 'auto',
      }}
    >
      <Stack spacing={1}>
        {/* Validation Status Header */}
        <Box>
          <Stack direction="row" spacing={1} alignItems="center">
            {validation?.isValid ? (
              <>
                <ValidIcon color="success" />
                <Typography variant="subtitle2" color="success.main" fontWeight={600}>
                  Valid Structure
                </Typography>
              </>
            ) : (
              <>
                <ErrorIcon color="error" />
                <Typography variant="subtitle2" color="error.main" fontWeight={600}>
                  Invalid Structure
                </Typography>
              </>
            )}
          </Stack>
        </Box>

        {/* Molecular Formula */}
        {molecularFormula && (
          <>
            <Divider />
            <Box>
              <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                <FormulaIcon fontSize="small" color="primary" />
                <Typography variant="subtitle2" fontWeight={600}>
                  Molecular Formula
                </Typography>
              </Stack>
              <Paper
                variant="outlined"
                sx={{
                  p: 0.5,
                  bgcolor: 'background.paper',
                  fontFamily: 'monospace',
                  fontSize: '0.85rem',
                  textAlign: 'center',
                }}
              >
                {molecularFormula}
              </Paper>
            </Box>
          </>
        )}

        {/* Stereochemistry Info */}
        {stereoInfo && (stereoInfo.defined > 0 || stereoInfo.undefined > 0) && (
          <>
            <Divider />
            <Box>
              <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                <StereoIcon fontSize="small" color="primary" />
                <Typography variant="subtitle2" fontWeight={600}>
                  Stereochemistry
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {stereoInfo.defined > 0 && (
                  <Tooltip title="Defined stereocenters">
                    <Chip
                      size="small"
                      icon={<CheckCircle fontSize="small" />}
                      label={`${stereoInfo.defined} Defined`}
                      color="success"
                      variant="outlined"
                    />
                  </Tooltip>
                )}
                {stereoInfo.undefined > 0 && (
                  <Tooltip title="Unspecified stereocenters - consider defining">
                    <Chip
                      size="small"
                      icon={<WarningIcon fontSize="small" />}
                      label={`${stereoInfo.undefined} Undefined`}
                      color="warning"
                      variant="outlined"
                    />
                  </Tooltip>
                )}
              </Stack>
            </Box>
          </>
        )}

        {/* Errors */}
        {validation?.errors && validation.errors.length > 0 && (
          <>
            <Divider />
            <Box>
              <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                <ErrorIcon fontSize="small" color="error" />
                <Typography variant="subtitle2" color="error.main" fontWeight={600}>
                  Errors ({validation.errors.length})
                </Typography>
              </Stack>
              <Stack spacing={1}>
                {validation.errors.map((error, index) => (
                  <Alert key={index} severity="error" variant="outlined" sx={{ py: 0.5 }}>
                    <Typography variant="body2">{error}</Typography>
                  </Alert>
                ))}
              </Stack>
            </Box>
          </>
        )}

        {/* Warnings */}
        {validation?.warnings && validation.warnings.length > 0 && (
          <>
            <Divider />
            <Box>
              <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                <WarningIcon fontSize="small" color="warning" />
                <Typography variant="subtitle2" color="warning.main" fontWeight={600}>
                  Warnings ({validation.warnings.length})
                </Typography>
              </Stack>
              <Stack spacing={1}>
                {validation.warnings.map((warning, index) => (
                  <Alert key={index} severity="warning" variant="outlined" sx={{ py: 0.5 }}>
                    <Typography variant="body2">{warning}</Typography>
                  </Alert>
                ))}
              </Stack>
            </Box>
          </>
        )}

        {/* SMILES Display */}
        <Divider />
        <Box>
          <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
            SMILES
          </Typography>
          <Paper
            variant="outlined"
            sx={{
              p: 0.5,
              bgcolor: 'background.paper',
              fontFamily: 'monospace',
              fontSize: '0.7rem',
              wordBreak: 'break-all',
              maxHeight: '60px',
              overflow: 'auto',
            }}
          >
            {smiles}
          </Paper>
        </Box>
      </Stack>
    </Paper>
  );
};

export default ValidationPanel;

