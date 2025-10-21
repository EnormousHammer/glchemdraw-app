/**
 * CSV Export Utilities
 * Handles exporting chemical data to CSV format
 */

import type { PubChemCompound } from '@/types/chemistry';
import type { SDFStructure } from '../chemistry/sdf';

/**
 * Convert PubChem compounds to CSV format
 * @param compounds - Array of PubChem compounds
 * @param includeAllProperties - Include all available properties (default: false)
 */
export function compoundsToCSV(
  compounds: PubChemCompound[],
  includeAllProperties: boolean = false
): string {
  if (compounds.length === 0) {
    return '';
  }

  // Define columns
  const baseColumns = [
    'CID',
    'IUPAC Name',
    'Molecular Formula',
    'Molecular Weight',
    'Canonical SMILES',
    'InChI',
    'InChI Key',
    'XLogP',
    'TPSA',
    'Complexity',
    'H-Bond Donors',
    'H-Bond Acceptors',
    'Rotatable Bonds',
    'Heavy Atom Count',
    'Charge',
  ];

  // Extract all property keys if including all properties
  const allPropertyKeys = includeAllProperties
    ? Array.from(
        new Set(
          compounds.flatMap(c => Object.keys(c.properties))
        )
      )
    : [];

  const columns = includeAllProperties 
    ? [...baseColumns, ...allPropertyKeys.filter(k => !baseColumns.includes(k))]
    : baseColumns;

  // Create header row
  const headerRow = columns.map(escapeCSV).join(',');

  // Create data rows
  const dataRows = compounds.map(compound => {
    const row = columns.map(column => {
      let value: any;

      switch (column) {
        case 'CID':
          value = compound.cid;
          break;
        case 'IUPAC Name':
          value = compound.properties.IUPACName || '';
          break;
        case 'Molecular Formula':
          value = compound.properties.MolecularFormula || '';
          break;
        case 'Molecular Weight':
          value = compound.properties.MolecularWeight || '';
          break;
        case 'Canonical SMILES':
          value = compound.properties.CanonicalSMILES || '';
          break;
        case 'InChI':
          value = compound.properties.InChI || '';
          break;
        case 'InChI Key':
          value = compound.properties.InChIKey || '';
          break;
        case 'XLogP':
          value = compound.properties.XLogP ?? '';
          break;
        case 'TPSA':
          value = compound.properties.TPSA ?? '';
          break;
        case 'Complexity':
          value = compound.properties.Complexity ?? '';
          break;
        case 'H-Bond Donors':
          value = compound.properties.HBondDonorCount ?? '';
          break;
        case 'H-Bond Acceptors':
          value = compound.properties.HBondAcceptorCount ?? '';
          break;
        case 'Rotatable Bonds':
          value = compound.properties.RotatableBondCount ?? '';
          break;
        case 'Heavy Atom Count':
          value = compound.properties.HeavyAtomCount ?? '';
          break;
        case 'Charge':
          value = compound.properties.Charge ?? '';
          break;
        default:
          // Dynamic property
          value = compound.properties[column] ?? '';
      }

      return escapeCSV(String(value));
    });

    return row.join(',');
  });

  // Combine header and data
  return [headerRow, ...dataRows].join('\n');
}

/**
 * Convert SDF structures to CSV format
 * @param structures - Array of SDF structures
 * @param includeAllProperties - Include all SDF properties
 */
export function structuresToCSV(
  structures: SDFStructure[],
  includeAllProperties: boolean = false
): string {
  if (structures.length === 0) {
    return '';
  }

  // Base columns
  const baseColumns = ['ID', 'Name'];

  // Get all unique property keys
  const allPropertyKeys = includeAllProperties
    ? Array.from(
        new Set(
          structures.flatMap(s => Object.keys(s.properties || {}))
        )
      )
    : [];

  const columns = [...baseColumns, ...allPropertyKeys];

  // Create header row
  const headerRow = columns.map(escapeCSV).join(',');

  // Create data rows
  const dataRows = structures.map(structure => {
    const row = columns.map(column => {
      let value: any;

      switch (column) {
        case 'ID':
          value = structure.id || '';
          break;
        case 'Name':
          value = structure.name || '';
          break;
        default:
          value = structure.properties?.[column] || '';
      }

      return escapeCSV(String(value));
    });

    return row.join(',');
  });

  return [headerRow, ...dataRows].join('\n');
}

/**
 * Escape CSV field (handle commas, quotes, newlines)
 * @param field - Field value to escape
 */
function escapeCSV(field: string): string {
  // If field contains comma, quote, or newline, wrap in quotes and escape quotes
  if (field.includes(',') || field.includes('"') || field.includes('\n')) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

/**
 * Download CSV file
 * @param csvContent - CSV content string
 * @param filename - Filename for download
 */
export function downloadCSV(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * Generate Excel-compatible CSV (with BOM for UTF-8)
 * @param csvContent - CSV content
 */
export function toExcelCSV(csvContent: string): string {
  // Add UTF-8 BOM for Excel compatibility
  return '\uFEFF' + csvContent;
}

