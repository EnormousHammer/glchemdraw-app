/**
 * nmrdb.org NMR prediction client
 * Uses the larger NMRShiftDB database (via nmrdb.org) for ¹H and ¹³C predictions.
 * Requires the local proxy server (npm run dev:proxy) when running in web mode.
 */

export interface PredictedPeak {
  delta: number | null;
  atomIDs: number[];
  atomLabel: string;
  nbAtoms: number;
}

const NMR_PROXY_URL = 'http://localhost:3001/nmr-proxy';
const NMRDB_BASE = 'https://www.nmrdb.org/service.php';

/**
 * Fetch NMR prediction from nmrdb.org via local proxy.
 * Returns { protonPeaks, carbonPeaks } or null on failure.
 */
export async function fetchNMRFromNmrdb(smiles: string): Promise<{
  protonPeaks: PredictedPeak[];
  carbonPeaks: PredictedPeak[];
} | null> {
  const encoded = encodeURIComponent(smiles);
  const url = `${NMRDB_BASE}?name=all-predictions&smiles=${encoded}`;
  const proxyUrl = `${NMR_PROXY_URL}?url=${encodeURIComponent(url)}`;

  try {
    const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(30_000) });
    if (!res.ok) return null;
    const data = await res.json();
    return parseNmrdbResponse(data);
  } catch {
    return null;
  }
}

/**
 * Parse nmrdb/nmrium workspace response into our peak format.
 * Handles spectra with ranges (from/to) or signals (delta).
 */
function parseNmrdbResponse(data: unknown): {
  protonPeaks: PredictedPeak[];
  carbonPeaks: PredictedPeak[];
} {
  const protonPeaks: PredictedPeak[] = [];
  const carbonPeaks: PredictedPeak[] = [];

  const spectra = (data as { spectra?: unknown[] })?.spectra;
  if (!Array.isArray(spectra)) return { protonPeaks, carbonPeaks };

  for (const spec of spectra) {
    const s = spec as Record<string, unknown>;
    const nucleus = (s.info as { nucleus?: string })?.nucleus;
    if (nucleus !== '1H' && nucleus !== '13C') continue;

    const peaks = extractPeaksFromSpectrum(s);
    const target = nucleus === '1H' ? protonPeaks : carbonPeaks;
    target.push(...peaks);
  }

  return { protonPeaks, carbonPeaks };
}

function extractPeaksFromSpectrum(spec: Record<string, unknown>): PredictedPeak[] {
  const peaks: PredictedPeak[] = [];

  // Ranges format: ranges.values = [{ from, to, signals: [{ delta, nbAtoms }] }]
  const ranges = (spec.ranges as { values?: Array<{ from?: number; to?: number; signals?: Array<{ delta?: number; nbAtoms?: number }> }> })?.values;
  if (Array.isArray(ranges)) {
    for (const r of ranges) {
      const sig = r.signals?.[0];
      const delta = sig?.delta ?? (r.from != null && r.to != null ? (r.from + r.to) / 2 : null);
      if (delta != null) {
        peaks.push({
          delta,
          atomIDs: [],
          atomLabel: '',
          nbAtoms: sig?.nbAtoms ?? 1,
        });
      }
    }
  }

  // Peaks format: peaks.values = [{ x: delta }]
  if (peaks.length === 0) {
    const peakValues = (spec.peaks as { values?: Array<{ x?: number }> })?.values;
    if (Array.isArray(peakValues)) {
      for (const p of peakValues) {
        const delta = p.x;
        if (delta != null) {
          peaks.push({ delta, atomIDs: [], atomLabel: '', nbAtoms: 1 });
        }
      }
    }
  }

  // Direct signals format (from nmr-processing prediction)
  if (peaks.length === 0) {
    const signals = (spec as { signals?: Array<{ delta?: number; nbAtoms?: number }> }).signals;
    if (Array.isArray(signals)) {
      for (const sig of signals) {
        const delta = sig.delta;
        if (delta != null) {
          peaks.push({
            delta,
            atomIDs: [],
            atomLabel: '',
            nbAtoms: sig.nbAtoms ?? 1,
          });
        }
      }
    }
  }

  return peaks;
}
