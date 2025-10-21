/**
 * SimilaritySearch Component
 * Find structurally similar compounds using PubChem and RDKit
 */

import React, { useState, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Stack,
  Chip,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemButton,
  Divider,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  Science as ChemistryIcon,
  CloudDownload as PubChemIcon,
  ContentCopy as CopyIcon,
  OpenInNew as OpenIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
} from '@mui/icons-material';
import * as pubchemCache from '@lib/pubchem/cache';

interface SimilaritySearchProps {
  smiles?: string;
  onCompoundSelect?: (cid: number, smiles: string, name: string) => void;
  onError?: (error: string) => void;
}

interface SimilarCompound {
  cid: number;
  name: string;
  smiles: string;
  similarity: number;
  formula?: string;
  mw?: number;
  isFavorite?: boolean;
}

export const SimilaritySearch: React.FC<SimilaritySearchProps> = ({
  smiles,
  onCompoundSelect,
  onError,
}) => {
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SimilarCompound[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [similarityThreshold, setSimilarityThreshold] = useState(0.7);
  const [maxResults, setMaxResults] = useState(20);
  const [searchType, setSearchType] = useState<'similarity' | 'substructure' | 'superstructure'>('similarity');
  const [favorites, setFavorites] = useState<Set<number>>(new Set());

  const handleSearch = useCallback(async () => {
    if (!smiles || smiles.length < 2) {
      setError('Please provide a valid SMILES structure');
      return;
    }

    setIsSearching(true);
    setError(null);
    setResults([]);

    try {
      // TODO: Implement real similarity search
      // This would integrate with:
      // - RDKit for structural similarity calculations
      // - PubChem similarity search API
      // - Local compound databases
      
      setError('Similarity search not yet implemented - requires integration with similarity search services');
      
    } catch (err) {
      const errorMessage = (err as Error).message || 'Similarity search failed';
      setError(errorMessage);
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setIsSearching(false);
    }
  }, [smiles, similarityThreshold, maxResults, searchType, onError]);

  const handleCompoundClick = (compound: SimilarCompound) => {
    if (onCompoundSelect) {
      onCompoundSelect(compound.cid, compound.smiles, compound.name);
    }
  };

  const toggleFavorite = (cid: number) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(cid)) {
        newFavorites.delete(cid);
      } else {
        newFavorites.add(cid);
      }
      return newFavorites;
    });
  };

  const handleCopySmiles = (smiles: string) => {
    navigator.clipboard.writeText(smiles);
  };

  const getSimilarityColor = (similarity: number) => {
    if (similarity >= 0.8) return 'success';
    if (similarity >= 0.6) return 'warning';
    return 'error';
  };

  const getSimilarityLabel = (similarity: number) => {
    if (similarity >= 0.9) return 'Very High';
    if (similarity >= 0.8) return 'High';
    if (similarity >= 0.6) return 'Medium';
    if (similarity >= 0.4) return 'Low';
    return 'Very Low';
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <ChemistryIcon />
        Similarity Search
      </Typography>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Find compounds similar to your structure using structural similarity algorithms
      </Typography>

      {/* Search Controls */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack spacing={2}>
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Search Type
              </Typography>
              <FormControl fullWidth size="small">
                <InputLabel>Search Type</InputLabel>
                <Select
                  value={searchType}
                  onChange={(e) => setSearchType(e.target.value as any)}
                  label="Search Type"
                >
                  <MenuItem value="similarity">Similarity Search</MenuItem>
                  <MenuItem value="substructure">Substructure Search</MenuItem>
                  <MenuItem value="superstructure">Superstructure Search</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Similarity Threshold: {Math.round(similarityThreshold * 100)}%
              </Typography>
              <Slider
                value={similarityThreshold}
                onChange={(_, value) => setSimilarityThreshold(value as number)}
                min={0.1}
                max={1.0}
                step={0.05}
                marks={[
                  { value: 0.3, label: '30%' },
                  { value: 0.5, label: '50%' },
                  { value: 0.7, label: '70%' },
                  { value: 0.9, label: '90%' },
                ]}
              />
            </Box>

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Max Results: {maxResults}
              </Typography>
              <Slider
                value={maxResults}
                onChange={(_, value) => setMaxResults(value as number)}
                min={5}
                max={100}
                step={5}
                marks={[
                  { value: 10, label: '10' },
                  { value: 25, label: '25' },
                  { value: 50, label: '50' },
                  { value: 100, label: '100' },
                ]}
              />
            </Box>

            <Button
              variant="contained"
              onClick={handleSearch}
              disabled={isSearching || !smiles}
              startIcon={isSearching ? <CircularProgress size={16} /> : <SearchIcon />}
              fullWidth
            >
              {isSearching ? 'Searching...' : 'Search Similar Compounds'}
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Search Results */}
      {results.length > 0 && (
        <Card>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="h6">
                Search Results ({results.length})
              </Typography>
              <Chip
                label={`Threshold: ${Math.round(similarityThreshold * 100)}%`}
                size="small"
                color="primary"
                variant="outlined"
              />
            </Stack>

            <List>
              {results.map((compound, index) => (
                <React.Fragment key={compound.cid}>
                  <ListItem
                    component={ListItemButton}
                    onClick={() => handleCompoundClick(compound)}
                    sx={{
                      borderRadius: 1,
                      mb: 1,
                      '&:hover': {
                        bgcolor: 'action.hover',
                      },
                    }}
                  >
                    <ListItemIcon>
                      <ChemistryIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Typography variant="subtitle1" fontWeight={600}>
                            {compound.name}
                          </Typography>
                          <Chip
                            label={getSimilarityLabel(compound.similarity)}
                            size="small"
                            color={getSimilarityColor(compound.similarity) as any}
                            variant="outlined"
                          />
                          <Chip
                            label={`${Math.round(compound.similarity * 100)}%`}
                            size="small"
                            color="primary"
                            variant="filled"
                          />
                        </Stack>
                      }
                      secondary={
                        <Stack spacing={0.5}>
                          <Typography variant="body2" color="text.secondary">
                            CID: {compound.cid} • {compound.formula} • MW: {typeof compound.mw === 'number' ? compound.mw.toFixed(2) : compound.mw || 'N/A'} g/mol
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              fontFamily: 'monospace',
                              fontSize: '0.75rem',
                              wordBreak: 'break-all',
                            }}
                          >
                            {compound.smiles}
                          </Typography>
                        </Stack>
                      }
                    />
                    <Stack direction="row" spacing={0.5}>
                      <Tooltip title="Copy SMILES">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopySmiles(compound.smiles);
                          }}
                        >
                          <CopyIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={favorites.has(compound.cid) ? "Remove from favorites" : "Add to favorites"}>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(compound.cid);
                          }}
                        >
                          {favorites.has(compound.cid) ? (
                            <StarIcon color="secondary" />
                          ) : (
                            <StarBorderIcon />
                          )}
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </ListItem>
                  {index < results.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!smiles && !isSearching && (
        <Box
          sx={{
            textAlign: 'center',
            py: 4,
            color: 'text.secondary',
          }}
        >
          <ChemistryIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
          <Typography variant="body2">
            Draw a structure to search for similar compounds
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default SimilaritySearch;
