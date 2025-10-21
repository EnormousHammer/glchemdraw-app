/**
 * NMRHelpSystem - Contextual help and documentation
 * 
 * Provides:
 * - Floating help button
 * - Quick reference guide
 * - Keyboard shortcuts
 * - Common tasks checklist
 */

import React, { useState } from 'react';
import {
  Box,
  Fab,
  Drawer,
  Typography,
  IconButton,
  Stack,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Divider,
  Paper,
} from '@mui/material';
import HelpIcon from '@mui/icons-material/Help';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import TimelineIcon from '@mui/icons-material/Timeline';
import SaveIcon from '@mui/icons-material/Save';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

export interface NMRHelpSystemProps {
  /** Initial open state */
  defaultOpen?: boolean;
}

export const NMRHelpSystem: React.FC<NMRHelpSystemProps> = ({ defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Floating Help Button */}
      <Fab
        color="primary"
        aria-label="help"
        onClick={handleToggle}
        sx={{
          position: 'fixed',
          bottom: 32,
          right: 32,
          zIndex: 1000,
          width: 64,
          height: 64,
          '&:hover': {
            transform: 'scale(1.1)',
          },
          transition: 'transform 0.2s ease',
        }}
      >
        <HelpIcon sx={{ fontSize: 32 }} />
      </Fab>

      {/* Help Drawer */}
      <Drawer
        anchor="right"
        open={isOpen}
        onClose={handleToggle}
        sx={{
          '& .MuiDrawer-paper': {
            width: { xs: '100%', sm: '450px' },
            p: 3,
          },
        }}
      >
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#1976d2' }}>
            📚 Help & Guide
          </Typography>
          <IconButton onClick={handleToggle}>
            <CloseIcon />
          </IconButton>
        </Box>

        <Stack spacing={2}>
          {/* Quick Start */}
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                🚀 Quick Start
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircleOutlineIcon color="success" />
                  </ListItemIcon>
                  <ListItemText
                    primary="1. Load Data"
                    secondary="Click 'Open Data' button or drag & drop files"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircleOutlineIcon color="success" />
                  </ListItemIcon>
                  <ListItemText
                    primary="2. Navigate"
                    secondary="Use mouse wheel to zoom, click & drag to pan"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircleOutlineIcon color="success" />
                  </ListItemIcon>
                  <ListItemText
                    primary="3. Analyze"
                    secondary="Click 'Auto Peak Pick' for automatic analysis"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircleOutlineIcon color="success" />
                  </ListItemIcon>
                  <ListItemText
                    primary="4. Export"
                    secondary="Save as image or export data as CSV"
                  />
                </ListItem>
              </List>
            </AccordionDetails>
          </Accordion>

          {/* Common Tasks */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                🎯 Common Tasks
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Stack spacing={2}>
                <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f5f9ff' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                    📁 Loading Data
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Supported formats:
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    <Chip label="Bruker" size="small" />
                    <Chip label="JCAMP-DX" size="small" />
                    <Chip label="JEOL" size="small" />
                    <Chip label="Varian" size="small" />
                  </Stack>
                </Paper>

                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                    🔍 Peak Picking
                  </Typography>
                  <Typography variant="body2">
                    • <strong>Auto:</strong> Click "Auto Peak Pick" button
                    <br />
                    • <strong>Manual:</strong> Use peak picking tool from toolbar
                    <br />
                    • <strong>Edit:</strong> Click peaks to adjust or delete
                  </Typography>
                </Paper>

                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                    📊 Integration
                  </Typography>
                  <Typography variant="body2">
                    • Select integration tool from toolbar
                    <br />
                    • Click and drag to define regions
                    <br />
                    • View results in the Integrals panel
                  </Typography>
                </Paper>

                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                    💾 Exporting Results
                  </Typography>
                  <Typography variant="body2">
                    • <strong>Image:</strong> PNG, SVG, or PDF format
                    <br />
                    • <strong>Data:</strong> CSV, Excel, or JSON
                    <br />
                    • <strong>Project:</strong> Save complete workspace
                  </Typography>
                </Paper>
              </Stack>
            </AccordionDetails>
          </Accordion>

          {/* Keyboard Shortcuts */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                ⌨️ Keyboard Shortcuts
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Stack spacing={1}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2">Zoom In</Typography>
                  <Chip label="+" size="small" />
                </Box>
                <Divider />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2">Zoom Out</Typography>
                  <Chip label="-" size="small" />
                </Box>
                <Divider />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2">Reset Zoom</Typography>
                  <Chip label="0" size="small" />
                </Box>
                <Divider />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2">Open File</Typography>
                  <Chip label="Ctrl + O" size="small" />
                </Box>
                <Divider />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2">Save</Typography>
                  <Chip label="Ctrl + S" size="small" />
                </Box>
                <Divider />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2">Help</Typography>
                  <Chip label="F1" size="small" />
                </Box>
              </Stack>
            </AccordionDetails>
          </Accordion>

          {/* Interface Modes */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                🎯 Interface Modes
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Stack spacing={2}>
                <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f5f9ff', borderColor: '#1976d2' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: '#1976d2' }}>
                    Simple Mode (Recommended)
                  </Typography>
                  <Typography variant="body2">
                    Shows only essential tools for quick analysis. Perfect for:
                    <br />
                    • Routine NMR analysis
                    <br />
                    • Quick peak picking
                    <br />
                    • Basic integration
                    <br />
                    • Fast export/save
                  </Typography>
                </Paper>

                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                    Advanced Mode
                  </Typography>
                  <Typography variant="body2">
                    Reveals all professional features including:
                    <br />
                    • Phase correction tools
                    <br />
                    • Baseline correction
                    <br />
                    • Advanced processing
                    <br />
                    • Multiple spectrum comparison
                    <br />
                    • 2D NMR tools
                  </Typography>
                </Paper>
              </Stack>
            </AccordionDetails>
          </Accordion>

          {/* Troubleshooting */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                🔧 Troubleshooting
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                    ❓ Can't see my spectrum?
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    • Try clicking the "Reset Zoom" button
                    <br />
                    • Check if the file format is supported
                    <br />
                    • Make sure the data loaded successfully
                  </Typography>
                </Box>
                <Divider />
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                    ❓ Peaks not detecting?
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    • Adjust the threshold in peak picking settings
                    <br />
                    • Try manual peak picking instead
                    <br />
                    • Check if baseline correction is needed
                  </Typography>
                </Box>
                <Divider />
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                    ❓ Interface too complex?
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    • Switch to "Simple Mode" using the toggle at the top
                    <br />
                    • This hides advanced features you don't need
                  </Typography>
                </Box>
              </Stack>
            </AccordionDetails>
          </Accordion>
        </Stack>

        {/* Footer */}
        <Box sx={{ mt: 4, p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            💡 <strong>Tip:</strong> Hover over any button in the toolbar to see what it does!
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Need more help? Check the official NMRium documentation or contact support.
          </Typography>
        </Box>
      </Drawer>
    </>
  );
};

export default NMRHelpSystem;


