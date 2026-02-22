/**
 * LoadingScreen Component
 * Background video with particles, animations, and 5-second timer
 */

import React, { useEffect, useRef } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';

interface LoadingScreenProps {
  onComplete: () => void;
}

const LOADING_FONT = "'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ onComplete }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

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
      {[...Array(10)].map((_, i) => (
        <Box
          key={i}
          sx={{
            position: 'absolute',
            width: 16 + (i % 5) * 4,
            height: 16 + (i % 5) * 4,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.1)',
            top: `${(i * 9) % 100}%`,
            left: `${(i * 11) % 100}%`,
            animation: `float ${4 + (i % 4)}s ease-in-out infinite`,
            animationDelay: `${(i % 3) * 0.5}s`,
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

      {/* Subtle dark overlay for readability */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.6) 100%)',
          zIndex: 1,
          pointerEvents: 'none',
        }}
      />

      {/* Main content */}
      <Box
        sx={{
          position: 'relative',
          zIndex: 2,
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
            fontSize: '5.5rem',
            color: 'white',
            filter: 'drop-shadow(0 0 24px rgba(255, 255, 255, 0.5))',
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
            fontFamily: LOADING_FONT,
            mb: 1.5,
            fontWeight: 600,
            letterSpacing: 3,
            textShadow: '0 2px 20px rgba(0, 0, 0, 0.4)',
          }}
        >
          GL-ChemDraw
        </Typography>

        {/* Subtitle */}
        <Typography
          variant="h6"
          sx={{
            fontFamily: LOADING_FONT,
            mb: 4,
            opacity: 0.9,
            fontWeight: 400,
            textAlign: 'center',
            letterSpacing: 1,
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
            fontFamily: LOADING_FONT,
            mt: 2,
            opacity: 0.9,
            fontWeight: 400,
            letterSpacing: 3,
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
            fontFamily: LOADING_FONT,
            mt: 3,
            opacity: 0.65,
            fontSize: '0.8rem',
            letterSpacing: 1.5,
          }}
        >
          Click anywhere to start
        </Typography>
      </Box>
    </Box>
  );
};

export default LoadingScreen;
