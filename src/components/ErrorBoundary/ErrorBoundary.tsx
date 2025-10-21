/**
 * Global Error Boundary Component
 * Catches React errors and displays user-friendly fallback UI
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  Alert,
  Stack,
  IconButton,
  Collapse,
} from '@mui/material';
import {
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandIcon,
} from '@mui/icons-material';

interface Props {
  children: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log to error tracking service (if available)
    this.logError(error, errorInfo);
  }

  logError = (error: Error, errorInfo: ErrorInfo) => {
    try {
      // Log error details
      const errorLog = {
        timestamp: new Date().toISOString(),
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
        componentStack: errorInfo.componentStack,
        userAgent: navigator.userAgent,
      };

      console.error('[ErrorBoundary] Error Log:', JSON.stringify(errorLog, null, 2));

      // Store in localStorage for offline debugging
      const errorLogs = JSON.parse(localStorage.getItem('glchemdraw_error_logs') || '[]');
      errorLogs.push(errorLog);
      
      // Keep only last 10 errors
      const trimmed = errorLogs.slice(-10);
      localStorage.setItem('glchemdraw_error_logs', JSON.stringify(trimmed));
    } catch (e) {
      console.error('[ErrorBoundary] Failed to log error:', e);
    }
  };

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    });
  };

  toggleDetails = () => {
    this.setState(prev => ({ showDetails: !prev.showDetails }));
  };

  render() {
    if (this.state.hasError) {
      const { error, errorInfo, showDetails } = this.state;

      return (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            bgcolor: 'background.default',
            p: 3,
          }}
        >
          <Paper
            elevation={3}
            sx={{
              maxWidth: 600,
              width: '100%',
              p: 4,
            }}
          >
            <Stack spacing={3}>
              {/* Error Icon and Title */}
              <Box textAlign="center">
                <ErrorIcon
                  color="error"
                  sx={{ fontSize: 80, mb: 2 }}
                />
                <Typography variant="h4" gutterBottom fontWeight={700}>
                  Oops! Something Went Wrong
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  The application encountered an unexpected error.
                </Typography>
              </Box>

              {/* Error Message */}
              {error && (
                <Alert severity="error" variant="outlined">
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                    Error Details:
                  </Typography>
                  <Typography variant="body2" fontFamily="monospace">
                    {error.toString()}
                  </Typography>
                </Alert>
              )}

              {/* Action Buttons */}
              <Stack direction="row" spacing={2} justifyContent="center">
                <Button
                  variant="contained"
                  startIcon={<RefreshIcon />}
                  onClick={this.handleReload}
                  size="large"
                >
                  Reload Application
                </Button>
                <Button
                  variant="outlined"
                  onClick={this.handleReset}
                  size="large"
                >
                  Try Again
                </Button>
              </Stack>

              {/* Expandable Technical Details */}
              {(error || errorInfo) && (
                <Box>
                  <Button
                    fullWidth
                    variant="text"
                    endIcon={<ExpandIcon sx={{ transform: showDetails ? 'rotate(180deg)' : 'none' }} />}
                    onClick={this.toggleDetails}
                    sx={{ justifyContent: 'space-between' }}
                  >
                    Technical Details
                  </Button>
                  
                  <Collapse in={showDetails}>
                    <Box mt={2}>
                      {error?.stack && (
                        <Paper
                          variant="outlined"
                          sx={{
                            p: 2,
                            mb: 2,
                            maxHeight: 200,
                            overflow: 'auto',
                            bgcolor: 'grey.900',
                            color: 'grey.100',
                          }}
                        >
                          <Typography
                            variant="caption"
                            component="pre"
                            sx={{
                              fontFamily: 'monospace',
                              fontSize: '0.7rem',
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-word',
                            }}
                          >
                            {error.stack}
                          </Typography>
                        </Paper>
                      )}
                      
                      {errorInfo?.componentStack && (
                        <Paper
                          variant="outlined"
                          sx={{
                            p: 2,
                            maxHeight: 200,
                            overflow: 'auto',
                            bgcolor: 'grey.900',
                            color: 'grey.100',
                          }}
                        >
                          <Typography
                            variant="caption"
                            component="pre"
                            sx={{
                              fontFamily: 'monospace',
                              fontSize: '0.7rem',
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-word',
                            }}
                          >
                            {errorInfo.componentStack}
                          </Typography>
                        </Paper>
                      )}
                    </Box>
                  </Collapse>
                </Box>
              )}

              {/* Help Text */}
              <Alert severity="info" variant="outlined">
                <Typography variant="body2">
                  <strong>What you can do:</strong>
                  <br />
                  • Reload the application to start fresh
                  <br />
                  • Check if your browser is up to date
                  <br />
                  • Clear browser cache if the problem persists
                  <br />
                  • Contact support if the error continues
                </Typography>
              </Alert>
            </Stack>
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

