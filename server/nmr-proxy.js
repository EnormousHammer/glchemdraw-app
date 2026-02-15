/**
 * Local NMR Proxy Server
 * Proxies requests to nmrdb.org for NMR predictions (bypasses CORS)
 * Run: npm run dev:proxy  or  node server/nmr-proxy.js
 */

import express from 'express';
import cors from 'cors';
import puppeteer from 'puppeteer';

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
    const maxWait = 45;
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

app.listen(PORT, () => {
  console.log(`[NMR Proxy] Server running on http://localhost:${PORT}`);
  console.log('[NMR Proxy] Ready for NMR predictions');
});
