/**
 * E2E Tests for GlChemDraw Application
 */

import { test, expect } from '@playwright/test';

test.describe('GlChemDraw Application', () => {
  test('should load the application', async ({ page }) => {
    await page.goto('/');
    
    // Check if the app title is visible
    await expect(page.locator('text=GlChemDraw')).toBeVisible();
    
    // Check if main panels are present
    await expect(page.locator('text=Chemical Structure Editor')).toBeVisible();
    await expect(page.locator('text=PubChem Search')).toBeVisible();
  });

  test('should display toolbar buttons', async ({ page }) => {
    await page.goto('/');
    
    // Check for toolbar buttons
    await expect(page.getByRole('button', { name: /new/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /open/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /save/i })).toBeVisible();
  });

  test('should toggle dark mode', async ({ page }) => {
    await page.goto('/');
    
    // Find and click dark mode toggle
    const darkModeButton = page.getByRole('button').filter({ has: page.locator('[data-testid="Brightness4Icon"], [data-testid="Brightness7Icon"]') });
    
    if (await darkModeButton.count() > 0) {
      await darkModeButton.first().click();
      // App should still be visible after toggle
      await expect(page.locator('text=GlChemDraw')).toBeVisible();
    }
  });

  test('should show validation panel', async ({ page }) => {
    await page.goto('/');
    
    // Check if validation panel exists
    await expect(page.locator('text=Structure Validation')).toBeVisible();
  });
});

