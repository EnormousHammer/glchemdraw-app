/**
 * Advanced PubChem Search Component
 * Enterprise-level compound search with filters and suggestions
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  TextField,
  Autocomplete,
  Button,
  Chip,
  Stack,
  Typography,
  Card,
  CardContent,
  Grid,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  History as HistoryIcon,
  Star as StarIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandIcon,
  Science as ScienceIcon,
  Image as ImageIcon,
} from '@mui/icons-material';
import { searchCompound, searchCompoundByName } from '@lib/pubchem/cache';
import { get2DImageURL } from '@lib/pubchem/api';
import PubChemAdvanced from '@components/PubChemAdvanced';
import { useAIContext } from '@/contexts/AIContext';

interface SearchResult {
  cid: number;
  name: string;
  formula: string;
  weight: number;
  smiles?: string;
  imageUrl: string;
  isFavorite: boolean;
}

interface PubChemSearchProps {
  onCompoundSelect?: (cid: number, smiles?: string) => void;
}

interface SearchFilters {
  molecularWeight: {
    min: number;
    max: number;
  };
  formula: string;
  exactMatch: boolean;
  includeSynonyms: boolean;
}

export const PubChemSearch: React.FC<PubChemSearchProps> = ({ onCompoundSelect }) => {
  const { context: aiContext } = useAIContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedCompound, setSelectedCompound] = useState<SearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    molecularWeight: { min: 0, max: 10000 },
    formula: '',
    exactMatch: false,
    includeSynonyms: true,
  });

  // Load search history and favorites from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('pubchem_search_history');
    const savedFavorites = localStorage.getItem('pubchem_favorites');
    
    if (savedHistory) {
      setSearchHistory(JSON.parse(savedHistory));
    }
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
  }, []);

  // Save search history
  const saveSearchHistory = useCallback((query: string) => {
    if (!query.trim()) return;
    
    const newHistory = [query, ...searchHistory.filter(h => h !== query)].slice(0, 10);
    setSearchHistory(newHistory);
    localStorage.setItem('pubchem_search_history', JSON.stringify(newHistory));
  }, [searchHistory]);

  // Toggle favorite
  const toggleFavorite = useCallback((cid: number) => {
    const newFavorites = favorites.includes(cid)
      ? favorites.filter(id => id !== cid)
      : [...favorites, cid];
    
    setFavorites(newFavorites);
    localStorage.setItem('pubchem_favorites', JSON.stringify(newFavorites));
  }, [favorites]);

  // Perform search
  const performSearch = async (query: string) => {
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);
    setSearchQuery(query);
    saveSearchHistory(query);

    try {
      const result = await searchCompoundByName(query);
      
      if (result && result.cid) {
        const searchResult: SearchResult = {
          cid: result.cid,
          name: query,
          formula: result.properties?.MolecularFormula || 'Unknown',
          weight: result.properties?.MolecularWeight ? 
            (() => {
              const weight = typeof result.properties.MolecularWeight === 'number' 
                ? result.properties.MolecularWeight 
                : parseFloat(result.properties.MolecularWeight);
              return isNaN(weight) ? 0 : weight;
            })() : 0,
          smiles: result.properties?.CanonicalSMILES,
          imageUrl: get2DImageURL(result.cid, 'small'),
          isFavorite: favorites.includes(result.cid),
        };
        
        setSearchResults([searchResult]);
        setSelectedCompound(searchResult);
      } else {
        // AI fallback when PubChem has no match
        try {
          const { aiNameToSmiles } = await import('@/lib/openai/chemistry');
          const aiSmiles = await aiNameToSmiles(query, aiContext);
          if (aiSmiles) {
            const searchResult: SearchResult = {
              cid: 0,
              name: query,
              formula: '',
              weight: 0,
              smiles: aiSmiles,
              imageUrl: '',
              isFavorite: false,
            };
            setSearchResults([searchResult]);
            setSelectedCompound(searchResult);
            setError(null);
          } else {
            setSearchResults([]);
            setError('No compounds found');
          }
        } catch {
          setSearchResults([]);
          setError('No compounds found');
        }
      }
    } catch (err) {
      console.error('[PubChemSearch] Search error:', err);
      setError(`Search failed: ${(err as Error).message}`);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    performSearch(searchQuery);
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSelectedCompound(null);
    setError(null);
  };

  const loadFromHistory = (query: string) => {
    setSearchQuery(query);
    performSearch(query);
  };

  const loadFromFavorites = (cid: number) => {
    const favorite = searchResults.find(r => r.cid === cid);
    if (favorite) {
      setSelectedCompound(favorite);
    }
  };

  const handleCompoundClick = (result: SearchResult) => {
    setSelectedCompound(result);
    if (onCompoundSelect && result.smiles) {
      onCompoundSelect(result.cid, result.smiles);
    }
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Search Header */}
      <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
        <Stack spacing={2}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <TextField
              fullWidth
              placeholder="Search PubChem by name, CID, or SMILES..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                endAdornment: searchQuery && (
                  <IconButton size="small" onClick={clearSearch}>
                    <ClearIcon />
                  </IconButton>
                ),
              }}
            />
            <Button
              variant="contained"
              onClick={handleSearch}
              disabled={!searchQuery.trim() || isLoading}
              startIcon={isLoading ? <CircularProgress size={20} /> : <SearchIcon />}
            >
              Search
            </Button>
            <Tooltip title="Advanced Filters">
              <IconButton onClick={() => setShowFilters(!showFilters)}>
                <FilterIcon />
              </IconButton>
            </Tooltip>
          </Box>

          {/* Search History */}
          {searchHistory.length > 0 && (
            <Box>
              <Typography variant="caption" color="text.secondary" gutterBottom>
                Recent Searches
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {searchHistory.slice(0, 5).map((query, index) => (
                  <Chip
                    key={index}
                    label={query}
                    size="small"
                    onClick={() => loadFromHistory(query)}
                    icon={<HistoryIcon />}
                  />
                ))}
              </Stack>
            </Box>
          )}
        </Stack>
      </Paper>

      {/* Advanced Filters */}
      {showFilters && (
        <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" gutterBottom>Advanced Filters</Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Molecular Weight Range"
                type="number"
                value={filters.molecularWeight.min}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  molecularWeight: { ...prev.molecularWeight, min: Number(e.target.value) }
                }))}
                size="small"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Max Molecular Weight"
                type="number"
                value={filters.molecularWeight.max}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  molecularWeight: { ...prev.molecularWeight, max: Number(e.target.value) }
                }))}
                size="small"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Molecular Formula"
                value={filters.formula}
                onChange={(e) => setFilters(prev => ({ ...prev, formula: e.target.value }))}
                size="small"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Stack spacing={1}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={filters.exactMatch}
                      onChange={(e) => setFilters(prev => ({ ...prev, exactMatch: e.target.checked }))}
                    />
                  }
                  label="Exact Match"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={filters.includeSynonyms}
                      onChange={(e) => setFilters(prev => ({ ...prev, includeSynonyms: e.target.checked }))}
                    />
                  }
                  label="Include Synonyms"
                />
              </Stack>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Main Content */}
      <Box sx={{ flex: 1, display: 'flex', gap: 2, overflow: 'hidden' }}>
        {/* Search Results */}
        <Box sx={{ width: 300, minWidth: 300 }}>
          <Paper elevation={1} sx={{ height: '100%', overflow: 'auto' }}>
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Typography variant="h6">Search Results</Typography>
            </Box>
            
            {error && (
              <Alert severity="error" sx={{ m: 2 }}>
                {error}
              </Alert>
            )}

            {searchResults.length === 0 && !isLoading && !error && (
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <ScienceIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Enter a compound name to search PubChem
                </Typography>
              </Box>
            )}

            {searchResults.map((result) => (
              <Card
                key={result.cid}
                sx={{
                  m: 1,
                  cursor: 'pointer',
                  border: selectedCompound?.cid === result.cid ? 2 : 1,
                  borderColor: selectedCompound?.cid === result.cid ? 'primary.main' : 'divider',
                }}
                onClick={() => handleCompoundClick(result)}
              >
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <img
                      src={result.imageUrl}
                      alt={`Structure of ${result.name}`}
                      style={{ width: 60, height: 60, marginRight: 12 }}
                    />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="subtitle2" noWrap>
                        {result.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        CID: {result.cid}
                      </Typography>
                    </Box>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(result.cid);
                      }}
                    >
                      <StarIcon color={result.isFavorite ? 'warning' : 'disabled'} />
                    </IconButton>
                  </Box>
                  <Typography variant="body2" fontFamily="monospace">
                    {result.formula}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    MW: {(() => {
                      const weight = typeof result.weight === 'number' ? result.weight : parseFloat(result.weight);
                      return isNaN(weight) ? 'N/A' : `${weight.toFixed(2)} g/mol`;
                    })()}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Paper>
        </Box>

        {/* Compound Details */}
        <Box sx={{ flex: 1, overflow: 'hidden' }}>
          {selectedCompound ? (
            <PubChemAdvanced
              cid={selectedCompound.cid}
              compoundName={selectedCompound.name}
            />
          ) : (
            <Paper elevation={1} sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Box sx={{ textAlign: 'center' }}>
                <SearchIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  Select a compound to view details
                </Typography>
              </Box>
            </Paper>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default PubChemSearch;
