/**
 * Vercel Serverless Function: OpenAI Chat Proxy
 * Keeps API key server-side. Requires OPENAI_API_KEY in Vercel env vars.
 */

import OpenAI from 'openai';

export const config = {
  maxDuration: 30,
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

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      error: 'OpenAI API key not configured',
      message: 'Add OPENAI_API_KEY in Vercel Project Settings → Environment Variables',
    });
  }

  const { messages } = req.body;
  if (!Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages array required' });
  }

  try {
    const openai = new OpenAI({ apiKey });
    const completion = await openai.chat.completions.create({
      model: 'gpt-5.2-chat-latest',
      messages,
      max_completion_tokens: 4096,
    });
    res.status(200).json({ content: completion.choices[0]?.message?.content ?? '' });
  } catch (err) {
    const errObj = err?.error || err;
    const status = errObj?.status ?? err?.status;
    const code = errObj?.code ?? err?.code;
    const message = errObj?.message ?? err?.message ?? String(err);
    const detail = errObj?.response?.data
      ? JSON.stringify(errObj.response.data)
      : (status ? `status=${status}` : '') + (code ? ` code=${code}` : '');
    console.error('[OpenAI] FAILED:', message, '| status:', status, '| code:', code);
    if (errObj?.response?.data) {
      console.error('[OpenAI] response.data:', JSON.stringify(errObj.response.data)?.slice(0, 500));
    }
    res.status(500).json({
      error: message,
      detail: detail || undefined,
      status: status ?? undefined,
      code: code ?? undefined,
    });
  }
}
