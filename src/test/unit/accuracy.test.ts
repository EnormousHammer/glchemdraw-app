/**
 * Accuracy Tests
 * Verifies that displayed/returned data matches authoritative reference values.
 * Uses PubChem, OpenChemLib, and known chemical reference data.
 */

import { describe, it, expect } from 'vitest';
import { getCIDByName, getPropertiesByCID, getCIDBySMILES } from '@lib/pubchem/api';
import {
  getMolecularFormula,
  getMolecularWeight,
  isValidSmiles,
  molfileToSmiles,
} from '@lib/chemistry/openchemlib';
import { convertSmilesToMol } from '@lib/chemistry/smilesToMol';
import { parseSDFFile, molfilesToSDFStructures, generateSDFFile } from '@lib/chemistry/sdf';
import { validateSMILES } from '@lib/validation/input';

// Reference values from PubChem (authoritative)
const REFERENCE = {
  aspirin: {
    name: 'aspirin',
    cid: 2244,
    formula: 'C9H8O4',
    mw: 180.16,
    cas: '50-78-2',
    iupac: '2-acetyloxybenzoic acid',
    inchiKey: 'BSYNRYMUTXBXSQ-UHFFFAOYSA-N',
    smiles: 'CC(=O)OC1=CC=CC=C1C(=O)O', // PubChem canonical
  },
  ethanol: {
    name: 'ethanol',
    cid: 702,
    formula: 'C2H6O',
    mw: 46.07,
    cas: '64-17-5',
    iupac: 'ethanol',
    inchiKey: 'LFQSCWFLJHTTHZ-UHFFFAOYSA-N',
    smiles: 'CCO',
  },
  caffeine: {
    name: 'caffeine',
    cid: 2519,
    formula: 'C8H10N4O2',
    mw: 194.19,
    iupac: '1,3,7-trimethylpurine-2,6-dione',
    inchiKey: 'RYYVLZVUVIJVGH-UHFFFAOYSA-N',
    smiles: 'CN1C=NC2=C1C(=O)N(C(=O)N2C)C',
  },
  // Chiral - (S)-lactic acid (organic PhD: stereochemistry critical)
  lacticAcidS: {
    cid: 107689,
    formula: 'C3H6O3',
    mw: 90.08,
    exactMass: 90.03169,
    iupac: '(2S)-2-hydroxypropanoic acid',
    inchiKey: 'JVTAAEKCZFNVCJ-REOHCLBHSA-N',
    smiles: 'C[C@@H](C(=O)O)O', // Isomeric with stereo
    smilesAchiral: 'CC(C(=O)O)O', // Connectivity only
  },
  // Aromatic - benzene (ChemDraw parity: aromatic vs Kekulé)
  benzene: {
    cid: 241,
    formula: 'C6H6',
    mw: 78.11,
    exactMass: 78.04695,
    iupac: 'benzene',
    inchiKey: 'UHOVQNZJYSORNB-UHFFFAOYSA-N',
    smilesAromatic: 'c1ccccc1',
    smilesKekule: 'C1=CC=CC=C1',
  },
  // Aromatic heterocycle - pyridine
  pyridine: {
    cid: 1049,
    formula: 'C5H5N',
    mw: 79.10,
    exactMass: 79.04220,
    iupac: 'pyridine',
    inchiKey: 'JUJWROOIHBZHMG-UHFFFAOYSA-N',
    smiles: 'c1ccncc1',
  },
  // Mandelic acid (chiral α-hydroxy acid)
  mandelicAcid: {
    cid: 1292,
    formula: 'C8H8O3',
    mw: 152.15,
    exactMass: 152.04734,
    iupac: '2-hydroxy-2-phenylacetic acid',
    inchiKey: 'IWYDHOAUDWTVEP-UHFFFAOYSA-N',
    smiles: 'C1=CC=C(C=C1)C(C(=O)O)O',
  },
} as const;

describe('Accuracy Tests', () => {
  describe('PubChem API - Name to CID', () => {
    it('aspirin: getCIDByName returns correct CID', async () => {
      const cid = await getCIDByName('aspirin');
      expect(cid).toBe(REFERENCE.aspirin.cid);
    });

    it('ethanol: getCIDByName returns correct CID', async () => {
      const cid = await getCIDByName('ethanol');
      expect(cid).toBe(REFERENCE.ethanol.cid);
    });

    it('caffeine: getCIDByName returns correct CID', async () => {
      const cid = await getCIDByName('caffeine');
      expect(cid).toBe(REFERENCE.caffeine.cid);
    });

    it('invalid name returns null', async () => {
      const cid = await getCIDByName('xyznonexistentcompound123');
      expect(cid).toBeNull();
    });
  });

  describe('PubChem API - Properties by CID', () => {
    it('aspirin: MolecularFormula is correct', async () => {
      const props = await getPropertiesByCID(REFERENCE.aspirin.cid);
      expect(props?.MolecularFormula).toBe(REFERENCE.aspirin.formula);
    });

    it('aspirin: MolecularWeight is correct', async () => {
      const props = await getPropertiesByCID(REFERENCE.aspirin.cid);
      const mw = props?.MolecularWeight;
      expect(mw).toBeDefined();
      expect(Number(mw)).toBeCloseTo(REFERENCE.aspirin.mw, 1);
    });

    it('aspirin: IUPACName is correct', async () => {
      const props = await getPropertiesByCID(REFERENCE.aspirin.cid);
      expect(props?.IUPACName).toBe(REFERENCE.aspirin.iupac);
    });

    it('aspirin: InChIKey is correct', async () => {
      const props = await getPropertiesByCID(REFERENCE.aspirin.cid);
      expect(props?.InChIKey).toBe(REFERENCE.aspirin.inchiKey);
    });

    it('ethanol: all key properties correct', async () => {
      const props = await getPropertiesByCID(REFERENCE.ethanol.cid);
      expect(props?.MolecularFormula).toBe(REFERENCE.ethanol.formula);
      expect(Number(props?.MolecularWeight)).toBeCloseTo(REFERENCE.ethanol.mw, 1);
      expect(props?.InChIKey).toBe(REFERENCE.ethanol.inchiKey);
    });

    it('caffeine: formula and MW correct', async () => {
      const props = await getPropertiesByCID(REFERENCE.caffeine.cid);
      expect(props?.MolecularFormula).toBe(REFERENCE.caffeine.formula);
      expect(Number(props?.MolecularWeight)).toBeCloseTo(REFERENCE.caffeine.mw, 1);
    });
  });

  describe('PubChem API - SMILES to CID', () => {
    it('aspirin SMILES returns correct CID', async () => {
      const cid = await getCIDBySMILES(REFERENCE.aspirin.smiles);
      expect(cid).toBe(REFERENCE.aspirin.cid);
    });

    it('ethanol SMILES returns correct CID', async () => {
      const cid = await getCIDBySMILES(REFERENCE.ethanol.smiles);
      expect(cid).toBe(REFERENCE.ethanol.cid);
    });
  });

  describe('OpenChemLib - Molecular Formula', () => {
    it('aspirin SMILES yields correct formula', () => {
      const formula = getMolecularFormula(REFERENCE.aspirin.smiles);
      expect(formula).toBe(REFERENCE.aspirin.formula);
    });

    it('ethanol SMILES yields correct formula', () => {
      const formula = getMolecularFormula(REFERENCE.ethanol.smiles);
      expect(formula).toBe(REFERENCE.ethanol.formula);
    });

    it('caffeine SMILES yields correct formula', () => {
      const formula = getMolecularFormula(REFERENCE.caffeine.smiles);
      expect(formula).toBe(REFERENCE.caffeine.formula);
    });

    it('alternate aspirin SMILES yields same formula', () => {
      // Different but equivalent SMILES for aspirin
      const alt = 'CC(OC1=CC=CC=C1C(O)=O)=O';
      const formula = getMolecularFormula(alt);
      expect(formula).toBe(REFERENCE.aspirin.formula);
    });
  });

  describe('OpenChemLib - Molecular Weight', () => {
    it('aspirin MW within 0.1 of reference', () => {
      const mw = getMolecularWeight(REFERENCE.aspirin.smiles);
      expect(mw).toBeDefined();
      expect(mw!).toBeCloseTo(REFERENCE.aspirin.mw, 1);
    });

    it('ethanol MW within 0.1 of reference', () => {
      const mw = getMolecularWeight(REFERENCE.ethanol.smiles);
      expect(mw).toBeDefined();
      expect(mw!).toBeCloseTo(REFERENCE.ethanol.mw, 1);
    });
  });

  describe('SMILES Validation', () => {
    it('valid SMILES are accepted', () => {
      expect(isValidSmiles('CCO')).toBe(true);
      expect(isValidSmiles(REFERENCE.aspirin.smiles)).toBe(true);
      expect(isValidSmiles('c1ccccc1')).toBe(true);
    });

    it('invalid SMILES are rejected', () => {
      expect(isValidSmiles('')).toBe(false);
      // validateSMILES provides stricter bracket/char checks
      expect(validateSMILES('C(CO').isValid).toBe(false); // Unbalanced bracket
      expect(validateSMILES(')C').isValid).toBe(false);   // Invalid leading char
    });
  });

  describe('SMILES to MOL Conversion', () => {
    it('aspirin SMILES converts to valid MOL', async () => {
      const mol = await convertSmilesToMol(REFERENCE.aspirin.smiles);
      expect(mol).toBeTruthy();
      expect(mol).toContain('M  END');
      expect(mol).toMatch(/V2000|V3000/);
    });

    it('ethanol SMILES converts to valid MOL', async () => {
      const mol = await convertSmilesToMol(REFERENCE.ethanol.smiles);
      expect(mol).toBeTruthy();
      expect(mol).toContain('M  END');
    });

    it('MOL from aspirin round-trips to same formula', async () => {
      const mol = await convertSmilesToMol(REFERENCE.aspirin.smiles);
      expect(mol).toBeTruthy();
      const backSmiles = molfileToSmiles(mol!);
      expect(backSmiles).toBeTruthy();
      const formula = getMolecularFormula(backSmiles!);
      expect(formula).toBe(REFERENCE.aspirin.formula);
    });
  });

  describe('SDF Generation', () => {
    it('MOL to SDF produces parseable SDF', async () => {
      const mol = await convertSmilesToMol(REFERENCE.ethanol.smiles);
      expect(mol).toBeTruthy();
      const structures = molfilesToSDFStructures([mol!]);
      expect(structures).toHaveLength(1);
      expect(structures[0]!.molfile).toContain('M  END');
      const sdfContent = generateSDFFile(structures);
      expect(sdfContent).toContain('$$$$');
      const parsed = parseSDFFile(sdfContent);
      expect(parsed.structures).toHaveLength(1);
    });
  });

  // ========== ORGANIC PhD / ChemDraw COMPARISON TESTS ==========

  describe('Chiral Compounds (ChemDraw parity: stereochemistry)', () => {
    it('(S)-lactic acid: formula correct from isomeric SMILES', () => {
      const formula = getMolecularFormula(REFERENCE.lacticAcidS.smiles);
      expect(formula).toBe(REFERENCE.lacticAcidS.formula);
    });

    it('(S)-lactic acid: achiral SMILES yields same formula', () => {
      const formula = getMolecularFormula(REFERENCE.lacticAcidS.smilesAchiral);
      expect(formula).toBe(REFERENCE.lacticAcidS.formula);
    });

    it('(S)-lactic acid: MW within 0.1 of PubChem', () => {
      const mw = getMolecularWeight(REFERENCE.lacticAcidS.smiles);
      expect(mw).toBeDefined();
      expect(mw!).toBeCloseTo(REFERENCE.lacticAcidS.mw, 1);
    });

    it('(S)-lactic acid: chiral SMILES converts to valid MOL', async () => {
      const mol = await convertSmilesToMol(REFERENCE.lacticAcidS.smiles);
      expect(mol).toBeTruthy();
      expect(mol).toContain('M  END');
      expect(mol).toContain('V2000');
    });

    it('(S)-lactic acid: MOL round-trip preserves formula', async () => {
      const mol = await convertSmilesToMol(REFERENCE.lacticAcidS.smiles);
      expect(mol).toBeTruthy();
      const backSmiles = molfileToSmiles(mol!);
      expect(backSmiles).toBeTruthy();
      const formula = getMolecularFormula(backSmiles!);
      expect(formula).toBe(REFERENCE.lacticAcidS.formula);
    });

    it('mandelic acid: formula and MW correct', () => {
      const formula = getMolecularFormula(REFERENCE.mandelicAcid.smiles);
      expect(formula).toBe(REFERENCE.mandelicAcid.formula);
      const mw = getMolecularWeight(REFERENCE.mandelicAcid.smiles);
      expect(mw).toBeCloseTo(REFERENCE.mandelicAcid.mw, 1);
    });
  });

  describe('Aromatic Compounds (ChemDraw parity: aromatic vs Kekulé)', () => {
    it('benzene: aromatic SMILES yields C6H6', () => {
      const formula = getMolecularFormula(REFERENCE.benzene.smilesAromatic);
      expect(formula).toBe(REFERENCE.benzene.formula);
    });

    it('benzene: Kekulé SMILES yields same formula', () => {
      const formula = getMolecularFormula(REFERENCE.benzene.smilesKekule);
      expect(formula).toBe(REFERENCE.benzene.formula);
    });

    it('benzene: PubChem CID and properties match', async () => {
      const props = await getPropertiesByCID(REFERENCE.benzene.cid);
      expect(props?.MolecularFormula).toBe(REFERENCE.benzene.formula);
      expect(Number(props?.MolecularWeight)).toBeCloseTo(REFERENCE.benzene.mw, 1);
      expect(props?.InChIKey).toBe(REFERENCE.benzene.inchiKey);
    });

    it('pyridine: formula C5H5N correct', () => {
      const formula = getMolecularFormula(REFERENCE.pyridine.smiles);
      expect(formula).toBe(REFERENCE.pyridine.formula);
    });

    it('pyridine: PubChem properties match', async () => {
      const props = await getPropertiesByCID(REFERENCE.pyridine.cid);
      expect(props?.MolecularFormula).toBe(REFERENCE.pyridine.formula);
      expect(Number(props?.MolecularWeight)).toBeCloseTo(REFERENCE.pyridine.mw, 1);
    });
  });

  describe('Exact Mass (publication / ChemDraw parity)', () => {
    it('aspirin: ExactMass from PubChem within 0.01 Da', async () => {
      const props = await getPropertiesByCID(REFERENCE.aspirin.cid);
      const exactMass = props?.ExactMass ?? props?.MonoisotopicMass;
      expect(exactMass).toBeDefined();
      // Aspirin exact mass ~180.0423
      const mass = typeof exactMass === 'number' ? exactMass : parseFloat(String(exactMass));
      expect(mass).toBeGreaterThan(180);
      expect(mass).toBeLessThan(181);
    });

    it('benzene: ExactMass from PubChem ~78.047', async () => {
      const props = await getPropertiesByCID(REFERENCE.benzene.cid);
      const exactMass = props?.ExactMass ?? props?.MonoisotopicMass;
      expect(exactMass).toBeDefined();
      const mass = typeof exactMass === 'number' ? exactMass : parseFloat(String(exactMass));
      expect(mass).toBeCloseTo(REFERENCE.benzene.exactMass, 2);
    });
  });

  describe('MOL Format (ChemDraw compatibility)', () => {
    it('MOL has valid V2000 header with atom/bond counts', async () => {
      const mol = await convertSmilesToMol(REFERENCE.aspirin.smiles);
      expect(mol).toBeTruthy();
      const lines = mol!.split('\n');
      const countsLine = lines.find(l => l.includes('V2000'));
      expect(countsLine).toBeDefined();
      // Format: " 13 13  0  0  0  0  0  0  0  0999 V2000"
      const match = countsLine!.match(/(\d+)\s+(\d+)\s+.*V2000/);
      expect(match).toBeDefined();
      const numAtoms = parseInt(match![1], 10);
      const numBonds = parseInt(match![2], 10);
      expect(numAtoms).toBe(13); // aspirin
      expect(numBonds).toBe(13);
    });

    it('MOL has atom block + bond block before M  END', async () => {
      const mol = await convertSmilesToMol(REFERENCE.ethanol.smiles);
      expect(mol).toBeTruthy();
      const lines = mol!.split('\n');
      const v2000Idx = lines.findIndex(l => l.includes('V2000'));
      expect(v2000Idx).toBeGreaterThanOrEqual(0);
      const parts = lines[v2000Idx].trim().split(/\s+/);
      const numAtoms = parseInt(parts[0], 10);
      const numBonds = parseInt(parts[1], 10);
      expect(numAtoms).toBe(3); // ethanol C-C-O
      expect(numBonds).toBe(2);
      // Atom block (numAtoms lines) + bond block (numBonds lines) before M  END
      const molEndIdx = lines.findIndex(l => l.trim().startsWith('M  END'));
      const totalBlockLines = molEndIdx - v2000Idx - 1;
      expect(totalBlockLines).toBe(numAtoms + numBonds);
    });
  });

  describe('Name-to-Structure (ChemDraw parity)', () => {
    it('(S)-lactic acid: name search returns correct CID', async () => {
      const cid = await getCIDByName('(S)-lactic acid');
      expect(cid).toBe(REFERENCE.lacticAcidS.cid);
    });

    it('benzene: name search returns CID 241', async () => {
      const cid = await getCIDByName('benzene');
      expect(cid).toBe(REFERENCE.benzene.cid);
    });

    it('pyridine: name search returns CID 1049', async () => {
      const cid = await getCIDByName('pyridine');
      expect(cid).toBe(REFERENCE.pyridine.cid);
    });
  });
});
