/**
 * RDKit WASM Wrapper for Enterprise Chemistry Application
 * Provides structure validation, property calculation, and molecular transformations
 */

import type { MolecularProperties, StructureValidation, ChemicalDescriptors } from '../../types/chemistry';
import initRDKitModule from '@rdkit/rdkit';

let rdkitInstance: any = null;
let loadingPromise: Promise<any> | null = null;

/**
 * Initialize RDKit WASM module (singleton pattern)
 * @returns Promise that resolves to RDKit instance
 */
export async function initRDKit(): Promise<any> {
  if (rdkitInstance && typeof rdkitInstance.get_mol === 'function') {
    return rdkitInstance;
  }

  if (loadingPromise) {
    return loadingPromise;
  }

  loadingPromise = (async () => {
    try {
      console.log('[RDKit] Loading WASM module...');
      // locateFile: Vite bundles don't serve node_modules; WASM must be in public/ or CDN
      const RDKit = await initRDKitModule({
        locateFile: (path: string) => (path.endsWith('.wasm') ? '/RDKit_minimal.wasm' : path),
      });
      
      // Wait for RDKit to be fully initialized
      let retries = 0;
      const maxRetries = 10;
      
      while (retries < maxRetries) {
        if (RDKit && typeof (RDKit as any).get_mol === 'function') {
          rdkitInstance = RDKit;
          console.log('[RDKit] WASM module loaded successfully with get_mol function');
          return rdkitInstance;
        }
        
        // Wait a bit for RDKit to fully initialize
        await new Promise(resolve => setTimeout(resolve, 100));
        retries++;
      }
      
      // If we get here, RDKit loaded but get_mol isn't available
      console.warn('[RDKit] WASM loaded but get_mol function not available');
      rdkitInstance = RDKit;
      return rdkitInstance;
    } catch (error) {
      console.error('[RDKit] Failed to load WASM module:', error);
      loadingPromise = null;
      throw new Error('Failed to initialize RDKit: ' + (error as Error).message);
    }
  })();

  return loadingPromise;
}

/**
 * Check if RDKit is loaded
 */
export function isRDKitLoaded(): boolean {
  return rdkitInstance !== null;
}

/**
 * Validate a chemical structure with detailed valence checking
 * @param input - SMILES string or MOL file content
 * @param format - Input format ('smiles' or 'mol')
 */
export async function validateStructure(
  input: string,
  format: 'smiles' | 'mol' = 'smiles'
): Promise<StructureValidation> {
  try {
    const rdkit = await initRDKit();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!rdkit || typeof rdkit.get_mol !== 'function') {
      console.warn('[RDKit] WASM not loaded, using fallback validation');
      return {
        isValid: input.trim().length > 0,
        errors: input.trim().length === 0 ? ['Empty input'] : [],
        warnings: ['RDKit validation unavailable'],
      };
    }

    let mol;
    
    if (format === 'smiles') {
      mol = rdkit.get_mol(input);
    } else {
      mol = rdkit.get_mol_from_molblock(input);
    }

    if (!mol || mol.is_valid() === 0) {
      errors.push('Invalid chemical structure');
      return { isValid: false, errors, warnings };
    }

    // Check for common issues
    const numAtoms = mol.get_num_atoms();
    if (numAtoms === 0) {
      errors.push('Structure contains no atoms');
    }

    // Detailed valence checking
    try {
      mol.update_property_cache(true);
      
      // Check for radical electrons
      const details = mol.get_descriptors();
      if (details && details.NumRadicalElectrons > 0) {
        warnings.push(`Structure contains ${details.NumRadicalElectrons} radical electron(s)`);
      }
    } catch (e) {
      const errorMsg = (e as Error).message || '';
      if (errorMsg.includes('valence') || errorMsg.includes('Explicit valence')) {
        errors.push('Valence error: One or more atoms have incorrect valence');
      } else {
        warnings.push('Property cache update failed - possible valence issues');
      }
    }

    // Check for unspecified stereochemistry
    try {
      const desc = mol.get_descriptors();
      const undefinedStereo = parseInt(desc.NumUnspecifiedAtomStereoCenters || '0');
      if (undefinedStereo > 0) {
        warnings.push(`${undefinedStereo} stereocenter(s) with undefined configuration`);
      }
    } catch (e) {
      // Silently ignore - not critical
    }

    // Check for unusual elements or charges
    try {
      const charge = mol.get_charge ? mol.get_charge() : 0;
      if (charge !== 0) {
        warnings.push(`Structure has net charge: ${charge > 0 ? '+' : ''}${charge}`);
      }
    } catch (e) {
      // Silently ignore
    }

    mol.delete();

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  } catch (error) {
    const errorMsg = (error as Error).message || 'Unknown validation error';
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Parse specific RDKit errors
    if (errorMsg.includes('valence')) {
      errors.push('Valence error: Check atom connectivity and formal charges');
    } else if (errorMsg.includes('SMILES')) {
      errors.push('Invalid SMILES syntax');
    } else if (errorMsg.includes('MOL')) {
      errors.push('Invalid MOL file format');
    } else {
      errors.push(errorMsg);
    }
    
    return { isValid: false, errors, warnings };
  }
}

/**
 * Calculate molecular properties
 * @param smiles - SMILES string
 */
export async function calculateProperties(smiles: string): Promise<MolecularProperties | null> {
  try {
    const rdkit = await initRDKit();
    
    if (!rdkit || typeof rdkit.get_mol !== 'function') {
      console.warn('[RDKit] get_mol function not available, using fallback properties');
      return {
        molecularFormula: 'Unknown',
        molecularWeight: 0,
        canonicalSmiles: smiles,
      };
    }

    const mol = rdkit.get_mol(smiles);
    if (!mol || mol.is_valid() === 0) {
      return null;
    }

    const properties: MolecularProperties = {
      molecularFormula: mol.get_molformula() || undefined,
      molecularWeight: parseFloat(mol.get_descriptors().amw) || undefined,
      exactMass: parseFloat(mol.get_descriptors().ExactMW) || undefined,
      canonicalSmiles: mol.get_smiles() || undefined,
    };

    mol.delete();
    return properties;
  } catch (error) {
    console.error('[RDKit] Error calculating properties:', error);
    // Fallback to basic validation
    return {
      molecularFormula: 'Unknown',
      molecularWeight: 0,
      canonicalSmiles: smiles,
    };
  }
}

/**
 * Calculate chemical descriptors
 * @param smiles - SMILES string
 */
export async function calculateDescriptors(smiles: string): Promise<ChemicalDescriptors | null> {
  try {
    const rdkit = await initRDKit();
    
    if (!rdkit || typeof rdkit.get_mol !== 'function') {
      console.warn('[RDKit] WASM not loaded, using fallback descriptors');
      return {
        molecularWeight: 0,
        logP: undefined,
        hBondDonors: undefined,
        hBondAcceptors: undefined,
        tpsa: undefined,
        rotatableBonds: undefined,
        rings: undefined,
        aromaticRings: undefined,
      };
    }

    const mol = rdkit.get_mol(smiles);
    if (!mol || mol.is_valid() === 0) {
      return null;
    }

    const desc = mol.get_descriptors();

    const descriptors: ChemicalDescriptors = {
      molecularWeight: parseFloat(desc.amw) || 0,
      logP: parseFloat(desc.CrippenClogP) || undefined,
      hBondDonors: parseInt(desc.lipinskiHBD) || undefined,
      hBondAcceptors: parseInt(desc.lipinskiHBA) || undefined,
      tpsa: parseFloat(desc.TPSA) || undefined,
      rotatableBonds: parseInt(desc.NumRotatableBonds) || undefined,
      rings: parseInt(desc.NumRings) || undefined,
      aromaticRings: parseInt(desc.NumAromaticRings) || undefined,
    };

    mol.delete();
    return descriptors;
  } catch (error) {
    console.error('[RDKit] Error calculating descriptors:', error);
    return null;
  }
}

/**
 * Convert SMILES to MOL file format
 * @param smiles - SMILES string
 */
export async function smilesToMolfile(smiles: string): Promise<string | null> {
  try {
    const rdkit = await initRDKit();
    
    if (!rdkit || typeof rdkit.get_mol !== 'function') {
      console.warn('[RDKit] get_mol function not available for SMILES to MOL conversion');
      return null;
    }

    const mol = rdkit.get_mol(smiles);
    if (!mol || mol.is_valid() === 0) {
      return null;
    }

    const molblock = mol.get_molblock();
    mol.delete();
    return molblock;
  } catch (error) {
    console.error('[RDKit] Error converting SMILES to MOL:', error);
    return null;
  }
}

/**
 * Convert MOL file to SMILES
 * @param molfile - MOL file content
 */
export async function molfileToSmiles(molfile: string): Promise<string | null> {
  try {
    const rdkit = await initRDKit();
    
    if (!rdkit || typeof rdkit.get_mol_from_molblock !== 'function') {
      console.warn('[RDKit] get_mol_from_molblock function not available for MOL to SMILES conversion');
      return null;
    }

    const mol = rdkit.get_mol_from_molblock(molfile);
    if (!mol || mol.is_valid() === 0) {
      return null;
    }

    const smiles = mol.get_smiles();
    mol.delete();
    return smiles;
  } catch (error) {
    console.error('[RDKit] Error converting MOL to SMILES:', error);
    return null;
  }
}

/**
 * Generate 2D coordinates for a structure
 * @param molfile - MOL file content
 */
export async function generate2DCoords(molfile: string): Promise<string | null> {
  const rdkit = await initRDKit();

  try {
    const mol = rdkit.get_mol_from_molblock(molfile);
    if (!mol || mol.is_valid() === 0) {
      return null;
    }

    // Generate 2D coordinates
    mol.set_new_coords(true);
    const newMolblock = mol.get_molblock();
    mol.delete();
    return newMolblock;
  } catch (error) {
    console.error('[RDKit] Error generating 2D coords:', error);
    return null;
  }
}

/**
 * Perform substructure matching
 * @param molSmiles - Molecule SMILES
 * @param querySmiles - Query substructure SMILES
 */
export async function hasSubstructure(
  molSmiles: string,
  querySmiles: string
): Promise<boolean> {
  const rdkit = await initRDKit();

  try {
    const mol = rdkit.get_mol(molSmiles);
    const query = rdkit.get_mol(querySmiles);

    if (!mol || !query || mol.is_valid() === 0 || query.is_valid() === 0) {
      mol?.delete();
      query?.delete();
      return false;
    }

    const matches = mol.get_substruct_match(query);
    const hasMatch = matches && JSON.parse(matches).length > 0;

    mol.delete();
    query.delete();

    return hasMatch;
  } catch (error) {
    console.error('[RDKit] Error in substructure matching:', error);
    return false;
  }
}

/**
 * Calculate InChI from SMILES
 * @param smiles - SMILES string
 */
export async function generateInChI(smiles: string): Promise<string | null> {
  const rdkit = await initRDKit();

  try {
    const mol = rdkit.get_mol(smiles);
    if (!mol || mol.is_valid() === 0) {
      return null;
    }

    const inchi = mol.get_inchi();
    mol.delete();
    return inchi;
  } catch (error) {
    console.error('[RDKit] Error generating InChI:', error);
    return null;
  }
}

/**
 * Calculate InChI Key from SMILES
 * @param smiles - SMILES string
 */
export async function generateInChIKey(smiles: string): Promise<string | null> {
  const rdkit = await initRDKit();

  try {
    const mol = rdkit.get_mol(smiles);
    if (!mol || mol.is_valid() === 0) {
      return null;
    }

    const inchiKey = mol.get_inchi_key();
    mol.delete();
    return inchiKey;
  } catch (error) {
    console.error('[RDKit] Error generating InChI Key:', error);
    return null;
  }
}

/**
 * Canonicalize SMILES
 * @param smiles - SMILES string
 */
export async function canonicalizeSmiles(smiles: string): Promise<string | null> {
  const rdkit = await initRDKit();

  try {
    const mol = rdkit.get_mol(smiles);
    if (!mol || mol.is_valid() === 0) {
      return null;
    }

    const canonical = mol.get_smiles();
    mol.delete();
    return canonical;
  } catch (error) {
    console.error('[RDKit] Error canonicalizing SMILES:', error);
    return null;
  }
}

/**
 * Get stereochemistry information (chiral centers, R/S configuration)
 * @param smiles - SMILES string
 */
export interface StereochemistryInfo {
  chiralCenters: number;
  unspecifiedCenters: number;
  inchiWithStereochemistry?: string;
}

export async function getStereochemistryInfo(smiles: string): Promise<StereochemistryInfo | null> {
  try {
    const rdkit = await initRDKit();
    if (!rdkit || typeof rdkit.get_mol !== 'function') return null;

    const mol = rdkit.get_mol(smiles);
    if (!mol || mol.is_valid() === 0) return null;

    const desc = mol.get_descriptors();
    const chiralCenters = parseInt(desc.NumAtomStereoCenters || desc.NumChiralCenters || '0') || 0;
    const unspecifiedCenters = parseInt(desc.NumUnspecifiedAtomStereoCenters || '0') || 0;

    let inchiWithStereochemistry: string | undefined;
    try {
      const inchi = mol.get_inchi();
      if (inchi && inchi.includes('/t')) {
        inchiWithStereochemistry = inchi;
      }
    } catch {
      // InChI may fail for some structures
    }

    mol.delete();

    return {
      chiralCenters,
      unspecifiedCenters,
      inchiWithStereochemistry,
    };
  } catch (error) {
    console.error('[RDKit] Error getting stereochemistry:', error);
    return null;
  }
}

// Aliases for compatibility
export const getMolecularProperties = calculateProperties;
export const getChemicalDescriptors = calculateDescriptors;

