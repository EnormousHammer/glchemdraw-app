/**
 * FAQDialog - How to use GL-Chemdraw
 * Simple popup modal with FAQ content
 */

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
} from '@mui/material';
import HelpIcon from '@mui/icons-material/Help';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

interface FAQDialogProps {
  open: boolean;
  onClose: () => void;
}

const FAQ_ITEMS = [
  { q: 'What is GL-Chemdraw?', a: 'A professional chemical structure drawing app for GL Chemtec. Draw molecules, look up compounds from PubChem, view 3D structures, and export in standard formats.' },
  { q: 'How do I draw a structure?', a: 'Use the drawing canvas. Select tools from the left toolbar: bonds, atoms, rings. Use ring templates from the bottom toolbar for common rings.' },
  { q: 'How do I search by name?', a: 'Type the compound name in the search box in the top toolbar and press Enter. The structure is fetched from PubChem and inserted into your canvas.' },
  { q: 'How do I clean up a messy structure?', a: 'Press Ctrl+Shift+L for Layout (fixes bond lengths and angles). Or click the Layout button (magic wand icon) in the Chemical Info panel.' },
  { q: 'How do I draw peptides, RNA, or DNA?', a: 'Click the Biopolymer button in the Chemical Info panel, or use Ctrl+Alt+P (Peptide), Ctrl+Alt+R (RNA), Ctrl+Alt+D (DNA). Enter the sequence.' },
  { q: 'How do I add functional groups (OMe, OEt, CN)?', a: 'Open Functional Groups (Shift+F). Use the Structure tool: select an FG, then click on the atom to attach. Or use the Add FG button (AI-powered).' },
  { q: 'How do I copy as image?', a: 'Select the structure and press Ctrl+C. The structure is copied as PNG with transparent background. Paste into Word or PowerPoint.' },
  { q: 'How do I export?', a: 'Use the Export menu for MOL, SDF, SMILES. Use Advanced Export for PNG, SVG, PDF (with DPI), InChI. Click Download after export.' },
  { q: 'How do I paste?', a: 'Press Ctrl+V or click the Paste button in the Chemical Info panel. Use Paste button when Ctrl+V does not work.' },
  { q: 'How do I predict NMR?', a: 'Select a structure and click NMR in the Chemical Info panel. You get ¹H, ¹³C, ¹⁵N, ³¹P, ¹⁹F predictions. Use "Explain with AI" when data is missing.' },
  { q: 'What is the Add FG button?', a: 'Add FG (beside Biopolymer) lets you add functional groups using AI. Enter a name or pick from the list; the fragment is added to the canvas.' },
  { q: 'When does "Get AI Name" appear?', a: 'When PubChem does not recognize your structure, the IUPAC field shows "Get AI Name". Click it to generate an IUPAC name via AI.' },
];

export const FAQDialog: React.FC<FAQDialogProps> = ({ open, onClose }) => (
  <Dialog
    open={open}
    onClose={onClose}
    maxWidth="sm"
    fullWidth
    PaperProps={{ sx: { maxHeight: '85vh' }, 'data-glchemdraw-dialog': 'faq' }}
  >
    <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <HelpIcon color="primary" />
      How to Use GL-Chemdraw
    </DialogTitle>
    <DialogContent dividers sx={{ px: 0 }}>
      <Box sx={{ pr: 2 }}>
        {FAQ_ITEMS.map((item, i) => (
          <Accordion key={i} disableGutters elevation={0} sx={{ '&:before': { display: 'none' } }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ minHeight: 48, '& .MuiAccordionSummary-content': { my: 1 } }}>
              <Typography variant="body2" fontWeight={600}>{item.q}</Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 0 }}>
              <Typography variant="body2" color="text.secondary">{item.a}</Typography>
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose} variant="contained">Close</Button>
    </DialogActions>
  </Dialog>
);

export default FAQDialog;
