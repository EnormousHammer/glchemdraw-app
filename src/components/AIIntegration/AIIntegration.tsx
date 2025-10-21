/**
 * AIIntegration Component
 * AI-powered chemistry features including structure-to-name, reaction prediction, and property analysis
 */

import React, { useState, useCallback } from 'react';
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

  const handleAIAnalysis = useCallback(async () => {
    if (!smiles && !molfile) {
      setError('Please provide a structure for AI analysis');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setProgress(0);

    try {
      // Simulate AI analysis with progress updates
      const analysisSteps = [
        'Initializing AI models...',
        'Analyzing molecular structure...',
        'Generating IUPAC name...',
        'Calculating properties...',
        'Predicting drug-likeness...',
        'Analyzing reaction possibilities...',
        'Checking safety warnings...',
        'Generating synthesis suggestions...',
        'Finalizing analysis...'
      ];

      for (let i = 0; i < analysisSteps.length; i++) {
        setProgress((i + 1) * (100 / analysisSteps.length));
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Mock AI analysis results
      const mockAnalysis: AIAnalysis = {
        iupacName: '2-acetoxybenzoic acid',
        commonName: 'Aspirin',
        predictedProperties: {
          logP: 1.19,
          tpsa: 63.6,
          mw: 180.16,
          hbd: 1,
          hba: 4,
          rotatableBonds: 3,
          aromaticRings: 1,
        },
        drugLikeness: {
          lipinskiViolations: 0,
          veberViolations: 0,
          overallScore: 85,
          recommendations: [
            'Good oral bioavailability potential',
            'Consider improving solubility for better absorption',
            'Molecular weight is within acceptable range'
          ]
        },
        reactionPredictions: [
          {
            reaction: 'Hydrolysis',
            probability: 0.85,
            conditions: 'Aqueous acid, heat',
            products: ['Salicylic acid', 'Acetic acid']
          },
          {
            reaction: 'Esterification',
            probability: 0.72,
            conditions: 'H2SO4, heat',
            products: ['Methyl aspirin']
          },
          {
            reaction: 'Aromatic substitution',
            probability: 0.45,
            conditions: 'HNO3, H2SO4',
            products: ['Nitro aspirin']
          }
        ],
        safetyWarnings: [
          'May cause gastrointestinal irritation',
          'Avoid in patients with bleeding disorders',
          'Monitor for allergic reactions'
        ],
        synthesisSuggestions: [
          'Start with salicylic acid and acetic anhydride',
          'Use sulfuric acid as catalyst',
            'Purify by recrystallization from ethanol',
            'Consider green chemistry alternatives'
        ]
      };

      setAnalysis(mockAnalysis);
      
    } catch (err) {
      const errorMessage = (err as Error).message || 'AI analysis failed';
      setError(errorMessage);
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setIsAnalyzing(false);
      setProgress(0);
    }
  }, [smiles, molfile, onError]);

  const handleGenerateName = async () => {
    if (!smiles && !molfile) {
      setError('Please provide a structure for name generation');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      // Simulate AI name generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockName = '2-acetoxybenzoic acid (Aspirin)';
      const mockSmiles = smiles || 'CC(=O)OC1=CC=CC=C1C(=O)O';
      
      if (onStructureGenerated) {
        onStructureGenerated(mockSmiles, mockName);
      }
      
    } catch (err) {
      const errorMessage = (err as Error).message || 'Name generation failed';
      setError(errorMessage);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handlePredictReactions = async () => {
    if (!smiles && !molfile) {
      setError('Please provide a structure for reaction prediction');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      // Simulate AI reaction prediction
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Mock reaction predictions would be generated here
      console.log('AI reaction prediction completed');
      
    } catch (err) {
      const errorMessage = (err as Error).message || 'Reaction prediction failed';
      setError(errorMessage);
    } finally {
      setIsAnalyzing(false);
    }
  };

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
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <AIIcon color="primary" />
        AI Chemistry Assistant
        <Chip
          icon={<SparkleIcon />}
          label="Powered by AI"
          size="small"
          color="primary"
          variant="outlined"
        />
      </Typography>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Advanced AI-powered chemistry analysis, naming, and prediction capabilities
      </Typography>

      {/* Analysis Type Selection */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle2" gutterBottom>
            Analysis Type
          </Typography>
          <FormControl fullWidth size="small">
            <InputLabel>Analysis Type</InputLabel>
            <Select
              value={analysisType}
              onChange={(e) => setAnalysisType(e.target.value as any)}
              label="Analysis Type"
            >
              <MenuItem value="comprehensive">Comprehensive Analysis</MenuItem>
              <MenuItem value="naming">IUPAC Naming Only</MenuItem>
              <MenuItem value="properties">Property Prediction</MenuItem>
              <MenuItem value="reactions">Reaction Prediction</MenuItem>
              <MenuItem value="safety">Safety Analysis</MenuItem>
            </Select>
          </FormControl>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <Button
          variant="contained"
          onClick={handleAIAnalysis}
          disabled={isAnalyzing || (!smiles && !molfile)}
          startIcon={isAnalyzing ? <CircularProgress size={16} /> : <AIIcon />}
        >
          {isAnalyzing ? 'Analyzing...' : 'Run AI Analysis'}
        </Button>
        
        <Button
          variant="outlined"
          onClick={handleGenerateName}
          disabled={isAnalyzing || (!smiles && !molfile)}
          startIcon={<ChemistryIcon />}
        >
          Generate Name
        </Button>
        
        <Button
          variant="outlined"
          onClick={handlePredictReactions}
          disabled={isAnalyzing || (!smiles && !molfile)}
          startIcon={<PlayIcon />}
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
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Analysis Results */}
      {analysis && (
        <Stack spacing={3}>
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
