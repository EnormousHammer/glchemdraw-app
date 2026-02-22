/**
 * Settings Dialog - App preferences and configuration
 * Theme, AI preferences, export defaults, accessibility
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControlLabel,
  Switch,
  Typography,
  Box,
  Stack,
  Divider,
  IconButton,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Close as CloseIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  Psychology as AIIcon,
  Download as ExportIcon,
  Accessibility as AccessibilityIcon,
  AutoAwesome as SparkleIcon,
} from '@mui/icons-material';
import { chatWithOpenAI } from '@/lib/openai';

const SETTINGS_KEY = 'glchemdraw_settings';
const DEFAULT_SETTINGS = {
  aiFallbackNaming: true,
  aiFallbackSearch: true,
  aiFallbackNMR: true,
  defaultExportFormat: 'PNG' as 'PNG' | 'SVG' | 'PDF' | 'MOL' | 'SDF' | 'SMILES',
};

export type ThemeMode = 'light' | 'dark' | 'highContrast';

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
  themeMode: ThemeMode;
  onThemeChange: (mode: ThemeMode) => void;
  onOpenAccessibility?: () => void;
}

export const SettingsDialog: React.FC<SettingsDialogProps> = ({
  open,
  onClose,
  themeMode,
  onThemeChange,
  onOpenAccessibility,
}) => {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [aiSuggesting, setAiSuggesting] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setSettings((prev) => ({ ...prev, ...parsed }));
      }
    } catch {
      // ignore
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    }
  }, [settings, open]);

  const handleToggle = (key: keyof typeof settings, value: boolean | string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleAiSuggest = async () => {
    setAiSuggesting(true);
    setAiSuggestion(null);
    try {
      const reply = await chatWithOpenAI([
        {
          role: 'user',
          content:
            'You are a chemistry app UX expert. In one short paragraph, suggest optimal GL-ChemDraw settings for a chemist who draws structures, validates them, exports to PNG/PDF, and uses NMR prediction. Be specific (e.g., "Use AI fallback for naming when PubChem fails").',
        },
      ]);
      setAiSuggestion(reply || 'No suggestion received.');
    } catch (err) {
      setAiSuggestion('AI suggestion unavailable. Check proxy and API key.');
    } finally {
      setAiSuggesting(false);
    }
  };

  const cycleTheme = () => {
    const next: ThemeMode = themeMode === 'light' ? 'dark' : themeMode === 'dark' ? 'highContrast' : 'light';
    onThemeChange(next);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">Settings</Typography>
          <IconButton onClick={onClose} size="small" aria-label="Close settings">
            <CloseIcon />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={3}>
          {/* Theme */}
          <Box>
            <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {themeMode === 'light' ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
              Theme
            </Typography>
            <Button
              variant="outlined"
              size="small"
              onClick={cycleTheme}
              startIcon={themeMode === 'light' ? <LightModeIcon /> : <DarkModeIcon />}
            >
              {themeMode === 'light' ? 'Light' : themeMode === 'dark' ? 'Dark' : 'High Contrast'}
            </Button>
            <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
              Click to cycle: Light → Dark → High Contrast
            </Typography>
          </Box>

          <Divider />

          {/* AI Preferences */}
          <Box>
            <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AIIcon fontSize="small" />
              AI Fallback (when data is missing)
            </Typography>
            <Stack spacing={0.5}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.aiFallbackNaming}
                    onChange={(e) => handleToggle('aiFallbackNaming', e.target.checked)}
                  />
                }
                label="Use AI for IUPAC naming when PubChem has no match"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.aiFallbackSearch}
                    onChange={(e) => handleToggle('aiFallbackSearch', e.target.checked)}
                  />
                }
                label="Use AI for name→structure when PubChem fails"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.aiFallbackNMR}
                    onChange={(e) => handleToggle('aiFallbackNMR', e.target.checked)}
                  />
                }
                label="Offer AI NMR explanation when prediction is unclear"
              />
            </Stack>
            <Alert severity="info" sx={{ mt: 1 }}>
              Run <code>npm run dev:proxy</code> and add OpenAI API key for AI features.
            </Alert>
          </Box>

          <Divider />

          {/* Default Export */}
          <Box>
            <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ExportIcon fontSize="small" />
              Default Export Format
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Advanced Export opens with: {settings.defaultExportFormat}
            </Typography>
          </Box>

          <Divider />

          {/* Accessibility */}
          {onOpenAccessibility && (
            <Box>
              <Button
                variant="outlined"
                startIcon={<AccessibilityIcon />}
                onClick={() => {
                  onClose();
                  onOpenAccessibility();
                }}
              >
                Accessibility Settings
              </Button>
            </Box>
          )}

          <Divider />

          {/* AI-Suggested Settings */}
          <Box>
            <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SparkleIcon fontSize="small" />
              AI-Suggested Settings
            </Typography>
            <Button
              variant="outlined"
              size="small"
              startIcon={aiSuggesting ? <CircularProgress size={16} /> : <SparkleIcon />}
              onClick={handleAiSuggest}
              disabled={aiSuggesting}
            >
              {aiSuggesting ? 'Asking AI...' : 'Get AI suggestions'}
            </Button>
            {aiSuggestion && (
              <Alert severity="info" sx={{ mt: 1 }} onClose={() => setAiSuggestion(null)}>
                {aiSuggestion}
              </Alert>
            )}
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Done</Button>
      </DialogActions>
    </Dialog>
  );
};

export default SettingsDialog;
