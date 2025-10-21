/**
 * Accessibility Menu Component
 * Provides accessibility options and settings
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControlLabel,
  Switch,
  Typography,
  Box,
  Divider,
  Stack,
  IconButton,
} from '@mui/material';
import {
  Accessibility as AccessibilityIcon,
  Close as CloseIcon,
  Contrast as ContrastIcon,
  TextFields as TextIcon,
  Keyboard as KeyboardIcon,
} from '@mui/icons-material';

interface AccessibilityMenuProps {
  open: boolean;
  onClose: () => void;
}

export const AccessibilityMenu: React.FC<AccessibilityMenuProps> = ({
  open,
  onClose,
}) => {
  const [settings, setSettings] = useState({
    highContrast: false,
    largeText: false,
    reduceMotion: false,
    screenReaderOptimized: false,
  });

  const handleToggle = (key: keyof typeof settings) => {
    setSettings(prev => {
      const newSettings = { ...prev, [key]: !prev[key] };
      
      // Apply settings
      if (key === 'largeText') {
        document.documentElement.style.fontSize = newSettings.largeText ? '18px' : '16px';
      }
      if (key === 'reduceMotion') {
        document.documentElement.setAttribute(
          'data-reduce-motion',
          newSettings.reduceMotion ? 'true' : 'false'
        );
      }
      
      // Save to localStorage
      localStorage.setItem('glchemdraw_accessibility', JSON.stringify(newSettings));
      
      return newSettings;
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={1}>
            <AccessibilityIcon />
            <Typography variant="h6">Accessibility Settings</Typography>
          </Stack>
          <IconButton onClick={onClose} size="small" aria-label="Close accessibility menu">
            <CloseIcon />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={3}>
          {/* High Contrast */}
          <Box>
            <Stack direction="row" spacing={2} alignItems="center">
              <ContrastIcon color="primary" />
              <Box flex={1}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.highContrast}
                      onChange={() => handleToggle('highContrast')}
                      inputProps={{ 'aria-label': 'Toggle high contrast mode' }}
                    />
                  }
                  label="High Contrast Mode"
                />
                <Typography variant="body2" color="text.secondary">
                  Increases contrast for better visibility
                </Typography>
              </Box>
            </Stack>
          </Box>

          <Divider />

          {/* Large Text */}
          <Box>
            <Stack direction="row" spacing={2} alignItems="center">
              <TextIcon color="primary" />
              <Box flex={1}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.largeText}
                      onChange={() => handleToggle('largeText')}
                      inputProps={{ 'aria-label': 'Toggle large text mode' }}
                    />
                  }
                  label="Large Text"
                />
                <Typography variant="body2" color="text.secondary">
                  Increases text size throughout the application
                </Typography>
              </Box>
            </Stack>
          </Box>

          <Divider />

          {/* Reduce Motion */}
          <Box>
            <Stack direction="row" spacing={2} alignItems="center">
              <KeyboardIcon color="primary" />
              <Box flex={1}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.reduceMotion}
                      onChange={() => handleToggle('reduceMotion')}
                      inputProps={{ 'aria-label': 'Toggle reduce motion' }}
                    />
                  }
                  label="Reduce Motion"
                />
                <Typography variant="body2" color="text.secondary">
                  Minimizes animations and transitions
                </Typography>
              </Box>
            </Stack>
          </Box>

          <Divider />

          {/* Screen Reader Optimization */}
          <Box>
            <Stack direction="row" spacing={2} alignItems="center">
              <AccessibilityIcon color="primary" />
              <Box flex={1}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.screenReaderOptimized}
                      onChange={() => handleToggle('screenReaderOptimized')}
                      inputProps={{ 'aria-label': 'Toggle screen reader optimization' }}
                    />
                  }
                  label="Screen Reader Optimization"
                />
                <Typography variant="body2" color="text.secondary">
                  Enhanced ARIA labels and announcements
                </Typography>
              </Box>
            </Stack>
          </Box>

          <Divider />

          {/* Keyboard Shortcuts Info */}
          <Box>
            <Typography variant="subtitle2" gutterBottom fontWeight={600}>
              Keyboard Shortcuts
            </Typography>
            <Typography variant="body2" color="text.secondary" component="div">
              <strong>File:</strong> Ctrl+N (New), Ctrl+O (Open), Ctrl+S (Save)
              <br />
              <strong>Edit:</strong> Ctrl+Z (Undo), Ctrl+Y (Redo), Ctrl+L (Clear)
              <br />
              <strong>View:</strong> Ctrl+D (Toggle Theme), Ctrl+F (Search)
              <br />
              <strong>Navigation:</strong> Tab (Next), Shift+Tab (Previous), Esc (Cancel)
            </Typography>
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default AccessibilityMenu;

