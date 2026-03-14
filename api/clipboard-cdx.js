/**
 * Vercel Serverless: clipboard-cdx stub.
 * Clipboard write requires running on the user's machine (local dev proxy or desktop app).
 * On Vercel we cannot write to the user's clipboard. Return JSON so the client
 * gracefully falls through to the Chrome extension fallback.
 */
export const config = {
  maxDuration: 5,
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  // Cannot write to user's clipboard from Vercel (cloud). Client will fall through to extension.
  return res.status(200).json({
    success: false,
    error: 'Clipboard not available on web. Install the Chrome extension or use the desktop app.',
  });
}
