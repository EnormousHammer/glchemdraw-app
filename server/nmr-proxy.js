/**
 * Local NMR Proxy Server
 * Proxies requests to nmrdb.org for NMR predictions (bypasses CORS)
 * Also provides OpenAI chat proxy (keeps API key server-side)
 * Run: npm run dev:proxy  or  node server/nmr-proxy.js
 */

import express from 'express';
import cors from 'cors';
import puppeteer from 'puppeteer';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import OpenAI from 'openai';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, '..', 'openaikey', '.env') });

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.get('/nmr-proxy', async (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl) {
    return res.status(400).json({ error: 'Missing url parameter' });
  }

  let browser = null;
  try {
    console.log('[NMR Proxy] Fetching:', targetUrl);
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.goto(targetUrl, { waitUntil: 'networkidle0', timeout: 30000 });
    await new Promise((r) => setTimeout(r, 2000));

    try {
      const buttonClicked = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button, input[type="button"]'));
        const btn = buttons.find(
          (b) =>
            b.textContent?.toLowerCase().includes('calculate') ||
            b.textContent?.toLowerCase().includes('spectrum')
        );
        if (btn) {
          btn.click();
          return true;
        }
        return false;
      });
      if (buttonClicked) await new Promise((r) => setTimeout(r, 2000));
    } catch (e) {
      console.log('[NMR Proxy] Button not found:', e.message);
    }

    let predictionData = null;
    const maxWait = 90;
    for (let waited = 0; waited < maxWait; waited++) {
      await new Promise((r) => setTimeout(r, 1000));
      predictionData = await page.evaluate(() => {
        if (window.ci?.data?.spectra?.length > 0) return window.ci.data;
        try {
          const stored = localStorage.getItem('external_cache');
          if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed.spectra?.length > 0) return parsed;
          }
        } catch (e) {}
        return null;
      });
      if (predictionData) break;
    }

    await browser.close();
    browser = null;

    if (predictionData) {
      console.log('[NMR Proxy] Success');
      return res.json(predictionData);
    }
    return res.status(504).json({
      error: 'Timeout',
      message: 'NMR prediction timed out. Try the desktop app.',
    });
  } catch (err) {
    console.error('[NMR Proxy] Error:', err.message);
    if (browser) await browser.close();
    return res.status(500).json({
      error: err.message,
      details: 'NMR proxy failed.',
    });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'nmr-proxy' });
});

/** Debug: test OpenAI and return exact error on failure */
app.get('/openai/debug', async (req, res) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.json({
      ok: false,
      error: 'No OPENAI_API_KEY in openaikey/.env',
      hint: 'Add OPENAI_API_KEY=sk-... to openaikey/.env',
    });
  }
  try {
    const openai = new OpenAI({ apiKey });
    const completion = await openai.chat.completions.create({
      model: 'gpt-5.2-chat-latest',
      messages: [{ role: 'user', content: 'Say OK' }],
      max_completion_tokens: 10,
    });
    const content = completion.choices[0]?.message?.content ?? '';
    res.json({ ok: true, response: content });
  } catch (err) {
    const e = err?.error || err;
    const out = {
      ok: false,
      error: e?.message || err?.message || String(err),
      status: e?.status ?? err?.status,
      code: e?.code ?? err?.code,
      type: e?.type ?? err?.type,
      openaiResponse: e?.response?.data ?? err?.response?.data,
    };
    console.error('[OpenAI DEBUG]', JSON.stringify(out, null, 2));
    res.json(out);
  }
});

/** OpenAI chat proxy - keeps API key server-side */
app.post('/openai/chat', async (req, res) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('[OpenAI] No API key in openaikey/.env');
    return res.status(503).json({
      error: 'OpenAI API key not configured',
      message: 'Add OPENAI_API_KEY to openaikey/.env',
    });
  }
  const { messages } = req.body;
  if (!Array.isArray(messages)) {
    console.error('[OpenAI] Bad request: messages not an array');
    return res.status(400).json({ error: 'messages array required' });
  }
  const userMsg = messages.find((m) => m.role === 'user');
  const userPreview = userMsg?.content?.slice(0, 80) ?? '(no user message)';
  console.log('[OpenAI] Request:', userPreview.replace(/\n/g, ' ') + (userMsg?.content?.length > 80 ? '...' : ''));
  try {
    const openai = new OpenAI({ apiKey });
    const completion = await openai.chat.completions.create({
      model: 'gpt-5.2-chat-latest',
      messages,
      max_completion_tokens: 4096,
    });
    const content = completion.choices[0]?.message?.content ?? '';
    console.log('[OpenAI] OK, response length:', content.length);
    res.json({ content });
  } catch (err) {
    const errObj = err?.error || err;
    const status = errObj?.status || errObj?.statusCode || err?.status;
    const code = errObj?.code || err?.code;
    const message = errObj?.message || err?.message || String(err);
    const type = errObj?.type || err?.type;

    console.error('[OpenAI] FAILED ---');
    console.error('[OpenAI] message:', message);
    console.error('[OpenAI] status:', status, '| code:', code, '| type:', type);
    if (errObj?.response) {
      console.error('[OpenAI] response.data:', JSON.stringify(errObj.response?.data)?.slice(0, 500));
    }
    if (err?.stack) {
      console.error('[OpenAI] stack:', err.stack.split('\n').slice(0, 3).join('\n'));
    }

    const detail = errObj?.response?.data
      ? JSON.stringify(errObj.response.data)
      : (status ? `status=${status}` : '') + (code ? ` code=${code}` : '');
    res.status(500).json({
      error: message,
      detail: detail || undefined,
      status: status || undefined,
      code: code || undefined,
    });
  }
});

app.listen(PORT, () => {
  console.log(`[NMR Proxy] Server running on http://localhost:${PORT}`);
  console.log('[NMR Proxy] Ready for NMR predictions');
  console.log('[NMR Proxy] OpenAI endpoint: POST /openai/chat');
});
