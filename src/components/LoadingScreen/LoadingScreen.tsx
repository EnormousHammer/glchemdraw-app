/**
 * LoadingScreen Component
 * Simple 5-second loading screen
 */

import React, { useEffect } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import { AccountTree as MoleculeIcon } from '@mui/icons-material';

interface LoadingScreenProps {
  onComplete: () => void;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ onComplete }) => {
  useEffect(() => {
    // Simple 5-second timer
    const timer = setTimeout(() => {
      onComplete();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        color: 'white',
      }}
    >
      {/* Animated background circles */}
      <Box sx={{
        position: 'absolute',
        top: '10%',
        left: '10%',
        width: '300px',
        height: '300px',
        borderRadius: '50%',
        background: 'rgba(255, 255, 255, 0.1)',
        animation: 'float 6s ease-in-out infinite',
        '@keyframes float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' }
        }
      }} />
      <Box sx={{
        position: 'absolute',
        bottom: '15%',
        right: '15%',
        width: '200px',
        height: '200px',
        borderRadius: '50%',
        background: 'rgba(255, 255, 255, 0.1)',
        animation: 'float 8s ease-in-out infinite',
      }} />

      {/* Main content */}
      <Box sx={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        bgcolor: 'rgba(255, 255, 255, 0.15)',
        backdropFilter: 'blur(10px)',
        borderRadius: 4,
        padding: 6,
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        minWidth: '400px'
      }}>
        {/* Icon with glow effect */}
        <Box sx={{
          position: 'relative',
          mb: 3,
        }}>
          <MoleculeIcon sx={{ 
            fontSize: 90, 
            color: 'white',
            filter: 'drop-shadow(0 0 20px rgba(255, 255, 255, 0.5))',
          }} />
        </Box>

        {/* App name */}
        <Typography variant="h2" sx={{ 
          mb: 1.5, 
          fontWeight: 700,
          letterSpacing: 2,
          textShadow: '0 2px 10px rgba(0, 0, 0, 0.3)'
        }}>
          GL-ChemDraw
        </Typography>

        {/* Subtitle */}
        <Typography variant="h6" sx={{ 
          mb: 4, 
          opacity: 0.95,
          fontWeight: 400,
          textAlign: 'center'
        }}>
          Structure Drawing & Analysis
        </Typography>

        {/* Progress indicator */}
        <Box sx={{ position: 'relative', display: 'inline-flex', mb: 2 }}>
          <CircularProgress 
            size={60} 
            thickness={4}
            sx={{ 
              color: 'white',
              '& .MuiCircularProgress-circle': {
                strokeLinecap: 'round'
              }
            }} 
          />
          <Box sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: '1.5rem'
          }}>
            🧪
          </Box>
        </Box>

        {/* Loading text */}
        <Typography variant="body1" sx={{ 
          mt: 2, 
          opacity: 0.9,
          fontWeight: 300,
          letterSpacing: 2
        }}>
          LOADING...
        </Typography>

        {/* Version or tagline */}
        <Typography variant="caption" sx={{ 
          mt: 3, 
          opacity: 0.7,
          fontSize: '0.75rem'
        }}>
          Professional Chemistry Software
        </Typography>
      </Box>

    </Box>
  );
};

export default LoadingScreen;
