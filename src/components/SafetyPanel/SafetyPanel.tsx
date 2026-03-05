/**
 * Safety Panel - GHS pictograms, hazard phrases, regulatory status
 * First-class safety display for chemical compounds
 */

import React from 'react';
import { Box, Typography, Stack, Chip, Tooltip } from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';
import type { SafetyData } from '@/lib/pubchem/safety';

const GHS_PICTOGRAM_BASE = 'https://pubchem.ncbi.nlm.nih.gov/images/ghs';
const GHS_NAMES: Record<string, string> = {
  '01': 'Explosive',
  '02': 'Flammable',
  '03': 'Oxidizing',
  '04': 'Compressed gas',
  '05': 'Corrosive',
  '06': 'Acute toxicity',
  '07': 'Harmful/Irritant',
  '08': 'Health hazard',
  '09': 'Environmental',
};

// H-codes to GHS pictogram (01-09)
const H_CODE_TO_PICTOGRAM: Record<string, string> = {
  'H200': '01', 'H201': '01', 'H202': '01', 'H203': '01', 'H204': '01', 'H205': '01',
  'H220': '02', 'H221': '02', 'H222': '02', 'H223': '02', 'H224': '02', 'H225': '02', 'H226': '02', 'H228': '02', 'H229': '02', 'H230': '02', 'H231': '02',
  'H240': '03', 'H241': '03', 'H242': '03', 'H250': '02', 'H251': '02', 'H252': '02',
  'H270': '03', 'H271': '03', 'H272': '03', 'H280': '04', 'H281': '04',
  'H290': '05', 'H314': '05', 'H318': '05',
  'H300': '06', 'H301': '06', 'H302': '07', 'H303': '07', 'H304': '06', 'H305': '06', 'H310': '06', 'H311': '06', 'H312': '07', 'H313': '07', 'H315': '07', 'H316': '07', 'H317': '07', 'H319': '07', 'H320': '07', 'H330': '06', 'H331': '06', 'H332': '07', 'H333': '07', 'H334': '08', 'H335': '07', 'H336': '07', 'H340': '08', 'H350': '08', 'H351': '08', 'H360': '08', 'H361': '08', 'H362': '08', 'H370': '08', 'H371': '08', 'H372': '08', 'H373': '08',
  'H400': '09', 'H410': '09', 'H411': '09', 'H412': '09', 'H413': '09',
};

function parseGhsCodes(text: string | undefined): string[] {
  if (!text) return [];
  const codes = new Set<string>();
  const matches = text.match(/\bH\d{3}[a-d]?\b/gi);
  if (matches) {
    for (const m of matches) {
      const code = m.toUpperCase().replace(/[A-D]$/, '');
      const picto = H_CODE_TO_PICTOGRAM[code];
      if (picto) codes.add(picto);
    }
  }
  // Fallback: check for keywords
  const t = text.toLowerCase();
  if (t.includes('flammable') || t.includes('fire')) codes.add('02');
  if (t.includes('corrosive') || t.includes('skin corrosion')) codes.add('05');
  if (t.includes('toxic') || t.includes('fatal')) codes.add('06');
  if (t.includes('irritant') || t.includes('harmful')) codes.add('07');
  if (t.includes('carcinogen') || t.includes('mutagen') || t.includes('reproductive')) codes.add('08');
  if (t.includes('environment') || t.includes('aquatic')) codes.add('09');
  if (t.includes('oxid')) codes.add('03');
  if (t.includes('explosive')) codes.add('01');
  return Array.from(codes);
}

interface SafetyPanelProps {
  safetyData: SafetyData | null;
  aiSafetySummary?: string | null;
  onGetSafetySummary?: () => void;
  aiSafetyLoading?: boolean;
}

export const SafetyPanel: React.FC<SafetyPanelProps> = ({
  safetyData,
  aiSafetySummary,
  onGetSafetySummary,
  aiSafetyLoading = false,
}) => {
  const ghsCodes = parseGhsCodes(safetyData?.ghsClassification);
  const hasData = safetyData || aiSafetySummary;
  const hasGhs = ghsCodes.length > 0;

  if (!hasData && !onGetSafetySummary) return null;

  return (
    <Box sx={{ p: 1.25, minWidth: 0, borderRadius: 1, border: '1px solid', borderColor: 'divider', bgcolor: 'background.default' }}>
      <Typography variant="overline" sx={{ fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.1em', color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
        <WarningIcon sx={{ fontSize: 14 }} />
        Safety
      </Typography>

      {aiSafetySummary ? (
        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', fontSize: '0.75rem', lineHeight: 1.5 }}>{aiSafetySummary}</Typography>
      ) : (
        <>
          {/* GHS Pictograms */}
          {hasGhs && (
            <Stack direction="row" flexWrap="wrap" gap={0.75} sx={{ mb: 1 }}>
              {ghsCodes.map((code) => (
                <Tooltip key={code} title={GHS_NAMES[code] || `GHS${code}`}>
                  <Box
                    component="img"
                    src={`${GHS_PICTOGRAM_BASE}/GHS${code}.svg`}
                    alt={GHS_NAMES[code]}
                    sx={{ width: 32, height: 32, objectFit: 'contain' }}
                  />
                </Tooltip>
              ))}
            </Stack>
          )}

          {safetyData && (
            <Stack spacing={0.5}>
              {safetyData.ghsClassification && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, alignItems: 'flex-start' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>GHS:</Typography>
                  <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.75rem' }}>{safetyData.ghsClassification}</Typography>
                </Box>
              )}
              {safetyData.hazardClass && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minWidth: 0, p: 0.5, borderRadius: 1 }}>
                  <Typography variant="caption" color="text.secondary">Hazard class:</Typography>
                  <Typography variant="caption" sx={{ fontWeight: 500 }}>{safetyData.hazardClass}</Typography>
                </Box>
              )}
              {safetyData.flashPoint && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minWidth: 0, p: 0.5, borderRadius: 1 }}>
                  <Typography variant="caption" color="text.secondary">Flash point:</Typography>
                  <Typography variant="caption" sx={{ fontWeight: 500 }}>{safetyData.flashPoint}</Typography>
                </Box>
              )}
              {safetyData.flammability && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minWidth: 0, p: 0.5, borderRadius: 1 }}>
                  <Typography variant="caption" color="text.secondary">Flammability:</Typography>
                  <Typography variant="caption" sx={{ fontWeight: 500 }}>{safetyData.flammability}</Typography>
                </Box>
              )}
              {safetyData.ld50 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minWidth: 0, p: 0.5, borderRadius: 1 }}>
                  <Typography variant="caption" color="text.secondary">LD50:</Typography>
                  <Typography variant="caption" sx={{ fontWeight: 500 }}>{safetyData.ld50}</Typography>
                </Box>
              )}
              {safetyData.nfpaRating && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">NFPA:</Typography>
                  <Chip label={safetyData.nfpaRating} size="small" sx={{ fontSize: '0.65rem', height: 18 }} />
                </Box>
              )}
            </Stack>
          )}
        </>
      )}

      {onGetSafetySummary && !safetyData?.ghsClassification && !aiSafetySummary && (
        <Box sx={{ mt: 1 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>No safety data from PubChem</Typography>
          <Box
            component="button"
            onClick={onGetSafetySummary}
            disabled={aiSafetyLoading}
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.5,
              border: 'none',
              background: 'none',
              cursor: aiSafetyLoading ? 'wait' : 'pointer',
              fontSize: '0.7rem',
              fontWeight: 500,
              color: 'primary.main',
              '&:hover': { textDecoration: 'underline' },
            }}
          >
            {aiSafetyLoading ? 'Generating...' : 'Get safety summary (AI)'}
          </Box>
        </Box>
      )}
    </Box>
  );
};
