/**
 * Unit Tests for Bulk PubChem Lookup
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  bulkPubChemLookup, 
  createCancellationToken,
  cancelOperation 
} from '@lib/pubchem/bulk';

// Mock the PubChem API
vi.mock('@lib/pubchem/api', () => ({
  getCIDByIdentifier: vi.fn((id: string) => {
    if (id === 'aspirin') return Promise.resolve(2244);
    if (id === 'caffeine') return Promise.resolve(2519);
    if (id === 'invalid') return Promise.resolve(null);
    return Promise.resolve(Math.floor(Math.random() * 10000));
  }),
  getCompoundProperties: vi.fn((cid: number) => ({
    MolecularFormula: 'C9H8O4',
    MolecularWeight: 180.16,
    CanonicalSMILES: 'CC(=O)OC1=CC=CC=C1C(=O)O',
  })),
  getCompoundSummary: vi.fn(() => ({})),
}));

describe('Bulk PubChem Lookup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should process multiple identifiers', async () => {
    const identifiers = ['aspirin', 'caffeine'];
    const result = await bulkPubChemLookup(identifiers, undefined, undefined, 0);
    
    expect(result.success.length).toBe(2);
    expect(result.failed.length).toBe(0);
    expect(result.totalProcessed).toBe(2);
  });

  it('should report progress', async () => {
    const identifiers = ['aspirin', 'caffeine', 'glucose'];
    const progressCallback = vi.fn();
    
    await bulkPubChemLookup(identifiers, progressCallback, undefined, 0);
    
    expect(progressCallback).toHaveBeenCalledTimes(3);
    expect(progressCallback).toHaveBeenLastCalledWith({
      current: 3,
      total: 3,
      percentage: 100,
      currentItem: 'glucose',
    });
  });

  it('should handle failures gracefully', async () => {
    const identifiers = ['aspirin', 'invalid', 'caffeine'];
    const result = await bulkPubChemLookup(identifiers, undefined, undefined, 0);
    
    expect(result.success.length).toBe(2); // aspirin and caffeine
    expect(result.failed.length).toBe(1); // invalid
    expect(result.failed[0].identifier).toBe('invalid');
  });

  it('should support cancellation', async () => {
    const identifiers = Array.from({ length: 100 }, (_, i) => `compound_${i}`);
    const token = createCancellationToken();
    
    // Cancel after 10ms
    setTimeout(() => cancelOperation(token), 10);
    
    const result = await bulkPubChemLookup(identifiers, undefined, token, 0);
    
    // Should process fewer than all items
    expect(result.totalProcessed).toBeLessThan(100);
  });

  it('should respect delay between requests', async () => {
    const identifiers = ['aspirin', 'caffeine'];
    const start = Date.now();
    
    await bulkPubChemLookup(identifiers, undefined, undefined, 100);
    
    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(100); // At least one 100ms delay
  });
});

