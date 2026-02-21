/**
 * Main App Component
 * GlChemDraw - Chemistry Structure & NMR Analysis Application
 */

import { useState, useMemo, useEffect } from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { lightTheme, darkTheme, highContrastTheme } from './theme';
import AppLayout from '@components/Layout';
import ErrorBoundary from '@components/ErrorBoundary';
import LoadingScreen from '@components/LoadingScreen';
import { AIContextProvider } from './contexts/AIContext';

type ThemeMode = 'light' | 'dark' | 'highContrast';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    // Load theme preference from localStorage
    const saved = localStorage.getItem('glchemdraw_theme');
    return (saved as ThemeMode) || 'light';
  });

  const theme = useMemo(() => {
    switch (themeMode) {
      case 'dark':
        return darkTheme;
      case 'highContrast':
        return highContrastTheme;
      default:
        return lightTheme;
    }
  }, [themeMode]);

  useEffect(() => {
    // Save theme preference
    localStorage.setItem('glchemdraw_theme', themeMode);
    
    // Set data attribute for CSS
    document.documentElement.setAttribute('data-theme', themeMode);
  }, [themeMode]);

  useEffect(() => {
    // Preload NMR predictor databases in background for faster first prediction
    import('@/lib/nmr/preloadNmrPredictor').then(({ preloadNmrPredictor }) => preloadNmrPredictor());
  }, []);

  const toggleDarkMode = () => {
    setThemeMode((prev) => {
      // Cycle through themes: light -> dark -> highContrast -> light
      if (prev === 'light') return 'dark';
      if (prev === 'dark') return 'highContrast';
      return 'light';
    });
  };

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
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AIContextProvider>
          <AppLayout />
        </AIContextProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
