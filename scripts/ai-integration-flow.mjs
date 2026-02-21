/**
 * Custom Playwright script: AI Integration flow + screenshot
 * Run: node scripts/ai-integration-flow.mjs
 * Requires: npm run dev (1420) + npm run dev:proxy (3001)
 */

import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCREENSHOT_PATH = path.join(__dirname, '..', 'ai-integration-final.png');

async function main() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('1. Opening http://localhost:1420...');
    await page.goto('http://localhost:1420', { waitUntil: 'domcontentloaded' });

    console.log('2. Skipping loading screen...');
    await page.getByText('Click anywhere to start').click({ timeout: 8000 }).catch(() => {});
    await page.waitForSelector('text=Chemical Info', { timeout: 30000 });

    console.log('3. Searching for "asprin" (AI fallback)...');
    const searchInput = page.getByPlaceholder(/search compound name/i);
    await searchInput.fill('asprin');
    await searchInput.press('Enter');
    await page.waitForSelector('text=C9H8O4', { timeout: 15000 });
    console.log('   Verified: aspirin structure (C9H8O4)');

    console.log('4. Searching for "acetone"...');
    await searchInput.fill('acetone');
    await searchInput.press('Enter');
    await page.waitForSelector('text=C3H6O', { timeout: 15000 });
    await page.waitForTimeout(2000);

    console.log('5. Clicking Predict NMR...');
    const predictNmrButton = page.locator('button:has-text("Predict NMR")');
    await predictNmrButton.scrollIntoViewIfNeeded();
    await predictNmrButton.click();

    const dialog = page.getByRole('dialog', { name: /NMR Prediction/i });
    await dialog.waitFor({ state: 'visible', timeout: 5000 });
    await page.waitForTimeout(25000);

    const explainButton = dialog.getByRole('button', { name: /Explain with AI/i });
    await explainButton.waitFor({ state: 'visible', timeout: 5000 });
    console.log('   Verified: "Explain with AI" button visible');

    console.log('5b. Closing NMR dialog...');
    await page.keyboard.press('Escape');
    await dialog.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(500);

    console.log('6. Expanding AI Assistant and running analysis...');
    await page.getByText('AI', { exact: true }).first().click();
    const runAnalysisBtn = page.getByRole('button', { name: /run analysis/i });
    await runAnalysisBtn.scrollIntoViewIfNeeded();
    await runAnalysisBtn.click();

    // Wait for analysis to complete: progress hidden OR AI Analysis card OR Run Analysis enabled
    await page.waitForSelector('text=AI Analysis Progress', { state: 'hidden', timeout: 45000 }).catch(() => {});
    const aiResult = page.locator('text=AI Analysis').first();
    const found = await aiResult.waitFor({ state: 'visible', timeout: 20000 }).then(() => true).catch(() => false);
    if (found) {
      console.log('   Verified: AI Analysis results visible');
    } else {
      console.log('   Note: AI Analysis card not found within timeout (may need OpenAI key)');
    }

    console.log('7. Taking screenshot...');
    await page.screenshot({ path: SCREENSHOT_PATH, fullPage: true });
    console.log('   Saved: ' + SCREENSHOT_PATH);

    console.log('Done. Keeping browser open for 3s...');
    await page.waitForTimeout(3000);
  } catch (err) {
    console.error('Error:', err.message);
    await page.screenshot({ path: SCREENSHOT_PATH.replace('.png', '-error.png'), fullPage: true }).catch(() => {});
    console.log('Error screenshot saved.');
  } finally {
    await browser.close();
  }
}

main();
