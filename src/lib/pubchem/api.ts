/**
 * PubChem PUG-REST API Client
 * Provides access to PubChem chemical database with proper error handling and throttling
 */

import axios, { AxiosError } from 'axios';
import { pubchemThrottler } from './throttle';
import type { PubChemProperties, PubChemSummary } from '../../types/chemistry';

const PUG_REST_BASE = 'https://pubchem.ncbi.nlm.nih.gov/rest/pug';
const PUG_VIEW_BASE = 'https://pubchem.ncbi.nlm.nih.gov/rest/pug_view';

const REQUEST_TIMEOUT = 30000; // 30 seconds

export interface PubChemError {
  message: string;
  code?: string;
  status?: number;
}

/**
 * Search for compound by name and get CID
 * @param name - Compound name
 * @returns CID or null if not found
 */
export async function getCIDByName(name: string): Promise<number | null> {
  if (!name || name.trim().length === 0) {
    throw new Error('Compound name cannot be empty');
  }

  // Basic sanitization - already URL-encodes
  const sanitizedName = encodeURIComponent(name.trim());
  const url = `${PUG_REST_BASE}/compound/name/${sanitizedName}/cids/JSON`;

  try {
    const result = await pubchemThrottler.throttle(async () => {
      const response = await axios.get(url, {
        timeout: REQUEST_TIMEOUT,
        headers: {
          'Accept': 'application/json',
        },
      });
      return response.data;
    });

    const cid = result?.IdentifierList?.CID?.[0];
    return cid ? parseInt(cid) : null;
  } catch (error) {
    console.error('[PubChem] Error searching for compound:', error);
    return null;
  }
}

/**
 * Get ALL available compound properties by CID
 * @param cid - Compound ID
 * @param properties - Array of property names to fetch
 */
export async function getPropertiesByCID(
  cid: number,
  properties: string[] = [
    'MolecularFormula',
    'MolecularWeight',
    'ExactMass',
    'MonoisotopicMass',
    'IUPACName',
    'Title',
    'InChI',
    'InChIKey',
    'CanonicalSMILES',
    'IsomericSMILES',
    'XLogP',
    'TPSA',
    'Complexity',
    'Charge',
    'HBondDonorCount',
    'HBondAcceptorCount',
    'RotatableBondCount',
    'HeavyAtomCount',
    'IsotopeAtomCount',
    'AtomStereoCount',
    'DefinedAtomStereoCount',
    'UndefinedAtomStereoCount',
    'BondStereoCount',
    'DefinedBondStereoCount',
    'UndefinedBondStereoCount',
    'CovalentUnitCount',
    'Volume3D',
    'XStericQuadrupole3D',
    'YStericQuadrupole3D',
    'ZStericQuadrupole3D',
    'FeatureCount3D',
    'FeatureAcceptorCount3D',
    'FeatureDonorCount3D',
    'FeatureAnionCount3D',
    'FeatureCationCount3D',
    'FeatureRingCount3D',
    'FeatureHydrophobeCount3D',
    'ConformerModelRMSD3D',
    'EffectiveRotorCount3D',
    'ConformerCount3D',
    'Fingerprint2D',
  ]
): Promise<PubChemProperties | null> {
  if (!cid || cid <= 0) {
    throw new Error('Invalid CID');
  }

  const props = properties.join(',');
  const url = `${PUG_REST_BASE}/compound/cid/${cid}/property/${props}/JSON`;

  try {
    const result = await pubchemThrottler.throttle(async () => {
      const response = await axios.get(url, {
        timeout: REQUEST_TIMEOUT,
        headers: {
          'Accept': 'application/json',
        },
      });
      return response.data;
    });

    const propertyData = result?.PropertyTable?.Properties?.[0];
    return propertyData || null;
  } catch (error) {
    console.error('[PubChem] Error fetching properties:', error);
    return null;
  }
}

/**
 * Get compound summary from PUG-View
 * @param cid - Compound ID
 */
export async function getSummaryByCID(cid: number): Promise<PubChemSummary | null> {
  if (!cid || cid <= 0) {
    throw new Error('Invalid CID');
  }

  const url = `${PUG_VIEW_BASE}/data/compound/${cid}/JSON`;

  try {
    const result = await pubchemThrottler.throttle(async () => {
      const response = await axios.get(url, {
        timeout: REQUEST_TIMEOUT,
        headers: {
          'Accept': 'application/json',
        },
      });
      return response.data;
    });

    if (!result?.Record) {
      return null;
    }

    const record = result.Record;
    const summary: PubChemSummary = {
      cid: record.RecordNumber || cid,
      title: record.RecordTitle,
      description: extractDescription(record),
      synonyms: extractSynonyms(record),
    };

    return summary;
  } catch (error) {
    return handlePubChemError(error, `fetching summary for CID: ${cid}`);
  }
}

/**
 * Get 2D structure image URL
 * @param cid - Compound ID
 * @param size - Image size (small, medium, large)
 */
export function get2DImageURL(cid: number, size: 'small' | 'medium' | 'large' = 'medium'): string {
  const sizeMap = {
    small: 200,
    medium: 300,
    large: 500,
  };

  const imageSize = sizeMap[size];
  return `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/PNG?image_size=${imageSize}x${imageSize}`;
}

/**
 * Get 3D structure SDF
 * @param cid - Compound ID
 */
export async function get3DSDF(cid: number): Promise<string | null> {
  if (!cid || cid <= 0) {
    throw new Error('Invalid CID');
  }

  const url = `${PUG_REST_BASE}/compound/cid/${cid}/record/SDF?record_type=3d`;

  try {
    const result = await pubchemThrottler.throttle(async () => {
      const response = await axios.get(url, {
        timeout: REQUEST_TIMEOUT,
        headers: {
          'Accept': 'chemical/x-mdl-sdfile',
        },
        responseType: 'text',
      });
      return response.data;
    });

    return result;
  } catch (error) {
    return handlePubChemError(error, `fetching 3D SDF for CID: ${cid}`);
  }
}

/**
 * Get CID by SMILES (exact match)
 * @param smiles - SMILES string
 * @returns CID or null if not found
 */
export async function getCIDBySMILES(smiles: string): Promise<number | null> {
  if (!smiles || smiles.trim().length === 0) {
    throw new Error('SMILES string cannot be empty');
  }

  const sanitizedSmiles = encodeURIComponent(smiles.trim());
  const url = `${PUG_REST_BASE}/compound/smiles/${sanitizedSmiles}/cids/JSON`;

  try {
    const result = await pubchemThrottler.throttle(async () => {
      const response = await axios.get(url, {
        timeout: REQUEST_TIMEOUT,
        headers: {
          'Accept': 'application/json',
        },
      });
      return response.data;
    });

    const cid = result?.IdentifierList?.CID?.[0];
    return cid ? parseInt(cid) : null;
  } catch (error) {
    console.error('[PubChem] Error searching by SMILES:', error);
    return null;
  }
}

/**
 * Search for compounds by SMILES
 * @param smiles - SMILES string
 * @param searchType - Type of search (identity, similarity, substructure)
 */
export async function searchBySmiles(
  smiles: string,
  searchType: 'identity' | 'similarity' | 'substructure' = 'identity'
): Promise<number[] | null> {
  if (!smiles || smiles.trim().length === 0) {
    throw new Error('SMILES string cannot be empty');
  }

  const sanitizedSmiles = encodeURIComponent(smiles.trim());
  const url = searchType === 'identity'
    ? `${PUG_REST_BASE}/compound/smiles/${sanitizedSmiles}/cids/JSON`
    : `${PUG_REST_BASE}/compound/fastsimilarity_2d/smiles/${sanitizedSmiles}/cids/JSON`;

  try {
    const result = await pubchemThrottler.throttle(async () => {
      const response = await axios.get(url, {
        timeout: REQUEST_TIMEOUT,
        headers: {
          'Accept': 'application/json',
        },
      });
      return response.data;
    });

    const cids = result?.IdentifierList?.CID;
    return cids ? cids.map((cid: any) => parseInt(cid)) : null;
  } catch (error) {
    return handlePubChemError(error, `searching by SMILES: ${smiles}`);
  }
}

/**
 * Get CAS Registry Number for compound
 * @param cid - Compound ID
 */
export async function getCASNumber(cid: number): Promise<string | null> {
  if (!cid || cid <= 0) {
    throw new Error('Invalid CID');
  }

  const url = `${PUG_REST_BASE}/compound/cid/${cid}/synonyms/JSON`;

  try {
    const result = await pubchemThrottler.throttle(async () => {
      const response = await axios.get(url, {
        timeout: REQUEST_TIMEOUT,
        headers: {
          'Accept': 'application/json',
        },
      });
      return response.data;
    });

    const synonyms = result?.InformationList?.Information?.[0]?.Synonym || [];
    
    // Find CAS number (format: XXX-XX-X or XXXX-XX-X)
    const casRegex = /^\d{2,7}-\d{2}-\d$/;
    const casNumber = synonyms.find((syn: string) => casRegex.test(syn));
    
    return casNumber || null;
  } catch (error) {
    return handlePubChemError(error, `fetching CAS number for CID: ${cid}`);
  }
}

/**
 * Get compound synonyms
 * @param cid - Compound ID
 */
export async function getSynonyms(cid: number): Promise<string[] | null> {
  if (!cid || cid <= 0) {
    throw new Error('Invalid CID');
  }

  const url = `${PUG_REST_BASE}/compound/cid/${cid}/synonyms/JSON`;

  try {
    const result = await pubchemThrottler.throttle(async () => {
      const response = await axios.get(url, {
        timeout: REQUEST_TIMEOUT,
        headers: {
          'Accept': 'application/json',
        },
      });
      return response.data;
    });

    const synonyms = result?.InformationList?.Information?.[0]?.Synonym;
    return synonyms || null;
  } catch (error) {
    return handlePubChemError(error, `fetching synonyms for CID: ${cid}`);
  }
}

/**
 * Extract description from PubChem record
 */
function extractDescription(record: any): string | undefined {
  try {
    const sections = record?.Section || [];
    for (const section of sections) {
      if (section?.TOCHeading === 'Structures') {
        const info = section?.Information;
        if (Array.isArray(info)) {
          for (const item of info) {
            if (item?.Name === 'Computed Descriptors' && item?.Description) {
              return item.Description;
            }
          }
        }
      }
    }
  } catch (error) {
    console.warn('[PubChem] Error extracting description:', error);
  }
  return undefined;
}

/**
 * Extract synonyms from PubChem record
 */
function extractSynonyms(record: any): string[] | undefined {
  try {
    const sections = record?.Section || [];
    for (const section of sections) {
      if (section?.TOCHeading === 'Names and Identifiers') {
        const subsections = section?.Section || [];
        for (const subsection of subsections) {
          if (subsection?.TOCHeading === 'Synonyms') {
            const info = subsection?.Information;
            if (Array.isArray(info)) {
              const synonymsInfo = info.find((item: any) => item?.Name === 'Synonyms');
              if (synonymsInfo?.Value?.StringWithMarkup) {
                return synonymsInfo.Value.StringWithMarkup.map((item: any) => item.String);
              }
            }
          }
        }
      }
    }
  } catch (error) {
    console.warn('[PubChem] Error extracting synonyms:', error);
  }
  return undefined;
}

/**
 * Handle PubChem API errors
 */
function handlePubChemError(error: unknown, context: string): null {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;
    
    if (axiosError.response) {
      // Server responded with error
      const status = axiosError.response.status;
      
      if (status === 404) {
        console.warn(`[PubChem] Not found while ${context}`);
        return null;
      } else if (status === 400) {
        console.error(`[PubChem] Bad request while ${context}:`, axiosError.response.data);
        throw new Error(`Invalid request: ${context}`);
      } else if (status === 503) {
        console.error(`[PubChem] Service unavailable while ${context}`);
        throw new Error('PubChem service is temporarily unavailable. Please try again later.');
      } else if (status === 429) {
        console.error(`[PubChem] Rate limit exceeded while ${context}`);
        throw new Error('Too many requests. Please wait a moment and try again.');
      } else {
        console.error(`[PubChem] HTTP ${status} error while ${context}:`, axiosError.message);
        throw new Error(`PubChem API error (${status}): ${context}`);
      }
    } else if (axiosError.request) {
      // Request made but no response
      console.error(`[PubChem] No response while ${context}:`, axiosError.message);
      throw new Error('Unable to reach PubChem. Please check your internet connection.');
    } else {
      // Something else happened
      console.error(`[PubChem] Error while ${context}:`, axiosError.message);
      throw new Error(`Request error: ${axiosError.message}`);
    }
  } else {
    console.error(`[PubChem] Unexpected error while ${context}:`, error);
    throw new Error(`Unexpected error: ${context}`);
  }
}

/**
 * Get current throttler queue status
 */
export function getQueueStatus() {
  return {
    queueLength: pubchemThrottler.getQueueLength(),
  };
}

// Aliases for compatibility
export const getCIDByIdentifier = getCIDByName;
export const getCompoundProperties = getPropertiesByCID;
export const getCompoundSummary = getSummaryByCID;

