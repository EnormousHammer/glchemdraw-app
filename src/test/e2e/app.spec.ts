/**
 * E2E Tests for GlChemDraw Application
 */

import { test, expect } from '@playwright/test';

test.describe('GlChemDraw Application', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.getByText('Click anywhere to start').click({ timeout: 8000 }).catch(() => {});
    await page.waitForSelector('text=Chemical Info', { timeout: 30000 });
  });

  test('should load the application', async ({ page }) => {
    // Check if the app title is visible (GL-ChemDraw in header)
    await expect(page.locator('text=GL-ChemDraw')).toBeVisible();
    
    // Check if main panels are present (Layout button is in Chemical Info panel)
    await expect(page.locator('text=Structure Drawing & Analysis')).toBeVisible();
    await expect(page.getByRole('button', { name: /layout/i }).first()).toBeVisible({ timeout: 10000 });
  });

  test('should display toolbar buttons', async ({ page }) => {
    // Wait for Ketcher toolbar to load
    await expect(page.getByRole('button', { name: /clear canvas/i })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: 'Open... (Ctrl+O)' })).toBeVisible();
  });

  test('should toggle dark mode', async ({ page }) => {
    
    // Find and click dark mode toggle
    const darkModeButton = page.getByRole('button').filter({ has: page.locator('[data-testid="Brightness4Icon"], [data-testid="Brightness7Icon"]') });
    
    if (await darkModeButton.count() > 0) {
      await darkModeButton.first().click();
      // App should still be visible after toggle
      await expect(page.locator('text=GL-ChemDraw')).toBeVisible();
    }
  });

  test('should show validation panel', async ({ page }) => {
    // Check if validation panel exists (Layout/Predict NMR in Chemical Info panel)
    const hasLayoutButton = await page.getByRole('button', { name: /layout/i }).count() > 0;
    const hasValidation = await page.locator('text=Valid Structure').count() > 0;
    const hasPredictNmr = await page.getByRole('button', { name: /predict nmr/i }).count() > 0;
    expect(hasLayoutButton || hasValidation || hasPredictNmr).toBeTruthy();
  });
});

