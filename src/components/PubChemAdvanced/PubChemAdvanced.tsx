/**
 * Advanced PubChem Integration Component
 * Enterprise-level chemical database features
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Stack,
  Button,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Link,
} from '@mui/material';
import {
  Science as ScienceIcon,
  Image as ImageIcon,
  ThreeDRotation as ThreeDIcon,
  Download as DownloadIcon,
  Link as LinkIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  ExpandMore as ExpandIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import MolecularViewer from '@components/MolecularViewer';
import { searchCompound, getCompoundByCID } from '@lib/pubchem/cache';
import { get2DImageURL } from '@lib/pubchem/api';

interface PubChemAdvancedProps {
  cid?: number;
  compoundName?: string;
  onCompoundChange?: (compound: any) => void;
}

type TabValue = 'overview' | 'properties' | 'structures' | 'spectra' | 'literature' | 'safety' | 'patents' | 'bioassays';

export const PubChemAdvanced: React.FC<PubChemAdvancedProps> = ({
  cid,
  compoundName,
  onCompoundChange,
}) => {
  const [activeTab, setActiveTab] = useState<TabValue>('overview');
  const [compound, setCompound] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cid) {
      loadCompound(cid);
    }
  }, [cid]);

  const loadCompound = async (compoundId: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getCompoundByCID(compoundId);
      if (result) {
        setCompound(result);
        onCompoundChange?.(result);
      } else {
        setError('Compound not found');
      }
    } catch (err) {
      setError(`Failed to load compound: ${(err as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: TabValue) => {
    setActiveTab(newValue);
  };

  const renderOverview = () => (
    <Grid container spacing={3}>
      {/* Basic Info */}
      <Grid size={{ xs: 12, md: 6 }}>
        <Card>
          <CardHeader title="Basic Information" />
          <CardContent>
            <Stack spacing={2}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">CID</Typography>
                <Typography variant="h6">{compound?.cid}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Molecular Formula</Typography>
                <Typography variant="body1" fontFamily="monospace">
                  {compound?.properties?.MolecularFormula || 'N/A'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Molecular Weight</Typography>
                <Typography variant="body1">
                  {compound?.properties?.MolecularWeight ? 
                    (() => {
                      const weight = typeof compound.properties.MolecularWeight === 'number' 
                        ? compound.properties.MolecularWeight 
                        : parseFloat(compound.properties.MolecularWeight);
                      return isNaN(weight) ? 'N/A' : `${weight.toFixed(2)} g/mol`;
                    })() : 'N/A'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">IUPAC Name</Typography>
                <Typography variant="body2">
                  {compound?.properties?.IUPACName || 'N/A'}
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      {/* Identifiers */}
      <Grid size={{ xs: 12, md: 6 }}>
        <Card>
          <CardHeader title="Identifiers" />
          <CardContent>
            <Stack spacing={1}>
              {compound?.properties?.CanonicalSMILES && (
                <Box>
                  <Typography variant="caption" color="text.secondary">SMILES</Typography>
                  <Typography variant="body2" fontFamily="monospace" sx={{ wordBreak: 'break-all' }}>
                    {compound.properties.CanonicalSMILES}
                  </Typography>
                </Box>
              )}
              {compound?.properties?.InChI && (
                <Box>
                  <Typography variant="caption" color="text.secondary">InChI</Typography>
                  <Typography variant="body2" fontFamily="monospace" sx={{ wordBreak: 'break-all' }}>
                    {compound.properties.InChI}
                  </Typography>
                </Box>
              )}
              {compound?.properties?.InChIKey && (
                <Box>
                  <Typography variant="caption" color="text.secondary">InChI Key</Typography>
                  <Typography variant="body2" fontFamily="monospace">
                    {compound.properties.InChIKey}
                  </Typography>
                </Box>
              )}
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      {/* Molecular Viewer */}
      <Grid size={12}>
        <MolecularViewer cid={compound?.cid} />
      </Grid>
    </Grid>
  );

  const renderProperties = () => (
    <Grid container spacing={3}>
      {/* Physical Properties */}
      <Grid size={{ xs: 12, md: 6 }}>
        <Card>
          <CardHeader title="Physical Properties" />
          <CardContent>
            <TableContainer>
              <Table size="small">
                <TableBody>
                  <TableRow>
                    <TableCell><strong>Molecular Weight</strong></TableCell>
                    <TableCell>
                      {compound?.properties?.MolecularWeight ? 
                        (() => {
                          const weight = typeof compound.properties.MolecularWeight === 'number' 
                            ? compound.properties.MolecularWeight 
                            : parseFloat(compound.properties.MolecularWeight);
                          return isNaN(weight) ? 'N/A' : `${weight.toFixed(2)} g/mol`;
                        })() : 'N/A'}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><strong>Exact Mass</strong></TableCell>
                    <TableCell>
                      {compound?.properties?.ExactMass ? 
                        (() => {
                          const mass = typeof compound.properties.ExactMass === 'number' 
                            ? compound.properties.ExactMass 
                            : parseFloat(compound.properties.ExactMass);
                          return isNaN(mass) ? 'N/A' : mass.toFixed(4);
                        })() : 'N/A'}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><strong>XLogP</strong></TableCell>
                    <TableCell>
                      {compound?.properties?.XLogP ? 
                        (() => {
                          const logp = typeof compound.properties.XLogP === 'number' 
                            ? compound.properties.XLogP 
                            : parseFloat(compound.properties.XLogP);
                          return isNaN(logp) ? 'N/A' : logp.toFixed(2);
                        })() : 'N/A'}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><strong>TPSA</strong></TableCell>
                    <TableCell>
                      {compound?.properties?.TPSA ? 
                        (() => {
                          const tpsa = typeof compound.properties.TPSA === 'number' 
                            ? compound.properties.TPSA 
                            : parseFloat(compound.properties.TPSA);
                          return isNaN(tpsa) ? 'N/A' : `${tpsa.toFixed(2)} Å²`;
                        })() : 'N/A'}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><strong>Complexity</strong></TableCell>
                    <TableCell>
                      {compound?.properties?.Complexity ? 
                        (() => {
                          const complexity = typeof compound.properties.Complexity === 'number' 
                            ? compound.properties.Complexity 
                            : parseFloat(compound.properties.Complexity);
                          return isNaN(complexity) ? 'N/A' : complexity.toFixed(0);
                        })() : 'N/A'}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>

      {/* Drug-like Properties */}
      <Grid size={{ xs: 12, md: 6 }}>
        <Card>
          <CardHeader title="Drug-like Properties" />
          <CardContent>
            <TableContainer>
              <Table size="small">
                <TableBody>
                  <TableRow>
                    <TableCell><strong>H-Bond Donors</strong></TableCell>
                    <TableCell>{compound?.properties?.HBondDonorCount || 'N/A'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><strong>H-Bond Acceptors</strong></TableCell>
                    <TableCell>{compound?.properties?.HBondAcceptorCount || 'N/A'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><strong>Rotatable Bonds</strong></TableCell>
                    <TableCell>{compound?.properties?.RotatableBondCount || 'N/A'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><strong>Heavy Atoms</strong></TableCell>
                    <TableCell>{compound?.properties?.HeavyAtomCount || 'N/A'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><strong>Charge</strong></TableCell>
                    <TableCell>{compound?.properties?.Charge || '0'}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderStructures = () => (
    <Box>
      <Typography variant="h6" gutterBottom>Molecular Structures</Typography>
      <MolecularViewer cid={compound?.cid} />
    </Box>
  );

  const renderSpectra = () => (
    <Card>
      <CardHeader title="Spectral Data" />
      <CardContent>
        <Alert severity="info">
          Spectral data integration coming soon. This will include NMR, IR, UV-Vis, and Mass spectra.
        </Alert>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Planned features:
        </Typography>
        <List dense>
          <ListItem>
            <ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
            <ListItemText primary="NMR Spectra (1H, 13C)" />
          </ListItem>
          <ListItem>
            <ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
            <ListItemText primary="IR Spectra" />
          </ListItem>
          <ListItem>
            <ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
            <ListItemText primary="UV-Vis Spectra" />
          </ListItem>
          <ListItem>
            <ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
            <ListItemText primary="Mass Spectra" />
          </ListItem>
        </List>
      </CardContent>
    </Card>
  );

  const renderLiterature = () => (
    <Card>
      <CardHeader title="Scientific Literature" />
      <CardContent>
        <Alert severity="info">
          Literature search integration coming soon. This will search PubMed and other databases.
        </Alert>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Planned features:
        </Typography>
        <List dense>
          <ListItem>
            <ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
            <ListItemText primary="PubMed References" />
          </ListItem>
          <ListItem>
            <ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
            <ListItemText primary="Patent References" />
          </ListItem>
          <ListItem>
            <ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
            <ListItemText primary="Chemical Abstracts" />
          </ListItem>
        </List>
      </CardContent>
    </Card>
  );

  const renderSafety = () => (
    <Card>
      <CardHeader title="Safety Information" />
      <CardContent>
        <Alert severity="warning">
          Safety data integration coming soon. This will include GHS pictograms, hazard statements, and safety data sheets.
        </Alert>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Planned features:
        </Typography>
        <List dense>
          <ListItem>
            <ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
            <ListItemText primary="GHS Classification" />
          </ListItem>
          <ListItem>
            <ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
            <ListItemText primary="Safety Data Sheets (SDS)" />
          </ListItem>
          <ListItem>
            <ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
            <ListItemText primary="Hazard Statements" />
          </ListItem>
          <ListItem>
            <ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
            <ListItemText primary="Precautionary Statements" />
          </ListItem>
        </List>
      </CardContent>
    </Card>
  );

  const renderPatents = () => (
    <Card>
      <CardHeader title="Patent Information" />
      <CardContent>
        <Alert severity="info">
          Patent search integration coming soon. This will search patent databases for related compounds.
        </Alert>
      </CardContent>
    </Card>
  );

  const renderBioassays = () => (
    <Card>
      <CardHeader title="Bioassay Data" />
      <CardContent>
        <Alert severity="info">
          Bioassay data integration coming soon. This will include biological activity data from PubChem BioAssay.
        </Alert>
      </CardContent>
    </Card>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview': return renderOverview();
      case 'properties': return renderProperties();
      case 'structures': return renderStructures();
      case 'spectra': return renderSpectra();
      case 'literature': return renderLiterature();
      case 'safety': return renderSafety();
      case 'patents': return renderPatents();
      case 'bioassays': return renderBioassays();
      default: return null;
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" action={
        <Button color="inherit" size="small" onClick={() => cid && loadCompound(cid)}>
          Retry
        </Button>
      }>
        {error}
      </Alert>
    );
  }

  if (!compound) {
    return (
      <Alert severity="info">
        No compound selected. Search for a compound to view detailed information.
      </Alert>
    );
  }

  return (
    <Box>
      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 3 }}
      >
        <Tab value="overview" label="Overview" icon={<InfoIcon />} />
        <Tab value="properties" label="Properties" icon={<ScienceIcon />} />
        <Tab value="structures" label="Structures" icon={<ImageIcon />} />
        <Tab value="spectra" label="Spectra" icon={<ThreeDIcon />} />
        <Tab value="literature" label="Literature" icon={<LinkIcon />} />
        <Tab value="safety" label="Safety" icon={<WarningIcon />} />
        <Tab value="patents" label="Patents" icon={<LinkIcon />} />
        <Tab value="bioassays" label="Bioassays" icon={<ScienceIcon />} />
      </Tabs>

      {renderTabContent()}
    </Box>
  );
};

export default PubChemAdvanced;
