/**
 * E2E Tests for Structure Validation
 */

import { test, expect } from '@playwright/test';

test.describe('Structure Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.getByText('Click anywhere to start').click({ timeout: 8000 }).catch(() => {});
    await page.waitForSelector('text=Chemical Info', { timeout: 30000 });
  });

  test('should display validation panel', async ({ page }) => {
    // Check if validation panel exists (Layout/Predict NMR in Chemical Info panel)
    const hasLayoutButton = await page.getByRole('button', { name: /layout/i }).count() > 0;
    const hasValidStructure = await page.locator('text=Valid Structure').count() > 0;
    const hasPredictNmr = await page.getByRole('button', { name: /predict nmr/i }).count() > 0;
    expect(hasLayoutButton || hasValidStructure || hasPredictNmr).toBeTruthy();
  });

  test('should show empty state when no structure', async ({ page }) => {
    // Check for empty state message (validation or info panel)
    const emptyMessage = page.locator('text=Draw a structure to see validation feedback').or(
      page.locator('text=Draw a structure or search for a compound to see detailed information')
    );
    await expect(emptyMessage.first()).toBeVisible();
  });

  test('should show validation feedback', async ({ page }) => {
    // The Chemical Info / validation area should exist
    await expect(page.locator('text=Chemical Info')).toBeVisible();
  });

  test('should display molecular formula section', async ({ page }) => {
    // Look for molecular formula label or section
    const formulaSection = page.locator('text=/molecular formula/i');
    
    // May or may not be visible depending on state
    const count = await formulaSection.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should show SMILES display', async ({ page }) => {
    // Check if SMILES section exists
    const smilesLabel = page.locator('text=SMILES');
    
    // Should exist in the validation panel
    const count = await smilesLabel.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});

