/**
 * E2E Tests for PubChem Search
 */

import { test, expect } from '@playwright/test';

test.describe('PubChem Search', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('text=Structure Drawing & Analysis', { timeout: 15000 });
  });

  test('should search for compound by name', async ({ page }) => {
    // Find search input (header compound search, not monomer library)
    const searchInput = page.getByPlaceholder(/search compound name/i);
    await searchInput.fill('aspirin');
    await searchInput.press('Enter');

    // Wait for search results
    await page.waitForTimeout(2000);

    // Should show compound info (use first() - multiple instances possible)
    await expect(page.locator('text=/aspirin|acetylsalicylic|2-acetyloxybenzoic/i').first()).toBeVisible({ timeout: 10000 });
  });

  test('should display compound properties', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search compound name/i);
    await searchInput.fill('ethanol');
    await searchInput.press('Enter');

    await page.waitForTimeout(2000);

    // Check for molecular formula (use first() to avoid strict mode with multiple C2H6O)
    await expect(page.getByText('C2H6O').first()).toBeVisible({ timeout: 10000 });
    
    // Check for molecular weight (use first() - multiple matches possible)
    await expect(page.locator('text=/46\\.07|46\\.0|46\\.04/i').first()).toBeVisible();
  });

  test('should show "not found" for invalid compound', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search compound name/i);
    await searchInput.fill('xyzabc123notreal');
    await searchInput.press('Enter');

    // Wait for Snackbar with "Compound not found" (MUI Snackbar)
    await expect(page.locator('text=/compound not found|not found/i')).toBeVisible({ timeout: 10000 });
  });

  test('should clear search', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search compound name/i);
    await searchInput.fill('aspirin');
    
    // Clear the input
    await searchInput.clear();
    
    expect(await searchInput.inputValue()).toBe('');
  });
});

