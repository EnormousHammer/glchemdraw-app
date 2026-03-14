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
import { spawn } from 'child_process';
import { existsSync } from 'fs';
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

/** OCSR (image → structure). Local dev. Cloud: /api/ocsr */
app.post('/api/ocsr', async (req, res) => {
  try {
    const handler = (await import('../api/ocsr.js')).default;
    await handler(req, res);
  } catch (err) {
    console.error('[OCSR Proxy]', err?.message);
    res.status(500).json({ error: err?.message || 'OCSR failed' });
  }
});

/** Structure search proxy (PubChem similarity/substructure/superstructure). Local dev. Cloud: /api/structure-search-proxy */
app.post('/structure-search-proxy', async (req, res) => {
  try {
    const handler = (await import('../api/structure-search-proxy.js')).default;
    await handler(req, res);
  } catch (err) {
    console.error('[Structure Search Proxy]', err?.message);
    res.status(500).json({ error: err?.message || 'Structure search failed' });
  }
});

/** Literature search proxy (PubChem + NCBI). Local dev. Cloud: /api/literature-proxy */
app.post('/literature-proxy', async (req, res) => {
  const { cid, limit = 20 } = req.body || {};
  if (!cid || cid <= 0) {
    return res.status(400).json({ error: 'Invalid CID' });
  }
  try {
    const handler = (await import('../api/literature-proxy.js')).default;
    await handler(req, res);
  } catch (err) {
    console.error('[Literature Proxy]', err?.message);
    res.status(500).json({ error: err?.message || 'Literature search failed' });
  }
});

/** CDXML → CDX (local dev). On Vercel, api/cdxml-to-cdx.py handles this. */
app.post('/api/cdxml-to-cdx', async (req, res) => {
  const { cdxml } = req.body || {};
  if (!cdxml || typeof cdxml !== 'string') {
    return res.status(400).json({ error: 'Missing or empty cdxml' });
  }
  const scriptPath = join(__dirname, '..', 'scripts', 'cdxml_to_cdx.py');
  if (!existsSync(scriptPath)) {
    return res.status(500).json({ error: 'cdxml_to_cdx.py not found' });
  }
  try {
    const cdx = await new Promise((resolve, reject) => {
      const py = spawn('python', [scriptPath], { stdio: ['pipe', 'pipe', 'pipe'] });
      py.stdin.write(cdxml.trim(), 'utf8');
      py.stdin.end();
      const chunks = [];
      py.stdout.on('data', (c) => chunks.push(c));
      py.stderr.on('data', (e) => console.warn('[cdxml-to-cdx]', e.toString()));
      py.on('close', (code) => {
        if (code === 0) resolve(Buffer.concat(chunks));
        else reject(new Error('Conversion failed. Install: pip install cdx-mol'));
      });
    });
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', 'attachment; filename="structure.cdx"');
    res.send(cdx);
  } catch (e) {
    res.status(500).json({ error: e?.message || 'CDXML conversion failed. Install: pip install cdx-mol' });
  }
});

/** Copy CDX to Windows clipboard (for FindMolecule paste). Local dev only. */
app.post('/api/clipboard-cdx', async (req, res) => {
  const { cdxml } = req.body || {};
  if (!cdxml || typeof cdxml !== 'string') {
    return res.status(400).json({ success: false, error: 'Missing or empty cdxml' });
  }
  const scriptPath = join(__dirname, '..', 'scripts', 'copy_cdx_to_clipboard.py');
  if (!existsSync(scriptPath)) {
    return res.status(500).json({ success: false, error: 'copy_cdx_to_clipboard.py not found' });
  }
  if (!cdxml.trim().startsWith('<?xml') && !cdxml.trim().startsWith('<CDXML')) {
    return res.status(400).json({ success: false, error: 'Input does not look like CDXML' });
  }
  try {
    const result = await new Promise((resolve, reject) => {
      const py = spawn('python', [scriptPath], { stdio: ['pipe', 'pipe', 'pipe'] });
      const timeout = setTimeout(() => { py.kill(); reject(new Error('Clipboard script timed out (15s)')); }, 15000);
      py.stdin.write(JSON.stringify({ cdxml: cdxml.trim() }), 'utf8');
      py.stdin.end();
      const chunks = [];
      const errChunks = [];
      py.stdout.on('data', (c) => chunks.push(c));
      py.stderr.on('data', (c) => errChunks.push(c));
      py.on('close', (code) => {
        clearTimeout(timeout);
        const out = Buffer.concat(chunks).toString('utf8');
        const err = Buffer.concat(errChunks).toString('utf8');
        console.log('[clipboard-cdx] exit:', code, 'stdout:', out.slice(0, 200), 'stderr:', err.slice(0, 200));
        try {
          resolve(JSON.parse(out));
        } catch {
          reject(new Error(err || out || 'clipboard script failed'));
        }
      });
    });
    res.json(result);
  } catch (e) {
    console.error('[clipboard-cdx]', e?.message);
    res.status(500).json({ success: false, error: e?.message || 'Clipboard write failed. Install: pip install cdx-mol pywin32' });
  }
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
  const userPreview = typeof userMsg?.content === 'string' ? userMsg.content?.slice(0, 80) : '(vision)';
  console.log('[OpenAI] Request:', userPreview.replace(/\n/g, ' ') + (typeof userMsg?.content === 'string' && userMsg?.content?.length > 80 ? '...' : ''));
  const model = process.env.OPENAI_MODEL || 'gpt-5.2-chat-latest';
  try {
    const openai = new OpenAI({ apiKey });
    const completion = await openai.chat.completions.create({
      model,
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
