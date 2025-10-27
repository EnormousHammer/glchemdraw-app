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
        overflow: 'hidden'
      }}
    >
      {/* Animated floating particles */}
      {[...Array(12)].map((_, i) => (
        <Box
          key={i}
          sx={{
            position: 'absolute',
            width: 20 + Math.random() * 30,
            height: 20 + Math.random() * 30,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.15)',
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            animation: `float ${4 + Math.random() * 4}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 2}s`,
            '@keyframes float': {
              '0%, 100%': { transform: 'translateY(0px) scale(1)' },
              '50%': { transform: 'translateY(-30px) scale(1.1)' }
            }
          }}
        />
      ))}
      
      {/* Hexagonal pattern background */}
      <Box sx={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        opacity: 0.05,
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 30px, rgba(255,255,255,0.1) 30px, rgba(255,255,255,0.1) 60px)',
        backgroundSize: '30px 60px'
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
        {/* Icon with glow effect and pulse */}
        <Box sx={{
          position: 'relative',
          mb: 3,
          animation: 'pulse 2s ease-in-out infinite',
          '@keyframes pulse': {
            '0%, 100%': { transform: 'scale(1)' },
            '50%': { transform: 'scale(1.1)' }
          }
        }}>
          <MoleculeIcon sx={{ 
            fontSize: 90, 
            color: 'white',
            filter: 'drop-shadow(0 0 30px rgba(255, 255, 255, 0.7))',
            animation: 'rotate 8s linear infinite',
            '@keyframes rotate': {
              '0%': { transform: 'rotate(0deg)' },
              '100%': { transform: 'rotate(360deg)' }
            }
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

        {/* Loading text with animated dots */}
        <Typography variant="body1" sx={{ 
          mt: 2, 
          opacity: 0.9,
          fontWeight: 300,
          letterSpacing: 2
        }}>
          LOADING
          <Box component="span" sx={{
            display: 'inline-block',
            animation: 'dots 1.5s steps(4, end) infinite',
            '@keyframes dots': {
              '0%, 20%': { content: '""' },
              '40%': { content: '"."' },
              '60%': { content: '".."' },
              '80%, 100%': { content: '"..."' }
            }
          }}>
            ...
          </Box>
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
