/**
 * NMRViewer Component
 * 
 * Proper wrapper for NMRium with correct container sizing
 */

import React, { Suspense } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import { NMRKeyboardShortcuts } from './NMRKeyboardShortcuts';

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
  // Minimal setup - let NMRium use all available space

  return (
    <div 
      className="nmrium-container"
      style={{ 
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        position: 'relative'
      }}
    >
      <Suspense 
        fallback={
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            height: '100%',
            flexDirection: 'column'
          }}>
            <CircularProgress size={60} />
            <Typography variant="h6" color="primary">
              Loading NMR Analyzer
            </Typography>
          </div>
        }
      >
        <NMRium workspace="default" />
      </Suspense>
    </div>
  );
};

export default NMRViewer;
