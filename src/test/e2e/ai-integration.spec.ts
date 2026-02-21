/**
 * E2E Tests for AI Integration
 * Requires: npm run dev + npm run dev:proxy
 */

import { test, expect } from '@playwright/test';

test.describe('AI Integration', () => {
  test.setTimeout(60000);

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    // LoadingScreen blocks for 5s - click center to skip
    await page.getByText('Click anywhere to start').click({ timeout: 8000 }).catch(() => {});
    await page.waitForSelector('text=Chemical Info', { timeout: 30000 });
  });

  test('should use AI fallback when searching "asprin" (misspelled aspirin)', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search compound name/i);
    await searchInput.fill('asprin');
    await searchInput.press('Enter');

    // AI fallback should return aspirin structure - look for molecular formula C9H8O4
    await expect(page.getByText('C9H8O4').first()).toBeVisible({ timeout: 15000 });
    // Should NOT show "Compound not found"
    await expect(page.locator('text=Compound not found')).not.toBeVisible();
  });

  test('should show compound after AI name-to-structure fallback', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search compound name/i);
    await searchInput.fill('asprin');
    await searchInput.press('Enter');

    // Wait for structure to load - aspirin has acetyl/benzoic structure
    await expect(page.locator('text=/C9H8O4|acetylsalicylic|aspirin/i').first()).toBeVisible({ timeout: 15000 });
  });

  test('should show "Compound not found" for gibberish "xyzabc123"', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search compound name/i);
    await searchInput.fill('xyzabc123');
    await searchInput.press('Enter');

    // Wait for Snackbar with "Compound not found" (no AI for gibberish)
    await expect(page.locator('text=/compound not found|not found/i')).toBeVisible({ timeout: 15000 });
  });

  test('should expand AI Assistant and have Run Analysis button', async ({ page }) => {
    await page.getByText('AI', { exact: true }).first().click();
    await expect(page.getByRole('button', { name: /run analysis/i })).toBeVisible({ timeout: 8000 });
  });

  test('should show Predict NMR button and Explain with AI after loading acetone', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search compound name/i);
    await searchInput.fill('acetone');
    await searchInput.press('Enter');

    await expect(page.getByText('C3H6O').first()).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(2000);

    const predictNmrButton = page.locator('button:has-text("Predict NMR")');
    await predictNmrButton.scrollIntoViewIfNeeded();
    await expect(predictNmrButton).toBeEnabled({ timeout: 10000 });
    await predictNmrButton.click();

    const dialog = page.getByRole('dialog', { name: /NMR Prediction/i });
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // Wait for prediction to complete (AI or nmr-predictor)
    await page.waitForTimeout(25000);

    // Check for "Explain with AI" button when results are shown
    const explainButton = dialog.getByRole('button', { name: /Explain with AI/i });
    await expect(explainButton).toBeVisible({ timeout: 5000 });
  });

  test('should run AI analysis and show results', async ({ page }) => {
    // Load acetone first
    const searchInput = page.getByPlaceholder(/search compound name/i);
    await searchInput.fill('acetone');
    await searchInput.press('Enter');

    await expect(page.getByText('C3H6O').first()).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(1500);

    // Expand AI Assistant and click Run Analysis
    await page.getByText('AI', { exact: true }).first().click();
    const runAnalysisBtn = page.getByRole('button', { name: /run analysis/i });
    await runAnalysisBtn.scrollIntoViewIfNeeded();
    await runAnalysisBtn.click();

    // Wait for AI analysis to complete - progress bar disappears, then result card appears
    await page.waitForSelector('text=AI Analysis Progress', { state: 'hidden', timeout: 35000 }).catch(() => {});
    // Expect AI result: "AI Analysis" card or propanone/acetone in content
    await expect(page.locator('text=AI Analysis').first()).toBeVisible({ timeout: 15000 });
  });
});
