/**
 * NMRViewer Component
 * 
 * Proper wrapper for NMRium with correct container sizing
 */

import React, { Suspense } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';

// Lazy load NMRium for better performance
const NMRium = React.lazy(() => 
  import('nmrium').then(module => {
    console.log('[NMRViewer] NMRium module loaded:', module);
    return { default: module.NMRium };
  }).catch(error => {
    console.error('[NMRViewer] Failed to load NMRium:', error);
    // Return a fallback component that matches the expected type
    return { 
      default: React.memo(React.forwardRef<any, any>(() => (
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          height: '100%',
          width: '100%',
          flexDirection: 'column',
          gap: 2,
          bgcolor: 'background.default'
        }}>
          <Typography variant="h6" color="error">
            Failed to load NMRium
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Error: {error.message}
          </Typography>
        </Box>
      )))
    };
  })
);

interface NMRViewerProps {}

export const NMRViewer: React.FC<NMRViewerProps> = () => {
  // Remove the blocking main-wrapper entirely
  React.useEffect(() => {
    const removeBlockingWrapper = () => {
      const mainWrapper = document.getElementById('main-wrapper');
      if (mainWrapper) {
        console.log('[NMRViewer] 🔧 Removing blocking main-wrapper');
        mainWrapper.remove();
      }
    };

    // Remove immediately and keep checking
    removeBlockingWrapper();
    const interval = setInterval(removeBlockingWrapper, 100);
    
    return () => clearInterval(interval);
  }, []);

  // Optimize performance for spectra interaction - removed transforms that cause mouse offset
  React.useEffect(() => {
    // Just optimize canvas rendering without transforms
    const canvasElements = document.querySelectorAll('canvas');
    canvasElements.forEach(canvas => {
      canvas.style.imageRendering = 'optimizeSpeed';
    });
  }, []);

  // Simple fix for mouse offset - just reset any problematic styles
  React.useEffect(() => {
    const fixOffset = () => {
      const nmriumContainer = document.querySelector('[data-testid="nmrium"]') as HTMLElement;
      if (nmriumContainer) {
        nmriumContainer.style.transform = 'none';
        nmriumContainer.style.position = 'relative';
      }
    };

    fixOffset();
    const interval = setInterval(fixOffset, 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Add comprehensive click debugging
  React.useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      console.log('[NMRViewer] 🖱️ Click detected at:', e.clientX, e.clientY);
      console.log('[NMRViewer] Target element:', e.target);
      console.log('[NMRViewer] Current target:', e.currentTarget);
      
      // Check if click is being blocked
      const elementAtPoint = document.elementFromPoint(e.clientX, e.clientY);
      console.log('[NMRViewer] Element at click point:', elementAtPoint);
      console.log('[NMRViewer] Element classes:', elementAtPoint?.className);
      console.log('[NMRViewer] Element computed style pointer-events:', 
        elementAtPoint ? window.getComputedStyle(elementAtPoint).pointerEvents : 'N/A');
      
      // Log all attributes for info buttons
      if (elementAtPoint && (
        elementAtPoint.getAttribute('title')?.includes('i') ||
        elementAtPoint.getAttribute('aria-label')?.includes('i') ||
        elementAtPoint.textContent?.includes('i')
      )) {
        console.log('[NMRViewer] 🎯 Found info button!');
        console.log('[NMRViewer] Title:', elementAtPoint.getAttribute('title'));
        console.log('[NMRViewer] Aria-label:', elementAtPoint.getAttribute('aria-label'));
        console.log('[NMRViewer] Text content:', elementAtPoint.textContent);
        console.log('[NMRViewer] Tag name:', elementAtPoint.tagName);
        console.log('[NMRViewer] All attributes:', Array.from(elementAtPoint.attributes).map(attr => `${attr.name}="${attr.value}"`));
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      console.log('[NMRViewer] 🖱️ MouseDown detected at:', e.clientX, e.clientY);
      console.log('[NMRViewer] MouseDown target:', e.target);
    };

    // Add listeners to document to catch all clicks
    document.addEventListener('click', handleClick, true); // Use capture phase
    document.addEventListener('mousedown', handleMouseDown, true);
    
    return () => {
      document.removeEventListener('click', handleClick, true);
      document.removeEventListener('mousedown', handleMouseDown, true);
    };
  }, []);

  // Add keyboard event listener to test if events reach NMRium
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      console.log(`[NMRViewer] Key pressed: ${e.key}`);
      if (['r', 'p', 'i', 'z', 'h', 's'].includes(e.key.toLowerCase())) {
        console.log(`[NMRViewer] 🎯 NMRium shortcut "${e.key}" detected!`);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <Box 
      className="nmrium-container"
      sx={{ 
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Suspense 
        fallback={
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            height: '100%',
            width: '100%',
            flexDirection: 'column',
            gap: 3,
            bgcolor: 'background.default'
          }}>
            <Box sx={{ position: 'relative' }}>
              <CircularProgress 
                size={60} 
                thickness={4}
                sx={{ color: 'primary.main' }}
              />
              <Box sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                fontSize: '1.5rem'
              }}>
                📊
              </Box>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main', mb: 0.5 }}>
                Loading NMR Analyzer
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Preparing spectroscopy tools...
              </Typography>
            </Box>
          </Box>
        }
      >
        <Box 
          sx={{ 
            width: '100%',
            height: '100%',
            flex: 1,
            minHeight: 0
          }}
          onFocus={() => {
            console.log('[NMRViewer] NMRium container focused - keyboard shortcuts should work');
          }}
          onClick={(e) => {
            console.log('[NMRViewer] 🎯 NMRium container clicked directly!', e.target);
          }}
          onMouseDown={(e) => {
            console.log('[NMRViewer] 🎯 NMRium container mousedown directly!', e.target);
          }}
          tabIndex={-1}
        >
          <NMRium />
        </Box>
      </Suspense>
    </Box>
  );
};

export default NMRViewer;
