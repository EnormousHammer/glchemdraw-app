/**
 * E2E Tests for PubChem Search
 */

import { test, expect } from '@playwright/test';

test.describe('PubChem Search', () => {
  test.setTimeout(60000);

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.getByText('Click anywhere to start').click({ timeout: 8000 }).catch(() => {});
    await page.waitForSelector('text=Chemical Info', { timeout: 30000 });
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

    // Wait for PubChem to return and compound to load (can be slow)
    await page.waitForTimeout(5000);

    // Scroll right panel into view (formula may be below fold)
    await page.locator('text=Chemical Info').first().scrollIntoViewIfNeeded();

    // Check for molecular formula (ethanol = C2H6O)
    await expect(page.getByText('C2H6O').first()).toBeVisible({ timeout: 15000 });

    // Check for molecular weight (use first() - multiple matches possible)
    await expect(page.locator('text=/46\\.07|46\\.0|46\\.04/i').first()).toBeVisible({ timeout: 5000 });
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

