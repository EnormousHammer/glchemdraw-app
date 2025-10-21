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
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { ThemeProvider } from '@mui/material/styles';
import theme from '../../theme';
import AppToolbar from '../Layout/Toolbar';
import ChemCanvas from '../ChemCanvas/ChemCanvas';
import ValidationPanel from '../ValidationPanel/ValidationPanel';
import { LazyNMRViewer } from '../LazyComponents';
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
  
  // View mode state - switch between structure drawing and NMR analyzer
  const [activeView, setActiveView] = useState<'structure' | 'nmr'>('structure');
  
  // Debug view changes
  React.useEffect(() => {
    console.log('[AppLayout] View changed to:', activeView);
    console.log('[AppLayout] Current activeView state:', activeView);
  }, [activeView]);
  
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
          console.log('[AppLayout] Available properties:', Object.keys(properties));
          console.log('[AppLayout] CanonicalSMILES:', properties.CanonicalSMILES);
          console.log('[AppLayout] IsomericSMILES:', properties.IsomericSMILES);
          console.log('[AppLayout] SMILES:', properties.SMILES);
          
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
          const smilesToUse = properties.CanonicalSMILES || properties.IsomericSMILES || properties.SMILES;
          console.log('[AppLayout] SMILES to use:', smilesToUse);
          
          if (smilesToUse && ketcherRef.current) {
            try {
              console.log('[AppLayout] Attempting to load structure into canvas...');
              console.log('[AppLayout] Using SMILES:', smilesToUse);
              console.log('[AppLayout] Ketcher ref:', ketcherRef.current);
              console.log('[AppLayout] Available Ketcher methods:', Object.getOwnPropertyNames(ketcherRef.current));
              
              const { convertSmilesToMol } = await import('../../lib/chemistry/smilesToMol');
              const molContent = await convertSmilesToMol(smilesToUse);
              console.log('[AppLayout] MOL content:', molContent ? 'Generated' : 'Failed');
              
              if (molContent) {
                // Wait a bit for Ketcher to be fully ready
                await new Promise(resolve => setTimeout(resolve, 500));
                
                // Test with a simple structure first
                console.log('[AppLayout] Testing with simple benzene structure first...');
                try {
                  const simpleBenzene = `
  Mrv2014 12232412342D          

  6  6  0  0  0  0            999 V2000
    0.0000    0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    1.2124    0.7000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    2.4248    0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    2.4248   -1.4000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    1.2124   -2.1000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    0.0000   -1.4000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
  1  2  2  0  0  0  0
  2  3  1  0  0  0  0
  3  4  2  0  0  0  0
  4  5  1  0  0  0  0
  5  6  2  0  0  0  0
  6  1  1  0  0  0  0
M  END
`;
                  await ketcherRef.current.setMolecule(simpleBenzene);
                  console.log('[AppLayout] ✅ Simple benzene test successful - Ketcher is working!');
                  
                  // Now try the actual structure
                  setTimeout(async () => {
                    try {
                      console.log('[AppLayout] Now loading actual structure...');
                      console.log('[AppLayout] MOL content preview:', molContent.substring(0, 200));
                      await ketcherRef.current.setMolecule(molContent);
                      console.log('[AppLayout] ✅ Structure loaded successfully!');
                      
                      // Force redraw
                      if (ketcherRef.current && ketcherRef.current.editor) {
                        ketcherRef.current.editor.render();
                        console.log('[AppLayout] Forced redraw completed');
                      }
                    } catch (e) {
                      console.error('[AppLayout] ❌ Failed to load structure:', e);
                      console.log('[AppLayout] MOL content that failed:', molContent);
                    }
                  }, 1000);
                  
                } catch (e) {
                  console.error('[AppLayout] ❌ Simple benzene test failed:', e);
                }
              } else {
                console.log('[AppLayout] ❌ Failed to generate MOL content from SMILES');
              }
            } catch (error) {
              console.error('[AppLayout] ❌ Error loading structure into canvas:', error);
            }
          } else {
            console.log('[AppLayout] Cannot load structure - missing SMILES or Ketcher ref');
            console.log('[AppLayout] CanonicalSMILES available:', !!properties.CanonicalSMILES);
            console.log('[AppLayout] IsomericSMILES available:', !!properties.IsomericSMILES);
            console.log('[AppLayout] SMILES available:', !!properties.SMILES);
            console.log('[AppLayout] Ketcher ref available:', !!ketcherRef.current);
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
          onSaveAs={() => {}}
          onImport={() => {}}
          onExport={() => {}}
          onPrint={() => {}}
          onExit={() => {}}
          onUndo={() => {}}
          onRedo={() => {}}
          onCut={() => {}}
          onCopy={() => {}}
          onPaste={() => {}}
          onClear={handleClear}
          onFind={() => {}}
          onSelectAll={() => {}}
          onZoomIn={() => {}}
          onZoomOut={() => {}}
          onFullscreen={() => {}}
          onToggleSidebar={() => {}}
          onToggleTheme={() => {}}
          onToggleVisibility={() => {}}
          onBatchImport={() => {}}
          onBatchExport={() => {}}
          onNameToStructure={() => {}}
          onAdvancedExport={() => {}}
          onReactionTemplates={() => {}}
          on3DViewer={() => {}}
          onNMRAnalyzer={() => {}}
          onAIIntegration={() => {}}
          onAdvancedAnalytics={() => {}}
          onSearchByName={handleSearchByName}
          onHelp={() => {}}
          onAbout={() => {}}
          onShortcuts={() => {}}
          onBugReport={() => {}}
          onCheckUpdates={() => {}}
          onFeedback={() => {}}
          activeView={activeView}
          onViewChange={setActiveView}
        />

        {/* Main Content - Conditional View */}
        <Box sx={{ 
          flex: 1,
          display: 'flex', 
          marginTop: '56px', // Push content below fixed header
          overflow: 'hidden',
          width: '100%'
        }}>
          {(() => {
            console.log('[AppLayout] Rendering view:', activeView);
            if (activeView === 'structure') {
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
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.75, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 1 }}>
                    🧪 Compound
                  </Typography>
                  <Stack spacing={0.5}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                      <Typography variant="caption" color="text.secondary">Name:</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.75rem' }}>
                          {recognizedCompound.name}
                        </Typography>
                        <Tooltip title="Copy Name">
                          <IconButton 
                            size="small" 
                            onClick={() => handleCopy(recognizedCompound.name, 'Name')}
                            sx={{ p: 0.25 }}
                          >
                            <ContentCopyIcon sx={{ fontSize: 12 }} />
                          </IconButton>
                        </Tooltip>
            </Box>
          </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                      <Typography variant="caption" color="text.secondary">IUPAC Name:</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.75rem' }}>
                          {recognizedCompound.properties?.IUPACName || 'N/A'}
                        </Typography>
                        {recognizedCompound.properties?.IUPACName && (
                          <Tooltip title="Copy IUPAC Name">
                            <IconButton 
                              size="small" 
                              onClick={() => handleCopy(recognizedCompound.properties.IUPACName, 'IUPAC Name')}
                              sx={{ p: 0.25 }}
                            >
                              <ContentCopyIcon sx={{ fontSize: 12 }} />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                      <Typography variant="caption" color="text.secondary">PubChem CID:</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.75rem' }}>
                          {recognizedCompound.cid}
                        </Typography>
                        <Tooltip title="Copy CID">
                          <IconButton 
                            size="small" 
                            onClick={() => handleCopy(String(recognizedCompound.cid), 'CID')}
                            sx={{ p: 0.25 }}
                          >
                            <ContentCopyIcon sx={{ fontSize: 12 }} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                      <Typography variant="caption" color="text.secondary">CAS Number:</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.75rem' }}>
                          {chemicalData.regulatory?.casNumber || 'N/A'}
              </Typography>
                        {chemicalData.regulatory?.casNumber && (
                          <Tooltip title="Copy CAS Number">
                            <IconButton 
                              size="small" 
                              onClick={() => handleCopy(chemicalData.regulatory.casNumber, 'CAS Number')}
                              sx={{ p: 0.25 }}
                            >
                              <ContentCopyIcon sx={{ fontSize: 12 }} />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </Box>
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
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                          <Typography variant="caption" color="text.secondary">Molecular Weight:</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.75rem' }}>
                              {typeof chemicalData.physicalProperties.molecularWeight === 'number' 
                                ? chemicalData.physicalProperties.molecularWeight.toFixed(2)
                                : parseFloat(chemicalData.physicalProperties.molecularWeight).toFixed(2)} g/mol
                            </Typography>
                            <Tooltip title="Copy Molecular Weight">
                              <IconButton 
                                size="small" 
                                onClick={() => handleCopy(
                                  `${typeof chemicalData.physicalProperties.molecularWeight === 'number' 
                                    ? chemicalData.physicalProperties.molecularWeight.toFixed(2)
                                    : parseFloat(chemicalData.physicalProperties.molecularWeight).toFixed(2)} g/mol`, 
                                  'Molecular Weight'
                                )}
                                sx={{ p: 0.25 }}
                              >
                                <ContentCopyIcon sx={{ fontSize: 12 }} />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </Box>
                      )}
                      {chemicalData.physicalProperties.molecularFormula && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                          <Typography variant="caption" color="text.secondary">Molecular Formula:</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Typography variant="caption" sx={{ fontWeight: 500, fontFamily: 'monospace', fontSize: '0.75rem' }}>
                              {chemicalData.physicalProperties.molecularFormula}
                            </Typography>
                            <Tooltip title="Copy Molecular Formula">
                              <IconButton 
                                size="small" 
                                onClick={() => handleCopy(chemicalData.physicalProperties.molecularFormula, 'Molecular Formula')}
                                sx={{ p: 0.25 }}
                              >
                                <ContentCopyIcon sx={{ fontSize: 12 }} />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </Box>
                      )}
                      {chemicalData.physicalProperties.exactMass && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                          <Typography variant="caption" color="text.secondary">Exact Mass:</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.75rem' }}>
                              {typeof chemicalData.physicalProperties.exactMass === 'number' 
                                ? chemicalData.physicalProperties.exactMass.toFixed(4)
                                : parseFloat(chemicalData.physicalProperties.exactMass).toFixed(4)} Da
                            </Typography>
                            <Tooltip title="Copy Exact Mass">
                              <IconButton 
                                size="small" 
                                onClick={() => handleCopy(
                                  `${typeof chemicalData.physicalProperties.exactMass === 'number' 
                                    ? chemicalData.physicalProperties.exactMass.toFixed(4)
                                    : parseFloat(chemicalData.physicalProperties.exactMass).toFixed(4)} Da`,
                                  'Exact Mass'
                                )}
                                sx={{ p: 0.25 }}
                              >
                                <ContentCopyIcon sx={{ fontSize: 12 }} />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </Box>
                      )}
                      {chemicalData.physicalProperties.monoIsotopicMass && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                          <Typography variant="caption" color="text.secondary">Monoisotopic Mass:</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.75rem' }}>
                              {typeof chemicalData.physicalProperties.monoIsotopicMass === 'number' 
                                ? chemicalData.physicalProperties.monoIsotopicMass.toFixed(4)
                                : parseFloat(chemicalData.physicalProperties.monoIsotopicMass).toFixed(4)} Da
                            </Typography>
                            <Tooltip title="Copy Monoisotopic Mass">
                              <IconButton 
                                size="small" 
                                onClick={() => handleCopy(
                                  `${typeof chemicalData.physicalProperties.monoIsotopicMass === 'number' 
                                    ? chemicalData.physicalProperties.monoIsotopicMass.toFixed(4)
                                    : parseFloat(chemicalData.physicalProperties.monoIsotopicMass).toFixed(4)} Da`,
                                  'Monoisotopic Mass'
                                )}
                                sx={{ p: 0.25 }}
                              >
                                <ContentCopyIcon sx={{ fontSize: 12 }} />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </Box>
                      )}
                      {chemicalData.physicalProperties.density && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                          <Typography variant="caption" color="text.secondary">Density:</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.75rem' }}>
                              {chemicalData.physicalProperties.density}
                            </Typography>
                            <Tooltip title="Copy Density">
                              <IconButton 
                                size="small" 
                                onClick={() => handleCopy(chemicalData.physicalProperties.density, 'Density')}
                                sx={{ p: 0.25 }}
                              >
                                <ContentCopyIcon sx={{ fontSize: 12 }} />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </Box>
                      )}
                      {chemicalData.physicalProperties.meltingPoint && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                          <Typography variant="caption" color="text.secondary">Melting Point:</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.75rem' }}>
                              {chemicalData.physicalProperties.meltingPoint}
                            </Typography>
                            <Tooltip title="Copy Melting Point">
                              <IconButton 
                                size="small" 
                                onClick={() => handleCopy(chemicalData.physicalProperties.meltingPoint, 'Melting Point')}
                                sx={{ p: 0.25 }}
                              >
                                <ContentCopyIcon sx={{ fontSize: 12 }} />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </Box>
                      )}
                      {chemicalData.physicalProperties.boilingPoint && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                          <Typography variant="caption" color="text.secondary">Boiling Point:</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.75rem' }}>
                              {chemicalData.physicalProperties.boilingPoint}
                            </Typography>
                            <Tooltip title="Copy Boiling Point">
                              <IconButton 
                                size="small" 
                                onClick={() => handleCopy(chemicalData.physicalProperties.boilingPoint, 'Boiling Point')}
                                sx={{ p: 0.25 }}
                              >
                                <ContentCopyIcon sx={{ fontSize: 12 }} />
                              </IconButton>
                            </Tooltip>
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
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                          <Typography variant="caption" color="text.secondary">LogP (Lipophilicity):</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.75rem' }}>
                              {typeof chemicalData.descriptors.logP === 'number' 
                                ? chemicalData.descriptors.logP.toFixed(2)
                                : parseFloat(chemicalData.descriptors.logP).toFixed(2)}
                            </Typography>
                            <Tooltip title="Copy LogP">
                              <IconButton 
                                size="small" 
                                onClick={() => handleCopy(
                                  String(typeof chemicalData.descriptors.logP === 'number' 
                                    ? chemicalData.descriptors.logP.toFixed(2)
                                    : parseFloat(chemicalData.descriptors.logP).toFixed(2)),
                                  'LogP'
                                )}
                                sx={{ p: 0.25 }}
                              >
                                <ContentCopyIcon sx={{ fontSize: 12 }} />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </Box>
                      )}
                      {chemicalData.descriptors.tpsa !== undefined && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                          <Typography variant="caption" color="text.secondary">TPSA (Polar Surface Area):</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.75rem' }}>
                              {typeof chemicalData.descriptors.tpsa === 'number' 
                                ? chemicalData.descriptors.tpsa.toFixed(2)
                                : parseFloat(chemicalData.descriptors.tpsa).toFixed(2)} Å²
                            </Typography>
                            <Tooltip title="Copy TPSA">
                              <IconButton 
                                size="small" 
                                onClick={() => handleCopy(
                                  `${typeof chemicalData.descriptors.tpsa === 'number' 
                                    ? chemicalData.descriptors.tpsa.toFixed(2)
                                    : parseFloat(chemicalData.descriptors.tpsa).toFixed(2)} Å²`,
                                  'TPSA'
                                )}
                                sx={{ p: 0.25 }}
                              >
                                <ContentCopyIcon sx={{ fontSize: 12 }} />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </Box>
                      )}
                      {chemicalData.descriptors.hBondDonors !== undefined && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                          <Typography variant="caption" color="text.secondary">H-Bond Donors:</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.75rem' }}>
                              {chemicalData.descriptors.hBondDonors}
                            </Typography>
                            <Tooltip title="Copy H-Bond Donors">
                              <IconButton 
                                size="small" 
                                onClick={() => handleCopy(String(chemicalData.descriptors.hBondDonors), 'H-Bond Donors')}
                                sx={{ p: 0.25 }}
                              >
                                <ContentCopyIcon sx={{ fontSize: 12 }} />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </Box>
                      )}
                      {chemicalData.descriptors.hBondAcceptors !== undefined && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                          <Typography variant="caption" color="text.secondary">H-Bond Acceptors:</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.75rem' }}>
                              {chemicalData.descriptors.hBondAcceptors}
                            </Typography>
                            <Tooltip title="Copy H-Bond Acceptors">
                              <IconButton 
                                size="small" 
                                onClick={() => handleCopy(String(chemicalData.descriptors.hBondAcceptors), 'H-Bond Acceptors')}
                                sx={{ p: 0.25 }}
                              >
                                <ContentCopyIcon sx={{ fontSize: 12 }} />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </Box>
                      )}
                      {chemicalData.descriptors.rotatableBonds !== undefined && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                          <Typography variant="caption" color="text.secondary">Rotatable Bonds:</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.75rem' }}>
                              {chemicalData.descriptors.rotatableBonds}
                            </Typography>
                            <Tooltip title="Copy Rotatable Bonds">
                              <IconButton 
                                size="small" 
                                onClick={() => handleCopy(String(chemicalData.descriptors.rotatableBonds), 'Rotatable Bonds')}
                                sx={{ p: 0.25 }}
                              >
                                <ContentCopyIcon sx={{ fontSize: 12 }} />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </Box>
                      )}
                      {chemicalData.descriptors.complexity !== undefined && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                          <Typography variant="caption" color="text.secondary">Complexity:</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.75rem' }}>
                              {typeof chemicalData.descriptors.complexity === 'number' 
                                ? chemicalData.descriptors.complexity.toFixed(1)
                                : parseFloat(chemicalData.descriptors.complexity).toFixed(1)}
                            </Typography>
                            <Tooltip title="Copy Complexity">
                              <IconButton 
                                size="small" 
                                onClick={() => handleCopy(
                                  String(typeof chemicalData.descriptors.complexity === 'number' 
                                    ? chemicalData.descriptors.complexity.toFixed(1)
                                    : parseFloat(chemicalData.descriptors.complexity).toFixed(1)),
                                  'Complexity'
                                )}
                                sx={{ p: 0.25 }}
                              >
                                <ContentCopyIcon sx={{ fontSize: 12 }} />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </Box>
                      )}
                      {chemicalData.descriptors.heavyAtomCount !== undefined && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                          <Typography variant="caption" color="text.secondary">Heavy Atom Count:</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.75rem' }}>
                              {chemicalData.descriptors.heavyAtomCount}
                            </Typography>
                            <Tooltip title="Copy Heavy Atom Count">
                              <IconButton 
                                size="small" 
                                onClick={() => handleCopy(String(chemicalData.descriptors.heavyAtomCount), 'Heavy Atom Count')}
                                sx={{ p: 0.25 }}
                              >
                                <ContentCopyIcon sx={{ fontSize: 12 }} />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </Box>
                      )}
                      {chemicalData.descriptors.formalCharge !== undefined && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                          <Typography variant="caption" color="text.secondary">Formal Charge:</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.75rem' }}>
                              {chemicalData.descriptors.formalCharge}
                            </Typography>
                            <Tooltip title="Copy Formal Charge">
                              <IconButton 
                                size="small" 
                                onClick={() => handleCopy(String(chemicalData.descriptors.formalCharge), 'Formal Charge')}
                                sx={{ p: 0.25 }}
                              >
                                <ContentCopyIcon sx={{ fontSize: 12 }} />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </Box>
                      )}
                    </Stack>
                  </Box>
                )
              )}

              {/* Regulatory Information */}
              {chemicalData.regulatory && (
                (chemicalData.regulatory.casNumber || 
                 chemicalData.regulatory.pubchemCID || 
                 chemicalData.regulatory.iupacName || 
                 chemicalData.regulatory.inchiKey || 
                 chemicalData.regulatory.smiles || 
                 chemicalData.regulatory.inchi) && (
                  <Box sx={{ p: 1.25, bgcolor: 'background.default', borderRadius: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.75, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 1 }}>
                      📋 Regulatory Information
                    </Typography>
                    <Stack spacing={0.5}>
                      {chemicalData.regulatory.casNumber && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="caption" color="text.secondary">CAS Number:</Typography>
                          <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.75rem' }}>
                            {chemicalData.regulatory.casNumber}
                          </Typography>
                        </Box>
                      )}
                      {chemicalData.regulatory.pubchemCID && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="caption" color="text.secondary">PubChem CID:</Typography>
                          <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.75rem' }}>
                            {chemicalData.regulatory.pubchemCID}
                          </Typography>
                        </Box>
                      )}
                      {chemicalData.regulatory.iupacName && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="caption" color="text.secondary">IUPAC Name:</Typography>
                          <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.75rem' }}>
                            {chemicalData.regulatory.iupacName}
                          </Typography>
                        </Box>
                      )}
                      {chemicalData.regulatory.inchiKey && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                          <Typography variant="caption" color="text.secondary">InChI Key:</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Typography variant="caption" sx={{ fontWeight: 500, fontFamily: 'monospace', fontSize: '0.75rem' }}>
                              {chemicalData.regulatory.inchiKey}
                            </Typography>
                            <Tooltip title="Copy InChI Key">
                              <IconButton 
                                size="small" 
                                onClick={() => handleCopy(chemicalData.regulatory.inchiKey, 'InChI Key')}
                                sx={{ p: 0.25 }}
                              >
                                <ContentCopyIcon sx={{ fontSize: 12 }} />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </Box>
                      )}
                      {chemicalData.regulatory.smiles && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                          <Typography variant="caption" color="text.secondary">SMILES:</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Typography variant="caption" sx={{ fontWeight: 500, fontFamily: 'monospace', fontSize: '0.75rem' }}>
                              {chemicalData.regulatory.smiles}
                            </Typography>
                            <Tooltip title="Copy SMILES">
                              <IconButton 
                                size="small" 
                                onClick={() => handleCopy(chemicalData.regulatory.smiles, 'SMILES')}
                                sx={{ p: 0.25 }}
                              >
                                <ContentCopyIcon sx={{ fontSize: 12 }} />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </Box>
                      )}
                      {chemicalData.regulatory.inchi && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="caption" color="text.secondary">InChI:</Typography>
                          <Typography variant="caption" sx={{ fontWeight: 500, fontFamily: 'monospace', fontSize: '0.75rem' }}>
                            {chemicalData.regulatory.inchi}
                </Typography>
                        </Box>
                      )}
                    </Stack>
                  </Box>
                )
              )}

              {/* Spectral Data */}
              {chemicalData.spectral && (
                (chemicalData.spectral.nmrAvailable || 
                 chemicalData.spectral.irSpectrum || 
                 chemicalData.spectral.massSpectrum) && (
                  <Box sx={{ p: 1.25, bgcolor: 'background.default', borderRadius: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.75, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 1 }}>
                      📊 Spectral Data
                    </Typography>
                    <Stack spacing={0.5}>
                      {chemicalData.spectral.nmrAvailable && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="caption" color="text.secondary">NMR Available:</Typography>
                          <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.75rem' }}>
                            {chemicalData.spectral.nmrAvailable}
                          </Typography>
                        </Box>
                      )}
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
            } else {
              console.log('[AppLayout] Rendering NMR Analyzer mode');
              return (
                <Suspense 
                  fallback={
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      height: '100%',
                      width: '100%',
                      flexDirection: 'column',
                      gap: 3,
                      bgcolor: 'background.default'
                    }}>
                      <Box sx={{ position: 'relative' }}>
                        <CircularProgress 
                          size={60} 
                          thickness={4}
                          sx={{ color: 'primary.main' }}
                        />
                        <Box sx={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          fontSize: '1.5rem'
                        }}>
                          📊
                        </Box>
                      </Box>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main', mb: 0.5 }}>
                          Loading NMR Analyzer
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Preparing spectroscopy tools...
                        </Typography>
                      </Box>
                    </Box>
                  }
                >
                  <LazyNMRViewer />
                </Suspense>
              );
            }
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
      </Box>
    </ThemeProvider>
  );
};

export default AppLayout;