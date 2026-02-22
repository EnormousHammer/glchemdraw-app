/**
 * Integration tests for AI chemistry functions.
 * Requires: npm run dev:proxy running (localhost:3001) and OPENAI_API_KEY in openaikey/.env
 * Run: npm run test:run -- src/test/integration/ai-chemistry.test.ts
 */

import { describe, it, expect, beforeAll } from 'vitest';
import {
  aiNameToSmiles,
  aiSmilesToIupac,
  aiEstimatePhysicalProperties,
  aiEstimateSafety,
  prepareSmilesForAI,
} from '@/lib/openai/chemistry';

const PROXY_URL = 'http://localhost:3001';

async function isProxyAvailable(): Promise<boolean> {
  try {
    const res = await fetch(`${PROXY_URL}/health`, { signal: AbortSignal.timeout(2000) });
    return res.ok;
  } catch {
    return false;
  }
}

describe('AI Chemistry Functions', () => {
  beforeAll(() => {
    // Ensure chatWithOpenAI uses localhost proxy in test env
    Object.defineProperty(window, 'location', {
      value: { hostname: 'localhost', origin: 'http://localhost:1420' },
      writable: true,
    });
  });

  describe('prepareSmilesForAI', () => {
    it('accepts valid SMILES', () => {
      expect(prepareSmilesForAI('CCO')).toBe('CCO');
      expect(prepareSmilesForAI('CC(=O)Oc1ccccc1C(=O)O')).toBeTruthy();
    });
    it('rejects empty or invalid', () => {
      expect(prepareSmilesForAI('')).toBeNull();
      expect(prepareSmilesForAI('x')).toBeNull();
    });
  });

  describe('aiNameToSmiles', () => {
    it('converts common name to SMILES', async () => {
      const available = await isProxyAvailable();
      if (!available) {
        console.warn('[AI Test] Proxy not available, skipping aiNameToSmiles');
        return;
      }
      const smiles = await aiNameToSmiles('ethanol');
      expect(smiles).toBeTruthy();
      expect(typeof smiles).toBe('string');
      expect(smiles!.length).toBeGreaterThan(2);
      expect(/[A-Za-z\[\]\(\)=#@\+\-\d]/.test(smiles!)).toBe(true);
    }, 15000);

    it('converts aspirin to SMILES', async () => {
      const available = await isProxyAvailable();
      if (!available) return;
      const smiles = await aiNameToSmiles('aspirin');
      expect(smiles).toBeTruthy();
      expect(smiles).toMatch(/[CcO]/);
    }, 15000);
  });

  describe('aiSmilesToIupac', () => {
    it('converts CCO to IUPAC name', async () => {
      const available = await isProxyAvailable();
      if (!available) return;
      const name = await aiSmilesToIupac('CCO');
      expect(name).toBeTruthy();
      expect(typeof name).toBe('string');
      expect(name!.toLowerCase()).toMatch(/ethanol|ethan-1-ol/i);
    }, 15000);

    it('converts aspirin SMILES to name', async () => {
      const available = await isProxyAvailable();
      if (!available) return;
      const name = await aiSmilesToIupac('CC(=O)Oc1ccccc1C(=O)O');
      expect(name).toBeTruthy();
      expect(name!.toLowerCase()).toMatch(/aspirin|acetyl|salicyl|benzo/i);
    }, 15000);
  });

  describe('aiEstimatePhysicalProperties', () => {
    it('estimates properties for ethanol', async () => {
      const available = await isProxyAvailable();
      if (!available) return;
      const result = await aiEstimatePhysicalProperties('CCO');
      expect(result).toBeTruthy();
      expect(typeof result).toBe('object');
      // Should have at least some parsed fields
      const keys = Object.keys(result!);
      expect(keys.length).toBeGreaterThan(0);
      if (result!.boilingPoint) expect(result!.boilingPoint).toMatch(/\d|°|C/i);
      if (result!.logP != null) expect(typeof result!.logP).toBe('number');
    }, 20000);
  });

  describe('aiEstimateSafety', () => {
    it('returns safety summary for ethanol', async () => {
      const available = await isProxyAvailable();
      if (!available) return;
      const summary = await aiEstimateSafety('CCO', 'ethanol');
      expect(summary).toBeTruthy();
      expect(typeof summary).toBe('string');
      expect(summary!.length).toBeGreaterThan(50);
    }, 20000);
  });
});
