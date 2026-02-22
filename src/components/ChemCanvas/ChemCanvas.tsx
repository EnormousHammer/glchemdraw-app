/**
 * ChemCanvas Component
 * Ketcher-based chemical structure drawing canvas
 */

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { Editor } from 'ketcher-react';
import { OcsrStructServiceProvider } from '../../lib/chemistry/OcsrStructServiceProvider';
import 'ketcher-react/dist/index.css';
import { Box, CircularProgress, Alert, Button, Typography, Stack } from '@mui/material';
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
  const [editorKey, setEditorKey] = useState(0);
  const editorRef = useRef<any>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Ctrl+C copies structure as image (uses Tauri native clipboard when in desktop app)
  useCopyImageToClipboard(editorRef, { onCopySuccess: onCopyImageSuccess });
  // Paste: image or structure (Ctrl+V and Paste button)
  useImagePasteIntoSketch(editorRef);

  // Ensure Delete/Backspace reach the canvas when focus is elsewhere (e.g. after clicking Chemical Info)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Delete' && e.key !== 'Backspace') return;
      const target = e.target as HTMLElement;
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') return;
      const inKetcher = target?.closest?.('.Ketcher-root') || target?.closest?.('.Ketcher-polymer-editor-root');
      if (inKetcher) return; // Already in canvas, let Ketcher handle it
      const ketcherRoot = document.querySelector('.Ketcher-root') as HTMLElement | null;
      if (!ketcherRoot) return;
      e.preventDefault();
      e.stopPropagation();
      ketcherRoot.setAttribute('tabindex', '-1');
      ketcherRoot.focus({ preventScroll: true });
      ketcherRoot.dispatchEvent(new KeyboardEvent('keydown', { key: e.key, bubbles: true, cancelable: true }));
    };
    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, []);

  // Block Shift+F (Functional Groups) - feature creates disconnected structures until Ketcher fix
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.shiftKey && (e.key === 'F' || e.key === 'f')) {
        const target = e.target as HTMLElement;
        if (target?.closest?.('.Ketcher-root') || target?.closest?.('.Ketcher-polymer-editor-root')) {
          e.preventDefault();
          e.stopPropagation();
        }
      }
    };
    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, []);

  // Block editor About/FAQ/Info modal - white cover + auto-close so nothing appears
  useEffect(() => {
    const coverEditorInfoModal = () => {
      document.querySelectorAll('[role="dialog"], .bp6-dialog, .bp6-overlay').forEach((el) => {
        if ((el as HTMLElement).querySelector?.('[data-glchemdraw-dialog]')) return;
        const html = el.innerHTML || '';
        const isEditorModal = html.includes('epam.com') || html.includes('build-version') || html.includes('lifescience.opensource')
          || (html.includes('Feedback') && (html.includes('FAQ') || html.includes('faq') || html.includes('Help')));
        if (isEditorModal) {
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
    const observer = new MutationObserver(coverEditorInfoModal);
    observer.observe(document.body, { childList: true, subtree: true });
    coverEditorInfoModal();
    return () => observer.disconnect();
  }, []);

  // Hide any visible "Ketcher" text from editor library (title, aria-label, text content)
  useEffect(() => {
    const hideEditorBranding = () => {
      const roots = document.querySelectorAll('[class*="Ketcher-root"], [class*="polymer-editor-root"]');
      roots.forEach((root) => {
        root.querySelectorAll('[title], [aria-label], span, div, a, button, label').forEach((el) => {
          const html = el as HTMLElement;
          const title = html.getAttribute?.('title') || '';
          const aria = html.getAttribute?.('aria-label') || '';
          const text = (html.textContent || '').trim();
          if (/ketcher/i.test(title) || /ketcher/i.test(aria) || (text && /ketcher/i.test(text))) {
            html.style.setProperty('visibility', 'hidden', 'important');
            html.style.setProperty('font-size', '0', 'important');
            html.style.setProperty('line-height', '0', 'important');
            html.style.setProperty('overflow', 'hidden', 'important');
          }
        });
      });
    };
    const obs = new MutationObserver(hideEditorBranding);
    obs.observe(document.body, { childList: true, subtree: true, characterData: true });
    hideEditorBranding();
    const t = setInterval(hideEditorBranding, 2000);
    return () => { obs.disconnect(); clearInterval(t); };
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
              let selSmiles: string | null = null;
              try {
                const { molfileToSmiles } = await import('../../lib/chemistry/openchemlib');
                selSmiles = molfileToSmiles(selMolfile);
              } catch (_) { /* openchemlib sync */ }
              if (!selSmiles) {
                try {
                  const { molfileToSmiles } = await import('../../lib/chemistry/rdkit');
                  selSmiles = await molfileToSmiles(selMolfile);
                } catch (_) { /* rdkit async */ }
              }
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

  const handleReloadCanvas = useCallback(() => {
    setError(null);
    setEditorKey((k) => k + 1);
    editorRef.current = null;
  }, []);

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
        <Stack spacing={2} sx={{ maxWidth: 600 }}>
          <Alert severity="error">
            <strong>Chemical Editor Error</strong>
            <br />
            {error}
            <br />
            <Typography component="span" variant="body2" sx={{ mt: 1, display: 'block' }}>
              This can happen when switching between Molecules and Macromolecules mode.
            </Typography>
          </Alert>
          <Button variant="contained" onClick={handleReloadCanvas} sx={{ alignSelf: 'flex-start' }}>
            Reload Canvas
          </Button>
        </Stack>
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
          key={editorKey}
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
                    let smiles: string | null = null;
                    try {
                      const { molfileToSmiles } = await import('../../lib/chemistry/openchemlib');
                      smiles = molfileToSmiles(molfile);
                    } catch (_) { /* openchemlib sync */ }
                    if (!smiles) {
                      try {
                        const { molfileToSmiles } = await import('../../lib/chemistry/rdkit');
                        smiles = await molfileToSmiles(molfile);
                      } catch (_) { /* rdkit async */ }
                    }
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
              // Emit initial selection state so Chemical Info shows selected struct if any
              setTimeout(() => emitSelectionOrFull(), 150);
            } catch (e) {
              console.warn('[ChemCanvas] Failed to subscribe selection handler:', e);
            }
            // Expose instance to parent
            if (onKetcherInit) {
              onKetcherInit(ketcher);
            }
          }}
          errorHandler={(err: string) => {
            console.error('[ChemCanvas] Canvas error:', err);
            setError(err);
            if (onError) {
              onError(new Error(err));
            }
          }}
        />
      </Box>
    </Box>
  );
};

export default ChemCanvas;

