/**
 * BatchProcessor Component
 * Handles batch import/export of multiple chemical structures from SDF files
 */

import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Alert,
  Chip,
  Stack,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Close as CloseIcon,
  Download as ExportIcon,
  Upload as ImportIcon,
} from '@mui/icons-material';
import { parseSDFFile, generateSDFFile, validateSDFFormat, extractSmilesFromStructures } from '@lib/chemistry/sdf';
import type { SDFStructure } from '@lib/chemistry/sdf';
import { openFile, saveFile, readFileContents, writeFileContents } from '@lib/tauri/fileOperations';

interface BatchProcessorProps {
  open: boolean;
  onClose: () => void;
  mode: 'import' | 'export';
  exportStructures?: SDFStructure[];
}

export const BatchProcessor: React.FC<BatchProcessorProps> = ({
  open,
  onClose,
  mode,
  exportStructures = [],
}) => {
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<{
    success: number;
    failed: number;
    structures?: SDFStructure[];
    errors?: Array<{ index: number; error: string }>;
  } | null>(null);

  const handleImport = useCallback(async () => {
    setProcessing(true);
    setProgress(0);
    
    try {
      // Open file dialog
      const filePath = await openFile('Import SDF File', [
        { name: 'SDF Files', extensions: ['sdf', 'sd'] },
        { name: 'MOL Files', extensions: ['mol'] },
      ]);
      
      if (!filePath) {
        setProcessing(false);
        return;
      }

      setProgress(10);

      // Read file contents
      const content = await readFileContents(filePath);
      
      setProgress(20);

      // Validate format
      const validation = validateSDFFormat(content);
      if (!validation.isValid) {
        throw new Error(validation.error || 'Invalid file format');
      }

      setProgress(30);

      // Parse SDF file
      const parseResult = parseSDFFile(content);
      
      setProgress(60);

      // Extract SMILES for validation
      await extractSmilesFromStructures(parseResult.structures);
      
      setProgress(100);

      // Set results
      setResults({
        success: parseResult.structures.length,
        failed: parseResult.errors.length,
        structures: parseResult.structures,
        errors: parseResult.errors,
      });

    } catch (error) {
      console.error('[BatchProcessor] Import error:', error);
      setResults({
        success: 0,
        failed: 1,
        errors: [{ index: 0, error: (error as Error).message }],
      });
    } finally {
      setProcessing(false);
    }
  }, []);

  const handleExport = useCallback(async () => {
    if (exportStructures.length === 0) {
      alert('No structures to export');
      return;
    }

    setProcessing(true);
    setProgress(0);

    try {
      // Generate SDF content
      setProgress(30);
      const sdfContent = generateSDFFile(exportStructures);
      
      setProgress(60);

      // Save file dialog
      const filePath = await saveFile(
        'Export SDF File',
        'structures.sdf',
        [{ name: 'SDF Files', extensions: ['sdf'] }]
      );

      if (!filePath) {
        setProcessing(false);
        return;
      }

      setProgress(80);

      // Write to file
      await writeFileContents(filePath, sdfContent);
      
      setProgress(100);

      setResults({
        success: exportStructures.length,
        failed: 0,
      });

    } catch (error) {
      console.error('[BatchProcessor] Export error:', error);
      setResults({
        success: 0,
        failed: exportStructures.length,
        errors: [{ index: 0, error: (error as Error).message }],
      });
    } finally {
      setProcessing(false);
    }
  }, [exportStructures]);

  const handleStart = useCallback(() => {
    if (mode === 'import') {
      handleImport();
    } else {
      handleExport();
    }
  }, [mode, handleImport, handleExport]);

  const handleClose = useCallback(() => {
    setResults(null);
    setProgress(0);
    onClose();
  }, [onClose]);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          minHeight: '400px',
        },
      }}
    >
      <DialogTitle>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={1}>
            {mode === 'import' ? <ImportIcon /> : <ExportIcon />}
            <Typography variant="h6">
              {mode === 'import' ? 'Batch Import' : 'Batch Export'}
            </Typography>
          </Stack>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent dividers>
        {!processing && !results && (
          <Box>
            <Alert severity="info" sx={{ mb: 2 }}>
              {mode === 'import' ? (
                <>
                  <strong>Import SDF/MOL Files</strong>
                  <br />
                  Select an SDF file containing multiple structures or a single MOL file.
                  Supported formats: .sdf, .sd, .mol
                </>
              ) : (
                <>
                  <strong>Export to SDF File</strong>
                  <br />
                  Export {exportStructures.length} structure(s) to a single SDF file.
                </>
              )}
            </Alert>

            {mode === 'export' && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Structures to export:
                </Typography>
                <Chip label={`${exportStructures.length} structures`} color="primary" />
              </Box>
            )}
          </Box>
        )}

        {processing && (
          <Box sx={{ py: 4 }}>
            <Stack spacing={2} alignItems="center">
              <Typography variant="body1">
                {mode === 'import' ? 'Importing structures...' : 'Exporting structures...'}
              </Typography>
              <Box sx={{ width: '100%', maxWidth: 400 }}>
                <LinearProgress variant="determinate" value={progress} />
                <Typography variant="caption" color="text.secondary" textAlign="center" display="block" mt={1}>
                  {progress}%
                </Typography>
              </Box>
            </Stack>
          </Box>
        )}

        {!processing && results && (
          <Box>
            {/* Summary */}
            <Stack direction="row" spacing={2} mb={3}>
              <Chip
                icon={<SuccessIcon />}
                label={`${results.success} Successful`}
                color="success"
                variant="outlined"
              />
              {results.failed > 0 && (
                <Chip
                  icon={<ErrorIcon />}
                  label={`${results.failed} Failed`}
                  color="error"
                  variant="outlined"
                />
              )}
            </Stack>

            <Divider sx={{ mb: 2 }} />

            {/* Success message */}
            {results.success > 0 && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {mode === 'import'
                  ? `Successfully imported ${results.success} structure(s)`
                  : `Successfully exported ${results.success} structure(s)`}
              </Alert>
            )}

            {/* Imported structures list */}
            {mode === 'import' && results.structures && results.structures.length > 0 && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Imported Structures:
                </Typography>
                <List dense sx={{ maxHeight: 200, overflow: 'auto', bgcolor: 'background.default', borderRadius: 1 }}>
                  {results.structures.slice(0, 20).map((structure, index) => (
                    <ListItem key={structure.id}>
                      <ListItemIcon>
                        <SuccessIcon color="success" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText
                        primary={structure.name || `Structure ${index + 1}`}
                        secondary={Object.keys(structure.properties).length > 0
                          ? `${Object.keys(structure.properties).length} properties`
                          : 'No properties'}
                      />
                    </ListItem>
                  ))}
                  {results.structures.length > 20 && (
                    <ListItem>
                      <ListItemText
                        secondary={`... and ${results.structures.length - 20} more`}
                        sx={{ textAlign: 'center' }}
                      />
                    </ListItem>
                  )}
                </List>
              </Box>
            )}

            {/* Errors */}
            {results.errors && results.errors.length > 0 && (
              <Box mt={2}>
                <Typography variant="subtitle2" color="error" gutterBottom>
                  Errors:
                </Typography>
                <List dense sx={{ maxHeight: 150, overflow: 'auto', bgcolor: 'background.default', borderRadius: 1 }}>
                  {results.errors.map((error) => (
                    <ListItem key={error.index}>
                      <ListItemIcon>
                        <ErrorIcon color="error" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText
                        primary={`Structure ${error.index + 1}`}
                        secondary={error.error}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>
          {results ? 'Close' : 'Cancel'}
        </Button>
        {!processing && !results && (
          <Button
            onClick={handleStart}
            variant="contained"
            startIcon={mode === 'import' ? <ImportIcon /> : <ExportIcon />}
            disabled={mode === 'export' && exportStructures.length === 0}
          >
            {mode === 'import' ? 'Select File' : 'Export'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default BatchProcessor;

