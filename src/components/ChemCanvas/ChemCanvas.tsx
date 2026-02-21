/**
 * ChemCanvas Component
 * Ketcher-based chemical structure drawing canvas
 */

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { Editor } from 'ketcher-react';
import { OcsrStructServiceProvider } from '../../lib/chemistry/OcsrStructServiceProvider';
import 'ketcher-react/dist/index.css';
import { Box, CircularProgress, Alert } from '@mui/material';
import { useCopyImageToClipboard } from '../../hooks/useCopyImageToClipboard';
import { useImagePasteIntoSketch } from '../../hooks/useImagePasteIntoSketch';

interface ChemCanvasProps {
  onStructureChange?: (molfile: string, smiles: string) => void;
  onSelectionChange?: (molfile: string | null, smiles: string | null) => void;
  onError?: (error: Error) => void;
  initialStructure?: string;
  readonly?: boolean;
  onKetcherInit?: (instance: any) => void;
  onCopyImageSuccess?: () => void;
}

export const ChemCanvas: React.FC<ChemCanvasProps> = ({
  onStructureChange,
  onSelectionChange,
  onError,
  initialStructure,
  readonly = false,
  onKetcherInit,
  onCopyImageSuccess,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const editorRef = useRef<any>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Ctrl+C copies structure as image (uses Tauri native clipboard when in desktop app)
  useCopyImageToClipboard(editorRef, { onCopySuccess: onCopyImageSuccess });
  // Paste: image or structure (Ctrl+V and Paste button)
  useImagePasteIntoSketch(editorRef);

  // Block Ketcher About/FAQ/Info modal - white cover + auto-close so nothing appears
  useEffect(() => {
    const coverKetcherInfoModal = () => {
      document.querySelectorAll('[role="dialog"], .bp6-dialog, .bp6-overlay').forEach((el) => {
        const html = el.innerHTML || '';
        if (html.includes('epam.com') || html.includes('build-version') || (html.includes('Ketcher') && html.includes('Feedback'))) {
          const overlay = el.closest('.bp6-overlay') || el;
          const t = overlay as HTMLElement;
          t.style.setProperty('background', '#fff', 'important');
          t.style.setProperty('backdrop-filter', 'none', 'important');
          t.querySelectorAll('*').forEach((child) => {
            (child as HTMLElement).style.setProperty('visibility', 'hidden', 'important');
          });
          try {
            (t.querySelector('.bp6-overlay-backdrop') as HTMLElement)?.click?.();
          } catch (_) { /* ignore */ }
        }
      });
    };
    const observer = new MutationObserver(coverKetcherInfoModal);
    observer.observe(document.body, { childList: true, subtree: true });
    coverKetcherInfoModal();
    return () => observer.disconnect();
  }, []);
  
  // Create service provider once: standalone + OCSR via /api/ocsr (Vercel)
  const structServiceProvider = useMemo(() => new OcsrStructServiceProvider() as any, []);
  
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
  // Issue #2: When selection exists, show selected structure; else show full canvas
  const handleStructureChange = useCallback(async () => {
    if (!editorRef.current) return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const ketcher = editorRef.current;
        const molfile = await ketcher.getMolfile();
        const smiles = await ketcher.getSmiles();
        if (onStructureChange) onStructureChange(molfile, smiles);

        // Issue #2: After full canvas update, check selection - show selected struct if any
        if (onSelectionChange && ketcher?.editor?.structSelected) {
          try {
            const struct = ketcher.editor.structSelected();
            if (struct && !struct.isBlank?.()) {
              const { getStructure } = await import('ketcher-core');
              const { SupportedFormat } = await import('ketcher-core');
              const selMolfile = await getStructure(
                ketcher.id,
                ketcher.formatterFactory,
                struct,
                SupportedFormat.molAuto
              );
              const { molfileToSmiles } = await import('../../lib/chemistry/rdkit');
              const selSmiles = await molfileToSmiles(selMolfile);
              onSelectionChange(selMolfile, selSmiles || null);
              return;
            }
          } catch (_) { /* fall through to no selection */ }
          onSelectionChange(null, null);
        }
      } catch (err) {
        console.error('[ChemCanvas] Error getting structure:', err);
      }
    }, 300);
  }, [onStructureChange, onSelectionChange]);

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
            console.log('[ChemCanvas] Canvas initialized');
            
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

            // Subscribe to selection change (Issue #2: chemical info for selected structure only)
            // Ketcher uses editor.event.selectionChange (singular "event")
            const emitSelectionOrFull = async () => {
              if (!onSelectionChange) return;
              const editor = ketcher.editor;
              try {
                if (editor?.structSelected) {
                  const struct = editor.structSelected();
                  if (struct && !struct.isBlank?.()) {
                    const { getStructure } = await import('ketcher-core');
                    const { SupportedFormat } = await import('ketcher-core');
                    const molfile = await getStructure(
                      ketcher.id,
                      ketcher.formatterFactory,
                      struct,
                      SupportedFormat.molAuto
                    );
                    const { molfileToSmiles } = await import('../../lib/chemistry/rdkit');
                    const smiles = await molfileToSmiles(molfile);
                    onSelectionChange(molfile, smiles || null);
                    return;
                  }
                }
              } catch (err) {
                console.warn('[ChemCanvas] Selection to SMILES failed:', err);
              }
              onSelectionChange(null, null);
            };
            try {
              const ev = (ketcher?.editor as any)?.event;
              if (ev?.selectionChange?.add && onSelectionChange) {
                ev.selectionChange.add(emitSelectionOrFull);
              }
              if (ketcher?.editor?.subscribe && onSelectionChange) {
                ketcher.editor.subscribe('selectionChange', emitSelectionOrFull);
              }
            } catch (e) {
              console.warn('[ChemCanvas] Failed to subscribe selection handler:', e);
            }
            // Expose instance to parent
            if (onKetcherInit) {
              onKetcherInit(ketcher);
            }
          }}
          errorHandler={(error: string) => {
            console.error('[ChemCanvas] Canvas error:', error);
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

