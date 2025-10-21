/**
 * IndexedDB Storage Layer
 * Provides offline caching for PubChem data and user structures
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { PubChemProperties, PubChemSummary } from '../../types/chemistry';

const DB_NAME = 'GlChemDrawDB';
const DB_VERSION = 1;

// Cache expiration time (7 days in milliseconds)
const CACHE_EXPIRATION_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_CACHE_ENTRIES = 1000;

interface CachedCompound {
  cid: number;
  properties: PubChemProperties;
  summary?: PubChemSummary;
  timestamp: number;
}

interface CachedSearch {
  query: string;
  cid: number;
  timestamp: number;
}

interface SavedStructure {
  id: string;
  name: string;
  smiles?: string;
  molfile?: string;
  properties?: any;
  timestamp: number;
  lastModified: number;
}

interface GlChemDrawDBSchema extends DBSchema {
  compounds: {
    key: number;
    value: CachedCompound;
    indexes: { 'by-timestamp': number };
  };
  searches: {
    key: string;
    value: CachedSearch;
    indexes: { 'by-timestamp': number };
  };
  structures: {
    key: string;
    value: SavedStructure;
    indexes: { 'by-lastModified': number; 'by-name': string };
  };
  settings: {
    key: string;
    value: any;
  };
}

let dbInstance: IDBPDatabase<GlChemDrawDBSchema> | null = null;

/**
 * Initialize database connection
 */
export async function initDB(): Promise<IDBPDatabase<GlChemDrawDBSchema>> {
  if (dbInstance) {
    return dbInstance;
  }

  try {
    dbInstance = await openDB<GlChemDrawDBSchema>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, newVersion) {
        console.log(`[DB] Upgrading database from version ${oldVersion} to ${newVersion}`);

        // Create compounds store
        if (!db.objectStoreNames.contains('compounds')) {
          const compoundStore = db.createObjectStore('compounds', { keyPath: 'cid' });
          compoundStore.createIndex('by-timestamp', 'timestamp');
        }

        // Create searches store
        if (!db.objectStoreNames.contains('searches')) {
          const searchStore = db.createObjectStore('searches', { keyPath: 'query' });
          searchStore.createIndex('by-timestamp', 'timestamp');
        }

        // Create structures store
        if (!db.objectStoreNames.contains('structures')) {
          const structureStore = db.createObjectStore('structures', { keyPath: 'id' });
          structureStore.createIndex('by-lastModified', 'lastModified');
          structureStore.createIndex('by-name', 'name');
        }

        // Create settings store
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      },
    });

    console.log('[DB] Database initialized successfully');
    return dbInstance;
  } catch (error) {
    console.error('[DB] Failed to initialize database:', error);
    throw new Error('Failed to initialize database: ' + (error as Error).message);
  }
}

/**
 * Cache compound data
 */
export async function cacheCompound(
  cid: number,
  properties: PubChemProperties,
  summary?: PubChemSummary
): Promise<void> {
  const db = await initDB();

  try {
    await db.put('compounds', {
      cid,
      properties,
      summary,
      timestamp: Date.now(),
    });

    // Check cache size and clean if needed
    await cleanOldCacheEntries();
  } catch (error) {
    console.error('[DB] Error caching compound:', error);
  }
}

/**
 * Get cached compound data
 */
export async function getCachedCompound(cid: number): Promise<CachedCompound | null> {
  const db = await initDB();

  try {
    const cached = await db.get('compounds', cid);

    if (!cached) {
      return null;
    }

    // Check if cache is expired
    if (Date.now() - cached.timestamp > CACHE_EXPIRATION_MS) {
      await db.delete('compounds', cid);
      return null;
    }

    return cached;
  } catch (error) {
    console.error('[DB] Error getting cached compound:', error);
    return null;
  }
}

/**
 * Cache search result (name -> CID mapping)
 */
export async function cacheSearch(query: string, cid: number): Promise<void> {
  const db = await initDB();

  try {
    await db.put('searches', {
      query: query.toLowerCase().trim(),
      cid,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('[DB] Error caching search:', error);
  }
}

/**
 * Get cached search result
 */
export async function getCachedSearch(query: string): Promise<number | null> {
  const db = await initDB();

  try {
    const cached = await db.get('searches', query.toLowerCase().trim());

    if (!cached) {
      return null;
    }

    // Check if cache is expired
    if (Date.now() - cached.timestamp > CACHE_EXPIRATION_MS) {
      await db.delete('searches', query.toLowerCase().trim());
      return null;
    }

    return cached.cid;
  } catch (error) {
    console.error('[DB] Error getting cached search:', error);
    return null;
  }
}

/**
 * Save user structure
 */
export async function saveStructure(
  id: string,
  name: string,
  data: { smiles?: string; molfile?: string; properties?: any }
): Promise<void> {
  const db = await initDB();

  try {
    const now = Date.now();
    const existing = await db.get('structures', id);

    await db.put('structures', {
      id,
      name,
      smiles: data.smiles,
      molfile: data.molfile,
      properties: data.properties,
      timestamp: existing?.timestamp || now,
      lastModified: now,
    });
  } catch (error) {
    console.error('[DB] Error saving structure:', error);
    throw error;
  }
}

/**
 * Get saved structure
 */
export async function getStructure(id: string): Promise<SavedStructure | null> {
  const db = await initDB();

  try {
    const structure = await db.get('structures', id);
    return structure || null;
  } catch (error) {
    console.error('[DB] Error getting structure:', error);
    return null;
  }
}

/**
 * Get all saved structures
 */
export async function getAllStructures(): Promise<SavedStructure[]> {
  const db = await initDB();

  try {
    const structures = await db.getAll('structures');
    return structures.sort((a, b) => b.lastModified - a.lastModified);
  } catch (error) {
    console.error('[DB] Error getting all structures:', error);
    return [];
  }
}

/**
 * Delete saved structure
 */
export async function deleteStructure(id: string): Promise<void> {
  const db = await initDB();

  try {
    await db.delete('structures', id);
  } catch (error) {
    console.error('[DB] Error deleting structure:', error);
    throw error;
  }
}

/**
 * Get or set settings
 */
export async function getSetting<T>(key: string, defaultValue: T): Promise<T> {
  const db = await initDB();

  try {
    const setting = await db.get('settings', key);
    return setting?.value ?? defaultValue;
  } catch (error) {
    console.error('[DB] Error getting setting:', error);
    return defaultValue;
  }
}

export async function setSetting<T>(key: string, value: T): Promise<void> {
  const db = await initDB();

  try {
    await db.put('settings', { key, value });
  } catch (error) {
    console.error('[DB] Error setting value:', error);
    throw error;
  }
}

/**
 * Clean old cache entries if cache size exceeds limit
 */
async function cleanOldCacheEntries(): Promise<void> {
  const db = await initDB();

  try {
    // Get all compounds sorted by timestamp
    const compounds = await db.getAllFromIndex('compounds', 'by-timestamp');

    if (compounds.length > MAX_CACHE_ENTRIES) {
      const entriesToDelete = compounds.length - MAX_CACHE_ENTRIES;
      console.log(`[DB] Cleaning ${entriesToDelete} old cache entries`);

      for (let i = 0; i < entriesToDelete; i++) {
        await db.delete('compounds', compounds[i].cid);
      }
    }
  } catch (error) {
    console.error('[DB] Error cleaning old cache entries:', error);
  }
}

/**
 * Clear all cached data (for testing/debugging)
 */
export async function clearAllCache(): Promise<void> {
  const db = await initDB();

  try {
    await db.clear('compounds');
    await db.clear('searches');
    console.log('[DB] All cache cleared');
  } catch (error) {
    console.error('[DB] Error clearing cache:', error);
    throw error;
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats() {
  const db = await initDB();

  try {
    const compoundCount = await db.count('compounds');
    const searchCount = await db.count('searches');
    const structureCount = await db.count('structures');

    return {
      compounds: compoundCount,
      searches: searchCount,
      structures: structureCount,
    };
  } catch (error) {
    console.error('[DB] Error getting cache stats:', error);
    return {
      compounds: 0,
      searches: 0,
      structures: 0,
    };
  }
}

/**
 * Export all structures as JSON
 */
export async function exportStructures(): Promise<string> {
  const structures = await getAllStructures();
  return JSON.stringify(structures, null, 2);
}

/**
 * Import structures from JSON
 */
export async function importStructures(jsonData: string): Promise<number> {
  try {
    const structures: SavedStructure[] = JSON.parse(jsonData);
    let imported = 0;

    for (const structure of structures) {
      await saveStructure(structure.id, structure.name, {
        smiles: structure.smiles,
        molfile: structure.molfile,
        properties: structure.properties,
      });
      imported++;
    }

    return imported;
  } catch (error) {
    console.error('[DB] Error importing structures:', error);
    throw new Error('Invalid import data: ' + (error as Error).message);
  }
}

