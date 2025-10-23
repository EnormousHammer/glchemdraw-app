/**
 * AdvancedAnalytics Component
 * Advanced molecular analytics, drug-likeness scoring, and property predictions
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
  Grid,
  Paper,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Tooltip,
  Divider,
} from '@mui/material';
import {
  Analytics as AnalyticsIcon,
  Science as ChemistryIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  ExpandMore as ExpandMoreIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Share as ShareIcon,
} from '@mui/icons-material';

interface AdvancedAnalyticsProps {
  smiles?: string;
  molfile?: string;
  onExportReport?: (report: any) => void;
  onError?: (error: string) => void;
}

interface MolecularAnalytics {
  basicProperties: {
    molecularWeight: number;
    logP: number;
    tpsa: number;
    hbd: number;
    hba: number;
    rotatableBonds: number;
    aromaticRings: number;
    heavyAtoms: number;
  };
  drugLikeness: {
    lipinskiScore: number;
    veberScore: number;
    overallScore: number;
    violations: string[];
    recommendations: string[];
  };
  admetProperties: {
    absorption: {
      caco2: number;
      hia: number;
      f20: number;
      f30: number;
    };
    distribution: {
      vd: number;
      ppb: number;
      bbb: number;
    };
    metabolism: {
      cyp1a2: string;
      cyp2c9: string;
      cyp2c19: string;
      cyp2d6: string;
      cyp3a4: string;
    };
    excretion: {
      totalClearance: number;
      renalClearance: number;
    };
    toxicity: {
      hepatotoxicity: string;
      cardiotoxicity: string;
      carcinogenicity: string;
      mutagenicity: string;
    };
  };
  syntheticAccessibility: {
    score: number;
    complexity: string;
    feasibility: string;
    suggestions: string[];
  };
  patentAnalysis: {
    isPatented: boolean;
    patentCount: number;
    expiryDate?: string;
    warnings: string[];
  };
}

export const AdvancedAnalytics: React.FC<AdvancedAnalyticsProps> = ({
  smiles,
  molfile,
  onExportReport,
  onError,
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analytics, setAnalytics] = useState<MolecularAnalytics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const handleAnalyze = useCallback(async () => {
    if (!smiles && !molfile) {
      setError('Please provide a structure for analysis');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setProgress(0);

    try {
      // Simulate comprehensive analysis with progress updates
      const analysisSteps = [
        'Calculating basic properties...',
        'Analyzing drug-likeness...',
        'Predicting ADMET properties...',
        'Assessing synthetic accessibility...',
        'Checking patent status...',
        'Generating recommendations...',
        'Finalizing report...'
      ];

      for (let i = 0; i < analysisSteps.length; i++) {
        setProgress((i + 1) * (100 / analysisSteps.length));
        await new Promise(resolve => setTimeout(resolve, 800));
      }

      // Mock comprehensive analytics
      const mockAnalytics: MolecularAnalytics = {
        basicProperties: {
          molecularWeight: 180.16,
          logP: 1.19,
          tpsa: 63.6,
          hbd: 1,
          hba: 4,
          rotatableBonds: 3,
          aromaticRings: 1,
          heavyAtoms: 13,
        },
        drugLikeness: {
          lipinskiScore: 100,
          veberScore: 95,
          overallScore: 97,
          violations: [],
          recommendations: [
            'Excellent drug-likeness profile',
            'All Lipinski rules satisfied',
            'Good oral bioavailability potential',
            'Consider improving solubility for better absorption'
          ]
        },
        admetProperties: {
          absorption: {
            caco2: 8.5,
            hia: 95.2,
            f20: 78.3,
            f30: 65.1,
          },
          distribution: {
            vd: 0.85,
            ppb: 89.2,
            bbb: 0.15,
          },
          metabolism: {
            cyp1a2: 'Substrate',
            cyp2c9: 'Inhibitor',
            cyp2c19: 'Substrate',
            cyp2d6: 'No interaction',
            cyp3a4: 'Substrate',
          },
          excretion: {
            totalClearance: 12.5,
            renalClearance: 8.3,
          },
          toxicity: {
            hepatotoxicity: 'Low risk',
            cardiotoxicity: 'Low risk',
            carcinogenicity: 'No evidence',
            mutagenicity: 'No evidence',
          }
        },
        syntheticAccessibility: {
          score: 2.8,
          complexity: 'Low',
          feasibility: 'High',
          suggestions: [
            'Simple synthetic route available',
            'Commercial starting materials',
            'Standard reaction conditions',
            'Good yield expected'
          ]
        },
        patentAnalysis: {
          isPatented: true,
          patentCount: 15,
          expiryDate: '2025-12-31',
          warnings: [
            'Compound is under patent protection',
            'Consider alternative structures',
            'Check for freedom to operate'
          ]
        }
      };

      setAnalytics(mockAnalytics);
      
    } catch (err) {
      const errorMessage = (err as Error).message || 'Analysis failed';
      setError(errorMessage);
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setIsAnalyzing(false);
      setProgress(0);
    }
  }, [smiles, molfile, onError]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Good';
    if (score >= 60) return 'Fair';
    if (score >= 40) return 'Poor';
    return 'Very Poor';
  };

  const getRiskColor = (risk: string) => {
    switch (risk.toLowerCase()) {
      case 'low risk': return 'success';
      case 'moderate risk': return 'warning';
      case 'high risk': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <AnalyticsIcon color="primary" />
        Advanced Molecular Analytics
        <Chip
          icon={<TrendingUpIcon />}
          label="AI-Powered"
          size="small"
          color="primary"
          variant="outlined"
        />
      </Typography>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Comprehensive molecular analysis including drug-likeness, ADMET properties, and patent analysis
      </Typography>

      {/* Analysis Button */}
      <Box sx={{ mb: 3 }}>
        <Button
          variant="contained"
          onClick={handleAnalyze}
          disabled={isAnalyzing || (!smiles && !molfile)}
          startIcon={isAnalyzing ? <CircularProgress size={16} /> : <AnalyticsIcon />}
          fullWidth
        >
          {isAnalyzing ? 'Analyzing...' : 'Run Advanced Analysis'}
        </Button>
      </Box>

      {/* Progress Bar */}
      {isAnalyzing && (
        <Box sx={{ mb: 3 }}>
          <LinearProgress variant="determinate" value={progress} />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Analysis Progress: {Math.round(progress)}%
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
      {analytics && (
        <Stack spacing={3}>
          {/* Basic Properties */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Basic Molecular Properties
              </Typography>
              <Grid container spacing={2}>
                {Object.entries(analytics.basicProperties).map(([key, value]) => (
                  <Grid size={{ xs: 6, sm: 4, md: 3 }} key={key}>
                    <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="caption" color="text.secondary" display="block">
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
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

          {/* Drug Likeness */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Drug Likeness Analysis
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Lipinski Score
                    </Typography>
                    <Typography variant="h4" color={getScoreColor(analytics.drugLikeness.lipinskiScore)}>
                      {analytics.drugLikeness.lipinskiScore}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {getScoreLabel(analytics.drugLikeness.lipinskiScore)}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Veber Score
                    </Typography>
                    <Typography variant="h4" color={getScoreColor(analytics.drugLikeness.veberScore)}>
                      {analytics.drugLikeness.veberScore}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {getScoreLabel(analytics.drugLikeness.veberScore)}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Overall Score
                    </Typography>
                    <Typography variant="h4" color={getScoreColor(analytics.drugLikeness.overallScore)}>
                      {analytics.drugLikeness.overallScore}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {getScoreLabel(analytics.drugLikeness.overallScore)}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
              
              {analytics.drugLikeness.recommendations.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Recommendations:
                  </Typography>
                  <List dense>
                    {analytics.drugLikeness.recommendations.map((rec, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <CheckCircleIcon color="success" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary={rec} />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* ADMET Properties */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                ADMET Properties
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Absorption
                  </Typography>
                  <Stack spacing={1}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Caco-2:</Typography>
                      <Typography variant="body2">{analytics.admetProperties.absorption.caco2} × 10⁻⁶ cm/s</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">HIA:</Typography>
                      <Typography variant="body2">{analytics.admetProperties.absorption.hia}%</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">F20:</Typography>
                      <Typography variant="body2">{analytics.admetProperties.absorption.f20}%</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">F30:</Typography>
                      <Typography variant="body2">{analytics.admetProperties.absorption.f30}%</Typography>
                    </Box>
                  </Stack>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Distribution
                  </Typography>
                  <Stack spacing={1}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">VD:</Typography>
                      <Typography variant="body2">{analytics.admetProperties.distribution.vd} L/kg</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">PPB:</Typography>
                      <Typography variant="body2">{analytics.admetProperties.distribution.ppb}%</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">BBB:</Typography>
                      <Typography variant="body2">{analytics.admetProperties.distribution.bbb}</Typography>
                    </Box>
                  </Stack>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Toxicity Analysis */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Toxicity Analysis
              </Typography>
              <Grid container spacing={2}>
                {Object.entries(analytics.admetProperties.toxicity).map(([key, value]) => (
                  <Grid size={{ xs: 6, sm: 3 }} key={key}>
                    <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="caption" color="text.secondary" display="block">
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </Typography>
                      <Chip
                        label={value}
                        color={getRiskColor(value) as any}
                        variant="outlined"
                        size="small"
                      />
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>

          {/* Patent Analysis */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Patent Analysis
              </Typography>
              <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                <Chip
                  label={analytics.patentAnalysis.isPatented ? 'Patented' : 'Not Patented'}
                  color={analytics.patentAnalysis.isPatented ? 'warning' : 'success'}
                  variant="filled"
                />
                <Typography variant="body2">
                  {analytics.patentAnalysis.patentCount} patents found
                </Typography>
                {analytics.patentAnalysis.expiryDate && (
                  <Typography variant="body2" color="text.secondary">
                    Expires: {analytics.patentAnalysis.expiryDate}
                  </Typography>
                )}
              </Stack>
              
              {analytics.patentAnalysis.warnings.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Warnings:
                  </Typography>
                  <List dense>
                    {analytics.patentAnalysis.warnings.map((warning, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <WarningIcon color="warning" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary={warning} />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Export Actions */}
          <Card>
            <CardContent>
              <Stack direction="row" spacing={2} justifyContent="center">
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={() => onExportReport?.(analytics)}
                >
                  Export Report
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<ShareIcon />}
                >
                  Share Analysis
                </Button>
              </Stack>
            </CardContent>
          </Card>
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
          <AnalyticsIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
          <Typography variant="body2">
            Draw a structure to run advanced analytics
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default AdvancedAnalytics;
