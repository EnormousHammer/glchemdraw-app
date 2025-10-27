import React, { useState, useRef, useCallback, Suspense } from 'react';
import {
  Box,
  Typography,
  Stack,
  Chip,
  CircularProgress,
  Snackbar,
  Alert,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CloseIcon from '@mui/icons-material/Close';
import { ThemeProvider } from '@mui/material/styles';
import theme from '../../theme';
import AppToolbar from '../Layout/Toolbar';
import ChemCanvas from '../ChemCanvas/ChemCanvas';
import ValidationPanel from '../ValidationPanel/ValidationPanel';
import PubChem3DViewer from '../PubChem3DViewer/PubChem3DViewer';
import { open } from '@tauri-apps/plugin-dialog';
import { readDir, readFile } from '@tauri-apps/plugin-fs';
// StructureData interface for chemical structure information
interface StructureData {
  molfile: string;
  smiles: string;
}

interface AppLayoutProps {
  onSearchByName?: (name: string) => void;
}

const AppLayout: React.FC<AppLayoutProps> = ({ onSearchByName }) => {
  // State management
  const [currentStructure, setCurrentStructure] = useState<StructureData | null>(null);
  const [recognizedCompound, setRecognizedCompound] = useState<{
    cid: number;
    name: string;
    properties: any;
  } | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'warning' | 'info'>('info');
  const [show3DViewer, setShow3DViewer] = useState(false);
  
  // Removed NMR functionality - structure drawing only
  
  // Chemical data state for comprehensive information
  const [chemicalData, setChemicalData] = useState<{
    physicalProperties: any;
    safetyData: any;
    descriptors: any;
    regulatory: any;
    spectral: any;
  }>({
    physicalProperties: null,
    safetyData: null,
    descriptors: null,
    regulatory: null,
    spectral: null,
  });

  // Refs
  const ketcherRef = useRef<any>(null);

  // Copy to clipboard function
  const handleCopy = useCallback((text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setSnackbarMessage(`${label} copied to clipboard!`);
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    }).catch((err) => {
      console.error('Failed to copy:', err);
      setSnackbarMessage('Failed to copy to clipboard');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    });
  }, []);

  // Copy all data function
  const handleCopyAll = useCallback(() => {
    if (!recognizedCompound) {
      setSnackbarMessage('No data to copy');
      setSnackbarSeverity('warning');
      setSnackbarOpen(true);
      return;
    }

    const allData = {
      name: recognizedCompound.name,
      iupacName: recognizedCompound.properties?.IUPACName,
      cid: recognizedCompound.cid,
      casNumber: chemicalData.regulatory?.casNumber,
      molecularFormula: chemicalData.physicalProperties?.molecularFormula,
      molecularWeight: chemicalData.physicalProperties?.molecularWeight,
      smiles: chemicalData.regulatory?.smiles || currentStructure?.smiles,
      inchiKey: chemicalData.regulatory?.inchiKey,
      physicalProperties: chemicalData.physicalProperties,
      descriptors: chemicalData.descriptors,
      safetyData: chemicalData.safetyData,
      regulatory: chemicalData.regulatory,
      spectral: chemicalData.spectral,
    };

    const jsonString = JSON.stringify(allData, null, 2);
    navigator.clipboard.writeText(jsonString).then(() => {
      setSnackbarMessage('All data copied to clipboard as JSON!');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    }).catch((err) => {
      console.error('Failed to copy all data:', err);
      setSnackbarMessage('Failed to copy all data');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    });
  }, [recognizedCompound, chemicalData, currentStructure]);

  // Handle structure changes from the canvas
  const handleStructureChange = useCallback(async (molfile: string, smiles: string) => {
    console.log('[AppLayout] Structure changed:', { molfile, smiles });
    const structure: StructureData = { molfile, smiles };
    setCurrentStructure(structure);
    
    if (smiles) {
      await fetchComprehensiveData(smiles);
    } else {
      // Clear data if no SMILES
      setRecognizedCompound(null);
      setChemicalData({
        physicalProperties: null,
        safetyData: null,
        descriptors: null,
        regulatory: null,
        spectral: null,
      });
    }
  }, []);

  // Fetch comprehensive chemical data from PubChem API
  const fetchComprehensiveData = async (smiles: string) => {
    try {
      setIsSearching(true);
      console.log('[AppLayout] Fetching REAL data from PubChem for SMILES:', smiles);
      
      // Try to find compound in PubChem by searching by SMILES directly
      const { getCIDBySMILES, getPropertiesByCID, getCASNumber } = await import('../../lib/pubchem/api');
      const { getSafetyDataByCID } = await import('../../lib/pubchem/safety'); // NEW: Import safety data function
      
      let foundCompound = null;
      let safetyData = null; // NEW: State for safety data
      
      try {
        console.log(`[AppLayout] Searching PubChem by SMILES: ${smiles}`);
        const cid = await getCIDBySMILES(smiles);
        
        if (cid) {
          console.log(`[AppLayout] Found CID for SMILES: ${cid}`);
          
          // NEW: Fetch basic properties, safety data, and CAS number in parallel
          const [properties, safety, casNumber] = await Promise.all([
            getPropertiesByCID(cid, [
              'MolecularWeight', 'MolecularFormula', 'CanonicalSMILES', 'InChI', 'InChIKey',
              'IUPACName', 'IsomericSMILES', 'XLogP', 'ExactMass', 'MonoIsotopicMass',
              'TPSA', 'HeavyAtomCount', 'Complexity', 'Charge', 'HBondDonorCount', 
              'HBondAcceptorCount', 'RotatableBondCount'
            ]),
            getSafetyDataByCID(cid), // NEW: Fetch safety data
            getCASNumber(cid) // NEW: Fetch CAS number
          ]);
          
          if (properties) {
            console.log(`[AppLayout] Found properties for SMILES!`);
            foundCompound = { cid, properties, name: properties.IUPACName || 'Unknown', casNumber: casNumber };
            safetyData = safety; // NEW: Assign fetched safety data
            console.log(`[AppLayout] Safety data:`, safetyData);
          }
        }
      } catch (err) {
        console.log(`[AppLayout] No direct match for SMILES: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
      
      if (foundCompound) {
        console.log('[AppLayout] Setting REAL PubChem data:', foundCompound);
        
        // Set the recognized compound
        setRecognizedCompound({
          cid: foundCompound.cid,
          name: foundCompound.name,
          properties: foundCompound.properties
        });
        
        // Set ALL REAL data from PubChem (basic properties + safety data)
        setChemicalData({
          physicalProperties: {
            molecularWeight: foundCompound.properties.MolecularWeight,
            molecularFormula: foundCompound.properties.MolecularFormula,
            exactMass: foundCompound.properties.ExactMass,
            monoIsotopicMass: foundCompound.properties.MonoIsotopicMass,
            density: null, // Not available in PubChem basic properties
            meltingPoint: null, // Not available in PubChem basic properties
            boilingPoint: null, // Not available in PubChem basic properties
          },
          safetyData: safetyData ? { // NEW: Populate safetyData from fetched data
            hazardClass: safetyData.hazardClass,
            flashPoint: safetyData.flashPoint,
            autoignition: safetyData.autoignition,
            ld50: safetyData.ld50 || safetyData.oralLd50,
            healthHazards: safetyData.healthHazards,
            fireHazards: safetyData.fireHazards,
            flammability: safetyData.flammability,
            nfpaRating: safetyData.nfpaRating,
            ghsClassification: safetyData.ghsClassification,
            firstAid: safetyData.firstAid,
            exposureLimits: safetyData.exposureLimits,
            personalProtection: safetyData.personalProtection,
            storage: safetyData.storage,
            disposal: safetyData.disposal,
            incompatibilities: safetyData.incompatibilities,
          } : { // NEW: Clear safetyData if not found
            hazardClass: null,
            flashPoint: null,
            autoignition: null,
            ld50: null,
            healthHazards: null,
            fireHazards: null,
            flammability: null,
            nfpaRating: null,
            ghsClassification: null,
            firstAid: null,
            exposureLimits: null,
            personalProtection: null,
            storage: null,
            disposal: null,
            incompatibilities: null,
          },
          descriptors: {
            logP: foundCompound.properties.XLogP,
            tpsa: foundCompound.properties.TPSA,
            hBondDonors: foundCompound.properties.HBondDonorCount,
            hBondAcceptors: foundCompound.properties.HBondAcceptorCount,
            rotatableBonds: foundCompound.properties.RotatableBondCount,
            complexity: foundCompound.properties.Complexity,
            heavyAtomCount: foundCompound.properties.HeavyAtomCount,
            formalCharge: foundCompound.properties.Charge,
          },
          regulatory: {
            casNumber: foundCompound.casNumber, // Now available from PubChem API
            pubchemCID: foundCompound.cid,
            inchi: foundCompound.properties.InChI,
            inchiKey: foundCompound.properties.InChIKey,
            smiles: foundCompound.properties.CanonicalSMILES,
            iupacName: foundCompound.properties.IUPACName,
          },
          spectral: {
            nmrAvailable: null, // Not available in PubChem basic properties
            irSpectrum: null, // Not available in PubChem basic properties
            massSpectrum: null, // Not available in PubChem basic properties
          }
        });
      } else {
        console.log('[AppLayout] No matching compound found in PubChem for SMILES:', smiles);
        // Clear all data - no mock data
        setRecognizedCompound(null);
        setChemicalData({
          physicalProperties: null,
          safetyData: null,
          descriptors: null,
          regulatory: null,
          spectral: null,
        });
      }
      
    } catch (error) {
      console.error('[AppLayout] Error fetching REAL data from PubChem:', error);
      // Clear all data on error - no mock data
      setRecognizedCompound(null);
      setChemicalData({
        physicalProperties: null,
        safetyData: null,
        descriptors: null,
        regulatory: null,
        spectral: null,
      });
    } finally {
      setIsSearching(false);
    }
  };

  // Handle search by name from header
  const handleSearchByName = async (name: string) => {
    try {
      setIsSearching(true);
      console.log('[AppLayout] Searching by name:', name);
      
      const { getCIDByName, getPropertiesByCID, getCASNumber } = await import('../../lib/pubchem/api');
      const { getSafetyDataByCID } = await import('../../lib/pubchem/safety');
      
      const cid = await getCIDByName(name);
      if (cid) {
        console.log(`[AppLayout] Found CID for name "${name}": ${cid}`);
        
        // Fetch properties, safety data, and CAS number in parallel
        const [properties, safety, casNumber] = await Promise.all([
          getPropertiesByCID(cid, [
            'MolecularWeight', 'MolecularFormula', 'CanonicalSMILES', 'InChI', 'InChIKey',
            'IUPACName', 'IsomericSMILES', 'XLogP', 'ExactMass', 'MonoIsotopicMass',
            'TPSA', 'HeavyAtomCount', 'Complexity', 'Charge', 'HBondDonorCount', 
            'HBondAcceptorCount', 'RotatableBondCount'
          ]),
          getSafetyDataByCID(cid),
          getCASNumber(cid)
        ]);
        
        if (properties) {
          console.log('[AppLayout] Found properties for name!');
          
          // Set the recognized compound
          setRecognizedCompound({
            cid: cid,
            name: properties.IUPACName || name,
            properties: properties
          });
          
          // Set ALL REAL data from PubChem
          setChemicalData({
            physicalProperties: {
              molecularWeight: properties.MolecularWeight,
              molecularFormula: properties.MolecularFormula,
              exactMass: properties.ExactMass,
              monoIsotopicMass: properties.MonoIsotopicMass,
              density: null,
              meltingPoint: null,
              boilingPoint: null,
            },
            safetyData: safety ? {
              hazardClass: safety.hazardClass,
              flashPoint: safety.flashPoint,
              autoignition: safety.autoignition,
              ld50: safety.ld50 || safety.oralLd50,
              healthHazards: safety.healthHazards,
              fireHazards: safety.fireHazards,
              flammability: safety.flammability,
              nfpaRating: safety.nfpaRating,
              ghsClassification: safety.ghsClassification,
              firstAid: safety.firstAid,
              exposureLimits: safety.exposureLimits,
              personalProtection: safety.personalProtection,
              storage: safety.storage,
              disposal: safety.disposal,
              incompatibilities: safety.incompatibilities,
            } : {
              hazardClass: null,
              flashPoint: null,
              autoignition: null,
              ld50: null,
              healthHazards: null,
              fireHazards: null,
              flammability: null,
              nfpaRating: null,
              ghsClassification: null,
              firstAid: null,
              exposureLimits: null,
              personalProtection: null,
              storage: null,
              disposal: null,
              incompatibilities: null,
            },
            descriptors: {
              logP: properties.XLogP,
              tpsa: properties.TPSA,
              hBondDonors: properties.HBondDonorCount,
              hBondAcceptors: properties.HBondAcceptorCount,
              rotatableBonds: properties.RotatableBondCount,
              complexity: properties.Complexity,
              heavyAtomCount: properties.HeavyAtomCount,
              formalCharge: properties.Charge,
            },
            regulatory: {
              casNumber: casNumber,
              pubchemCID: cid,
              inchi: properties.InChI,
              inchiKey: properties.InChIKey,
              smiles: properties.CanonicalSMILES,
              iupacName: properties.IUPACName,
            },
            spectral: {
              nmrAvailable: null,
              irSpectrum: null,
              massSpectrum: null,
            }
          });
          
          // Load the structure into the canvas if we have SMILES
          const smilesToUse = properties.CanonicalSMILES || properties.SMILES;
          
          if (smilesToUse && ketcherRef.current) {
            try {
              const { convertSmilesToMol } = await import('../../lib/chemistry/smilesToMol');
              const molContent = await convertSmilesToMol(smilesToUse);
              
              if (molContent) {
                await ketcherRef.current.setMolecule(molContent);
                console.log('[AppLayout] Loaded structure into canvas');
              }
            } catch (error) {
              console.error('[AppLayout] Error loading structure into canvas:', error);
            }
          }
          
          setSnackbarMessage(`Found compound: ${properties.IUPACName || name}`);
          setSnackbarSeverity('success');
          setSnackbarOpen(true);
        } else {
          console.log('[AppLayout] No properties found for name:', name);
          setSnackbarMessage(`No data found for: ${name}`);
          setSnackbarSeverity('warning');
          setSnackbarOpen(true);
        }
      } else {
        console.log('[AppLayout] No CID found for name:', name);
        setSnackbarMessage(`Compound not found: ${name}`);
        setSnackbarSeverity('warning');
        setSnackbarOpen(true);
      }
    } catch (error) {
      console.error('[AppLayout] Error searching by name:', error);
      setSnackbarMessage(`Error searching for: ${name}`);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setIsSearching(false);
    }
  };

  const handleClear = useCallback(() => {
    if (ketcherRef.current && ketcherRef.current.editor) {
      try {
        ketcherRef.current.editor.clear();
        setCurrentStructure(null);
        setRecognizedCompound(null);
        setChemicalData({
          physicalProperties: null,
          safetyData: null,
          descriptors: null,
          regulatory: null,
          spectral: null,
        });
        console.log('[AppLayout] Canvas cleared');
        setSnackbarMessage('Canvas cleared');
        setSnackbarSeverity('info');
        setSnackbarOpen(true);
      } catch (error) {
        console.error('[AppLayout] Error clearing canvas:', error);
        setSnackbarMessage('Clear failed');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    } else {
      setSnackbarMessage('No canvas to clear');
      setSnackbarSeverity('warning');
      setSnackbarOpen(true);
    }
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ 
        height: '100vh', 
        width: '100vw',
        display: 'flex', 
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Header - ALWAYS ON TOP */}
        <AppToolbar
          onNew={() => {}}
          onOpen={() => {}}
          onSave={() => {}}
          onUndo={() => {}}
          onRedo={() => {}}
          onClear={handleClear}
          onSearchByName={handleSearchByName}
        />

        {/* Main Content - Conditional View */}
        <Box sx={{ 
          flex: 1,
          display: 'flex', 
          marginTop: '56px', // Push content below fixed header
          height: 'calc(100vh - 56px)', // Exact height: viewport minus header
          overflow: 'hidden', // Prevent any scrolling
          width: '100%',
          position: 'relative'
        }}>
          {(() => {
            // Structure-only view - removed NMR functionality
            return (
              <>
                {/* Left Panel - Drawing Canvas */}
              <Box
                sx={{
                  width: '75%', // Increased from 65% for more drawing space
                  height: '100%',
                  borderRight: 1,
                  borderColor: 'divider',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden'
                }}
              >
                {/* Drawing Canvas - Full Height */}
                <Box sx={{ 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden'
                }}>
                  <ChemCanvas
                    onStructureChange={handleStructureChange}
                    onError={(error) => console.error('[AppLayout] ChemCanvas error:', error)}
                    onKetcherInit={(instance) => (ketcherRef.current = instance)}
                  />
                </Box>
              </Box>

              {/* Right Panel - All Information in One View */}
              <Box
                sx={{
                  width: '25%', // Reduced from 35% to give more space to canvas
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  bgcolor: 'background.paper',
                  borderLeft: 1,
                  borderColor: 'divider',
                }}
              >
                {/* Status Header - Compact */}
                <Box sx={{ p: 1, borderBottom: 1, borderColor: 'divider', bgcolor: 'background.default' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="subtitle1" color="text.primary" sx={{ fontWeight: 600, fontSize: '0.95rem' }}>
                      Chemical Info
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {isSearching && <CircularProgress size={16} />}
                      {recognizedCompound && !isSearching && (
                        <>
                          <Typography variant="caption" color="success.main" sx={{ fontWeight: 600 }}>
                            ✓ Identified
                          </Typography>
                          <Tooltip title="Copy All Data as JSON">
                            <IconButton 
                              size="small" 
                              onClick={handleCopyAll}
                              sx={{ 
                                bgcolor: 'primary.main',
                                color: 'white',
                                '&:hover': { bgcolor: 'primary.dark' },
                                width: 28,
                                height: 28,
                              }}
                            >
                              <ContentCopyIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                    </Box>
                  </Box>
                </Box>

                {/* All Information in One View - Compact */}
                <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
                  <Stack spacing={1}>
                    {/* Structure Validation */}
                    <ValidationPanel
                      smiles={currentStructure?.smiles}
                      molfile={currentStructure?.molfile}
                    />

              {/* Compound Identification */}
              {recognizedCompound && (
                <Box sx={{ p: 1.25, bgcolor: 'background.default', borderRadius: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 1 }}>
                      🔬 Molecular Identifiers
                    </Typography>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => setShow3DViewer(true)}
                      sx={{ fontSize: '0.7rem', py: 0.25, px: 1 }}
                    >
                      View 3D
                    </Button>
                  </Box>
                  <Stack spacing={0.5}>
                    <Box 
                      onClick={() => handleCopy(recognizedCompound.name, 'Name')}
                      sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        gap: 1,
                        p: 0.75,
                        borderRadius: 1,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': {
                          bgcolor: 'action.hover',
                          transform: 'translateX(2px)',
                        }
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">Name:</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.75rem' }}>
                          {recognizedCompound.name}
                        </Typography>
                        <ContentCopyIcon sx={{ fontSize: 12, opacity: 0.5 }} />
                      </Box>
                    </Box>
                    <Box 
                      onClick={() => recognizedCompound.properties?.IUPACName && handleCopy(recognizedCompound.properties.IUPACName, 'IUPAC Name')}
                      sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        gap: 1,
                        p: 0.75,
                        borderRadius: 1,
                        cursor: recognizedCompound.properties?.IUPACName ? 'pointer' : 'default',
                        transition: 'all 0.2s',
                        '&:hover': recognizedCompound.properties?.IUPACName ? {
                          bgcolor: 'action.hover',
                          transform: 'translateX(2px)',
                        } : {}
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">IUPAC Name:</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.75rem' }}>
                          {recognizedCompound.properties?.IUPACName || 'N/A'}
                        </Typography>
                        {recognizedCompound.properties?.IUPACName && (
                          <ContentCopyIcon sx={{ fontSize: 12, opacity: 0.5 }} />
                        )}
                      </Box>
                    </Box>
                    <Box 
                      onClick={() => handleCopy(String(recognizedCompound.cid), 'CID')}
                      sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        gap: 1,
                        p: 0.75,
                        borderRadius: 1,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': {
                          bgcolor: 'action.hover',
                          transform: 'translateX(2px)',
                        }
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">PubChem CID:</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.75rem' }}>
                          {recognizedCompound.cid}
                        </Typography>
                        <ContentCopyIcon sx={{ fontSize: 12, opacity: 0.5 }} />
                      </Box>
                    </Box>
                    <Box 
                      onClick={() => chemicalData.regulatory?.casNumber && handleCopy(chemicalData.regulatory.casNumber, 'CAS Number')}
                      sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        gap: 1,
                        p: 0.75,
                        borderRadius: 1,
                        cursor: chemicalData.regulatory?.casNumber ? 'pointer' : 'default',
                        transition: 'all 0.2s',
                        '&:hover': chemicalData.regulatory?.casNumber ? {
                          bgcolor: 'action.hover',
                          transform: 'translateX(2px)',
                        } : {}
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">CAS Number:</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.75rem' }}>
                          {chemicalData.regulatory?.casNumber || 'N/A'}
                        </Typography>
                        {chemicalData.regulatory?.casNumber && (
                          <ContentCopyIcon sx={{ fontSize: 12, opacity: 0.5 }} />
                        )}
                      </Box>
                    </Box>
                    {chemicalData.regulatory?.inchiKey && (
                      <Box 
                        onClick={() => handleCopy(chemicalData.regulatory.inchiKey, 'InChI Key')}
                        sx={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center', 
                          gap: 1,
                          p: 0.75,
                          borderRadius: 1,
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          '&:hover': {
                            bgcolor: 'action.hover',
                            transform: 'translateX(2px)',
                          }
                        }}
                      >
                        <Typography variant="caption" color="text.secondary">InChI Key:</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Typography variant="caption" sx={{ fontWeight: 500, fontFamily: 'monospace', fontSize: '0.7rem', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {chemicalData.regulatory.inchiKey}
                          </Typography>
                          <ContentCopyIcon sx={{ fontSize: 12, opacity: 0.5 }} />
                        </Box>
                      </Box>
                    )}
                    {chemicalData.regulatory?.smiles && (
                      <Box 
                        onClick={() => handleCopy(chemicalData.regulatory.smiles, 'SMILES')}
                        sx={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center', 
                          gap: 1,
                          p: 0.75,
                          borderRadius: 1,
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          '&:hover': {
                            bgcolor: 'action.hover',
                            transform: 'translateX(2px)',
                          }
                        }}
                      >
                        <Typography variant="caption" color="text.secondary">SMILES:</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Typography variant="caption" sx={{ fontWeight: 500, fontFamily: 'monospace', fontSize: '0.7rem', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {chemicalData.regulatory.smiles}
                          </Typography>
                          <ContentCopyIcon sx={{ fontSize: 12, opacity: 0.5 }} />
                        </Box>
                      </Box>
                    )}
                    {chemicalData.regulatory?.inchi && (
                      <Box 
                        onClick={() => handleCopy(chemicalData.regulatory.inchi, 'InChI')}
                        sx={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center', 
                          gap: 1,
                          p: 0.75,
                          borderRadius: 1,
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          '&:hover': {
                            bgcolor: 'action.hover',
                            transform: 'translateX(2px)',
                          }
                        }}
                      >
                        <Typography variant="caption" color="text.secondary">InChI:</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Typography variant="caption" sx={{ fontWeight: 500, fontFamily: 'monospace', fontSize: '0.7rem', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {chemicalData.regulatory.inchi}
                          </Typography>
                          <ContentCopyIcon sx={{ fontSize: 12, opacity: 0.5 }} />
                        </Box>
                      </Box>
                    )}
                  </Stack>
                </Box>
              )}

              {/* Physical Properties */}
              {chemicalData.physicalProperties && (
                (chemicalData.physicalProperties.molecularWeight || 
                 chemicalData.physicalProperties.molecularFormula || 
                 chemicalData.physicalProperties.exactMass || 
                 chemicalData.physicalProperties.monoIsotopicMass || 
                 chemicalData.physicalProperties.density || 
                 chemicalData.physicalProperties.meltingPoint || 
                 chemicalData.physicalProperties.boilingPoint) && (
                  <Box sx={{ p: 1.25, bgcolor: 'background.default', borderRadius: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.75, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 1 }}>
                      ⚗️ Properties
                    </Typography>
                    <Stack spacing={0.5}>
                      {chemicalData.physicalProperties.molecularWeight && (
                        <Box 
                          onClick={() => handleCopy(
                            `${typeof chemicalData.physicalProperties.molecularWeight === 'number' 
                              ? chemicalData.physicalProperties.molecularWeight.toFixed(2)
                              : parseFloat(chemicalData.physicalProperties.molecularWeight).toFixed(2)} g/mol`, 
                            'Molecular Weight'
                          )}
                          sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center', 
                            gap: 1,
                            p: 0.75,
                            borderRadius: 1,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            '&:hover': {
                              bgcolor: 'action.hover',
                              transform: 'translateX(2px)',
                            }
                          }}
                        >
                          <Typography variant="caption" color="text.secondary">Molecular Weight:</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.75rem' }}>
                              {typeof chemicalData.physicalProperties.molecularWeight === 'number' 
                                ? chemicalData.physicalProperties.molecularWeight.toFixed(2)
                                : parseFloat(chemicalData.physicalProperties.molecularWeight).toFixed(2)} g/mol
                            </Typography>
                            <ContentCopyIcon sx={{ fontSize: 12, opacity: 0.5 }} />
                          </Box>
                        </Box>
                      )}
                      {chemicalData.physicalProperties.molecularFormula && (
                        <Box 
                          onClick={() => handleCopy(chemicalData.physicalProperties.molecularFormula, 'Molecular Formula')}
                          sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center', 
                            gap: 1,
                            p: 0.75,
                            borderRadius: 1,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            '&:hover': {
                              bgcolor: 'action.hover',
                              transform: 'translateX(2px)',
                            }
                          }}
                        >
                          <Typography variant="caption" color="text.secondary">Molecular Formula:</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Typography variant="caption" sx={{ fontWeight: 500, fontFamily: 'monospace', fontSize: '0.75rem' }}>
                              {chemicalData.physicalProperties.molecularFormula}
                            </Typography>
                            <ContentCopyIcon sx={{ fontSize: 12, opacity: 0.5 }} />
                          </Box>
                        </Box>
                      )}
                      {chemicalData.physicalProperties.exactMass && (
                        <Box 
                          onClick={() => handleCopy(
                            `${typeof chemicalData.physicalProperties.exactMass === 'number' 
                              ? chemicalData.physicalProperties.exactMass.toFixed(4)
                              : parseFloat(chemicalData.physicalProperties.exactMass).toFixed(4)} Da`,
                            'Exact Mass'
                          )}
                          sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center', 
                            gap: 1,
                            p: 0.75,
                            borderRadius: 1,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            '&:hover': {
                              bgcolor: 'action.hover',
                              transform: 'translateX(2px)',
                            }
                          }}
                        >
                          <Typography variant="caption" color="text.secondary">Exact Mass:</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.75rem' }}>
                              {typeof chemicalData.physicalProperties.exactMass === 'number' 
                                ? chemicalData.physicalProperties.exactMass.toFixed(4)
                                : parseFloat(chemicalData.physicalProperties.exactMass).toFixed(4)} Da
                            </Typography>
                            <ContentCopyIcon sx={{ fontSize: 12, opacity: 0.5 }} />
                          </Box>
                        </Box>
                      )}
                      {chemicalData.physicalProperties.monoIsotopicMass && (
                        <Box 
                          onClick={() => handleCopy(
                            `${typeof chemicalData.physicalProperties.monoIsotopicMass === 'number' 
                              ? chemicalData.physicalProperties.monoIsotopicMass.toFixed(4)
                              : parseFloat(chemicalData.physicalProperties.monoIsotopicMass).toFixed(4)} Da`,
                            'Monoisotopic Mass'
                          )}
                          sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center', 
                            gap: 1,
                            p: 0.75,
                            borderRadius: 1,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            '&:hover': {
                              bgcolor: 'action.hover',
                              transform: 'translateX(2px)',
                            }
                          }}
                        >
                          <Typography variant="caption" color="text.secondary">Monoisotopic Mass:</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.75rem' }}>
                              {typeof chemicalData.physicalProperties.monoIsotopicMass === 'number' 
                                ? chemicalData.physicalProperties.monoIsotopicMass.toFixed(4)
                                : parseFloat(chemicalData.physicalProperties.monoIsotopicMass).toFixed(4)} Da
                            </Typography>
                            <ContentCopyIcon sx={{ fontSize: 12, opacity: 0.5 }} />
                          </Box>
                        </Box>
                      )}
                      {chemicalData.physicalProperties.density && (
                        <Box 
                          onClick={() => handleCopy(chemicalData.physicalProperties.density, 'Density')}
                          sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center', 
                            gap: 1,
                            p: 0.75,
                            borderRadius: 1,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            '&:hover': {
                              bgcolor: 'action.hover',
                              transform: 'translateX(2px)',
                            }
                          }}
                        >
                          <Typography variant="caption" color="text.secondary">Density:</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.75rem' }}>
                              {chemicalData.physicalProperties.density}
                            </Typography>
                            <ContentCopyIcon sx={{ fontSize: 12, opacity: 0.5 }} />
                          </Box>
                        </Box>
                      )}
                      {chemicalData.physicalProperties.meltingPoint && (
                        <Box 
                          onClick={() => handleCopy(chemicalData.physicalProperties.meltingPoint, 'Melting Point')}
                          sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center', 
                            gap: 1,
                            p: 0.75,
                            borderRadius: 1,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            '&:hover': {
                              bgcolor: 'action.hover',
                              transform: 'translateX(2px)',
                            }
                          }}
                        >
                          <Typography variant="caption" color="text.secondary">Melting Point:</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.75rem' }}>
                              {chemicalData.physicalProperties.meltingPoint}
                            </Typography>
                            <ContentCopyIcon sx={{ fontSize: 12, opacity: 0.5 }} />
                          </Box>
                        </Box>
                      )}
                      {chemicalData.physicalProperties.boilingPoint && (
                        <Box 
                          onClick={() => handleCopy(chemicalData.physicalProperties.boilingPoint, 'Boiling Point')}
                          sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center', 
                            gap: 1,
                            p: 0.75,
                            borderRadius: 1,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            '&:hover': {
                              bgcolor: 'action.hover',
                              transform: 'translateX(2px)',
                            }
                          }}
                        >
                          <Typography variant="caption" color="text.secondary">Boiling Point:</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.75rem' }}>
                              {chemicalData.physicalProperties.boilingPoint}
                            </Typography>
                            <ContentCopyIcon sx={{ fontSize: 12, opacity: 0.5 }} />
                          </Box>
                        </Box>
                      )}
                    </Stack>
                  </Box>
                )
              )}

              {/* Chemical Descriptors */}
              {chemicalData.descriptors && (
                (chemicalData.descriptors.logP !== undefined || 
                 chemicalData.descriptors.tpsa !== undefined || 
                 chemicalData.descriptors.hBondDonors !== undefined || 
                 chemicalData.descriptors.hBondAcceptors !== undefined || 
                 chemicalData.descriptors.rotatableBonds !== undefined || 
                 chemicalData.descriptors.complexity !== undefined || 
                 chemicalData.descriptors.heavyAtomCount !== undefined || 
                 chemicalData.descriptors.formalCharge !== undefined) && (
                  <Box sx={{ p: 1.25, bgcolor: 'background.default', borderRadius: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.75, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 1 }}>
                      📊 Chemical Descriptors
                    </Typography>
                    <Stack spacing={0.5}>
                      {chemicalData.descriptors.logP !== undefined && (
                        <Box 
                          onClick={() => handleCopy(
                            String(typeof chemicalData.descriptors.logP === 'number' 
                              ? chemicalData.descriptors.logP.toFixed(2)
                              : parseFloat(chemicalData.descriptors.logP).toFixed(2)),
                            'LogP'
                          )}
                          sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center', 
                            gap: 1,
                            p: 0.75,
                            borderRadius: 1,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            '&:hover': {
                              bgcolor: 'action.hover',
                              transform: 'translateX(2px)',
                            }
                          }}
                        >
                          <Typography variant="caption" color="text.secondary">LogP (Lipophilicity):</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.75rem' }}>
                              {typeof chemicalData.descriptors.logP === 'number' 
                                ? chemicalData.descriptors.logP.toFixed(2)
                                : parseFloat(chemicalData.descriptors.logP).toFixed(2)}
                            </Typography>
                            <ContentCopyIcon sx={{ fontSize: 12, opacity: 0.5 }} />
                          </Box>
                        </Box>
                      )}
                      {chemicalData.descriptors.tpsa !== undefined && (
                        <Box 
                          onClick={() => handleCopy(
                            `${typeof chemicalData.descriptors.tpsa === 'number' 
                              ? chemicalData.descriptors.tpsa.toFixed(2)
                              : parseFloat(chemicalData.descriptors.tpsa).toFixed(2)} Å²`,
                            'TPSA'
                          )}
                          sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center', 
                            gap: 1,
                            p: 0.75,
                            borderRadius: 1,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            '&:hover': {
                              bgcolor: 'action.hover',
                              transform: 'translateX(2px)',
                            }
                          }}
                        >
                          <Typography variant="caption" color="text.secondary">TPSA (Polar Surface Area):</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.75rem' }}>
                              {typeof chemicalData.descriptors.tpsa === 'number' 
                                ? chemicalData.descriptors.tpsa.toFixed(2)
                                : parseFloat(chemicalData.descriptors.tpsa).toFixed(2)} Å²
                            </Typography>
                            <ContentCopyIcon sx={{ fontSize: 12, opacity: 0.5 }} />
                          </Box>
                        </Box>
                      )}
                      {chemicalData.descriptors.hBondDonors !== undefined && (
                        <Box 
                          onClick={() => handleCopy(String(chemicalData.descriptors.hBondDonors), 'H-Bond Donors')}
                          sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center', 
                            gap: 1,
                            p: 0.75,
                            borderRadius: 1,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            '&:hover': {
                              bgcolor: 'action.hover',
                              transform: 'translateX(2px)',
                            }
                          }}
                        >
                          <Typography variant="caption" color="text.secondary">H-Bond Donors:</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.75rem' }}>
                              {chemicalData.descriptors.hBondDonors}
                            </Typography>
                            <ContentCopyIcon sx={{ fontSize: 12, opacity: 0.5 }} />
                          </Box>
                        </Box>
                      )}
                      {chemicalData.descriptors.hBondAcceptors !== undefined && (
                        <Box 
                          onClick={() => handleCopy(String(chemicalData.descriptors.hBondAcceptors), 'H-Bond Acceptors')}
                          sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center', 
                            gap: 1,
                            p: 0.75,
                            borderRadius: 1,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            '&:hover': {
                              bgcolor: 'action.hover',
                              transform: 'translateX(2px)',
                            }
                          }}
                        >
                          <Typography variant="caption" color="text.secondary">H-Bond Acceptors:</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.75rem' }}>
                              {chemicalData.descriptors.hBondAcceptors}
                            </Typography>
                            <ContentCopyIcon sx={{ fontSize: 12, opacity: 0.5 }} />
                          </Box>
                        </Box>
                      )}
                      {chemicalData.descriptors.rotatableBonds !== undefined && (
                        <Box 
                          onClick={() => handleCopy(String(chemicalData.descriptors.rotatableBonds), 'Rotatable Bonds')}
                          sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center', 
                            gap: 1,
                            p: 0.75,
                            borderRadius: 1,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            '&:hover': {
                              bgcolor: 'action.hover',
                              transform: 'translateX(2px)',
                            }
                          }}
                        >
                          <Typography variant="caption" color="text.secondary">Rotatable Bonds:</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.75rem' }}>
                              {chemicalData.descriptors.rotatableBonds}
                            </Typography>
                            <ContentCopyIcon sx={{ fontSize: 12, opacity: 0.5 }} />
                          </Box>
                        </Box>
                      )}
                      {chemicalData.descriptors.complexity !== undefined && (
                        <Box 
                          onClick={() => handleCopy(
                            String(typeof chemicalData.descriptors.complexity === 'number' 
                              ? chemicalData.descriptors.complexity.toFixed(1)
                              : parseFloat(chemicalData.descriptors.complexity).toFixed(1)),
                            'Complexity'
                          )}
                          sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center', 
                            gap: 1,
                            p: 0.75,
                            borderRadius: 1,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            '&:hover': {
                              bgcolor: 'action.hover',
                              transform: 'translateX(2px)',
                            }
                          }}
                        >
                          <Typography variant="caption" color="text.secondary">Complexity:</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.75rem' }}>
                              {typeof chemicalData.descriptors.complexity === 'number' 
                                ? chemicalData.descriptors.complexity.toFixed(1)
                                : parseFloat(chemicalData.descriptors.complexity).toFixed(1)}
                            </Typography>
                            <ContentCopyIcon sx={{ fontSize: 12, opacity: 0.5 }} />
                          </Box>
                        </Box>
                      )}
                      {chemicalData.descriptors.heavyAtomCount !== undefined && (
                        <Box 
                          onClick={() => handleCopy(String(chemicalData.descriptors.heavyAtomCount), 'Heavy Atom Count')}
                          sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center', 
                            gap: 1,
                            p: 0.75,
                            borderRadius: 1,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            '&:hover': {
                              bgcolor: 'action.hover',
                              transform: 'translateX(2px)',
                            }
                          }}
                        >
                          <Typography variant="caption" color="text.secondary">Heavy Atom Count:</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.75rem' }}>
                              {chemicalData.descriptors.heavyAtomCount}
                            </Typography>
                            <ContentCopyIcon sx={{ fontSize: 12, opacity: 0.5 }} />
                          </Box>
                        </Box>
                      )}
                      {chemicalData.descriptors.formalCharge !== undefined && (
                        <Box 
                          onClick={() => handleCopy(String(chemicalData.descriptors.formalCharge), 'Formal Charge')}
                          sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center', 
                            gap: 1,
                            p: 0.75,
                            borderRadius: 1,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            '&:hover': {
                              bgcolor: 'action.hover',
                              transform: 'translateX(2px)',
                            }
                          }}
                        >
                          <Typography variant="caption" color="text.secondary">Formal Charge:</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.75rem' }}>
                              {chemicalData.descriptors.formalCharge}
                            </Typography>
                            <ContentCopyIcon sx={{ fontSize: 12, opacity: 0.5 }} />
                          </Box>
                        </Box>
                      )}
                    </Stack>
                  </Box>
                )
              )}


              {/* Spectral Data */}
              {chemicalData.spectral && (
                (chemicalData.spectral.irSpectrum || 
                 chemicalData.spectral.massSpectrum) && (
                  <Box sx={{ p: 1.25, bgcolor: 'background.default', borderRadius: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.75, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 1 }}>
                      📊 Spectral Data
                    </Typography>
                    <Stack spacing={0.5}>
                      {chemicalData.spectral.irSpectrum && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="caption" color="text.secondary">IR Spectrum:</Typography>
                          <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.75rem' }}>
                            {chemicalData.spectral.irSpectrum}
                          </Typography>
                        </Box>
                      )}
                      {chemicalData.spectral.massSpectrum && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="caption" color="text.secondary">Mass Spectrum:</Typography>
                          <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.75rem' }}>
                            {chemicalData.spectral.massSpectrum}
                          </Typography>
                        </Box>
                      )}
                    </Stack>
            </Box>
                )
              )}

                    {/* Additional Info */}
                    {!recognizedCompound && (
                      <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', fontStyle: 'italic' }}>
                          Draw a structure or search for a compound to see detailed information
                        </Typography>
                      </Box>
                    )}
                  </Stack>
                </Box>
              </Box>
                </>
              );
          })()}
        </Box>

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={4000}
          onClose={() => setSnackbarOpen(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert 
            onClose={() => setSnackbarOpen(false)} 
            severity={snackbarSeverity}
            sx={{ width: '100%' }}
          >
            {snackbarMessage}
          </Alert>
        </Snackbar>

        {/* 3D Viewer Dialog */}
        <Dialog
          open={show3DViewer}
          onClose={() => setShow3DViewer(false)}
          maxWidth="md"
          sx={{
            '& .MuiDialog-paper': {
              maxHeight: 'calc(100vh - 100px)',
              marginTop: '80px'
            }
          }}
        >
          <DialogTitle sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            pr: 1,
            py: 1.5,
            bgcolor: 'primary.main',
            color: 'white'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontSize: '0.9rem', fontWeight: 600, opacity: 0.9 }}>
                3D Structure Viewer
              </Typography>
              <Typography sx={{ fontSize: '0.75rem', opacity: 0.7 }}>•</Typography>
              <Typography 
                sx={{ 
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  flex: 1,
                  minWidth: 0
                }}
                title={recognizedCompound?.name}
              >
                {recognizedCompound?.name}
              </Typography>
            </Box>
            <IconButton
              onClick={() => setShow3DViewer(false)}
              size="small"
              sx={{ 
                color: 'white',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ height: '450px', width: '600px', p: 0 }}>
            {recognizedCompound && (
              <PubChem3DViewer cid={recognizedCompound.cid} />
            )}
          </DialogContent>
        </Dialog>
      </Box>
    </ThemeProvider>
  );
};

export default AppLayout;