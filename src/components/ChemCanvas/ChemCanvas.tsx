/**
 * ChemCanvas Component
 * Ketcher-based chemical structure drawing canvas
 */

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { Editor } from 'ketcher-react';
import { Box, CircularProgress, Alert } from '@mui/material';

// Dynamic import for ketcher-standalone to handle potential loading issues
let StandaloneStructServiceProvider: any = null;

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
  const isMountedRef = useRef(true);
  
  // State to track when StandaloneStructServiceProvider is loaded
  const [isKetcherStandaloneLoaded, setIsKetcherStandaloneLoaded] = useState(false);

  // Create service provider when StandaloneStructServiceProvider becomes available
  const structServiceProvider = useMemo(() => {
    try {
      console.log('[ChemCanvas] Creating StandaloneStructServiceProvider...');
      
      // Try to use the cached provider first
      if (StandaloneStructServiceProvider) {
        const provider = new StandaloneStructServiceProvider() as any;
        console.log('[ChemCanvas] StandaloneStructServiceProvider created successfully');
        return provider;
      }
      
      // If not cached, return null
      console.log('[ChemCanvas] StandaloneStructServiceProvider not available, returning null');
      return null;
    } catch (err) {
      console.error('[ChemCanvas] Failed to create struct service provider:', err);
      setError(`Failed to initialize chemical editor: ${err instanceof Error ? err.message : 'Unknown error'}`);
      return null;
    }
  }, [isKetcherStandaloneLoaded]);
  
  // Static resources URL - memoized to prevent changes
  const staticResourcesUrl = useMemo(() => process.env.PUBLIC_URL || window.location.origin, []);

  useEffect(() => {
    // Dynamically load ketcher-standalone
    const loadKetcherStandalone = async () => {
      try {
        console.log('[ChemCanvas] Loading ketcher-standalone...');
        const ketcherStandalone = await import('ketcher-standalone');
        StandaloneStructServiceProvider = ketcherStandalone.StandaloneStructServiceProvider;
        console.log('[ChemCanvas] ketcher-standalone loaded successfully');
        
        if (isMountedRef.current) {
          setIsKetcherStandaloneLoaded(true);
        }
      } catch (err) {
        console.error('[ChemCanvas] Failed to load ketcher-standalone:', err);
        if (isMountedRef.current) {
          setError('Failed to load chemical editor dependencies. Please refresh the page.');
        }
      }
    };

    loadKetcherStandalone();

    // Only run once on mount
    const timer = setTimeout(() => {
      if (isMountedRef.current) {
        console.log('[ChemCanvas] Loading timeout reached, setting loading to false');
        setIsLoading(false);
      }
    }, 3000); // Increased timeout to 3 seconds
    
    return () => {
      clearTimeout(timer);
      isMountedRef.current = false;
    };
  }, []);

  // Additional effect to handle service provider initialization
  useEffect(() => {
    if (structServiceProvider && isLoading) {
      console.log('[ChemCanvas] Service provider ready, stopping loading');
      setIsLoading(false);
    }
  }, [structServiceProvider, isLoading]);

  // Handle structure changes with 300ms debouncing for performance
  const handleStructureChange = useCallback(async () => {
    if (!editorRef.current || !onStructureChange || !isMountedRef.current) {
      return;
    }

    // Clear previous debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Debounce: Wait 300ms after last change before processing
    debounceTimerRef.current = setTimeout(async () => {
      if (!isMountedRef.current) return;
      
      try {
        const molfile = await editorRef.current.getMolfile();
        const smiles = await editorRef.current.getSmiles();
        
        if (isMountedRef.current && onStructureChange) {
          onStructureChange(molfile, smiles);
        }
      } catch (err) {
        console.error('[ChemCanvas] Error getting structure:', err);
        if (isMountedRef.current && onError) {
          onError(err as Error);
        }
      }
    }, 300);
  }, [onStructureChange, onError]);

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
      {(isLoading || !isKetcherStandaloneLoaded || !structServiceProvider) && (
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
            flexDirection: 'column',
            gap: 2,
          }}
        >
          <CircularProgress />
          <Box sx={{ textAlign: 'center', color: 'text.secondary' }}>
            {!isKetcherStandaloneLoaded ? 'Loading chemical editor...' : !structServiceProvider ? 'Initializing chemical editor...' : 'Loading...'}
          </Box>
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
        {structServiceProvider && (
          <Editor
            staticResourcesUrl={staticResourcesUrl}
            structServiceProvider={structServiceProvider}
          onInit={(ketcher) => {
            try {
              editorRef.current = ketcher;
              console.log('[ChemCanvas] Ketcher initialized successfully');
              
              // Stop loading immediately when Ketcher is ready
              if (isMountedRef.current) {
                setIsLoading(false);
              }
              
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
                  console.log('[ChemCanvas] Change handler subscribed');
                }
              } catch (e) {
                console.warn('[ChemCanvas] Failed to subscribe change handler:', e);
              }
              
              // Expose instance to parent
              if (onKetcherInit) {
                onKetcherInit(ketcher);
              }
            } catch (err) {
              console.error('[ChemCanvas] Error in Ketcher onInit:', err);
              if (isMountedRef.current) {
                setError(`Failed to initialize Ketcher: ${err instanceof Error ? err.message : 'Unknown error'}`);
              }
            }
          }}
          errorHandler={(error: string) => {
            console.error('[ChemCanvas] Ketcher error:', error);
            if (onError) {
              onError(new Error(error));
            }
          }}
          />
        )}
      </Box>
    </Box>
  );
};

export default ChemCanvas;

