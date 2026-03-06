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
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
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
import { lazy } from 'react';
// Lazy-load ChemCanvas so ketcher-standalone (the 23MB IndiGo WASM engine)
// does NOT block the initial app render — the UI shell appears immediately
// while the chemistry engine loads in the background.
const ChemCanvas = lazy(() => import('../ChemCanvas/ChemCanvas'));
import { BondTypeBar } from '../BondTypeBar';
import ValidationPanel from '../ValidationPanel/ValidationPanel';
import PubChem3DViewer from '../PubChem3DViewer/PubChem3DViewer';
import { getStructureCdxBytes, getStructureMolfile, getClipboardPngBlob, copyStructureAsImageWithDpi } from '../../hooks/useCopyImageToClipboard';
import { alignStructures, type AlignMode } from '@lib/alignStructures';
import { pasteImageIntoSketch, uploadImageFileToSketch } from '../../hooks/useImagePasteIntoSketch';
import { NMRPredictionDialog } from '../NMRPrediction';
import { BiopolymerSequenceDialog } from '../BiopolymerSequence';
import { FunctionalGroupDialog } from '../FunctionalGroup/FunctionalGroupDialog';
import { TemplateLibraryDialog } from '../TemplateLibrary';
import { FAQDialog } from '../FAQ';
import { AccessibilityMenu } from '../AccessibilityMenu';
import { DocumentSettings } from '../DocumentSettings';
import { AdvancedExport, type ExportDownloadResult } from '../AdvancedExport/AdvancedExport';
import { AIIntegration } from '../AIIntegration';
import { SafetyPanel } from '../SafetyPanel';
import { BatchNMRDialog } from '../BatchNMR';
import { BatchExportDialog } from '../BatchExport';
import { LiteratureSearchDialog } from '../LiteratureSearch';
import { SimilaritySearchDialog } from '../SimilaritySearch';
import { performAdvancedExport, type AdvancedExportOptions } from '@lib/export/advancedExport';
import { peptideToHelm, dnaToHelm, rnaToHelm } from '../../lib/chemistry/helmFormat';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import ImageIcon from '@mui/icons-material/Image';
import ScienceIcon from '@mui/icons-material/Science';
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
    inchiKey?: string;
  } | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchNotFound, setSearchNotFound] = useState<string | null>(null);
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
  const [showBatchNMRDialog, setShowBatchNMRDialog] = useState(false);
  const [showBatchExportDialog, setShowBatchExportDialog] = useState(false);
  const [showLiteratureDialog, setShowLiteratureDialog] = useState(false);
  const [showSimilarityDialog, setShowSimilarityDialog] = useState(false);
  const [showBiopolymerSequenceDialog, setShowBiopolymerSequenceDialog] = useState(false);
  const [showFunctionalGroupDialog, setShowFunctionalGroupDialog] = useState(false);
  const [showTemplateLibraryDialog, setShowTemplateLibraryDialog] = useState(false);
  const [showFaqDialog, setShowFaqDialog] = useState(false);
  const [showAccessibilityMenu, setShowAccessibilityMenu] = useState(false);
  const [showDocumentSettings, setShowDocumentSettings] = useState(false);
  const [showAdvancedExportDialog, setShowAdvancedExportDialog] = useState(false);
  const [showBondTypeBar, setShowBondTypeBar] = useState(false);
  const [canvasKey, setCanvasKey] = useState(0);
  const [biopolymerDialogMode, setBiopolymerDialogMode] = useState<'PEPTIDE' | 'RNA' | 'DNA'>('PEPTIDE');
  const [aiSectionExpanded, setAiSectionExpanded] = useState(false);
  const [aiAnalysisType, setAiAnalysisType] = useState<'comprehensive' | 'naming' | 'properties' | 'reactions' | 'safety'>('comprehensive');
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
  const [aiStereoExplanation, setAiStereoExplanation] = useState<string | null>(null);
  const [aiStereoLoading, setAiStereoLoading] = useState(false);
  const [readOnlyFromUrl, setReadOnlyFromUrl] = useState(false);
  const [isEmbeddedInELN, setIsEmbeddedInELN] = useState(false);
  const [isEmbedMode, setIsEmbedMode] = useState(false);
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
  const shareableLinkParamsRef = useRef<{ smiles?: string; cid?: string; edit?: string } | null>(null);
  const hasSelectionRef = useRef(false);
  const chemicalInfoScrollRef = useRef<HTMLDivElement>(null);
  const aiSectionRef = useRef<HTMLDivElement>(null);
  const lastAutoAiNameSmilesRef = useRef<string | null>(null);
  const lastAutoSafetySmilesRef = useRef<string | null>(null);

  // Shareable links: ?smiles=... or ?cid=... + optional ?edit=1 (editable) or ?edit=0 (view-only)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const smiles = params.get('smiles')?.trim();
    const cid = params.get('cid')?.trim();
    const edit = params.get('edit')?.trim();
    if (smiles || cid) {
      shareableLinkParamsRef.current = { smiles: smiles || undefined, cid: cid || undefined, edit: edit || undefined };
      setReadOnlyFromUrl(edit === '0');
    }
  }, []);

  // Embed mode: ?embed=1 for iframe (Notion, Confluence, docs) – compact UI
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const embed = new URLSearchParams(window.location.search).get('embed');
    setIsEmbedMode(embed === '1' || embed === 'true');
  }, []);

  // ? key opens shortcuts dialog
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const target = e.target as HTMLElement;
        if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') return;
        setShowShortcutsDialog(true);
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // ELN iframe embedding: postMessage bridge for GL Chemtec ELN
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const inIframe = window !== window.parent;
    setIsEmbeddedInELN(inIframe);
    if (!inIframe) return;
    const handler = async (e: MessageEvent) => {
      const d = e.data;
      if (d?.type === 'glchemdraw:setStructure' && (d.molfile || d.smiles)) {
        try {
          const ketcher = ketcherRef.current;
          if (ketcher?.setMolecule) {
            await ketcher.setMolecule(d.molfile || d.smiles);
          }
        } catch (err) {
          console.error('[Glchemdraw] setStructure failed:', err);
        }
      }
      if (d?.type === 'glchemdraw:requestStructure') {
        try {
          const ketcher = ketcherRef.current;
          if (ketcher) {
            let molfile = '';
            let smiles = '';
            try {
              if (ketcher.getMolfile && ketcher.getSmiles) {
                molfile = (await ketcher.getMolfile?.().catch(() => '')) || '';
                smiles = (await ketcher.getSmiles?.().catch(() => '')) || '';
              }
              if (!molfile && !smiles && typeof ketcher.getRxn === 'function') {
                molfile = (await ketcher.getRxn?.().catch(() => '')) || '';
              }
            } catch (_) {}
            if (molfile || smiles) {
              window.parent.postMessage({ type: 'glchemdraw:structure', molfile: molfile || '', smiles: smiles || '' }, '*');
            } else {
              window.parent.postMessage({ type: 'glchemdraw:structureError', error: 'No structure on canvas. Draw a molecule first.' }, '*');
            }
          } else {
            window.parent.postMessage({ type: 'glchemdraw:structureError', error: 'Editor not ready.' }, '*');
          }
        } catch (err) {
          window.parent.postMessage({ type: 'glchemdraw:structureError', error: String(err) }, '*');
        }
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  const handleInsertIntoELN = useCallback(async () => {
    if (window.parent === window) return;
    try {
      const ketcher = ketcherRef.current;
      if (ketcher) {
        let mol = '';
        let smi = '';
        try {
          if (ketcher.getMolfile && ketcher.getSmiles) {
            const [molfile, smiles] = await Promise.all([
              ketcher.getMolfile?.().catch(() => ''),
              ketcher.getSmiles?.().catch(() => ''),
            ]);
            mol = (molfile || '').trim();
            smi = (smiles || '').trim();
          }
          if (!mol && !smi && typeof ketcher.getRxn === 'function') {
            const rxn = await ketcher.getRxn?.().catch(() => '');
            mol = (rxn || '').trim();
          }
        } catch (_) {}
        if (mol || smi) {
          window.parent.postMessage({ type: 'glchemdraw:structure', molfile: mol, smiles: smi }, '*');
          return;
        }
      }
      const struct = currentStructure || fullCanvasRef.current;
      if (struct?.molfile || struct?.smiles) {
        const mol = (struct.molfile || '').trim();
        const smi = (struct.smiles || '').trim();
        if (mol || smi) {
          window.parent.postMessage({
            type: 'glchemdraw:structure',
            molfile: mol,
            smiles: smi,
          }, '*');
          return;
        }
      }
      window.parent.postMessage({ type: 'glchemdraw:structureError', error: 'No structure on canvas. Draw a molecule first.' }, '*');
    } catch (err) {
      console.error('[Glchemdraw] Insert into ELN failed:', err);
      window.parent.postMessage({ type: 'glchemdraw:structureError', error: String(err) }, '*');
    }
  }, [currentStructure]);

  // Catch Ketcher RNA/DNA mode AssertionError - suggest Biopolymer dialog instead
  useEffect(() => {
    const handler = (event: ErrorEvent) => {
      const msg = event.message || '';
      const stack = event.error?.stack || '';
      if (
        (msg.includes('AssertionError') && msg.includes('undefined')) ||
        (stack.includes('Nucleoside') && stack.includes('createOnCanvas')) ||
        (stack.includes('SequenceMode') && stack.includes('handleRnaDnaNodeAddition'))
      ) {
        setSnackbarMessage('RNA/DNA canvas mode has a known issue. Use the Biopolymer button instead to enter sequences.');
        setSnackbarSeverity('warning');
        setSnackbarOpen(true);
        event.preventDefault?.();
        return true; // Suppress default error handling
      }
    };
    window.addEventListener('error', handler);
    return () => window.removeEventListener('error', handler);
  }, []);

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

  // Copy to clipboard for FindMolecule
  const showCopyResult = useCallback((ok: boolean, format: string, err?: string) => {
    setExportMenuAnchor(null);
    if (ok) {
      setSnackbarMessage(`Copied ${format} – paste into FindMolecule to test`);
      setSnackbarSeverity('success');
    } else {
      setSnackbarMessage(err || `Failed to copy ${format}`);
      setSnackbarSeverity('error');
    }
    setSnackbarOpen(true);
  }, []);

  const handleCopyAsKET = useCallback(async () => {
    const ketcher = ketcherRef.current;
    if (!ketcher?.getKet) {
      setSnackbarMessage('KET not available');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }
    try {
      const ket = await ketcher.getKet();
      if (!ket?.trim()) {
        setSnackbarMessage('No structure to copy');
        setSnackbarSeverity('warning');
        setSnackbarOpen(true);
        return;
      }
      if (typeof window !== 'undefined' && '__TAURI__' in window) {
        const { writeText } = await import('@tauri-apps/plugin-clipboard-manager');
        await writeText(ket);
      } else {
        await navigator.clipboard.writeText(ket);
      }
      setExportMenuAnchor(null);
      setSnackbarMessage('Copied as KET (Ketcher format)');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (e) {
      setSnackbarMessage((e as Error).message);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  }, [ketcherRef]);

  const handleSaveCDX = useCallback(async () => {
    const ketcher = ketcherRef.current;
    if (!ketcher) {
      setSnackbarMessage('No structure to save');
      setSnackbarSeverity('warning');
      setSnackbarOpen(true);
      return;
    }
    try {
      const cdxBytes = await getStructureCdxBytes(ketcher);
      if (!cdxBytes?.length) {
        setSnackbarMessage('Could not generate CDX. Try pip install cdx-mol for desktop.');
        setSnackbarSeverity('warning');
        setSnackbarOpen(true);
        return;
      }
      const blob = new Blob([new Uint8Array(cdxBytes)], { type: 'application/octet-stream' });
      const baseName = 'structure';
      if (typeof window !== 'undefined' && '__TAURI__' in window) {
        const { saveFile } = await import('@/lib/tauri/fileOperations');
        const { writeFile } = await import('@tauri-apps/plugin-fs');
        const path = await saveFile('Save CDX', `${baseName}.cdx`, [
          { name: 'ChemDraw File', extensions: ['cdx'] },
        ]);
        if (path) {
          await writeFile(path, cdxBytes);
          setExportMenuAnchor(null);
          setSnackbarMessage('CDX saved');
          setSnackbarSeverity('success');
          setSnackbarOpen(true);
        }
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${baseName}.cdx`;
        a.click();
        URL.revokeObjectURL(url);
        setExportMenuAnchor(null);
        setSnackbarMessage('CDX saved');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
      }
    } catch (e) {
      setSnackbarMessage((e as Error).message);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  }, [ketcherRef]);

  // Copy for FindMolecule (desktop): ChemDraw-style EMF+MOL+CDX or CDX only.
  const handleCopyCDX = useCallback(async () => {
    const ketcher = ketcherRef.current;
    if (!ketcher) {
      showCopyResult(false, 'CDX', 'No structure to copy');
      return;
    }
    const cdxml = ketcher?.getCDXml ? await ketcher.getCDXml() : null;
    const { invoke } = await import('@tauri-apps/api/core');
    try {
      // 1. Best: cdx-mol converts CDXML → ChemDraw CDX (pip install cdx-mol)
      if (cdxml?.trim()) {
        try {
          await invoke('copy_cdx_from_cdxml', { cdxml: cdxml.trim() });
          showCopyResult(true, 'CDX');
          return;
        } catch (pyErr) {
          console.warn('[Copy for FindMolecule] cdx-mol failed, trying Ketcher fallback:', pyErr);
        }
      }
      // 2. Fallback: full ChemDraw-style (EMF + MOL + CDX) for FindMolecule paste
      const pngBlob = await getClipboardPngBlob(ketcher);
      const molfile = await getStructureMolfile(ketcher);
      const cdxBytes = await getStructureCdxBytes(ketcher);
      if (typeof window !== 'undefined' && '__TAURI__' in window) {
        console.debug('[Copy CDX] pngBlob:', !!pngBlob, 'molfile:', !!molfile?.trim(), 'cdxBytes:', cdxBytes?.length ?? 0);
      }
      if (pngBlob && (molfile || cdxBytes?.length)) {
        const pngBytes = new Uint8Array(await pngBlob.arrayBuffer());
        await invoke('copy_chemdraw_style', {
          pngBytes: Array.from(pngBytes),
          molText: molfile?.trim() ?? '',
          cdxBytes: cdxBytes ? Array.from(cdxBytes) : null,
        });
        showCopyResult(true, 'CDX');
        return;
      }
      // 3. Last resort: CDX only (Ketcher binary)
      if (cdxBytes?.length) {
        await invoke('copy_cdx_to_clipboard', { cdxBytes: Array.from(cdxBytes) });
        showCopyResult(true, 'CDX');
      } else {
        showCopyResult(false, 'CDX', 'No structure. Draw a molecule first.');
      }
    } catch (e) {
      const msg = (e as Error)?.message ?? String(e);
      showCopyResult(false, 'CDX', msg || 'Unknown error');
    }
  }, [ketcherRef, showCopyResult]);

  const isTauri = typeof window !== 'undefined' && '__TAURI__' in window;

  // Copy for FindMolecule: desktop uses Tauri; browser uses Ketcher CDX + Chrome extension + native host.
  const handleCopyForFindMolecule = useCallback(async () => {
    const ketcher = ketcherRef.current;
    if (!ketcher) {
      showCopyResult(false, 'CDX', 'No structure to copy');
      return;
    }
    setExportMenuAnchor(null);

    if (isTauri) {
      handleCopyCDX();
      return;
    }

    // Browser: get CDXML (required) + Ketcher CDX (optional fallback), send to extension.
    // Native host uses cdx-mol to convert CDXML → ChemDraw CDX (ClipboardWin compatible).
    try {
      const cdxml = ketcher?.getCDXml ? await ketcher.getCDXml() : null;
      const cdxBytes = await getStructureCdxBytes(ketcher);
      let cdxBase64: string | null = null;
      if (cdxBytes?.length) {
        let b64 = '';
        for (let i = 0; i < cdxBytes.length; i++) b64 += String.fromCharCode(cdxBytes[i]);
        cdxBase64 = btoa(b64);
      }

      if (cdxml?.trim()) {
        const done = new Promise<{ success: boolean; error?: string }>((resolve) => {
          let resolved = false;
          const handler = (e: Event) => {
            if (resolved) return;
            resolved = true;
            document.removeEventListener('glchemdraw-copy-cdx-done', handler);
            resolve((e as CustomEvent).detail || { success: false });
          };
          document.addEventListener('glchemdraw-copy-cdx-done', handler);
          document.dispatchEvent(new CustomEvent('glchemdraw-copy-cdx', {
            detail: { cdxBase64, cdxml: cdxml.trim() },
          }));
          setTimeout(() => {
            if (resolved) return;
            resolved = true;
            document.removeEventListener('glchemdraw-copy-cdx-done', handler);
            resolve({ success: false, error: 'Extension or native host not installed' });
          }, 3000);
        });

        const result = await done;
        if (result.success) {
          setSnackbarMessage('Copied – paste (Ctrl+V) into FindMolecule');
          setSnackbarSeverity('success');
          setSnackbarOpen(true);
          return;
        }
      }

      // Fallback: CDXML text (no extension). Install extension + cdx-mol for best results.
      // CDXML paste may not work; use Save CDXML + upload, or Send to FindMolecule (URL).
      if (cdxml?.trim()) {
        await navigator.clipboard.writeText(cdxml.trim());
        setSnackbarMessage('Copied CDXML. For FindMolecule: install extension, or use Save CDXML + upload, or Send to FindMolecule');
        setSnackbarSeverity('info');
        setSnackbarOpen(true);
        return;
      }

      setSnackbarMessage('No structure to copy. Install extension + native host for FindMolecule paste.');
      setSnackbarSeverity('warning');
      setSnackbarOpen(true);
    } catch (e) {
      setSnackbarMessage((e as Error).message);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  }, [ketcherRef, isTauri, handleCopyCDX, showCopyResult]);

  const handleAdvancedExport = useCallback(async (options: AdvancedExportOptions): Promise<ExportDownloadResult | void> => {
    const ketcher = ketcherRef.current;
    const struct = currentStructure;
    if (!struct && options.format !== 'RXN') throw new Error('No structure to export');
    const result = await performAdvancedExport(ketcher, options, {
      molfile: struct?.molfile,
      smiles: struct?.smiles,
      name: recognizedCompound?.name || recognizedCompound?.properties?.IUPACName,
      inchiKey: recognizedCompound?.inchiKey,
    });
    if (!result.success) throw new Error(result.error || 'Export failed');
    if (!result.downloadBlob || !result.downloadFilename) {
      setShowAdvancedExportDialog(false);
      setSnackbarMessage(`Exported as ${options.format}`);
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      return;
    }
    return { downloadBlob: result.downloadBlob, downloadFilename: result.downloadFilename };
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

  // Ctrl+S → open our Export dialog instead of Ketcher's built-in save overlay
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!(e.ctrlKey && !e.shiftKey && !e.altKey && e.key?.toLowerCase() === 's')) return;
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
      e.preventDefault();
      e.stopPropagation();
      setShowAdvancedExportDialog(true);
    };
    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, []);

  // Intercept Ketcher's built-in Save/Open dialog (triggered via hamburger menu).
  // When detected, close it immediately and open our own Export dialog instead.
  React.useEffect(() => {
    const closeKetcherFileDialog = () => {
      document.querySelectorAll('.bp6-dialog, [role="dialog"]').forEach((el) => {
        const html = el.innerHTML || '';
        const title = (el.querySelector('.bp6-dialog-header-title, [class*="dialog-title"], h2, h3')?.textContent || '').toLowerCase();
        const isSaveOrOpen =
          title.includes('save structure') ||
          title.includes('open structure') ||
          title.includes('save file') ||
          html.includes('saveButton') ||
          (html.includes('mol') && html.includes('smiles') && html.includes('ket') && html.includes('textarea'));
        if (!isSaveOrOpen) return;
        // Don't close our own dialogs
        if ((el as HTMLElement).closest?.('[data-glchemdraw-dialog]')) return;
        const overlay = el.closest('.bp6-overlay') as HTMLElement | null;
        // Click the backdrop/close button to dismiss Ketcher's dialog
        const closeBtn = el.querySelector('[aria-label="Close"], .bp6-dialog-close-button') as HTMLElement | null;
        try { closeBtn?.click(); } catch (_) { /* ignore */ }
        try { (overlay?.querySelector('.bp6-overlay-backdrop') as HTMLElement)?.click?.(); } catch (_) { /* ignore */ }
        setShowAdvancedExportDialog(true);
      });
    };
    const observer = new MutationObserver(closeKetcherFileDialog);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
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

  const handleSimilarityCompoundSelect = useCallback(async (_cid: number, smiles: string, name: string) => {
    const ketcher = ketcherRef.current;
    if (ketcher?.setMolecule) {
      await ketcher.setMolecule(smiles);
      setSnackbarMessage(`Loaded: ${name}`);
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    }
  }, []);

  /** Re-apply Ketcher layout after mode switch - fixes bottom toolbar disappearing and shift. */
  const reapplyKetcherLayout = useCallback(() => {
    requestAnimationFrame(() => {
      setTimeout(() => {
        const root = document.querySelector('.Ketcher-root') as HTMLElement | null;
        if (root) {
          root.style.height = '100%';
          root.style.display = 'flex';
          root.style.flexDirection = 'column';
          root.style.overflow = 'hidden';
        }
        const bottom = document.querySelector('[data-testid="bottom-toolbar"]') as HTMLElement | null;
        if (bottom) {
          bottom.style.display = 'flex';
          bottom.style.visibility = 'visible';
          bottom.style.opacity = '1';
          bottom.style.minHeight = '48px';
          bottom.style.flexShrink = '0';
        }
      }, 150);
    });
  }, []);

  /** Switch back to Molecules mode using Ketcher's built-in API. Falls back to remount only if API unavailable. */
  const handleBackToMolecules = useCallback(() => {
    const ketcher = ketcherRef.current;
    if (ketcher?.switchToMoleculesMode) {
      try {
        ketcher.switchToMoleculesMode();
        reapplyKetcherLayout();
        setSnackbarMessage('Switched to Molecules mode');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
        return;
      } catch (err) {
        console.warn('[AppLayout] switchToMoleculesMode failed, falling back to remount:', err);
      }
    }
    // Fallback: remount canvas when Ketcher API unavailable
    setCanvasKey((k) => k + 1);
    ketcherRef.current = null;
    setSnackbarMessage('Switched to Molecules mode');
    setSnackbarSeverity('success');
    setSnackbarOpen(true);
  }, [reapplyKetcherLayout]);

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

  // Upload image file → OCSR or AI → structure on canvas (editable, not as image)
  const uploadImageInputRef = useRef<HTMLInputElement>(null);
  const [triggerSearchQuery, setTriggerSearchQuery] = useState<string | null>(null);
  const handleUploadImage = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      setSnackbarMessage('Recognizing structure...');
      setSnackbarSeverity('info');
      setSnackbarOpen(true);
      const result = await uploadImageFileToSketch(ketcherRef, file);
      if (result.success && result.type === 'structure') {
        setSnackbarMessage(result.source === 'ai' ? 'Structure loaded (AI)' : 'Structure loaded');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
        return;
      }
      if (result.success && result.type === 'image') {
        setSnackbarMessage('Could not recognize structure; image placed on canvas.');
        setSnackbarSeverity('warning');
        setSnackbarOpen(true);
        return;
      }
      setSnackbarMessage('Could not identify compound from image. Try a clearer structure image.');
      setSnackbarSeverity('warning');
      setSnackbarOpen(true);
    } catch (err) {
      console.error('[AppLayout] Upload image failed:', err);
      const msg = err instanceof Error ? err.message : 'Upload failed';
      setSnackbarMessage(msg);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  }, []);

  // Paste from clipboard: image → OCSR recognition first, else image; or structure (MOL/SMILES)
  const handlePasteFromClipboard = useCallback(async () => {
    try {
      // Focus canvas so paste lands correctly; helps with clipboard permission (user gesture)
      const ketcherRoot = document.querySelector('.Ketcher-root');
      if (ketcherRoot instanceof HTMLElement) {
        ketcherRoot.setAttribute('tabindex', '-1');
        ketcherRoot.focus({ preventScroll: true });
      }
      const result = await pasteImageIntoSketch(ketcherRef);
      if (result.success && result.type === 'structure') {
        setSnackbarMessage(result.source === 'ai' ? 'Structure pasted (AI)' : 'Structure pasted');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
        return;
      }
      if (result.success && result.type === 'compound_name') {
        setTriggerSearchQuery(result.name);
        setSnackbarMessage(`Searching for: ${result.name}`);
        setSnackbarSeverity('info');
        setSnackbarOpen(true);
        return;
      }
      if (!result.success && result.hadImage) {
        setSnackbarMessage('Could not identify compound from image. Try a clearer structure image.');
        setSnackbarSeverity('warning');
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
        setSnackbarMessage('Paste failed – clipboard empty or access denied. Use Ctrl+V with canvas focused, or allow clipboard permission.');
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
      setSnackbarMessage('Paste failed – try Ctrl+V with canvas focused, or ensure clipboard has image or MOL/SMILES');
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
    // Treat empty canvas as no structure - keeps Chemical Info clean (no errors/placeholders)
    // Defense-in-depth: also check isStructureEmpty (Ketcher may emit delayed change with molfile-as-smiles)
    let isEmpty = !molfile?.trim() && !smiles?.trim();
    if (!isEmpty) {
      try {
        const { isStructureEmpty } = await import('../../lib/chemistry/structureUtils');
        isEmpty = isStructureEmpty(molfile, smiles);
      } catch (_) {}
    }
    const structure: StructureData | null = isEmpty ? null : { molfile, smiles };
    fullCanvasRef.current = structure;
    // If no selection active, full canvas is what we display
    if (!hasSelectionRef.current) {
      setCurrentStructure(structure);
      if (smiles?.trim()) {
        setSearchNotFound(null);
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
    // Reject empty/invalid structures (molfile-as-smiles from Ketcher)
    let isEmpty = !molfile?.trim() && !smiles?.trim();
    if (!isEmpty && molfile && smiles) {
      try {
        const { isStructureEmpty } = await import('../../lib/chemistry/structureUtils');
        isEmpty = isStructureEmpty(molfile, smiles);
      } catch (_) {}
    }
    if (molfile && smiles && !isEmpty) {
      hasSelectionRef.current = true;
      setSearchNotFound(null);
      setCurrentStructure({ molfile, smiles });
      await fetchComprehensiveData(smiles);
    } else {
      hasSelectionRef.current = false;
      // Fall back to full canvas when nothing selected
      const full = fullCanvasRef.current;
      if (full) {
        // Also verify full is not empty (delayed Ketcher events)
        try {
          const { isStructureEmpty } = await import('../../lib/chemistry/structureUtils');
          if (isStructureEmpty(full.molfile, full.smiles)) {
            setCurrentStructure(null);
            setRecognizedCompound(null);
            setChemicalData({
              physicalProperties: null,
              safetyData: null,
              descriptors: null,
              regulatory: null,
              spectral: null,
            });
            return;
          }
        } catch (_) {}
        setSearchNotFound(null);
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
          properties: foundCompound.properties,
          inchiKey: foundCompound.properties?.InChIKey,
        });
        setAiProperties(null);
        setAiSafetySummary(null);
        setAiStereoExplanation(null);
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
            properties: properties,
            inchiKey: properties?.InChIKey,
          });
          setAiProperties(null);
          setAiSafetySummary(null);
          setAiStereoExplanation(null);
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
          
          setSearchNotFound(null);
          setSnackbarMessage(`Found compound: ${properties.IUPACName || name}`);
          setSnackbarSeverity('success');
          setSnackbarOpen(true);
        } else {
          console.log('[AppLayout] No properties found for name:', name);
          setSearchNotFound(name);
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
              setSearchNotFound(null);
              setSnackbarMessage(`AI found structure for: ${name}`);
              setSnackbarSeverity('success');
              setSnackbarOpen(true);
              await fetchComprehensiveData(aiSmiles);
            } else {
              setSearchNotFound(name);
              setSnackbarMessage(`Compound not found: ${name}`);
              setSnackbarSeverity('warning');
              setSnackbarOpen(true);
            }
          } else {
            setSearchNotFound(name);
            setSnackbarMessage(`Compound not found: ${name}`);
            setSnackbarSeverity('warning');
            setSnackbarOpen(true);
          }
        } catch {
          setSearchNotFound(name);
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

  const handleTriggerSearchComplete = useCallback(() => {
    setTriggerSearchQuery(null);
  }, []);

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

  const handleGetStereoExplanation = useCallback(async () => {
    const smiles = currentStructure?.smiles || chemicalData.regulatory?.smiles;
    if (!smiles) return;
    setAiStereoLoading(true);
    setAiStereoExplanation(null);
    try {
      const { aiExplainStereochemistry } = await import('../../lib/openai/chemistry');
      const explanation = await aiExplainStereochemistry(smiles, aiContext);
      if (explanation) {
        setAiStereoExplanation(explanation);
        setSnackbarMessage('R/S labels generated');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
      } else {
        setSnackbarMessage('Could not generate R/S explanation');
        setSnackbarSeverity('warning');
        setSnackbarOpen(true);
      }
    } catch {
      setSnackbarMessage('R/S explanation failed');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setAiStereoLoading(false);
    }
  }, [currentStructure?.smiles, chemicalData.regulatory?.smiles, aiContext]);

  // Phase 2: Auto-trigger Get AI Name when PubChem returns N/A (no IUPAC)
  useEffect(() => {
    const smiles = currentStructure?.smiles || chemicalData.regulatory?.smiles;
    if (!smiles || isSearching || aiIupacLoading || aiIupacName) return;
    const hasIupacFromPubChem = recognizedCompound?.properties?.IUPACName;
    if (hasIupacFromPubChem) return;
    if (lastAutoAiNameSmilesRef.current === smiles) return;
    lastAutoAiNameSmilesRef.current = smiles;
    handleGetAiIupacName();
  }, [currentStructure?.smiles, chemicalData.regulatory?.smiles, isSearching, recognizedCompound?.properties?.IUPACName, aiIupacName, aiIupacLoading, handleGetAiIupacName]);

  // Phase 2: Auto-trigger safety summary when no safety data from PubChem
  useEffect(() => {
    const smiles = currentStructure?.smiles || chemicalData.regulatory?.smiles;
    if (!smiles || isSearching || aiSafetyLoading || aiSafetySummary) return;
    const hasSafetyFromPubChem = chemicalData.safetyData?.ghsClassification || chemicalData.safetyData?.hazardClass;
    if (hasSafetyFromPubChem) return;
    if (lastAutoSafetySmilesRef.current === smiles) return;
    lastAutoSafetySmilesRef.current = smiles;
    handleGetSafetySummary();
  }, [currentStructure?.smiles, chemicalData.regulatory?.smiles, isSearching, chemicalData.safetyData?.ghsClassification, chemicalData.safetyData?.hazardClass, aiSafetySummary, aiSafetyLoading, handleGetSafetySummary]);

  const handleClear = useCallback(() => {
    if (ketcherRef.current && ketcherRef.current.editor) {
      try {
        ketcherRef.current.editor.clear();
        setCurrentStructure(null);
        setSearchNotFound(null);
        setRecognizedCompound(null);
        setAiIupacName(null);
        setAiProperties(null);
        setAiSafetySummary(null);
        setAiStereoExplanation(null);
        lastAutoAiNameSmilesRef.current = null;
        lastAutoSafetySmilesRef.current = null;
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

  const headerHeight = isEmbedMode ? 40 : 56;

  return (
    <Box sx={{ 
        height: '100vh', 
        width: '100vw',
        display: 'flex', 
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Header - compact when ?embed=1 (iframe for Notion, Confluence, docs) */}
        <AppToolbar
          compact={isEmbedMode}
          onNew={() => {}}
          onOpen={() => {}}
          onSave={() => {}}
          onUndo={() => {}}
          onRedo={() => {}}
          onClear={handleClear}
          onSearchByName={handleSearchByName}
          triggerSearchWithQuery={triggerSearchQuery}
          onTriggerSearchComplete={handleTriggerSearchComplete}
          onShortcutsClick={() => setShowShortcutsDialog(true)}
          onReactionsClick={() => setShowReactionHelpDialog(true)}
          onFaqClick={() => setShowFaqDialog(true)}
          onAiClick={() => aiSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
        />

        {/* Main Content - Conditional View */}
        <Box sx={{ 
          flex: 1,
          display: 'flex', 
          marginTop: `${headerHeight}px`, // Push content below fixed header (compact in embed mode)
          height: `calc(100vh - ${headerHeight}px)`,
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
                  {readOnlyFromUrl && (
                    <Box sx={{ px: 1.5, py: 0.5, bgcolor: 'action.hover', color: 'text.secondary', fontSize: '0.75rem', fontWeight: 500, textAlign: 'center', borderBottom: '1px solid', borderColor: 'divider' }}>
                      View only — link has edit=0. Use Export → Copy shareable link (editable) to share an editable link.
                    </Box>
                  )}
                  <Suspense fallback={
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: 2 }}>
                      <CircularProgress size={40} />
                    </Box>
                  }>
                  <ChemCanvas
                    key={canvasKey}
                    readonly={readOnlyFromUrl}
                    onStructureChange={handleStructureChange}
                    onSelectionChange={handleSelectionChange}
                    onError={(error) => console.error('[AppLayout] ChemCanvas error:', error)}
                    onPasteCompoundName={(name) => {
                      setTriggerSearchQuery(name);
                      setSnackbarMessage(`Searching for: ${name}`);
                      setSnackbarSeverity('info');
                      setSnackbarOpen(true);
                    }}
                    onPasteImageRecognitionFailed={() => {
                      setSnackbarMessage('Could not identify compound from image. Try a clearer structure image.');
                      setSnackbarSeverity('warning');
                      setSnackbarOpen(true);
                    }}
                    onKetcherInit={async (instance) => {
                      ketcherRef.current = instance;
                      // Shareable links: load ?smiles= or ?cid= from URL
                      const params = shareableLinkParamsRef.current;
                      if (params && instance?.setMolecule) {
                        shareableLinkParamsRef.current = null;
                        try {
                          if (params.smiles) {
                            const { convertSmilesToMol } = await import('../../lib/chemistry/smilesToMol');
                            const mol = await convertSmilesToMol(params.smiles);
                            if (mol) {
                              await instance.setMolecule(mol);
                              setSnackbarMessage('Structure loaded from shareable link');
                              setSnackbarSeverity('success');
                              setSnackbarOpen(true);
                            }
                          } else if (params.cid) {
                            const cidNum = parseInt(params.cid, 10);
                            if (Number.isFinite(cidNum)) {
                              const { getPropertiesByCID } = await import('../../lib/pubchem/api');
                              const { getSafetyDataByCID } = await import('../../lib/pubchem/safety');
                              const { getCASNumber } = await import('../../lib/pubchem/api');
                              const [properties, safety, casNumber] = await Promise.all([
                                getPropertiesByCID(cidNum, ['MolecularWeight', 'MolecularFormula', 'CanonicalSMILES', 'InChI', 'InChIKey', 'IUPACName', 'XLogP', 'ExactMass', 'TPSA', 'HBondDonorCount', 'HBondAcceptorCount', 'RotatableBondCount', 'Complexity', 'HeavyAtomCount', 'Charge']),
                                getSafetyDataByCID(cidNum),
                                getCASNumber(cidNum)
                              ]);
                              if (properties?.CanonicalSMILES) {
                                const { convertSmilesToMol } = await import('../../lib/chemistry/smilesToMol');
                                const mol = await convertSmilesToMol(properties.CanonicalSMILES);
                                if (mol) {
                                  await instance.setMolecule(mol);
                                  setRecognizedCompound({ cid: cidNum, name: properties.IUPACName || '', properties, inchiKey: properties.InChIKey });
                                  setChemicalData({
                                    physicalProperties: { molecularWeight: properties.MolecularWeight, molecularFormula: properties.MolecularFormula, exactMass: properties.ExactMass, monoIsotopicMass: null, density: null, meltingPoint: null, boilingPoint: null },
                                    safetyData: safety ? { hazardClass: safety.hazardClass, flashPoint: safety.flashPoint, autoignition: safety.autoignition, ld50: safety.ld50 || safety.oralLd50, healthHazards: safety.healthHazards, fireHazards: safety.fireHazards, flammability: safety.flammability, nfpaRating: safety.nfpaRating, ghsClassification: safety.ghsClassification, firstAid: safety.firstAid, exposureLimits: safety.exposureLimits, personalProtection: safety.personalProtection, storage: safety.storage, disposal: safety.disposal, incompatibilities: safety.incompatibilities } : null,
                                    descriptors: { logP: properties.XLogP, tpsa: properties.TPSA, hBondDonors: properties.HBondDonorCount, hBondAcceptors: properties.HBondAcceptorCount, rotatableBonds: properties.RotatableBondCount, complexity: properties.Complexity, heavyAtomCount: properties.HeavyAtomCount, formalCharge: properties.Charge },
                                    regulatory: { casNumber, pubchemCID: cidNum, inchi: properties.InChI, inchiKey: properties.InChIKey, smiles: properties.CanonicalSMILES, iupacName: properties.IUPACName },
                                    spectral: { nmrAvailable: null, irSpectrum: null, massSpectrum: null }
                                  });
                                  setSnackbarMessage(`Loaded from link: ${properties.IUPACName || `CID ${cidNum}`}`);
                                  setSnackbarSeverity('success');
                                  setSnackbarOpen(true);
                                }
                              }
                            }
                          }
                        } catch (err) {
                          console.warn('[AppLayout] Shareable link load failed:', err);
                        }
                      }
                      const ev = (instance?.editor as any)?.events;
                      ev?.switchToMoleculesMode?.add?.(reapplyKetcherLayout);
                      // Re-apply persisted drawing settings on each Ketcher init
                      try {
                        const stored = localStorage.getItem('glchemdraw_drawing_settings');
                        if (stored && instance?.setSettings) {
                          const s = JSON.parse(stored);
                          const IN_TO_CM = 2.54, IN_TO_PT = 72;
                          const toIn = (v: number, u: string) =>
                            u === 'cm' ? v / IN_TO_CM : u === 'pt' ? v / IN_TO_PT : v;
                          instance.setSettings({
                            chainAngle:               s.chainAngle ?? 120,
                            bondLength:               toIn(s.bondLength,   s.units) * IN_TO_CM,
                            bondLengthUnit:           'cm',
                            bondSpacing:              s.bondSpacing,
                            bondThickness:            toIn(s.lineWidth,    s.units) * IN_TO_PT,
                            bondThicknessUnit:        'pt',
                            stereoBondWidth:          toIn(s.boldWidth,    s.units) * IN_TO_PT,
                            stereoBondWidthUnit:      'pt',
                            hashSpacing:              toIn(s.hashSpacing,  s.units) * IN_TO_PT,
                            hashSpacingUnit:          'pt',
                            reactionComponentMarginSize:     toIn(s.marginWidth, s.units) * IN_TO_PT,
                            reactionComponentMarginSizeUnit: 'pt',
                            showAtomIds:          s.showAtomNumbers,
                            showStereoFlags:      s.showStereoFlags,
                            atomColoring:         s.atomColoring,
                            showValenceWarnings:  s.showValenceWarnings,
                            aromaticCircle:       s.aromaticCircle,
                            showCharge:           s.showCharge,
                            showHydrogenLabels:   s.showHydrogenLabels ? 'on' : 'off',
                            showBondIds:          s.showBondNumbers,
                          });
                        }
                      } catch (e) {
                        console.warn('[AppLayout] Could not restore drawing settings:', e);
                      }
                    }}
                    onCopyImageSuccess={() => {
                      setSnackbarMessage('Structure copied to clipboard!');
                      setSnackbarSeverity('success');
                      setSnackbarOpen(true);
                    }}
                  />
                  </Suspense>
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

              {/* Right Panel - Chemical Info (resizable, premium enterprise layout) */}
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
                  borderLeft: '1px solid',
                  borderColor: 'divider',
                }}
              >
                {/* Chemical Info — Premium header (subtle accent) */}
                <Box sx={{ minWidth: 0, overflow: 'hidden', flexShrink: 0, borderBottom: '1px solid', borderColor: 'divider' }}>
                  {/* Header with thin top accent */}
                  <Box
                    sx={{
                      px: 1.5,
                      py: 1.25,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 1,
                      minWidth: 0,
                      overflow: 'hidden',
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                      borderTop: '3px solid',
                      borderTopColor: 'primary.main',
                    }}
                  >
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, fontSize: '0.85rem', letterSpacing: '0.05em', textTransform: 'uppercase', color: 'text.secondary', minWidth: 0, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Chemical Info</Typography>
                    {isEmbeddedInELN && (
                      <Button
                        size="small"
                        variant="contained"
                        onClick={handleInsertIntoELN}
                        sx={{ flexShrink: 0, fontSize: '0.7rem', py: 0.5, px: 1.5 }}
                      >
                        Insert into ELN
                      </Button>
                    )}
                    {recognizedCompound && !isSearching && !isEmbeddedInELN && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
                        <Chip label="Identified" size="small" color="success" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 500 }} />
                        <IconButton size="small" onClick={handleCopyAll} sx={{ width: 28, height: 28, color: 'text.secondary', '&:hover': { bgcolor: 'action.hover', color: 'text.primary' } }}>
                          <ContentCopyIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Box>
                    )}
                  </Box>

                  {/* Toolbar — premium enterprise */}
                  <Box sx={{
                    px: 1,
                    py: 0.75,
                    minWidth: 0,
                    overflow: 'hidden',
                    bgcolor: (t) => t.palette.mode === 'light' ? 'rgba(15,23,42,0.02)' : 'rgba(255,255,255,0.02)',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                  }}>
                    {/* Row 1: Export, Biopolymer, Add FG, Templates */}
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: 0.5, mb: 0.75, minWidth: 0 }}>
                      <Tooltip title="Export">
                        <span>
                          <Button
                            size="small"
                            variant="text"
                            onClick={(e) => setExportMenuAnchor(e.currentTarget)}
                            disabled={!currentStructure?.molfile && !currentStructure?.smiles}
                            startIcon={<DownloadIcon sx={{ fontSize: 15, opacity: 0.85 }} />}
                            endIcon={<ExpandMoreIcon sx={{ fontSize: 14, opacity: 0.7 }} />}
                            sx={{
                              textTransform: 'none',
                              fontWeight: 500,
                              fontSize: '0.7rem',
                              letterSpacing: '0.03em',
                              color: 'text.secondary',
                              minWidth: 0,
                              px: 1,
                              py: 0.5,
                              borderRadius: 1,
                              '&:hover': { bgcolor: 'action.hover', color: 'text.primary' },
                            }}
                          >Export</Button>
                        </span>
                      </Tooltip>
                      <Menu anchorEl={exportMenuAnchor} open={!!exportMenuAnchor} onClose={() => setExportMenuAnchor(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }} transformOrigin={{ vertical: 'top', horizontal: 'left' }}>
                        <MenuItem onClick={() => { setExportMenuAnchor(null); setShowAdvancedExportDialog(true); }}>Export as PNG / SVG / PDF / MOL / SDF / RXN / CDX…</MenuItem>
                        <MenuItem onClick={() => { setExportMenuAnchor(null); setShowBatchExportDialog(true); }}>Batch export (CSV)…</MenuItem>
                        <MenuItem onClick={() => {
                          setExportMenuAnchor(null);
                          const smiles = currentStructure?.smiles || chemicalData.regulatory?.smiles;
                          const cid = recognizedCompound?.cid;
                          const base = window.location.origin + window.location.pathname;
                          let url = cid ? `${base}?cid=${cid}` : smiles ? `${base}?smiles=${encodeURIComponent(smiles)}` : null;
                          if (url) {
                            url += (url.includes('?') ? '&' : '?') + 'edit=1';
                            navigator.clipboard.writeText(url).then(() => {
                              setSnackbarMessage('Shareable link copied! (editable)');
                              setSnackbarSeverity('success');
                              setSnackbarOpen(true);
                            });
                          } else {
                            setSnackbarMessage('Draw a structure first');
                            setSnackbarSeverity('warning');
                            setSnackbarOpen(true);
                          }
                        }}>Copy shareable link (editable)</MenuItem>
                        <MenuItem onClick={() => {
                          setExportMenuAnchor(null);
                          const smiles = currentStructure?.smiles || chemicalData.regulatory?.smiles;
                          const cid = recognizedCompound?.cid;
                          const base = window.location.origin + window.location.pathname;
                          let url = cid ? `${base}?cid=${cid}` : smiles ? `${base}?smiles=${encodeURIComponent(smiles)}` : null;
                          if (url) {
                            url += (url.includes('?') ? '&' : '?') + 'edit=0';
                            navigator.clipboard.writeText(url).then(() => {
                              setSnackbarMessage('Shareable link copied! (view-only)');
                              setSnackbarSeverity('success');
                              setSnackbarOpen(true);
                            });
                          } else {
                            setSnackbarMessage('Draw a structure first');
                            setSnackbarSeverity('warning');
                            setSnackbarOpen(true);
                          }
                        }}>Copy shareable link (view-only)</MenuItem>
                        <Divider />
                        <MenuItem onClick={async () => {
                          setExportMenuAnchor(null);
                          const ok = await copyStructureAsImageWithDpi(ketcherRef.current, 150);
                          if (ok) { setSnackbarMessage('Structure copied as image (150 DPI)'); setSnackbarSeverity('success'); setSnackbarOpen(true); }
                          else { setSnackbarMessage('Copy failed. Use Export > PNG to download instead.'); setSnackbarSeverity('warning'); setSnackbarOpen(true); }
                        }}>Copy as image (150 DPI)</MenuItem>
                        <MenuItem onClick={async () => {
                          setExportMenuAnchor(null);
                          const ok = await copyStructureAsImageWithDpi(ketcherRef.current, 300);
                          if (ok) { setSnackbarMessage('Structure copied as image (300 DPI)'); setSnackbarSeverity('success'); setSnackbarOpen(true); }
                          else { setSnackbarMessage('Copy failed. Use Export > PNG to download instead.'); setSnackbarSeverity('warning'); setSnackbarOpen(true); }
                        }}>Copy as image (300 DPI)</MenuItem>
                        <Divider />
                        <MenuItem onClick={handleCopyAsKET}>Copy as KET</MenuItem>
                        <MenuItem onClick={handleSaveCDX}>Save as CDX</MenuItem>
                        <Divider />
                        <MenuItem onClick={handleCopyForFindMolecule}>Copy for FindMolecule (paste into ELN)</MenuItem>
                        <MenuItem component="a" href="/findmolecule-setup" target="_blank" rel="noopener noreferrer" onClick={() => setExportMenuAnchor(null)} sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>Setup: Install extension & native host</MenuItem>
                      </Menu>
                      <Tooltip title="Document drawing settings">
                        <Button
                          size="small"
                          variant="text"
                          onClick={() => setShowDocumentSettings(true)}
                          startIcon={<AutoFixHighIcon sx={{ fontSize: 15, opacity: 0.85 }} />}
                          sx={{
                            textTransform: 'none',
                            fontWeight: 500,
                            fontSize: '0.7rem',
                            letterSpacing: '0.03em',
                            color: 'text.secondary',
                            minWidth: 0,
                            px: 1,
                            py: 0.5,
                            borderRadius: 1,
                            '&:hover': { bgcolor: 'action.hover', color: 'text.primary' },
                          }}
                        >Drawing</Button>
                      </Tooltip>
                      <Tooltip title="Biopolymer">
                        <Button
                          size="small"
                          variant="text"
                          onClick={(e) => setBiotoolMenuAnchor(e.currentTarget)}
                          startIcon={<BiotechIcon sx={{ fontSize: 15, opacity: 0.85 }} />}
                          endIcon={<ExpandMoreIcon sx={{ fontSize: 14, opacity: 0.7 }} />}
                          sx={{
                            textTransform: 'none',
                            fontWeight: 500,
                            fontSize: '0.7rem',
                            letterSpacing: '0.03em',
                            color: 'text.secondary',
                            minWidth: 0,
                            px: 1,
                            py: 0.5,
                            borderRadius: 1,
                            '&:hover': { bgcolor: 'action.hover', color: 'text.primary' },
                          }}
                        >Biopolymer</Button>
                      </Tooltip>
                      <Menu anchorEl={biotoolMenuAnchor} open={!!biotoolMenuAnchor} onClose={() => setBiotoolMenuAnchor(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }} transformOrigin={{ vertical: 'top', horizontal: 'left' }}>
                        <MenuItem onClick={() => handleBiopolymerOpen('PEPTIDE')}>Peptide</MenuItem>
                        <MenuItem onClick={() => handleBiopolymerOpen('RNA')}>RNA</MenuItem>
                        <MenuItem onClick={() => handleBiopolymerOpen('DNA')}>DNA</MenuItem>
                      </Menu>
                      <Box sx={{ width: '1px', height: 14, bgcolor: 'divider', mx: 0.5, alignSelf: 'center' }} />
                      <Tooltip title="Add functional group (OMe, OEt, CN, etc.) — AI-powered">
                        <Button
                          size="small"
                          variant="text"
                          onClick={() => setShowFunctionalGroupDialog(true)}
                          startIcon={<PsychologyIcon sx={{ fontSize: 15, opacity: 0.85 }} />}
                          sx={{
                            textTransform: 'none',
                            fontWeight: 500,
                            fontSize: '0.7rem',
                            letterSpacing: '0.03em',
                            color: 'text.secondary',
                            minWidth: 0,
                            px: 1,
                            py: 0.5,
                            borderRadius: 1,
                            '&:hover': { bgcolor: 'action.hover', color: 'text.primary' },
                          }}
                        >Add FG</Button>
                      </Tooltip>
                      <Tooltip title="Template library (amino acids, sugars, rings)">
                        <Button
                          size="small"
                          variant="text"
                          onClick={() => setShowTemplateLibraryDialog(true)}
                          startIcon={<LibraryBooksIcon sx={{ fontSize: 15, opacity: 0.85 }} />}
                          sx={{
                            textTransform: 'none',
                            fontWeight: 500,
                            fontSize: '0.7rem',
                            letterSpacing: '0.03em',
                            color: 'text.secondary',
                            minWidth: 0,
                            px: 1,
                            py: 0.5,
                            borderRadius: 1,
                            '&:hover': { bgcolor: 'action.hover', color: 'text.primary' },
                          }}
                        >Templates</Button>
                      </Tooltip>
                    </Box>
                    {/* Row 2: Molecules (escape hatch), Bond Type, Paste, Layout, Align, NMR, AI */}
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 0.25, flexWrap: 'wrap', minWidth: 0 }}>
                      <Tooltip title="Switch back to Molecules mode (resets canvas when stuck in RNA/DNA/PEP)">
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={handleBackToMolecules}
                          startIcon={<BiotechIcon sx={{ fontSize: 14, transform: 'scaleX(-1)' }} />}
                          sx={{
                            textTransform: 'none',
                            fontWeight: 600,
                            fontSize: '0.7rem',
                            letterSpacing: '0.03em',
                            color: 'primary.main',
                            borderColor: 'primary.main',
                            minWidth: 0,
                            px: 1,
                            py: 0.5,
                            borderRadius: 1,
                            '&:hover': { bgcolor: 'primary.main', color: 'primary.contrastText', borderColor: 'primary.main' },
                          }}
                        >Molecules</Button>
                      </Tooltip>
                      <Tooltip title="Bond type: Single, Double, Triple, Wedge, Hash, Wavy. Select bond(s) then click type to change.">
                        <Button
                          size="small"
                          variant="text"
                          onClick={() => setShowBondTypeBar((b) => !b)}
                          startIcon={<span style={{ fontSize: 14, fontWeight: 600 }}>≡</span>}
                          sx={{
                            textTransform: 'none',
                            fontWeight: 500,
                            fontSize: '0.7rem',
                            letterSpacing: '0.03em',
                            color: showBondTypeBar ? 'primary.main' : 'text.secondary',
                            minWidth: 0,
                            px: 1,
                            py: 0.5,
                            borderRadius: 1,
                            '&:hover': { bgcolor: 'action.hover', color: 'text.primary' },
                          }}
                        >Bond Type</Button>
                      </Tooltip>
                      <input
                        type="file"
                        ref={uploadImageInputRef}
                        accept="image/png,image/jpeg,image/webp"
                        onChange={handleUploadImage}
                        style={{ display: 'none' }}
                      />
                      <Tooltip title="Upload image → structure drawn on canvas (OCSR or AI)">
                        <Button
                          size="small"
                          variant="text"
                          onClick={() => uploadImageInputRef.current?.click()}
                          sx={{
                            textTransform: 'none',
                            fontWeight: 500,
                            minWidth: 0,
                            px: 1,
                            '& .MuiButton-startIcon': { mr: 0.5 },
                          }}
                          startIcon={<ImageIcon sx={{ fontSize: 15, opacity: 0.85 }} />}
                        >
                          Upload image
                        </Button>
                      </Tooltip>
                      <Tooltip title="Paste from clipboard (use when Ctrl+V doesn't work)">
                        <Button
                          size="small"
                          variant="text"
                          onClick={handlePasteFromClipboard}
                          sx={{
                            textTransform: 'none',
                            fontWeight: 500,
                            fontSize: '0.7rem',
                            letterSpacing: '0.03em',
                            color: 'text.secondary',
                            minWidth: 0,
                            px: 1,
                            py: 0.5,
                            borderRadius: 1,
                            '&:hover': { bgcolor: 'action.hover', color: 'text.primary' },
                          }}
                        >Paste</Button>
                      </Tooltip>
                      <Tooltip title="Layout">
                        <IconButton size="small" onClick={handleLayout} sx={{ width: 28, height: 28, color: 'text.secondary', '&:hover': { bgcolor: 'action.hover', color: 'text.primary' } }}>
                          <AutoFixHighIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Align">
                        <IconButton size="small" onClick={(e) => setAlignMenuAnchor(e.currentTarget)} sx={{ width: 28, height: 28, color: 'text.secondary', '&:hover': { bgcolor: 'action.hover', color: 'text.primary' } }}>
                          <FormatAlignLeftIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                      <Menu anchorEl={alignMenuAnchor} open={!!alignMenuAnchor} onClose={() => setAlignMenuAnchor(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }} transformOrigin={{ vertical: 'top', horizontal: 'left' }}>
                        <MenuItem onClick={handleAlignDescriptors}>R-group labels</MenuItem>
                        <MenuItem onClick={() => handleAlignStructures('left')}>Align left</MenuItem>
                        <MenuItem onClick={() => handleAlignStructures('right')}>Align right</MenuItem>
                        <MenuItem onClick={() => handleAlignStructures('top')}>Align top</MenuItem>
                        <MenuItem onClick={() => handleAlignStructures('bottom')}>Align bottom</MenuItem>
                      </Menu>
                      {isSearching && <CircularProgress size={14} sx={{ flexShrink: 0, color: 'text.secondary' }} />}
                      <Box sx={{ width: '1px', height: 14, bgcolor: 'divider', mx: 0.5, alignSelf: 'center' }} />
                      <Tooltip title="NMR prediction and AI explanation">
                        <span>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => setShowNMRPredictionDialog(true)}
                            disabled={!currentStructure?.smiles}
                            startIcon={<ShowChartIcon sx={{ fontSize: 15 }} />}
                            sx={{
                              textTransform: 'none',
                              fontWeight: 600,
                              fontSize: '0.7rem',
                              letterSpacing: '0.04em',
                              minWidth: 0,
                              px: 1.25,
                              py: 0.5,
                              borderRadius: 1,
                              borderWidth: 1.5,
                              borderColor: 'primary.main',
                              color: 'primary.main',
                              '&:hover': {
                                borderWidth: 1.5,
                                borderColor: 'primary.dark',
                                bgcolor: 'primary.main',
                                color: 'primary.contrastText',
                              },
                            }}
                          >NMR</Button>
                        </span>
                      </Tooltip>
                      <Tooltip title="Batch NMR – paste multiple SMILES">
                        <Button
                          size="small"
                          variant="text"
                          onClick={() => setShowBatchNMRDialog(true)}
                          sx={{ textTransform: 'none', fontSize: '0.65rem', minWidth: 0, px: 0.75 }}
                        >
                          Batch
                        </Button>
                      </Tooltip>
                      <Tooltip title="Predict likely reactions & products (AI)">
                        <Button
                          size="small"
                          variant="text"
                          onClick={() => {
                            setAiSectionExpanded(true);
                            setAiAnalysisType('reactions');
                            setTimeout(() => aiSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
                          }}
                          disabled={!currentStructure?.smiles}
                          sx={{ textTransform: 'none', fontSize: '0.65rem', minWidth: 0, px: 0.75 }}
                        >
                          Predict products
                        </Button>
                      </Tooltip>
                      <Tooltip title="AI Assistant">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setAiSectionExpanded(true);
                            const scrollToAi = () => aiSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            setTimeout(scrollToAi, 100);
                            setTimeout(scrollToAi, 350);
                            setTimeout(scrollToAi, 600);
                          }}
                          sx={{ width: 28, height: 28, color: 'text.secondary', '&:hover': { bgcolor: 'action.hover', color: 'text.primary' } }}
                        >
                          <PsychologyIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                    {showBondTypeBar && (
                      <Box sx={{ py: 1, display: 'flex', justifyContent: 'center', borderTop: 1, borderColor: 'divider' }}>
                        <BondTypeBar
                          ketcherRef={ketcherRef}
                          compact
                          onApplied={(msg) => { setSnackbarMessage(msg); setSnackbarSeverity('success'); setSnackbarOpen(true); }}
                          onError={(msg) => { setSnackbarMessage(msg); setSnackbarSeverity('warning'); setSnackbarOpen(true); }}
                        />
                      </Box>
                    )}
                  </Box>
                </Box>

                {/* Content area */}
                <Box sx={{ flex: 1, minWidth: 0, overflow: 'auto', p: 1.25, display: 'flex', flexDirection: 'column', gap: 0.5, bgcolor: 'background.paper' }}>
                  {!currentStructure ? (
                    <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', py: 4 }}>
                      <Box>
                        <ScienceIcon sx={{ fontSize: 48, mb: 1.5, opacity: 0.4, color: 'text.secondary' }} />
                        <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 500, letterSpacing: '0.02em' }}>
                          Draw a structure to see chemical information
                        </Typography>
                      </Box>
                    </Box>
                  ) : (
                  <Stack spacing={0.75} sx={{ minWidth: 0 }}>
                    {/* Structure Validation */}
                    <ValidationPanel
                      smiles={currentStructure?.smiles}
                      molfile={currentStructure?.molfile}
                    />

                    {/* Search by structure - when we have smiles */}
                    {(currentStructure?.smiles || chemicalData?.regulatory?.smiles) && (
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                          size="small"
                          variant="text"
                          onClick={() => setShowSimilarityDialog(true)}
                          sx={{ textTransform: 'none', fontSize: '0.7rem' }}
                        >
                          Find similar
                        </Button>
                      </Box>
                    )}

              {/* Compound Identification - PubChem primary (shown first) */}
              {recognizedCompound && (
                <Box sx={{ p: 1.25, minWidth: 0, borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5, px: 0.75, mb: 0.5, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'action.hover', borderRadius: 0.5, borderLeft: '3px solid', borderLeftColor: 'primary.main' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.72rem', letterSpacing: '0.08em', color: 'text.primary', textTransform: 'uppercase' }}>
                      Molecular Identifiers
                    </Typography>
                    <Button
                      size="small"
                      variant="text"
                      onClick={() => setShow3DViewer(true)}
                      sx={{
                        fontSize: '0.7rem',
                        fontWeight: 500,
                        letterSpacing: '0.03em',
                        color: 'primary.main',
                        py: 0.25,
                        px: 1,
                        '&:hover': { bgcolor: 'action.hover' },
                      }}
                    >
                      View 3D
                    </Button>
                    <Button
                      size="small"
                      variant="text"
                      onClick={() => setShowLiteratureDialog(true)}
                      sx={{ textTransform: 'none', fontSize: '0.7rem', minWidth: 0, px: 0.75 }}
                    >
                      Find papers
                    </Button>
                  </Box>
                  <Stack spacing={0.25}>
                    <Box 
                      onClick={() => handleCopy(recognizedCompound.name, 'Name')}
                      sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        gap: 1,
                        minWidth: 0,
                        p: 0.5,
                        borderRadius: 1,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': {
                          bgcolor: 'action.hover',
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
                        p: 0.5,
                        borderRadius: 1,
                        cursor: (recognizedCompound.properties?.IUPACName || aiIupacName) ? 'pointer' : 'default',
                        transition: 'all 0.2s',
                        '&:hover': (recognizedCompound.properties?.IUPACName || aiIupacName) ? {
                          bgcolor: 'action.hover',
                        } : {}
                      }}
                    >
                      <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>IUPAC Name:</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0, flex: 1, overflow: 'hidden' }}>
                        <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.75rem', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'primary.main' }}>
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
                        p: 0.5,
                        borderRadius: 1,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': {
                          bgcolor: 'action.hover',
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
                        p: 0.5,
                        borderRadius: 1,
                        cursor: chemicalData.regulatory?.casNumber ? 'pointer' : 'default',
                        transition: 'all 0.2s',
                        '&:hover': chemicalData.regulatory?.casNumber ? {
                          bgcolor: 'action.hover',
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
                          p: 0.5,
                          borderRadius: 1,
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          '&:hover': {
                            bgcolor: 'action.hover',
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
                          p: 0.5,
                          borderRadius: 1,
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          '&:hover': {
                            bgcolor: 'action.hover',
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
                          p: 0.5,
                          borderRadius: 1,
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          '&:hover': {
                            bgcolor: 'action.hover',
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
                  <Box sx={{ p: 1.25, minWidth: 0, borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                    <Box sx={{ py: 0.5, px: 0.75, mb: 0.5, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'action.hover', borderRadius: 0.5, borderLeft: '3px solid', borderLeftColor: 'primary.main' }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.72rem', letterSpacing: '0.08em', color: 'text.primary', textTransform: 'uppercase' }}>
                        Properties
                      </Typography>
                    </Box>
                    <Stack spacing={0.25}>
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
                            p: 0.5,
                            borderRadius: 1,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            '&:hover': {
                              bgcolor: 'action.hover',
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
                            p: 0.5,
                            borderRadius: 1,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            '&:hover': {
                              bgcolor: 'action.hover',
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
                            p: 0.5,
                            borderRadius: 1,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            '&:hover': {
                              bgcolor: 'action.hover',
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
                      {chemicalData.physicalProperties.exactMass && (
                        <Box sx={{ mt: 0.5, p: 0.75, borderRadius: 1, bgcolor: 'action.hover' }}>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.65rem', letterSpacing: '0.05em' }}>MASS SPEC (m/z)</Typography>
                          <Stack spacing={0.25} sx={{ mt: 0.5 }}>
                            {(() => {
                              const m = typeof chemicalData.physicalProperties.exactMass === 'number' ? chemicalData.physicalProperties.exactMass : parseFloat(chemicalData.physicalProperties.exactMass);
                              if (!Number.isFinite(m)) return null;
                              const H = 1.00728, Na = 22.98922;
                              return (
                                <>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}>
                                    <Typography component="span" variant="caption">[M+H]+</Typography>
                                    <Typography component="span" variant="caption" sx={{ fontFamily: 'monospace' }}>{(m + H).toFixed(2)}</Typography>
                                  </Box>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}>
                                    <Typography component="span" variant="caption">[M-H]-</Typography>
                                    <Typography component="span" variant="caption" sx={{ fontFamily: 'monospace' }}>{(m - H).toFixed(2)}</Typography>
                                  </Box>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}>
                                    <Typography component="span" variant="caption">[M+Na]+</Typography>
                                    <Typography component="span" variant="caption" sx={{ fontFamily: 'monospace' }}>{(m + Na).toFixed(2)}</Typography>
                                  </Box>
                                </>
                              );
                            })()}
                          </Stack>
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
                            p: 0.5,
                            borderRadius: 1,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            '&:hover': {
                              bgcolor: 'action.hover',
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
                            p: 0.5,
                            borderRadius: 1,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            '&:hover': {
                              bgcolor: 'action.hover',
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
                            p: 0.5,
                            borderRadius: 1,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            '&:hover': {
                              bgcolor: 'action.hover',
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
                            p: 0.5,
                            borderRadius: 1,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            '&:hover': {
                              bgcolor: 'action.hover',
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
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1, p: 0.5, borderRadius: 1, bgcolor: 'action.hover' }}>
                              <Typography variant="caption" color="text.secondary">Melting Point (predicted):</Typography>
                              <Typography variant="caption" sx={{ fontWeight: 500 }}>{aiProperties.meltingPoint}</Typography>
                            </Box>
                          )}
                          {aiProperties.boilingPoint && !chemicalData.physicalProperties?.boilingPoint && (
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1, p: 0.5, borderRadius: 1, bgcolor: 'action.hover' }}>
                              <Typography variant="caption" color="text.secondary">Boiling Point (predicted):</Typography>
                              <Typography variant="caption" sx={{ fontWeight: 500 }}>{aiProperties.boilingPoint}</Typography>
                            </Box>
                          )}
                          {aiProperties.solubility && (
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1, p: 0.5, borderRadius: 1, bgcolor: 'action.hover' }}>
                              <Typography variant="caption" color="text.secondary">Aqueous Solubility (predicted):</Typography>
                              <Typography variant="caption" sx={{ fontWeight: 500 }}>{aiProperties.solubility}</Typography>
                            </Box>
                          )}
                          {aiProperties.drugLikeness && (
                            <Box sx={{ p: 0.5, borderRadius: 1, bgcolor: 'action.hover' }}>
                              <Typography variant="caption" color="text.secondary">Drug-likeness:</Typography>
                              <Typography variant="caption" sx={{ display: 'block', mt: 0.25 }}>{aiProperties.drugLikeness}</Typography>
                            </Box>
                          )}
                        </>
                      )}
                      {currentStructure?.smiles && !aiProperties && (
                        (!chemicalData.physicalProperties?.meltingPoint || !chemicalData.physicalProperties?.boilingPoint) && (
                          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 0.5 }}>
                            <Button
                              size="small"
                              variant="text"
                              onClick={handlePredictMissingProperties}
                              disabled={aiPropertiesLoading}
                              startIcon={aiPropertiesLoading ? <CircularProgress size={14} /> : <PsychologyIcon sx={{ fontSize: 15 }} />}
                              sx={{ fontSize: '0.7rem', fontWeight: 500, letterSpacing: '0.03em', color: 'primary.main', '&:hover': { bgcolor: 'action.hover' } }}
                            >
                              {aiPropertiesLoading ? 'Predicting...' : 'Predict melting & boiling point'}
                            </Button>
                          </Box>
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
                  <Box sx={{ p: 1.25, minWidth: 0, borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                    <Box sx={{ py: 0.5, px: 0.75, mb: 0.5, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'action.hover', borderRadius: 0.5, borderLeft: '3px solid', borderLeftColor: 'primary.main' }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.72rem', letterSpacing: '0.08em', color: 'text.primary', textTransform: 'uppercase' }}>
                        Chemical Descriptors
                      </Typography>
                    </Box>
                    <Stack spacing={0.25}>
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
                            p: 0.5,
                            borderRadius: 1,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            '&:hover': {
                              bgcolor: 'action.hover',
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
                            p: 0.5,
                            borderRadius: 1,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            '&:hover': {
                              bgcolor: 'action.hover',
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
                            p: 0.5,
                            borderRadius: 1,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            '&:hover': {
                              bgcolor: 'action.hover',
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
                            p: 0.5,
                            borderRadius: 1,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            '&:hover': {
                              bgcolor: 'action.hover',
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
                            p: 0.5,
                            borderRadius: 1,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            '&:hover': {
                              bgcolor: 'action.hover',
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
                            p: 0.5,
                            borderRadius: 1,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            '&:hover': {
                              bgcolor: 'action.hover',
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
                            p: 0.5,
                            borderRadius: 1,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            '&:hover': {
                              bgcolor: 'action.hover',
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
                            p: 0.5,
                            borderRadius: 1,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            '&:hover': {
                              bgcolor: 'action.hover',
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
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1, p: 0.5, borderRadius: 1, bgcolor: 'action.hover' }}>
                              <Typography variant="caption" color="text.secondary">LogP (predicted):</Typography>
                              <Typography variant="caption" sx={{ fontWeight: 500 }}>{aiProperties.logP.toFixed(2)}</Typography>
                            </Box>
                          )}
                          {aiProperties.tpsa != null && chemicalData.descriptors.tpsa === undefined && (
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1, p: 0.5, borderRadius: 1, bgcolor: 'action.hover' }}>
                              <Typography variant="caption" color="text.secondary">TPSA (predicted):</Typography>
                              <Typography variant="caption" sx={{ fontWeight: 500 }}>{aiProperties.tpsa.toFixed(2)} Å²</Typography>
                            </Box>
                          )}
                        </>
                      )}
                      {currentStructure?.smiles && chemicalData.descriptors && (chemicalData.descriptors.logP === undefined || chemicalData.descriptors.tpsa === undefined) && !aiProperties?.logP && !aiProperties?.tpsa && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 0.5 }}>
                          <Button
                            size="small"
                            variant="text"
                            onClick={handlePredictMissingProperties}
                            disabled={aiPropertiesLoading}
                            startIcon={aiPropertiesLoading ? <CircularProgress size={14} /> : <PsychologyIcon sx={{ fontSize: 15 }} />}
                            sx={{ fontSize: '0.7rem', fontWeight: 500, letterSpacing: '0.03em', color: 'primary.main', '&:hover': { bgcolor: 'action.hover' } }}
                          >
                            {aiPropertiesLoading ? 'Predicting...' : 'Predict logP & TPSA'}
                          </Button>
                        </Box>
                      )}
                    </Stack>
                  </Box>
                )
              )}

              {/* Safety - GHS pictograms, hazard data, AI summary */}
              {(chemicalData.safetyData || aiSafetySummary || currentStructure?.smiles) && (
                <SafetyPanel
                  safetyData={chemicalData.safetyData}
                  aiSafetySummary={aiSafetySummary}
                  onGetSafetySummary={handleGetSafetySummary}
                  aiSafetyLoading={aiSafetyLoading}
                />
              )}

              {/* Stereochemistry (RDKit) – show when chiral centers or when structure present (for Get R/S) */}
              {((stereoInfo && (stereoInfo.chiralCenters > 0 || stereoInfo.unspecifiedCenters > 0 || stereoInfo.inchiWithStereochemistry)) || (currentStructure?.smiles || chemicalData.regulatory?.smiles)) && (
                <Box sx={{ p: 1.25, minWidth: 0, borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                  <Box sx={{ py: 0.5, px: 0.75, mb: 0.5, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'action.hover', borderRadius: 0.5, borderLeft: '3px solid', borderLeftColor: 'primary.main', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <CenterFocusStrongIcon sx={{ fontSize: 14 }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.72rem', letterSpacing: '0.08em', color: 'text.primary', textTransform: 'uppercase' }}>
                      Stereochemistry
                    </Typography>
                  </Box>
                  <Stack spacing={0.25}>
                    {stereoInfo && (
                      <>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minWidth: 0, p: 0.5, borderRadius: 1, bgcolor: 'action.hover' }}>
                      <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>Chiral centers:</Typography>
                      <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.75rem', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {stereoInfo.chiralCenters} total
                      </Typography>
                    </Box>
                    {stereoInfo.unspecifiedCenters > 0 && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minWidth: 0, p: 0.5, borderRadius: 1 }}>
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
                            p: 0.5,
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
                      </>
                    )}
                    {(currentStructure?.smiles || chemicalData.regulatory?.smiles) && (
                      <Box sx={{ mt: 0.5 }}>
                        {aiStereoExplanation ? (
                          <Box
                            onClick={() => handleCopy(aiStereoExplanation, 'R/S labels')}
                            sx={{ p: 0.75, borderRadius: 1, bgcolor: 'action.hover', cursor: 'pointer', '&:hover': { bgcolor: 'action.selected' } }}
                          >
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>R/S (CIP):</Typography>
                            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', fontSize: '0.75rem', lineHeight: 1.5 }}>{aiStereoExplanation}</Typography>
                          </Box>
                        ) : (
                          <Button
                            size="small"
                            variant="text"
                            onClick={handleGetStereoExplanation}
                            disabled={aiStereoLoading}
                            startIcon={aiStereoLoading ? <CircularProgress size={14} /> : <PsychologyIcon sx={{ fontSize: 15 }} />}
                            sx={{ fontSize: '0.7rem', fontWeight: 500, color: 'primary.main', textTransform: 'none' }}
                          >
                            {aiStereoLoading ? 'Getting R/S...' : 'Get R/S (CIP) labels'}
                          </Button>
                        )}
                      </Box>
                    )}
                  </Stack>
                </Box>
              )}

              {/* Spectral Data */}
              {chemicalData.spectral && (
                (chemicalData.spectral.irSpectrum || 
                 chemicalData.spectral.massSpectrum) && (
                  <Box sx={{ p: 1.25, minWidth: 0, borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                    <Box sx={{ py: 0.5, px: 0.75, mb: 0.5, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'action.hover', borderRadius: 0.5, borderLeft: '3px solid', borderLeftColor: 'primary.main' }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.72rem', letterSpacing: '0.08em', color: 'text.primary', textTransform: 'uppercase' }}>
                        Spectral Data
                      </Typography>
                    </Box>
                    <Stack spacing={0.25}>
                      {chemicalData.spectral.irSpectrum && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minWidth: 0, p: 0.5, borderRadius: 1 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>IR Spectrum:</Typography>
                          <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.75rem', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {chemicalData.spectral.irSpectrum}
                          </Typography>
                        </Box>
                      )}
                      {chemicalData.spectral.massSpectrum && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minWidth: 0, p: 0.5, borderRadius: 1 }}>
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
                      <Box sx={{ p: 1.25, minWidth: 0, borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                        <Box sx={{ py: 0.5, px: 0.75, mb: 0.5, bgcolor: 'action.hover', borderRadius: 0.5, borderLeft: '3px solid', borderLeftColor: 'primary.main', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <PsychologyIcon fontSize="small" color="primary" />
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.72rem', letterSpacing: '0.08em', color: 'text.primary', textTransform: 'uppercase' }}>
                            Unrecognized Structure
                          </Typography>
                        </Box>
                        {aiIupacName ? (
                          <Box
                            onClick={() => handleCopy(aiIupacName, 'IUPAC Name')}
                            sx={{ cursor: 'pointer', p: 0.5, borderRadius: 1, '&:hover': { bgcolor: 'action.hover' } }}
                          >
                            <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>IUPAC (AI):</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 500, color: 'primary.main' }}>{aiIupacName}</Typography>
                          </Box>
                        ) : (
                          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 0.5, minWidth: 0, flex: 1, overflow: 'hidden' }}>
                            <Button
                              size="small"
                              variant="text"
                              onClick={handleGetAiIupacName}
                              disabled={aiIupacLoading}
                              startIcon={aiIupacLoading ? <CircularProgress size={14} /> : <PsychologyIcon sx={{ fontSize: 15 }} />}
                              sx={{
                                fontSize: '0.7rem',
                                fontWeight: 500,
                                letterSpacing: '0.03em',
                                color: 'primary.main',
                                '&:hover': { bgcolor: 'action.hover' },
                              }}
                            >
                              {aiIupacLoading ? 'Getting name...' : 'Get AI Name'}
                            </Button>
                          </Box>
                        )}
                      </Box>
                    )}

                    {/* AI Assistant — premium accordion */}
                    <Box ref={aiSectionRef} id="ai-chemistry-section">
                      <Accordion
                        expanded={aiSectionExpanded}
                        onChange={(_, exp) => setAiSectionExpanded(!!exp)}
                        sx={{
                          '&:before': { display: 'none' },
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 1,
                          overflow: 'hidden',
                          minWidth: 0,
                        }}
                      >
                        <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ fontSize: 18 }} />} sx={{ minHeight: 36, px: 1.25, '& .MuiAccordionSummary-content': { my: 0.25, alignItems: 'center' } }}>
                          <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.05em', color: 'text.secondary', textTransform: 'uppercase' }}>
                            <PsychologyIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                            AI Assistant
                          </Typography>
                        </AccordionSummary>
                        <AccordionDetails sx={{ pt: 0, px: 1.25, pb: 1.25, minWidth: 0 }}>
                          <AIIntegration
                            smiles={currentStructure?.smiles ?? undefined}
                            molfile={currentStructure?.molfile ?? undefined}
                            initialAnalysisType={aiAnalysisType}
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

                    {/* Empty state or search not found */}
                    {!recognizedCompound && !currentStructure?.smiles && (
                      <Box sx={{ p: 1.5, minWidth: 0, borderRadius: 1, border: '1px dashed', borderColor: 'divider', textAlign: 'center', minHeight: 48 }}>
                        {searchNotFound ? (
                          <Box>
                            <Typography variant="body2" color="error.main" sx={{ fontWeight: 500, mb: 0.5 }}>
                              Compound not found: {searchNotFound}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                              Try a different name or draw the structure
                            </Typography>
                            <Button size="small" variant="outlined" onClick={() => setSearchNotFound(null)}>
                              Dismiss
                            </Button>
                          </Box>
                        ) : (
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', letterSpacing: '0.04em', fontWeight: 500 }}>
                            Draw a structure or search for a compound to see detailed information
                          </Typography>
                        )}
                      </Box>
                    )}
                  </Stack>
                  )}
                </Box>
              </Box>
                </>
              );
          })()}
        </Box>

        {/* Snackbar for notifications — longer for "not found" so user sees it */}
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={snackbarMessage?.toLowerCase().includes('not found') ? 6000 : 4000}
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

        <BatchNMRDialog open={showBatchNMRDialog} onClose={() => setShowBatchNMRDialog(false)} />
        <BatchExportDialog open={showBatchExportDialog} onClose={() => setShowBatchExportDialog(false)} />
        <LiteratureSearchDialog
          open={showLiteratureDialog}
          onClose={() => setShowLiteratureDialog(false)}
          cid={recognizedCompound?.cid ?? null}
          compoundName={recognizedCompound?.name}
        />

        <SimilaritySearchDialog
          open={showSimilarityDialog}
          onClose={() => setShowSimilarityDialog(false)}
          smiles={currentStructure?.smiles ?? chemicalData?.regulatory?.smiles ?? null}
          onCompoundSelect={handleSimilarityCompoundSelect}
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

        <FAQDialog
          open={showFaqDialog}
          onClose={() => setShowFaqDialog(false)}
        />

        <DocumentSettings
          open={showDocumentSettings}
          onClose={() => setShowDocumentSettings(false)}
          ketcherInstance={ketcherRef.current}
        />

        <AccessibilityMenu
          open={showAccessibilityMenu}
          onClose={() => setShowAccessibilityMenu(false)}
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
              <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 600, mt: 1 }}>Reaction conditions (text above/below arrows):</Typography>
              <Typography variant="body2" component="ol" sx={{ pl: 2, '& li': { mb: 1 } }}>
                <li><strong>Add conditions:</strong> Select the reaction arrow, then use the <strong>Text</strong> tool (or double-click near the arrow) to add reagent/condition text</li>
                <li>Place text <strong>above</strong> the arrow for reagents (e.g. H₂SO₄, heat)</li>
                <li>Place text <strong>below</strong> the arrow for solvents or additional conditions</li>
                <li>Use the <strong>Plus (+)</strong> tool to add reactant/product separators between structures</li>
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
                        <KbdKey>Shift</KbdKey>
                        <Typography component="span" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>+</Typography>
                        <KbdKey>F</KbdKey>
                      </Box>
                      <Typography variant="body2" color="text.secondary">Copy image as PNG (or use Copy dropdown in toolbar above canvas)</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
                        <KbdKey>Ctrl</KbdKey>
                        <Typography component="span" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>+</Typography>
                        <KbdKey>C</KbdKey>
                      </Box>
                      <Typography variant="body2" color="text.secondary">Copy structure (image + editable for canvas paste)</Typography>
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
                  <Typography variant="overline" sx={{ fontWeight: 700, color: 'primary.main', letterSpacing: 1, display: 'block', mb: 1.5 }}>FindMolecule ELN</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Export → Copy for FindMolecule (paste into ELN). Install the Chrome extension + native host for browser clipboard. Desktop: uses native clipboard directly.
                  </Typography>
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
                <Box sx={{ mb: 2 }}>
                  <Typography variant="overline" sx={{ fontWeight: 700, color: 'primary.main', letterSpacing: 1, display: 'block', mb: 1.5 }}>Bond Types</Typography>
                  <Stack spacing={1}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                      <KbdKey>1</KbdKey>
                      <Typography variant="body2" color="text.secondary">Single bond</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                      <KbdKey>2</KbdKey>
                      <Typography variant="body2" color="text.secondary">Double bond</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                      <KbdKey>3</KbdKey>
                      <Typography variant="body2" color="text.secondary">Triple bond</Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Use the <strong>Bond Type Bar</strong> above the canvas for Single, Double, Triple, Wedge, Hash, Wavy. Select a bond and click a type to change it.
                    </Typography>
                  </Stack>
                </Box>
                <Box>
                  <Typography variant="overline" sx={{ fontWeight: 700, color: 'text.secondary', letterSpacing: 1, display: 'block', mb: 1.5 }}>Stereochemistry (Wedge/Dash)</Typography>
                  <Typography variant="body2" color="text.secondary">
                    In the <strong>left toolbar</strong>: click the <strong>Bond</strong> tool, then use the bond-type submenu. Or use the <strong>Bond Type Bar</strong> above the canvas (wedge up, wedge down, wavy).
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
  );
};

export default AppLayout;