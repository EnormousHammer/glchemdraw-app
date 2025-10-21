/**
 * Lazy-loaded Components
 * Heavy components loaded on-demand for better initial load performance
 */

import { lazy, Suspense } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

// Lazy load heavy components
export const LazyNMRViewer = lazy(() => 
  import('./NMRViewer/NMRViewer').then(module => ({ default: module.NMRViewer }))
);
export const LazySimplifiedNMRViewer = lazy(() => 
  import('./NMRViewer/SimplifiedNMRViewer').then(module => ({ default: module.SimplifiedNMRViewer }))
);
export const LazyBatchProcessor = lazy(() => import('./BatchProcessor'));

// Loading fallback component
export const ComponentLoader: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      gap: 2,
    }}
  >
    <CircularProgress />
    <Typography variant="body2" color="text.secondary">
      {message}
    </Typography>
  </Box>
);

// Wrapper for lazy components with Suspense
export const withLazyLoad = <P extends object>(
  LazyComponent: React.LazyExoticComponent<React.ComponentType<P>>,
  fallbackMessage?: string
) => {
  return (props: P) => (
    <Suspense fallback={<ComponentLoader message={fallbackMessage} />}>
      <LazyComponent {...(props as any)} />
    </Suspense>
  );
};

