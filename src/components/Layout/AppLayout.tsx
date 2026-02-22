import React, { useState, useRef, useCallback, useEffect, Suspense } from 'react';
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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
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
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import PsychologyIcon from '@mui/icons-material/Psychology';
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
import { NMRPredictionDialog } from '../NMRPrediction';
import { BiopolymerSequenceDialog } from '../BiopolymerSequence';
import { FunctionalGroupDialog } from '../FunctionalGroup/FunctionalGroupDialog';
import { TemplateLibraryDialog } from '../TemplateLibrary';
import { AdvancedExport } from '../AdvancedExport';
import { AIIntegration } from '../AIIntegration';
import { performAdvancedExport, type AdvancedExportOptions, type AdvancedExportResult } from '@lib/export/advancedExport';
import { peptideToHelm, dnaToHelm, rnaToHelm } from '../../lib/chemistry/helmFormat';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import { useAIContext } from '@/contexts/AIContext';

/** Styled keyboard key for shortcuts dialog */
const KbdKey: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Box
    component="kbd"
    sx={(theme) => ({
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 28,
      px: 1,
      py: 0.5,
      fontFamily: 'monospace',
      fontSize: '0.75rem',
      fontWeight: 600,
      color: theme.palette.mode === 'dark' ? 'grey.100' : 'text.primary',
      backgroundColor: theme.palette.mode === 'dark' ? 'grey.800' : 'grey.100',
      border: '1px solid',
      borderColor: theme.palette.mode === 'dark' ? 'grey.600' : 'grey.300',
      borderRadius: 1,
      boxShadow: theme.palette.mode === 'dark' ? '0 1px 0 0 rgba(0,0,0,0.3)' : '0 1px 0 0 rgba(0,0,0,0.08)',
    })}
  >
    {children}
  </Box>
);

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
  const [showNMRPredictionDialog, setShowNMRPredictionDialog] = useState(false);
  const [showBiopolymerSequenceDialog, setShowBiopolymerSequenceDialog] = useState(false);
  const [showFunctionalGroupDialog, setShowFunctionalGroupDialog] = useState(false);
  const [showTemplateLibraryDialog, setShowTemplateLibraryDialog] = useState(false);
  const [showAdvancedExportDialog, setShowAdvancedExportDialog] = useState(false);
  const [biopolymerDialogMode, setBiopolymerDialogMode] = useState<'PEPTIDE' | 'RNA' | 'DNA'>('PEPTIDE');
  const [aiSectionExpanded, setAiSectionExpanded] = useState(false);
  const [stereoInfo, setStereoInfo] = useState<{
    chiralCenters: number;
    unspecifiedCenters: number;
    inchiWithStereochemistry?: string;
  } | null>(null);
  const [aiIupacName, setAiIupacName] = useState<string | null>(null);
  const [aiIupacLoading, setAiIupacLoading] = useState(false);
  const [aiProperties, setAiProperties] = useState<{
    meltingPoint?: string;
    boilingPoint?: string;
    solubility?: string;
    logP?: number;
    tpsa?: number;
    drugLikeness?: string;
  } | null>(null);
  const [aiPropertiesLoading, setAiPropertiesLoading] = useState(false);
  const [aiSafetySummary, setAiSafetySummary] = useState<string | null>(null);
  const [aiSafetyLoading, setAiSafetyLoading] = useState(false);
  const [chemicalInfoWidth, setChemicalInfoWidth] = useState(() => {
    const saved = localStorage.getItem('glchemdraw_chemical_info_width');
    const n = saved ? parseInt(saved, 10) : 360;
    return Number.isFinite(n) && n >= 200 ? n : 360;
  });
  const [isResizingSidebar, setIsResizingSidebar] = useState(false);
  const resizeStartRef = useRef<{ x: number; width: number } | null>(null);
  const { context: aiContext } = useAIContext();

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
  const chemicalInfoScrollRef = useRef<HTMLDivElement>(null);
  const aiSectionRef = useRef<HTMLDivElement>(null);

  // Resize Chemical Info sidebar
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizingSidebar(true);
    resizeStartRef.current = { x: e.clientX, width: chemicalInfoWidth };
  }, [chemicalInfoWidth]);

  useEffect(() => {
    if (!isResizingSidebar) return;
    const handleMove = (e: MouseEvent) => {
      const start = resizeStartRef.current;
      if (!start) return;
      // Inverted: drag handle left = sidebar wider, drag right = narrower (fixes opposite behavior)
      const delta = start.x - e.clientX;
      const newWidth = Math.max(200, start.width + delta);
      setChemicalInfoWidth(newWidth);
      resizeStartRef.current = { x: e.clientX, width: newWidth };
    };
    const handleUp = () => {
      const finalWidth = resizeStartRef.current?.width ?? 360;
      setIsResizingSidebar(false);
      resizeStartRef.current = null;
      localStorage.setItem('glchemdraw_chemical_info_width', String(finalWidth));
    };
    document.addEventListener('mousemove', handleMove, { capture: true });
    document.addEventListener('mouseup', handleUp, { capture: true });
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    return () => {
      document.removeEventListener('mousemove', handleMove, { capture: true });
      document.removeEventListener('mouseup', handleUp, { capture: true });
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizingSidebar]);

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

  const handleAdvancedExport = useCallback(async (options: AdvancedExportOptions): Promise<AdvancedExportResult> => {
    const ketcher = ketcherRef.current;
    const struct = currentStructure;
    if (!struct) throw new Error('No structure to export');
    const result = await performAdvancedExport(ketcher, options, {
      molfile: struct.molfile,
      smiles: struct.smiles,
      name: recognizedCompound?.name || recognizedCompound?.properties?.IUPACName,
    });
    if (!result.success) throw new Error(result.error || 'Export failed');
    if (!result.downloadBlob) {
      setShowAdvancedExportDialog(false);
      setSnackbarMessage(`Exported as ${options.format}`);
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    }
    return result;
  }, [currentStructure, recognizedCompound]);

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

  // Issue #3: Ctrl+Shift+L → Layout (fix geometry), not Ketcher's Clean (which only standardizes)
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!(e.ctrlKey && e.shiftKey && e.key?.toLowerCase() === 'l')) return;
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
      const ketcher = ketcherRef.current;
      if (!ketcher?.layout) return;
      e.preventDefault();
      e.stopPropagation();
      ketcher.layout().then(() => {
        setSnackbarMessage('Layout applied (bond lengths/angles adjusted)');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
      }).catch((err: Error) => {
        console.error('[AppLayout] Layout failed:', err);
        setSnackbarMessage('Layout failed');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      });
    };
    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
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

  const handleAddFunctionalGroup = useCallback(async (smiles: string) => {
    const ketcher = ketcherRef.current;
    if (!ketcher?.addFragment) {
      if (ketcher?.setMolecule) {
        await ketcher.setMolecule(smiles);
      } else {
        throw new Error('Editor not ready');
      }
    } else {
      await ketcher.addFragment(smiles);
    }
    setSnackbarMessage('Functional group added — connect it to your structure');
    setSnackbarSeverity('success');
    setSnackbarOpen(true);
  }, []);

  // Biopolymer: open sequence input dialog (Ketcher changeSequenceTypeEnterMode often unavailable)
  const handleBiopolymerOpen = useCallback((mode: 'PEPTIDE' | 'RNA' | 'DNA') => {
    setBiotoolMenuAnchor(null);
    setBiopolymerDialogMode(mode);
    setShowBiopolymerSequenceDialog(true);
  }, []);

  const handleBiopolymerSequenceSubmit = useCallback(async (
    sequence: string,
    mode: 'PEPTIDE' | 'RNA' | 'DNA'
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const helm = mode === 'PEPTIDE' ? peptideToHelm(sequence)
        : mode === 'DNA' ? dnaToHelm(sequence)
        : rnaToHelm(sequence);
      if (!helm) {
        return { success: false, error: 'Invalid sequence' };
      }
      const ketcher = ketcherRef.current;
      if (!ketcher?.setMolecule) {
        return { success: false, error: 'Editor not ready' };
      }
      await ketcher.setMolecule(helm);
      setSnackbarMessage(`${mode} structure created from sequence`);
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      return { success: true };
    } catch (err) {
      console.error('[AppLayout] Biopolymer HELM import failed:', err);
      const msg = err instanceof Error ? err.message : 'HELM import failed';
      return { success: false, error: `${msg}. Try pasting MOL/SMILES from an external converter.` };
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
        setSnackbarMessage('Structure pasted');
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
      // Fallback: try reading text (Tauri or web)
      let text: string | null = null;
      try {
        if (typeof navigator?.clipboard?.readText === 'function') {
          text = await navigator.clipboard.readText();
        } else if (typeof window !== 'undefined' && '__TAURI__' in window) {
          const { readText } = await import('@tauri-apps/plugin-clipboard-manager');
          text = await readText();
        }
      } catch {
        text = null;
      }
      if (!text?.trim()) {
        setSnackbarMessage('Paste failed – clipboard has no image or structure (MOL/SMILES)');
        setSnackbarSeverity('warning');
        setSnackbarOpen(true);
        return;
      }
      const ketcher = ketcherRef.current;
      if (ketcher?.addFragment) {
        await ketcher.addFragment(text.trim());
      } else if (ketcher?.setMolecule) {
        await ketcher.setMolecule(text.trim());
      } else {
        setSnackbarMessage('Paste failed – editor not ready');
        setSnackbarSeverity('warning');
        setSnackbarOpen(true);
        return;
      }
      setSnackbarMessage('Structure pasted');
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
        setAiIupacName(null);
        console.log('[AppLayout] Setting REAL PubChem data:', foundCompound);
        
        // Set the recognized compound
        setRecognizedCompound({
          cid: foundCompound.cid,
          name: foundCompound.name,
          properties: foundCompound.properties
        });
        setAiProperties(null);
        setAiSafetySummary(null);
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
        setAiIupacName(null);
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
          setAiProperties(null);
          setAiSafetySummary(null);
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
        // AI fallback when PubChem has no match
        try {
          const { aiNameToSmiles } = await import('../../lib/openai/chemistry');
          const aiSmiles = await aiNameToSmiles(name, aiContext);
          if (aiSmiles && ketcherRef.current) {
            const { convertSmilesToMol } = await import('../../lib/chemistry/smilesToMol');
            const molContent = await convertSmilesToMol(aiSmiles);
            if (molContent) {
              await ketcherRef.current.setMolecule(molContent);
              setSnackbarMessage(`AI found structure for: ${name}`);
              setSnackbarSeverity('success');
              setSnackbarOpen(true);
              await fetchComprehensiveData(aiSmiles);
            } else {
              setSnackbarMessage(`Compound not found: ${name}`);
              setSnackbarSeverity('warning');
              setSnackbarOpen(true);
            }
          } else {
            setSnackbarMessage(`Compound not found: ${name}`);
            setSnackbarSeverity('warning');
            setSnackbarOpen(true);
          }
        } catch {
          setSnackbarMessage(`Compound not found: ${name}`);
          setSnackbarSeverity('warning');
          setSnackbarOpen(true);
        }
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

  const handleGetAiIupacName = useCallback(async () => {
    const smiles = currentStructure?.smiles || chemicalData.regulatory?.smiles;
    if (!smiles) return;
    setAiIupacLoading(true);
    try {
      const { aiSmilesToIupac } = await import('../../lib/openai/chemistry');
      const name = await aiSmilesToIupac(smiles, aiContext);
      if (name) {
        setAiIupacName(name);
        setSnackbarMessage('AI name generated');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
      } else {
        setSnackbarMessage('AI could not generate name');
        setSnackbarSeverity('warning');
        setSnackbarOpen(true);
      }
    } catch {
      setSnackbarMessage('AI name generation failed');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setAiIupacLoading(false);
    }
  }, [currentStructure?.smiles, chemicalData.regulatory?.smiles, aiContext]);

  const handlePredictMissingProperties = useCallback(async () => {
    const smiles = currentStructure?.smiles || chemicalData.regulatory?.smiles;
    if (!smiles) return;
    setAiPropertiesLoading(true);
    setAiProperties(null);
    try {
      const { aiEstimatePhysicalProperties } = await import('../../lib/openai/chemistry');
      const phys = chemicalData.physicalProperties;
      const desc = chemicalData.descriptors;
      const result = await aiEstimatePhysicalProperties(smiles, {
        meltingPoint: phys?.meltingPoint,
        boilingPoint: phys?.boilingPoint,
        logP: desc?.logP,
        tpsa: desc?.tpsa,
      });
      if (result) {
        setAiProperties({
          meltingPoint: result.meltingPoint,
          boilingPoint: result.boilingPoint,
          solubility: result.solubility,
          logP: result.logP,
          tpsa: result.tpsa,
          drugLikeness: result.drugLikeness,
        });
        setSnackbarMessage('Properties predicted');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
      } else {
        setSnackbarMessage('Could not predict properties');
        setSnackbarSeverity('warning');
        setSnackbarOpen(true);
      }
    } catch {
      setSnackbarMessage('Property prediction failed');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setAiPropertiesLoading(false);
    }
  }, [currentStructure?.smiles, chemicalData.regulatory?.smiles, chemicalData.physicalProperties, chemicalData.descriptors]);

  const handleGetSafetySummary = useCallback(async () => {
    const smiles = currentStructure?.smiles || chemicalData.regulatory?.smiles;
    if (!smiles) return;
    setAiSafetyLoading(true);
    setAiSafetySummary(null);
    try {
      const { aiEstimateSafety } = await import('../../lib/openai/chemistry');
      const name = recognizedCompound?.name;
      const summary = await aiEstimateSafety(smiles, name);
      if (summary) {
        setAiSafetySummary(summary);
        setSnackbarMessage('Safety summary generated');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
      } else {
        setSnackbarMessage('Could not generate safety summary');
        setSnackbarSeverity('warning');
        setSnackbarOpen(true);
      }
    } catch {
      setSnackbarMessage('Safety summary failed');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setAiSafetyLoading(false);
    }
  }, [currentStructure?.smiles, chemicalData.regulatory?.smiles, recognizedCompound?.name]);

  const handleClear = useCallback(() => {
    if (ketcherRef.current && ketcherRef.current.editor) {
      try {
        ketcherRef.current.editor.clear();
        setCurrentStructure(null);
        setRecognizedCompound(null);
        setAiIupacName(null);
        setAiProperties(null);
        setAiSafetySummary(null);
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
          onReactionsClick={() => setShowReactionHelpDialog(true)}
          onFaqClick={() => window.open('/AIVON_User_Guide_For_GL_Chemdraw.html', '_blank', 'noopener,noreferrer')}
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
                  flex: 1,
                  minWidth: 0,
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

              {/* Resize handle - wider hit area for reliable dragging */}
              <Box
                onMouseDown={handleResizeStart}
                sx={{
                  width: 8,
                  flexShrink: 0,
                  height: '100%',
                  cursor: 'col-resize',
                  bgcolor: 'transparent',
                  '&:hover': { bgcolor: 'action.hover' },
                  '&:active': { bgcolor: 'action.selected' },
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                role="separator"
                aria-label="Resize Chemical Info panel"
              >
                <Box sx={{ width: 2, height: 40, borderRadius: 1, bgcolor: 'divider', opacity: 0.6 }} />
              </Box>

              {/* Right Panel - Chemical Info (resizable, content adjusts) */}
              <Box
                sx={{
                  width: chemicalInfoWidth,
                  minWidth: 200,
                  flexShrink: 0,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  bgcolor: 'background.paper',
                  borderLeft: 1,
                  borderColor: 'divider',
                }}
              >
                {/* Chemical Info — Enterprise layout */}
                <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper', minWidth: 0, overflow: 'hidden', flexShrink: 0 }}>
                  {/* Header */}
                  <Box sx={{ px: 1.5, py: 1.25, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1, minWidth: 0, overflow: 'hidden', borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, fontSize: '0.9rem', letterSpacing: '0.02em', minWidth: 0, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Chemical Info</Typography>
                    {recognizedCompound && !isSearching && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexShrink: 0 }}>
                        <Chip label="Identified" size="small" color="success" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 500 }} />
                        <IconButton size="small" onClick={handleCopyAll} sx={{ width: 28, height: 28 }}>
                          <ContentCopyIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Box>
                    )}
                  </Box>

                  {/* Toolbar — compact buttons: Tools top, Paste+Analysis centered bottom */}
                  <Box sx={{ px: 1, py: 0.75, minWidth: 0, overflow: 'hidden' }}>
                    {/* Row 1: Tools (Export, Biopolymer, Add FG) — Reactions in header */}
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: 0.5, mb: 0.5, minWidth: 0 }}>
                      <Tooltip title="Export"><span><Button size="small" variant="outlined" onClick={(e) => setExportMenuAnchor(e.currentTarget)} disabled={!currentStructure?.molfile} startIcon={<DownloadIcon sx={{ fontSize: 14 }} />} endIcon={<ExpandMoreIcon sx={{ fontSize: 12 }} />} sx={{ textTransform: 'none', minWidth: 0, px: 0.75, py: 0.25, fontSize: '0.75rem' }}>Export</Button></span></Tooltip>
                      <Menu anchorEl={exportMenuAnchor} open={!!exportMenuAnchor} onClose={() => setExportMenuAnchor(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }} transformOrigin={{ vertical: 'top', horizontal: 'left' }}>
                        <MenuItem onClick={() => { setExportMenuAnchor(null); setShowAdvancedExportDialog(true); }}>Advanced Export (PNG/SVG/PDF/DPI)</MenuItem>
                        <MenuItem onClick={() => handleExport('mol')}>MOL</MenuItem>
                        <MenuItem onClick={() => handleExport('sdf')}>SDF</MenuItem>
                        <MenuItem onClick={() => handleExport('smiles')}>SMILES</MenuItem>
                      </Menu>
                      <Tooltip title="Biopolymer"><Button size="small" variant="outlined" onClick={(e) => setBiotoolMenuAnchor(e.currentTarget)} startIcon={<BiotechIcon sx={{ fontSize: 14 }} />} endIcon={<ExpandMoreIcon sx={{ fontSize: 12 }} />} sx={{ textTransform: 'none', minWidth: 0, px: 0.75, py: 0.25, fontSize: '0.75rem' }}>Biopolymer</Button></Tooltip>
                      <Menu anchorEl={biotoolMenuAnchor} open={!!biotoolMenuAnchor} onClose={() => setBiotoolMenuAnchor(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }} transformOrigin={{ vertical: 'top', horizontal: 'left' }}>
                        <MenuItem onClick={() => handleBiopolymerOpen('PEPTIDE')}>Peptide</MenuItem>
                        <MenuItem onClick={() => handleBiopolymerOpen('RNA')}>RNA</MenuItem>
                        <MenuItem onClick={() => handleBiopolymerOpen('DNA')}>DNA</MenuItem>
                      </Menu>
                      <Tooltip title="Add functional group (OMe, OEt, CN, etc.) — AI-powered"><Button size="small" variant="outlined" onClick={() => setShowFunctionalGroupDialog(true)} startIcon={<PsychologyIcon sx={{ fontSize: 14 }} />} sx={{ textTransform: 'none', minWidth: 0, px: 0.75, py: 0.25, fontSize: '0.75rem' }}>Add FG</Button></Tooltip>
                      <Tooltip title="Template library (amino acids, sugars, rings)"><Button size="small" variant="outlined" onClick={() => setShowTemplateLibraryDialog(true)} startIcon={<LibraryBooksIcon sx={{ fontSize: 14 }} />} sx={{ textTransform: 'none', minWidth: 0, px: 0.75, py: 0.25, fontSize: '0.75rem' }}>Templates</Button></Tooltip>
                    </Box>
                    {/* Row 2: Paste + Analysis — centered, buttons wrap individually */}
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 0.5, flexWrap: 'wrap', minWidth: 0 }}>
                      <Tooltip title="Paste"><Button size="small" variant="outlined" onClick={handlePasteFromClipboard} sx={{ minWidth: 0, px: 0.75, py: 0.25, fontSize: '0.75rem' }}>Paste</Button></Tooltip>
                      <Tooltip title="Layout"><Button size="small" variant="outlined" onClick={handleLayout} sx={{ minWidth: 0, px: 0.5, py: 0.25 }}><AccountTreeIcon sx={{ fontSize: 14 }} /></Button></Tooltip>
                      <Tooltip title="Align"><Button size="small" variant="outlined" onClick={(e) => setAlignMenuAnchor(e.currentTarget)} sx={{ minWidth: 0, px: 0.5, py: 0.25 }}><FormatAlignLeftIcon sx={{ fontSize: 14 }} /></Button></Tooltip>
                      <Menu anchorEl={alignMenuAnchor} open={!!alignMenuAnchor} onClose={() => setAlignMenuAnchor(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }} transformOrigin={{ vertical: 'top', horizontal: 'left' }}>
                        <MenuItem onClick={handleAlignDescriptors}>R-group labels</MenuItem>
                        <MenuItem onClick={() => handleAlignStructures('left')}>Align left</MenuItem>
                        <MenuItem onClick={() => handleAlignStructures('right')}>Align right</MenuItem>
                        <MenuItem onClick={() => handleAlignStructures('top')}>Align top</MenuItem>
                        <MenuItem onClick={() => handleAlignStructures('bottom')}>Align bottom</MenuItem>
                      </Menu>
                      {isSearching && <CircularProgress size={12} sx={{ flexShrink: 0 }} />}
                      <Tooltip title="NMR prediction and AI explanation"><span><Button size="small" variant="contained" onClick={() => setShowNMRPredictionDialog(true)} disabled={!currentStructure?.smiles} startIcon={<ShowChartIcon sx={{ fontSize: 14 }} />} sx={{ textTransform: 'none', minWidth: 0, px: 0.75, py: 0.25, fontSize: '0.75rem' }}>NMR</Button></span></Tooltip>
                      <Tooltip title="AI Assistant"><Button size="small" variant="outlined" onClick={() => {
                        setAiSectionExpanded(true);
                        const scrollToAi = () => aiSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        setTimeout(scrollToAi, 100);
                        setTimeout(scrollToAi, 400);
                      }} sx={{ minWidth: 0, px: 0.5, py: 0.25 }}><PsychologyIcon sx={{ fontSize: 14 }} /></Button></Tooltip>
                    </Box>
                  </Box>
                </Box>

                {/* Content area */}
                <Box sx={{ flex: 1, minWidth: 0, overflow: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 1.5, bgcolor: 'background.default' }}>
                  <Stack spacing={1} sx={{ minWidth: 0 }}>
                    {/* Structure Validation */}
                    <ValidationPanel
                      smiles={currentStructure?.smiles}
                      molfile={currentStructure?.molfile}
                    />

              {/* Compound Identification - PubChem primary (shown first) */}
              {recognizedCompound && (
                <Box sx={{ p: 1.5, minWidth: 0, bgcolor: 'background.paper', borderRadius: 1.5, border: '1px solid', borderColor: 'divider' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, pb: 0.75, borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.8rem', letterSpacing: '0.03em', color: 'text.secondary' }}>
                      Molecular Identifiers
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
                        minWidth: 0,
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
                      <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>Name:</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0, flex: 1, overflow: 'hidden' }}>
                        <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.75rem', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {recognizedCompound.name}
                        </Typography>
                        <ContentCopyIcon sx={{ fontSize: 12, opacity: 0.5 }} />
                      </Box>
                    </Box>
                    <Box 
                      onClick={() => (recognizedCompound.properties?.IUPACName || aiIupacName) && handleCopy(recognizedCompound.properties?.IUPACName || aiIupacName || '', 'IUPAC Name')}
                      sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        gap: 1,
                        minWidth: 0,
                        p: 0.75,
                        borderRadius: 1,
                        cursor: (recognizedCompound.properties?.IUPACName || aiIupacName) ? 'pointer' : 'default',
                        transition: 'all 0.2s',
                        '&:hover': (recognizedCompound.properties?.IUPACName || aiIupacName) ? {
                          bgcolor: 'action.hover',
                          transform: 'translateX(2px)',
                        } : {}
                      }}
                    >
                      <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>IUPAC Name:</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0, flex: 1, overflow: 'hidden' }}>
                        <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.75rem', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {recognizedCompound.properties?.IUPACName || aiIupacName || 'N/A'}
                        </Typography>
                        {(recognizedCompound.properties?.IUPACName || aiIupacName) ? (
                          <ContentCopyIcon sx={{ fontSize: 12, opacity: 0.5 }} />
                        ) : (currentStructure?.smiles || chemicalData.regulatory?.smiles) && (
                          <Button size="small" variant="text" onClick={(e) => { e.stopPropagation(); handleGetAiIupacName(); }} disabled={aiIupacLoading} sx={{ minWidth: 0, p: 0.25, fontSize: '0.65rem' }}>
                            {aiIupacLoading ? '...' : 'Get AI'}
                          </Button>
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
                        minWidth: 0,
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
                      <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>PubChem CID:</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0, flex: 1, overflow: 'hidden' }}>
                        <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.75rem', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
                        minWidth: 0,
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
                      <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>CAS Number:</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0, flex: 1, overflow: 'hidden' }}>
                        <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.75rem', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
                        <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>InChI Key:</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0, flex: 1, overflow: 'hidden' }}>
                          <Typography variant="caption" sx={{ fontWeight: 500, fontFamily: 'monospace', fontSize: '0.7rem', minWidth: 0, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
                        <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>SMILES:</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0, flex: 1, overflow: 'hidden' }}>
                          <Typography variant="caption" sx={{ fontWeight: 500, fontFamily: 'monospace', fontSize: '0.7rem', minWidth: 0, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
                        <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>InChI:</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0, flex: 1, overflow: 'hidden' }}>
                          <Typography variant="caption" sx={{ fontWeight: 500, fontFamily: 'monospace', fontSize: '0.7rem', minWidth: 0, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
                  <Box sx={{ p: 1.5, minWidth: 0, bgcolor: 'background.paper', borderRadius: 1.5, border: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, pb: 0.75, fontSize: '0.8rem', letterSpacing: '0.03em', color: 'text.secondary', borderBottom: '1px solid', borderColor: 'divider' }}>
                      Properties
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
                          <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>Molecular Weight:</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0, flex: 1, overflow: 'hidden' }}>
                            <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.75rem', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
                          <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>Molecular Formula:</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0, flex: 1, overflow: 'hidden' }}>
                            <Typography variant="caption" sx={{ fontWeight: 500, fontFamily: 'monospace', fontSize: '0.75rem', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
                          <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>Exact Mass:</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0, flex: 1, overflow: 'hidden' }}>
                            <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.75rem', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
                          <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>Monoisotopic Mass:</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0, flex: 1, overflow: 'hidden' }}>
                            <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.75rem', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
                          <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>Density:</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0, flex: 1, overflow: 'hidden' }}>
                            <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.75rem', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
                          <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>Melting Point:</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0, flex: 1, overflow: 'hidden' }}>
                            <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.75rem', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
                          <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>Boiling Point:</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0, flex: 1, overflow: 'hidden' }}>
                            <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.75rem', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {chemicalData.physicalProperties.boilingPoint}
                            </Typography>
                            <ContentCopyIcon sx={{ fontSize: 12, opacity: 0.5 }} />
                          </Box>
                        </Box>
                      )}
                      {/* AI-predicted properties when PubChem data is missing */}
                      {aiProperties && (
                        <>
                          {aiProperties.meltingPoint && !chemicalData.physicalProperties?.meltingPoint && (
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1, p: 0.75, borderRadius: 1, bgcolor: 'action.hover' }}>
                              <Typography variant="caption" color="text.secondary">Melting Point (predicted):</Typography>
                              <Typography variant="caption" sx={{ fontWeight: 500 }}>{aiProperties.meltingPoint}</Typography>
                            </Box>
                          )}
                          {aiProperties.boilingPoint && !chemicalData.physicalProperties?.boilingPoint && (
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1, p: 0.75, borderRadius: 1, bgcolor: 'action.hover' }}>
                              <Typography variant="caption" color="text.secondary">Boiling Point (predicted):</Typography>
                              <Typography variant="caption" sx={{ fontWeight: 500 }}>{aiProperties.boilingPoint}</Typography>
                            </Box>
                          )}
                          {aiProperties.solubility && (
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1, p: 0.75, borderRadius: 1, bgcolor: 'action.hover' }}>
                              <Typography variant="caption" color="text.secondary">Aqueous Solubility (predicted):</Typography>
                              <Typography variant="caption" sx={{ fontWeight: 500 }}>{aiProperties.solubility}</Typography>
                            </Box>
                          )}
                          {aiProperties.drugLikeness && (
                            <Box sx={{ p: 0.75, borderRadius: 1, bgcolor: 'action.hover' }}>
                              <Typography variant="caption" color="text.secondary">Drug-likeness:</Typography>
                              <Typography variant="caption" sx={{ display: 'block', mt: 0.25 }}>{aiProperties.drugLikeness}</Typography>
                            </Box>
                          )}
                        </>
                      )}
                      {currentStructure?.smiles && !aiProperties && (
                        (!chemicalData.physicalProperties?.meltingPoint || !chemicalData.physicalProperties?.boilingPoint) && (
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={handlePredictMissingProperties}
                            disabled={aiPropertiesLoading}
                            startIcon={aiPropertiesLoading ? <CircularProgress size={14} /> : <PsychologyIcon sx={{ fontSize: 14 }} />}
                            sx={{ fontSize: '0.7rem', mt: 0.5 }}
                          >
                            {aiPropertiesLoading ? 'Predicting...' : 'Predict melting & boiling point'}
                          </Button>
                        )
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
                  <Box sx={{ p: 1.5, minWidth: 0, bgcolor: 'background.paper', borderRadius: 1.5, border: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, pb: 0.75, fontSize: '0.8rem', letterSpacing: '0.03em', color: 'text.secondary', borderBottom: '1px solid', borderColor: 'divider' }}>
                      Chemical Descriptors
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
                          <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>LogP (Lipophilicity):</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0, flex: 1, overflow: 'hidden' }}>
                            <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.75rem', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
                          <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>TPSA (Polar Surface Area):</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0, flex: 1, overflow: 'hidden' }}>
                            <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.75rem', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
                          <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>H-Bond Donors:</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0, flex: 1, overflow: 'hidden' }}>
                            <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.75rem', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
                          <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>H-Bond Acceptors:</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0, flex: 1, overflow: 'hidden' }}>
                            <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.75rem', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
                          <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>Rotatable Bonds:</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0, flex: 1, overflow: 'hidden' }}>
                            <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.75rem', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
                          <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>Complexity:</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0, flex: 1, overflow: 'hidden' }}>
                            <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.75rem', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
                          <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>Heavy Atom Count:</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0, flex: 1, overflow: 'hidden' }}>
                            <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.75rem', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
                          <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>Formal Charge:</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0, flex: 1, overflow: 'hidden' }}>
                            <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.75rem', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {chemicalData.descriptors.formalCharge}
                            </Typography>
                            <ContentCopyIcon sx={{ fontSize: 12, opacity: 0.5 }} />
                          </Box>
                        </Box>
                      )}
                      {aiProperties && (aiProperties.logP != null || aiProperties.tpsa != null) && (
                        <>
                          {aiProperties.logP != null && chemicalData.descriptors.logP === undefined && (
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1, p: 0.75, borderRadius: 1, bgcolor: 'action.hover' }}>
                              <Typography variant="caption" color="text.secondary">LogP (predicted):</Typography>
                              <Typography variant="caption" sx={{ fontWeight: 500 }}>{aiProperties.logP.toFixed(2)}</Typography>
                            </Box>
                          )}
                          {aiProperties.tpsa != null && chemicalData.descriptors.tpsa === undefined && (
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1, p: 0.75, borderRadius: 1, bgcolor: 'action.hover' }}>
                              <Typography variant="caption" color="text.secondary">TPSA (predicted):</Typography>
                              <Typography variant="caption" sx={{ fontWeight: 500 }}>{aiProperties.tpsa.toFixed(2)} Å²</Typography>
                            </Box>
                          )}
                        </>
                      )}
                      {currentStructure?.smiles && chemicalData.descriptors && (chemicalData.descriptors.logP === undefined || chemicalData.descriptors.tpsa === undefined) && !aiProperties?.logP && !aiProperties?.tpsa && (
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={handlePredictMissingProperties}
                          disabled={aiPropertiesLoading}
                          startIcon={aiPropertiesLoading ? <CircularProgress size={14} /> : <PsychologyIcon sx={{ fontSize: 14 }} />}
                          sx={{ fontSize: '0.7rem', mt: 0.5 }}
                        >
                          {aiPropertiesLoading ? 'Predicting...' : 'Predict logP & TPSA'}
                        </Button>
                      )}
                    </Stack>
                  </Box>
                )
              )}

              {/* Safety - PubChem or AI summary */}
              {(chemicalData.safetyData || aiSafetySummary || currentStructure?.smiles) && (
                <Box sx={{ p: 1.5, minWidth: 0, bgcolor: 'background.paper', borderRadius: 1.5, border: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, pb: 0.75, fontSize: '0.8rem', letterSpacing: '0.03em', color: 'text.secondary', borderBottom: '1px solid', borderColor: 'divider' }}>
                    Safety
                  </Typography>
                  {aiSafetySummary ? (
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', fontSize: '0.75rem', lineHeight: 1.5 }}>{aiSafetySummary}</Typography>
                  ) : chemicalData.safetyData && (chemicalData.safetyData.ghsClassification || chemicalData.safetyData.hazardClass || chemicalData.safetyData.flashPoint) ? (
                    <Stack spacing={0.5}>
                      {chemicalData.safetyData.ghsClassification && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', minWidth: 0 }}>
                          <Typography variant="caption" color="text.secondary">GHS:</Typography>
                          <Typography variant="caption" sx={{ fontWeight: 500 }}>{chemicalData.safetyData.ghsClassification}</Typography>
                        </Box>
                      )}
                      {chemicalData.safetyData.hazardClass && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', minWidth: 0 }}>
                          <Typography variant="caption" color="text.secondary">Hazard Class:</Typography>
                          <Typography variant="caption" sx={{ fontWeight: 500 }}>{chemicalData.safetyData.hazardClass}</Typography>
                        </Box>
                      )}
                      {chemicalData.safetyData.flashPoint && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', minWidth: 0 }}>
                          <Typography variant="caption" color="text.secondary">Flash Point:</Typography>
                          <Typography variant="caption" sx={{ fontWeight: 500 }}>{chemicalData.safetyData.flashPoint}</Typography>
                        </Box>
                      )}
                    </Stack>
                  ) : (
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={handleGetSafetySummary}
                      disabled={aiSafetyLoading}
                      startIcon={aiSafetyLoading ? <CircularProgress size={14} /> : <PsychologyIcon sx={{ fontSize: 14 }} />}
                      sx={{ fontSize: '0.7rem' }}
                    >
                      {aiSafetyLoading ? 'Generating...' : 'Get safety summary'}
                    </Button>
                  )}
                </Box>
              )}

              {/* Stereochemistry (RDKit) */}
              {stereoInfo && (stereoInfo.chiralCenters > 0 || stereoInfo.unspecifiedCenters > 0 || stereoInfo.inchiWithStereochemistry) && (
                <Box sx={{ p: 1.5, minWidth: 0, bgcolor: 'background.paper', borderRadius: 1.5, border: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, pb: 0.75, fontSize: '0.8rem', letterSpacing: '0.03em', color: 'text.secondary', borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <CenterFocusStrongIcon sx={{ fontSize: 16 }} /> Stereochemistry
                  </Typography>
                  <Stack spacing={0.5}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minWidth: 0, p: 0.75, borderRadius: 1, bgcolor: 'action.hover' }}>
                      <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>Chiral centers:</Typography>
                      <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.75rem', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {stereoInfo.chiralCenters} total
                      </Typography>
                    </Box>
                    {stereoInfo.unspecifiedCenters > 0 && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minWidth: 0, p: 0.75, borderRadius: 1 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>Unspecified (R/S):</Typography>
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
                          <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>InChI (stereo):</Typography>
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
                  <Box sx={{ p: 1.5, minWidth: 0, bgcolor: 'background.paper', borderRadius: 1.5, border: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, pb: 0.75, fontSize: '0.8rem', letterSpacing: '0.03em', color: 'text.secondary', borderBottom: '1px solid', borderColor: 'divider' }}>
                      Spectral Data
                    </Typography>
                    <Stack spacing={0.5}>
                      {chemicalData.spectral.irSpectrum && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', minWidth: 0 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>IR Spectrum:</Typography>
                          <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.75rem', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {chemicalData.spectral.irSpectrum}
                          </Typography>
                        </Box>
                      )}
                      {chemicalData.spectral.massSpectrum && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', minWidth: 0 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>Mass Spectrum:</Typography>
                          <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.75rem', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {chemicalData.spectral.massSpectrum}
                          </Typography>
                        </Box>
                      )}
                    </Stack>
            </Box>
                )
              )}

                    {/* Unrecognized structure - AI Name */}
                    {currentStructure?.smiles && !recognizedCompound && (
                      <Box sx={{ p: 1.5, minWidth: 0, bgcolor: 'background.paper', borderRadius: 1.5, border: '1px solid', borderColor: 'divider' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.75, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <PsychologyIcon fontSize="small" color="primary" />
                          Unrecognized Structure
                        </Typography>
                        {aiIupacName ? (
                          <Box
                            onClick={() => handleCopy(aiIupacName, 'IUPAC Name')}
                            sx={{ cursor: 'pointer', p: 0.75, borderRadius: 1, '&:hover': { bgcolor: 'action.hover' } }}
                          >
                            <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>IUPAC (AI):</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>{aiIupacName}</Typography>
                          </Box>
                        ) : (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0, flex: 1, overflow: 'hidden' }}>
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={handleGetAiIupacName}
                              disabled={aiIupacLoading}
                              startIcon={aiIupacLoading ? <CircularProgress size={14} /> : <PsychologyIcon />}
                              sx={{ fontSize: '0.75rem' }}
                            >
                              {aiIupacLoading ? 'Getting name...' : 'Get AI Name'}
                            </Button>
                          </Box>
                        )}
                      </Box>
                    )}

                    {/* AI Assistant */}
                    <Box ref={aiSectionRef} id="ai-chemistry-section">
                      <Accordion
                        expanded={aiSectionExpanded}
                        onChange={(_, exp) => setAiSectionExpanded(!!exp)}
                        sx={{
                          '&:before': { display: 'none' },
                          boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 1.5,
                          overflow: 'hidden',
                          minWidth: 0,
                          bgcolor: 'background.paper',
                        }}
                      >
                        <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ fontSize: 18 }} />} sx={{ minHeight: 36, px: 1.5, '& .MuiAccordionSummary-content': { my: 0.5, alignItems: 'center' } }}>
                          <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 0.75, fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.02em' }}>
                            <PsychologyIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                            AI Assistant
                          </Typography>
                        </AccordionSummary>
                        <AccordionDetails sx={{ pt: 0, px: 1.5, pb: 1.5, minWidth: 0 }}>
                          <AIIntegration
                            smiles={currentStructure?.smiles ?? undefined}
                            molfile={currentStructure?.molfile ?? undefined}
                            existingData={recognizedCompound || chemicalData.physicalProperties || chemicalData.descriptors || chemicalData.regulatory ? {
                              name: recognizedCompound?.name,
                              iupacName: recognizedCompound?.properties?.IUPACName || aiIupacName || undefined,
                              molecularFormula: chemicalData.physicalProperties?.molecularFormula,
                              molecularWeight: chemicalData.physicalProperties?.molecularWeight,
                              logP: chemicalData.descriptors?.logP,
                              tpsa: chemicalData.descriptors?.tpsa,
                              casNumber: chemicalData.regulatory?.casNumber,
                              cid: recognizedCompound?.cid,
                            } : undefined}
                            onStructureGenerated={(smiles, name) => {
                              setAiIupacName(name);
                              setSnackbarMessage('AI name generated');
                              setSnackbarSeverity('success');
                              setSnackbarOpen(true);
                            }}
                            onError={(err) => {
                              setSnackbarMessage(err);
                              setSnackbarSeverity('error');
                              setSnackbarOpen(true);
                            }}
                          />
                        </AccordionDetails>
                      </Accordion>
                    </Box>

                    {/* Empty state */}
                    {!recognizedCompound && !currentStructure?.smiles && (
                      <Box sx={{ p: 1.25, minWidth: 0, bgcolor: 'background.paper', borderRadius: 1, border: '1px dashed', borderColor: 'divider', textAlign: 'center', minHeight: 40 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
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

        {/* NMR Prediction Dialog */}
        <NMRPredictionDialog
          open={showNMRPredictionDialog}
          onClose={() => setShowNMRPredictionDialog(false)}
          smiles={currentStructure?.smiles ?? null}
          molfile={currentStructure?.molfile ?? undefined}
        />

        {/* Functional Group Dialog (AI-powered) */}
        <FunctionalGroupDialog
          open={showFunctionalGroupDialog}
          onClose={() => setShowFunctionalGroupDialog(false)}
          onAdd={handleAddFunctionalGroup}
        />

        <TemplateLibraryDialog
          open={showTemplateLibraryDialog}
          onClose={() => setShowTemplateLibraryDialog(false)}
          onAdd={handleAddFunctionalGroup}
        />

        <AdvancedExport
          open={showAdvancedExportDialog}
          onClose={() => setShowAdvancedExportDialog(false)}
          onExport={handleAdvancedExport}
          structureData={{
            molfile: currentStructure?.molfile,
            smiles: currentStructure?.smiles,
            name: recognizedCompound?.name || recognizedCompound?.properties?.IUPACName,
          }}
        />

        {/* Biopolymer Sequence Dialog */}
        <BiopolymerSequenceDialog
          open={showBiopolymerSequenceDialog}
          onClose={() => setShowBiopolymerSequenceDialog(false)}
          initialMode={biopolymerDialogMode}
          onSubmit={handleBiopolymerSequenceSubmit}
        />

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

        {/* Shortcuts / Help Dialog - Keyboard keys styled */}
        <Dialog
          open={showShortcutsDialog}
          onClose={() => setShowShortcutsDialog(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              maxHeight: '90vh',
              borderRadius: 2,
              boxShadow: '0 24px 48px rgba(0,0,0,0.12)',
            },
          }}
        >
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 2, px: 3, borderBottom: 1, borderColor: 'divider', flexShrink: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 1, bgcolor: 'primary.main', color: 'white' }}>
                <Typography sx={{ fontSize: '1.25rem' }}>⌨</Typography>
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>GL-ChemDraw Shortcuts</Typography>
            </Box>
            <IconButton onClick={() => setShowShortcutsDialog(false)} size="small" sx={{ borderRadius: 1 }}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ py: 2, px: 3, overflow: 'auto', flex: '1 1 auto', minHeight: 0 }}>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="overline" sx={{ fontWeight: 700, color: 'primary.main', letterSpacing: 1, display: 'block', mb: 1.5 }}>Copy & Paste</Typography>
                  <Stack spacing={1.5}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
                        <KbdKey>Ctrl</KbdKey>
                        <Typography component="span" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>+</Typography>
                        <KbdKey>C</KbdKey>
                      </Box>
                      <Typography variant="body2" color="text.secondary">Copy image + structure</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
                        <KbdKey>Ctrl</KbdKey>
                        <Typography component="span" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>+</Typography>
                        <KbdKey>V</KbdKey>
                      </Box>
                      <Typography variant="body2" color="text.secondary">Paste structure or image</Typography>
                    </Box>
                  </Stack>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="overline" sx={{ fontWeight: 700, color: 'primary.main', letterSpacing: 1, display: 'block', mb: 1.5 }}>Structure</Typography>
                  <Stack spacing={1.5}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
                        <KbdKey>Ctrl</KbdKey>
                        <Typography component="span" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>+</Typography>
                        <KbdKey>L</KbdKey>
                      </Box>
                      <Typography variant="body2" color="text.secondary">Layout (fix bond lengths & angles)</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
                        <KbdKey>Ctrl</KbdKey>
                        <Typography component="span" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>+</Typography>
                        <KbdKey>Shift</KbdKey>
                        <Typography component="span" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>+</Typography>
                        <KbdKey>L</KbdKey>
                      </Box>
                      <Typography variant="body2" color="text.secondary">Layout (fix geometry)</Typography>
                    </Box>
                  </Stack>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="overline" sx={{ fontWeight: 700, color: 'primary.main', letterSpacing: 1, display: 'block', mb: 1.5 }}>Biopolymer</Typography>
                  <Stack spacing={1.5}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
                        <KbdKey>Ctrl</KbdKey>
                        <Typography component="span" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>+</Typography>
                        <KbdKey>Alt</KbdKey>
                        <Typography component="span" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>+</Typography>
                        <KbdKey>P</KbdKey>
                      </Box>
                      <Typography variant="body2" color="text.secondary">Peptide</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
                        <KbdKey>Ctrl</KbdKey>
                        <Typography component="span" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>+</Typography>
                        <KbdKey>Alt</KbdKey>
                        <Typography component="span" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>+</Typography>
                        <KbdKey>R</KbdKey>
                      </Box>
                      <Typography variant="body2" color="text.secondary">RNA</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
                        <KbdKey>Ctrl</KbdKey>
                        <Typography component="span" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>+</Typography>
                        <KbdKey>Alt</KbdKey>
                        <Typography component="span" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>+</Typography>
                        <KbdKey>D</KbdKey>
                      </Box>
                      <Typography variant="body2" color="text.secondary">DNA</Typography>
                    </Box>
                  </Stack>
                </Box>
                <Box>
                  <Typography variant="overline" sx={{ fontWeight: 700, color: 'text.secondary', letterSpacing: 1, display: 'block', mb: 1.5 }}>Stereochemistry (Wedge/Dash)</Typography>
                  <Typography variant="body2" color="text.secondary">
                    In the <strong>left toolbar</strong>: click the <strong>Bond</strong> tool, then use the bond-type submenu (wedge up, wedge down, wavy). Or draw a bond, select it, and change type in the floating toolbar.
                  </Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="overline" sx={{ fontWeight: 700, color: 'primary.main', letterSpacing: 1, display: 'block', mb: 1.5 }}>Panel Buttons</Typography>
                  <Stack spacing={1}>
                    <Typography variant="body2"><strong>Predict NMR</strong> — ¹H, ¹³C, ¹⁵N, ³¹P, ¹⁹F (AI: all; nmrdb/nmr-predictor: ¹H & ¹³C)</Typography>
                    <Typography variant="body2"><strong>Paste</strong> — Paste from clipboard</Typography>
                    <Typography variant="body2"><strong>Layout</strong> — Fix bond lengths & angles</Typography>
                    <Typography variant="body2"><strong>Align</strong> — R-groups or align selected</Typography>
                    <Typography variant="body2"><strong>Export</strong> — MOL, SDF, SMILES</Typography>
                    <Typography variant="body2"><strong>Biopolymer</strong> — Peptide/RNA/DNA sequence</Typography>
                    <Typography variant="body2"><strong>Reactions</strong> — Draw reaction arrows (header)</Typography>
                    <Typography variant="body2"><strong>Add FG</strong> — Add functional groups (OMe, OEt, CN, etc.) — AI-powered (beside Biopolymer)</Typography>
                  </Stack>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="overline" sx={{ fontWeight: 700, color: 'primary.main', letterSpacing: 1, display: 'block', mb: 1.5 }}>Selection</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Select structure → chemical info. Click canvas → full info.
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="overline" sx={{ fontWeight: 700, color: 'primary.main', letterSpacing: 1, display: 'block', mb: 1.5 }}>Functional Groups</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Use the <strong>Add FG</strong> button beside Biopolymer — AI-powered. Select OMe, OEt, CN, etc. or enter a custom name. The fragment is added to the canvas; connect it to your structure.
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