/**
 * Unit Tests for Input Validation
 */

import { describe, it, expect } from 'vitest';
import {
  validateSMILES,
  validateMOLFile,
  sanitizeSearchQuery,
  validateFileSize,
  validateCASNumber,
} from '@lib/validation/input';

describe('Input Validation', () => {
  describe('validateSMILES', () => {
    it('should accept valid SMILES strings', () => {
      const result = validateSMILES('CCO');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject empty SMILES', () => {
      const result = validateSMILES('');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('SMILES string is empty');
    });

    it('should detect unbalanced brackets', () => {
      const result = validateSMILES('C(CO');
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('bracket');
    });

    it('should warn on very long SMILES', () => {
      const longSmiles = 'C'.repeat(600);
      const result = validateSMILES(longSmiles);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('validateMOLFile', () => {
    it('should detect missing M  END marker', () => {
      const result = validateMOLFile('Invalid MOL content');
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('M  END');
    });

    it('should accept valid MOL file', () => {
      const molFile = `
Structure
  -ISIS-  12345678

  3  2  0  0  0  0  0  0  0  0999 V2000
    0.0000    0.0000    0.0000 C   0  0  0  0  0  0
    1.0000    0.0000    0.0000 C   0  0  0  0  0  0
    2.0000    0.0000    0.0000 O   0  0  0  0  0  0
  1  2  1  0  0  0
  2  3  1  0  0  0
M  END
`;
      const result = validateMOLFile(molFile);
      expect(result.isValid).toBe(true);
    });
  });

  describe('sanitizeSearchQuery', () => {
    it('should remove dangerous characters', () => {
      const result = sanitizeSearchQuery('benzene<script>');
      expect(result.isValid).toBe(true);
      expect(result.sanitized).toBe('benzenescript');
    });

    it('should detect SQL injection patterns', () => {
      const result = sanitizeSearchQuery('SELECT * FROM');
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('dangerous keywords');
    });

    it('should accept clean queries', () => {
      const result = sanitizeSearchQuery('aspirin');
      expect(result.isValid).toBe(true);
      expect(result.sanitized).toBe('aspirin');
    });
  });

  describe('validateFileSize', () => {
    it('should accept files within limit', () => {
      const result = validateFileSize(1024 * 1024 * 5); // 5MB
      expect(result.isValid).toBe(true);
    });

    it('should reject oversized files', () => {
      const result = validateFileSize(1024 * 1024 * 15, 10); // 15MB with 10MB limit
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('exceeds maximum');
    });

    it('should warn when close to limit', () => {
      const result = validateFileSize(1024 * 1024 * 9, 10); // 9MB with 10MB limit
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('validateCASNumber', () => {
    it('should accept valid CAS numbers', () => {
      const result = validateCASNumber('50-00-0');
      expect(result.isValid).toBe(true);
    });

    it('should reject invalid CAS format', () => {
      const result = validateCASNumber('invalid');
      expect(result.isValid).toBe(false);
    });
  });
});

