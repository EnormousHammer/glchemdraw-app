/**
 * E2E Tests for Beat ChemDraw Roadmap Features
 * Actually runs features and verifies results.
 */

import { test, expect } from '@playwright/test';

test.describe('Roadmap Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.getByText('Click anywhere to start').click({ timeout: 8000 }).catch(() => {});
    await page.waitForSelector('text=Chemical Info', { timeout: 30000 });
  });

  test('shareable link ?smiles= loads structure', async ({ page }) => {
    await page.goto('/?smiles=CC(=O)O');
    await page.waitForLoadState('domcontentloaded');
    await page.getByText('Click anywhere to start').click({ timeout: 5000 }).catch(() => {});
    await page.waitForSelector('text=Chemical Info', { timeout: 30000 });
    await expect(page.locator('text=C2H4O2').first()).toBeVisible({ timeout: 10000 });
  });

  test('shareable link ?cid= loads structure', async ({ page }) => {
    await page.goto('/?cid=241');
    await page.waitForLoadState('domcontentloaded');
    await page.getByText('Click anywhere to start').click({ timeout: 5000 }).catch(() => {});
    await page.waitForSelector('text=Chemical Info', { timeout: 30000 });
    await expect(page.locator('text=C6H6').first()).toBeVisible({ timeout: 20000 });
  });

  test('fuzzy search benzin finds benzene', async ({ page }) => {
    await page.getByPlaceholder('Search compound name...').fill('benzin');
    await page.getByPlaceholder('Search compound name...').press('Enter');
    await page.waitForTimeout(4000);
    await expect(page.locator('text=C6H6').first()).toBeVisible({ timeout: 10000 });
  });

  test('shortcut overlay opens on ? key', async ({ page }) => {
    await page.keyboard.press('Shift+?');
    await expect(page.getByRole('heading', { name: 'GL-ChemDraw Shortcuts', exact: true })).toBeVisible({ timeout: 3000 });
  });

  test('Batch Export produces CSV with PubChem data', async ({ page }) => {
    await page.goto('/?smiles=c1ccccc1');
    await page.waitForLoadState('domcontentloaded');
    await page.getByText('Click anywhere to start').click({ timeout: 5000 }).catch(() => {});
    await page.waitForSelector('text=C6H6', { timeout: 15000 });

    await page.getByRole('button', { name: 'Export' }).click({ timeout: 10000 });
    await page.getByRole('menuitem', { name: /batch export.*csv/i }).click();

    await page.getByPlaceholder(/CCO/).fill('c1ccccc1\nCCO');
    await page.getByRole('button', { name: 'Fetch data' }).click();

    await expect(page.getByRole('cell', { name: 'c1ccccc1' })).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('button', { name: 'Export CSV' })).toBeVisible({ timeout: 5000 });
  });

  test('Batch NMR runs and shows table', async ({ page }) => {
    test.setTimeout(60000);
    await page.getByRole('button', { name: /batch nmr/i }).click();
    await page.getByPlaceholder(/CCO/).fill('CCO');
    await page.getByRole('button', { name: 'Run batch' }).click();

    await expect(page.getByRole('cell', { name: 'CCO' })).toBeVisible({ timeout: 50000 });
    await expect(page.locator('text=¹H').first()).toBeVisible({ timeout: 5000 });
  });

  test('Find papers opens literature dialog', async ({ page }) => {
    await page.getByPlaceholder('Search compound name...').fill('benzene');
    await page.getByPlaceholder('Search compound name...').press('Enter');
    await page.waitForTimeout(4000);

    await page.getByRole('button', { name: 'Find papers' }).click();
    await expect(page.getByRole('heading', { name: /find papers/i })).toBeVisible({ timeout: 5000 });
  });

  test('Copy shareable link shows success', async ({ page }) => {
    await page.goto('/?smiles=c1ccccc1');
    await page.waitForLoadState('domcontentloaded');
    await page.getByText('Click anywhere to start').click({ timeout: 5000 }).catch(() => {});
    await page.waitForSelector('text=C6H6', { timeout: 15000 });

    await page.getByRole('button', { name: 'Export' }).click({ timeout: 10000 });
    await page.getByRole('menuitem', { name: /copy shareable link/i }).click();

    await expect(page.getByText(/copied|shareable link/i)).toBeVisible({ timeout: 5000 });
  });
});
