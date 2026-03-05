/**
 * Main App Component
 * GlChemDraw - Chemistry Structure & NMR Analysis Application
 */

import { useState, useEffect } from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { lightTheme } from './theme';
import AppLayout from '@components/Layout';
import ErrorBoundary from '@components/ErrorBoundary';
import LoadingScreen from '@components/LoadingScreen';
import { AIContextProvider } from './contexts/AIContext';

function App() {
  // Skip intro when embedded in ELN (iframe) or ?embed=1 - open instantly for lab notebook workflow
  const skipIntro = typeof window !== 'undefined' && (
    window !== window.parent ||
    new URLSearchParams(window.location.search).get('embed') === '1'
  );
  const [isLoading, setIsLoading] = useState(!skipIntro);

  useEffect(() => {
    // Preload NMR predictor databases in background for faster first prediction
    import('@/lib/nmr/preloadNmrPredictor').then(({ preloadNmrPredictor }) => preloadNmrPredictor());
    // Preload ChemCanvas (Ketcher) chunk during loading screen so canvas is ready sooner
    import('@/components/ChemCanvas/ChemCanvas');
  }, []);

  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    // Log to external error tracking service if available
    console.error('[App] Global error caught:', { error, errorInfo });
  };

  const handleLoadingComplete = () => {
    setIsLoading(false);
  };

  if (isLoading) {
    return <LoadingScreen onComplete={handleLoadingComplete} />;
  }

  return (
    <ErrorBoundary onError={handleError}>
      <ThemeProvider theme={lightTheme}>
        <CssBaseline />
        <AIContextProvider>
          <AppLayout />
        </AIContextProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
