/**
 * Comprehensive Menu System Component
 * File, Edit, View, Tools, Help menus with keyboard shortcuts
 */

import React, { useState, useCallback } from 'react';
import {
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
  Box,
  Chip,
  Tooltip,
} from '@mui/material';
import {
  // File menu icons
  InsertDriveFile as NewIcon,
  FolderOpen as OpenIcon,
  Save as SaveIcon,
  SaveAlt as SaveAsIcon,
  Upload as ImportIcon,
  Download as ExportIcon,
  Print as PrintIcon,
  Close as ExitIcon,
  
  // Edit menu icons
  Undo as UndoIcon,
  Redo as RedoIcon,
  ContentCut as CutIcon,
  ContentCopy as CopyIcon,
  ContentPaste as PasteIcon,
  DeleteSweep as ClearIcon,
  FindReplace as FindIcon,
  SelectAll as SelectAllIcon,
  
  // View menu icons
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Fullscreen as FullscreenIcon,
  ViewSidebar as SidebarIcon,
  Palette as ThemeIcon,
  Visibility as VisibilityIcon,
  
  // Tools menu icons
  Science as ChemistryIcon,
  AutoAwesome as AIIcon,
  Analytics as AnalyticsIcon,
  Build as ToolsIcon,
  ViewInAr as View3DIcon,
  ShowChart as NMRIcon,
  TextFields as NameToStructureIcon,
  Search as SearchIcon,
  Apps as BatchIcon,
  LocalLibrary as TemplateIcon,
  
  // Help menu icons
  Help as HelpIcon,
  Info as AboutIcon,
  Keyboard as ShortcutsIcon,
  BugReport as BugIcon,
  Update as UpdateIcon,
  Feedback as FeedbackIcon,
} from '@mui/icons-material';

interface MenuSystemProps {
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
  onNameToStructure: () => void;
  onAdvancedExport: () => void;
  onBatchImport: () => void;
  onBatchExport: () => void;
  onReactionTemplates: () => void;
  on3DViewer: () => void;
  onNMRAnalyzer: () => void;
  onAIIntegration: () => void;
  onAdvancedAnalytics: () => void;
  onHelp: () => void;
  onAbout: () => void;
  onShortcuts: () => void;
  onBugReport: () => void;
  onCheckUpdates: () => void;
  onFeedback: () => void;
  darkMode?: boolean;
  canUndo?: boolean;
  canRedo?: boolean;
  canCut?: boolean;
  canCopy?: boolean;
  canPaste?: boolean;
  canClear?: boolean;
  activeView?: 'structure' | 'nmr';
}

interface MenuState {
  file: HTMLElement | null;
  edit: HTMLElement | null;
  view: HTMLElement | null;
  tools: HTMLElement | null;
  help: HTMLElement | null;
}

const KEYBOARD_SHORTCUTS = {
  'Ctrl+N': 'New File',
  'Ctrl+O': 'Open File',
  'Ctrl+S': 'Save',
  'Ctrl+Shift+S': 'Save As',
  'Ctrl+I': 'Import',
  'Ctrl+E': 'Export',
  'Ctrl+P': 'Print',
  'Ctrl+Q': 'Exit',
  'Ctrl+Z': 'Undo',
  'Ctrl+Y': 'Redo',
  'Ctrl+X': 'Cut',
  'Ctrl+C': 'Copy',
  'Ctrl+V': 'Paste',
  'Delete': 'Clear',
  'Ctrl+F': 'Find',
  'Ctrl+A': 'Select All',
  'Ctrl++': 'Zoom In',
  'Ctrl+-': 'Zoom Out',
  'F11': 'Fullscreen',
  'Ctrl+B': 'Toggle Sidebar',
  'Ctrl+T': 'Toggle Theme',
  'Ctrl+H': 'Help',
  'F1': 'Shortcuts',
};

export const MenuSystem: React.FC<MenuSystemProps> = ({
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
  onNameToStructure,
  onAdvancedExport,
  onBatchImport,
  onBatchExport,
  onReactionTemplates,
  on3DViewer,
  onNMRAnalyzer,
  onAIIntegration,
  onAdvancedAnalytics,
  onHelp,
  onAbout,
  onShortcuts,
  onBugReport,
  onCheckUpdates,
  onFeedback,
  darkMode = false,
  canUndo = false,
  canRedo = false,
  canCut = false,
  canCopy = false,
  canPaste = false,
  canClear = false,
  activeView = 'structure',
}) => {
  const [menuState, setMenuState] = useState<MenuState>({
    file: null,
    edit: null,
    view: null,
    tools: null,
    help: null,
  });

  const handleMenuOpen = useCallback((menu: keyof MenuState) => (event: React.MouseEvent<HTMLElement>) => {
    setMenuState(prev => ({ ...prev, [menu]: event.currentTarget }));
  }, []);

  const handleMenuClose = useCallback((menu: keyof MenuState) => () => {
    setMenuState(prev => ({ ...prev, [menu]: null }));
  }, []);

  const renderShortcut = (shortcut: string) => (
    <Chip
      label={shortcut}
      size="small"
      variant="outlined"
      sx={{ 
        fontSize: '0.7rem', 
        height: '20px',
        fontFamily: 'monospace',
        bgcolor: 'background.default',
        borderColor: 'divider',
      }}
    />
  );

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      {/* File Menu */}
      <Tooltip title="File operations">
        <Typography
          variant="button"
          onClick={handleMenuOpen('file')}
          sx={{
            cursor: 'pointer',
            px: 1,
            py: 0.5,
            borderRadius: 1,
            '&:hover': { bgcolor: 'action.hover' },
            fontWeight: 500,
          }}
        >
          File
        </Typography>
      </Tooltip>
      <Menu
        anchorEl={menuState.file}
        open={Boolean(menuState.file)}
        onClose={handleMenuClose('file')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      >
        <MenuItem onClick={() => { onNew(); handleMenuClose('file')(); }}>
          <ListItemIcon><NewIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="New" />
          {renderShortcut('Ctrl+N')}
        </MenuItem>
        <MenuItem onClick={() => { onOpen(); handleMenuClose('file')(); }}>
          <ListItemIcon><OpenIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="Open" />
          {renderShortcut('Ctrl+O')}
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => { onSave(); handleMenuClose('file')(); }}>
          <ListItemIcon><SaveIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="Save" />
          {renderShortcut('Ctrl+S')}
        </MenuItem>
        <MenuItem onClick={() => { onSaveAs(); handleMenuClose('file')(); }}>
          <ListItemIcon><SaveAsIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="Save As" />
          {renderShortcut('Ctrl+Shift+S')}
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => { onImport(); handleMenuClose('file')(); }}>
          <ListItemIcon><ImportIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="Import" />
          {renderShortcut('Ctrl+I')}
        </MenuItem>
        <MenuItem onClick={() => { onExport(); handleMenuClose('file')(); }}>
          <ListItemIcon><ExportIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="Export" />
          {renderShortcut('Ctrl+E')}
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => { onPrint(); handleMenuClose('file')(); }}>
          <ListItemIcon><PrintIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="Print" />
          {renderShortcut('Ctrl+P')}
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => { onExit(); handleMenuClose('file')(); }}>
          <ListItemIcon><ExitIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="Exit" />
          {renderShortcut('Ctrl+Q')}
        </MenuItem>
      </Menu>

      {/* Edit Menu */}
      <Tooltip title="Edit operations">
        <Typography
          variant="button"
          onClick={handleMenuOpen('edit')}
          sx={{
            cursor: 'pointer',
            px: 1,
            py: 0.5,
            borderRadius: 1,
            '&:hover': { bgcolor: 'action.hover' },
            fontWeight: 500,
          }}
        >
          Edit
        </Typography>
      </Tooltip>
      <Menu
        anchorEl={menuState.edit}
        open={Boolean(menuState.edit)}
        onClose={handleMenuClose('edit')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      >
        <MenuItem onClick={() => { onUndo(); handleMenuClose('edit')(); }} disabled={!canUndo}>
          <ListItemIcon><UndoIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="Undo" />
          {renderShortcut('Ctrl+Z')}
        </MenuItem>
        <MenuItem onClick={() => { onRedo(); handleMenuClose('edit')(); }} disabled={!canRedo}>
          <ListItemIcon><RedoIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="Redo" />
          {renderShortcut('Ctrl+Y')}
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => { onCut(); handleMenuClose('edit')(); }} disabled={!canCut}>
          <ListItemIcon><CutIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="Cut" />
          {renderShortcut('Ctrl+X')}
        </MenuItem>
        <MenuItem onClick={() => { onCopy(); handleMenuClose('edit')(); }} disabled={!canCopy}>
          <ListItemIcon><CopyIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="Copy" />
          {renderShortcut('Ctrl+C')}
        </MenuItem>
        <MenuItem onClick={() => { onPaste(); handleMenuClose('edit')(); }} disabled={!canPaste}>
          <ListItemIcon><PasteIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="Paste" />
          {renderShortcut('Ctrl+V')}
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => { onClear(); handleMenuClose('edit')(); }} disabled={!canClear}>
          <ListItemIcon><ClearIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="Clear" />
          {renderShortcut('Delete')}
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => { onFind(); handleMenuClose('edit')(); }}>
          <ListItemIcon><FindIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="Find & Replace" />
          {renderShortcut('Ctrl+F')}
        </MenuItem>
        <MenuItem onClick={() => { onSelectAll(); handleMenuClose('edit')(); }}>
          <ListItemIcon><SelectAllIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="Select All" />
          {renderShortcut('Ctrl+A')}
        </MenuItem>
      </Menu>

      {/* View Menu */}
      <Tooltip title="View options">
        <Typography
          variant="button"
          onClick={handleMenuOpen('view')}
          sx={{
            cursor: 'pointer',
            px: 1,
            py: 0.5,
            borderRadius: 1,
            '&:hover': { bgcolor: 'action.hover' },
            fontWeight: 500,
          }}
        >
          View
        </Typography>
      </Tooltip>
      <Menu
        anchorEl={menuState.view}
        open={Boolean(menuState.view)}
        onClose={handleMenuClose('view')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      >
        <MenuItem onClick={() => { onZoomIn(); handleMenuClose('view')(); }}>
          <ListItemIcon><ZoomInIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="Zoom In" />
          {renderShortcut('Ctrl++')}
        </MenuItem>
        <MenuItem onClick={() => { onZoomOut(); handleMenuClose('view')(); }}>
          <ListItemIcon><ZoomOutIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="Zoom Out" />
          {renderShortcut('Ctrl+-')}
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => { onFullscreen(); handleMenuClose('view')(); }}>
          <ListItemIcon><FullscreenIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="Fullscreen" />
          {renderShortcut('F11')}
        </MenuItem>
        <MenuItem onClick={() => { onToggleSidebar(); handleMenuClose('view')(); }}>
          <ListItemIcon><SidebarIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="Toggle Sidebar" />
          {renderShortcut('Ctrl+B')}
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => { onToggleTheme(); handleMenuClose('view')(); }}>
          <ListItemIcon><ThemeIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary={darkMode ? "Light Mode" : "Dark Mode"} />
          {renderShortcut('Ctrl+T')}
        </MenuItem>
        <MenuItem onClick={() => { onToggleVisibility(); handleMenuClose('view')(); }}>
          <ListItemIcon><VisibilityIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="Toggle Visibility" />
        </MenuItem>
      </Menu>

      {/* Tools Menu */}
      <Tooltip title="Tools and features">
        <Typography
          variant="button"
          onClick={handleMenuOpen('tools')}
          sx={{
            cursor: 'pointer',
            px: 1,
            py: 0.5,
            borderRadius: 1,
            '&:hover': { bgcolor: 'action.hover' },
            fontWeight: 500,
          }}
        >
          Tools
        </Typography>
      </Tooltip>
      <Menu
        anchorEl={menuState.tools}
        open={Boolean(menuState.tools)}
        onClose={handleMenuClose('tools')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      >
        <MenuItem onClick={() => { onNameToStructure(); handleMenuClose('tools')(); }}>
          <ListItemIcon><NameToStructureIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="Name to Structure" />
        </MenuItem>
        <MenuItem onClick={() => { onAdvancedExport(); handleMenuClose('tools')(); }}>
          <ListItemIcon><ExportIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="Advanced Export" />
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => { onBatchImport(); handleMenuClose('tools')(); }}>
          <ListItemIcon><ImportIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="Batch Import" />
        </MenuItem>
        <MenuItem onClick={() => { onBatchExport(); handleMenuClose('tools')(); }}>
          <ListItemIcon><BatchIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="Batch Export" />
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => { onReactionTemplates(); handleMenuClose('tools')(); }}>
          <ListItemIcon><TemplateIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="Reaction Templates" />
        </MenuItem>
        <MenuItem onClick={() => { on3DViewer(); handleMenuClose('tools')(); }}>
          <ListItemIcon><View3DIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="3D Viewer" />
        </MenuItem>
        <MenuItem onClick={() => { onNMRAnalyzer(); handleMenuClose('tools')(); }}>
          <ListItemIcon><NMRIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="NMR Analyzer" />
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => { onAIIntegration(); handleMenuClose('tools')(); }}>
          <ListItemIcon><AIIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="AI Integration" />
        </MenuItem>
        <MenuItem onClick={() => { onAdvancedAnalytics(); handleMenuClose('tools')(); }}>
          <ListItemIcon><AnalyticsIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="Advanced Analytics" />
        </MenuItem>
      </Menu>

      {/* Help Menu */}
      <Tooltip title="Help and support">
        <Typography
          variant="button"
          onClick={handleMenuOpen('help')}
          sx={{
            cursor: 'pointer',
            px: 1,
            py: 0.5,
            borderRadius: 1,
            '&:hover': { bgcolor: 'action.hover' },
            fontWeight: 500,
          }}
        >
          Help
        </Typography>
      </Tooltip>
      <Menu
        anchorEl={menuState.help}
        open={Boolean(menuState.help)}
        onClose={handleMenuClose('help')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      >
        <MenuItem onClick={() => { onHelp(); handleMenuClose('help')(); }}>
          <ListItemIcon><HelpIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="Help" />
          {renderShortcut('Ctrl+H')}
        </MenuItem>
        <MenuItem onClick={() => { onShortcuts(); handleMenuClose('help')(); }}>
          <ListItemIcon><ShortcutsIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="Keyboard Shortcuts" />
          {renderShortcut('F1')}
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => { onBugReport(); handleMenuClose('help')(); }}>
          <ListItemIcon><BugIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="Report Bug" />
        </MenuItem>
        <MenuItem onClick={() => { onFeedback(); handleMenuClose('help')(); }}>
          <ListItemIcon><FeedbackIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="Send Feedback" />
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => { onCheckUpdates(); handleMenuClose('help')(); }}>
          <ListItemIcon><UpdateIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="Check for Updates" />
        </MenuItem>
        <MenuItem onClick={() => { onAbout(); handleMenuClose('help')(); }}>
          <ListItemIcon><AboutIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="About GlChemDraw" />
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default MenuSystem;
