/**
 * Direct test of NMR proxy server
 * Run: node test-proxy-direct.js
 */

import puppeteer from 'puppeteer';

async function testNMRProxy() {
  console.log('[Test] Starting NMR proxy test...');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  
  const page = await browser.newPage();
  
  // Enable console logging
  page.on('console', msg => {
    console.log('[Page Console]', msg.text());
  });
  
  // Log page errors
  page.on('pageerror', error => {
    console.error('[Page Error]', error.message);
  });
  
  // Log request failures
  page.on('requestfailed', request => {
    console.error('[Request Failed]', request.url(), request.failure()?.errorText);
  });
  
  const serviceUrl = 'https://www.nmrdb.org/service.php?name=nmr-1h-prediction&smiles=CCO';
  
  console.log('[Test] Navigating to:', serviceUrl);
  
  try {
    // Navigate to service page
    await page.goto(serviceUrl, { 
      waitUntil: 'networkidle0', 
      timeout: 30000 
    });
    
    // Wait for redirect
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const currentUrl = page.url();
    console.log('[Test] Current URL after redirect:', currentUrl);
    
    // Wait for ci-visualizer element to appear (indicates page loaded)
    try {
      await page.waitForSelector('ci-visualizer', { timeout: 15000 });
      console.log('[Test] Found ci-visualizer element');
      
      // Wait a bit more for JavaScript to execute
      await new Promise(resolve => setTimeout(resolve, 5000));
    } catch (e) {
      console.log('[Test] ci-visualizer not found, continuing anyway');
    }
    
    // Check page title and content
    const title = await page.title();
    console.log('[Test] Page title:', title);
    
    // Check if there are any scripts on the page
    const scripts = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('script')).map(s => s.src || 'inline');
    });
    console.log('[Test] Scripts found:', scripts.length);
    
    // Check for prediction data
    let predictionData = null;
    const maxWait = 60; // Increase to 60 seconds
    let waited = 0;
    
    while (waited < maxWait && !predictionData) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      waited++;
      
      predictionData = await page.evaluate((waitTime) => {
        // Debug: Log what's available
        const debug = {
          hasWindowCi: !!window.ci,
          hasWindowCiData: !!(window.ci && window.ci.data),
          windowCiKeys: window.ci ? Object.keys(window.ci) : [],
          localStorageKeys: Object.keys(localStorage),
        };
        
        if (waitTime === 1 || waitTime % 5 === 0) {
          console.log('[Page Debug]', JSON.stringify(debug));
        }
        
        // Check window.ci.data
        if (window.ci) {
          console.log('[Page] window.ci exists, keys:', Object.keys(window.ci));
          if (window.ci.data) {
            console.log('[Page] window.ci.data exists, keys:', Object.keys(window.ci.data));
            if (window.ci.data.spectra && window.ci.data.spectra.length > 0) {
              return window.ci.data;
            }
            // Return partial data if it exists
            if (Object.keys(window.ci.data).length > 0) {
              console.log('[Page] window.ci.data exists but no spectra yet:', Object.keys(window.ci.data));
            }
          } else {
            console.log('[Page] window.ci exists but no data property');
          }
        } else {
          // Check if ci-visualizer is on the page
          const visualizer = document.querySelector('ci-visualizer');
          if (visualizer) {
            console.log('[Page] ci-visualizer element found');
            // Try to access data from the element
            if (visualizer.data) {
              console.log('[Page] Found data on ci-visualizer element');
              return visualizer.data;
            }
          }
        }
        
        // Check localStorage
        try {
          const cached = localStorage.getItem('external_cache');
          if (cached) {
            const parsed = JSON.parse(cached);
            console.log('[Page] localStorage cached data keys:', Object.keys(parsed));
            if (parsed.spectra && parsed.spectra.length > 0) {
              return parsed;
            }
          }
        } catch (e) {
          // Ignore
        }
        
        return null;
      }, waited);
      
      if (predictionData) {
        console.log(`[Test] Found prediction data after ${waited} seconds`);
        break;
      }
      
      if (waited % 5 === 0) {
        console.log(`[Test] Waiting... ${waited} seconds`);
      }
    }
    
    if (predictionData) {
      console.log('[Test] SUCCESS - Found prediction data');
      console.log('[Test] Spectra count:', predictionData.spectra?.length || 0);
      if (predictionData.spectra && predictionData.spectra.length > 0) {
        const spec = predictionData.spectra[0];
        console.log('[Test] Nucleus:', spec.nucleus);
        console.log('[Test] Peaks:', spec.peaks?.length || 0);
      }
    } else {
      console.log('[Test] FAILED - No prediction data found after', maxWait, 'seconds');
    }
    
    await browser.close();
    
  } catch (error) {
    console.error('[Test] ERROR:', error.message);
    await browser.close();
  }
}

testNMRProxy();

