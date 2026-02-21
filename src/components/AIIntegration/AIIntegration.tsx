/**
 * AIIntegration Component
 * AI-powered chemistry features including structure-to-name, reaction prediction, and property analysis
 */

import React, { useState, useCallback } from 'react';
import { useAIContext, appendUserContext } from '@/contexts/AIContext';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Chip,
  CircularProgress,
  Alert,
  TextField,
  FormControl,
  InputLabel,
  Select,
  Grid,
  MenuItem,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Tooltip,
  LinearProgress,
} from '@mui/material';
import {
  Psychology as AIIcon,
  Science as ChemistryIcon,
  AutoAwesome as SparkleIcon,
  Refresh as RefreshIcon,
  ContentCopy as CopyIcon,
  CheckCircle as SuccessIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  ExpandMore as ExpandMoreIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
} from '@mui/icons-material';

interface AIIntegrationProps {
  smiles?: string;
  molfile?: string;
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
  onStructureGenerated,
  onError,
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [analysisType, setAnalysisType] = useState<'comprehensive' | 'naming' | 'properties' | 'reactions' | 'safety'>('comprehensive');
  const [progress, setProgress] = useState(0);

  const { context: aiContext } = useAIContext();

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

      const promptByType: Record<string, string> = {
        comprehensive: `Analyze this molecule (SMILES: ${smi}). Provide a detailed, factual analysis in clear sections:
1) IUPAC Name and common name(s) with structural context
2) Key physicochemical properties (MW, LogP, HBD/HBA, TPSA, rotatable bonds) with typical interpretation
3) Drug-likeness assessment (Lipinski/Veber rules, score 0-100, specific recommendations)
4) 3-4 likely chemical reactions with realistic conditions, reagents, and products
5) Safety considerations, handling precautions, and known hazards
6) Synthesis suggestions with plausible routes`,
        naming: `Given SMILES: ${smi}, provide the IUPAC name and common name if applicable. Include structural context.`,
        properties: `For SMILES: ${smi}, list key molecular properties (MW, LogP, TPSA, HBD, HBA, rotatable bonds, aromatic rings) with brief interpretation of each.`,
        reactions: `For SMILES: ${smi}, suggest 3-4 likely chemical reactions with realistic conditions, reagents, and products. Explain the chemistry.`,
        safety: `For SMILES: ${smi}, provide detailed safety considerations, handling precautions, and any known hazards. Be thorough.`,
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
          content: 'You are an expert chemist. Provide detailed, factual, educational analysis. Use accurate terminology and cite well-established chemical principles. Be thorough and informative.',
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
          content: 'You are a chemistry expert. Reply with ONLY the IUPAC name. If there is a common name, add it in parentheses on the same line, e.g. "IUPAC name (common name)". No other text.',
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

  return (
    <Box sx={{ p: 0 }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5, lineHeight: 1.4 }}>
        Use when PubChem has no match, or for extra analysis.
      </Typography>

      {/* Row: Analysis type */}
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
        <FormControl size="small" sx={{ minWidth: 140, flex: 1 }}>
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
      </Stack>

      {/* Action buttons - single row, consistent style */}
      <Stack direction="row" spacing={0.75} flexWrap="wrap" sx={{ gap: 0.75, mb: 1.5 }}>
        <Button
          size="small"
          variant="contained"
          onClick={handleAIAnalysis}
          disabled={isAnalyzing || (!smiles && !molfile)}
          startIcon={isAnalyzing ? <CircularProgress size={14} /> : <AIIcon sx={{ fontSize: 16 }} />}
          sx={{ fontSize: '0.7rem', textTransform: 'none' }}
        >
          {isAnalyzing ? 'Analyzing...' : 'Run Analysis'}
        </Button>
        <Button
          size="small"
          variant="outlined"
          onClick={handleGenerateName}
          disabled={isAnalyzing || (!smiles && !molfile)}
          startIcon={<ChemistryIcon sx={{ fontSize: 16 }} />}
          sx={{ fontSize: '0.7rem', textTransform: 'none' }}
        >
          Generate Name
        </Button>
        <Button
          size="small"
          variant="outlined"
          onClick={handlePredictReactions}
          disabled={isAnalyzing || (!smiles && !molfile)}
          startIcon={<PlayIcon sx={{ fontSize: 16 }} />}
          sx={{ fontSize: '0.7rem', textTransform: 'none' }}
        >
          Predict Reactions
        </Button>
      </Stack>

      {/* Progress Bar */}
      {isAnalyzing && (
        <Box sx={{ mb: 3 }}>
          <LinearProgress variant="determinate" value={progress} />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            AI Analysis Progress: {Math.round(progress)}%
          </Typography>
        </Box>
      )}

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 1.5 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Analysis Results */}
      {analysis && (
        <Stack spacing={3}>
          {/* Full AI Response (for comprehensive / when parsing is minimal) */}
          {analysis.aiRawText && (analysisType === 'comprehensive' || analysisType === 'reactions' || analysisType === 'safety' || analysisType === 'properties') && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SuccessIcon color="success" />
                  AI Analysis
                </Typography>
                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default', maxHeight: 400, overflow: 'auto' }}>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {analysis.aiRawText}
                  </Typography>
                </Paper>
              </CardContent>
            </Card>
          )}
          {/* IUPAC Name */}
          {analysis.iupacName && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SuccessIcon color="success" />
                  IUPAC Name
                </Typography>
                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
                  <Typography variant="h6" sx={{ fontFamily: 'monospace' }}>
                    {analysis.iupacName}
                  </Typography>
                  {analysis.commonName && (
                    <Typography variant="body2" color="text.secondary">
                      Common name: {analysis.commonName}
                    </Typography>
                  )}
                </Paper>
              </CardContent>
            </Card>
          )}

          {/* Predicted Properties */}
          {analysis.predictedProperties && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Predicted Properties
                </Typography>
                <Grid container spacing={2}>
                  {Object.entries(analysis.predictedProperties).map(([key, value]) => (
                    <Grid size={{ xs: 6, sm: 4 }} key={key}>
                      <Paper variant="outlined" sx={{ p: 1, textAlign: 'center' }}>
                        <Typography variant="caption" color="text.secondary" display="block">
                          {key.toUpperCase()}
                        </Typography>
                        <Typography variant="h6" color="primary">
                          {typeof value === 'number' ? value.toFixed(2) : value}
                        </Typography>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          )}

          {/* Drug Likeness */}
          {analysis.drugLikeness && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Drug Likeness Analysis
                </Typography>
                <Stack spacing={2}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="body1">Overall Score:</Typography>
                    <Chip
                      label={`${analysis.drugLikeness.overallScore}/100 - ${getDrugLikenessLabel(analysis.drugLikeness.overallScore || 0)}`}
                      color={getDrugLikenessColor(analysis.drugLikeness.overallScore || 0) as any}
                      variant="filled"
                    />
                  </Box>
                  
                  <Box>
                    <Typography variant="body2" gutterBottom>
                      Lipinski Violations: {analysis.drugLikeness.lipinskiViolations}/5
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      Veber Violations: {analysis.drugLikeness.veberViolations}/2
                    </Typography>
                  </Box>

                  {analysis.drugLikeness.recommendations && (
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        Recommendations:
                      </Typography>
                      <List dense>
                        {analysis.drugLikeness.recommendations.map((rec, index) => (
                          <ListItem key={index}>
                            <ListItemIcon>
                              <WarningIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText primary={rec} />
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  )}
                </Stack>
              </CardContent>
            </Card>
          )}

          {/* Reaction Predictions */}
          {analysis.reactionPredictions && analysis.reactionPredictions.length > 0 && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Predicted Reactions
                </Typography>
                <Stack spacing={2}>
                  {analysis.reactionPredictions.map((reaction, index) => (
                    <Accordion key={index}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Stack direction="row" alignItems="center" spacing={2} sx={{ width: '100%' }}>
                          <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
                            {reaction.reaction}
                          </Typography>
                          <Chip
                            label={`${Math.round(reaction.probability * 100)}%`}
                            color={reaction.probability > 0.7 ? 'success' : reaction.probability > 0.4 ? 'warning' : 'error'}
                            size="small"
                          />
                        </Stack>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Stack spacing={1}>
                          <Typography variant="body2">
                            <strong>Conditions:</strong> {reaction.conditions}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Products:</strong> {reaction.products.join(', ')}
                          </Typography>
                        </Stack>
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          )}

          {/* Safety Warnings */}
          {analysis.safetyWarnings && analysis.safetyWarnings.length > 0 && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <WarningIcon color="warning" />
                  Safety Warnings
                </Typography>
                <List dense>
                  {analysis.safetyWarnings.map((warning, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <ErrorIcon color="error" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary={warning} />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          )}

          {/* Synthesis Suggestions */}
          {analysis.synthesisSuggestions && analysis.synthesisSuggestions.length > 0 && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Synthesis Suggestions
                </Typography>
                <List dense>
                  {analysis.synthesisSuggestions.map((suggestion, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <ChemistryIcon color="primary" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary={suggestion} />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          )}
        </Stack>
      )}

      {/* Empty State */}
      {!smiles && !molfile && !isAnalyzing && (
        <Box
          sx={{
            textAlign: 'center',
            py: 4,
            color: 'text.secondary',
          }}
        >
          <AIIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
          <Typography variant="body2">
            Draw a structure to run AI analysis
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default AIIntegration;
