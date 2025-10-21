/**
 * NameToStructure Component
 * Convert chemical names to structures using PubChem API
 */

import React, { useState, useCallback } from 'react';
import {
  Box,
  TextField,
  Button,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Stack,
  Chip,
  IconButton,
  Tooltip,
  Paper,
  Divider,
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  Science as ChemistryIcon,
  CloudDownload as PubChemIcon,
  ContentCopy as CopyIcon,
  CheckCircle as SuccessIcon,
} from '@mui/icons-material';
import * as pubchemCache from '@lib/pubchem/cache';

interface NameToStructureProps {
  onStructureFound?: (smiles: string, name: string, cid?: number) => void;
  onError?: (error: string) => void;
}

interface SearchResult {
  name: string;
  smiles: string;
  cid: number;
  formula?: string;
  mw?: number;
  iupac?: string;
}

export const NameToStructure: React.FC<NameToStructureProps> = ({
  onStructureFound,
  onError,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState<SearchResult[]>([]);

  const handleSearch = useCallback(async () => {
    if (!searchTerm.trim()) {
      setError('Please enter a compound name');
      return;
    }

    setIsSearching(true);
    setError(null);
    setResult(null);

    try {
      const compound = await pubchemCache.searchCompoundByName(searchTerm.trim());
      
      if (compound) {
        const searchResult: SearchResult = {
          name: compound.properties.IUPACName || compound.properties.MolecularFormula || `CID ${compound.cid}`,
          smiles: compound.properties.CanonicalSMILES || compound.properties.IsomericSMILES || '',
          cid: compound.cid,
          formula: compound.properties.MolecularFormula,
          mw: compound.properties.MolecularWeight,
          iupac: compound.properties.IUPACName,
        };

        setResult(searchResult);
        
        // Add to history
        setSearchHistory(prev => [searchResult, ...prev.slice(0, 4)]); // Keep last 5
        
        if (onStructureFound) {
          onStructureFound(searchResult.smiles, searchResult.name, searchResult.cid);
        }
      } else {
        setError(`No compound found for "${searchTerm}"`);
        if (onError) {
          onError(`No compound found for "${searchTerm}"`);
        }
      }
    } catch (err) {
      const errorMessage = (err as Error).message || 'Search failed';
      setError(errorMessage);
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setIsSearching(false);
    }
  }, [searchTerm, onStructureFound, onError]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleClear = () => {
    setSearchTerm('');
    setResult(null);
    setError(null);
  };

  const handleCopySmiles = () => {
    if (result?.smiles) {
      navigator.clipboard.writeText(result.smiles);
    }
  };

  const handleUseResult = (searchResult: SearchResult) => {
    setResult(searchResult);
    if (onStructureFound) {
      onStructureFound(searchResult.smiles, searchResult.name, searchResult.cid);
    }
  };

  const handleClearHistory = () => {
    setSearchHistory([]);
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <ChemistryIcon />
        Name to Structure Converter
      </Typography>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Enter a chemical name to search PubChem and convert it to a structure
      </Typography>

      {/* Search Input */}
      <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
        <TextField
          fullWidth
          placeholder="Enter compound name (e.g., aspirin, caffeine, benzene)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isSearching}
          InputProps={{
            startAdornment: (
              <PubChemIcon sx={{ color: 'text.secondary', mr: 1 }} />
            ),
            endAdornment: searchTerm && (
              <IconButton size="small" onClick={handleClear}>
                <ClearIcon />
              </IconButton>
            ),
          }}
        />
        <Button
          variant="contained"
          onClick={handleSearch}
          disabled={isSearching || !searchTerm.trim()}
          startIcon={isSearching ? <CircularProgress size={16} /> : <SearchIcon />}
        >
          {isSearching ? 'Searching...' : 'Search'}
        </Button>
      </Stack>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Search Result */}
      {result && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
              <Box>
                <Typography variant="h6" gutterBottom>
                  {result.name}
                </Typography>
                {result.iupac && result.iupac !== result.name && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    IUPAC: {result.iupac}
                  </Typography>
                )}
                <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                  {result.formula && (
                    <Chip
                      label={`Formula: ${result.formula}`}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  )}
                  {result.mw && typeof result.mw === 'number' && (
                    <Chip
                      label={`MW: ${result.mw.toFixed(2)} g/mol`}
                      size="small"
                      color="secondary"
                      variant="outlined"
                    />
                  )}
                  <Chip
                    label={`CID: ${result.cid}`}
                    size="small"
                    color="info"
                    variant="outlined"
                  />
                </Stack>
              </Box>
              <IconButton onClick={handleCopySmiles} color="primary">
                <CopyIcon />
              </IconButton>
            </Stack>

            <Divider sx={{ my: 2 }} />

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                SMILES Structure:
              </Typography>
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  bgcolor: 'background.default',
                  fontFamily: 'monospace',
                  fontSize: '0.9rem',
                  wordBreak: 'break-all',
                  position: 'relative',
                }}
              >
                {result.smiles}
                <Tooltip title="Copy SMILES">
                  <IconButton
                    size="small"
                    onClick={handleCopySmiles}
                    sx={{ position: 'absolute', top: 4, right: 4 }}
                  >
                    <CopyIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Paper>
            </Box>

            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Button
                variant="contained"
                startIcon={<SuccessIcon />}
                onClick={() => handleUseResult(result)}
                fullWidth
              >
                Use This Structure
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Search History */}
      {searchHistory.length > 0 && (
        <Card>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="subtitle1" fontWeight={600}>
                Recent Searches
              </Typography>
              <Button size="small" onClick={handleClearHistory}>
                Clear
              </Button>
            </Stack>
            
            <Stack spacing={1}>
              {searchHistory.map((item, index) => (
                <Paper
                  key={`${item.cid}-${index}`}
                  variant="outlined"
                  sx={{
                    p: 1.5,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      bgcolor: 'action.hover',
                    },
                  }}
                  onClick={() => handleUseResult(item)}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="body2" fontWeight={500}>
                        {item.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {item.formula} • CID: {item.cid}
                      </Typography>
                    </Box>
                    <Chip
                      label="Use"
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </Stack>
                </Paper>
              ))}
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!result && !error && !isSearching && searchHistory.length === 0 && (
        <Box
          sx={{
            textAlign: 'center',
            py: 4,
            color: 'text.secondary',
          }}
        >
          <ChemistryIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
          <Typography variant="body2">
            Enter a compound name to search PubChem database
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default NameToStructure;
