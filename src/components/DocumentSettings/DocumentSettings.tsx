/**
 * DocumentSettings Component
 * Mimics ChemDraw's Document Settings > Drawing tab.
 * Uses Ketcher's setSettings API to apply drawing parameters.
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Grid,
  Divider,
  Stack,
  IconButton,
} from '@mui/material';
import { Close as CloseIcon, Tune as TuneIcon } from '@mui/icons-material';

// ─── Types ──────────────────────────────────────────────────────────────────

type Units = 'inches' | 'cm' | 'pt';

interface DrawingSettings {
  bondLength: number;    // Fixed Length – stored in current units
  bondSpacing: number;   // Bond Spacing – always % of length
  boldWidth: number;     // Bold Width (stereoBondWidth) – in current units
  lineWidth: number;     // Line Width (bondThickness) – in current units
  marginWidth: number;   // Margin Width – in current units
  hashSpacing: number;   // Hash Spacing – in current units
  units: Units;
  // Atom Indicators
  showAtomNumbers: boolean;
  showStereoFlags: boolean;
  atomColoring: boolean;
  showValenceWarnings: boolean;
  // Bond Indicators
  aromaticCircle: boolean;
  showCharge: boolean;
  showHydrogenLabels: boolean;
  showBondNumbers: boolean;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const IN_TO_CM = 2.54;
const IN_TO_PT = 72.0;

/** ChemDraw defaults (in inches, matching the Drawing tab screenshot). */
const CHEMDRAW_DEFAULTS_IN = {
  bondLength: 0.2,
  bondSpacing: 18,
  boldWidth: 0.0278,
  lineWidth: 0.0083,
  marginWidth: 0.0222,
  hashSpacing: 0.0347,
  showAtomNumbers: false,
  showStereoFlags: true,
  atomColoring: true,
  showValenceWarnings: true,
  aromaticCircle: true,
  showCharge: true,
  showHydrogenLabels: true,
  showBondNumbers: false,
} as const;

const DEFAULTS: DrawingSettings = { ...CHEMDRAW_DEFAULTS_IN, units: 'inches' };
const STORAGE_KEY = 'glchemdraw_drawing_settings';

// ─── Unit helpers ─────────────────────────────────────────────────────────────

function toInches(v: number, u: Units): number {
  if (u === 'cm') return v / IN_TO_CM;
  if (u === 'pt') return v / IN_TO_PT;
  return v;
}

function fromInches(v: number, u: Units): number {
  if (u === 'cm') return v * IN_TO_CM;
  if (u === 'pt') return v * IN_TO_PT;
  return v;
}

/** Re-express dimension fields in a new unit system. */
function convertDimensions(s: DrawingSettings, newUnits: Units): DrawingSettings {
  const dims = ['bondLength', 'boldWidth', 'lineWidth', 'marginWidth', 'hashSpacing'] as const;
  const updated = { ...s, units: newUnits };
  for (const k of dims) {
    updated[k] = fromInches(toInches(s[k], s.units), newUnits);
  }
  return updated;
}

/** Format a dimension value for the text field. */
function fmt(v: number, u: Units): string {
  if (u === 'pt') return v.toFixed(2);
  return v.toFixed(4);
}

/** Convert our settings to the flat record Ketcher's setSettings expects. */
function toKetcherSettings(s: DrawingSettings): Record<string, unknown> {
  const inIn = (v: number) => toInches(v, s.units);
  return {
    // Bond geometry (Ketcher expects cm for bondLength, pt for widths)
    bondLength:               inIn(s.bondLength)   * IN_TO_CM,
    bondLengthUnit:           'cm',
    bondSpacing:              s.bondSpacing,
    bondThickness:            inIn(s.lineWidth)    * IN_TO_PT,
    bondThicknessUnit:        'pt',
    stereoBondWidth:          inIn(s.boldWidth)    * IN_TO_PT,
    stereoBondWidthUnit:      'pt',
    hashSpacing:              inIn(s.hashSpacing)  * IN_TO_PT,
    hashSpacingUnit:          'pt',
    reactionComponentMarginSize:     inIn(s.marginWidth) * IN_TO_PT,
    reactionComponentMarginSizeUnit: 'pt',
    // Atom / Bond indicators
    showAtomIds:          s.showAtomNumbers,
    showStereoFlags:      s.showStereoFlags,
    atomColoring:         s.atomColoring,
    showValenceWarnings:  s.showValenceWarnings,
    aromaticCircle:       s.aromaticCircle,
    showCharge:           s.showCharge,
    showHydrogenLabels:   s.showHydrogenLabels ? 'on' : 'off',
    showBondIds:          s.showBondNumbers,
  };
}

// ─── Styled sub-components ────────────────────────────────────────────────────

const FieldLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Typography
    variant="caption"
    sx={{ color: '#555', fontWeight: 600, display: 'block', mb: 0.5, fontSize: '0.78rem' }}
  >
    {children}
  </Typography>
);

// Pure presentational input — no internal hooks, no effects.
// All string state lives in the parent (DocumentSettings.drafts) so there are
// no React timing issues between focus, blur, and state sync.
const SmallInput: React.FC<{
  value: string;
  onChange: (v: string) => void;
  onCommit: () => void;
  onRevert: () => void;
  disabled?: boolean;
}> = ({ value, onChange, onCommit, onRevert, disabled }) => (
  <TextField
    size="small"
    value={value}
    disabled={disabled}
    onChange={(e) => onChange(e.target.value)}
    onBlur={onCommit}
    onKeyDown={(e) => {
      if (e.key === 'Enter') { onCommit(); (e.target as HTMLInputElement).blur(); }
      if (e.key === 'Escape') { onRevert(); (e.target as HTMLInputElement).blur(); }
    }}
    inputProps={{ style: { textAlign: 'right', fontSize: '0.85rem', padding: '5px 10px' } }}
    sx={{
      width: 112,
      '& .MuiOutlinedInput-root': {
        bgcolor: disabled ? '#e4e4e4' : 'white',
        '& fieldset': { borderColor: '#bbb' },
        '&:hover fieldset': { borderColor: '#888' },
        '&.Mui-focused fieldset': { borderColor: '#1976d2' },
      },
      '& .Mui-disabled': { bgcolor: '#e4e4e4', color: '#777' },
    }}
  />
);

const UnitText: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Typography variant="body2" sx={{ color: '#555', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
    {children}
  </Typography>
);

// ─── Main component ───────────────────────────────────────────────────────────

interface DocumentSettingsProps {
  open: boolean;
  onClose: () => void;
  ketcherInstance: any | null;
}

// Numeric fields that have draft strings
type DraftKey = 'bondLength' | 'bondSpacing' | 'boldWidth' | 'lineWidth' | 'marginWidth' | 'hashSpacing';
type Drafts = Record<DraftKey, string>;

function makeDrafts(s: DrawingSettings): Drafts {
  return {
    bondLength:  fmt(s.bondLength,  s.units),
    bondSpacing: s.bondSpacing.toFixed(0),
    boldWidth:   fmt(s.boldWidth,   s.units),
    lineWidth:   fmt(s.lineWidth,   s.units),
    marginWidth: fmt(s.marginWidth, s.units),
    hashSpacing: fmt(s.hashSpacing, s.units),
  };
}

export const DocumentSettings: React.FC<DocumentSettingsProps> = ({
  open,
  onClose,
  ketcherInstance,
}) => {
  const [settings, setSettings] = useState<DrawingSettings>(DEFAULTS);
  // drafts hold exactly what the user typed — only parsed on commit (blur / Enter)
  const [drafts, setDrafts] = useState<Drafts>(makeDrafts(DEFAULTS));

  // Load persisted settings when dialog opens
  useEffect(() => {
    if (!open) return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const s = stored ? (JSON.parse(stored) as DrawingSettings) : DEFAULTS;
      setSettings(s);
      setDrafts(makeDrafts(s));
    } catch {
      setSettings(DEFAULTS);
      setDrafts(makeDrafts(DEFAULTS));
    }
  }, [open]);

  const handleUnitChange = (newUnits: Units) => {
    const next = convertDimensions(settings, newUnits);
    setSettings(next);
    setDrafts(makeDrafts(next));
  };

  /** Called when a numeric draft field should be committed to settings. */
  const commitField = (field: DraftKey) => {
    const raw = drafts[field];
    const num = parseFloat(raw);
    if (isNaN(num)) {
      // revert display to current value without touching settings
      setDrafts((prev) => ({ ...prev, [field]: makeDrafts(settings)[field] }));
      return;
    }
    const clamped = field === 'bondSpacing'
      ? Math.max(1, Math.min(100, num))
      : Math.max(0.0001, num);
    const formatted = field === 'bondSpacing' ? clamped.toFixed(0) : fmt(clamped, settings.units);
    setSettings((prev) => ({ ...prev, [field]: clamped }));
    setDrafts((prev) => ({ ...prev, [field]: formatted }));
  };

  /** Revert a draft to the current committed value (Escape key). */
  const revertField = (field: DraftKey) => {
    setDrafts((prev) => ({ ...prev, [field]: makeDrafts(settings)[field] }));
  };

  /** Shorthand: wire up a SmallInput for a numeric field. */
  const numProps = (field: DraftKey) => ({
    value: drafts[field],
    onChange: (v: string) => setDrafts((prev) => ({ ...prev, [field]: v })),
    onCommit: () => commitField(field),
    onRevert: () => revertField(field),
  });

  const handleCheck = (field: keyof DrawingSettings) => {
    setSettings((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleOK = async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    if (ketcherInstance) {
      try {
        ketcherInstance.setSettings(toKetcherSettings(settings));
        // Force a full re-render so all settings (aromaticCircle, showAtomIds, etc.)
        // take effect immediately on the existing structure, not just new drawings.
        try {
          const mol = await ketcherInstance.getMolecule();
          if (mol && mol.trim()) {
            await ketcherInstance.setMolecule(mol);
          }
        } catch (rerenderErr) {
          console.warn('[DocumentSettings] re-render failed:', rerenderErr);
        }
      } catch (e) {
        console.warn('[DocumentSettings] setSettings failed:', e);
      }
    }
    onClose();
  };

  const handleReset = () => {
    const next = convertDimensions({ ...CHEMDRAW_DEFAULTS_IN, units: 'inches' }, settings.units);
    setSettings(next);
    setDrafts(makeDrafts(next));
  };

  // Calculated absolute bond spacing (read-only display)
  const absSpacing = toInches(settings.bondLength, settings.units) * (settings.bondSpacing / 100);
  const absSpacingDisplay = fromInches(absSpacing, settings.units);
  const unitLabel = settings.units === 'inches' ? 'in' : settings.units === 'cm' ? 'cm' : 'pt';

  // Shared checkbox row renderer
  const renderCheckbox = (field: keyof DrawingSettings, label: string) => (
    <FormControlLabel
      key={field}
      control={
        <Checkbox
          size="small"
          checked={settings[field] as boolean}
          onChange={() => handleCheck(field)}
          sx={{
            color: '#888',
            '&.Mui-checked': { color: '#1976d2' },
            p: '3px',
          }}
        />
      }
      label={<Typography sx={{ fontSize: '0.8rem', color: '#333' }}>{label}</Typography>}
      sx={{ display: 'flex', ml: 0, mb: 0 }}
    />
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: '#f0f0f0',
          color: '#1a1a1a',
          borderRadius: 2,
          boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
        },
      }}
    >
      {/* Title bar */}
      <DialogTitle
        sx={{
          bgcolor: '#e2e2e2',
          borderBottom: '1px solid #ccc',
          py: 1.25,
          px: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <TuneIcon sx={{ fontSize: 17, color: '#444' }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#111', fontSize: '0.92rem' }}>
            Document Settings
          </Typography>
          <Typography
            variant="caption"
            sx={{
              bgcolor: '#1976d2',
              color: 'white',
              borderRadius: 1,
              px: 0.75,
              py: 0.1,
              fontSize: '0.65rem',
              fontWeight: 600,
              letterSpacing: '0.04em',
            }}
          >
            DRAWING
          </Typography>
        </Stack>
        <IconButton size="small" onClick={onClose} sx={{ color: '#555' }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 2.5, bgcolor: '#f0f0f0' }}>

        {/* ── Row 1: Chain Angle + Bond Spacing ──────────────────────────── */}
        <Box sx={{ display: 'flex', gap: 4, mb: 2 }}>

          {/* Chain Angle */}
          <Box>
            <FieldLabel>Chain Angle:</FieldLabel>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SmallInput value="120" disabled onChange={() => {}} onCommit={() => {}} onRevert={() => {}} />
              <UnitText>degrees</UnitText>
            </Box>
          </Box>

          {/* Bond Spacing */}
          <Box>
            <FieldLabel>Bond Spacing:</FieldLabel>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SmallInput {...numProps('bondSpacing')} />
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      border: '2px solid #1976d2',
                      bgcolor: '#1976d2',
                      flexShrink: 0,
                    }}
                  />
                  <UnitText>% of length</UnitText>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      border: '2px solid #aaa',
                      flexShrink: 0,
                    }}
                  />
                  <Typography variant="body2" sx={{ color: '#999', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                    {fmt(absSpacingDisplay, settings.units)} {unitLabel} (abs)
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>

        <Divider sx={{ borderColor: '#ccc', mb: 2 }} />

        {/* ── Row 2: Bond Dimensions grid ────────────────────────────────── */}
        <Grid container spacing={2} sx={{ mb: 0.5 }}>

          <Grid size={6}>
            <FieldLabel>Fixed Length:</FieldLabel>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SmallInput {...numProps('bondLength')} />
              <UnitText>{unitLabel}</UnitText>
            </Box>
          </Grid>

          <Grid size={6}>
            <FieldLabel>Line Width:</FieldLabel>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SmallInput {...numProps('lineWidth')} />
              <UnitText>{unitLabel}</UnitText>
            </Box>
          </Grid>

          <Grid size={6}>
            <FieldLabel>Bold Width:</FieldLabel>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SmallInput {...numProps('boldWidth')} />
              <UnitText>{unitLabel}</UnitText>
            </Box>
          </Grid>

          <Grid size={6}>
            <FieldLabel>Hash Spacing:</FieldLabel>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SmallInput {...numProps('hashSpacing')} />
              <UnitText>{unitLabel}</UnitText>
            </Box>
          </Grid>

          <Grid size={6}>
            <FieldLabel>Margin Width:</FieldLabel>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SmallInput {...numProps('marginWidth')} />
              <UnitText>{unitLabel}</UnitText>
            </Box>
          </Grid>

          <Grid size={6}>
            <FieldLabel>Units:</FieldLabel>
            <Select
              size="small"
              value={settings.units}
              onChange={(e) => handleUnitChange(e.target.value as Units)}
              sx={{
                width: 140,
                bgcolor: 'white',
                fontSize: '0.82rem',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#bbb' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#888' },
              }}
            >
              <MenuItem value="inches" sx={{ fontSize: '0.82rem' }}>Inches</MenuItem>
              <MenuItem value="cm"     sx={{ fontSize: '0.82rem' }}>Centimeters</MenuItem>
              <MenuItem value="pt"     sx={{ fontSize: '0.82rem' }}>Points</MenuItem>
            </Select>
          </Grid>
        </Grid>

        <Divider sx={{ borderColor: '#ccc', mt: 2, mb: 2 }} />

        {/* ── Row 3: Indicators ──────────────────────────────────────────── */}
        <Box sx={{ display: 'flex', gap: 4 }}>

          {/* Atom Indicators */}
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="caption"
              sx={{ color: '#444', fontWeight: 700, display: 'block', mb: 0.75, fontSize: '0.8rem' }}
            >
              Atom Indicators:
            </Typography>
            {renderCheckbox('showAtomNumbers',     'Show Atom Numbers')}
            {renderCheckbox('showStereoFlags',     'Show Stereochemistry')}
            {renderCheckbox('atomColoring',        'Atom Coloring')}
            {renderCheckbox('showValenceWarnings', 'Valence Warnings')}
          </Box>

          {/* Bond Indicators */}
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="caption"
              sx={{ color: '#444', fontWeight: 700, display: 'block', mb: 0.75, fontSize: '0.8rem' }}
            >
              Bond Indicators:
            </Typography>
            {renderCheckbox('aromaticCircle',      'Aromatic Circles')}
            {renderCheckbox('showCharge',          'Show Charges')}
            {renderCheckbox('showHydrogenLabels',  'Hydrogen Labels')}
            {renderCheckbox('showBondNumbers',     'Show Bond Numbers')}
          </Box>
        </Box>

      </DialogContent>

      {/* Actions */}
      <DialogActions
        sx={{
          bgcolor: '#e2e2e2',
          borderTop: '1px solid #ccc',
          px: 2,
          py: 1,
          gap: 1,
        }}
      >
        <Button
          size="small"
          onClick={handleReset}
          sx={{ color: '#555', fontSize: '0.78rem', textTransform: 'none', mr: 'auto' }}
        >
          Reset to Defaults
        </Button>
        <Button
          size="small"
          variant="outlined"
          onClick={onClose}
          sx={{
            fontSize: '0.78rem',
            textTransform: 'none',
            borderColor: '#aaa',
            color: '#333',
            minWidth: 70,
            '&:hover': { borderColor: '#666', bgcolor: 'rgba(0,0,0,0.04)' },
          }}
        >
          Cancel
        </Button>
        <Button
          size="small"
          variant="contained"
          onClick={handleOK}
          sx={{ fontSize: '0.78rem', textTransform: 'none', minWidth: 60 }}
        >
          OK
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DocumentSettings;
