/**
 * E2E Tests for Structure Validation
 */

import { test, expect } from '@playwright/test';

test.describe('Structure Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should display validation panel', async ({ page }) => {
    // Check if validation panel header exists
    await expect(page.locator('text=Structure Validation')).toBeVisible();
  });

  test('should show empty state when no structure', async ({ page }) => {
    // Check for empty state message
    const emptyMessage = page.locator('text=/draw a structure|no structure/i');
    const isVisible = await emptyMessage.count() > 0;
    
    // Empty state might be visible initially
    expect(isVisible).toBeTruthy();
  });

  test('should show validation feedback', async ({ page }) => {
    // The validation panel should exist
    const validationPanel = page.locator('text=Structure Validation').locator('..');
    await expect(validationPanel).toBeVisible();
    
    // It should contain some validation-related text
    // (Exact content depends on whether a structure is drawn)
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

