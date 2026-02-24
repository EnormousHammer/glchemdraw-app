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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Preload NMR predictor databases in background for faster first prediction
    import('@/lib/nmr/preloadNmrPredictor').then(({ preloadNmrPredictor }) => preloadNmrPredictor());
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
