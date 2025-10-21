/**
 * Input Validation Utilities
 * Comprehensive validation for SMILES, MOL files, and search queries
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  sanitized?: string;
}

/**
 * Validate and sanitize SMILES string
 * @param smiles - SMILES string to validate
 * @param maxLength - Maximum allowed length (default: 10000)
 */
export function validateSMILES(smiles: string, maxLength: number = 10000): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if empty
  if (!smiles || smiles.trim().length === 0) {
    errors.push('SMILES string is empty');
    return { isValid: false, errors, warnings };
  }

  // Trim whitespace
  const trimmed = smiles.trim();

  // Check length
  if (trimmed.length > maxLength) {
    errors.push(`SMILES string exceeds maximum length of ${maxLength} characters`);
    return { isValid: false, errors, warnings };
  }

  // Check for invalid characters (basic check - RDKit will do thorough validation)
  const validSMILESChars = /^[A-Za-z0-9@+\-\[\]\(\)=#$/\\%:.]+$/;
  if (!validSMILESChars.test(trimmed)) {
    errors.push('SMILES contains invalid characters');
    return { isValid: false, errors, warnings };
  }

  // Check for balanced brackets
  const brackets = { '(': ')', '[': ']' };
  const stack: string[] = [];
  for (const char of trimmed) {
    if (char in brackets) {
      stack.push(char);
    } else if (Object.values(brackets).includes(char)) {
      const lastOpen = stack.pop();
      if (!lastOpen || brackets[lastOpen as keyof typeof brackets] !== char) {
        errors.push('Unbalanced brackets in SMILES string');
        return { isValid: false, errors, warnings };
      }
    }
  }

  if (stack.length > 0) {
    errors.push('Unclosed brackets in SMILES string');
    return { isValid: false, errors, warnings };
  }

  // Warnings for potentially problematic SMILES
  if (trimmed.length > 500) {
    warnings.push('Very long SMILES string - processing may be slow');
  }

  if (trimmed.includes('*')) {
    warnings.push('SMILES contains wildcard atoms (*) - may not be supported by all operations');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    sanitized: trimmed,
  };
}

/**
 * Validate MOL file content
 * @param molfile - MOL file content
 * @param maxSizeKB - Maximum file size in KB (default: 1024KB = 1MB)
 */
export function validateMOLFile(molfile: string, maxSizeKB: number = 1024): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if empty
  if (!molfile || molfile.trim().length === 0) {
    errors.push('MOL file is empty');
    return { isValid: false, errors, warnings };
  }

  // Check size
  const sizeKB = new Blob([molfile]).size / 1024;
  if (sizeKB > maxSizeKB) {
    errors.push(`MOL file size (${sizeKB.toFixed(2)}KB) exceeds maximum of ${maxSizeKB}KB`);
    return { isValid: false, errors, warnings };
  }

  // Check for M  END marker
  if (!molfile.includes('M  END')) {
    errors.push('MOL file missing M  END marker - invalid format');
    return { isValid: false, errors, warnings };
  }

  // Check for counts line (line 4 should have atom/bond counts)
  const lines = molfile.split('\n');
  if (lines.length < 4) {
    errors.push('MOL file too short - missing required header lines');
    return { isValid: false, errors, warnings };
  }

  // Validate counts line format (line 4)
  const countsLine = lines[3];
  if (countsLine) {
    // Counts line should have at least atom and bond counts
    const countsMatch = countsLine.match(/^\s*(\d+)\s+(\d+)/);
    if (!countsMatch) {
      warnings.push('MOL file counts line may be malformed');
    }
  }

  // Check for potentially problematic content
  if (molfile.length > 100000) {
    warnings.push('Very large MOL file - processing may be slow');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    sanitized: molfile.trim(),
  };
}

/**
 * Sanitize search query to prevent injection attacks
 * @param query - User search query
 * @param maxLength - Maximum allowed length (default: 500)
 */
export function sanitizeSearchQuery(query: string, maxLength: number = 500): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if empty
  if (!query || query.trim().length === 0) {
    errors.push('Search query is empty');
    return { isValid: false, errors, warnings };
  }

  // Trim and limit length
  let sanitized = query.trim();
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
    warnings.push(`Query truncated to ${maxLength} characters`);
  }

  // Remove potentially dangerous characters
  // Allow: letters, numbers, spaces, hyphens, parentheses, commas, dots
  const allowedPattern = /[^A-Za-z0-9\s\-(),.']/g;
  const dangerousChars = sanitized.match(allowedPattern);
  
  if (dangerousChars && dangerousChars.length > 0) {
    sanitized = sanitized.replace(allowedPattern, '');
    warnings.push('Special characters removed from query');
  }

  // Check for SQL injection patterns
  const sqlPatterns = /(\bselect\b|\binsert\b|\bdelete\b|\bdrop\b|\bexec\b|\bscript\b)/i;
  if (sqlPatterns.test(sanitized)) {
    errors.push('Query contains potentially dangerous keywords');
    return { isValid: false, errors, warnings };
  }

  // Check for XSS patterns
  const xssPatterns = /(<script|javascript:|onerror=|onload=)/i;
  if (xssPatterns.test(sanitized)) {
    errors.push('Query contains potentially dangerous content');
    return { isValid: false, errors, warnings };
  }

  // Final length check after sanitization
  if (sanitized.length === 0) {
    errors.push('Query became empty after sanitization');
    return { isValid: false, errors, warnings };
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    sanitized,
  };
}

/**
 * Validate file size
 * @param fileSizeBytes - File size in bytes
 * @param maxSizeMB - Maximum allowed size in MB (default: 10MB)
 */
export function validateFileSize(fileSizeBytes: number, maxSizeMB: number = 10): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const sizeMB = fileSizeBytes / (1024 * 1024);

  if (sizeMB > maxSizeMB) {
    errors.push(`File size (${sizeMB.toFixed(2)}MB) exceeds maximum of ${maxSizeMB}MB`);
    return { isValid: false, errors, warnings };
  }

  if (sizeMB > maxSizeMB * 0.8) {
    warnings.push(`File size (${sizeMB.toFixed(2)}MB) is close to maximum limit`);
  }

  return {
    isValid: true,
    errors,
    warnings,
  };
}

/**
 * Validate file extension
 * @param filename - File name
 * @param allowedExtensions - Array of allowed extensions (without dots)
 */
export function validateFileExtension(
  filename: string,
  allowedExtensions: string[]
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!filename) {
    errors.push('Filename is empty');
    return { isValid: false, errors, warnings };
  }

  const extension = filename.split('.').pop()?.toLowerCase();
  if (!extension) {
    errors.push('File has no extension');
    return { isValid: false, errors, warnings };
  }

  if (!allowedExtensions.includes(extension)) {
    errors.push(
      `File extension '.${extension}' is not allowed. Allowed: ${allowedExtensions.join(', ')}`
    );
    return { isValid: false, errors, warnings };
  }

  return {
    isValid: true,
    errors,
    warnings,
  };
}

/**
 * Validate content type
 * @param contentType - MIME type or file content type
 * @param allowedTypes - Array of allowed content types
 */
export function validateContentType(
  contentType: string,
  allowedTypes: string[]
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!contentType) {
    errors.push('Content type is not specified');
    return { isValid: false, errors, warnings };
  }

  // Normalize content type (remove parameters like charset)
  const normalizedType = contentType.split(';')[0].trim().toLowerCase();

  // Check if allowed
  const isAllowed = allowedTypes.some(allowed => {
    const pattern = allowed.replace('*', '.*');
    return new RegExp(`^${pattern}$`).test(normalizedType);
  });

  if (!isAllowed) {
    errors.push(
      `Content type '${normalizedType}' is not allowed. Allowed: ${allowedTypes.join(', ')}`
    );
    return { isValid: false, errors, warnings };
  }

  return {
    isValid: true,
    errors,
    warnings,
  };
}

/**
 * Comprehensive input validation for chemical files
 * @param filename - File name
 * @param content - File content
 * @param maxSizeMB - Maximum file size in MB
 */
export function validateChemicalFile(
  filename: string,
  content: string,
  maxSizeMB: number = 10
): ValidationResult {
  const allErrors: string[] = [];
  const allWarnings: string[] = [];

  // Validate extension
  const extResult = validateFileExtension(filename, ['mol', 'sdf', 'sd', 'smiles', 'smi']);
  allErrors.push(...extResult.errors);
  allWarnings.push(...extResult.warnings);

  if (!extResult.isValid) {
    return { isValid: false, errors: allErrors, warnings: allWarnings };
  }

  // Validate size
  const sizeBytes = new Blob([content]).size;
  const sizeResult = validateFileSize(sizeBytes, maxSizeMB);
  allErrors.push(...sizeResult.errors);
  allWarnings.push(...sizeResult.warnings);

  if (!sizeResult.isValid) {
    return { isValid: false, errors: allErrors, warnings: allWarnings };
  }

  // Validate content based on extension
  const extension = filename.split('.').pop()?.toLowerCase();
  if (extension === 'mol' || extension === 'sdf' || extension === 'sd') {
    const molResult = validateMOLFile(content);
    allErrors.push(...molResult.errors);
    allWarnings.push(...molResult.warnings);
  }

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
    sanitized: content.trim(),
  };
}

/**
 * Validate CAS Registry Number format
 * @param cas - CAS number string
 */
export function validateCASNumber(cas: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!cas || cas.trim().length === 0) {
    errors.push('CAS number is empty');
    return { isValid: false, errors, warnings };
  }

  // CAS format: XX-XX-X or XXX-XX-X or XXXX-XX-X, etc.
  const casPattern = /^\d{2,7}-\d{2}-\d$/;
  if (!casPattern.test(cas)) {
    errors.push('Invalid CAS number format (expected: XXXXX-XX-X)');
    return { isValid: false, errors, warnings };
  }

  return {
    isValid: true,
    errors,
    warnings,
    sanitized: cas.trim(),
  };
}

