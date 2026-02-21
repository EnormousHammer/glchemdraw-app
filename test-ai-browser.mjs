#!/usr/bin/env node
/**
 * Launch browser and test all AI features visually
 * Run: node test-ai-browser.mjs
 */
import { chromium } from '@playwright/test';

const BASE = 'http://localhost:1420';

async function main() {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 150,
  });
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await context.newPage();
  page.setDefaultTimeout(60000);

  console.log('>>> LAUNCHING BROWSER - A window should pop up on your screen! <<<\n');
  console.log('Launching browser at', BASE, '...\n');

  try {
    // 1. Load app
    await page.goto(BASE);
    await page.waitForSelector('text=Chemical Info', { timeout: 25000 });
    console.log('✓ App loaded');

    // 2. Test AI fallback: search "asprin"
    console.log('\n2. Testing search "asprin" (AI fallback)...');
    const search = page.getByPlaceholder(/search compound name/i);
    await search.fill('asprin');
    await search.press('Enter');
    await page.waitForTimeout(8000);
    const hasC9H8O4 = await page.getByText('C9H8O4').first().isVisible().catch(() => false);
    const hasNotFound = await page.locator('text=Compound not found').isVisible().catch(() => false);
    if (hasC9H8O4 && !hasNotFound) {
      console.log('   ✓ AI fallback worked - aspirin structure loaded (C9H8O4)');
    } else {
      console.log('   ✗ AI fallback may have failed. C9H8O4:', hasC9H8O4, '| Not found:', hasNotFound);
    }

    // 3. Test NMR prediction
    console.log('\n3. Testing NMR prediction...');
    const predictBtn = page.locator('button:has-text("Predict NMR")');
    await predictBtn.scrollIntoViewIfNeeded();
    await predictBtn.click();
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
    console.log('   ✓ NMR dialog opened');
    await page.waitForTimeout(15000);
    const dialogText = await page.locator('[role="dialog"]').textContent();
    const hasPeaks = /ppm|δ|chemical shift|¹H|¹³C/i.test(dialogText || '');
    console.log('   ', hasPeaks ? '✓' : '?', 'Prediction result visible');

    // 4. Test "Explain with AI" if present
    const explainBtn = page.locator('button:has-text("Explain with AI"), button:has-text("Explain")');
    if (await explainBtn.count() > 0) {
      console.log('\n4. Testing "Explain with AI"...');
      await explainBtn.first().click();
      await page.waitForTimeout(10000);
      console.log('   ✓ Explain triggered');
    }

    // Keep browser open so you can see results (30 seconds)
    console.log('\n>>> BROWSER STAYING OPEN 30s - check your screen! <<<');
    await page.waitForTimeout(30000);
  } finally {
    await browser.close();
  }
  console.log('\nDone.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
