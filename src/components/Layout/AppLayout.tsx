import React, { useState, useRef, useCallback, Suspense } from 'react';
import {
  Box,
  Typography,
  Stack,
  Grid,
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
  Menu,
  MenuItem,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CloseIcon from '@mui/icons-material/Close';
import DownloadIcon from '@mui/icons-material/Download';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import FormatAlignLeftIcon from '@mui/icons-material/FormatAlignLeft';
import FormatAlignRightIcon from '@mui/icons-material/FormatAlignRight';
import VerticalAlignTopIcon from '@mui/icons-material/VerticalAlignTop';
import VerticalAlignBottomIcon from '@mui/icons-material/VerticalAlignBottom';
import BiotechIcon from '@mui/icons-material/Biotech';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CenterFocusStrongIcon from '@mui/icons-material/CenterFocusStrong';
import { ThemeProvider } from '@mui/material/styles';
import theme from '../../theme';
import AppToolbar from '../Layout/Toolbar';
import ChemCanvas from '../ChemCanvas/ChemCanvas';
import ValidationPanel from '../ValidationPanel/ValidationPanel';
import PubChem3DViewer from '../PubChem3DViewer/PubChem3DViewer';
import { exportAsMol, exportAsSdf, exportAsSmiles } from '@lib/export/structureExport';
import { alignStructures, type AlignMode } from '@lib/alignStructures';
import { pasteImageIntoSketch } from '../../hooks/useImagePasteIntoSketch';
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
  const [showShortcutsDialog, setShowShortcutsDialog] = useState(false);
  const [exportMenuAnchor, setExportMenuAnchor] = useState<null | HTMLElement>(null);
  const [alignMenuAnchor, setAlignMenuAnchor] = useState<null | HTMLElement>(null);
  const [biotoolMenuAnchor, setBiotoolMenuAnchor] = useState<null | HTMLElement>(null);
  const [showReactionHelpDialog, setShowReactionHelpDialog] = useState(false);
  const [stereoInfo, setStereoInfo] = useState<{
    chiralCenters: number;
    unspecifiedCenters: number;
    inchiWithStereochemistry?: string;
  } | null>(null);
  
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
  const fullCanvasRef = useRef<StructureData | null>(null);
  const hasSelectionRef = useRef(false);

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

  // Copy all data as report-friendly text (not JSON)
  const handleCopyAll = useCallback(() => {
    if (!recognizedCompound) {
      setSnackbarMessage('No data to copy');
      setSnackbarSeverity('warning');
      setSnackbarOpen(true);
      return;
    }

    const fmt = (label: string, value: unknown): string => {
      if (value === undefined || value === null || value === '') return '';
      if (typeof value === 'object') return ''; // Skip complex objects for clean report
      return `${label}: ${value}\n`;
    };
    const section = (title: string, lines: string): string =>
      lines.trim() ? `\n${title}\n${'─'.repeat(40)}\n${lines}` : '';

    let report = '';

    // Header
    report += 'COMPOUND REPORT\n';
    report += '═══════════════\n\n';
    report += fmt('Compound Name', recognizedCompound.name);
    report += fmt('IUPAC Name', recognizedCompound.properties?.IUPACName);
    report += fmt('PubChem CID', recognizedCompound.cid);
    report += fmt('CAS Number', chemicalData.regulatory?.casNumber);

    // Molecular Properties
    const phys = chemicalData.physicalProperties;
    let molProps = '';
    molProps += fmt('Molecular Formula', phys?.molecularFormula);
    molProps += fmt('Molecular Weight', phys?.molecularWeight ? `${phys.molecularWeight} g/mol` : null);
    molProps += fmt('Exact Mass', phys?.exactMass);
    molProps += fmt('Melting Point', phys?.meltingPoint);
    molProps += fmt('Boiling Point', phys?.boilingPoint);
    molProps += fmt('Density', phys?.density);
    report += section('MOLECULAR PROPERTIES', molProps);

    // Identifiers
    const reg = chemicalData.regulatory;
    let ids = '';
    ids += fmt('SMILES', reg?.smiles || currentStructure?.smiles);
    ids += fmt('InChI', reg?.inchi);
    ids += fmt('InChI Key', reg?.inchiKey);
    report += section('IDENTIFIERS', ids);

    // Descriptors
    const desc = chemicalData.descriptors;
    let descLines = '';
    descLines += fmt('LogP (Lipophilicity)', desc?.logP);
    descLines += fmt('TPSA', desc?.tpsa ? `${desc.tpsa} Å²` : null);
    descLines += fmt('H-Bond Donors', desc?.hBondDonors);
    descLines += fmt('H-Bond Acceptors', desc?.hBondAcceptors);
    descLines += fmt('Rotatable Bonds', desc?.rotatableBonds);
    descLines += fmt('Complexity', desc?.complexity);
    descLines += fmt('Heavy Atom Count', desc?.heavyAtomCount);
    descLines += fmt('Formal Charge', desc?.formalCharge);
    report += section('CHEMICAL DESCRIPTORS', descLines);

    // Safety
    const safety = chemicalData.safetyData;
    let safetyLines = '';
    safetyLines += fmt('GHS Classification', safety?.ghsClassification);
    safetyLines += fmt('Hazard Class', safety?.hazardClass);
    safetyLines += fmt('Flash Point', safety?.flashPoint);
    safetyLines += fmt('LD50', safety?.ld50 || safety?.oralLd50);
    safetyLines += fmt('NFPA Rating', safety?.nfpaRating);
    safetyLines += fmt('Health Hazards', safety?.healthHazards);
    safetyLines += fmt('Fire Hazards', safety?.fireHazards);
    safetyLines += fmt('Flammability', safety?.flammability);
    safetyLines += fmt('Storage', safety?.storage);
    safetyLines += fmt('Disposal', safety?.disposal);
    report += section('SAFETY', safetyLines);

    // Spectral (if any)
    const spectral = chemicalData.spectral;
    let specLines = '';
    specLines += fmt('IR Spectrum', spectral?.irSpectrum);
    specLines += fmt('Mass Spectrum', spectral?.massSpectrum);
    report += section('SPECTRAL DATA', specLines);

    report += '\n─────────────────────────────\n';
    report += 'Generated by GL-ChemDraw\n';

    const text = report.trim();
    navigator.clipboard.writeText(text).then(() => {
      setSnackbarMessage('Report copied to clipboard!');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    }).catch((err) => {
      console.error('Failed to copy:', err);
      setSnackbarMessage('Failed to copy');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    });
  }, [recognizedCompound, chemicalData, currentStructure]);

  // Export structure (Issue #5: MOL, SDF, SMILES formats)
  const handleExport = useCallback(async (format: 'mol' | 'sdf' | 'smiles') => {
    setExportMenuAnchor(null);
    const struct = currentStructure;
    if (!struct) {
      setSnackbarMessage('No structure to export');
      setSnackbarSeverity('warning');
      setSnackbarOpen(true);
      return;
    }
    let result: { success: boolean; error?: string };
    if (format === 'mol') {
      result = await exportAsMol(struct.molfile, 'structure.mol');
    } else if (format === 'sdf') {
      result = await exportAsSdf(struct.molfile, 'structure.sdf');
    } else {
      result = await exportAsSmiles(struct.smiles, 'structure.smi');
    }
    if (result.success) {
      setSnackbarMessage(`Exported as ${format.toUpperCase()}`);
      setSnackbarSeverity('success');
    } else {
      setSnackbarMessage(result.error || 'Export failed');
      setSnackbarSeverity('error');
    }
    setSnackbarOpen(true);
  }, [currentStructure]);

  // Layout: fixes bond lengths & angles (Issue #3 - use Layout not Clean for geometry)
  const handleLayout = useCallback(async () => {
    if (!ketcherRef.current?.layout) return;
    try {
      await ketcherRef.current.layout();
      setSnackbarMessage('Layout applied (bond lengths/angles adjusted)');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (err) {
      console.error('[AppLayout] Layout failed:', err);
      setSnackbarMessage('Layout failed');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  }, []);

  // Load stereochemistry info when structure changes (RDKit)
  React.useEffect(() => {
    if (!currentStructure?.smiles || currentStructure.smiles.length < 2) {
      setStereoInfo(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { getStereochemistryInfo } = await import('@lib/chemistry/rdkit');
        const info = await getStereochemistryInfo(currentStructure.smiles);
        if (!cancelled && info) setStereoInfo(info);
        else if (!cancelled) setStereoInfo(null);
      } catch {
        if (!cancelled) setStereoInfo(null);
      }
    })();
    return () => { cancelled = true; };
  }, [currentStructure?.smiles]);

  // Biopolymer mode: switch Ketcher to Peptide/RNA/DNA entry mode (Ketcher 3.10)
  const handleBiopolymerMode = useCallback(async (mode: 'PEPTIDE' | 'RNA' | 'DNA') => {
    setBiotoolMenuAnchor(null);
    try {
      const { SequenceType } = await import('ketcher-core');
      const editor = ketcherRef.current?.editor;
      const evt = editor?.events?.changeSequenceTypeEnterMode;
      if (evt?.dispatch) {
        evt.dispatch(SequenceType[mode]);
        setSnackbarMessage(`Switched to ${mode} builder mode`);
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
      } else {
        setSnackbarMessage('Macromolecules mode not available');
        setSnackbarSeverity('warning');
        setSnackbarOpen(true);
      }
    } catch (err) {
      console.error('[AppLayout] Biopolymer mode failed:', err);
      setSnackbarMessage('Failed to switch mode');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  }, []);

  // Align descriptors (R1, R2 labels) - Issue #7 partial
  const handleAlignDescriptors = useCallback(() => {
    if (!ketcherRef.current?.editor?.alignDescriptors) return;
    try {
      ketcherRef.current.editor.alignDescriptors();
      setSnackbarMessage('R-group labels aligned');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (err) {
      console.error('[AppLayout] Align descriptors failed:', err);
      setSnackbarMessage('Align failed');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  }, []);

  // Paste from clipboard: image → OCSR recognition first, else image; or structure (MOL/SMILES)
  const handlePasteFromClipboard = useCallback(async () => {
    try {
      const result = await pasteImageIntoSketch(ketcherRef);
      if (result.success && result.type === 'structure') {
        setSnackbarMessage('Structure recognized from image');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
        return;
      }
      if (result.success && result.type === 'image') {
        setSnackbarMessage('Image pasted (recognition failed or not a structure)');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
        return;
      }
      // No image: try structure paste
      const text = await navigator.clipboard.readText();
      if (!text?.trim() || !ketcherRef.current?.setMolecule) {
        setSnackbarMessage('Paste failed – clipboard has no image or structure (MOL/SMILES)');
        setSnackbarSeverity('warning');
        setSnackbarOpen(true);
        return;
      }
      await ketcherRef.current.setMolecule(text.trim());
      setSnackbarMessage('Structure pasted from clipboard');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (err) {
      console.error('[AppLayout] Paste from clipboard failed:', err);
      setSnackbarMessage('Paste failed – try Ctrl+V or ensure clipboard has image or MOL/SMILES');
      setSnackbarSeverity('warning');
      setSnackbarOpen(true);
    }
  }, []);

  // Align structures (ChemDraw-style left/right/top/bottom) - Issue #7 full
  const handleAlignStructures = useCallback((mode: AlignMode) => {
    setAlignMenuAnchor(null);
    const editor = ketcherRef.current?.editor;
    if (!editor) return;
    const result = alignStructures(editor, mode);
    setSnackbarMessage(result.message);
    setSnackbarSeverity(result.success ? 'success' : 'warning');
    setSnackbarOpen(true);
  }, []);

  // Handle structure changes from the canvas (full canvas)
  const handleStructureChange = useCallback(async (molfile: string, smiles: string) => {
    console.log('[AppLayout] Structure changed:', { molfile, smiles });
    const structure: StructureData = { molfile, smiles };
    fullCanvasRef.current = structure;
    // If no selection active, full canvas is what we display
    if (!hasSelectionRef.current) {
      setCurrentStructure(structure);
      if (smiles) {
        await fetchComprehensiveData(smiles);
      } else {
        setRecognizedCompound(null);
        setChemicalData({
          physicalProperties: null,
          safetyData: null,
          descriptors: null,
          regulatory: null,
          spectral: null,
        });
      }
    }
  }, []);

  // Handle selection change (Issue #2: show chemical info for selected structure only)
  const handleSelectionChange = useCallback(async (molfile: string | null, smiles: string | null) => {
    if (molfile && smiles) {
      hasSelectionRef.current = true;
      setCurrentStructure({ molfile, smiles });
      await fetchComprehensiveData(smiles);
    } else {
      hasSelectionRef.current = false;
      // Fall back to full canvas when nothing selected
      const full = fullCanvasRef.current;
      if (full) {
        setCurrentStructure(full);
        if (full.smiles) {
          await fetchComprehensiveData(full.smiles);
        }
      } else {
        setCurrentStructure(null);
        setRecognizedCompound(null);
        setChemicalData({
          physicalProperties: null,
          safetyData: null,
          descriptors: null,
          regulatory: null,
          spectral: null,
        });
      }
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
          onShortcutsClick={() => setShowShortcutsDialog(true)}
          onFaqClick={() => window.open('/GL_Chemdraw_How_To_Use.html', '_blank', 'noopener,noreferrer')}
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
                    onSelectionChange={handleSelectionChange}
                    onError={(error) => console.error('[AppLayout] ChemCanvas error:', error)}
                    onKetcherInit={(instance) => (ketcherRef.current = instance)}
                    onCopyImageSuccess={() => {
                      setSnackbarMessage('Structure copied to clipboard!');
                      setSnackbarSeverity('success');
                      setSnackbarOpen(true);
                    }}
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
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      {isSearching && <CircularProgress size={16} />}
                      <Tooltip title="Paste image or structure from clipboard (PNG/screenshot or MOL/SMILES)">
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={handlePasteFromClipboard}
                          sx={{ fontSize: '0.75rem', py: 0.5, px: 1 }}
                        >
                          Paste
                        </Button>
                      </Tooltip>
                      <Tooltip title="Layout: fix bond lengths & angles (Ctrl+L). Clean only standardizes structure.">
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={handleLayout}
                          startIcon={<AccountTreeIcon />}
                          sx={{ fontSize: '0.75rem', py: 0.5, px: 1 }}
                        >
                          Layout
                        </Button>
                      </Tooltip>
                      <Tooltip title="Align structures or R-group labels">
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={(e) => setAlignMenuAnchor(e.currentTarget)}
                          startIcon={<FormatAlignLeftIcon />}
                          endIcon={<ExpandMoreIcon />}
                          sx={{ fontSize: '0.75rem', py: 0.5, px: 1 }}
                        >
                          Align
                        </Button>
                      </Tooltip>
                      <Menu
                        anchorEl={alignMenuAnchor}
                        open={!!alignMenuAnchor}
                        onClose={() => setAlignMenuAnchor(null)}
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                      >
                        <MenuItem onClick={handleAlignDescriptors}>
                          <FormatAlignLeftIcon sx={{ mr: 1, fontSize: 18 }} /> R-group labels
                        </MenuItem>
                        <MenuItem onClick={() => handleAlignStructures('left')}>
                          <FormatAlignLeftIcon sx={{ mr: 1, fontSize: 18 }} /> Align left
                        </MenuItem>
                        <MenuItem onClick={() => handleAlignStructures('right')}>
                          <FormatAlignRightIcon sx={{ mr: 1, fontSize: 18 }} /> Align right
                        </MenuItem>
                        <MenuItem onClick={() => handleAlignStructures('top')}>
                          <VerticalAlignTopIcon sx={{ mr: 1, fontSize: 18 }} /> Align top
                        </MenuItem>
                        <MenuItem onClick={() => handleAlignStructures('bottom')}>
                          <VerticalAlignBottomIcon sx={{ mr: 1, fontSize: 18 }} /> Align bottom
                        </MenuItem>
                      </Menu>
                      <Tooltip title="Export structure (MOL, SDF, SMILES)">
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={(e) => setExportMenuAnchor(e.currentTarget)}
                          disabled={!currentStructure?.molfile}
                          startIcon={<DownloadIcon />}
                          endIcon={<ExpandMoreIcon />}
                          sx={{ fontSize: '0.75rem', py: 0.5, px: 1 }}
                        >
                          Export
                        </Button>
                      </Tooltip>
                      <Menu
                        anchorEl={exportMenuAnchor}
                        open={!!exportMenuAnchor}
                        onClose={() => setExportMenuAnchor(null)}
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                      >
                        <MenuItem onClick={() => handleExport('mol')}>Save as MOL</MenuItem>
                        <MenuItem onClick={() => handleExport('sdf')}>Save as SDF</MenuItem>
                        <MenuItem onClick={() => handleExport('smiles')}>Save as SMILES</MenuItem>
                      </Menu>
                      <Tooltip title="Peptide, RNA, or DNA builder">
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={(e) => setBiotoolMenuAnchor(e.currentTarget)}
                          startIcon={<BiotechIcon />}
                          endIcon={<ExpandMoreIcon />}
                          sx={{ fontSize: '0.75rem', py: 0.5, px: 1 }}
                        >
                          Biopolymer
                        </Button>
                      </Tooltip>
                      <Menu
                        anchorEl={biotoolMenuAnchor}
                        open={!!biotoolMenuAnchor}
                        onClose={() => setBiotoolMenuAnchor(null)}
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                      >
                        <MenuItem onClick={() => handleBiopolymerMode('PEPTIDE')}>
                          <BiotechIcon sx={{ mr: 1, fontSize: 18 }} /> Peptide (Ctrl+Alt+P)
                        </MenuItem>
                        <MenuItem onClick={() => handleBiopolymerMode('RNA')}>
                          <BiotechIcon sx={{ mr: 1, fontSize: 18 }} /> RNA (Ctrl+Alt+R)
                        </MenuItem>
                        <MenuItem onClick={() => handleBiopolymerMode('DNA')}>
                          <BiotechIcon sx={{ mr: 1, fontSize: 18 }} /> DNA (Ctrl+Alt+D)
                        </MenuItem>
                      </Menu>
                      <Tooltip title="How to draw reaction arrows">
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => setShowReactionHelpDialog(true)}
                          startIcon={<ArrowForwardIcon />}
                          sx={{ fontSize: '0.75rem', py: 0.5, px: 1 }}
                        >
                          Reactions
                        </Button>
                      </Tooltip>
                      {recognizedCompound && !isSearching && (
                        <>
                          <Typography variant="caption" color="success.main" sx={{ fontWeight: 600 }}>
                            ✓ Identified
                          </Typography>
                          <Tooltip title="Copy report (formatted text)">
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

              {/* Stereochemistry (RDKit) */}
              {stereoInfo && (stereoInfo.chiralCenters > 0 || stereoInfo.unspecifiedCenters > 0 || stereoInfo.inchiWithStereochemistry) && (
                <Box sx={{ p: 1.25, bgcolor: 'background.default', borderRadius: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.75, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CenterFocusStrongIcon sx={{ fontSize: 18 }} /> Stereochemistry
                  </Typography>
                  <Stack spacing={0.5}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 0.75, borderRadius: 1, bgcolor: 'action.hover' }}>
                      <Typography variant="caption" color="text.secondary">Chiral centers:</Typography>
                      <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.75rem' }}>
                        {stereoInfo.chiralCenters} total
                      </Typography>
                    </Box>
                    {stereoInfo.unspecifiedCenters > 0 && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 0.75, borderRadius: 1 }}>
                        <Typography variant="caption" color="text.secondary">Unspecified (R/S):</Typography>
                        <Chip label={`${stereoInfo.unspecifiedCenters}`} size="small" color="warning" sx={{ fontSize: '0.7rem' }} />
                      </Box>
                    )}
                    {stereoInfo.inchiWithStereochemistry && (
                      <Tooltip title="InChI contains tetrahedral stereochemistry (/t)">
                        <Box 
                          onClick={() => handleCopy(stereoInfo!.inchiWithStereochemistry!, 'InChI (with stereo)')}
                          sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center', 
                            gap: 1,
                            p: 0.75,
                            borderRadius: 1,
                            cursor: 'pointer',
                            '&:hover': { bgcolor: 'action.hover' }
                          }}
                        >
                          <Typography variant="caption" color="text.secondary">InChI (stereo):</Typography>
                          <ContentCopyIcon sx={{ fontSize: 12, opacity: 0.5 }} />
                        </Box>
                      </Tooltip>
                    )}
                  </Stack>
                </Box>
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

        {/* Reaction Arrows Help Dialog */}
        <Dialog
          open={showReactionHelpDialog}
          onClose={() => setShowReactionHelpDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">Reaction Arrows & Schemes</Typography>
            <IconButton onClick={() => setShowReactionHelpDialog(false)} size="small">
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            <Stack spacing={2}>
              <Typography variant="body2">
                GL-Chemdraw supports full reaction drawing with arrows, conditions, and atom mapping.
              </Typography>
              <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 600 }}>How to draw reactions:</Typography>
              <Typography variant="body2" component="ol" sx={{ pl: 2, '& li': { mb: 1 } }}>
                <li>Draw your reactant structures on the left side of the canvas</li>
                <li>Draw your product structures on the right side</li>
                <li>Use the <strong>reaction arrow tool</strong> in the left toolbar (arrow icon)</li>
                <li>Click and drag between reactants and products to add an arrow</li>
                <li>Export as RXN file for reaction schemes</li>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Tip:</strong> Look for the arrow/reaction icon in the drawing tools toolbar on the left.
              </Typography>
            </Stack>
          </DialogContent>
        </Dialog>

        {/* Shortcuts / Help Dialog - Compact, no scroll */}
        <Dialog
          open={showShortcutsDialog}
          onClose={() => setShowShortcutsDialog(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              maxHeight: '85vh',
              borderRadius: 2,
            },
          }}
        >
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1.5 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>GL-Chemdraw Shortcuts</Typography>
            <IconButton onClick={() => setShowShortcutsDialog(false)} size="small">
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers sx={{ py: 1.5, px: 2, overflow: 'hidden' }}>
            <Grid container spacing={2} sx={{ maxHeight: 'calc(85vh - 120px)', overflow: 'hidden' }}>
              <Grid item xs={12} sm={6}>
                <Box sx={{ mb: 1.5 }}>
                  <Typography variant="caption" color="primary" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Copy & Paste</Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '2px 8px', mt: 0.5, alignItems: 'baseline' }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: 'monospace' }}>Ctrl+C</Typography>
                    <Typography variant="body2" color="text.secondary">Copy as image (Word, PPT)</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: 'monospace' }}>Ctrl+Shift+C</Typography>
                    <Typography variant="body2" color="text.secondary">Copy structure data</Typography>
                  </Box>
                </Box>
                <Box sx={{ mb: 1.5 }}>
                  <Typography variant="caption" color="primary" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Structure</Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '2px 8px', mt: 0.5, alignItems: 'baseline' }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: 'monospace' }}>Ctrl+L</Typography>
                    <Typography variant="body2" color="text.secondary">Layout (bond lengths & angles)</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: 'monospace' }}>Ctrl+Shift+L</Typography>
                    <Typography variant="body2" color="text.secondary">Clean (standardize)</Typography>
                  </Box>
                </Box>
                <Box>
                  <Typography variant="caption" color="primary" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Biopolymer</Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: '2px 8px', mt: 0.5, alignItems: 'baseline' }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: 'monospace' }}>Ctrl+Alt+P</Typography>
                    <Typography variant="body2" color="text.secondary">Peptide</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: 'monospace' }}>Ctrl+Alt+R</Typography>
                    <Typography variant="body2" color="text.secondary">RNA</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: 'monospace' }}>Ctrl+Alt+D</Typography>
                    <Typography variant="body2" color="text.secondary">DNA</Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ mb: 1.5 }}>
                  <Typography variant="caption" color="primary" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Panel Buttons</Typography>
                  <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                    <Typography variant="body2"><strong>Paste</strong> — Paste from clipboard</Typography>
                    <Typography variant="body2"><strong>Layout</strong> — Fix bond lengths & angles</Typography>
                    <Typography variant="body2"><strong>Align</strong> — R-groups or align selected</Typography>
                    <Typography variant="body2"><strong>Export</strong> — MOL, SDF, SMILES</Typography>
                    <Typography variant="body2"><strong>Biopolymer</strong> — Peptide/RNA/DNA mode</Typography>
                    <Typography variant="body2"><strong>Reactions</strong> — Draw reaction arrows</Typography>
                  </Stack>
                </Box>
                <Box>
                  <Typography variant="caption" color="primary" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Selection</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontStyle: 'italic' }}>
                    Select structure → chemical info. Click canvas → full info.
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </DialogContent>
        </Dialog>
      </Box>
    </ThemeProvider>
  );
};

export default AppLayout;