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
import MenuSystem from './MenuSystem';

interface AppToolbarProps {
  onNew: () => void;
  onOpen: () => void;
  onSave: () => void;
  onSaveAs: () => void;
  onImport: () => void;
  onExport: () => void;
  onPrint: () => void;
  onExit: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onCut: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onClear: () => void;
  onFind: () => void;
  onSelectAll: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFullscreen: () => void;
  onToggleSidebar: () => void;
  onToggleTheme: () => void;
  onToggleVisibility: () => void;
  onBatchImport?: () => void;
  onBatchExport?: () => void;
  onNameToStructure?: () => void;
  onAdvancedExport?: () => void;
  onReactionTemplates?: () => void;
  on3DViewer?: () => void;
  onNMRAnalyzer?: () => void;
  onAIIntegration?: () => void;
  onAdvancedAnalytics?: () => void;
  onSearchByName?: (name: string) => void;
  onHelp?: () => void;
  onAbout?: () => void;
  onShortcuts?: () => void;
  onBugReport?: () => void;
  onCheckUpdates?: () => void;
  onFeedback?: () => void;
  darkMode?: boolean;
  onToggleDarkMode?: () => void;
  activeView?: 'structure' | 'nmr';
  onViewChange?: (view: 'structure' | 'nmr') => void;
  rightContent?: React.ReactNode;
  canUndo?: boolean;
  canRedo?: boolean;
  canCut?: boolean;
  canCopy?: boolean;
  canPaste?: boolean;
  canClear?: boolean;
}

const AppToolbar: React.FC<AppToolbarProps> = ({
  onNew,
  onOpen,
  onSave,
  onSaveAs,
  onImport,
  onExport,
  onPrint,
  onExit,
  onUndo,
  onRedo,
  onCut,
  onCopy,
  onPaste,
  onClear,
  onFind,
  onSelectAll,
  onZoomIn,
  onZoomOut,
  onFullscreen,
  onToggleSidebar,
  onToggleTheme,
  onToggleVisibility,
  onBatchImport,
  onBatchExport,
  onNameToStructure,
  onAdvancedExport,
  onReactionTemplates,
  on3DViewer,
  onNMRAnalyzer,
  onAIIntegration,
  onAdvancedAnalytics,
  onSearchByName,
  onHelp,
  onAbout,
  onShortcuts,
  onBugReport,
  onCheckUpdates,
  onFeedback,
  darkMode,
  onToggleDarkMode,
  activeView,
  onViewChange,
  rightContent,
  canUndo,
  canRedo,
  canCut,
  canCopy,
  canPaste,
  canClear,
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

        {/* Menu System */}
        <MenuSystem
          onNew={onNew}
          onOpen={onOpen}
          onSave={onSave}
          onSaveAs={onSaveAs || (() => {})}
          onImport={onImport || (() => {})}
          onExport={onExport || (() => {})}
          onPrint={onPrint || (() => {})}
          onExit={onExit || (() => {})}
          onUndo={onUndo}
          onRedo={onRedo}
          onCut={onCut || (() => {})}
          onCopy={onCopy || (() => {})}
          onPaste={onPaste || (() => {})}
          onClear={onClear}
          onFind={onFind || (() => {})}
          onSelectAll={onSelectAll || (() => {})}
          onZoomIn={onZoomIn || (() => {})}
          onZoomOut={onZoomOut || (() => {})}
          onFullscreen={onFullscreen || (() => {})}
          onToggleSidebar={onToggleSidebar || (() => {})}
          onToggleTheme={onToggleTheme || (() => {})}
          onToggleVisibility={onToggleVisibility || (() => {})}
          onNameToStructure={onNameToStructure || (() => {})}
          onAdvancedExport={onAdvancedExport || (() => {})}
          onBatchImport={onBatchImport || (() => {})}
          onBatchExport={onBatchExport || (() => {})}
          onReactionTemplates={onReactionTemplates || (() => {})}
          on3DViewer={on3DViewer || (() => {})}
          onNMRAnalyzer={onNMRAnalyzer || (() => {})}
          onAIIntegration={onAIIntegration || (() => {})}
          onAdvancedAnalytics={onAdvancedAnalytics || (() => {})}
          onHelp={onHelp || (() => {})}
          onAbout={onAbout || (() => {})}
          onShortcuts={onShortcuts || (() => {})}
          onBugReport={onBugReport || (() => {})}
          onCheckUpdates={onCheckUpdates || (() => {})}
          onFeedback={onFeedback || (() => {})}
          darkMode={darkMode}
          canUndo={canUndo}
          canRedo={canRedo}
          canCut={canCut}
          canCopy={canCopy}
          canPaste={canPaste}
          canClear={canClear}
          activeView={activeView}
        />

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



