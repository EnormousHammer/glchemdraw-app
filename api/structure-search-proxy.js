/**
 * Vercel Serverless Function: Structure Search Proxy
 * Proxies PubChem similarity/substructure/superstructure to avoid CORS.
 * Local: npm run dev:proxy → localhost:3001/structure-search-proxy
 * Cloud: /api/structure-search-proxy
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

async function getCompoundSummaries(cids) {
  if (!cids?.length) return [];
  const res = await fetchWithTimeout(
    `${PUG_REST_BASE}/compound/cid/${cids.join(',')}/property/MolecularFormula,MolecularWeight,IUPACName,CanonicalSMILES,Title/JSON`,
    { headers: { Accept: 'application/json' } }
  );
  if (!res.ok) return cids.map((cid) => ({ cid, name: `CID ${cid}`, formula: '', mw: 0, smiles: '' }));
  const data = await res.json();
  const props = data?.PropertyTable?.Properties || [];
  const byCid = {};
  for (const p of props) {
    byCid[p.CID] = {
      cid: p.CID,
      name: p.Title || p.IUPACName || `CID ${p.CID}`,
      formula: p.MolecularFormula || '',
      mw: p.MolecularWeight || 0,
      smiles: p.CanonicalSMILES || '',
    };
  }
  return cids.map((cid) => byCid[cid] || { cid, name: `CID ${cid}`, formula: '', mw: 0, smiles: '' });
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

  let smiles, searchType = 'similarity', threshold = 90, maxRecords = 20;
  if (req.method === 'POST') {
    const body = req.body || {};
    smiles = body.smiles;
    searchType = body.searchType || 'similarity';
    threshold = Math.min(100, Math.max(0, parseInt(body.threshold, 10) || 90));
    maxRecords = Math.min(100, Math.max(5, parseInt(body.maxRecords, 10) || 20));
  } else {
    smiles = req.query.smiles;
    searchType = req.query.searchType || 'similarity';
    threshold = Math.min(100, Math.max(0, parseInt(req.query.threshold, 10) || 90));
    maxRecords = Math.min(100, Math.max(5, parseInt(req.query.maxRecords, 10) || 20));
  }

  if (!smiles || typeof smiles !== 'string' || smiles.trim().length < 2) {
    return res.status(400).json({ error: 'Invalid or missing SMILES' });
  }

  const trimmed = smiles.trim();
  const encoded = encodeURIComponent(trimmed);

  try {
    let cids = [];
    if (searchType === 'similarity') {
      const url = `${PUG_REST_BASE}/compound/similarity/smiles/${encoded}/cids/JSON?Threshold=${threshold}&MaxRecords=${maxRecords}`;
      const r = await fetchWithTimeout(url, { headers: { Accept: 'application/json' } });
      if (!r.ok) {
        const errText = await r.text();
        throw new Error(`PubChem similarity failed: ${r.status} ${errText.slice(0, 200)}`);
      }
      const data = await r.json();
      cids = data?.IdentifierList?.CID || [];
    } else if (searchType === 'substructure') {
      const url = `${PUG_REST_BASE}/compound/substructure/smiles/${encoded}/cids/JSON?MaxRecords=${maxRecords}`;
      const r = await fetchWithTimeout(url, { headers: { Accept: 'application/json' } });
      if (!r.ok) {
        const errText = await r.text();
        throw new Error(`PubChem substructure failed: ${r.status} ${errText.slice(0, 200)}`);
      }
      const data = await r.json();
      cids = data?.IdentifierList?.CID || [];
    } else if (searchType === 'superstructure') {
      const url = `${PUG_REST_BASE}/compound/superstructure/smiles/${encoded}/cids/JSON?MaxRecords=${maxRecords}`;
      const r = await fetchWithTimeout(url, { headers: { Accept: 'application/json' } });
      if (!r.ok) {
        const errText = await r.text();
        throw new Error(`PubChem superstructure failed: ${r.status} ${errText.slice(0, 200)}`);
      }
      const data = await r.json();
      cids = data?.IdentifierList?.CID || [];
    } else {
      return res.status(400).json({ error: 'Invalid searchType. Use similarity, substructure, or superstructure.' });
    }

    const compounds = await getCompoundSummaries(cids);
    const results = compounds.map((c, i) => ({
      ...c,
      similarity: searchType === 'similarity' ? Math.max(0, 1 - i * 0.02) : (searchType === 'substructure' || searchType === 'superstructure' ? 1 : 0),
    }));
    return res.status(200).json(results);
  } catch (err) {
    console.error('[Structure Search Proxy] Error:', err?.message);
    return res.status(500).json({
      error: err?.message || 'Structure search failed',
    });
  }
}
