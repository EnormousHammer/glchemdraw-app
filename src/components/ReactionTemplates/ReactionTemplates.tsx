/**
 * ReactionTemplates Component
 * Pre-built reaction schemes and mechanisms for quick insertion
 */

import React, { useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  TextField,
  InputAdornment,
  IconButton,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemButton,
  Paper,
  Divider,
  Tooltip,
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  Science as ChemistryIcon,
  LocalPharmacy as DrugIcon,
  Restaurant as FoodIcon,
  Nature as NatureIcon,
  Build as MaterialIcon,
  School as EducationIcon,
  Close as CloseIcon,
  Add as AddIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  ArrowForward as ArrowIcon,
} from '@mui/icons-material';

interface ReactionTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  reactants: string[];
  products: string[];
  reagents: string[];
  conditions: string;
  mechanism: string;
  isCommon?: boolean;
  isFavorite?: boolean;
  tags?: string[];
  complexity: 'simple' | 'medium' | 'complex';
}

interface ReactionTemplatesProps {
  open: boolean;
  onClose: () => void;
  onReactionSelect: (template: ReactionTemplate) => void;
}

// Comprehensive reaction template database
const REACTION_DATABASE: ReactionTemplate[] = [
  // Basic Organic Reactions
  {
    id: 'esterification',
    name: 'Esterification',
    description: 'Formation of esters from carboxylic acids and alcohols',
    category: 'Basic Organic',
    reactants: ['RCOOH', 'R\'OH'],
    products: ['RCOOR\'', 'H2O'],
    reagents: ['H2SO4 (cat.)'],
    conditions: 'Heat, reflux',
    mechanism: 'Nucleophilic acyl substitution',
    isCommon: true,
    complexity: 'simple',
    tags: ['ester', 'carboxylic-acid', 'alcohol'],
  },
  {
    id: 'aldol_condensation',
    name: 'Aldol Condensation',
    description: 'Formation of β-hydroxy carbonyl compounds',
    category: 'Basic Organic',
    reactants: ['RCHO', 'R\'CHO'],
    products: ['RCH(OH)CHR\'CHO'],
    reagents: ['NaOH', 'H2O'],
    conditions: 'Room temperature',
    mechanism: 'Enolate formation and nucleophilic addition',
    isCommon: true,
    complexity: 'medium',
    tags: ['aldol', 'carbonyl', 'enolate'],
  },
  {
    id: 'grignard_reaction',
    name: 'Grignard Reaction',
    description: 'Formation of alcohols from carbonyl compounds',
    category: 'Basic Organic',
    reactants: ['RMgX', 'R\'CHO'],
    products: ['RR\'CHOH'],
    reagents: ['Et2O', 'H3O+'],
    conditions: 'Anhydrous, reflux',
    mechanism: 'Nucleophilic addition to carbonyl',
    isCommon: true,
    complexity: 'medium',
    tags: ['grignard', 'alcohol', 'carbonyl'],
  },
  {
    id: 'diels_alder',
    name: 'Diels-Alder Reaction',
    description: 'Cycloaddition of dienes and dienophiles',
    category: 'Basic Organic',
    reactants: ['Diene', 'Dienophile'],
    products: ['Cyclohexene derivative'],
    reagents: ['Heat'],
    conditions: 'High temperature, pressure',
    mechanism: 'Pericyclic cycloaddition',
    isCommon: true,
    complexity: 'medium',
    tags: ['diels-alder', 'cycloaddition', 'pericyclic'],
  },
  {
    id: 'friedel_crafts',
    name: 'Friedel-Crafts Alkylation',
    description: 'Alkylation of aromatic rings',
    category: 'Basic Organic',
    reactants: ['ArH', 'RCl'],
    products: ['ArR'],
    reagents: ['AlCl3'],
    conditions: 'Room temperature',
    mechanism: 'Electrophilic aromatic substitution',
    isCommon: true,
    complexity: 'simple',
    tags: ['friedel-crafts', 'aromatic', 'alkylation'],
  },

  // Pharmaceutical Reactions
  {
    id: 'suzuki_coupling',
    name: 'Suzuki Coupling',
    description: 'Palladium-catalyzed cross-coupling of boronic acids',
    category: 'Pharmaceutical',
    reactants: ['ArB(OH)2', 'Ar\'X'],
    products: ['Ar-Ar\''],
    reagents: ['Pd(PPh3)4', 'Base'],
    conditions: 'Heat, inert atmosphere',
    mechanism: 'Oxidative addition, transmetallation, reductive elimination',
    isCommon: true,
    complexity: 'complex',
    tags: ['suzuki', 'palladium', 'cross-coupling', 'pharmaceutical'],
  },
  {
    id: 'buchwald_hartwig',
    name: 'Buchwald-Hartwig Amination',
    description: 'Palladium-catalyzed C-N bond formation',
    category: 'Pharmaceutical',
    reactants: ['ArX', 'R2NH'],
    products: ['ArNR2'],
    reagents: ['Pd(OAc)2', 'Ligand', 'Base'],
    conditions: 'Heat, inert atmosphere',
    mechanism: 'Oxidative addition, ligand exchange, reductive elimination',
    isCommon: true,
    complexity: 'complex',
    tags: ['buchwald-hartwig', 'amination', 'palladium', 'pharmaceutical'],
  },
  {
    id: 'click_chemistry',
    name: 'Click Chemistry (CuAAC)',
    description: 'Copper-catalyzed azide-alkyne cycloaddition',
    category: 'Pharmaceutical',
    reactants: ['R-N3', 'R\'-C≡CH'],
    products: ['R-triazole-R\''],
    reagents: ['CuSO4', 'Sodium ascorbate'],
    conditions: 'Room temperature, aqueous',
    mechanism: 'Copper-catalyzed cycloaddition',
    isCommon: true,
    complexity: 'medium',
    tags: ['click-chemistry', 'triazole', 'copper', 'pharmaceutical'],
  },

  // Natural Product Synthesis
  {
    id: 'aldol_retro',
    name: 'Retro-Aldol Reaction',
    description: 'Reverse of aldol condensation',
    category: 'Natural Products',
    reactants: ['β-hydroxy carbonyl'],
    products: ['Two carbonyl compounds'],
    reagents: ['Base'],
    conditions: 'Heat',
    mechanism: 'Reverse aldol condensation',
    isCommon: true,
    complexity: 'medium',
    tags: ['retro-aldol', 'carbonyl', 'natural-products'],
  },
  {
    id: 'michael_addition',
    name: 'Michael Addition',
    description: 'Conjugate addition to α,β-unsaturated carbonyls',
    category: 'Natural Products',
    reactants: ['NuH', 'α,β-unsaturated carbonyl'],
    products: ['β-substituted carbonyl'],
    reagents: ['Base'],
    conditions: 'Room temperature',
    mechanism: 'Conjugate addition',
    isCommon: true,
    complexity: 'medium',
    tags: ['michael-addition', 'conjugate-addition', 'natural-products'],
  },

  // Industrial Reactions
  {
    id: 'hydrogenation',
    name: 'Hydrogenation',
    description: 'Addition of hydrogen to unsaturated compounds',
    category: 'Industrial',
    reactants: ['Unsaturated compound'],
    products: ['Saturated compound'],
    reagents: ['H2', 'Catalyst'],
    conditions: 'High pressure, heat',
    mechanism: 'Heterogeneous catalysis',
    isCommon: true,
    complexity: 'simple',
    tags: ['hydrogenation', 'catalysis', 'industrial'],
  },
  {
    id: 'oxidation_primary_alcohol',
    name: 'Primary Alcohol Oxidation',
    description: 'Oxidation of primary alcohols to aldehydes/carboxylic acids',
    category: 'Industrial',
    reactants: ['RCH2OH'],
    products: ['RCHO or RCOOH'],
    reagents: ['KMnO4', 'CrO3', 'PCC'],
    conditions: 'Heat',
    mechanism: 'Oxidation',
    isCommon: true,
    complexity: 'simple',
    tags: ['oxidation', 'alcohol', 'industrial'],
  },
];

const CATEGORY_ICONS: Record<string, React.ReactElement> = {
  'Basic Organic': <ChemistryIcon />,
  'Pharmaceutical': <DrugIcon />,
  'Natural Products': <NatureIcon />,
  'Industrial': <MaterialIcon />,
  'Education': <EducationIcon />,
};

export const ReactionTemplates: React.FC<ReactionTemplatesProps> = ({
  open,
  onClose,
  onReactionSelect,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = ['All', ...Array.from(new Set(REACTION_DATABASE.map(r => r.category)))];
    return cats;
  }, []);

  // Filter reactions based on search and category
  const filteredReactions = useMemo(() => {
    let filtered = REACTION_DATABASE;

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(reaction =>
        reaction.name.toLowerCase().includes(term) ||
        reaction.description.toLowerCase().includes(term) ||
        reaction.tags?.some(tag => tag.toLowerCase().includes(term)) ||
        reaction.mechanism.toLowerCase().includes(term)
      );
    }

    // Filter by category
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(reaction => reaction.category === selectedCategory);
    }

    // Filter by favorites
    if (showFavoritesOnly) {
      filtered = filtered.filter(reaction => favorites.has(reaction.id));
    }

    // Sort by common first, then by name
    return filtered.sort((a, b) => {
      if (a.isCommon && !b.isCommon) return -1;
      if (!a.isCommon && b.isCommon) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [searchTerm, selectedCategory, showFavoritesOnly, favorites]);

  const handleReactionClick = (reaction: ReactionTemplate) => {
    onReactionSelect(reaction);
    onClose();
  };

  const toggleFavorite = (reactionId: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(reactionId)) {
        newFavorites.delete(reactionId);
      } else {
        newFavorites.add(reactionId);
      }
      return newFavorites;
    });
  };

  const handleClearSearch = () => {
    setSearchTerm('');
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { height: '80vh' }
      }}
    >
      <DialogTitle>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={1}>
            <ChemistryIcon />
            <Typography variant="h6">Reaction Templates</Typography>
          </Stack>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ mb: 3 }}>
          {/* Search Bar */}
          <TextField
            fullWidth
            placeholder="Search reactions by name, description, or mechanism..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={handleClearSearch}>
                    <ClearIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2 }}
          />

          {/* Category Filter */}
          <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2 }}>
            {categories.map((category) => (
              <Chip
                key={category}
                label={category}
                onClick={() => setSelectedCategory(category)}
                color={selectedCategory === category ? 'primary' : 'default'}
                variant={selectedCategory === category ? 'filled' : 'outlined'}
                size="small"
                icon={CATEGORY_ICONS[category]}
              />
            ))}
            <Chip
              label="Favorites Only"
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              color={showFavoritesOnly ? 'secondary' : 'default'}
              variant={showFavoritesOnly ? 'filled' : 'outlined'}
              size="small"
              icon={showFavoritesOnly ? <StarIcon /> : <StarBorderIcon />}
            />
          </Stack>

          {/* Results Count */}
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {filteredReactions.length} reaction(s) found
          </Typography>
        </Box>

        {/* Reactions Grid */}
        <Grid container spacing={2}>
          {filteredReactions.map((reaction) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={reaction.id}>
              <Card
                sx={{
                  height: '100%',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 3,
                  },
                  border: reaction.isCommon ? '2px solid' : '1px solid',
                  borderColor: reaction.isCommon ? 'primary.main' : 'divider',
                }}
                onClick={() => handleReactionClick(reaction)}
              >
                <CardContent sx={{ p: 2 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1 }}>
                    <Typography variant="h6" component="div" sx={{ fontSize: '1rem', fontWeight: 600 }}>
                      {reaction.name}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(reaction.id);
                      }}
                      sx={{ p: 0.5 }}
                    >
                      {favorites.has(reaction.id) ? (
                        <StarIcon fontSize="small" color="secondary" />
                      ) : (
                        <StarBorderIcon fontSize="small" />
                      )}
                    </IconButton>
                  </Stack>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1, minHeight: '2.5em' }}>
                    {reaction.description}
                  </Typography>

                  {/* Reaction Scheme */}
                  <Paper variant="outlined" sx={{ p: 1, mb: 1, bgcolor: 'background.default' }}>
                    <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
                      <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                        {reaction.reactants.join(' + ')}
                      </Typography>
                      <ArrowIcon fontSize="small" color="action" />
                      <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                        {reaction.products.join(' + ')}
                      </Typography>
                    </Stack>
                  </Paper>

                  <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                    <Chip
                      label={reaction.category}
                      size="small"
                      icon={CATEGORY_ICONS[reaction.category]}
                      color="primary"
                      variant="outlined"
                    />
                    <Chip
                      label={reaction.complexity}
                      size="small"
                      color={
                        reaction.complexity === 'simple' ? 'success' :
                        reaction.complexity === 'medium' ? 'warning' : 'error'
                      }
                      variant="outlined"
                    />
                    {reaction.isCommon && (
                      <Chip
                        label="Common"
                        size="small"
                        color="success"
                        variant="filled"
                      />
                    )}
                  </Stack>

                  <Typography variant="caption" color="text.secondary" display="block">
                    <strong>Reagents:</strong> {reaction.reagents.join(', ')}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    <strong>Conditions:</strong> {reaction.conditions}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    <strong>Mechanism:</strong> {reaction.mechanism}
                  </Typography>

                  {reaction.tags && reaction.tags.length > 0 && (
                    <Stack direction="row" spacing={0.5} sx={{ mt: 1 }} flexWrap="wrap">
                      {reaction.tags.slice(0, 3).map((tag) => (
                        <Chip
                          key={tag}
                          label={tag}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: '0.65rem', height: '20px' }}
                        />
                      ))}
                      {reaction.tags.length > 3 && (
                        <Chip
                          label={`+${reaction.tags.length - 3}`}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: '0.65rem', height: '20px' }}
                        />
                      )}
                    </Stack>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {filteredReactions.length === 0 && (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              py: 8,
              textAlign: 'center',
            }}
          >
            <ChemistryIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No reactions found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Try adjusting your search terms or category filter
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReactionTemplates;
