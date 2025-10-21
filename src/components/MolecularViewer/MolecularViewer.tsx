/**
 * Molecular Viewer Component
 * Displays 2D/3D molecular structures from PubChem
 */

import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  Stack,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  ThreeDRotation as ThreeDIcon,
  Image as TwoDIcon,
  Fullscreen as FullscreenIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { get2DImageURL } from '@lib/pubchem/cache';

interface MolecularViewerProps {
  cid?: number;
  smiles?: string;
  molfile?: string;
}

type ViewMode = '2d' | '3d' | 'ball-stick' | 'space-filling';

export const MolecularViewer: React.FC<MolecularViewerProps> = ({
  cid,
  smiles,
  molfile,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('2d');
  const [imageSize, setImageSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleViewChange = (event: React.SyntheticEvent, newValue: ViewMode) => {
    setViewMode(newValue);
  };

  const handleDownload = () => {
    if (!cid) return;
    const url = get2DImageURL(cid, imageSize);
    const link = document.createElement('a');
    link.href = url;
    link.download = `compound-${cid}-${viewMode}.png`;
    link.click();
  };

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 500);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const renderViewer = () => {
    if (!cid && !smiles && !molfile) {
      return (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: 400,
            bgcolor: 'grey.100',
            borderRadius: 1,
          }}
        >
          <Typography variant="body2" color="text.secondary">
            No structure available to display
          </Typography>
        </Box>
      );
    }

    if (error) {
      return (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      );
    }

    switch (viewMode) {
      case '2d':
        return (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: isFullscreen ? '80vh' : 400,
              bgcolor: 'white',
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'divider',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {isLoading ? (
              <CircularProgress />
            ) : cid ? (
              <img
                src={get2DImageURL(cid, imageSize)}
                alt={`2D structure of compound ${cid}`}
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                }}
                onError={() => setError('Failed to load 2D structure')}
              />
            ) : (
              <Typography variant="body2" color="text.secondary">
                CID required for PubChem images
              </Typography>
            )}
          </Box>
        );

      case '3d':
        return (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: isFullscreen ? '80vh' : 400,
              bgcolor: 'grey.900',
              borderRadius: 1,
              position: 'relative',
            }}
          >
            {cid ? (
              <iframe
                src={`https://pubchem.ncbi.nlm.nih.gov/compound/${cid}#section=3D-Conformer&embed=true`}
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  borderRadius: 4,
                }}
                title={`3D structure of compound ${cid}`}
              />
            ) : (
              <Typography variant="body2" color="white">
                CID required for 3D viewer
              </Typography>
            )}
          </Box>
        );

      case 'ball-stick':
        return (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: isFullscreen ? '80vh' : 400,
              bgcolor: 'grey.900',
              borderRadius: 1,
            }}
          >
            {cid ? (
              <iframe
                src={`https://embed.molview.org/v1/?mode=balls&cid=${cid}`}
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  borderRadius: 4,
                }}
                title={`Ball-and-stick model of compound ${cid}`}
              />
            ) : (
              <Typography variant="body2" color="white">
                CID required for ball-and-stick model
              </Typography>
            )}
          </Box>
        );

      case 'space-filling':
        return (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: isFullscreen ? '80vh' : 400,
              bgcolor: 'grey.900',
              borderRadius: 1,
            }}
          >
            {cid ? (
              <iframe
                src={`https://embed.molview.org/v1/?mode=vdw&cid=${cid}`}
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  borderRadius: 4,
                }}
                title={`Space-filling model of compound ${cid}`}
              />
            ) : (
              <Typography variant="body2" color="white">
                CID required for space-filling model
              </Typography>
            )}
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
      <Stack spacing={2}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">Molecular Viewer</Typography>
          <Stack direction="row" spacing={1}>
            <Tooltip title="Refresh">
              <IconButton size="small" onClick={handleRefresh} aria-label="Refresh viewer">
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}>
              <IconButton size="small" onClick={toggleFullscreen} aria-label="Toggle fullscreen">
                <FullscreenIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Download Image">
              <IconButton
                size="small"
                onClick={handleDownload}
                disabled={!cid || viewMode !== '2d'}
                aria-label="Download structure image"
              >
                <DownloadIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </Box>

        {/* View Mode Tabs */}
        <Tabs
          value={viewMode}
          onChange={handleViewChange}
          variant="scrollable"
          scrollButtons="auto"
          aria-label="Molecular view modes"
        >
          <Tab
            value="2d"
            label="2D Structure"
            icon={<TwoDIcon />}
            iconPosition="start"
            aria-label="2D structure view"
          />
          <Tab
            value="3d"
            label="3D Conformer"
            icon={<ThreeDIcon />}
            iconPosition="start"
            aria-label="3D conformer view"
          />
          <Tab
            value="ball-stick"
            label="Ball & Stick"
            icon={<ThreeDIcon />}
            iconPosition="start"
            aria-label="Ball and stick model"
          />
          <Tab
            value="space-filling"
            label="Space Filling"
            icon={<ThreeDIcon />}
            iconPosition="start"
            aria-label="Space filling model"
          />
        </Tabs>

        {/* Viewer */}
        {renderViewer()}

        {/* Info */}
        {cid && (
          <Typography variant="caption" color="text.secondary" align="center">
            PubChem CID: {cid} | {viewMode === '2d' ? '2D Structure' : '3D Interactive Model'}
          </Typography>
        )}
      </Stack>
    </Paper>
  );
};

export default MolecularViewer;

