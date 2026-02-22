/**
 * BondTypeBar - ChemDraw-style bond type selector
 *
 * CRITICAL for ChemDraw parity:
 * - Visible toolbar for Single, Double, Triple, Wedge Up, Wedge Down, Wavy
 * - Appears when bond(s) selected: change selected bond type
 * - Always visible: set bond type for next bond to draw (when Bond tool active)
 *
 * Uses ketcher-core: fromBondsAttrs, Bond.PATTERN
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Tooltip,
  IconButton,
  Typography,
  Paper,
  alpha,
} from '@mui/material';
import {
  Remove as SingleIcon,
  MoreHoriz as DoubleIcon,
  FilterNone as TripleIcon,
  TrendingUp as WedgeUpIcon,
  TrendingDown as WedgeDownIcon,
  Waves as WavyIcon,
} from '@mui/icons-material';
import { Bond, fromBondsAttrs } from 'ketcher-core';

export type BondTypeId =
  | 'single'
  | 'double'
  | 'triple'
  | 'wedge-up'
  | 'wedge-down'
  | 'wavy';

interface BondTypeBarProps {
  ketcherRef: React.RefObject<any>;
  /** When true, bar is for changing selected bonds. When false, for setting draw mode. */
  hasBondSelection?: boolean;
  /** Compact mode for inline display */
  compact?: boolean;
}

const BOND_TYPES: { id: BondTypeId; label: string; icon: React.ReactNode; type: number; stereo: number }[] = [
  { id: 'single', label: 'Single (1)', icon: <SingleIcon sx={{ fontSize: 18 }} />, type: Bond.PATTERN.TYPE.SINGLE, stereo: Bond.PATTERN.STEREO.NONE },
  { id: 'double', label: 'Double (2)', icon: <DoubleIcon sx={{ fontSize: 18 }} />, type: Bond.PATTERN.TYPE.DOUBLE, stereo: Bond.PATTERN.STEREO.NONE },
  { id: 'triple', label: 'Triple (3)', icon: <TripleIcon sx={{ fontSize: 18 }} />, type: Bond.PATTERN.TYPE.TRIPLE, stereo: Bond.PATTERN.STEREO.NONE },
  { id: 'wedge-up', label: 'Wedge up', icon: <WedgeUpIcon sx={{ fontSize: 18 }} />, type: Bond.PATTERN.TYPE.SINGLE, stereo: Bond.PATTERN.STEREO.UP },
  { id: 'wedge-down', label: 'Wedge down (hash)', icon: <WedgeDownIcon sx={{ fontSize: 18 }} />, type: Bond.PATTERN.TYPE.SINGLE, stereo: Bond.PATTERN.STEREO.DOWN },
  { id: 'wavy', label: 'Wavy (either)', icon: <WavyIcon sx={{ fontSize: 18 }} />, type: Bond.PATTERN.TYPE.SINGLE, stereo: Bond.PATTERN.STEREO.EITHER },
];

export const BondTypeBar: React.FC<BondTypeBarProps> = ({
  ketcherRef,
  compact = false,
}) => {
  const [selectedBondIds, setSelectedBondIds] = useState<number[]>([]);
  const [activeDrawType, setActiveDrawType] = useState<BondTypeId | null>('single');

  const applyBondType = useCallback(
    (bondTypeId: BondTypeId) => {
      const ketcher = ketcherRef?.current;
      if (!ketcher?.editor) return;

      const def = BOND_TYPES.find((b) => b.id === bondTypeId);
      if (!def) return;

      const editor = ketcher.editor;
      const restruct = (editor as any).render?.ctab;
      if (!restruct) return; // Macromolecules mode or editor not ready

      if (selectedBondIds.length > 0) {
        try {
          const action = fromBondsAttrs(restruct, selectedBondIds, {
            type: def.type,
            stereo: def.stereo,
          } as any);
          editor.update(action);
          setActiveDrawType(bondTypeId);
        } catch (err) {
          console.warn('[BondTypeBar] fromBondsAttrs failed:', err);
        }
      } else {
        setActiveDrawType(bondTypeId);
        const toolMap: Record<BondTypeId, string> = {
          single: 'bond-single',
          double: 'bond-double',
          triple: 'bond-triple',
          'wedge-up': 'bond-up',
          'wedge-down': 'bond-down',
          wavy: 'bond-updown',
        };
        const toolName = toolMap[bondTypeId];
        if (toolName && typeof editor.tool === 'function') {
          editor.tool(toolName);
        }
      }
    },
    [ketcherRef, selectedBondIds]
  );

  useEffect(() => {
    const ketcher = ketcherRef?.current;
    if (!ketcher?.editor?.event?.selectionChange) return;

    const handler = () => {
      const sel = ketcher.editor.selection?.();
      const bonds = sel?.bonds ?? [];
      setSelectedBondIds(Array.isArray(bonds) ? bonds : []);
    };

    const sub = ketcher.editor.event.selectionChange.add(handler);
    handler();
    return () => {
      try {
        sub?.detach?.();
      } catch (_) {}
    };
  }, [ketcherRef]);

  const hasBondSelection = selectedBondIds.length > 0;

  return (
    <Paper
      elevation={1}
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.25,
        p: 0.5,
        borderRadius: 1,
        bgcolor: (t) => alpha(t.palette.primary.main, 0.06),
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      {!compact && (
        <Typography variant="caption" sx={{ px: 0.5, color: 'text.secondary', fontSize: '0.7rem' }}>
          {hasBondSelection ? `Bond${selectedBondIds.length > 1 ? 's' : ''}` : 'Draw'}
        </Typography>
      )}
      {BOND_TYPES.map((bt) => (
        <Tooltip key={bt.id} title={bt.label} arrow placement="top">
          <IconButton
            size="small"
            onClick={() => applyBondType(bt.id)}
            sx={{
              width: 32,
              height: 32,
              color: activeDrawType === bt.id ? 'primary.main' : 'text.secondary',
              bgcolor: activeDrawType === bt.id ? (t) => alpha(t.palette.primary.main, 0.12) : 'transparent',
              '&:hover': {
                bgcolor: (t) => alpha(t.palette.primary.main, 0.08),
              },
            }}
            aria-label={bt.label}
          >
            {bt.icon}
          </IconButton>
        </Tooltip>
      ))}
    </Paper>
  );
};

export default BondTypeBar;
