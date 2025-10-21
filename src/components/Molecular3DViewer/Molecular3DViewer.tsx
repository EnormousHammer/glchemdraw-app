/**
 * Molecular3DViewer Component
 * Interactive 3D molecular viewer with rotation, zoom, and conformer analysis
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Tooltip,
  Stack,
  Chip,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  CircularProgress,
  Alert,
  Paper,
  Divider,
} from '@mui/material';
import {
  RotateLeft as RotateLeftIcon,
  RotateRight as RotateRightIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  CenterFocusStrong as CenterIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  Science as ChemistryIcon,
  ViewInAr as View3DIcon,
} from '@mui/icons-material';

interface Molecular3DViewerProps {
  smiles?: string;
  molfile?: string;
  onError?: (error: Error) => void;
  height?: string | number;
}

interface Conformer {
  id: number;
  energy: number;
  smiles: string;
  isSelected: boolean;
}

export const Molecular3DViewer: React.FC<Molecular3DViewerProps> = ({
  smiles,
  molfile,
  onError,
  height = '400px',
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [rotationSpeed, setRotationSpeed] = useState(1);
  const [zoomLevel, setZoomLevel] = useState(50);
  const [viewMode, setViewMode] = useState<'ball-stick' | 'space-fill' | 'wireframe' | 'surface'>('ball-stick');
  const [conformers, setConformers] = useState<Conformer[]>([]);
  const [selectedConformer, setSelectedConformer] = useState<number>(0);
  const [showSettings, setShowSettings] = useState(false);
  
  const viewerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);

  // Mock 3D viewer implementation (replace with actual 3D library)
  const initialize3DViewer = useCallback(async () => {
    if (!smiles && !molfile) {
      setConformers([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Simulate 3D structure generation and conformer analysis
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock conformers data
      const mockConformers: Conformer[] = [
        { id: 0, energy: -12.5, smiles: smiles || '', isSelected: true },
        { id: 1, energy: -11.8, smiles: smiles || '', isSelected: false },
        { id: 2, energy: -10.9, smiles: smiles || '', isSelected: false },
        { id: 3, energy: -9.7, smiles: smiles || '', isSelected: false },
      ];
      
      setConformers(mockConformers);
      setSelectedConformer(0);
      
    } catch (err) {
      const errorMessage = (err as Error).message || 'Failed to generate 3D structure';
      setError(errorMessage);
      if (onError) {
        onError(new Error(errorMessage));
      }
    } finally {
      setIsLoading(false);
    }
  }, [smiles, molfile, onError]);

  useEffect(() => {
    initialize3DViewer();
  }, [initialize3DViewer]);

  const handleRotate = (direction: 'left' | 'right') => {
    // Mock rotation - in real implementation, this would rotate the 3D model
    console.log(`Rotating ${direction}`);
  };

  const handleZoom = (direction: 'in' | 'out') => {
    const newZoom = direction === 'in' 
      ? Math.min(zoomLevel + 10, 100)
      : Math.max(zoomLevel - 10, 0);
    setZoomLevel(newZoom);
  };

  const handleCenter = () => {
    // Mock center - in real implementation, this would center the 3D model
    console.log('Centering view');
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      setIsPlaying(false);
    } else {
      // Mock animation - in real implementation, this would start rotating the model
      const animate = () => {
        console.log('Animating 3D model');
        if (isPlaying) {
          animationRef.current = requestAnimationFrame(animate);
        }
      };
      setIsPlaying(true);
      animate();
    }
  };

  const handleStop = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    setIsPlaying(false);
  };

  const handleConformerSelect = (conformerId: number) => {
    setConformers(prev => 
      prev.map(conf => ({ ...conf, isSelected: conf.id === conformerId }))
    );
    setSelectedConformer(conformerId);
  };

  const handleViewModeChange = (mode: string) => {
    setViewMode(mode as any);
  };

  if (error) {
    return (
      <Card sx={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Alert severity="error" sx={{ maxWidth: 400 }}>
          <strong>3D Viewer Error</strong>
          <br />
          {error}
        </Alert>
      </Card>
    );
  }

  return (
    <Card sx={{ height, display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <View3DIcon color="primary" />
            <Typography variant="h6">3D Molecular Viewer</Typography>
          </Stack>
          <IconButton
            size="small"
            onClick={() => setShowSettings(!showSettings)}
            color={showSettings ? 'primary' : 'default'}
          >
            <SettingsIcon />
          </IconButton>
        </Stack>

        {/* 3D Viewer Area */}
        <Box
          ref={viewerRef}
          sx={{
            flexGrow: 1,
            bgcolor: 'background.default',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 2,
            minHeight: '200px',
          }}
        >
          {isLoading ? (
            <Stack direction="row" spacing={2} alignItems="center">
              <CircularProgress size={24} />
              <Typography variant="body2" color="text.secondary">
                Generating 3D structure...
              </Typography>
            </Stack>
          ) : !smiles && !molfile ? (
            <Stack alignItems="center" spacing={1}>
              <ChemistryIcon sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.5 }} />
              <Typography variant="body2" color="text.secondary">
                No structure to display
              </Typography>
            </Stack>
          ) : (
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary" sx={{ mb: 1 }}>
                3D Viewer
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Interactive 3D molecular visualization
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                (Mock implementation - integrate with 3D library)
              </Typography>
            </Box>
          )}
        </Box>

        {/* Controls */}
        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
          <Tooltip title="Rotate Left">
            <IconButton size="small" onClick={() => handleRotate('left')}>
              <RotateLeftIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Rotate Right">
            <IconButton size="small" onClick={() => handleRotate('right')}>
              <RotateRightIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Zoom In">
            <IconButton size="small" onClick={() => handleZoom('in')}>
              <ZoomInIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Zoom Out">
            <IconButton size="small" onClick={() => handleZoom('out')}>
              <ZoomOutIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Center View">
            <IconButton size="small" onClick={handleCenter}>
              <CenterIcon />
            </IconButton>
          </Tooltip>
          <Divider orientation="vertical" flexItem />
          <Tooltip title={isPlaying ? "Pause" : "Play"}>
            <IconButton size="small" onClick={handlePlayPause}>
              {isPlaying ? <PauseIcon /> : <PlayIcon />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Stop">
            <IconButton size="small" onClick={handleStop}>
              <StopIcon />
            </IconButton>
          </Tooltip>
        </Stack>

        {/* Settings Panel */}
        {showSettings && (
          <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              View Settings
            </Typography>
            <Stack spacing={2}>
              <FormControl fullWidth size="small">
                <InputLabel>View Mode</InputLabel>
                <Select
                  value={viewMode}
                  onChange={(e) => handleViewModeChange(e.target.value)}
                  label="View Mode"
                >
                  <MenuItem value="ball-stick">Ball & Stick</MenuItem>
                  <MenuItem value="space-fill">Space Fill</MenuItem>
                  <MenuItem value="wireframe">Wireframe</MenuItem>
                  <MenuItem value="surface">Surface</MenuItem>
                </Select>
              </FormControl>
              
              <Box>
                <Typography variant="body2" gutterBottom>
                  Rotation Speed: {rotationSpeed}x
                </Typography>
                <Slider
                  value={rotationSpeed}
                  onChange={(_, value) => setRotationSpeed(value as number)}
                  min={0}
                  max={5}
                  step={0.5}
                  size="small"
                />
              </Box>
              
              <Box>
                <Typography variant="body2" gutterBottom>
                  Zoom Level: {zoomLevel}%
                </Typography>
                <Slider
                  value={zoomLevel}
                  onChange={(_, value) => setZoomLevel(value as number)}
                  min={0}
                  max={100}
                  step={5}
                  size="small"
                />
              </Box>
            </Stack>
          </Paper>
        )}

        {/* Conformers */}
        {conformers.length > 0 && (
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Conformers ({conformers.length})
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {conformers.map((conformer) => (
                <Chip
                  key={conformer.id}
                  label={`Conf ${conformer.id + 1} (${conformer.energy.toFixed(1)} kcal/mol)`}
                  onClick={() => handleConformerSelect(conformer.id)}
                  color={conformer.isSelected ? 'primary' : 'default'}
                  variant={conformer.isSelected ? 'filled' : 'outlined'}
                  size="small"
                />
              ))}
            </Stack>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default Molecular3DViewer;
