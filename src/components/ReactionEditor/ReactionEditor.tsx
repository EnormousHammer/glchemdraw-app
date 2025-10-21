/**
 * Reaction Editor Component
 * Interactive reaction scheme editor with arrow drawing and mechanism tools
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Tooltip,
  Stack,
  Chip,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Paper,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  ArrowForward as ArrowIcon,
  Science as ChemistryIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Undo as UndoIcon,
  Redo as RedoIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  CenterFocusStrong as CenterIcon,
  AutoAwesome as AIIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
} from '@mui/icons-material';

export interface ReactionComponent {
  id: string;
  type: 'reactant' | 'product' | 'reagent' | 'catalyst' | 'solvent';
  name: string;
  smiles?: string;
  molfile?: string;
  position: { x: number; y: number };
  isSelected: boolean;
}

export interface ReactionArrow {
  id: string;
  from: string;
  to: string;
  type: 'single' | 'double' | 'equilibrium' | 'retrosynthesis';
  conditions?: string;
  yield?: number;
  isSelected: boolean;
}

export interface ReactionScheme {
  id: string;
  name: string;
  components: ReactionComponent[];
  arrows: ReactionArrow[];
  conditions: string;
  temperature?: string;
  pressure?: string;
  time?: string;
  yield?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ReactionEditorProps {
  open: boolean;
  onClose: () => void;
  onSave: (scheme: ReactionScheme) => void;
  initialScheme?: ReactionScheme;
}

const REACTION_TYPES = [
  { value: 'single', label: 'Single Arrow', description: 'Standard reaction arrow' },
  { value: 'double', label: 'Double Arrow', description: 'Two-step reaction' },
  { value: 'equilibrium', label: 'Equilibrium', description: 'Reversible reaction' },
  { value: 'retrosynthesis', label: 'Retrosynthesis', description: 'Retrosynthetic analysis' },
];

const COMPONENT_TYPES = [
  { value: 'reactant', label: 'Reactant', color: '#4CAF50' },
  { value: 'product', label: 'Product', color: '#2196F3' },
  { value: 'reagent', label: 'Reagent', color: '#FF9800' },
  { value: 'catalyst', label: 'Catalyst', color: '#9C27B0' },
  { value: 'solvent', label: 'Solvent', color: '#607D8B' },
];

export const ReactionEditor: React.FC<ReactionEditorProps> = ({
  open,
  onClose,
  onSave,
  initialScheme,
}) => {
  const [scheme, setScheme] = useState<ReactionScheme>(
    initialScheme || {
      id: `reaction_${Date.now()}`,
      name: 'New Reaction',
      components: [],
      arrows: [],
      conditions: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  );
  
  const [selectedTool, setSelectedTool] = useState<'select' | 'add' | 'arrow' | 'text'>('select');
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
  const [showComponentDialog, setShowComponentDialog] = useState(false);
  const [editingComponent, setEditingComponent] = useState<ReactionComponent | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

  // Validate reaction scheme
  const validateScheme = useCallback((scheme: ReactionScheme): string[] => {
    const errors: string[] = [];
    
    if (scheme.components.length === 0) {
      errors.push('At least one component is required');
    }
    
    if (scheme.arrows.length === 0) {
      errors.push('At least one arrow is required');
    }
    
    // Check for orphaned arrows
    scheme.arrows.forEach(arrow => {
      const fromExists = scheme.components.some(c => c.id === arrow.from);
      const toExists = scheme.components.some(c => c.id === arrow.to);
      
      if (!fromExists) {
        errors.push(`Arrow ${arrow.id} references non-existent component: ${arrow.from}`);
      }
      if (!toExists) {
        errors.push(`Arrow ${arrow.id} references non-existent component: ${arrow.to}`);
      }
    });
    
    // Check for duplicate arrows
    const arrowPairs = scheme.arrows.map(a => `${a.from}-${a.to}`).sort();
    for (let i = 1; i < arrowPairs.length; i++) {
      if (arrowPairs[i] === arrowPairs[i - 1]) {
        errors.push('Duplicate arrows detected');
        break;
      }
    }
    
    return errors;
  }, []);

  // Update validation errors when scheme changes
  useEffect(() => {
    const errors = validateScheme(scheme);
    setValidationErrors(errors);
  }, [scheme, validateScheme]);

  const handleAddComponent = useCallback((type: ReactionComponent['type']) => {
    const newComponent: ReactionComponent = {
      id: `comp_${Date.now()}`,
      type,
      name: `New ${type}`,
      position: { x: 100 + Math.random() * 200, y: 100 + Math.random() * 200 },
      isSelected: false,
    };
    
    setScheme(prev => ({
      ...prev,
      components: [...prev.components, newComponent],
      updatedAt: new Date(),
    }));
    
    setEditingComponent(newComponent);
    setShowComponentDialog(true);
  }, []);

  const handleEditComponent = useCallback((component: ReactionComponent) => {
    setEditingComponent(component);
    setShowComponentDialog(true);
  }, []);

  const handleDeleteComponent = useCallback((componentId: string) => {
    setScheme(prev => ({
      ...prev,
      components: prev.components.filter(c => c.id !== componentId),
      arrows: prev.arrows.filter(a => a.from !== componentId && a.to !== componentId),
      updatedAt: new Date(),
    }));
  }, []);

  const handleAddArrow = useCallback((from: string, to: string) => {
    const newArrow: ReactionArrow = {
      id: `arrow_${Date.now()}`,
      from,
      to,
      type: 'single',
      isSelected: false,
    };
    
    setScheme(prev => ({
      ...prev,
      arrows: [...prev.arrows, newArrow],
      updatedAt: new Date(),
    }));
  }, []);

  const handleDeleteArrow = useCallback((arrowId: string) => {
    setScheme(prev => ({
      ...prev,
      arrows: prev.arrows.filter(a => a.id !== arrowId),
      updatedAt: new Date(),
    }));
  }, []);

  const handleSave = useCallback(async () => {
    const errors = validateScheme(scheme);
    if (errors.length > 0) {
      return; // Don't save if there are validation errors
    }
    
    setIsSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate save
      onSave(scheme);
    } catch (error) {
      console.error('Failed to save reaction scheme:', error);
    } finally {
      setIsSaving(false);
    }
  }, [scheme, validateScheme, onSave]);

  const handleComponentUpdate = useCallback((updatedComponent: ReactionComponent) => {
    setScheme(prev => ({
      ...prev,
      components: prev.components.map(c => 
        c.id === updatedComponent.id ? updatedComponent : c
      ),
      updatedAt: new Date(),
    }));
    setShowComponentDialog(false);
    setEditingComponent(null);
  }, []);

  const getComponentColor = (type: ReactionComponent['type']) => {
    const typeConfig = COMPONENT_TYPES.find(t => t.value === type);
    return typeConfig?.color || '#666';
  };

  const renderValidationStatus = () => {
    if (validationErrors.length === 0) {
      return (
        <Chip
          icon={<CheckIcon />}
          label="Valid"
          color="success"
          size="small"
        />
      );
    } else if (validationErrors.length <= 2) {
      return (
        <Chip
          icon={<WarningIcon />}
          label={`${validationErrors.length} warning(s)`}
          color="warning"
          size="small"
        />
      );
    } else {
      return (
        <Chip
          icon={<ErrorIcon />}
          label={`${validationErrors.length} error(s)`}
          color="error"
          size="small"
        />
      );
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xl"
      fullWidth
      PaperProps={{
        sx: { height: '90vh' }
      }}
    >
      <DialogTitle>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={1}>
            <ChemistryIcon />
            <Typography variant="h6">Reaction Editor</Typography>
            {renderValidationStatus()}
          </Stack>
          <Stack direction="row" spacing={1}>
            <Button
              startIcon={<SaveIcon />}
              onClick={handleSave}
              disabled={isSaving || validationErrors.length > 0}
              variant="contained"
              size="small"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
            <IconButton onClick={onClose} size="small">
              <DeleteIcon />
            </IconButton>
          </Stack>
        </Stack>
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ display: 'flex', height: '100%', gap: 2 }}>
          {/* Toolbar */}
          <Box sx={{ width: 200, borderRight: 1, borderColor: 'divider', p: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Tools
            </Typography>
            <Stack spacing={1} sx={{ mb: 3 }}>
              <Button
                fullWidth
                variant={selectedTool === 'select' ? 'contained' : 'outlined'}
                onClick={() => setSelectedTool('select')}
                startIcon={<EditIcon />}
                size="small"
              >
                Select
              </Button>
              <Button
                fullWidth
                variant={selectedTool === 'add' ? 'contained' : 'outlined'}
                onClick={() => setSelectedTool('add')}
                startIcon={<AddIcon />}
                size="small"
              >
                Add Component
              </Button>
              <Button
                fullWidth
                variant={selectedTool === 'arrow' ? 'contained' : 'outlined'}
                onClick={() => setSelectedTool('arrow')}
                startIcon={<ArrowIcon />}
                size="small"
              >
                Add Arrow
              </Button>
            </Stack>

            <Typography variant="subtitle2" gutterBottom>
              Component Types
            </Typography>
            <Stack spacing={1}>
              {COMPONENT_TYPES.map((type) => (
                <Button
                  key={type.value}
                  fullWidth
                  variant="outlined"
                  onClick={() => handleAddComponent(type.value as ReactionComponent['type'])}
                  size="small"
                  sx={{
                    borderColor: type.color,
                    color: type.color,
                    '&:hover': {
                      borderColor: type.color,
                      bgcolor: `${type.color}10`,
                    },
                  }}
                >
                  {type.label}
                </Button>
              ))}
            </Stack>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle2" gutterBottom>
              Scheme Info
            </Typography>
            <TextField
              fullWidth
              label="Reaction Name"
              value={scheme.name}
              onChange={(e) => setScheme(prev => ({ ...prev, name: e.target.value }))}
              size="small"
              sx={{ mb: 1 }}
            />
            <TextField
              fullWidth
              label="Conditions"
              value={scheme.conditions}
              onChange={(e) => setScheme(prev => ({ ...prev, conditions: e.target.value }))}
              size="small"
              multiline
              rows={2}
            />
          </Box>

          {/* Canvas Area */}
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {/* Canvas Toolbar */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <IconButton size="small">
                <UndoIcon />
              </IconButton>
              <IconButton size="small">
                <RedoIcon />
              </IconButton>
              <Divider orientation="vertical" flexItem />
              <IconButton size="small">
                <ZoomInIcon />
              </IconButton>
              <IconButton size="small">
                <ZoomOutIcon />
              </IconButton>
              <IconButton size="small">
                <CenterIcon />
              </IconButton>
            </Box>

            {/* Canvas */}
            <Paper
              ref={canvasRef}
              variant="outlined"
              sx={{
                flex: 1,
                position: 'relative',
                bgcolor: 'background.default',
                minHeight: 400,
                overflow: 'hidden',
              }}
            >
              {/* Components */}
              {scheme.components.map((component) => (
                <Box
                  key={component.id}
                  sx={{
                    position: 'absolute',
                    left: component.position.x,
                    top: component.position.y,
                    width: 120,
                    height: 60,
                    border: '2px solid',
                    borderColor: component.isSelected ? 'primary.main' : getComponentColor(component.type),
                    borderRadius: 1,
                    bgcolor: 'background.paper',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    '&:hover': {
                      boxShadow: 2,
                    },
                  }}
                  onClick={() => {
                    setScheme(prev => ({
                      ...prev,
                      components: prev.components.map(c => ({
                        ...c,
                        isSelected: c.id === component.id,
                      })),
                    }));
                  }}
                  onDoubleClick={() => handleEditComponent(component)}
                >
                  <Typography variant="caption" textAlign="center" sx={{ p: 1 }}>
                    {component.name}
                  </Typography>
                </Box>
              ))}

              {/* Arrows */}
              {scheme.arrows.map((arrow) => {
                const fromComponent = scheme.components.find(c => c.id === arrow.from);
                const toComponent = scheme.components.find(c => c.id === arrow.to);
                
                if (!fromComponent || !toComponent) return null;
                
                return (
                  <Box
                    key={arrow.id}
                    sx={{
                      position: 'absolute',
                      left: Math.min(fromComponent.position.x, toComponent.position.x) + 60,
                      top: Math.min(fromComponent.position.y, toComponent.position.y) + 30,
                      width: Math.abs(toComponent.position.x - fromComponent.position.x),
                      height: 2,
                      bgcolor: arrow.isSelected ? 'primary.main' : 'text.secondary',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                    onClick={() => {
                      setScheme(prev => ({
                        ...prev,
                        arrows: prev.arrows.map(a => ({
                          ...a,
                          isSelected: a.id === arrow.id,
                        })),
                      }));
                    }}
                  >
                    <ArrowIcon sx={{ fontSize: 16, color: 'inherit' }} />
                  </Box>
                );
              })}

              {/* Empty state */}
              {scheme.components.length === 0 && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center',
                    color: 'text.secondary',
                  }}
                >
                  <ChemistryIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                  <Typography variant="h6" gutterBottom>
                    No components added
                  </Typography>
                  <Typography variant="body2">
                    Use the toolbar to add reactants, products, and arrows
                  </Typography>
                </Box>
              )}
            </Paper>

            {/* Validation Errors */}
            {validationErrors.length > 0 && (
              <Alert severity="error" sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Validation Errors:
                </Typography>
                <List dense>
                  {validationErrors.map((error, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <ErrorIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary={error} />
                    </ListItem>
                  ))}
                </List>
              </Alert>
            )}
          </Box>
        </Box>
      </DialogContent>

      {/* Component Edit Dialog */}
      <Dialog
        open={showComponentDialog}
        onClose={() => setShowComponentDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Component</DialogTitle>
        <DialogContent>
          {editingComponent && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                fullWidth
                label="Name"
                value={editingComponent.name}
                onChange={(e) => setEditingComponent(prev => 
                  prev ? { ...prev, name: e.target.value } : null
                )}
              />
              <TextField
                fullWidth
                label="SMILES"
                value={editingComponent.smiles || ''}
                onChange={(e) => setEditingComponent(prev => 
                  prev ? { ...prev, smiles: e.target.value } : null
                )}
                helperText="Optional: Enter SMILES notation for structure"
              />
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={editingComponent.type}
                  onChange={(e) => setEditingComponent(prev => 
                    prev ? { ...prev, type: e.target.value as ReactionComponent['type'] } : null
                  )}
                  label="Type"
                >
                  {COMPONENT_TYPES.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowComponentDialog(false)}>Cancel</Button>
          <Button
            onClick={() => editingComponent && handleComponentUpdate(editingComponent)}
            variant="contained"
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
};

export default ReactionEditor;
