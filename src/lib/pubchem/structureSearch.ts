/**
 * PubChem Structure Search (similarity, substructure, superstructure)
 * Uses proxy for CORS. Local: localhost:3001. Cloud: /api/structure-search-proxy.
 */

const REQUEST_TIMEOUT = 30000;

function getStructureSearchProxyUrl(): string {
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return 'http://localhost:3001/structure-search-proxy';
  }
  return '/api/structure-search-proxy';
}

export type StructureSearchType = 'similarity' | 'substructure' | 'superstructure';

export interface StructureSearchResult {
  cid: number;
  name: string;
  formula: string;
  mw: number;
  smiles: string;
  similarity: number;
}

export interface StructureSearchParams {
  smiles: string;
  searchType?: StructureSearchType;
  threshold?: number;
  maxRecords?: number;
}

/**
 * Search PubChem by structure (similarity, substructure, superstructure).
 */
export async function searchByStructure(params: StructureSearchParams): Promise<StructureSearchResult[]> {
  const { smiles, searchType = 'similarity', threshold = 90, maxRecords = 20 } = params;
  if (!smiles?.trim()) {
    throw new Error('SMILES is required');
  }

  const proxyUrl = getStructureSearchProxyUrl();
  const fullUrl = proxyUrl.startsWith('http')
    ? proxyUrl
    : `${typeof window !== 'undefined' ? window.location.origin : ''}${proxyUrl}`;

  const res = await fetch(fullUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      smiles: smiles.trim(),
      searchType,
      threshold,
      maxRecords,
    }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error?: string }).error || `Structure search failed (${res.status})`);
  }

  const data = (await res.json()) as StructureSearchResult[];
  return Array.isArray(data) ? data : [];
}
