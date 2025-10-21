/**
 * NMRWelcomePanel - Friendly introduction and quick start guide
 * 
 * Helps users understand how to:
 * - Load NMR data files
 * - Navigate the interface
 * - Perform basic tasks
 */

import React from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Stack,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Chip,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import TimelineIcon from '@mui/icons-material/Timeline';
import SaveIcon from '@mui/icons-material/Save';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

export interface NMRWelcomePanelProps {
  onDismiss: () => void;
  onDataLoaded?: () => void;
}

export const NMRWelcomePanel: React.FC<NMRWelcomePanelProps> = ({ onDismiss, onDataLoaded }) => {
  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 4,
        overflow: 'auto',
      }}
    >
      <Paper
        elevation={8}
        sx={{
          maxWidth: '900px',
          width: '100%',
          p: 4,
          borderRadius: '12px',
          position: 'relative',
        }}
      >
        {/* Close Button */}
        <IconButton
          onClick={onDismiss}
          sx={{
            position: 'absolute',
            right: 16,
            top: 16,
            color: 'text.secondary',
            '&:hover': {
              bgcolor: 'rgba(0, 0, 0, 0.05)',
            },
          }}
        >
          <CloseIcon />
        </IconButton>

        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Typography 
            variant="h4" 
            gutterBottom 
            sx={{ 
              fontWeight: 700,
              color: '#1976d2',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            📊 Welcome to NMR Analyzer
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.1rem' }}>
            Easily analyze your NMR spectra with our intuitive interface
          </Typography>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Quick Start Guide */}
        <Box sx={{ mb: 3 }}>
          <Typography 
            variant="h6" 
            gutterBottom 
            sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}
          >
            🚀 Quick Start Guide
          </Typography>
          
          <Stack spacing={2}>
            {/* Step 1: Load Data */}
            <Paper 
              variant="outlined" 
              sx={{ 
                p: 2,
                bgcolor: '#f5f9ff',
                borderColor: '#1976d2',
                borderWidth: 2,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                <Box 
                  sx={{ 
                    bgcolor: '#1976d2', 
                    color: 'white', 
                    borderRadius: '50%',
                    width: 32,
                    height: 32,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  1
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                    Load Your NMR Data
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2, lineHeight: 1.6 }}>
                    Click the <strong>📁 Open</strong> button in the top toolbar or simply <strong>drag and drop</strong> your files into the window.
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    <Chip label="Bruker Folders" size="small" color="primary" variant="outlined" />
                    <Chip label="JCAMP-DX (.dx, .jdx)" size="small" color="primary" variant="outlined" />
                    <Chip label="JEOL Files" size="small" color="primary" variant="outlined" />
                    <Chip label="Varian Files" size="small" color="primary" variant="outlined" />
                    <Chip label="ZIP Archives" size="small" color="primary" variant="outlined" />
                  </Stack>
                </Box>
              </Box>
            </Paper>

            {/* Step 2: View & Navigate */}
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                <Box 
                  sx={{ 
                    bgcolor: '#757575', 
                    color: 'white', 
                    borderRadius: '50%',
                    width: 32,
                    height: 32,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  2
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                    View & Navigate Your Spectrum
                  </Typography>
                  <List dense sx={{ mt: 1 }}>
                    <ListItem sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <ZoomInIcon sx={{ fontSize: 20 }} />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Zoom: Mouse wheel or pinch gesture"
                        primaryTypographyProps={{ fontSize: '0.95rem' }}
                      />
                    </ListItem>
                    <ListItem sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <TimelineIcon sx={{ fontSize: 20 }} />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Pan: Click and drag to move around"
                        primaryTypographyProps={{ fontSize: '0.95rem' }}
                      />
                    </ListItem>
                    <ListItem sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <HelpOutlineIcon sx={{ fontSize: 20 }} />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Hover over any button to see what it does"
                        primaryTypographyProps={{ fontSize: '0.95rem' }}
                      />
                    </ListItem>
                  </List>
                </Box>
              </Box>
            </Paper>

            {/* Step 3: INTEGRATE (MOST IMPORTANT!) */}
            <Paper 
              variant="outlined" 
              sx={{ 
                p: 2,
                bgcolor: '#fff3e0',
                borderColor: '#f57c00',
                borderWidth: 3,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                <Box 
                  sx={{ 
                    bgcolor: '#f57c00', 
                    color: 'white', 
                    borderRadius: '50%',
                    width: 32,
                    height: 32,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  3
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: '#f57c00' }}>
                    🎯 Integrate Your Peaks (MOST IMPORTANT!)
                  </Typography>
                  <Typography variant="body2" sx={{ lineHeight: 1.6, mb: 2 }}>
                    Integration is the KEY FEATURE for quantitative NMR analysis!
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                    ⚡ How to Integrate:
                  </Typography>
                  <Typography variant="body2" sx={{ lineHeight: 1.8, pl: 2 }}>
                    1. Look at the <strong>LEFT SIDEBAR</strong> of the spectrum viewer
                    <br />
                    2. Click the <strong>"Ranges"</strong> tool icon
                    <br />
                    3. Click <strong>"Auto ranges"</strong> button that appears
                    <br />
                    4. View results in the <strong>Integrals panel</strong> (right side)
                  </Typography>
                  <Typography variant="body2" sx={{ lineHeight: 1.6, mt: 1, fontStyle: 'italic', color: 'text.secondary' }}>
                    💡 For manual integration: Select ranges tool → Draw on spectrum with mouse
                  </Typography>
                </Box>
              </Box>
            </Paper>

            {/* Step 4: Other Analysis */}
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                <Box 
                  sx={{ 
                    bgcolor: '#757575', 
                    color: 'white', 
                    borderRadius: '50%',
                    width: 32,
                    height: 32,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  4
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                    Other Analysis & Export
                  </Typography>
                  <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                    • Click <strong>"Peaks"</strong> for automatic peak picking
                    <br />
                    • Export results as images or CSV data
                    <br />
                    • Save your project with the <strong>Save</strong> button
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Stack>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Mode Information */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            💡 Interface Modes
          </Typography>
          <Stack direction="row" spacing={2}>
            <Paper variant="outlined" sx={{ p: 2, flex: 1, bgcolor: '#f5f5f5' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                🎯 Simple Mode (Default)
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Shows only essential tools for quick analysis. Perfect for routine work!
              </Typography>
            </Paper>
            <Paper variant="outlined" sx={{ p: 2, flex: 1, bgcolor: '#f5f5f5' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                🔬 Advanced Mode
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Reveals all professional features for detailed processing and analysis.
              </Typography>
            </Paper>
          </Stack>
        </Box>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 4 }}>
          <Button
            variant="outlined"
            size="large"
            onClick={onDismiss}
            sx={{ 
              textTransform: 'none',
              px: 4,
              fontSize: '1rem',
            }}
          >
            Skip for Now
          </Button>
          <Button
            variant="contained"
            size="large"
            onClick={onDismiss}
            startIcon={<FolderOpenIcon />}
            sx={{ 
              textTransform: 'none',
              px: 4,
              fontSize: '1rem',
              fontWeight: 600,
            }}
          >
            Get Started
          </Button>
        </Box>

        {/* Tip */}
        <Box sx={{ mt: 3, p: 2, bgcolor: '#fff3e0', borderRadius: '8px' }}>
          <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <strong>💡 Pro Tip:</strong> You can show this guide anytime by clicking the help icon in the toolbar!
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default NMRWelcomePanel;

