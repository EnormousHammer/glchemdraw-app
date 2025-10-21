/**
 * NMRSimpleToolbar - Simplified toolbar for essential NMR actions
 * 
 * Features:
 * - Large, clear buttons with icons AND text labels
 * - Informative tooltips on hover
 * - Grouped by function for easy navigation
 * - Only shows essential tools (no overwhelming options)
 */

import React from 'react';
import {
  Box,
  Paper,
  Button,
  Divider,
  Tooltip,
  Stack,
  Typography,
} from '@mui/material';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import SaveIcon from '@mui/icons-material/Save';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import CenterFocusStrongIcon from '@mui/icons-material/CenterFocusStrong';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import TimelineIcon from '@mui/icons-material/Timeline';
import DownloadIcon from '@mui/icons-material/Download';
import ImageIcon from '@mui/icons-material/Image';
import TableChartIcon from '@mui/icons-material/TableChart';
import HelpIcon from '@mui/icons-material/Help';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import FunctionsIcon from '@mui/icons-material/Functions';

export interface NMRSimpleToolbarProps {
  onOpenFile?: () => void;
  onSaveProject?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onZoomReset?: () => void;
  onExportImage?: () => void;
  onExportData?: () => void;
  onShowHelp?: () => void;
}

export const NMRSimpleToolbar: React.FC<NMRSimpleToolbarProps> = ({
  onOpenFile,
  onSaveProject,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onExportImage,
  onExportData,
  onShowHelp,
}) => {
  return (
    <Paper
      elevation={0}
      sx={{
        borderBottom: '1px solid #e0e0e0',
        px: 1.5,
        py: 0.75,
        bgcolor: '#ffffff',
      }}
    >
      <Stack 
        direction="row" 
        spacing={0.5}
        alignItems="center"
        flexWrap="wrap"
        useFlexGap
      >
        {/* File Operations Group - Compact */}
        <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
          <Tooltip 
            title="Open NMR data files or folders (Bruker, JCAMP, JEOL, etc.)"
            arrow
            placement="bottom"
          >
            <Button
              variant="contained"
              size="small"
              startIcon={<FolderOpenIcon sx={{ fontSize: 16 }} />}
              onClick={onOpenFile}
              sx={{
                textTransform: 'none',
                fontSize: '0.875rem',
                fontWeight: 600,
                px: 1.5,
                py: 0.5,
                minHeight: '32px',
                bgcolor: '#1976d2',
                '&:hover': {
                  bgcolor: '#1565c0',
                },
              }}
            >
              Open
            </Button>
          </Tooltip>

          <Tooltip 
            title="Save your current work"
            arrow
            placement="bottom"
          >
            <Button
              variant="outlined"
              size="small"
              startIcon={<SaveIcon sx={{ fontSize: 16 }} />}
              onClick={onSaveProject}
              sx={{
                textTransform: 'none',
                fontSize: '0.875rem',
                fontWeight: 600,
                px: 1.5,
                py: 0.5,
                minHeight: '32px',
              }}
            >
              Save
            </Button>
          </Tooltip>
        </Box>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5, height: '32px', alignSelf: 'center' }} />

        {/* View Controls Group - Compact */}
        <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
          <Tooltip 
            title="Zoom in"
            arrow
            placement="bottom"
          >
            <Button
              variant="outlined"
              size="small"
              onClick={onZoomIn}
              sx={{
                minWidth: '32px',
                height: '32px',
                p: 0.5,
              }}
            >
              <ZoomInIcon sx={{ fontSize: 18 }} />
            </Button>
          </Tooltip>

          <Tooltip 
            title="Zoom out"
            arrow
            placement="bottom"
          >
            <Button
              variant="outlined"
              size="small"
              onClick={onZoomOut}
              sx={{
                minWidth: '32px',
                height: '32px',
                p: 0.5,
              }}
            >
              <ZoomOutIcon sx={{ fontSize: 18 }} />
            </Button>
          </Tooltip>

          <Tooltip 
            title="Reset zoom"
            arrow
            placement="bottom"
          >
            <Button
              variant="outlined"
              size="small"
              onClick={onZoomReset}
              sx={{
                minWidth: '32px',
                height: '32px',
                p: 0.5,
              }}
            >
              <CenterFocusStrongIcon sx={{ fontSize: 18 }} />
            </Button>
          </Tooltip>
        </Box>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5, height: '32px', alignSelf: 'center' }} />

        {/* KEYBOARD SHORTCUT TIP - COMPACT */}
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', px: 1.5, bgcolor: '#fff3e0', borderRadius: '4px', py: 0.5 }}>
          <KeyboardIcon sx={{ fontSize: 18, color: '#f57c00' }} />
          <Typography variant="caption" sx={{ fontWeight: 600, color: '#f57c00' }}>
            Press <strong>r</strong>=Ranges, <strong>i</strong>=Integration, <strong>p</strong>=Peaks (hover mouse!)
          </Typography>
        </Box>

        {/* Export Group - Compact */}
        <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
          <Tooltip 
            title="Export as image"
            arrow
            placement="bottom"
          >
            <Button
              variant="outlined"
              size="small"
              onClick={onExportImage}
              sx={{
                minWidth: '32px',
                height: '32px',
                p: 0.5,
              }}
            >
              <ImageIcon sx={{ fontSize: 18 }} />
            </Button>
          </Tooltip>

          <Tooltip 
            title="Export data"
            arrow
            placement="bottom"
          >
            <Button
              variant="outlined"
              size="small"
              onClick={onExportData}
              sx={{
                minWidth: '32px',
                height: '32px',
                p: 0.5,
              }}
            >
              <TableChartIcon sx={{ fontSize: 18 }} />
            </Button>
          </Tooltip>
        </Box>

        {/* Flexible spacer */}
        <Box sx={{ flex: 1 }} />

        {/* Help Button - Compact */}
        <Tooltip 
          title="Show help"
          arrow
          placement="bottom"
        >
          <Button
            variant="text"
            size="small"
            startIcon={<HelpIcon sx={{ fontSize: 16 }} />}
            onClick={onShowHelp}
            sx={{
              textTransform: 'none',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: '#1976d2',
              px: 1.5,
              py: 0.5,
              minHeight: '32px',
            }}
          >
            Help
          </Button>
        </Tooltip>
      </Stack>
    </Paper>
  );
};

export default NMRSimpleToolbar;

