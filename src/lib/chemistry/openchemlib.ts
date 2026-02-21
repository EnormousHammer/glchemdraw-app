/**
 * OpenChemLib Utilities
 * Lightweight chemistry helpers for quick operations
 */

// @ts-ignore - OpenChemLib types
import OCL from 'openchemlib';
import type { MolecularProperties } from '../../types/chemistry';

/**
 * Parse SMILES using OpenChemLib
 * @param smiles - SMILES string
 */
export function parseSmilesOCL(smiles: string): any {
  try {
    const mol = OCL.Molecule.fromSmiles(smiles);
    return mol;
  } catch (error) {
    console.error('[OpenChemLib] Error parsing SMILES:', error);
    return null;
  }
}

/**
 * Get first structure from multi-structure SMILES (dot-separated).
 * Prevents invalid formula when disconnected fragments (e.g. benzene + OMe) are combined.
 */
export function getFirstStructureSmiles(smiles: string): string {
  if (!smiles || typeof smiles !== 'string') return smiles || '';
  const parts = smiles.split(/\s*\.\s*/).filter(Boolean);
  return parts[0] || smiles;
}

/**
 * Get molecular formula from SMILES.
 * For multi-structure SMILES (dot-separated), uses first structure only to avoid invalid formulas.
 */
export function getMolecularFormula(smiles: string): string | null {
  try {
    const single = getFirstStructureSmiles(smiles);
    const mol = OCL.Molecule.fromSmiles(single);
    return mol.getMolecularFormula().formula;
  } catch (error) {
    console.error('[OpenChemLib] Error getting molecular formula:', error);
    return null;
  }
}

/**
 * Get molecular weight from SMILES.
 * For multi-structure SMILES, uses first structure only.
 */
export function getMolecularWeight(smiles: string): number | null {
  try {
    const single = getFirstStructureSmiles(smiles);
    const mol = OCL.Molecule.fromSmiles(single);
    return mol.getMolecularFormula().relativeWeight;
  } catch (error) {
    console.error('[OpenChemLib] Error getting molecular weight:', error);
    return null;
  }
}

/**
 * Convert SMILES to MOL file using OpenChemLib
 * @param smiles - SMILES string
 */
export function smilesToMolV3000(smiles: string): string | null {
  try {
    const mol = OCL.Molecule.fromSmiles(smiles);
    return mol.toMolfileV3();
  } catch (error) {
    console.error('[OpenChemLib] Error converting to MOL:', error);
    return null;
  }
}

/**
 * Get SVG representation of molecule
 * @param smiles - SMILES string
 * @param width - SVG width
 * @param height - SVG height
 */
export function generateSVG(smiles: string, width: number = 300, height: number = 200): string | null {
  try {
    const mol = OCL.Molecule.fromSmiles(smiles);
    return mol.toSVG(width, height);
  } catch (error) {
    console.error('[OpenChemLib] Error generating SVG:', error);
    return null;
  }
}

/**
 * Calculate basic properties using OpenChemLib
 * @param smiles - SMILES string
 */
export function calculateBasicProperties(smiles: string): Partial<MolecularProperties> | null {
  try {
    const mol = OCL.Molecule.fromSmiles(smiles);
    const formula = mol.getMolecularFormula();
    
    return {
      molecularFormula: formula.formula,
      molecularWeight: formula.relativeWeight,
      canonicalSmiles: mol.getCanonizedIDCode(),
    };
  } catch (error) {
    console.error('[OpenChemLib] Error calculating properties:', error);
    return null;
  }
}

/**
 * Validate SMILES syntax
 * @param smiles - SMILES string
 */
export function isValidSmiles(smiles: string): boolean {
  try {
    const mol = OCL.Molecule.fromSmiles(smiles);
    return mol.getAllAtoms() > 0;
  } catch (error) {
    return false;
  }
}

/**
 * Get number of atoms
 * @param smiles - SMILES string
 */
export function getAtomCount(smiles: string): number | null {
  try {
    const mol = OCL.Molecule.fromSmiles(smiles);
    return mol.getAllAtoms();
  } catch (error) {
    return null;
  }
}

/**
 * Get number of bonds
 * @param smiles - SMILES string
 */
export function getBondCount(smiles: string): number | null {
  try {
    const mol = OCL.Molecule.fromSmiles(smiles);
    return mol.getAllBonds();
  } catch (error) {
    return null;
  }
}

/**
 * Convert MOL file to SMILES
 * @param molfile - MOL file content
 */
export function molfileToSmiles(molfile: string): string | null {
  try {
    const mol = OCL.Molecule.fromMolfile(molfile);
    return mol.toSmiles();
  } catch (error) {
    console.error('[OpenChemLib] Error converting molfile to SMILES:', error);
    return null;
  }
}

// Aliases for compatibility
export const getMolecularFormulaFromSmiles = getMolecularFormula;
export const getMolecularWeightFromSmiles = getMolecularWeight;

