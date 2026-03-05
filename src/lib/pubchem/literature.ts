/**
 * PubChem Literature Integration
 * Searches scientific literature and patents.
 * Local: npm run dev:proxy (localhost:3001). Cloud (Vercel): /api/literature-proxy.
 */

import axios from 'axios';
import { pubchemThrottler } from './throttle';

const PUG_REST_BASE = 'https://pubchem.ncbi.nlm.nih.gov/rest/pug';
const REQUEST_TIMEOUT = 30000;

function getLiteratureProxyUrl(): string {
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return 'http://localhost:3001/literature-proxy';
  }
  return '/api/literature-proxy';
}

export interface LiteratureReference {
  id: string;
  title: string;
  authors: string[];
  journal: string;
  year: number;
  doi?: string;
  pmid?: string;
  abstract?: string;
  url: string;
  source: 'pubmed' | 'patent' | 'eureka';
}

export interface PatentReference {
  id: string;
  title: string;
  inventors: string[];
  assignee: string;
  filingDate: string;
  publicationDate: string;
  patentNumber: string;
  abstract?: string;
  url: string;
}

/**
 * Search literature for a compound via proxy (cloud-safe, no CORS).
 */
export async function searchLiterature(
  cid: number,
  limit: number = 20
): Promise<(LiteratureReference | PatentReference)[]> {
  if (!cid || cid <= 0) {
    throw new Error('Invalid CID');
  }

  const proxyUrl = getLiteratureProxyUrl();
  const fullUrl = proxyUrl.startsWith('http')
    ? proxyUrl
    : `${typeof window !== 'undefined' ? window.location.origin : ''}${proxyUrl}`;

  try {
    const res = await fetch(fullUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cid, limit }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error((err as { error?: string }).error || `Literature search failed (${res.status})`);
    }
    const data = (await res.json()) as (LiteratureReference | PatentReference)[];
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('[PubChem Literature] Error searching literature:', error);
    throw new Error(`Failed to search literature: ${(error as Error).message}`);
  }
}

/**
 * Get compound synonyms for literature search
 */
export async function getCompoundSynonyms(cid: number): Promise<string[]> {
  try {
    const result = await pubchemThrottler.throttle(async () => {
      const response = await axios.get(
        `${PUG_REST_BASE}/compound/cid/${cid}/synonyms/JSON`,
        {
          timeout: REQUEST_TIMEOUT,
          headers: { 'Accept': 'application/json' },
        }
      );
      return response.data;
    });

    return result?.InformationList?.Information?.[0]?.Synonym || [];
  } catch (error) {
    console.error('[PubChem Literature] Error fetching synonyms:', error);
    return [];
  }
}
