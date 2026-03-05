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
  AutoAwesome as SparkleIcon,
  Upload as ImportIcon,
  Download as ExportIcon,
  Edit as DrawIcon,
  Search as SearchIcon,
  Analytics as AdvancedIcon,
  LibraryBooks as TemplateIcon,
  TextFields as NameToStructureIcon,
  Image as ImageIcon,
  ShowChart as NMRIcon,
  BarChart as SpectrumIcon,
  Keyboard as KeyboardIcon,
  Help as HelpIcon,
  ExpandMore as ExpandMoreIcon,
  Timeline as SpectraIcon,
  SelectAll as SelectAllIcon,
  ArrowForward as ArrowForwardIcon,
  Tune as TuneIcon,
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
  /** When set, displays in search box and triggers search (e.g. from image upload) */
  triggerSearchWithQuery?: string | null;
  onTriggerSearchComplete?: () => void;
  onShortcutsClick?: () => void;
  onReactionsClick?: () => void;
  onFaqClick?: () => void;
  onDocumentSettings?: () => void;
  onAiClick?: () => void;
  rightContent?: React.ReactNode;
  /** Compact mode for embed (?embed=1) - smaller header */
  compact?: boolean;
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
  triggerSearchWithQuery,
  onTriggerSearchComplete,
  onShortcutsClick,
  onReactionsClick,
  onFaqClick,
  onDocumentSettings,
  onAiClick,
  rightContent,
  compact = false,
}) => {
  const toolbarHeight = compact ? 40 : 56;
  const [searchQuery, setSearchQuery] = React.useState('');
  const [showShortcuts, setShowShortcuts] = React.useState(false);

  // When parent triggers search (e.g. from image upload), show query and run search
  React.useEffect(() => {
    if (triggerSearchWithQuery?.trim() && onSearchByName) {
      setSearchQuery(triggerSearchWithQuery.trim());
      onSearchByName(triggerSearchWithQuery.trim());
      onTriggerSearchComplete?.();
    }
  }, [triggerSearchWithQuery, onSearchByName, onTriggerSearchComplete]);

  const handleSearch = () => {
    if (onSearchByName && searchQuery.trim()) {
      onSearchByName(searchQuery.trim());
      setSearchQuery(''); // Clear search after searching
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleSearch();
    }
  };
  return (
    <AppBar 
      position="fixed" 
      elevation={0}
      sx={{
        bgcolor: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
        background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.12), 0 1px 0 rgba(255, 255, 255, 0.05) inset',
        zIndex: 9999,
        top: 0,
        left: 0,
        right: 0,
        width: '100%',
        minWidth: '100%',
        height: `${toolbarHeight}px`,
        position: 'fixed',
        margin: 0,
      }}
    >
      <MuiToolbar 
        sx={{ 
          py: 0,
          px: compact ? 1.5 : 3,
          minHeight: `${toolbarHeight}px !important`,
          maxHeight: `${toolbarHeight}px`,
        }}
      >
        {/* Logo - Complex molecular structure (AI-inspired) */}
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: '8px',
            background: 'linear-gradient(145deg, #1e3a5f 0%, #0f172a 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 12px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.06)',
            mr: 2,
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Three fused aromatic rings (anthracene) - trio */}
            <path d="M4 8 L8 5 L12 8 L12 12 L8 15 L4 12 Z" stroke="white" strokeWidth="1" fill="none" strokeLinejoin="round"/>
            <path d="M8 15 L12 12 L16 15 L16 19 L12 22 L8 19 Z" stroke="white" strokeWidth="1" fill="none" strokeLinejoin="round"/>
            <path d="M12 8 L16 5 L20 8 L20 12 L16 15 L12 12 Z" stroke="white" strokeWidth="1" fill="none" strokeLinejoin="round"/>
          </svg>
        </Box>

        {/* Brand - Enterprise */}
        <Box sx={{ mr: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 600,
              color: 'white',
              fontSize: '1.05rem',
              letterSpacing: '-0.02em',
              whiteSpace: 'nowrap',
            }}
          >
            GL-ChemDraw
          </Typography>
          <Typography 
            variant="caption" 
            sx={{ 
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '0.8rem',
              fontWeight: 500,
              letterSpacing: '0.02em',
              whiteSpace: 'nowrap',
            }}
          >
            Structure Drawing & Analysis
          </Typography>
        </Box>

        <>
        {/* Name to Structure Search - Enterprise */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 3, '& input::placeholder': { color: 'rgba(0,0,0,0.45)' } }}>
          <input
            type="text"
            placeholder="Search compound name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{
              width: '220px',
              height: '36px',
              padding: '0 14px',
              fontSize: '0.875rem',
              border: '1px solid rgba(255, 255, 255, 0.4)',
              borderRadius: '8px',
              outline: 'none',
              backgroundColor: 'white',
              color: '#0f172a',
              transition: 'all 0.2s ease',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'rgba(59, 130, 246, 0.8)';
              e.target.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.2)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.4)';
              e.target.style.boxShadow = 'none';
            }}
          />
          <IconButton 
            size="small"
            onClick={handleSearch}
            sx={{ 
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              color: 'white',
              '&:hover': { 
                background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)',
              },
              height: '36px',
              width: '36px',
              boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)',
              transition: 'all 0.2s ease',
            }}
          >
            <SearchIcon />
          </IconButton>
        </Box>
        </>

        <Box sx={{ flexGrow: 1 }} />

        {/* Shortcuts */}
        {onShortcutsClick && (
          <Tooltip title="Keyboard shortcuts" arrow placement="bottom">
            <Chip
              icon={<KeyboardIcon sx={{ fontSize: 14, color: '#0f172a' }} />}
              label="Shortcuts"
              size="small"
              variant="outlined"
              onClick={onShortcutsClick}
              sx={{
                fontSize: '0.7rem',
                fontWeight: 500,
                height: 26,
                bgcolor: 'white !important',
                borderColor: 'rgba(255,255,255,0.4)',
                color: '#0f172a !important',
                cursor: 'pointer',
                '&:hover': {
                  bgcolor: 'white !important',
                  borderColor: 'rgba(255,255,255,0.7)',
                  color: '#0f172a !important',
                  boxShadow: '0 0 0 1px rgba(255,255,255,0.5)',
                  '& .MuiChip-icon': { color: '#0f172a !important' }
                }
              }}
            />
          </Tooltip>
        )}

        <Box sx={{ width: 8 }} />

        {/* Reactions */}
        {onReactionsClick && (
          <Tooltip title="Reaction arrows & schemes help" arrow placement="bottom">
            <Chip
              icon={<ArrowForwardIcon sx={{ fontSize: 14, color: '#0f172a' }} />}
              label="Reactions"
              size="small"
              variant="outlined"
              onClick={onReactionsClick}
              sx={{
                fontSize: '0.7rem',
                fontWeight: 500,
                height: 26,
                bgcolor: 'white !important',
                borderColor: 'rgba(255,255,255,0.4)',
                color: '#0f172a !important',
                cursor: 'pointer',
                '&:hover': {
                  bgcolor: 'white !important',
                  borderColor: 'rgba(255,255,255,0.7)',
                  color: '#0f172a !important',
                  boxShadow: '0 0 0 1px rgba(255,255,255,0.5)',
                  '& .MuiChip-icon': { color: '#0f172a !important' }
                }
              }}
            />
          </Tooltip>
        )}

        <Box sx={{ width: 8 }} />

        {/* AI chip - scrolls to AI section */}
        {onAiClick && (
          <Tooltip title="AI Assistant — run analysis, name, reactions" arrow placement="bottom">
            <Chip
              icon={<SparkleIcon sx={{ fontSize: 14, color: '#7c3aed' }} />}
              label="AI"
              size="small"
              variant="outlined"
              onClick={onAiClick}
              sx={{
                fontSize: '0.7rem',
                fontWeight: 600,
                height: 26,
                bgcolor: 'rgba(124,58,237,0.15) !important',
                borderColor: 'rgba(124,58,237,0.5)',
                color: '#a78bfa !important',
                cursor: 'pointer',
                '&:hover': {
                  bgcolor: 'rgba(124,58,237,0.25) !important',
                  borderColor: '#7c3aed',
                  color: '#c4b5fd !important',
                  boxShadow: '0 0 0 1px rgba(124,58,237,0.4)',
                  '& .MuiChip-icon': { color: '#a78bfa !important' }
                }
              }}
            />
          </Tooltip>
        )}

        <Box sx={{ width: 8 }} />

        {/* FAQ / How to Use */}
        {onFaqClick && (
          <Tooltip title="How to use GL-Chemdraw" arrow placement="bottom">
            <Chip
              icon={<HelpIcon sx={{ fontSize: 14, color: '#0f172a' }} />}
              label="FAQ"
              size="small"
              variant="outlined"
              onClick={onFaqClick}
              sx={{
                fontSize: '0.7rem',
                fontWeight: 500,
                height: 26,
                bgcolor: 'white !important',
                borderColor: 'rgba(255,255,255,0.4)',
                color: '#0f172a !important',
                cursor: 'pointer',
                '&:hover': {
                  bgcolor: 'white !important',
                  borderColor: 'rgba(255,255,255,0.7)',
                  color: '#0f172a !important',
                  boxShadow: '0 0 0 1px rgba(255,255,255,0.5)',
                  '& .MuiChip-icon': { color: '#0f172a !important' }
                }
              }}
            />
          </Tooltip>
        )}

        <Box sx={{ width: 8 }} />

        {/* Document Settings */}
        {onDocumentSettings && (
          <Tooltip title="Document drawing settings" arrow placement="bottom">
            <Chip
              icon={<TuneIcon sx={{ fontSize: 14, color: '#0f172a' }} />}
              label="Drawing"
              size="small"
              variant="outlined"
              onClick={onDocumentSettings}
              sx={{
                fontSize: '0.7rem',
                fontWeight: 500,
                height: 26,
                bgcolor: 'white !important',
                borderColor: 'rgba(255,255,255,0.4)',
                color: '#0f172a !important',
                cursor: 'pointer',
                '&:hover': {
                  bgcolor: 'white !important',
                  borderColor: 'rgba(255,255,255,0.7)',
                  color: '#0f172a !important',
                  boxShadow: '0 0 0 1px rgba(255,255,255,0.5)',
                  '& .MuiChip-icon': { color: '#0f172a !important' }
                }
              }}
            />
          </Tooltip>
        )}

        {/* Export */}
        {onAdvancedExport && (
          <>
            <Box sx={{ width: 8 }} />
            <Tooltip title="Export as PNG, SVG, PDF, MOL, SDF, SMILES…" arrow placement="bottom">
              <Chip
                icon={<ExportIcon sx={{ fontSize: 14, color: 'white' }} />}
                label="Export"
                size="small"
                variant="outlined"
                onClick={onAdvancedExport}
                sx={{
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  height: 26,
                  bgcolor: '#1d6fa4 !important',
                  borderColor: '#2196f3',
                  color: 'white !important',
                  cursor: 'pointer',
                  '&:hover': {
                    bgcolor: '#1565c0 !important',
                    borderColor: '#90caf9',
                    color: 'white !important',
                    boxShadow: '0 0 0 1px rgba(33,150,243,0.5)',
                    '& .MuiChip-icon': { color: 'white !important' }
                  }
                }}
              />
            </Tooltip>
          </>
        )}

        <Box sx={{ width: 8 }} />

        {rightContent}
      </MuiToolbar>
    </AppBar>
  );
};

export default AppToolbar;



