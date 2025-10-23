/**
 * Simple Drag and Drop Test
 * This will help us debug what's actually blocking drag and drop
 */

import React, { useState } from 'react';
import { Box, Typography, Paper } from '@mui/material';

export const SimpleDragTest: React.FC = () => {
  const [dragState, setDragState] = useState<string>('No drag');
  const [lastEvent, setLastEvent] = useState<any>(null);
  const [files, setFiles] = useState<File[]>([]);

  const handleDragOver = (e: React.DragEvent) => {
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
    console.log('🎯 SIMPLE TEST: Drag over event triggered!', e.dataTransfer.types);
  };

  const handleDragEnter = (e: React.DragEvent) => {
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
    console.log('🎯 SIMPLE TEST: Drag enter event triggered!', e.dataTransfer.types);
  };

  const handleDragLeave = (e: React.DragEvent) => {
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
    console.log('🎯 SIMPLE TEST: Drag leave event triggered!', e.dataTransfer.types);
  };

  const handleDrop = (e: React.DragEvent) => {
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
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles(droppedFiles);
    console.log('🎯 SIMPLE TEST: Drop event triggered!', droppedFiles);
  };

  return (
    <Paper
      sx={{
        p: 3,
        m: 2,
        border: '3px dashed #ff0000',
        backgroundColor: dragState === 'Drag over' ? 'rgba(255, 0, 0, 0.1)' : 'white',
        minHeight: 300,
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
      <Typography variant="h4" gutterBottom color="red">
        🧪 SIMPLE DRAG TEST
      </Typography>
      <Typography variant="h6" gutterBottom>
        Current State: <strong>{dragState}</strong>
      </Typography>
      <Typography variant="body1" gutterBottom>
        Drag ANY file over this red area to test
      </Typography>
      
      {files.length > 0 && (
        <Box sx={{ mt: 2, p: 2, bgcolor: 'green.100', borderRadius: 1, width: '100%' }}>
          <Typography variant="h6" color="green">Files Dropped:</Typography>
          {files.map((file, index) => (
            <Typography key={index} variant="body2">
              {index + 1}. {file.name} ({file.type || 'no type'}) - {file.size} bytes
            </Typography>
          ))}
        </Box>
      )}
      
      {lastEvent && (
        <Box sx={{ mt: 2, p: 1, bgcolor: 'grey.100', borderRadius: 1, width: '100%' }}>
          <Typography variant="caption" component="pre" sx={{ fontSize: '10px' }}>
            {JSON.stringify(lastEvent, null, 2)}
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default SimpleDragTest;
