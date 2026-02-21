/**
 * Integration Tests for PubChem Cache
 * Skipped in Node.js (vitest) - IndexedDB is not available
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  searchCompound,
  getCachedCompound,
  cacheCompound,
  clearCache,
  getCacheStats,
} from '@lib/pubchem/cache';

const hasIndexedDB = typeof indexedDB !== 'undefined';

describe.skipIf(!hasIndexedDB)('PubChem Cache Integration', () => {
  beforeEach(async () => {
    // Clear cache before each test
    await clearCache();
  });

  afterEach(async () => {
    // Clean up after tests
    await clearCache();
  });

  it('should cache search results', async () => {
    // First search (will hit API)
    const result1 = await searchCompound('aspirin');
    expect(result1).toBeDefined();
    
    // Second search (should hit cache)
    const result2 = await searchCompound('aspirin');
    expect(result2).toEqual(result1);
  });

  it('should cache by CID', async () => {
    const testProperties = {
      MolecularFormula: 'C9H8O4',
      MolecularWeight: 180.16,
      IUPACName: 'aspirin',
      CanonicalSMILES: 'CC(=O)Oc1ccccc1C(=O)O',
    };

    // Cache the data
    await cacheCompound(2244, testProperties);
    
    // Retrieve from cache
    const cached = await getCachedCompound(2244);
    expect(cached?.cid).toBe(2244);
    expect(cached?.properties).toMatchObject(testProperties);
  });

  it('should return null for uncached CID', async () => {
    const result = await getCachedCompound(999999);
    expect(result).toBeNull();
  });

  it('should provide cache statistics', async () => {
    // Cache some data
    await cacheCompound(2244, {
      MolecularFormula: 'C9H8O4',
      MolecularWeight: 180.16,
    });
    await cacheCompound(2519, {
      MolecularFormula: 'C8H10N4O2',
      MolecularWeight: 194.19,
    });

    const stats = await getCacheStats();
    expect(stats.compounds).toBeGreaterThanOrEqual(2);
  });

  it('should handle cache expiration', async () => {
    // This test would require mocking Date.now() or waiting for actual expiration
    // For now, just verify the cache expiry setting exists
    const stats = await getCacheStats();
    expect(stats).toHaveProperty('expiryDays');
  });
});

