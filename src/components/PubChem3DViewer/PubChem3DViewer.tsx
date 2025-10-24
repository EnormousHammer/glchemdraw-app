import React, { useEffect, useRef, useState } from 'react';
import { Box, ToggleButtonGroup, ToggleButton, CircularProgress, Alert } from '@mui/material';

interface PubChem3DViewerProps {
  cid: number;
}

type RenderStyle = 'stick' | 'sphere' | 'line';

export const PubChem3DViewer: React.FC<PubChem3DViewerProps> = ({ cid }) => {
  const viewerRef = useRef<HTMLDivElement>(null);
  const [viewer, setViewer] = useState<any>(null);
  const [style, setStyle] = useState<RenderStyle>('stick');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!viewerRef.current) return;

    const loadViewer = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load 3Dmol dynamically
        const $3Dmol = (window as any).$3Dmol;
        if (!$3Dmol) {
          throw new Error('3Dmol library not loaded');
        }

        // Create viewer
        const config = { backgroundColor: 'black' };
        const viewerInstance = $3Dmol.createViewer(viewerRef.current, config);

        // Fetch 3D structure from PubChem
        const response = await fetch(
          `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/record/SDF/?record_type=3d`
        );

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('No 3D structure available for this compound');
          }
          throw new Error('Failed to fetch 3D structure from PubChem');
        }

        const sdfData = await response.text();
        
        if (!sdfData || sdfData.trim().length === 0) {
          throw new Error('No 3D structure data available');
        }

        // Add model to viewer
        viewerInstance.addModel(sdfData, 'sdf');
        
        // Set initial style
        viewerInstance.setStyle({}, { stick: {} });
        
        // Zoom to fit
        viewerInstance.zoomTo();
        viewerInstance.render();

        setViewer(viewerInstance);
        setLoading(false);
      } catch (err) {
        console.error('Error loading 3D viewer:', err);
        setError(err instanceof Error ? err.message : 'Failed to load 3D structure');
        setLoading(false);
      }
    };

    loadViewer();
  }, [cid]);

  useEffect(() => {
    if (!viewer) return;

    // Update style when changed
    viewer.setStyle({}, getStyleConfig(style));
    viewer.render();
  }, [style, viewer]);

  const getStyleConfig = (styleType: RenderStyle) => {
    switch (styleType) {
      case 'stick':
        return { stick: { radius: 0.15 } };
      case 'sphere':
        return { sphere: { scale: 0.3 } };
      case 'line':
        return { line: {} };
      default:
        return { stick: {} };
    }
  };

  const handleStyleChange = (_: React.MouseEvent<HTMLElement>, newStyle: RenderStyle | null) => {
    if (newStyle !== null) {
      setStyle(newStyle);
    }
  };

  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 1, borderBottom: 1, borderColor: 'divider' }}>
        <ToggleButtonGroup
          value={style}
          exclusive
          onChange={handleStyleChange}
          size="small"
        >
          <ToggleButton value="stick">Ball & Stick</ToggleButton>
          <ToggleButton value="sphere">Space-Filling</ToggleButton>
          <ToggleButton value="line">Wireframe</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <Box sx={{ flex: 1, position: 'relative' }}>
        {loading && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'background.paper',
              zIndex: 1,
            }}
          >
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Box sx={{ p: 2 }}>
            <Alert severity="error">{error}</Alert>
          </Box>
        )}

        <div
          ref={viewerRef}
          style={{
            width: '100%',
            height: '100%',
            position: 'relative',
          }}
        />
      </Box>
    </Box>
  );
};

export default PubChem3DViewer;

