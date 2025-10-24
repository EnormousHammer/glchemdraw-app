/**
 * NMR Keyboard Shortcuts Display Component
 * Shows keyboard shortcuts in the NMRium header empty space
 */

import React from 'react';
import { Box, Typography, Tooltip } from '@mui/material';

export const NMRKeyboardShortcuts: React.FC = () => {
  const shortcuts = [
    { key: 'R', label: 'Ranges' },
    { key: 'P', label: 'Peak Picking' },
    { key: 'Z', label: 'Zoom' },
    { key: 'I', label: 'Integral' },
    { key: 'Shift+Drag', label: 'Pan View' }
  ];

  return (
    <Box 
      id="nmr-shortcuts-display"
      sx={{
        display: 'flex',
        gap: 1.5,
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
        py: 0.5,
        bgcolor: 'transparent'
      }}
    >
      <Typography
        variant="caption"
        sx={{
          fontSize: '0.75rem',
          fontWeight: 600,
          color: 'text.secondary',
          opacity: 0.8
        }}
      >
        Shortcuts:
      </Typography>
      {shortcuts.map((shortcut) => (
        <Tooltip 
          key={shortcut.key} 
          title={`${shortcut.key}: ${shortcut.label}`}
          arrow
          placement="bottom"
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              cursor: 'help'
            }}
          >
            <Box
              sx={{
                px: 0.75,
                py: 0.25,
                bgcolor: 'primary.main',
                color: 'white',
                borderRadius: 0.5,
                fontSize: '0.7rem',
                fontWeight: 700,
                fontFamily: 'monospace',
                lineHeight: 1.2,
                minWidth: shortcut.key.includes('+') ? 'auto' : '20px',
                textAlign: 'center',
                boxShadow: '0 1px 3px rgba(0,0,0,0.12)'
              }}
            >
              {shortcut.key}
            </Box>
            <Typography
              variant="caption"
              sx={{
                fontSize: '0.65rem',
                color: 'text.secondary',
                whiteSpace: 'nowrap'
              }}
            >
              {shortcut.label}
            </Typography>
          </Box>
        </Tooltip>
      ))}
    </Box>
  );
};

export default NMRKeyboardShortcuts;

