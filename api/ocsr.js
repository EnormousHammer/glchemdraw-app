/**
 * Vercel Serverless Function: OCSR (Optical Chemical Structure Recognition)
 * Proxies image to free naturalproducts.net API (DECIMER) and returns SMILES.
 * No extra cost - runs on Vercel, calls free public API.
 *
 * Accepts: POST with JSON body { image: "base64string" } or { image: "data:image/png;base64,..." }
 */

import FormData from 'form-data';

const OCSR_API = 'https://api.naturalproducts.net/latest';

export const config = {
  maxDuration: 30,
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = req.body;
    if (!body?.image) {
      return res.status(400).json({ error: 'Missing image in body. Send { image: "base64..." }' });
    }

    let base64 = body.image;
    if (base64.startsWith('data:')) {
      base64 = base64.split(',')[1] || base64;
    }
    const imageBuffer = Buffer.from(base64, 'base64');
    if (imageBuffer.length === 0) {
      return res.status(400).json({ error: 'Invalid base64 image' });
    }

    // Use form-data package for reliable multipart in Node.js serverless (Blob can be unreliable)
    const formData = new FormData();
    formData.append('file', imageBuffer, {
      filename: 'structure.png',
      contentType: 'image/png',
    });
    formData.append('hand_drawn', 'false');

    const response = await fetch(`${OCSR_API}/ocsr/process-upload`, {
      method: 'POST',
      body: formData,
      headers: formData.getHeaders(),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('[OCSR] API error:', response.status, errText);
      return res.status(502).json({
        error: 'Recognition failed',
        details: errText.slice(0, 200),
      });
    }

    const data = await response.json();
    // naturalproducts.net returns smiles as array (split by "." for multiple structures)
    let smiles = data?.smiles ?? data?.SMILES ?? data?.result?.[0]?.smiles ?? data?.[0];
    if (Array.isArray(smiles)) smiles = smiles[0];
    if (smiles && typeof smiles !== 'string') smiles = String(smiles);

    if (!smiles || typeof smiles !== 'string' || !smiles.trim()) {
      return res.status(502).json({
        error: 'No structure recognized',
        raw: JSON.stringify(data).slice(0, 500),
      });
    }

    return res.status(200).json({ struct: smiles.trim(), smiles: smiles.trim() });
  } catch (err) {
    console.error('[OCSR] Error:', err);
    return res.status(500).json({
      error: err.message || 'Recognition failed',
    });
  }
}
