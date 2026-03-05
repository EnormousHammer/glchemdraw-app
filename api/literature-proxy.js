/**
 * Vercel Serverless Function: Literature Search Proxy
 * Proxies PubChem + NCBI requests to avoid CORS in browser.
 * Local: npm run dev:proxy → localhost:3001/literature-proxy
 * Cloud: /api/literature-proxy
 */

const PUG_REST_BASE = 'https://pubchem.ncbi.nlm.nih.gov/rest/pug';
const REQUEST_TIMEOUT = 30000;

export const config = {
  maxDuration: 30,
};

async function fetchWithTimeout(url, opts = {}) {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), opts.timeout ?? REQUEST_TIMEOUT);
  try {
    const res = await fetch(url, { ...opts, signal: ctrl.signal });
    clearTimeout(id);
    return res;
  } catch (e) {
    clearTimeout(id);
    throw e;
  }
}

async function searchPubMed(cid, limit) {
  const res = await fetchWithTimeout(
    `${PUG_REST_BASE}/compound/cid/${cid}/xrefs/PubMedID/JSON`,
    { headers: { Accept: 'application/json' } }
  );
  if (!res.ok) return [];
  const data = await res.json();
  const pmids = data?.InformationList?.Information?.[0]?.PubMedID ||
    data?.InformationList?.Information?.[0]?.PMID || [];
  const references = [];
  for (const pmid of pmids.slice(0, limit)) {
    try {
      const article = await fetchPubMedArticle(pmid);
      if (article) references.push(article);
    } catch (e) {
      console.warn('[Literature] Failed PMID', pmid, e?.message);
    }
  }
  return references;
}

async function fetchPubMedArticle(pmid) {
  const res = await fetchWithTimeout(
    `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${pmid}&retmode=xml&rettype=abstract`
  );
  if (!res.ok) return null;
  const xml = await res.text();
  const titleMatch = xml.match(/<ArticleTitle>(.*?)<\/ArticleTitle>/);
  if (!titleMatch) return null;
  const authorMatches = xml.match(/<Author><LastName>(.*?)<\/LastName><ForeName>(.*?)<\/ForeName><\/Author>/g);
  const journalMatch = xml.match(/<Journal><Title>(.*?)<\/Title><\/Journal>/);
  const yearMatch = xml.match(/<PubDate><Year>(\d{4})<\/Year><\/PubDate>/);
  const abstractMatch = xml.match(/<AbstractText>(.*?)<\/AbstractText>/);
  const authors = authorMatches?.map((m) => {
    const last = m.match(/<LastName>(.*?)<\/LastName>/)?.[1] || '';
    const first = m.match(/<ForeName>(.*?)<\/ForeName>/)?.[1] || '';
    return `${last}, ${first}`.trim();
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
}

async function searchPatents(cid, limit) {
  const res = await fetchWithTimeout(
    `${PUG_REST_BASE}/compound/cid/${cid}/xrefs/PatentID/JSON`,
    { headers: { Accept: 'application/json' } }
  );
  if (!res.ok) return [];
  const data = await res.json();
  const patentIds = data?.InformationList?.Information?.[0]?.PatentID || [];
  return patentIds.slice(0, limit).map((id) => ({
    id,
    title: `Patent ${id}`,
    inventors: ['Unknown'],
    assignee: 'Unknown',
    filingDate: 'Unknown',
    publicationDate: 'Unknown',
    patentNumber: id,
    url: `https://patents.google.com/patent/${id}`,
  }));
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let cid, limit = 20;
  if (req.method === 'POST') {
    const body = req.body || {};
    cid = body.cid;
    limit = body.limit ?? 20;
  } else {
    cid = parseInt(req.query.cid, 10);
    limit = parseInt(req.query.limit, 10) || 20;
  }

  if (!cid || cid <= 0) {
    return res.status(400).json({ error: 'Invalid CID' });
  }

  try {
    const [pubmedResults, patentResults] = await Promise.all([
      searchPubMed(cid, limit),
      searchPatents(cid, Math.floor(limit / 2)),
    ]);
    const combined = [...pubmedResults, ...patentResults].slice(0, limit);
    return res.status(200).json(combined);
  } catch (err) {
    console.error('[Literature Proxy] Error:', err?.message);
    return res.status(500).json({
      error: err?.message || 'Literature search failed',
    });
  }
}
