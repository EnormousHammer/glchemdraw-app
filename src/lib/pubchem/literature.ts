/**
 * PubChem Literature Integration
 * Searches scientific literature and patents
 */

import axios from 'axios';
import { pubchemThrottler } from './throttle';

const PUG_REST_BASE = 'https://pubchem.ncbi.nlm.nih.gov/rest/pug';
const EUREKA_BASE = 'https://eurekaselect.com/api';
const REQUEST_TIMEOUT = 30000;

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
 * Search literature for a compound
 */
export async function searchLiterature(
  cid: number,
  limit: number = 20
): Promise<(LiteratureReference | PatentReference)[]> {
  if (!cid || cid <= 0) {
    throw new Error('Invalid CID');
  }

  try {
    // Search PubMed
    const pubmedResults = await searchPubMed(cid, limit);
    
    // Search patents
    const patentResults = await searchPatents(cid, Math.floor(limit / 2));
    
    return [...pubmedResults, ...patentResults].slice(0, limit);
  } catch (error) {
    console.error('[PubChem Literature] Error searching literature:', error);
    throw new Error(`Failed to search literature: ${(error as Error).message}`);
  }
}

/**
 * Search PubMed for compound-related articles
 */
async function searchPubMed(cid: number, limit: number): Promise<LiteratureReference[]> {
  try {
    const result = await pubchemThrottler.throttle(async () => {
      const response = await axios.get(
        `${PUG_REST_BASE}/compound/cid/${cid}/xrefs/PubMedID/JSON`,
        {
          timeout: REQUEST_TIMEOUT,
          headers: { 'Accept': 'application/json' },
        }
      );
      return response.data;
    });

    const pmids = result?.InformationList?.Information?.[0]?.PMID || [];
    const references: LiteratureReference[] = [];

    // Fetch details for each PMID (limited to avoid rate limits)
    for (const pmid of pmids.slice(0, limit)) {
      try {
        const article = await fetchPubMedArticle(pmid);
        if (article) {
          references.push(article);
        }
      } catch (error) {
        console.warn(`[PubChem Literature] Failed to fetch PMID ${pmid}:`, error);
      }
    }

    return references;
  } catch (error) {
    console.error('[PubChem Literature] Error searching PubMed:', error);
    return [];
  }
}

/**
 * Fetch detailed article information from PubMed
 */
async function fetchPubMedArticle(pmid: string): Promise<LiteratureReference | null> {
  try {
    const response = await axios.get(
      `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${pmid}&retmode=xml&rettype=abstract`,
      { timeout: REQUEST_TIMEOUT }
    );

    // Parse XML response (simplified)
    const xml = response.data;
    const titleMatch = xml.match(/<ArticleTitle>(.*?)<\/ArticleTitle>/);
    const authorMatches = xml.match(/<Author><LastName>(.*?)<\/LastName><ForeName>(.*?)<\/ForeName><\/Author>/g);
    const journalMatch = xml.match(/<Journal><Title>(.*?)<\/Title><\/Journal>/);
    const yearMatch = xml.match(/<PubDate><Year>(\d{4})<\/Year><\/PubDate>/);
    const abstractMatch = xml.match(/<AbstractText>(.*?)<\/AbstractText>/);

    if (!titleMatch) return null;

    const authors = authorMatches?.map((match: any) => {
      const lastMatch = match.match(/<LastName>(.*?)<\/LastName>/);
      const firstMatch = match.match(/<ForeName>(.*?)<\/ForeName>/);
      return `${lastMatch?.[1] || ''}, ${firstMatch?.[1] || ''}`.trim();
    }) || [];

    return {
      id: pmid,
      title: titleMatch[1],
      authors,
      journal: journalMatch?.[1] || 'Unknown Journal',
      year: parseInt(yearMatch?.[1] || '0'),
      pmid,
      abstract: abstractMatch?.[1] || undefined,
      url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
      source: 'pubmed',
    };
  } catch (error) {
    console.error(`[PubChem Literature] Error fetching PMID ${pmid}:`, error);
    return null;
  }
}

/**
 * Search patents for compound
 */
async function searchPatents(cid: number, limit: number): Promise<PatentReference[]> {
  try {
    const result = await pubchemThrottler.throttle(async () => {
      const response = await axios.get(
        `${PUG_REST_BASE}/compound/cid/${cid}/xrefs/PatentID/JSON`,
        {
          timeout: REQUEST_TIMEOUT,
          headers: { 'Accept': 'application/json' },
        }
      );
      return response.data;
    });

    const patentIds = result?.InformationList?.Information?.[0]?.PatentID || [];
    const patents: PatentReference[] = [];

    // Convert patent IDs to references (simplified)
    for (const patentId of patentIds.slice(0, limit)) {
      patents.push({
        id: patentId,
        title: `Patent ${patentId}`,
        inventors: ['Unknown'],
        assignee: 'Unknown',
        filingDate: 'Unknown',
        publicationDate: 'Unknown',
        patentNumber: patentId,
        url: `https://patents.google.com/patent/${patentId}`,
      });
    }

    return patents;
  } catch (error) {
    console.error('[PubChem Literature] Error searching patents:', error);
    return [];
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
