/**
 * AIIntegration Component
 * AI-powered chemistry features including structure-to-name, reaction prediction, and property analysis
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useAIContext, appendUserContext } from '@/contexts/AIContext';
import {
  Box,
  Typography,
  Button,
  Stack,
  Chip,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
} from '@mui/material';
import {
  Psychology as AIIcon,
  Science as ChemistryIcon,
  ContentCopy as CopyIcon,
  CheckCircle as SuccessIcon,
  PlayArrow as PlayIcon,
} from '@mui/icons-material';
import { stripMarkdown } from '@/lib/utils/stripMarkdown';

interface AIIntegrationProps {
  smiles?: string;
  molfile?: string;
  /** Summary of data we already have from PubChem - AI should NOT repeat this */
  existingData?: {
    name?: string;
    iupacName?: string;
    molecularFormula?: string;
    molecularWeight?: number;
    logP?: number;
    tpsa?: number;
    casNumber?: string;
    cid?: number;
  };
  onStructureGenerated?: (smiles: string, name: string) => void;
  onError?: (error: string) => void;
}

/** Parse AI free-form response into structured AIAnalysis */
function parseAIAnalysisResponse(content: string, analysisType: string): AIAnalysis {
  const lines = content.split('\n').map((l) => l.trim()).filter(Boolean);
  const analysis: AIAnalysis = {};

  const extractAfter = (prefix: string): string | undefined => {
    const line = lines.find((l) => l.toLowerCase().startsWith(prefix.toLowerCase()));
    if (line) {
      const idx = line.indexOf(':');
      return idx >= 0 ? line.slice(idx + 1).trim() : line.slice(prefix.length).trim();
    }
    return undefined;
  };

  const iupacMatch = content.match(/(?:IUPAC\s*name?|IUPAC:)\s*[:–-]?\s*([^\n(]+)/i);
  if (iupacMatch) analysis.iupacName = iupacMatch[1].trim();
  const commonMatch = content.match(/\(([^)]+)\)/);
  if (commonMatch && commonMatch[1].length < 50) analysis.commonName = commonMatch[1].trim();

  const mwMatch = content.match(/(?:MW|molecular weight)[:\s]+(\d+\.?\d*)/i);
  const logPMatch = content.match(/(?:logP|LogP)[:\s]+([-\d.]+)/i);
  if (mwMatch || logPMatch) {
    analysis.predictedProperties = {};
    if (mwMatch) analysis.predictedProperties.mw = parseFloat(mwMatch[1]);
    if (logPMatch) analysis.predictedProperties.logP = parseFloat(logPMatch[1]);
  }

  const scoreMatch = content.match(/(?:score|drug[- ]?likeness)[:\s]+(\d+)/i);
  if (scoreMatch) {
    analysis.drugLikeness = {
      overallScore: parseInt(scoreMatch[1], 10),
      lipinskiViolations: 0,
      veberViolations: 0,
      recommendations: [],
    };
  }

  const reactionBlocks = content.split(/(?=\d+[.)]\s*(?:reaction|hydrolysis|esterification|oxidation|reduction|substitution|etc\.?))/i);
  if (reactionBlocks.length > 1) {
    analysis.reactionPredictions = reactionBlocks.slice(1).slice(0, 4).map((block) => {
      const firstLine = block.split('\n')[0]?.trim() || '';
      const name = firstLine.replace(/^\d+[.)]\s*/, '').slice(0, 80);
      return {
        reaction: name,
        probability: 0.7,
        conditions: 'See details',
        products: [],
      };
    });
  }

  const safetyLines = lines.filter((l) => /(?:safety|hazard|precaution|warning)/i.test(l) && l.length > 10);
  if (safetyLines.length > 0) analysis.safetyWarnings = safetyLines.slice(0, 5);

  const synthLines = lines.filter((l) => /(?:synthesis|suggest|start with|use )/i.test(l) && l.length > 15);
  if (synthLines.length > 0) analysis.synthesisSuggestions = synthLines.slice(0, 5);

  if (!analysis.iupacName && analysisType === 'naming') analysis.iupacName = content.split('\n')[0]?.trim() || content.slice(0, 200);
  if (Object.keys(analysis).length === 0) analysis.iupacName = content.slice(0, 500);

  analysis.aiRawText = content;
  return analysis;
}

interface AIAnalysis {
  iupacName?: string;
  commonName?: string;
  predictedProperties?: {
    logP?: number;
    tpsa?: number;
    mw?: number;
    hbd?: number;
    hba?: number;
    rotatableBonds?: number;
    aromaticRings?: number;
  };
  drugLikeness?: {
    lipinskiViolations?: number;
    veberViolations?: number;
    overallScore?: number;
    recommendations?: string[];
  };
  reactionPredictions?: Array<{
    reaction: string;
    probability: number;
    conditions: string;
    products: string[];
  }>;
  safetyWarnings?: string[];
  synthesisSuggestions?: string[];
  aiRawText?: string;
}

export const AIIntegration: React.FC<AIIntegrationProps> = ({
  smiles,
  molfile,
  existingData,
  onStructureGenerated,
  onError,
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [analysisType, setAnalysisType] = useState<'comprehensive' | 'naming' | 'properties' | 'reactions' | 'safety'>('comprehensive');
  const [progress, setProgress] = useState(0);
  const resultsRef = useRef<HTMLDivElement>(null);

  const { context: aiContext } = useAIContext();

  // Scroll results into view when analysis completes
  useEffect(() => {
    if (analysis && !isAnalyzing) {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [analysis, isAnalyzing]);

  const getSmilesForPrompt = useCallback(async (): Promise<string> => {
    const { getFirstStructureSmiles } = await import('@/lib/chemistry/openchemlib');
    const { prepareSmilesForAI } = await import('@/lib/openai/chemistry');
    let s = (smiles ?? '').trim();
    if (!s && molfile) {
      const { molfileToSmiles } = await import('@/lib/chemistry/openchemlib');
      let smi = molfileToSmiles(molfile);
      if (!smi) {
        const { molfileToSmiles: rdkitMol } = await import('@/lib/chemistry/rdkit');
        smi = await rdkitMol(molfile);
      }
      s = smi ?? '';
    }
    const prepared = prepareSmilesForAI(s, 500);
    return prepared ?? '';
  }, [smiles, molfile]);

  const handleAIAnalysis = useCallback(async () => {
    if (!smiles && !molfile) {
      setError('Please provide a structure for AI analysis');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setProgress(0);
    setAnalysis(null);

    try {
      setProgress(20);
      const smi = (await getSmilesForPrompt()).trim();
      if (!smi || smi.length < 2 || !/[A-Za-z\[\]\(\)=#@\+\-\d]/.test(smi)) {
        throw new Error('Could not get valid SMILES for structure');
      }

      const hasExisting = existingData && [
        existingData.name,
        existingData.iupacName,
        existingData.molecularFormula,
        existingData.molecularWeight,
        existingData.logP,
        existingData.tpsa,
        existingData.casNumber,
      ].some(Boolean);
      const skipNote = hasExisting
        ? `\n\nIMPORTANT: User already has from PubChem: ${[
            existingData!.name && 'name',
            existingData!.iupacName && 'IUPAC',
            existingData!.molecularFormula && 'formula',
            existingData!.molecularWeight != null && 'MW',
            existingData!.logP != null && 'LogP',
            existingData!.tpsa != null && 'TPSA',
            existingData!.casNumber && 'CAS',
          ].filter(Boolean).join(', ')}. Do NOT repeat these. Only provide NEW info (reactions, synthesis, safety insights). Plain text only, no markdown.`
        : '\n\nPlain text only, no markdown (no **, ##, *, etc).';

      const promptByType: Record<string, string> = {
        comprehensive: `Analyze this molecule (SMILES: ${smi}). Provide ONLY information the user does not already have. Focus on: drug-likeness assessment, likely chemical reactions with conditions, safety insights beyond databases, synthesis suggestions.${skipNote}`,
        naming: `Given SMILES: ${smi}, provide the IUPAC name and common name if applicable.${existingData?.iupacName ? ' User already has IUPAC - provide only if you have a different/better name.' : ''}${skipNote}`,
        properties: `For SMILES: ${smi}, list ONLY properties the user might not have: drug-likeness, TPSA interpretation, HBD/HBA, rotatable bonds. Skip MW, LogP, formula if user already has them.${skipNote}`,
        reactions: `For SMILES: ${smi}, suggest 3-4 likely chemical reactions with realistic conditions, reagents, and products. Explain the chemistry.${skipNote}`,
        safety: `For SMILES: ${smi}, provide safety considerations, handling precautions, and hazards.${skipNote}`,
      };
      const userPrompt = appendUserContext(
        promptByType[analysisType] ?? promptByType.comprehensive,
        aiContext
      );

      setProgress(40);
      const { chatWithOpenAI } = await import('@/lib/openai');
      const content = await chatWithOpenAI([
        {
          role: 'system',
          content: 'You are an expert chemist. Provide detailed, factual analysis. Use plain text only—no markdown (no **, ##, *, bullets, or formatting symbols). Do not repeat information the user already has from PubChem.',
        },
        { role: 'user', content: userPrompt },
      ]);

      setProgress(90);
      const parsed = parseAIAnalysisResponse(content, analysisType);
      setAnalysis(parsed);
    } catch (err) {
      const errorMessage = (err as Error).message || 'AI analysis failed';
      setError(errorMessage);
      if (onError) onError(errorMessage);
    } finally {
      setIsAnalyzing(false);
      setProgress(0);
    }
  }, [smiles, molfile, analysisType, getSmilesForPrompt, onError, aiContext]);

  const handleGenerateName = useCallback(async () => {
    if (!smiles && !molfile) {
      setError('Please provide a structure for name generation');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const smi = (await getSmilesForPrompt()).trim();
      if (!smi || smi.length < 2) {
        throw new Error('Could not get SMILES for structure');
      }
      const nameUserMsg = appendUserContext(`Given SMILES: ${smi}, provide the IUPAC name.`, aiContext);
      const { chatWithOpenAI } = await import('@/lib/openai');
      const content = await chatWithOpenAI([
        {
          role: 'system',
          content: 'You are a chemistry expert. Reply with ONLY the IUPAC name. If there is a common name, add it in parentheses on the same line. Use plain text only—no markdown (no **, ##, *, etc).',
        },
        { role: 'user', content: nameUserMsg },
      ]);
      const name = content.trim().split('\n')[0]?.trim() || content.trim();
      setAnalysis({ iupacName: name, commonName: undefined, aiRawText: content });
      if (onStructureGenerated && smi) onStructureGenerated(smi, name);
    } catch (err) {
      const errorMessage = (err as Error).message || 'Name generation failed';
      setError(errorMessage);
    } finally {
      setIsAnalyzing(false);
    }
  }, [smiles, molfile, getSmilesForPrompt, onStructureGenerated, aiContext]);

  const handlePredictReactions = useCallback(async () => {
    if (!smiles && !molfile) {
      setError('Please provide a structure for reaction prediction');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setAnalysis(null);

    try {
      const smi = (await getSmilesForPrompt()).trim();
      if (!smi || smi.length < 2) {
        throw new Error('Could not get SMILES for structure');
      }
      const reactionsUserMsg = appendUserContext(`For SMILES: ${smi}, suggest 3-4 likely chemical reactions. For each: reaction name, conditions (solvent, temperature, catalyst), reagents, and products. Explain why these reactions are plausible.`, aiContext);
      const { chatWithOpenAI } = await import('@/lib/openai');
      const content = await chatWithOpenAI([
        {
          role: 'system',
          content: 'You are an expert organic chemist. Provide detailed, factual reaction predictions with realistic conditions, reagents, and products. Explain the chemistry and mechanisms where relevant.',
        },
        { role: 'user', content: reactionsUserMsg },
      ]);
      setAnalysis(parseAIAnalysisResponse(content, 'reactions'));
    } catch (err) {
      const errorMessage = (err as Error).message || 'Reaction prediction failed';
      setError(errorMessage);
    } finally {
      setIsAnalyzing(false);
    }
  }, [smiles, molfile, getSmilesForPrompt, aiContext]);

  const getDrugLikenessColor = (score: number) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  const getDrugLikenessLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Poor';
  };

  const handleCopyResult = useCallback((text: string) => {
    navigator.clipboard?.writeText(text);
  }, []);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {/* Controls: compact layout */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 0.5 }}>
        <FormControl size="small" sx={{ minWidth: 120, '& .MuiInputBase-root': { fontSize: '0.8rem' } }}>
          <InputLabel>Analysis Type</InputLabel>
          <Select
            value={analysisType}
            onChange={(e) => setAnalysisType(e.target.value as any)}
            label="Analysis Type"
          >
            <MenuItem value="comprehensive">Comprehensive</MenuItem>
            <MenuItem value="naming">IUPAC Naming</MenuItem>
            <MenuItem value="properties">Properties</MenuItem>
            <MenuItem value="reactions">Reactions</MenuItem>
            <MenuItem value="safety">Safety</MenuItem>
          </Select>
        </FormControl>
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
          <Button
            size="small"
            variant="contained"
            onClick={handleAIAnalysis}
            disabled={isAnalyzing || (!smiles && !molfile)}
            startIcon={isAnalyzing ? <CircularProgress size={14} color="inherit" /> : <AIIcon sx={{ fontSize: 16 }} />}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            {isAnalyzing ? 'Analyzing...' : 'Run Analysis'}
          </Button>
          <Button size="small" variant="outlined" onClick={handleGenerateName} disabled={isAnalyzing || (!smiles && !molfile)} startIcon={<ChemistryIcon sx={{ fontSize: 16 }} />} sx={{ textTransform: 'none' }}>
            Generate Name
          </Button>
          <Button size="small" variant="outlined" onClick={handlePredictReactions} disabled={isAnalyzing || (!smiles && !molfile)} startIcon={<PlayIcon sx={{ fontSize: 16 }} />} sx={{ textTransform: 'none' }}>
            Predict Reactions
          </Button>
        </Box>
      </Box>

      {/* Progress */}
      {isAnalyzing && (
        <LinearProgress variant="determinate" value={progress} sx={{ borderRadius: 1, height: 3 }} />
      )}

      {/* Error - prominent when proxy down */}
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ '& .MuiAlert-message': { fontSize: '0.8125rem' } }}>
          {error}
        </Alert>
      )}

      {/* Analysis Results */}
      {analysis && (
        <Stack ref={resultsRef} spacing={1.5}>
          {analysis.aiRawText && (
            <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5, overflow: 'hidden' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 1.5, py: 1, bgcolor: 'action.hover', borderBottom: '1px solid', borderColor: 'divider' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <SuccessIcon color="success" sx={{ fontSize: 18 }} />
                  Analysis Result
                </Typography>
                <Button size="small" variant="text" startIcon={<CopyIcon sx={{ fontSize: 14 }} />} onClick={() => handleCopyResult(stripMarkdown(analysis.aiRawText!))} sx={{ minWidth: 0, px: 1, fontSize: '0.75rem' }}>
                  Copy
                </Button>
              </Box>
              <Box sx={{ p: 1.5, maxHeight: 320, overflow: 'auto' }}>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.5, fontSize: '0.8rem' }}>
                    {stripMarkdown(analysis.aiRawText)}
                  </Typography>
              </Box>
            </Box>
          )}
          {analysis.iupacName && analysis.iupacName.length < 200 && (
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, flexWrap: 'wrap' }}>
              <Typography variant="caption" color="text.secondary">IUPAC:</Typography>
              <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 500 }}>{analysis.iupacName}</Typography>
              {analysis.commonName && <Typography variant="caption" color="text.secondary">({analysis.commonName})</Typography>}
            </Box>
          )}
          {analysis.predictedProperties && Object.keys(analysis.predictedProperties).length > 0 && (
            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
              {Object.entries(analysis.predictedProperties).map(([key, value]) => (
                <Chip key={key} size="small" label={`${key.toUpperCase()}: ${typeof value === 'number' ? value.toFixed(2) : value}`} variant="outlined" />
              ))}
            </Box>
          )}
          {analysis.drugLikeness?.overallScore != null && (
            <Chip size="small" label={`Drug-likeness: ${analysis.drugLikeness.overallScore}/100`} color={getDrugLikenessColor(analysis.drugLikeness.overallScore) as any} />
          )}
        </Stack>
      )}

      {!smiles && !molfile && !isAnalyzing && !analysis && (
        <Box sx={{ py: 1, textAlign: 'center' }}>
          <AIIcon sx={{ fontSize: 24, opacity: 0.35 }} />
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.25, fontSize: '0.7rem' }}>
            Draw or search for a structure to analyze
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default AIIntegration;
