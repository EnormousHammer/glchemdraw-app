/**
 * LoadingScreen Component
 * Matches app branding: GL-Chemdraw, GL Chemtec & AIVON logos
 */

import React, { useEffect, useState } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';

const CYAN = '#00BCD4';

interface LoadingScreenProps {
  onComplete: () => void;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ onComplete }) => {
  const [glcLogoError, setGlcLogoError] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => onComplete(), 5000);
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
        background: '#0a0a0a',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        color: '#e8e8e8',
        overflow: 'hidden',
      }}
    >
      {/* Top line */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '80%',
          maxWidth: 400,
          height: 1,
          background: `linear-gradient(90deg, transparent, ${CYAN}, transparent)`,
        }}
      />

      {/* Center content */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          flex: 1,
          justifyContent: 'center',
          px: 3,
        }}
      >
        {/* Hollow loading circle */}
        <CircularProgress
          size={48}
          thickness={2}
          sx={{
            color: CYAN,
            mb: 4,
            '& .MuiCircularProgress-circle': {
              strokeLinecap: 'round',
            },
          }}
        />

        {/* Title */}
        <Typography
          sx={{
            fontSize: '1.25rem',
            fontWeight: 500,
            color: '#fff',
            textAlign: 'center',
            mb: 1,
          }}
        >
          GL-Chemdraw — Chemical Structure Drawing for GLC
        </Typography>

        {/* Built by */}
        <Typography
          sx={{
            fontSize: '0.95rem',
            color: CYAN,
            mb: 2,
          }}
        >
          Built by AIVON
        </Typography>

        {/* Support */}
        <Typography
          component="a"
          href="mailto:haron@aivon.tech"
          sx={{
            fontSize: '0.85rem',
            color: CYAN,
            textDecoration: 'none',
            '&:hover': { textDecoration: 'underline' },
          }}
        >
          Support: haron@aivon.tech
        </Typography>
      </Box>

      {/* Bottom divider line */}
      <Box
        sx={{
          width: '80%',
          maxWidth: 400,
          height: 1,
          background: `linear-gradient(90deg, transparent, ${CYAN}, transparent)`,
          mb: 3,
        }}
      />

      {/* Logo row: GL Chemtec left, AIVON right */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          width: '100%',
          maxWidth: 520,
          px: 4,
          pb: 5,
        }}
      >
        {/* GL Chemtec - left */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            minHeight: 80,
          }}
        >
          {glcLogoError ? (
            <Typography sx={{ color: '#e8e8e8', fontSize: '1rem', fontWeight: 600 }}>
              GL Chemtec
            </Typography>
          ) : (
            <Box
              component="img"
              src="/GLC_Logo.png"
              alt="GL Chemtec"
              onError={() => setGlcLogoError(true)}
              sx={{
                maxWidth: 160,
                maxHeight: 80,
                width: 'auto',
                height: 'auto',
                objectFit: 'contain',
                filter: 'drop-shadow(0 0 16px rgba(0, 188, 212, 0.25))',
              }}
            />
          )}
        </Box>

        {/* Spacer between logos */}
        <Box sx={{ width: 48, flexShrink: 0 }} />

        {/* AIVON - right */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            minHeight: 80,
          }}
        >
          <Box
            component="img"
            src="/Full_logo.png"
            alt="AIVON"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = '/aivon_logo.png';
            }}
            sx={{
              maxWidth: 160,
              maxHeight: 80,
              width: 'auto',
              height: 'auto',
              objectFit: 'contain',
              filter: 'drop-shadow(0 0 16px rgba(0, 188, 212, 0.25))',
            }}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default LoadingScreen;
