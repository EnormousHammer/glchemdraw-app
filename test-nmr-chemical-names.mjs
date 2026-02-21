#!/usr/bin/env node
/**
 * Test NMR prediction on numerous chemical names
 * Run: node test-nmr-chemical-names.mjs
 * Requires: npm run dev + npm run dev:proxy
 */
import { chromium } from '@playwright/test';

const BASE = 'http://localhost:1420';
const CHEMICAL_NAMES = [
  'acetone',
  'ethanol',
  'benzene',
  'aspirin',
  'asprin',      // misspelled - AI fallback
  'caffeine',
  'glucose',
  'acetic acid',
  'toluene',
  'phenol',
  'aniline',
  'pyridine',
  'cyclohexane',
  'methanol',
  'formaldehyde',
  'acetophenone',
  'naphthalene',
];

async function main() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  page.setDefaultTimeout(60000);

  console.log('=== NMR Test on Chemical Names ===\n');
  console.log('Launching browser at', BASE, '...\n');

  const results = [];

  try {
    await page.goto(BASE);
    await page.waitForSelector('text=Chemical Info', { timeout: 30000 });
    console.log('✓ App loaded\n');

    for (let i = 0; i < CHEMICAL_NAMES.length; i++) {
      const name = CHEMICAL_NAMES[i];
      console.log(`[${i + 1}/${CHEMICAL_NAMES.length}] Testing: ${name}`);

      try {
        // Search
        const search = page.getByPlaceholder(/search compound name/i);
        await search.clear();
        await search.fill(name);
        await search.press('Enter');
        await page.waitForTimeout(4000);

        // Check if structure loaded
        const hasFormula = await page.locator('text=/C\\d*H\\d*|C\\d*H\\d*O|C\\d*H\\d*N/').first().isVisible().catch(() => false);
        const hasNotFound = await page.locator('text=Compound not found').isVisible().catch(() => false);

        if (hasNotFound) {
          console.log(`   ✗ Not found`);
          results.push({ name, status: 'not_found' });
          continue;
        }

        if (!hasFormula) {
          console.log(`   ? No formula visible, continuing...`);
        }

        // Click Predict NMR
        const predictBtn = page.locator('button:has-text("Predict NMR")');
        await predictBtn.scrollIntoViewIfNeeded();
        const btnEnabled = await predictBtn.isEnabled().catch(() => false);
        if (!btnEnabled) {
          console.log(`   ✗ Predict NMR disabled`);
          results.push({ name, status: 'nmr_disabled' });
          continue;
        }

        await predictBtn.click();
        await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
        await page.waitForTimeout(12000); // AI prediction

        const dialog = page.locator('[role="dialog"]');
        const dialogText = await dialog.textContent();
        const hasPeaks = /ppm|δ|chemical shift|signals/i.test(dialogText || '');
        const hasError = /error|failed/i.test(dialogText || '');

        if (hasPeaks) {
          const hCount = (dialogText?.match(/¹H NMR \(\d+\)/)?.[0]?.match(/\d+/)?.[0]) || '?';
          const cCount = (dialogText?.match(/¹³C NMR \(\d+\)/)?.[0]?.match(/\d+/)?.[0]) || '?';
          console.log(`   ✓ NMR: ¹H(${hCount}) ¹³C(${cCount})`);
          results.push({ name, status: 'ok', h: hCount, c: cCount });
        } else if (hasError) {
          console.log(`   ✗ Error in prediction`);
          results.push({ name, status: 'error' });
        } else {
          console.log(`   ? No peaks detected`);
          results.push({ name, status: 'no_peaks' });
        }

        // Close dialog
        await page.getByRole('button', { name: /close/i }).click();
        await page.waitForTimeout(500);
      } catch (e) {
        console.log(`   ✗ ${e.message}`);
        results.push({ name, status: 'exception', error: e.message });
      }
    }

    // Summary
    console.log('\n=== Summary ===');
    const ok = results.filter((r) => r.status === 'ok').length;
    const failed = results.filter((r) => r.status !== 'ok').length;
    console.log(`Passed: ${ok}/${results.length}`);
    console.log(`Failed/Other: ${failed}`);
    if (failed > 0) {
      console.log('\nFailed:', results.filter((r) => r.status !== 'ok').map((r) => r.name).join(', '));
    }

    await page.waitForTimeout(2000);
  } finally {
    await browser.close();
  }
  console.log('\nDone.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
