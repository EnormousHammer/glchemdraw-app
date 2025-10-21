/**
 * AdvancedExport Component
 * Export chemical structures in multiple formats with high-quality rendering
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Switch,
  FormControlLabel,
  Stack,
  Chip,
  Alert,
  CircularProgress,
  Divider,
  Paper,
  Grid,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Close as CloseIcon,
  Download as DownloadIcon,
  Image as ImageIcon,
  PictureAsPdf as PdfIcon,
  Code as CodeIcon,
  Palette as PaletteIcon,
  Settings as SettingsIcon,
  Preview as PreviewIcon,
} from '@mui/icons-material';

interface ExportOptions {
  format: 'PNG' | 'SVG' | 'PDF' | 'MOL' | 'SDF' | 'SMILES' | 'InChI';
  quality: 'Low' | 'Medium' | 'High' | 'Publication';
  width: number;
  height: number;
  dpi: number;
  backgroundColor: 'white' | 'transparent' | 'black';
  includeProperties: boolean;
  includeAnnotations: boolean;
  includeTitle: boolean;
  title?: string;
  author?: string;
  date?: string;
}

interface AdvancedExportProps {
  open: boolean;
  onClose: () => void;
  onExport: (options: ExportOptions) => Promise<void>;
  structureData?: {
    molfile?: string;
    smiles?: string;
    name?: string;
  };
}

const FORMAT_OPTIONS = [
  { value: 'PNG', label: 'PNG Image', icon: <ImageIcon />, description: 'Raster image, good for presentations' },
  { value: 'SVG', label: 'SVG Vector', icon: <CodeIcon />, description: 'Vector graphics, scalable' },
  { value: 'PDF', label: 'PDF Document', icon: <PdfIcon />, description: 'Portable document format' },
  { value: 'MOL', label: 'MOL File', icon: <CodeIcon />, description: 'Chemical structure format' },
  { value: 'SDF', label: 'SDF File', icon: <CodeIcon />, description: 'Structure data format' },
  { value: 'SMILES', label: 'SMILES', icon: <CodeIcon />, description: 'Simplified molecular input' },
  { value: 'InChI', label: 'InChI', icon: <CodeIcon />, description: 'International Chemical Identifier' },
];

const QUALITY_OPTIONS = [
  { value: 'Low', label: 'Low (72 DPI)', description: 'Fast, small file size' },
  { value: 'Medium', label: 'Medium (150 DPI)', description: 'Balanced quality and size' },
  { value: 'High', label: 'High (300 DPI)', description: 'Good for printing' },
  { value: 'Publication', label: 'Publication (600 DPI)', description: 'Professional quality' },
];

const BACKGROUND_OPTIONS = [
  { value: 'white', label: 'White', description: 'Clean white background' },
  { value: 'transparent', label: 'Transparent', description: 'No background (PNG/SVG only)' },
  { value: 'black', label: 'Black', description: 'Dark background' },
];

export const AdvancedExport: React.FC<AdvancedExportProps> = ({
  open,
  onClose,
  onExport,
  structureData,
}) => {
  const [options, setOptions] = useState<ExportOptions>({
    format: 'PNG',
    quality: 'High',
    width: 800,
    height: 600,
    dpi: 300,
    backgroundColor: 'white',
    includeProperties: true,
    includeAnnotations: true,
    includeTitle: true,
    title: structureData?.name || 'Chemical Structure',
    author: '',
    date: new Date().toLocaleDateString(),
  });

  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const handleOptionChange = useCallback((key: keyof ExportOptions, value: any) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleQualityChange = useCallback((quality: string) => {
    const dpiMap: Record<string, number> = {
      'Low': 72,
      'Medium': 150,
      'High': 300,
      'Publication': 600,
    };
    
    setOptions(prev => ({
      ...prev,
      quality: quality as any,
      dpi: dpiMap[quality],
    }));
  }, []);

  const handleExport = useCallback(async () => {
    if (!structureData?.molfile && !structureData?.smiles) {
      setExportError('No structure data available for export');
      return;
    }

    setIsExporting(true);
    setExportError(null);

    try {
      await onExport(options);
    } catch (error) {
      setExportError((error as Error).message || 'Export failed');
    } finally {
      setIsExporting(false);
    }
  }, [options, onExport, structureData]);

  const getFormatDescription = (format: string) => {
    return FORMAT_OPTIONS.find(f => f.value === format)?.description || '';
  };

  const isImageFormat = ['PNG', 'SVG', 'PDF'].includes(options.format);
  const isDataFormat = ['MOL', 'SDF', 'SMILES', 'InChI'].includes(options.format);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { height: '80vh' }
      }}
    >
      <DialogTitle>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={1}>
            <DownloadIcon />
            <Typography variant="h6">Advanced Export</Typography>
          </Stack>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent dividers>
        <Grid container spacing={3}>
          {/* Format Selection */}
          <Grid size={12}>
            <Typography variant="h6" gutterBottom>
              Export Format
            </Typography>
            <Grid container spacing={2}>
              {FORMAT_OPTIONS.map((format) => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={format.value}>
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2,
                      cursor: 'pointer',
                      border: options.format === format.value ? 2 : 1,
                      borderColor: options.format === format.value ? 'primary.main' : 'divider',
                      bgcolor: options.format === format.value ? 'primary.50' : 'background.paper',
                      transition: 'all 0.2s',
                      '&:hover': {
                        borderColor: 'primary.main',
                        bgcolor: 'primary.50',
                      },
                    }}
                    onClick={() => handleOptionChange('format', format.value)}
                  >
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                      {format.icon}
                      <Typography variant="subtitle2" fontWeight={600}>
                        {format.label}
                      </Typography>
                    </Stack>
                    <Typography variant="caption" color="text.secondary">
                      {format.description}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Grid>

          {/* Quality Settings */}
          {isImageFormat && (
            <Grid size={12}>
              <Typography variant="h6" gutterBottom>
                Quality Settings
              </Typography>
              <FormControl fullWidth>
                <InputLabel>Quality</InputLabel>
                <Select
                  value={options.quality}
                  onChange={(e) => handleQualityChange(e.target.value)}
                  label="Quality"
                >
                  {QUALITY_OPTIONS.map((quality) => (
                    <MenuItem key={quality.value} value={quality.value}>
                      <Box>
                        <Typography variant="body2" fontWeight={500}>
                          {quality.label}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {quality.description}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}

          {/* Image Settings */}
          {isImageFormat && (
            <Grid size={12}>
              <Typography variant="h6" gutterBottom>
                Image Settings
              </Typography>
              <Grid container spacing={2}>
                <Grid size={6}>
                  <TextField
                    fullWidth
                    label="Width (px)"
                    type="number"
                    value={options.width}
                    onChange={(e) => handleOptionChange('width', parseInt(e.target.value) || 800)}
                    inputProps={{ min: 100, max: 4000 }}
                  />
                </Grid>
                <Grid size={6}>
                  <TextField
                    fullWidth
                    label="Height (px)"
                    type="number"
                    value={options.height}
                    onChange={(e) => handleOptionChange('height', parseInt(e.target.value) || 600)}
                    inputProps={{ min: 100, max: 4000 }}
                  />
                </Grid>
                <Grid size={12}>
                  <FormControl fullWidth>
                    <InputLabel>Background</InputLabel>
                    <Select
                      value={options.backgroundColor}
                      onChange={(e) => handleOptionChange('backgroundColor', e.target.value)}
                      label="Background"
                    >
                      {BACKGROUND_OPTIONS.map((bg) => (
                        <MenuItem key={bg.value} value={bg.value}>
                          <Box>
                            <Typography variant="body2" fontWeight={500}>
                              {bg.label}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {bg.description}
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Grid>
          )}

          {/* Metadata Settings */}
          <Grid size={12}>
            <Typography variant="h6" gutterBottom>
              Metadata
            </Typography>
            <Stack spacing={2}>
              <FormControlLabel
                control={
                  <Switch
                    checked={options.includeTitle}
                    onChange={(e) => handleOptionChange('includeTitle', e.target.checked)}
                  />
                }
                label="Include title"
              />
              {options.includeTitle && (
                <TextField
                  fullWidth
                  label="Title"
                  value={options.title}
                  onChange={(e) => handleOptionChange('title', e.target.value)}
                />
              )}
              
              <TextField
                fullWidth
                label="Author"
                value={options.author}
                onChange={(e) => handleOptionChange('author', e.target.value)}
                placeholder="Your name"
              />
              
              <TextField
                fullWidth
                label="Date"
                value={options.date}
                onChange={(e) => handleOptionChange('date', e.target.value)}
              />
            </Stack>
          </Grid>

          {/* Additional Options */}
          <Grid size={12}>
            <Typography variant="h6" gutterBottom>
              Additional Options
            </Typography>
            <Stack spacing={1}>
              <FormControlLabel
                control={
                  <Switch
                    checked={options.includeProperties}
                    onChange={(e) => handleOptionChange('includeProperties', e.target.checked)}
                  />
                }
                label="Include molecular properties"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={options.includeAnnotations}
                    onChange={(e) => handleOptionChange('includeAnnotations', e.target.checked)}
                  />
                }
                label="Include annotations and labels"
              />
            </Stack>
          </Grid>

          {/* Export Summary */}
          <Grid size={12}>
            <Divider sx={{ my: 2 }} />
            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
              <Typography variant="subtitle2" gutterBottom>
                Export Summary
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Chip label={options.format} color="primary" size="small" />
                <Chip label={options.quality} color="secondary" size="small" />
                {isImageFormat && (
                  <>
                    <Chip label={`${options.width}×${options.height}`} size="small" />
                    <Chip label={`${options.dpi} DPI`} size="small" />
                  </>
                )}
                <Chip label={options.backgroundColor} size="small" />
                {options.includeProperties && <Chip label="Properties" size="small" />}
                {options.includeAnnotations && <Chip label="Annotations" size="small" />}
              </Stack>
            </Paper>
          </Grid>

          {/* Error Display */}
          {exportError && (
            <Grid size={12}>
              <Alert severity="error" onClose={() => setExportError(null)}>
                {exportError}
              </Alert>
            </Grid>
          )}
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleExport}
          disabled={isExporting || !structureData?.molfile && !structureData?.smiles}
          startIcon={isExporting ? <CircularProgress size={16} /> : <DownloadIcon />}
        >
          {isExporting ? 'Exporting...' : 'Export'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AdvancedExport;
