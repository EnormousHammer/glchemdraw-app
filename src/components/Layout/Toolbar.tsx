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
  LibraryBooks as TemplateIcon,
  TextFields as NameToStructureIcon,
  Image as ImageIcon,
  ShowChart as NMRIcon,
  BarChart as SpectrumIcon,
  Keyboard as KeyboardIcon,
  Help as HelpIcon,
  ExpandMore as ExpandMoreIcon,
  AccountTree as MoleculeIcon,
  Timeline as SpectraIcon,
  Hexagon as BenzeneIcon,
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
  onTemplateLibrary?: () => void;
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
  onTemplateLibrary,
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

  // Debug logging
  console.log('[Toolbar] onViewChange:', onViewChange);
  console.log('[Toolbar] activeView:', activeView);

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
        bgcolor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
        zIndex: 9999,
        top: 0,
        left: 0,
        right: 0,
        height: '56px',
        position: 'fixed',
      }}
    >
      <MuiToolbar 
        sx={{ 
          py: 0,
          px: 3,
          minHeight: '56px !important',
          maxHeight: '56px',
        }}
      >
        {/* Logo - Premium */}
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: 2,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)',
            mr: 2,
          }}
        >
          <ScienceIcon sx={{ fontSize: 22, color: 'white' }} />
        </Box>

        {/* View Switcher - Premium Pills */}
        <Box sx={{ 
          display: 'flex', 
          gap: 0.5, 
          mr: 3, 
          alignItems: 'center',
          bgcolor: 'rgba(0, 0, 0, 0.04)',
          borderRadius: 2,
          p: 0.5,
        }}>
          <Box
            onClick={() => onViewChange?.('structure')}
            sx={{
              bgcolor: activeView === 'structure' ? 'white' : 'transparent',
              color: activeView === 'structure' ? 'primary.main' : 'text.secondary',
              px: 2,
              py: 0.75,
              borderRadius: 1.5,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              boxShadow: activeView === 'structure' ? '0 2px 4px rgba(0, 0, 0, 0.1)' : 'none',
              transition: 'all 0.2s ease',
              '&:hover': {
                bgcolor: activeView === 'structure' ? 'white' : 'rgba(0, 0, 0, 0.04)',
              },
              fontWeight: 600,
            }}
          >
            <BenzeneIcon fontSize="small" />
            <Typography variant="button" sx={{ fontWeight: 600, fontSize: '0.875rem', textTransform: 'none' }}>
              Structure
            </Typography>
          </Box>
          <Box
            onClick={() => onViewChange?.('nmr')}
            sx={{
              bgcolor: activeView === 'nmr' ? 'white' : 'transparent',
              color: activeView === 'nmr' ? 'primary.main' : 'text.secondary',
              px: 2,
              py: 0.75,
              borderRadius: 1.5,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              boxShadow: activeView === 'nmr' ? '0 2px 4px rgba(0, 0, 0, 0.1)' : 'none',
              transition: 'all 0.2s ease',
              '&:hover': {
                bgcolor: activeView === 'nmr' ? 'white' : 'rgba(0, 0, 0, 0.04)',
              },
              fontWeight: 600,
            }}
          >
            <SpectraIcon fontSize="small" />
            <Typography variant="button" sx={{ fontWeight: 600, fontSize: '0.875rem', textTransform: 'none' }}>
              NMR
            </Typography>
          </Box>
        </Box>

        {/* Brand - Premium */}
        <Box sx={{ mr: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 700,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontSize: '1.1rem',
              letterSpacing: '-0.02em',
              whiteSpace: 'nowrap',
            }}
          >
            GL-ChemDraw -
          </Typography>
          <Typography 
            variant="caption" 
            sx={{ 
              color: 'text.secondary',
              fontSize: '0.85rem',
              fontWeight: 500,
              letterSpacing: '0.02em',
              whiteSpace: 'nowrap',
            }}
          >
            Structure Drawing & NMR Analysis
          </Typography>
        </Box>

        {activeView === 'structure' && (
        <>
        {/* Name to Structure Search - Premium */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 3 }}>
          <input
            type="text"
            placeholder="Search compound name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            style={{
              width: '220px',
              height: '38px',
              padding: '0 16px',
              fontSize: '0.875rem',
              border: '1px solid rgba(0, 0, 0, 0.12)',
              borderRadius: '8px',
              outline: 'none',
              backgroundColor: 'rgba(0, 0, 0, 0.02)',
              transition: 'all 0.2s ease',
            }}
            onFocus={(e) => {
              e.target.style.backgroundColor = 'white';
              e.target.style.borderColor = '#667eea';
              e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.02)';
              e.target.style.borderColor = 'rgba(0, 0, 0, 0.12)';
              e.target.style.boxShadow = 'none';
            }}
          />
          <IconButton 
            size="small"
            onClick={handleSearch}
            sx={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              '&:hover': { 
                background: 'linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
              },
              height: '38px',
              width: '38px',
              boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)',
              transition: 'all 0.2s ease',
            }}
          >
            <SearchIcon />
          </IconButton>
        </Box>
        </>
        )}

        <Box sx={{ flexGrow: 1 }} />

        {/* NMR Keyboard Shortcuts - show when in NMR view */}
        {activeView === 'nmr' && (
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', mr: 3 }}>
            <Typography variant="caption" sx={{ fontSize: '0.75rem', fontWeight: 600, color: 'text.secondary', opacity: 0.8 }}>
              Shortcuts:
            </Typography>
            <Chip label="R - Ranges" size="small" color="primary" sx={{ height: 24, fontSize: '0.7rem', fontWeight: 600 }} />
            <Chip label="P - Peak Picking" size="small" color="secondary" sx={{ height: 24, fontSize: '0.7rem', fontWeight: 600 }} />
            <Chip label="Z - Zoom" size="small" color="success" sx={{ height: 24, fontSize: '0.7rem', fontWeight: 600 }} />
            <Chip label="I - Integral" size="small" color="warning" sx={{ height: 24, fontSize: '0.7rem', fontWeight: 600 }} />
            <Chip label="Shift+Drag - Pan View" size="small" color="info" sx={{ height: 24, fontSize: '0.7rem', fontWeight: 600 }} />
          </Box>
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



