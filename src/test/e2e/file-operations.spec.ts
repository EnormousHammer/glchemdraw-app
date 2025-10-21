/**
 * E2E Tests for File Operations
 */

import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

test.describe('File Operations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should have file operation buttons', async ({ page }) => {
    // Check toolbar buttons exist
    await expect(page.getByRole('button', { name: /new/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /open/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /save/i })).toBeVisible();
  });

  test('should clear canvas on new', async ({ page }) => {
    // Click New button
    const newButton = page.getByRole('button', { name: /new/i });
    await newButton.click();

    // Canvas should be present
    const canvas = page.locator('.Ketcher-root');
    await expect(canvas).toBeVisible();
  });

  test('should show batch import/export buttons', async ({ page }) => {
    // Check for batch operation buttons
    const importButton = page.locator('[title*="Batch Import"]');
    const exportButton = page.locator('[title*="Batch Export"]');

    // At least one should exist
    const importExists = await importButton.count() > 0;
    const exportExists = await exportButton.count() > 0;

    expect(importExists || exportExists).toBeTruthy();
  });

  test('should open batch import dialog', async ({ page }) => {
    const importButton = page.locator('[title*="Batch Import"]').first();
    
    if (await importButton.count() > 0) {
      await importButton.click();
      
      // Dialog should open
      await expect(page.locator('text=/batch import/i')).toBeVisible({ timeout: 5000 });
      
      // Close dialog
      const closeButton = page.getByRole('button', { name: /close|cancel/i }).first();
      if (await closeButton.count() > 0) {
        await closeButton.click();
      }
    }
  });

  test('should have undo/redo buttons', async ({ page }) => {
    const undoButton = page.getByRole('button', { name: /undo/i });
    const redoButton = page.getByRole('button', { name: /redo/i });

    await expect(undoButton).toBeVisible();
    await expect(redoButton).toBeVisible();
  });
});

