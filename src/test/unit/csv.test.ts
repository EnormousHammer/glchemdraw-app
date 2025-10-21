/**
 * Unit Tests for CSV Export
 */

import { describe, it, expect } from 'vitest';
import { compoundsToCSV, structuresToCSV } from '@lib/export/csv';
import type { PubChemCompound } from '@/types/chemistry';

describe('CSV Export', () => {
  describe('compoundsToCSV', () => {
    it('should export compounds to CSV format', () => {
      const compounds: PubChemCompound[] = [
        {
          cid: 702,
          properties: {
            MolecularFormula: 'C2H6O',
            MolecularWeight: 46.07,
            IUPACName: 'ethanol',
            CanonicalSMILES: 'CCO',
            InChI: 'InChI=1S/C2H6O/c1-2-3/h3H,2H2,1H3',
            InChIKey: 'LFQSCWFLJHTTHZ-UHFFFAOYSA-N',
            XLogP: -0.18,
            TPSA: 20.23,
            Complexity: 2.8,
            HBondDonorCount: 1,
            HBondAcceptorCount: 1,
            RotatableBondCount: 0,
            HeavyAtomCount: 3,
            Charge: 0,
          },
        },
      ];

      const csv = compoundsToCSV(compounds);
      
      expect(csv).toContain('CID');
      expect(csv).toContain('IUPAC Name');
      expect(csv).toContain('Molecular Formula');
      expect(csv).toContain('702');
      expect(csv).toContain('ethanol');
      expect(csv).toContain('C2H6O');
    });

    it('should handle empty compounds array', () => {
      const csv = compoundsToCSV([]);
      expect(csv).toBe('');
    });

    it('should escape CSV special characters', () => {
      const compounds: PubChemCompound[] = [
        {
          cid: 1,
          properties: {
            MolecularFormula: 'C,H,O',
            MolecularWeight: 100,
            IUPACName: 'compound "with quotes"',
            CanonicalSMILES: 'C',
          },
        },
      ];

      const csv = compoundsToCSV(compounds);
      
      // Should wrap in quotes if contains comma or quotes
      expect(csv).toContain('"C,H,O"');
      expect(csv).toContain('"compound ""with quotes"""'); // Escaped quotes
    });
  });

  describe('structuresToCSV', () => {
    it('should export structures to CSV', () => {
      const structures = [
        {
          id: 'struct_1',
          name: 'Structure 1',
          molfile: 'MOL content',
          properties: {
            MW: '180.16',
            Formula: 'C6H12O6',
          },
        },
        {
          id: 'struct_2',
          name: 'Structure 2',
          molfile: 'MOL content',
          properties: {
            MW: '342.30',
            Formula: 'C12H22O11',
          },
        },
      ];

      const csv = structuresToCSV(structures, true);
      
      expect(csv).toContain('ID,Name,MW,Formula');
      expect(csv).toContain('struct_1');
      expect(csv).toContain('Structure 1');
      expect(csv).toContain('180.16');
    });
  });
});

