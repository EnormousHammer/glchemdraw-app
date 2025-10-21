/**
 * App Toolbar Component
 * File/Edit/View/Tools/Help menus wired to callbacks
 */

import React from 'react';
import { AppBar, Toolbar as MuiToolbar, IconButton, Typography, Tooltip, Box, Chip, Divider, TextField } from '@mui/material';
import {
  Menu as MenuIcon,
  Save as SaveIcon,
  FolderOpen as OpenIcon,
  InsertDriveFile as NewIcon,
  Undo as UndoIcon,
  Redo as RedoIcon,
  DeleteSweep as ClearIcon,
  Science as ScienceIcon,
  AutoAwesome as SparkleIcon,
  Upload as ImportIcon,
  Download as ExportIcon,
  Edit as DrawIcon,
  Search as SearchIcon,
  Analytics as AdvancedIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  TextFields as NameToStructureIcon,
  Image as ImageIcon,
  ShowChart as NMRIcon,
  BarChart as SpectrumIcon,
  Keyboard as KeyboardIcon,
  Help as HelpIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';

interface AppToolbarProps {
  onNew: () => void;
  onOpen: () => void;
  onSave: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onBatchImport?: () => void;
  onBatchExport?: () => void;
  onNameToStructure?: () => void;
  onAdvancedExport?: () => void;
  onSearchByName?: (name: string) => void;
  darkMode?: boolean;
  onToggleDarkMode?: () => void;
  activeView?: 'structure' | 'nmr';
  onViewChange?: (view: 'structure' | 'nmr') => void;
  rightContent?: React.ReactNode;
}

const AppToolbar: React.FC<AppToolbarProps> = ({
  onNew,
  onOpen,
  onSave,
  onUndo,
  onRedo,
  onClear,
  onBatchImport,
  onBatchExport,
  onNameToStructure,
  onAdvancedExport,
  onSearchByName,
  darkMode,
  onToggleDarkMode,
  activeView,
  onViewChange,
  rightContent,
}) => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [showShortcuts, setShowShortcuts] = React.useState(false);

  const handleSearch = () => {
    if (onSearchByName && searchQuery.trim()) {
      onSearchByName(searchQuery.trim());
      setSearchQuery(''); // Clear search after searching
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };
  return (
    <AppBar 
      position="fixed" 
      elevation={0}
      sx={{
        bgcolor: 'background.paper',
        borderBottom: 1,
        borderColor: 'divider',
        zIndex: 9999, // HIGHEST Z-INDEX TO STAY ABOVE KETCHER
        top: 0,
        left: 0,
        right: 0,
        height: '56px', // Reduced height for desktop
        position: 'fixed', // FORCE FIXED POSITION
      }}
    >
      <MuiToolbar 
        sx={{ 
          py: 0,
          px: 2,
          minHeight: '56px !important',
          maxHeight: '56px',
        }}
      >
        {/* Logo - Compact */}
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: 1.5,
            bgcolor: 'primary.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 1,
            mr: 1.5,
          }}
        >
          <ScienceIcon sx={{ fontSize: 20, color: 'white' }} />
        </Box>

        {/* View Switcher - TOP LEFT - ALWAYS SHOW - BIG AND VISIBLE */}
        <Box sx={{ display: 'flex', gap: 1, mr: 3, alignItems: 'center' }}>
          <Box
            onClick={() => onViewChange?.('structure')}
            sx={{
              bgcolor: activeView === 'structure' ? 'primary.main' : 'grey.200',
              color: activeView === 'structure' ? 'white' : 'text.primary',
              px: 2,
              py: 1,
              borderRadius: 2,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              border: '2px solid',
              borderColor: activeView === 'structure' ? 'primary.main' : 'grey.300',
              '&:hover': {
                bgcolor: activeView === 'structure' ? 'primary.dark' : 'grey.300',
              },
              fontWeight: 'bold',
              fontSize: '0.9rem',
            }}
          >
            <DrawIcon fontSize="small" />
            <Typography variant="button" sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}>
              Structure
            </Typography>
          </Box>
          <Box
            onClick={() => onViewChange?.('nmr')}
            sx={{
              bgcolor: activeView === 'nmr' ? 'primary.main' : 'grey.200',
              color: activeView === 'nmr' ? 'white' : 'text.primary',
              px: 2,
              py: 1,
              borderRadius: 2,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              border: '2px solid',
              borderColor: activeView === 'nmr' ? 'primary.main' : 'grey.300',
              '&:hover': {
                bgcolor: activeView === 'nmr' ? 'primary.dark' : 'grey.300',
              },
              fontWeight: 'bold',
              fontSize: '0.9rem',
            }}
          >
            <SpectrumIcon fontSize="small" />
            <Typography variant="button" sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}>
              NMR
            </Typography>
          </Box>
        </Box>

        {/* Brand - Compact */}
        <Box sx={{ mr: 2 }}>
          <Typography 
            variant="subtitle1" 
            sx={{ 
              fontWeight: 600,
              color: 'text.primary',
              lineHeight: 1.2,
              fontSize: '1rem'
            }}
          >
            GlChemDraw
          </Typography>
          <Typography 
            variant="caption" 
            sx={{ 
              color: 'text.secondary',
              fontSize: '0.65rem',
              fontWeight: 500,
              lineHeight: 1,
            }}
          >
            Structure Drawing & NMR Analysis
          </Typography>
        </Box>

        {activeView === 'structure' && (
        <>
        {/* Name to Structure Search */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 3 }}>
          <TextField
            size="small"
            placeholder="Search compound name..."
            value={searchQuery}
            onChange={(e) => {
              console.log('[Toolbar] Search input changed:', e.target.value);
              setSearchQuery(e.target.value);
            }}
            onKeyPress={(e) => {
              console.log('[Toolbar] Key pressed:', e.key);
              handleKeyPress(e);
            }}
            onClick={() => console.log('[Toolbar] Search input clicked')}
            onFocus={() => console.log('[Toolbar] Search input focused')}
            sx={{ 
              width: 200,
              '& .MuiOutlinedInput-root': {
                height: '36px',
                fontSize: '0.875rem',
                pointerEvents: 'auto !important',
                zIndex: 10000,
              },
              '& .MuiInputBase-input': {
                pointerEvents: 'auto !important',
                zIndex: 10001,
              }
            }}
          />
          <IconButton 
            size="small"
            onClick={() => {
              console.log('[Toolbar] Search button clicked');
              handleSearch();
            }}
            sx={{ 
              bgcolor: 'primary.main',
              color: 'white',
              '&:hover': { bgcolor: 'primary.dark' },
              height: '36px',
              width: '36px',
              pointerEvents: 'auto !important',
              zIndex: 10000,
            }}
          >
            <SearchIcon />
          </IconButton>
        </Box>
        </>
        )}

        <Box sx={{ flexGrow: 1 }} />





        <Divider orientation="vertical" flexItem sx={{ mx: 0.75, bgcolor: 'divider' }} />

        {/* Clear Button - Only essential button */}
        {activeView === 'structure' && (
        <>
        <Tooltip title="Clear Canvas" arrow>
          <IconButton 
            onClick={onClear} 
            size="small"
            aria-label="Clear canvas"
            sx={{ 
              color: 'text.secondary',
              '&:hover': { 
                bgcolor: 'action.hover',
                color: 'text.primary'
              },
            }}
          >
            <ClearIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        </>
        )}

        {/* NMR Keyboard Shortcuts - Integrated into Main Toolbar */}
        {activeView === 'nmr' && (
          <>
            <Divider orientation="vertical" flexItem sx={{ mx: 0.5, bgcolor: 'divider' }} />
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 0.5,
              px: 0.5,
              py: 0.25,
              bgcolor: 'action.hover',
              borderRadius: 0.5,
              minWidth: 'fit-content'
            }}>
              <KeyboardIcon sx={{ color: 'primary.main', fontSize: 14 }} />
              <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.secondary', whiteSpace: 'nowrap' }}>
                <Chip label="R" size="small" sx={{ mx: 0.25, fontWeight: 'bold', fontSize: '0.6rem', height: 14, minWidth: 16 }} />Ranges
                <Chip label="P" size="small" sx={{ mx: 0.25, fontWeight: 'bold', fontSize: '0.6rem', height: 14, minWidth: 16 }} />Peaks
                <Chip label="Z" size="small" sx={{ mx: 0.25, fontWeight: 'bold', fontSize: '0.6rem', height: 14, minWidth: 16 }} />Zoom
                <Chip label="I" size="small" sx={{ mx: 0.25, fontWeight: 'bold', fontSize: '0.6rem', height: 14, minWidth: 16 }} />Integrate
                <Chip label="Shift+Drag" size="small" sx={{ mx: 0.25, fontWeight: 'bold', fontSize: '0.6rem', height: 14, minWidth: 16, bgcolor: 'primary.main', color: 'white' }} />
              </Typography>
            </Box>
          </>
        )}

        {/* Theme Toggle */}
        {onToggleDarkMode && (
          <Tooltip title={darkMode ? "Light Mode" : "Dark Mode"} arrow>
            <IconButton
              onClick={onToggleDarkMode}
              size="small"
              aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
              sx={{ 
                color: 'text.secondary',
                '&:hover': { 
                  bgcolor: 'action.hover',
                  color: 'text.primary'
                },
              }}
            >
              {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
          </Tooltip>
        )}

        {rightContent}
      </MuiToolbar>
    </AppBar>
  );
};

export default AppToolbar;



