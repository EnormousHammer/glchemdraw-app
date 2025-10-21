/**
 * Cached PubChem API Client
 * Combines API calls with IndexedDB caching for offline support
 */

import * as api from './api';
import * as db from '../storage/db';
import type { PubChemProperties, PubChemSummary } from '../../types/chemistry';

export interface SearchResult {
  cid: number;
  properties: PubChemProperties;
  summary?: PubChemSummary;
  casNumber?: string;
  fromCache: boolean;
}

let offlineMode = false;

/**
 * Set offline mode
 * @param enabled - Whether offline mode is enabled
 */
export function setOfflineMode(enabled: boolean): void {
  offlineMode = enabled;
  console.log(`[PubChem Cache] Offline mode ${enabled ? 'enabled' : 'disabled'}`);
}

/**
 * Check if offline mode is enabled
 */
export function isOfflineMode(): boolean {
  return offlineMode;
}

/**
 * Search for compound by name (with caching)
 * @param name - Compound name
 */
export async function searchCompoundByName(name: string): Promise<SearchResult | null> {
  if (!name || name.trim().length === 0) {
    throw new Error('Compound name cannot be empty');
  }

  // Check cache first
  const cachedCID = await db.getCachedSearch(name);
  if (cachedCID) {
    console.log(`[PubChem Cache] Found cached CID for "${name}": ${cachedCID}`);
    
    const cachedCompound = await db.getCachedCompound(cachedCID);
    if (cachedCompound) {
      return {
        cid: cachedCompound.cid,
        properties: cachedCompound.properties,
        summary: cachedCompound.summary,
        fromCache: true,
      };
    }
  }

  // If offline mode and not in cache, return null
  if (offlineMode) {
    console.warn('[PubChem Cache] Offline mode: compound not in cache');
    return null;
  }

  // Fetch from API
  try {
    const cid = await api.getCIDByName(name);
    if (!cid) {
      return null;
    }

    // Cache the search result
    await db.cacheSearch(name, cid);

    // Get properties
    const properties = await api.getPropertiesByCID(cid);
    if (!properties) {
      return null;
    }

    // Get summary (optional, don't fail if not available)
    let summary: PubChemSummary | undefined;
    try {
      summary = (await api.getSummaryByCID(cid)) || undefined;
    } catch (error) {
      console.warn('[PubChem Cache] Could not fetch summary:', error);
    }

    // Cache the compound data
    await db.cacheCompound(cid, properties, summary);

    return {
      cid,
      properties,
      summary,
      fromCache: false,
    };
  } catch (error) {
    console.error('[PubChem Cache] Error searching compound:', error);
    throw error;
  }
}

/**
 * Get compound by CID (with caching)
 * @param cid - Compound ID
 */
export async function getCompoundByCID(cid: number): Promise<SearchResult | null> {
  if (!cid || cid <= 0) {
    throw new Error('Invalid CID');
  }

  // Check cache first
  const cached = await db.getCachedCompound(cid);
  if (cached) {
    console.log(`[PubChem Cache] Found cached compound: ${cid}`);
    return {
      cid: cached.cid,
      properties: cached.properties,
      summary: cached.summary,
      fromCache: true,
    };
  }

  // If offline mode and not in cache, return null
  if (offlineMode) {
    console.warn('[PubChem Cache] Offline mode: compound not in cache');
    return null;
  }

  // Fetch from API
  try {
    const properties = await api.getPropertiesByCID(cid);
    if (!properties) {
      return null;
    }

    // Get summary (optional)
    let summary: PubChemSummary | undefined;
    try {
      summary = (await api.getSummaryByCID(cid)) || undefined;
    } catch (error) {
      console.warn('[PubChem Cache] Could not fetch summary:', error);
    }

    // Get CAS number (optional)
    let casNumber: string | undefined;
    try {
      casNumber = (await api.getCASNumber(cid)) || undefined;
    } catch (error) {
      console.warn('[PubChem Cache] Could not fetch CAS number:', error);
    }

    // Cache the compound data
    await db.cacheCompound(cid, properties, summary);

    return {
      cid,
      properties,
      summary,
      casNumber,
      fromCache: false,
    };
  } catch (error) {
    console.error('[PubChem Cache] Error getting compound:', error);
    throw error;
  }
}

/**
 * Search by SMILES (no caching for now, as results can be large)
 * @param smiles - SMILES string
 * @param searchType - Search type
 */
export async function searchBySmiles(
  smiles: string,
  searchType: 'identity' | 'similarity' | 'substructure' = 'identity'
): Promise<number[] | null> {
  if (offlineMode) {
    throw new Error('SMILES search is not available in offline mode');
  }

  return await api.searchBySmiles(smiles, searchType);
}

/**
 * Search compound by SMILES and return full compound data
 * @param smiles - SMILES string
 * @param useCache - Whether to use cache
 */
export async function searchCompound(smiles: string, useCache: boolean = true): Promise<SearchResult | null> {
  if (!smiles || smiles.trim().length === 0) {
    throw new Error('SMILES string cannot be empty');
  }

  try {
    // Search for CIDs matching this SMILES
    const cids = await searchBySmiles(smiles, 'identity');
    
    if (!cids || cids.length === 0) {
      console.log('[PubChem Cache] No compounds found for SMILES:', smiles);
      return null;
    }

    // Get the first matching compound (exact match)
    const cid = cids[0];
    console.log(`[PubChem Cache] Found CID ${cid} for SMILES: ${smiles}`);
    
    // Use existing function to get full compound data with caching
    return await getCompoundByCID(cid);
  } catch (error) {
    console.error('[PubChem Cache] Error searching compound by SMILES:', error);
    return null; // Return null instead of throwing to avoid breaking the UI
  }
}

/**
 * Get synonyms for compound
 * @param cid - Compound ID
 */
export async function getSynonyms(cid: number): Promise<string[] | null> {
  if (offlineMode) {
    // Check if we have summary with synonyms in cache
    const cached = await db.getCachedCompound(cid);
    if (cached?.summary?.synonyms) {
      return cached.summary.synonyms;
    }
    return null;
  }

  return await api.getSynonyms(cid);
}

/**
 * Get 2D image URL
 * @param cid - Compound ID
 * @param size - Image size
 */
export function get2DImageURL(cid: number, size: 'small' | 'medium' | 'large' = 'medium'): string {
  return api.get2DImageURL(cid, size);
}

/**
 * Pre-fetch and cache multiple compounds
 * @param cids - Array of compound IDs
 * @param onProgress - Progress callback
 */
export async function prefetchCompounds(
  cids: number[],
  onProgress?: (current: number, total: number) => void
): Promise<void> {
  if (offlineMode) {
    throw new Error('Cannot prefetch in offline mode');
  }

  console.log(`[PubChem Cache] Prefetching ${cids.length} compounds...`);

  for (let i = 0; i < cids.length; i++) {
    try {
      await getCompoundByCID(cids[i]);
      if (onProgress) {
        onProgress(i + 1, cids.length);
      }
    } catch (error) {
      console.warn(`[PubChem Cache] Failed to prefetch CID ${cids[i]}:`, error);
    }
  }

  console.log('[PubChem Cache] Prefetch complete');
}

/**
 * Clear all cached PubChem data
 */
export async function clearCache(): Promise<void> {
  await db.clearAllCache();
}

/**
 * Get cache statistics
 */
export async function getCacheStats() {
  return await db.getCacheStats();
}

/**
 * Get queue status
 */
export function getQueueStatus() {
  return api.getQueueStatus();
}

// Re-export db functions for tests
export { getCachedCompound, cacheCompound } from '../storage/db';

