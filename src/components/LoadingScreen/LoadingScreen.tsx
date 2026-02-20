/**
 * LoadingScreen Component
 * Background video with particles, animations, and 5-second timer
 */

import React, { useEffect, useRef, useState } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';

interface LoadingScreenProps {
  onComplete: () => void;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ onComplete }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [glcLogoError, setGlcLogoError] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => onComplete(), 5000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch((err) => console.error('Video play failed:', err));
    }
  }, []);

  return (
    <Box
      onClick={() => onComplete()}
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'black',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        color: 'white',
        overflow: 'hidden',
        cursor: 'pointer',
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
              '50%': { transform: 'translateY(-30px) scale(1.1)' },
            },
          }}
        />
      ))}

      {/* Background video */}
      <Box
        component="video"
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        sx={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          zIndex: 0,
        }}
      >
        <source src="/brv1.mp4" type="video/mp4" />
      </Box>

      {/* Main content */}
      <Box
        sx={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          bgcolor: 'transparent',
          padding: 6,
          minWidth: '400px',
        }}
      >
        {/* Icon with glow effect and pulse */}
        <Box
          sx={{
            position: 'relative',
            mb: 3,
            fontSize: '6rem',
            color: 'white',
            filter: 'drop-shadow(0 0 30px rgba(255, 255, 255, 0.7))',
            animation: 'pulse 2s ease-in-out infinite',
            '@keyframes pulse': {
              '0%, 100%': { transform: 'scale(1)' },
              '50%': { transform: 'scale(1.1)' },
            },
          }}
        >
          ⚛️
        </Box>

        {/* App name */}
        <Typography
          variant="h2"
          sx={{
            mb: 1.5,
            fontWeight: 700,
            letterSpacing: 2,
            textShadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
          }}
        >
          GL-ChemDraw
        </Typography>

        {/* Subtitle */}
        <Typography
          variant="h6"
          sx={{
            mb: 4,
            opacity: 0.95,
            fontWeight: 400,
            textAlign: 'center',
          }}
        >
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
                strokeLinecap: 'round',
              },
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontSize: '1.5rem',
            }}
          >
            🧪
          </Box>
        </Box>

        {/* Loading text with animated dots */}
        <Typography
          variant="body1"
          sx={{
            mt: 2,
            opacity: 0.9,
            fontWeight: 300,
            letterSpacing: 2,
          }}
        >
          LOADING
          <Box
            component="span"
            sx={{
              animation: 'dots 1.5s steps(4, end) infinite',
              '@keyframes dots': {
                '0%, 20%': { content: '""' },
                '40%': { content: '"."' },
                '60%': { content: '".."' },
                '80%, 100%': { content: '"..."' },
              },
            }}
          >
            ...
          </Box>
        </Typography>

        {/* Click to skip hint */}
        <Typography
          variant="caption"
          sx={{
            mt: 3,
            opacity: 0.7,
            fontSize: '0.75rem',
          }}
        >
          Click anywhere to start
        </Typography>

        {/* GL Chemtec & AIVON logos */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            gap: 3,
            mt: 4,
          }}
        >
          {glcLogoError ? (
            <Typography sx={{ color: 'white', fontSize: '1rem', fontWeight: 600 }}>
              GL Chemtec
            </Typography>
          ) : (
            <Box
              component="img"
              src="/GLC_Logo.png"
              alt="GL Chemtec"
              onError={() => setGlcLogoError(true)}
              sx={{
                maxWidth: 140,
                maxHeight: 70,
                objectFit: 'contain',
                filter: 'drop-shadow(0 0 12px rgba(255, 255, 255, 0.3))',
              }}
            />
          )}
          <Box
            component="img"
            src="/Full_logo.png"
            alt="AIVON"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = '/aivon_logo.png';
            }}
            sx={{
              maxWidth: 140,
              maxHeight: 70,
              objectFit: 'contain',
              filter: 'drop-shadow(0 0 12px rgba(255, 255, 255, 0.3))',
            }}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default LoadingScreen;
