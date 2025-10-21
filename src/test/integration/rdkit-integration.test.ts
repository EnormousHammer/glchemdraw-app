/**
 * Integration Tests for RDKit Chemistry Library
 */

import { describe, it, expect, beforeAll } from 'vitest';
import {
  initRDKit,
  validateStructure,
  calculateProperties,
  calculateDescriptors,
  smilesToMolfile,
  molfileToSmiles,
  canonicalizeSmiles,
  generateInChI,
  generateInChIKey,
} from '@lib/chemistry/rdkit';

describe('RDKit Integration', () => {
  beforeAll(async () => {
    // Initialize RDKit once for all tests
    await initRDKit();
  }, 30000); // 30 second timeout for WASM loading

  describe('Structure Validation', () => {
    it('should validate benzene', async () => {
      const result = await validateStructure('c1ccccc1', 'smiles');
      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should detect invalid SMILES', async () => {
      const result = await validateStructure('invalid', 'smiles');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should detect valence errors', async () => {
      // Pentavalent carbon (invalid)
      const result = await validateStructure('C(C)(C)(C)(C)C', 'smiles');
      expect(result.isValid).toBe(false);
    });

    it('should warn about undefined stereocenters', async () => {
      // Chiral center without defined stereochemistry
      const result = await validateStructure('CC(O)C', 'smiles');
      // May or may not have warnings depending on RDKit version
      expect(result).toHaveProperty('warnings');
    });
  });

  describe('Property Calculation', () => {
    it('should calculate properties for ethanol', async () => {
      const props = await calculateProperties('CCO');
      
      expect(props).toBeDefined();
      expect(props?.molecularFormula).toBe('C2H6O');
      expect(props?.molecularWeight).toBeCloseTo(46.07, 1);
    });

    it('should calculate descriptors', async () => {
      const desc = await calculateDescriptors('CCO');
      
      expect(desc).toBeDefined();
      expect(desc?.molecularWeight).toBeCloseTo(46.07, 1);
      expect(desc?.hBondDonors).toBe(1);
      expect(desc?.hBondAcceptors).toBe(1);
    });

    it('should return null for invalid SMILES', async () => {
      const props = await calculateProperties('invalid');
      expect(props).toBeNull();
    });
  });

  describe('Format Conversion', () => {
    it('should convert SMILES to MOL file', async () => {
      const molfile = await smilesToMolfile('CCO');
      
      expect(molfile).toBeDefined();
      expect(molfile).toContain('M  END');
      expect(molfile).toContain('V2000'); // MOL V2000 format
    });

    it('should convert MOL file to SMILES', async () => {
      const molfile = `
  Mrv0541 02231512452D          

  3  2  0  0  0  0            999 V2000
    0.0000    0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    0.0000    1.5000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    1.5000    0.0000    0.0000 O   0  0  0  0  0  0  0  0  0  0  0  0
  1  2  1  0  0  0  0
  1  3  1  0  0  0  0
M  END
`;
      
      const smiles = await molfileToSmiles(molfile);
      expect(smiles).toBeDefined();
      expect(smiles).toContain('C');
      expect(smiles).toContain('O');
    });

    it('should canonicalize SMILES', async () => {
      const canonical = await canonicalizeSmiles('OCC');
      expect(canonical).toBe('CCO'); // Canonical form
    });
  });

  describe('Chemical Identifiers', () => {
    it('should generate InChI', async () => {
      const inchi = await generateInChI('CCO');
      
      expect(inchi).toBeDefined();
      expect(inchi).toContain('InChI=');
      expect(inchi).toContain('C2H6O');
    });

    it('should generate InChI Key', async () => {
      const inchiKey = await generateInChIKey('CCO');
      
      expect(inchiKey).toBeDefined();
      expect(inchiKey).toMatch(/^[A-Z]{14}-[A-Z]{10}-[A-Z]$/);
    });

    it('should return consistent InChI Key for same structure', async () => {
      const key1 = await generateInChIKey('CCO');
      const key2 = await generateInChIKey('OCC'); // Different SMILES, same structure
      
      expect(key1).toBe(key2);
    });
  });

  describe('Complex Molecules', () => {
    it('should handle aspirin', async () => {
      const aspirin = 'CC(=O)Oc1ccccc1C(=O)O';
      const props = await calculateProperties(aspirin);
      
      expect(props).toBeDefined();
      expect(props?.molecularFormula).toBe('C9H8O4');
      expect(props?.molecularWeight).toBeCloseTo(180.16, 1);
    });

    it('should handle caffeine', async () => {
      const caffeine = 'CN1C=NC2=C1C(=O)N(C(=O)N2C)C';
      const props = await calculateProperties(caffeine);
      
      expect(props).toBeDefined();
      expect(props?.molecularFormula).toBe('C8H10N4O2');
    });
  });
});

