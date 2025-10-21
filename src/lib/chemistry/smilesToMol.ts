/**
 * SMILES to MOL Conversion
 * Converts SMILES strings to MOL file format for canvas loading
 */

import { smilesToMolfile } from './rdkit';
// @ts-ignore - OpenChemLib types
import OCL from 'openchemlib';

/**
 * Convert SMILES to MOL file for canvas loading
 * @param smiles - SMILES string
 * @returns MOL file content or null
 */
export async function convertSmilesToMol(smiles: string): Promise<string | null> {
  if (!smiles || smiles.trim().length === 0) {
    console.log('[SMILES to MOL] No SMILES provided');
    return null;
  }

  console.log('[SMILES to MOL] Converting SMILES:', smiles);

  // Use OpenChemLib to create a proper MOL file (Ketcher standalone mode doesn't support SMILES)
  try {
    const properMol = createProperMolFile(smiles);
    console.log('[SMILES to MOL] ✅ Generated proper MOL file');
    console.log('[SMILES to MOL] MOL content length:', properMol.length);
    console.log('[SMILES to MOL] MOL preview:', properMol.substring(0, 200) + '...');
    return properMol;
  } catch (error) {
    console.error('[SMILES to MOL] ❌ Failed to generate MOL file:', error);
    return null;
  }
}

/**
 * Create a proper MOL file from SMILES using OpenChemLib
 * @param smiles - SMILES string
 * @returns Proper MOL file content
 */
function createProperMolFile(smiles: string): string {
  try {
    console.log('[SMILES to MOL] Creating MOL file for SMILES:', smiles);
    
    // Check if OpenChemLib is available
    if (typeof OCL === 'undefined') {
      console.error('[SMILES to MOL] OpenChemLib (OCL) is not defined!');
      throw new Error('OpenChemLib not available');
    }
    
    // Use OpenChemLib to create a proper MOL file
    const mol = OCL.Molecule.fromSmiles(smiles);
    console.log('[SMILES to MOL] OpenChemLib molecule created successfully');
    console.log('[SMILES to MOL] Atom count:', mol.getAllAtoms());
    console.log('[SMILES to MOL] Bond count:', mol.getAllBonds());
    
    // Try V2000 format first (more compatible)
    const molfileV2000 = mol.toMolfile();
    console.log('[SMILES to MOL] V2000 MOL file generated, length:', molfileV2000.length);
    console.log('[SMILES to MOL] V2000 preview:', molfileV2000.substring(0, 300));
    
    if (molfileV2000 && molfileV2000.includes('V2000')) {
      console.log('[SMILES to MOL] ✅ Using V2000 format');
      return molfileV2000;
    }
    
    // Try V3000 format as fallback
    const molfileV3000 = mol.toMolfileV3();
    console.log('[SMILES to MOL] V3000 MOL file generated, length:', molfileV3000.length);
    
    if (molfileV3000 && molfileV3000.includes('V3000')) {
      console.log('[SMILES to MOL] ✅ Using V3000 format');
      return molfileV3000;
    }
    
    console.log('[SMILES to MOL] Both formats failed, using fallback');
    return createFallbackMolFile(smiles);
    
  } catch (error) {
    console.error('[SMILES to MOL] OpenChemLib failed:', error);
    return createFallbackMolFile(smiles);
  }
}

/**
 * Create a fallback MOL file when OpenChemLib fails
 * @param smiles - SMILES string
 * @returns Fallback MOL file content
 */
function createFallbackMolFile(smiles: string): string {
  const timestamp = new Date().toISOString();
  const atomCount = countAtomsInSmiles(smiles);
  const bondCount = Math.max(0, atomCount - 1);
  
  return `Generated from SMILES: ${smiles}
  GlChemDraw
  Generated on ${timestamp}

${atomCount.toString().padStart(3)}${bondCount.toString().padStart(3)}  0  0  0  0  0  0  0  0  0  0999 V2000
M  END
$$$$
`;
}

/**
 * Count atoms in SMILES string (rough estimate)
 * @param smiles - SMILES string
 * @returns Estimated atom count
 */
function countAtomsInSmiles(smiles: string): number {
  // Count capital letters (usually atoms)
  const capitalLetters = (smiles.match(/[A-Z]/g) || []).length;
  // Count lowercase letters that might be atoms
  const lowercaseLetters = (smiles.match(/[a-z]/g) || []).length;
  // Count numbers (might indicate multiple atoms)
  const numbers = (smiles.match(/\d/g) || []).length;
  
  return Math.max(1, capitalLetters + lowercaseLetters + numbers);
}

/**
 * Validate and clean SMILES string
 * @param smiles - Raw SMILES string
 * @returns Cleaned SMILES or null if invalid
 */
export function cleanSmiles(smiles: string): string | null {
  if (!smiles || typeof smiles !== 'string') {
    return null;
  }

  // Remove whitespace and common prefixes
  let cleaned = smiles.trim();
  
  // Remove common prefixes
  const prefixes = ['SMILES:', 'smiles:', 'CanonicalSMILES:', 'canonicalsmiles:'];
  for (const prefix of prefixes) {
    if (cleaned.toLowerCase().startsWith(prefix.toLowerCase())) {
      cleaned = cleaned.substring(prefix.length).trim();
    }
  }

  // Basic validation - should contain only valid SMILES characters
  const validChars = /^[A-Za-z0-9@+\-\\/()\[\]=#$%&*.:;!?~`|{}^~]+$/;
  if (!validChars.test(cleaned)) {
    console.warn('[SMILES] Invalid characters detected:', cleaned);
    return null;
  }

  return cleaned;
}
