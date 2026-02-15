/**
 * Vercel Serverless Function for NMR Proxy
 * 
 * WARNING: This will likely timeout on Vercel Free (10s limit) 
 * and may timeout on Vercel Pro (60s limit) for complex molecules.
 * NMR predictions typically take 60-90 seconds.
 */

import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

export const config = {
  maxDuration: 60, // Pro plan only
  memory: 1024,
};

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const targetUrl = req.query.url;

  if (!targetUrl) {
    return res.status(400).json({ error: 'Missing url parameter' });
  }

  let browser = null;

  try {
    console.log('[Vercel NMR Proxy] Fetching:', targetUrl);

    // Launch browser with Vercel-compatible settings
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });

    const page = await browser.newPage();

    // Set up message listener
    let predictionData = null;

    // Navigate to the service page
    await page.goto(targetUrl, {
      waitUntil: 'networkidle0',
      timeout: 30000,
    });

    // Wait for redirect
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const currentUrl = page.url();
    console.log('[Vercel NMR Proxy] Current URL after redirect:', currentUrl);

    // Look for Calculate button
    try {
      await page.waitForSelector('button, input[type="button"]', { timeout: 5000 });

      const buttonClicked = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button, input[type="button"]'));
        const calculateButton = buttons.find(
          (btn) =>
            btn.textContent?.toLowerCase().includes('calculate') ||
            btn.textContent?.toLowerCase().includes('spectrum')
        );

        if (calculateButton) {
          calculateButton.click();
          return true;
        }
        return false;
      });

      if (buttonClicked) {
        console.log('[Vercel NMR Proxy] ✓ Clicked Calculate button');
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    } catch (e) {
      console.log('[Vercel NMR Proxy] Could not find button:', e.message);
    }

    // Wait for prediction data (reduced timeout for Vercel)
    const maxWait = 45; // 45 seconds max (conservative for Vercel)
    let waited = 0;

    while (waited < maxWait && !predictionData) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      waited++;

      predictionData = await page.evaluate(() => {
        // Check window.ci.data
        if (window.ci?.data?.spectra && window.ci.data.spectra.length > 0) {
          return window.ci.data;
        }

        // Check localStorage
        try {
          const stored = localStorage.getItem('external_cache');
          if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed.spectra && parsed.spectra.length > 0) {
              return parsed;
            }
          }
        } catch (e) {
          // Continue
        }

        return null;
      });

      if (predictionData) {
        break;
      }
    }

    await page.close();

    if (predictionData) {
      console.log('[Vercel NMR Proxy] Successfully extracted prediction data');
      return res.status(200).json(predictionData);
    } else {
      console.log('[Vercel NMR Proxy] Timeout after', waited, 'seconds');
      return res.status(504).json({
        error: 'Timeout waiting for prediction data',
        message: 'NMR prediction timed out. Try using the desktop app for faster results.',
        url: currentUrl,
      });
    }
  } catch (err) {
    console.error('[Vercel NMR Proxy] Error:', err);
    return res.status(500).json({
      error: err.message,
      details: 'NMR proxy failed. For reliable predictions, use the desktop app.',
    });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

