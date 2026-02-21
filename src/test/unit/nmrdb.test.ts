/**
 * Unit tests for nmrdb NMR prediction client
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchNMRFromNmrdb } from '@/lib/chemistry/nmrdb';

describe('nmrdb', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) => {
        if (url.includes('nmr-proxy')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                spectra: [
                  {
                    info: { nucleus: '1H' },
                    ranges: {
                      values: [
                        { from: 2.0, to: 2.1, signals: [{ delta: 2.05, nbAtoms: 3 }] },
                        { from: 7.2, to: 7.3, signals: [{ delta: 7.25, nbAtoms: 5 }] },
                      ],
                    },
                  },
                  {
                    info: { nucleus: '13C' },
                    ranges: {
                      values: [
                        { from: 30.5, to: 30.9, signals: [{ delta: 30.7, nbAtoms: 2 }] },
                        { from: 206.5, to: 206.9, signals: [{ delta: 206.7, nbAtoms: 1 }] },
                      ],
                    },
                  },
                ],
              }),
          } as Response);
        }
        return originalFetch(url);
      })
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('parses nmrdb response into proton and carbon peaks', async () => {
    const result = await fetchNMRFromNmrdb('CC(=O)C');
    expect(result).not.toBeNull();
    expect(result!.protonPeaks).toHaveLength(2);
    expect(result!.carbonPeaks).toHaveLength(2);
    expect(result!.protonPeaks[0].delta).toBeCloseTo(2.05);
    expect(result!.protonPeaks[0].nbAtoms).toBe(3);
    expect(result!.carbonPeaks[0].delta).toBeCloseTo(30.7);
    expect(result!.carbonPeaks[1].delta).toBeCloseTo(206.7);
  });

  it('returns null when proxy returns error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve({ ok: false } as Response))
    );
    const result = await fetchNMRFromNmrdb('CCO');
    expect(result).toBeNull();
  });

  it('returns null when proxy throws', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('Network error'))));
    const result = await fetchNMRFromNmrdb('CCO');
    expect(result).toBeNull();
  });
});
