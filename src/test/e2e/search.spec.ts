/**
 * E2E Tests for PubChem Search
 */

import { test, expect } from '@playwright/test';

test.describe('PubChem Search', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should search for compound by name', async ({ page }) => {
    // Find search input
    const searchInput = page.getByPlaceholder(/search/i);
    await searchInput.fill('aspirin');
    await searchInput.press('Enter');

    // Wait for search results
    await page.waitForTimeout(2000);

    // Should show compound info
    await expect(page.locator('text=/aspirin|acetylsalicylic/i')).toBeVisible({ timeout: 10000 });
  });

  test('should display compound properties', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search/i);
    await searchInput.fill('ethanol');
    await searchInput.press('Enter');

    await page.waitForTimeout(2000);

    // Check for molecular formula
    await expect(page.locator('text=C2H6O')).toBeVisible({ timeout: 10000 });
    
    // Check for molecular weight
    await expect(page.locator('text=/46\\.07|46\\.0/i')).toBeVisible();
  });

  test('should show "not found" for invalid compound', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search/i);
    await searchInput.fill('xyzabc123notreal');
    await searchInput.press('Enter');

    await page.waitForTimeout(2000);

    // Should show no results or error message
    // (Depends on implementation - adjust as needed)
    const hasNoResults = await page.locator('text=/not found|no results/i').count() > 0;
    const hasError = await page.locator('[role="alert"]').count() > 0;
    
    expect(hasNoResults || hasError).toBeTruthy();
  });

  test('should clear search', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search/i);
    await searchInput.fill('aspirin');
    
    // Clear the input
    await searchInput.clear();
    
    expect(await searchInput.inputValue()).toBe('');
  });
});

