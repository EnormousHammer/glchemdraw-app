/**
 * Simple drag and drop test component
 * This will help us verify if drag and drop events are working at all
 */

import React, { useState, useCallback } from 'react';
import { Box, Typography, Paper } from '@mui/material';

export const DragDropTest: React.FC = () => {
  const [dragState, setDragState] = useState<string>('No drag');
  const [lastEvent, setLastEvent] = useState<any>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragState('Drag over');
    setLastEvent({
      type: 'dragover',
      types: e.dataTransfer.types,
      files: e.dataTransfer.files.length,
      clientX: e.clientX,
      clientY: e.clientY
    });
    console.log('🎯 TEST: Drag over event triggered!', e.dataTransfer.types);
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragState('Drag enter');
    setLastEvent({
      type: 'dragenter',
      types: e.dataTransfer.types,
      files: e.dataTransfer.files.length,
      clientX: e.clientX,
      clientY: e.clientY
    });
    console.log('🎯 TEST: Drag enter event triggered!', e.dataTransfer.types);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragState('Drag leave');
    setLastEvent({
      type: 'dragleave',
      types: e.dataTransfer.types,
      files: e.dataTransfer.files.length,
      clientX: e.clientX,
      clientY: e.clientY
    });
    console.log('🎯 TEST: Drag leave event triggered!', e.dataTransfer.types);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragState('Drop');
    setLastEvent({
      type: 'drop',
      types: e.dataTransfer.types,
      files: e.dataTransfer.files.length,
      clientX: e.clientX,
      clientY: e.clientY
    });
    console.log('🎯 TEST: Drop event triggered!', e.dataTransfer.files);
  }, []);

  return (
    <Paper
      sx={{
        p: 3,
        m: 2,
        border: '2px dashed #1976d2',
        backgroundColor: dragState === 'Drag over' ? 'rgba(25, 118, 210, 0.1)' : 'white',
        minHeight: 200,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <Typography variant="h6" gutterBottom>
        🧪 Drag & Drop Test
      </Typography>
      <Typography variant="body1" gutterBottom>
        Current State: <strong>{dragState}</strong>
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Drag a file over this area to test
      </Typography>
      {lastEvent && (
        <Box sx={{ mt: 2, p: 1, bgcolor: 'grey.100', borderRadius: 1 }}>
          <Typography variant="caption" component="pre">
            {JSON.stringify(lastEvent, null, 2)}
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default DragDropTest;



