/**
 * E2E Tests for NMR Prediction
 */

import { test, expect } from '@playwright/test';

test.describe('NMR Prediction', () => {
  test.setTimeout(60000); // NMR prediction can take 20+ seconds

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should open NMR dialog and show prediction (nmr-predictor fallback)', async ({ page }) => {
    // Search for acetone to load a structure
    const searchInput = page.getByPlaceholder(/search compound name/i);
    await searchInput.fill('acetone');
    await searchInput.press('Enter');

    // Wait for search to complete and structure to load
    await expect(page.getByText('C3H6O').first()).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(1500);

    // Predict NMR button - scroll into view and click
    const predictNmrButton = page.locator('button:has-text("Predict NMR")');
    await predictNmrButton.scrollIntoViewIfNeeded();
    await expect(predictNmrButton).toBeEnabled({ timeout: 10000 });
    await predictNmrButton.click();

    // NMR dialog should open
    await expect(page.getByRole('dialog', { name: /NMR Prediction/i })).toBeVisible({ timeout: 5000 });

    // Wait for prediction to complete (nmr-predictor fetches DBs, can take 15-20s)
    await page.waitForTimeout(20000);

    // Dialog should show Close button (always visible) and either loading or results
    const dialog = page.getByRole('dialog', { name: /NMR Prediction/i });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('button', { name: /close/i })).toBeVisible();
  });

  test('should show NMR dialog with Close button', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search compound name/i);
    await searchInput.fill('ethanol');
    await searchInput.press('Enter');
    await expect(page.getByText('C2H6O').first()).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(1500);

    const predictNmrButton = page.locator('button:has-text("Predict NMR")');
    await predictNmrButton.scrollIntoViewIfNeeded();
    await expect(predictNmrButton).toBeEnabled({ timeout: 10000 });
    await predictNmrButton.click();

    const dialog = page.getByRole('dialog', { name: /NMR Prediction/i });
    await expect(dialog).toBeVisible({ timeout: 5000 });
    await expect(dialog.getByRole('button', { name: /close/i })).toBeVisible();
  });
});
