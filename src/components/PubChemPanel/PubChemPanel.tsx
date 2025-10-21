/**
 * PubChemPanel Component
 * Search and display PubChem compound information
 */

import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Chip,
  Stack,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import CloudOffIcon from '@mui/icons-material/CloudOff';
import CloudQueueIcon from '@mui/icons-material/CloudQueue';
import * as pubchemCache from '@lib/pubchem/cache';

interface PubChemPanelProps {
  onCompoundSelect?: (cid: number, smiles?: string) => void;
}

export const PubChemPanel: React.FC<PubChemPanelProps> = ({
  onCompoundSelect,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);
  const [isOffline, setIsOffline] = useState(false);

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      return;
    }

    setIsSearching(true);
    setError(null);
    setResult(null);

    try {
      console.log('[PubChemPanel] Searching for:', searchTerm.trim());
      
      // First, test direct API call
      try {
        const testUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(searchTerm.trim())}/cids/JSON`;
        console.log('[PubChemPanel] Testing direct API call:', testUrl);
        
        const testResponse = await fetch(testUrl);
        console.log('[PubChemPanel] Test response status:', testResponse.status);
        
        if (!testResponse.ok) {
          throw new Error(`HTTP ${testResponse.status}: ${testResponse.statusText}`);
        }
        
        const testData = await testResponse.json();
        console.log('[PubChemPanel] Test response data:', testData);
      } catch (testError) {
        console.error('[PubChemPanel] Direct API test failed:', testError);
        throw testError;
      }
      
      // Now try the cached version (force fresh if needed)
      const compound = await pubchemCache.searchCompoundByName(searchTerm.trim());
      console.log('[PubChemPanel] Search result:', compound);
      console.log('[PubChemPanel] Full compound data:', JSON.stringify(compound, null, 2));
      
      if (!compound) {
        setError(`No compound found for "${searchTerm}"`);
      } else {
        setResult(compound);
        
        const smiles = compound.properties.CanonicalSMILES || compound.properties.IsomericSMILES;
        console.log('[PubChemPanel] SMILES found:', smiles);
        console.log('[PubChemPanel] Available properties:', Object.keys(compound.properties));
        
        if (onCompoundSelect) {
          onCompoundSelect(compound.cid, smiles);
        }
      }
    } catch (err) {
      console.error('[PubChemPanel] Search error:', err);
      setError((err as Error).message || 'Search failed');
    } finally {
      setIsSearching(false);
    }
  };

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

  const toggleOfflineMode = () => {
    const newMode = !isOffline;
    setIsOffline(newMode);
    pubchemCache.setOfflineMode(newMode);
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 1 }}>
      {/* Search Bar */}
      <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search compound by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isSearching}
          InputProps={{
            endAdornment: searchTerm && (
              <IconButton size="small" onClick={handleClear}>
                <ClearIcon fontSize="small" />
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
          Search
        </Button>
        <Tooltip title={isOffline ? 'Offline Mode' : 'Online Mode'}>
          <IconButton onClick={toggleOfflineMode} color={isOffline ? 'warning' : 'primary'}>
            {isOffline ? <CloudOffIcon /> : <CloudQueueIcon />}
          </IconButton>
        </Tooltip>
      </Stack>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Results Display */}
      {result && (
        <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
          <Card sx={{ maxHeight: '100%' }}>
            <CardContent sx={{ p: 1 }}>
              {/* Cache Status */}
              {result.fromCache && (
                <Chip
                  label="Cached"
                  size="small"
                  color="success"
                  sx={{ mb: 2 }}
                />
              )}

              {/* CID */}
              <Typography variant="subtitle2" gutterBottom>
                CID: {result.cid}
              </Typography>

              <Divider sx={{ my: 1 }} />

              {/* Properties */}
              <Stack spacing={1}>
                {result.properties.IUPACName && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      IUPAC Name
                    </Typography>
                    <Typography variant="body2">
                      {result.properties.IUPACName}
                    </Typography>
                  </Box>
                )}

                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Molecular Formula
                  </Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                    {result.properties.MolecularFormula}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Molecular Weight
                  </Typography>
                  <Typography variant="body2">
                    {typeof result.properties.MolecularWeight === 'number' 
                      ? result.properties.MolecularWeight.toFixed(2) 
                      : result.properties.MolecularWeight} g/mol
                  </Typography>
                </Box>

                {result.properties.CanonicalSMILES && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Canonical SMILES
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        fontFamily: 'monospace',
                        fontSize: '0.7rem',
                        wordBreak: 'break-all',
                        overflowWrap: 'break-word',
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {result.properties.CanonicalSMILES}
                    </Typography>
                  </Box>
                )}

                {result.properties.InChI && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      InChI
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        fontFamily: 'monospace',
                        fontSize: '0.7rem',
                        wordBreak: 'break-all',
                        overflowWrap: 'break-word',
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {result.properties.InChI}
                    </Typography>
                  </Box>
                )}

                {result.properties.InChIKey && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      InChI Key
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}
                    >
                      {result.properties.InChIKey}
                    </Typography>
                  </Box>
                )}
              </Stack>

              {/* 2D Structure Image */}
              {!isOffline && (
                <Box sx={{ mt: 3, textAlign: 'center' }}>
                  <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                    2D Structure
                  </Typography>
                  <img
                    src={pubchemCache.get2DImageURL(result.cid, 'medium')}
                    alt={`Structure of CID ${result.cid}`}
                    style={{ maxWidth: '100%', height: 'auto' }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Empty State */}
      {!result && !error && !isSearching && (
        <Box
          sx={{
            flexGrow: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'text.secondary',
          }}
        >
          <Typography variant="body2">
            Search for a compound to view its information
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default PubChemPanel;

