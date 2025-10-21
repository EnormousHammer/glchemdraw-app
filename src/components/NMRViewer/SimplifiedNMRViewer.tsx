/**
 * SimplifiedNMRViewer - User-friendly wrapper for NMRium
 * 
 * Provides an intuitive interface with:
 * - Clear, recognizable icons with tooltips
 * - Simplified toolbar with essential tools
 * - Optional beginner mode that hides complexity
 * - Better visual feedback and navigation
 */

import React, { useState, useCallback, useMemo } from 'react';
import { Box, Paper, ToggleButton, ToggleButtonGroup, Fade, Typography } from '@mui/material';
import { NMRWelcomePanel } from './NMRWelcomePanel';
import { NMRSimpleToolbar } from './NMRSimpleToolbar';
import { NMRHelpSystem } from './NMRHelpSystem';
import { NMRShortcutGuide } from './NMRShortcutGuide';
import { 
  getViewMode, 
  setViewMode, 
  hasSeenWelcome as checkWelcomeSeen,
  markWelcomeSeen 
} from '@lib/storage/nmrPreferences';
import {
  triggerNMRiumFileInput,
  triggerNMRiumZoomIn,
  triggerNMRiumZoomOut,
  triggerNMRiumZoomReset,
  triggerNMRiumAutoPeakPick,
  triggerNMRiumIntegration,
  triggerNMRiumAutoIntegration,
  showNMRiumIntegralsPanel,
  triggerNMRiumExport,
  triggerNMRiumSaveProject,
  waitForNMRium,
} from '@lib/nmrium/nmriumControls';

// Lazy load NMRium
const NMRium = React.lazy(() => 
  import('nmrium').then(module => ({ default: module.NMRium }))
);

export interface SimplifiedNMRViewerProps {
  /** Initial mode: 'simple' hides complexity, 'advanced' shows full interface */
  initialMode?: 'simple' | 'advanced';
}

export const SimplifiedNMRViewer: React.FC<SimplifiedNMRViewerProps> = ({ 
  initialMode = 'simple' 
}) => {
  // Load saved mode preference using utility
  const [currentViewMode, setCurrentViewMode] = useState<'simple' | 'advanced'>(() => 
    getViewMode() || initialMode
  );
  
  // Only show welcome panel for first-time users - DISABLED for debugging
  const [showWelcome, setShowWelcome] = useState(false);
  
  const [hasLoadedData, setHasLoadedData] = useState(false);
  
  // Ref to access NMRium instance with proper typing
  const nmriumRef = React.useRef<{
    loadFiles: (files: File[]) => void;
    getSpectraViewerAsBlob: () => any | null;
  } | null>(null);

  // Save preference when mode changes
  const handleModeChange = useCallback((
    _event: React.MouseEvent<HTMLElement>, 
    newMode: 'simple' | 'advanced' | null
  ) => {
    if (newMode !== null) {
      setCurrentViewMode(newMode);
      setViewMode(newMode); // Save to preferences
    }
  }, []);

  // NMRium preferences - FORCE toolbar to be visible!
  const nmriumPreferences = useMemo(() => ({
    general: {
      fontSize: 16,
    } as any,
    panels: {
      // Force panels to be visible
      leftPanelOpen: true,
      rightPanelOpen: true,
    } as any,
    display: {
      toolbarVisible: true,
    } as any,
  }), []);

  // Use 'default' workspace which should show all tools
  const workspaceMode = 'default';

  // Handle data loaded
  const handleDataLoaded = useCallback(() => {
    setHasLoadedData(true);
    setShowWelcome(false);
  }, []);

  // Dismiss welcome panel
  const handleDismissWelcome = useCallback(() => {
    setShowWelcome(false);
    markWelcomeSeen(); // Save to preferences
  }, []);

  // Wait for NMRium to load and TEST if keyboard input works
  React.useEffect(() => {
    waitForNMRium().then(async (loaded) => {
      if (loaded) {
        console.log('[SimplifiedNMRViewer] ✅ NMRium loaded successfully');
        
        // Add a keyboard listener to test if keys are being captured
        const keyListener = (e: KeyboardEvent) => {
          const activeElement = document.activeElement;
          const nmriumRoot = document.querySelector('.nmrium-container');
          
          console.log('[SimplifiedNMRViewer] 🔑 Key pressed:', {
            key: e.key,
            code: e.code,
            target: (e.target as HTMLElement)?.tagName,
            activeElement: activeElement?.tagName + '.' + (activeElement as HTMLElement)?.className?.substring(0, 30),
            isFocused: activeElement === nmriumRoot,
            defaultPrevented: e.defaultPrevented,
            shiftKey: e.shiftKey,
            ctrlKey: e.ctrlKey,
            metaKey: e.metaKey
          });
          
          // Log specifically if it's r, i, p (NMRium shortcuts)
          if (['r', 'i', 'p', 'z', 'f', 'i'].includes(e.key)) {
            console.log(`[SimplifiedNMRViewer] 🎯 NMRium shortcut key "${e.key}" detected!`);
            console.log('[SimplifiedNMRViewer] Will reach NMRium:', !e.defaultPrevented);
            console.log('[SimplifiedNMRViewer] ⚠️ CRITICAL: Move your MOUSE CURSOR over the spectrum area!');
            console.log('[SimplifiedNMRViewer] NMRium requires mouse hover to activate shortcuts!');
          }
          
          // DON'T preventDefault or stopPropagation - let it reach NMRium!
        };
        
        document.addEventListener('keydown', keyListener);
        console.log('[SimplifiedNMRViewer] 📊 Keyboard listener added - will NOT block events');
        
        // CRITICAL: Focus NMRium's rootRef and KEEP IT FOCUSED
        // Found in InnerNMRiumContents.js line 86: className="nmrium-container"
        
        // Function to focus NMRium
        const focusNMRium = () => {
          const nmriumRoot = document.querySelector('.nmrium-container') as HTMLElement;
          if (nmriumRoot) {
            nmriumRoot.setAttribute('tabIndex', '0');
            nmriumRoot.focus();
            return true;
          }
          return false;
        };
        
        // Initial focus after load
        setTimeout(() => {
          if (focusNMRium()) {
            console.log('[SimplifiedNMRViewer] ✅ SUCCESS! NMRium focused - keyboard shortcuts active');
          } else {
            console.error('[SimplifiedNMRViewer] ❌ Could not find .nmrium-container');
          }
        }, 2000);
        
        // KEEP IT FOCUSED: Refocus whenever it loses focus
        const refocusInterval = setInterval(() => {
          const nmriumRoot = document.querySelector('.nmrium-container') as HTMLElement;
          if (nmriumRoot && document.activeElement !== nmriumRoot) {
            // Only refocus if nothing else important has focus (not an input, textarea, etc.)
            const activeTag = document.activeElement?.tagName.toLowerCase();
            if (activeTag !== 'input' && activeTag !== 'textarea' && activeTag !== 'select') {
              nmriumRoot.focus();
              console.log('[SimplifiedNMRViewer] 🔄 Auto-refocused NMRium');
            }
          }
        }, 1000); // Check every second
        
        // Also refocus on any click in the NMRium area
        setTimeout(() => {
          const nmriumRoot = document.querySelector('.nmrium-container') as HTMLElement;
          if (nmriumRoot) {
            nmriumRoot.addEventListener('click', () => {
              nmriumRoot.focus();
              console.log('[SimplifiedNMRViewer] 🖱️ Clicked - refocused');
            });
            
            // CRITICAL FIX: NMRium only processes keyboard shortcuts when mouse is over the mainDivRef!
            // Find mainDivRef (first div inside nmrium-container with relative positioning)
            const mainDiv = nmriumRoot.querySelector('div[style*="relative"]') as HTMLElement;
            
            if (mainDiv) {
              // Keep simulating mouse enter to ensure shortcuts always work
              const keepMouseActive = () => {
                const mouseEnterEvent = new MouseEvent('mouseenter', {
                  view: window,
                  bubbles: true,
                  cancelable: true
                });
                mainDiv.dispatchEvent(mouseEnterEvent);
              };
              
              // Initial trigger
              keepMouseActive();
              console.log('[SimplifiedNMRViewer] ✅ Simulated mouse enter - shortcuts ACTIVE!');
              
              // Keep it active every 2 seconds (in case user moves mouse away)
              const mouseInterval = setInterval(keepMouseActive, 2000);
              
              // Store for cleanup
              (window as any).__nmriumMouseInterval = mouseInterval;
            } else {
              console.warn('[SimplifiedNMRViewer] ⚠️ Could not find mainDiv');
              console.log('[SimplifiedNMRViewer] 💡 TIP: Hover your mouse over the spectrum area to activate shortcuts');
            }
          }
        }, 2000);
        
        // Cleanup intervals on unmount
        return () => {
          clearInterval(refocusInterval);
          if ((window as any).__nmriumMouseInterval) {
            clearInterval((window as any).__nmriumMouseInterval);
          }
        };
      } else {
        console.warn('[SimplifiedNMRViewer] ⚠️ NMRium may not have loaded properly');
      }
    });
  }, []);

  // Handle drag and drop - Use NMRium's ref API
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0 && nmriumRef.current) {
      const filesArray = Array.from(files);
      console.log('[SimplifiedNMRViewer] Files dropped:', filesArray.length);
      
      // Use NMRium's ref API to load files
      nmriumRef.current.loadFiles(filesArray);
      
      setHasLoadedData(true);
      setShowWelcome(false);
    }
  }, []);

  // Handle file opening - Use NMRium's ref API
  const handleOpenFile = useCallback(() => {
    console.log('[SimplifiedNMRViewer] Open button clicked');
    
    // Create file input
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = '.dx,.jdx,.jcamp,.zip,.nmr,.fid';
    
    input.onchange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (target.files && target.files.length > 0 && nmriumRef.current) {
        const filesArray = Array.from(target.files);
        console.log('[SimplifiedNMRViewer] Loading files via ref API:', filesArray.length);
        
        // Use NMRium's ref API to load files
        nmriumRef.current.loadFiles(filesArray);
        
        setHasLoadedData(true);
        setShowWelcome(false);
      }
    };
    
    input.click();
  }, []);

  // Handle save project
  const handleSaveProject = useCallback(() => {
    console.log('[SimplifiedNMRViewer] Save button clicked');
    triggerNMRiumSaveProject();
  }, []);

  // Handle zoom in
  const handleZoomIn = useCallback(() => {
    console.log('[SimplifiedNMRViewer] Zoom in clicked');
    triggerNMRiumZoomIn();
  }, []);

  // Handle zoom out
  const handleZoomOut = useCallback(() => {
    console.log('[SimplifiedNMRViewer] Zoom out clicked');
    triggerNMRiumZoomOut();
  }, []);

  // Handle zoom reset
  const handleZoomReset = useCallback(() => {
    console.log('[SimplifiedNMRViewer] Zoom reset clicked');
    triggerNMRiumZoomReset();
  }, []);

  // Handle auto peak pick
  const handleAutoPeakPick = useCallback(() => {
    console.log('[SimplifiedNMRViewer] Auto peak pick clicked');
    triggerNMRiumAutoPeakPick();
  }, []);

  // Handle manual integration - THE MOST IMPORTANT FEATURE
  const handleIntegration = useCallback(() => {
    console.log('[SimplifiedNMRViewer] 🎯 Manual Integration clicked');
    const success = triggerNMRiumIntegration();
    if (success) {
      // Also show the integrals panel so users can see results
      setTimeout(() => showNMRiumIntegralsPanel(), 300);
    }
  }, []);

  // Handle auto integration - THE MOST IMPORTANT FEATURE
  const handleAutoIntegration = useCallback(() => {
    console.log('[SimplifiedNMRViewer] 🎯 AUTO INTEGRATION clicked');
    const success = triggerNMRiumAutoIntegration();
    if (success) {
      // Show integrals panel to display results
      setTimeout(() => showNMRiumIntegralsPanel(), 300);
    } else {
      // If auto integration not found, open manual integration tool
      triggerNMRiumIntegration();
      setTimeout(() => showNMRiumIntegralsPanel(), 300);
    }
  }, []);

  // Handle export image
  const handleExportImage = useCallback(() => {
    console.log('[SimplifiedNMRViewer] Export image clicked');
    triggerNMRiumExport('image');
  }, []);

  // Handle export data
  const handleExportData = useCallback(() => {
    console.log('[SimplifiedNMRViewer] Export data clicked');
    triggerNMRiumExport('data');
  }, []);

  // Handle showing help
  const handleShowHelp = useCallback(() => {
    // The help system is already rendered as a floating button
    // Users can click it directly
    console.log('[SimplifiedNMRViewer] Help system is available via floating button');
  }, []);

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: '#fafafa',
      }}
    >
      {/* Top Control Bar - Compact */}
      <Paper
        elevation={1}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 1.5,
          py: 0.5,
          borderRadius: 0,
          zIndex: 10,
          borderBottom: '1px solid #e0e0e0',
        }}
      >
        {/* Left: Title */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1976d2', fontSize: '0.9rem' }}>
            📊 NMR Analyzer
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
            {currentViewMode === 'simple' ? 'Simple Mode' : 'Advanced Mode'}
          </Typography>
        </Box>

        {/* Right: Mode Toggle - Compact */}
        <ToggleButtonGroup
          value={currentViewMode}
          exclusive
          onChange={handleModeChange}
          size="small"
          sx={{
            height: '28px',
            '& .MuiToggleButton-root': {
              px: 2,
              py: 0.5,
              fontSize: '0.75rem',
              fontWeight: 600,
              textTransform: 'none',
              height: '28px',
              '&.Mui-selected': {
                bgcolor: '#1976d2',
                color: 'white',
                '&:hover': {
                  bgcolor: '#1565c0',
                },
              },
            },
          }}
        >
          <ToggleButton value="simple">
            Simple
          </ToggleButton>
          <ToggleButton value="advanced">
            Advanced
          </ToggleButton>
        </ToggleButtonGroup>
      </Paper>

      {/* Simplified Toolbar (Simple Mode Only) */}
      {currentViewMode === 'simple' && (
        <NMRSimpleToolbar 
          onOpenFile={handleOpenFile}
          onSaveProject={handleSaveProject}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onZoomReset={handleZoomReset}
          onExportImage={handleExportImage}
          onExportData={handleExportData}
          onShowHelp={handleShowHelp}
        />
      )}

      {/* Main NMRium Container */}
      <Box
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        sx={{
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
          // Apply different styling based on mode
          ...(currentViewMode === 'simple' ? {
            // Simple mode: Hide complexity via CSS
            '& > div': {
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            },
          } : {
            // Advanced mode: Show everything
            '& > div': {
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            },
          }),
        }}
        className={currentViewMode === 'simple' ? 'nmr-simple-mode' : 'nmr-advanced-mode'}
      >
        {/* Welcome Panel Overlay */}
        {showWelcome && (
          <Fade in={showWelcome}>
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 100,
                bgcolor: 'rgba(255, 255, 255, 0.98)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <NMRWelcomePanel 
                onDismiss={handleDismissWelcome}
                onDataLoaded={handleDataLoaded}
              />
            </Box>
          </Fade>
        )}

        {/* NMRium Component */}
        <React.Suspense
          fallback={
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              height: '100%',
              bgcolor: '#ffffff'
            }}>
              <Typography variant="h6" color="text.secondary">
                Loading NMR Analyzer...
              </Typography>
            </Box>
          }
        >
          <Box
            sx={{
              width: '100%',
              height: '100%',
              position: 'absolute',
              bgcolor: '#ffffff',
              // Enhanced UI styling for both modes
              '& *': {
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important',
              },
              // ENHANCED FONT SIZES
              '& button, & input, & select, & label, & span': {
                fontSize: '16px !important',
              },
              // LARGER, CLEARER TOOLTIPS
              '& [role="tooltip"]': {
                fontSize: '14px !important',
                padding: '12px 16px !important',
                backgroundColor: 'rgba(30, 30, 30, 0.95) !important',
                borderRadius: '8px !important',
                boxShadow: '0 6px 20px rgba(0,0,0,0.25) !important',
                maxWidth: '350px !important',
                lineHeight: '1.5 !important',
              },
              // BETTER TABLE READABILITY
              '& table': {
                fontSize: '15px !important',
              },
              '& th, & td': {
                padding: '12px 16px !important',
                fontSize: '15px !important',
              },
              // BIGGER PANEL HEADERS
              '& .panel-header, & [class*="header"], & [class*="Header"]': {
                fontSize: '16px !important',
                fontWeight: '700 !important',
                padding: '12px !important',
              },
              // LARGER TOOLBAR BUTTONS
              '& [class*="toolbar"] button, & [class*="Toolbar"] button': {
                minWidth: '48px !important',
                minHeight: '48px !important',
                fontSize: '16px !important',
                margin: '4px !important',
              },
              // BIGGER ICONS
              '& [class*="toolbar"] svg, & [class*="Toolbar"] svg': {
                fontSize: '24px !important',
                width: '24px !important',
                height: '24px !important',
              },
              // ENHANCED HOVER STATES
              '& button:hover': {
                backgroundColor: 'rgba(25, 118, 210, 0.12) !important',
                transform: 'scale(1.05)',
                transition: 'all 0.2s ease',
              },
              // BETTER INPUT FIELDS
              '& input[type="text"], & input[type="number"]': {
                padding: '10px 14px !important',
                fontSize: '15px !important',
                borderRadius: '6px !important',
                border: '2px solid #e0e0e0 !important',
                '&:focus': {
                  borderColor: '#1976d2 !important',
                  outline: 'none !important',
                },
              },
              // MODERN SCROLLBARS
              '& ::-webkit-scrollbar': {
                width: '12px',
                height: '12px',
              },
              '& ::-webkit-scrollbar-track': {
                backgroundColor: '#f5f5f5',
                borderRadius: '6px',
              },
              '& ::-webkit-scrollbar-thumb': {
                backgroundColor: '#bdbdbd',
                borderRadius: '6px',
                '&:hover': {
                  backgroundColor: '#9e9e9e',
                },
              },
              // CLEAR SELECTION INDICATORS
              '& tr[class*="selected"], & [class*="selected"]': {
                backgroundColor: '#e3f2fd !important',
                borderLeft: '4px solid #1976d2 !important',
              },
              // Simple mode: Keep everything visible - users need the left sidebar!
              ...(currentViewMode === 'simple' && {
                // Make INTEGRALS panel more prominent (right sidebar)
                '& [class*="integral"] table, & [class*="Integral"] table': {
                  fontSize: '16px !important',
                },
                '& [class*="integral"] td, & [class*="Integral"] td': {
                  padding: '14px 16px !important',
                },
                // Make LEFT TOOLBAR (tools) more visible
                '& [class*="toolbar-left"], & [class*="ToolbarLeft"]': {
                  borderRight: '2px solid #f57c00 !important',
                },
                // Highlight Ranges tool
                '& button[title*="Range"], & button[title*="range"]': {
                  borderColor: '#f57c00 !important',
                },
              }),
            }}
          >
            <NMRium 
              ref={nmriumRef}
              workspace={workspaceMode}
              preferences={nmriumPreferences} 
            />
          </Box>
        </React.Suspense>
      </Box>

      {/* Keyboard Shortcut Guide - Always visible */}
      <NMRShortcutGuide />

      {/* Floating Help System - DISABLED for debugging */}
      {false && <NMRHelpSystem />}
    </Box>
  );
};

export default SimplifiedNMRViewer;

