/**
 * Unit Tests for SDF Parser
 */

import { describe, it, expect } from 'vitest';
import {
  parseSDFFile,
  generateSDFFile,
  validateSDFFormat,
  molfilesToSDFStructures,
} from '@lib/chemistry/sdf';

describe('SDF Parser', () => {
  describe('validateSDFFormat', () => {
    it('should detect valid SDF files', () => {
      const sdf = 'MOL content\nM  END\n$$$$\n';
      const result = validateSDFFormat(sdf);
      expect(result.isValid).toBe(true);
      expect(result.structureCount).toBeGreaterThan(0);
    });

    it('should reject empty files', () => {
      const result = validateSDFFormat('');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Empty');
    });
  });

  describe('parseSDFFile', () => {
    it('should parse single structure', () => {
      const sdf = `Test Compound
Structure
  -ISIS-  12345678

  3  2  0  0  0  0  0  0  0  0999 V2000
    0.0000    0.0000    0.0000 C   0  0  0  0  0  0
    1.0000    0.0000    0.0000 C   0  0  0  0  0  0
    2.0000    0.0000    0.0000 O   0  0  0  0  0  0
  1  2  1  0  0  0
  2  3  1  0  0  0
M  END
$$$$`;
      
      const result = parseSDFFile(sdf);
      expect(result.structures.length).toBe(1);
      expect(result.errors.length).toBe(0);
    });

    it('should parse SDF properties', () => {
      const sdf = `Compound
Structure
  -ISIS-  12345678

  1  0  0  0  0  0  0  0  0  0999 V2000
    0.0000    0.0000    0.0000 C   0  0  0  0  0  0
M  END
> <MW>
180.16

> <Formula>
C6H12O6

$$$$`;
      
      const result = parseSDFFile(sdf);
      expect(result.structures[0].properties['MW']).toBe('180.16');
      expect(result.structures[0].properties['Formula']).toBe('C6H12O6');
    });
  });

  describe('generateSDFFile', () => {
    it('should generate valid SDF', () => {
      const structures = [{
        molfile: 'Test\nStructure\n\n  1  0  0\n    0  0  0 C\nM  END',
        properties: { MW: '16' },
        name: 'Test',
        id: 'test_1',
      }];

      const sdf = generateSDFFile(structures);
      expect(sdf).toContain('M  END');
      expect(sdf).toContain('$$$$');
      expect(sdf).toContain('> <MW>');
    });
  });

  describe('molfilesToSDFStructures', () => {
    it('should convert MOL files to structures', () => {
      const molfiles = ['MOL1\nM  END', 'MOL2\nM  END'];
      const names = ['Compound1', 'Compound2'];
      
      const structures = molfilesToSDFStructures(molfiles, names);
      expect(structures.length).toBe(2);
      expect(structures[0].name).toBe('Compound1');
      expect(structures[1].name).toBe('Compound2');
    });
  });
});

