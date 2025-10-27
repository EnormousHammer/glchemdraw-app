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
  SelectAll as SelectAllIcon,
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
            Structure Drawing & Analysis
          </Typography>
        </Box>

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

        <Box sx={{ flexGrow: 1 }} />

        {/* Selection Tool Help */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mr: 1 }}>
          <Tooltip 
            title="Quick copy instructions"
            arrow
            placement="bottom"
          >
            <Chip
              icon={<SelectAllIcon sx={{ fontSize: 14, color: 'primary.main' }} />}
              label="How to copy"
              size="small"
              variant="outlined"
              sx={{
                fontSize: '0.7rem',
                fontWeight: 500,
                height: 26,
                bgcolor: 'transparent',
                borderColor: 'primary.main',
                color: 'primary.main',
                '&:hover': {
                  bgcolor: 'action.hover',
                  borderColor: 'primary.dark'
                }
              }}
            />
          </Tooltip>
          <Typography 
            variant="caption" 
            sx={{ 
              fontSize: '0.7rem', 
              color: 'text.secondary',
              fontWeight: 500 
            }}
          >
            Ctrl+LShift+C
          </Typography>
        </Box>

        <Box sx={{ width: 8 }} />

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



