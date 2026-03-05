/**
 * AdvancedExport Component
 * Export chemical structures in multiple formats with high-quality rendering
 */

import React, { useState, useCallback, useEffect } from 'react';
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
import { FORMAT_EXT, downloadBlob, ensureExtension } from '@lib/export/advancedExport';
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
  format: 'PNG' | 'JPEG' | 'SVG' | 'PDF' | 'MOL' | 'SDF' | 'CDX' | 'RXN' | 'SMILES' | 'InChI' | 'InChIKey' | 'SMARTS';
  quality: 'Low' | 'Medium' | 'High' | 'Publication';
  width: number;
  height: number;
  dpi: number;
  backgroundColor: 'white' | 'transparent' | 'black';
  blackAtoms: boolean;
  includeProperties: boolean;
  includeAnnotations: boolean;
  includeTitle: boolean;
  title?: string;
  author?: string;
  date?: string;
  fileHandle?: FileSystemFileHandle;
}

export interface ExportDownloadResult {
  downloadBlob: Blob;
  downloadFilename: string;
}

interface AdvancedExportProps {
  open: boolean;
  onClose: () => void;
  onExport: (options: ExportOptions) => Promise<ExportDownloadResult | void | null>;
  structureData?: {
    molfile?: string;
    smiles?: string;
    name?: string;
  };
}

const FORMAT_OPTIONS = [
  { value: 'PNG',      label: 'PNG Image',  icon: <ImageIcon />, description: 'Raster image — best for presentations & web' },
  { value: 'JPEG',     label: 'JPEG Image', icon: <ImageIcon />, description: 'Compressed image — smaller file, no transparency' },
  { value: 'SVG',      label: 'SVG Vector', icon: <CodeIcon />,  description: 'Vector graphics — scales without pixelation' },
  { value: 'PDF',      label: 'PDF Document', icon: <PdfIcon />, description: 'Portable document — embed in reports' },
  { value: 'MOL',      label: 'MOL File',   icon: <CodeIcon />,  description: 'Chemical structure — ChemDraw compatible' },
  { value: 'SDF',      label: 'SDF File',   icon: <CodeIcon />,  description: 'Structure data file — multiple properties' },
  { value: 'CDX',      label: 'CDX File',   icon: <CodeIcon />,  description: 'ChemDraw binary — open in ChemDraw' },
  { value: 'RXN',      label: 'RXN File',   icon: <CodeIcon />,  description: 'MDL reaction file — FreeChemDraw compatible' },
  { value: 'SMILES',   label: 'SMILES',     icon: <CodeIcon />,  description: 'Linear notation — copy into databases' },
  { value: 'InChI',    label: 'InChI',      icon: <CodeIcon />,  description: 'Standard chemical identifier' },
  { value: 'InChIKey', label: 'InChIKey',   icon: <CodeIcon />,  description: 'Hashed InChI — 27-char database key' },
  { value: 'SMARTS',   label: 'SMARTS',     icon: <CodeIcon />,  description: 'Substructure query pattern' },
];

const QUALITY_OPTIONS = [
  { value: 'Low', label: 'Low (72 DPI)', description: 'Fast, small file size' },
  { value: 'Medium', label: 'Medium (150 DPI)', description: 'Balanced quality and size' },
  { value: 'High', label: 'High (300 DPI)', description: 'Good for printing' },
  { value: 'Publication', label: 'Publication (600 DPI)', description: 'Professional quality' },
];

/** One-click export presets */
const EXPORT_PRESETS = {
  ACS: {
    format: 'PNG' as const,
    quality: 'Publication' as const,
    dpi: 600,
    width: 1200,
    height: 900,
    backgroundColor: 'white' as const,
    blackAtoms: true,
    includeProperties: false,
    includeAnnotations: true,
    includeTitle: true,
  },
  Publication: {
    format: 'PNG' as const,
    quality: 'Publication' as const,
    dpi: 600,
    width: 1600,
    height: 1200,
    backgroundColor: 'white' as const,
    blackAtoms: false,
    includeProperties: true,
    includeAnnotations: true,
    includeTitle: true,
  },
};

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
    blackAtoms: false,
    includeProperties: true,
    includeAnnotations: true,
    includeTitle: true,
    title: structureData?.name || 'Chemical Structure',
    author: '',
    date: new Date().toLocaleDateString(),
  });

  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [downloadResult, setDownloadResult] = useState<ExportDownloadResult | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  // Draft strings for Width and Height so the user can type freely without the field
  // snapping back to the default mid-entry (parseInt("") || 800 fires on every keystroke).
  const [widthDraft, setWidthDraft] = useState(String(options.width));
  const [heightDraft, setHeightDraft] = useState(String(options.height));

  useEffect(() => {
    if (downloadResult) {
      const url = URL.createObjectURL(downloadResult.downloadBlob);
      setDownloadUrl(url);
      return () => {
        URL.revokeObjectURL(url);
        setDownloadUrl(null);
      };
    } else {
      setDownloadUrl(null);
    }
  }, [downloadResult]);

  // Sync title and reset error when dialog opens or structure changes
  useEffect(() => {
    if (open) {
      setOptions(prev => ({
        ...prev,
        title: structureData?.name || 'Chemical Structure',
      }));
      setWidthDraft(String(options.width));
      setHeightDraft(String(options.height));
      setExportError(null);
      setDownloadResult(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, structureData?.name]);

  const commitWidth = useCallback(() => {
    const n = parseInt(widthDraft, 10);
    if (!isNaN(n) && n >= 100) {
      setOptions(prev => ({ ...prev, width: Math.min(n, 4000) }));
      setWidthDraft(String(Math.min(n, 4000)));
    } else {
      setWidthDraft(String(options.width)); // revert
    }
  }, [widthDraft, options.width]);

  const commitHeight = useCallback(() => {
    const n = parseInt(heightDraft, 10);
    if (!isNaN(n) && n >= 100) {
      setOptions(prev => ({ ...prev, height: Math.min(n, 4000) }));
      setHeightDraft(String(Math.min(n, 4000)));
    } else {
      setHeightDraft(String(options.height)); // revert
    }
  }, [heightDraft, options.height]);

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

  const applyPreset = useCallback((presetKey: 'ACS' | 'Publication') => {
    const preset = EXPORT_PRESETS[presetKey];
    setOptions(prev => ({ ...prev, ...preset }));
    setWidthDraft(String(preset.width));
    setHeightDraft(String(preset.height));
  }, []);

  const downloadLinkRef = React.useRef<HTMLAnchorElement>(null);
  const downloadSectionRef = React.useRef<HTMLDivElement>(null);

  const handleExport = useCallback(async () => {
    const hasStructure = structureData?.molfile || structureData?.smiles;
    const isRxnFormat = options.format === 'RXN';
    if (!hasStructure && !isRxnFormat) {
      setExportError('No structure data available for export. Draw a structure on the canvas first.');
      return;
    }

    setIsExporting(true);
    setExportError(null);
    setDownloadResult(null);

    const format = options.format;

    // Skip showSaveFilePicker - it can hang on some systems. Always use download flow.
    const exportOptions = { ...options, fileHandle: undefined };

    const EXPORT_TIMEOUT_MS = 15000; // 15s - export uses molfile path, should be fast
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Export timed out. Please try again.')), EXPORT_TIMEOUT_MS)
    );

    try {
      const result = await Promise.race([onExport(exportOptions), timeoutPromise]);
      if (result?.downloadBlob && result?.downloadFilename) {
        const filename = ensureExtension(result.downloadFilename, format);
        setDownloadResult({ downloadBlob: result.downloadBlob, downloadFilename: filename });
        // Auto-download immediately when export finishes
        downloadBlob(result.downloadBlob, filename);
        setTimeout(() => downloadSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
      }
    } catch (error) {
      console.error('[AdvancedExport] Export failed:', error);
      const msg = error instanceof Error ? error.message : String(error);
      setExportError(msg?.trim() || 'Export failed (see console for details)');
    } finally {
      setIsExporting(false);
    }
  }, [options, onExport, structureData]);
  const canExport = structureData?.molfile || structureData?.smiles || options.format === 'RXN';

  const getFormatDescription = (format: string) => {
    return FORMAT_OPTIONS.find(f => f.value === format)?.description || '';
  };

  const isImageFormat = ['PNG', 'JPEG', 'SVG', 'PDF'].includes(options.format);
  const isDataFormat = ['MOL', 'SDF', 'CDX', 'RXN', 'SMILES', 'InChI', 'InChIKey', 'SMARTS'].includes(options.format);

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
          {/* Requirements - what user needs to know */}
          <Grid size={12}>
            <Alert severity="info" sx={{ mb: 1 }}>
              <Typography variant="body2" component="span">
                <strong>Required:</strong> Draw a structure on the canvas before exporting.
              </Typography>
              <Typography variant="body2" component="span" display="block" sx={{ mt: 0.5 }}>
                <strong>Optional:</strong> Author, Title, and Date — leave blank if you prefer.
              </Typography>
            </Alert>
          </Grid>

          {/* Export Presets - one-click ACS / Publication */}
          <Grid size={12}>
            <Typography variant="h6" gutterBottom>
              Quick Presets
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
              <Chip
                label="ACS"
                onClick={() => applyPreset('ACS')}
                sx={{ cursor: 'pointer' }}
                color="primary"
                variant="outlined"
              />
              <Chip
                label="Publication"
                onClick={() => applyPreset('Publication')}
                sx={{ cursor: 'pointer' }}
                color="primary"
                variant="outlined"
              />
            </Stack>
            <Typography variant="caption" color="text.secondary">
              ACS: 600 DPI, black atoms for reports/slides. Publication: 600 DPI, full color for papers.
            </Typography>
          </Grid>

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
                    value={widthDraft}
                    onChange={(e) => setWidthDraft(e.target.value)}
                    onBlur={commitWidth}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') { commitWidth(); (e.target as HTMLInputElement).blur(); }
                      if (e.key === 'Escape') { setWidthDraft(String(options.width)); (e.target as HTMLInputElement).blur(); }
                    }}
                    inputProps={{ min: 100, max: 4000, style: { textAlign: 'right' } }}
                  />
                </Grid>
                <Grid size={6}>
                  <TextField
                    fullWidth
                    label="Height (px)"
                    value={heightDraft}
                    onChange={(e) => setHeightDraft(e.target.value)}
                    onBlur={commitHeight}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') { commitHeight(); (e.target as HTMLInputElement).blur(); }
                      if (e.key === 'Escape') { setHeightDraft(String(options.height)); (e.target as HTMLInputElement).blur(); }
                    }}
                    inputProps={{ min: 100, max: 4000, style: { textAlign: 'right' } }}
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
                  label="Title (optional)"
                  value={options.title}
                  onChange={(e) => handleOptionChange('title', e.target.value)}
                  placeholder="Optional"
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
                label="Date (optional)"
                value={options.date}
                onChange={(e) => handleOptionChange('date', e.target.value)}
                placeholder="Optional"
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
              <FormControlLabel
                control={
                  <Switch
                    checked={options.blackAtoms}
                    onChange={(e) => handleOptionChange('blackAtoms', e.target.checked)}
                  />
                }
                label="Black atoms (for reports/slides)"
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
                {options.blackAtoms && <Chip label="Black atoms" size="small" />}
              </Stack>
            </Paper>
          </Grid>

          {/* Download button - user click = user gesture, ensures correct filename (not UUID) */}
          {downloadResult && downloadUrl && (
            <Grid size={12}>
              <Box ref={downloadSectionRef}>
              <Alert severity="success" icon={<DownloadIcon />}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Export complete. Your file is downloading as <strong>{ensureExtension(downloadResult.downloadFilename, options.format)}</strong>.
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<DownloadIcon />}
                  onClick={() => {
                    const filename = ensureExtension(downloadResult.downloadFilename, options.format);
                    downloadBlob(downloadResult.downloadBlob, filename);
                  }}
                  sx={{ mt: 1 }}
                >
                  Download again
                </Button>
              </Alert>
              </Box>
            </Grid>
          )}

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
          disabled={isExporting || !canExport}
          startIcon={isExporting ? <CircularProgress size={16} /> : <DownloadIcon />}
        >
          {isExporting ? 'Exporting...' : 'Export'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AdvancedExport;
