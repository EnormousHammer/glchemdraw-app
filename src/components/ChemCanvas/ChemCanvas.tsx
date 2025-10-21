/**
 * ChemCanvas Component
 * Ketcher-based chemical structure drawing canvas
 */

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { Editor } from 'ketcher-react';
import { StandaloneStructServiceProvider } from 'ketcher-standalone';
import 'ketcher-react/dist/index.css';
import { Box, CircularProgress, Alert } from '@mui/material';

interface ChemCanvasProps {
  onStructureChange?: (molfile: string, smiles: string) => void;
  onError?: (error: Error) => void;
  initialStructure?: string;
  readonly?: boolean;
  onKetcherInit?: (instance: any) => void;
}

export const ChemCanvas: React.FC<ChemCanvasProps> = ({
  onStructureChange,
  onError,
  initialStructure,
  readonly = false,
  onKetcherInit,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const editorRef = useRef<any>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Create service provider once and never recreate
  const structServiceProvider = useMemo(() => new StandaloneStructServiceProvider() as any, []);
  
  // Static resources URL - memoized to prevent changes
  const staticResourcesUrl = useMemo(() => process.env.PUBLIC_URL || window.location.origin, []);

  useEffect(() => {
    // Only run once on mount
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  // Handle structure changes with 300ms debouncing for performance
  const handleStructureChange = useCallback(async () => {
    if (!editorRef.current || !onStructureChange) {
      return;
    }

    // Clear previous debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Debounce: Wait 300ms after last change before processing
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const molfile = await editorRef.current.getMolfile();
        const smiles = await editorRef.current.getSmiles();
        
        onStructureChange(molfile, smiles);
      } catch (err) {
        console.error('[ChemCanvas] Error getting structure:', err);
      }
    }, 300);
  }, [onStructureChange]);

  if (error) {
    return (
      <Box
        sx={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 3,
        }}
      >
        <Alert severity="error" sx={{ maxWidth: 600 }}>
          <strong>Chemical Editor Error</strong>
          <br />
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        bgcolor: 'background.paper',
      }}
    >
      {isLoading && (
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
            zIndex: 1000,
          }}
        >
          <CircularProgress />
        </Box>
      )}
      
      <Box
        sx={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          '& .Ketcher-root': {
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
          },
          // Ensure canvas area takes most space
          '& .Ketcher-root .canvas-container': {
            flex: '1 1 auto',
            minHeight: 0,
            overflow: 'hidden',
          },
          '& .Ketcher-root .canvas': {
            width: '100%',
            height: '100%',
          },
        }}
      >
        <Editor
          staticResourcesUrl={staticResourcesUrl}
          structServiceProvider={structServiceProvider}
          onInit={(ketcher) => {
            editorRef.current = ketcher;
            console.log('[ChemCanvas] Ketcher initialized');
            
            // Ensure proper layout
            setTimeout(() => {
              const ketcherRoot = document.querySelector('.Ketcher-root');
              if (ketcherRoot) {
                (ketcherRoot as HTMLElement).style.height = '100%';
                (ketcherRoot as HTMLElement).style.display = 'flex';
                (ketcherRoot as HTMLElement).style.flexDirection = 'column';
              }
              
            }, 100);
            
            // Subscribe to change events
            try {
              if (ketcher?.editor?.subscribe) {
                ketcher.editor.subscribe('change', handleStructureChange);
              }
            } catch (e) {
              console.warn('[ChemCanvas] Failed to subscribe change handler:', e);
            }
            // Expose instance to parent
            if (onKetcherInit) {
              onKetcherInit(ketcher);
            }
          }}
          errorHandler={(error: string) => {
            console.error('[ChemCanvas] Ketcher error:', error);
            if (onError) {
              onError(new Error(error));
            }
          }}
        />
      </Box>
    </Box>
  );
};

export default ChemCanvas;

