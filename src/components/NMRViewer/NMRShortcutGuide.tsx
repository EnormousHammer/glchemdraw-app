import React, { useState } from 'react';
import { Box, Paper, Typography, Chip, IconButton, Collapse } from '@mui/material';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

/**
 * Compact, collapsible guide showing NMRium keyboard shortcuts
 */
export const NMRShortcutGuide: React.FC = () => {
  const [expanded, setExpanded] = useState(false);
  const [hidden, setHidden] = useState(true); // Hidden by default to save space

  if (hidden) {
    return (
      <Paper
        elevation={3}
        sx={{
          position: 'absolute',
          top: 16,
          right: 16,
          p: 1,
          bgcolor: 'rgba(255, 255, 255, 0.95)',
          zIndex: 1000,
          cursor: 'pointer',
          pointerEvents: 'auto',
        }}
        onClick={() => setHidden(false)}
      >
        <KeyboardIcon sx={{ color: '#f57c00', fontSize: 24 }} />
      </Paper>
    );
  }

  return (
    <Paper
      elevation={3}
      sx={{
        position: 'absolute',
        top: 16,
        right: 16,
        p: 1.5,
        bgcolor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        maxWidth: expanded ? 320 : 240,
        zIndex: 1000,
        border: '2px solid #f57c00',
        pointerEvents: 'auto', // Allow interaction!
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <KeyboardIcon sx={{ color: '#f57c00', fontSize: 20 }} />
          <Typography variant="body2" sx={{ fontWeight: 700, color: '#f57c00' }}>
            Shortcuts
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <IconButton size="small" onClick={() => setExpanded(!expanded)}>
            {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
          </IconButton>
          <IconButton size="small" onClick={() => setHidden(true)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      <Typography variant="caption" sx={{ color: '#f57c00', display: 'block', mb: 1, fontWeight: 600 }}>
        ⚠️ Hover mouse over spectrum!
      </Typography>

      <Collapse in={expanded}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {/* Integration */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip 
            label="i" 
            size="small"
            sx={{ 
              bgcolor: '#f57c00', 
              color: 'white',
              fontWeight: 700,
              fontSize: 12,
              minWidth: 24,
              height: 24
            }} 
          />
          <Typography variant="caption">Integration</Typography>
        </Box>

        {/* Ranges */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip 
            label="r" 
            size="small"
            sx={{ 
              bgcolor: '#f57c00', 
              color: 'white',
              fontWeight: 700,
              fontSize: 12,
              minWidth: 24,
              height: 24
            }} 
          />
          <Typography variant="caption">Ranges</Typography>
        </Box>

        {/* Peak Picking */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip 
            label="p" 
            size="small"
            sx={{ 
              bgcolor: '#2196f3', 
              color: 'white',
              fontWeight: 700,
              fontSize: 12,
              minWidth: 24,
              height: 24
            }} 
          />
          <Typography variant="caption">Peaks</Typography>
        </Box>

        {/* Zoom Out */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip 
            label="f" 
            size="small"
            sx={{ 
              bgcolor: '#4caf50', 
              color: 'white',
              fontWeight: 700,
              fontSize: 12,
              minWidth: 24,
              height: 24
            }} 
          />
          <Typography variant="caption">Zoom Out</Typography>
        </Box>
      </Box>
      </Collapse>
    </Paper>
  );
};

