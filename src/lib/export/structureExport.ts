/**
 * Structure Export Utilities
 * Export chemical structures as MOL, SDF, or SMILES
 * Works in both web (Blob download) and Tauri (native save dialog)
 * Tauri file ops are dynamically imported to avoid loading in web mode
 */

import { isTauriDesktop } from '../tauri/detectPlatform';
import { generateSDFFile } from '../chemistry/sdf';

export type ExportFormat = 'mol' | 'sdf' | 'smiles';

export interface ExportResult {
  success: boolean;
  error?: string;
}

/**
 * Trigger browser download (web only)
 */
function downloadBlob(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export structure as MOL file
 */
export async function exportAsMol(
  molfile: string,
  defaultName: string = 'structure.mol'
): Promise<ExportResult> {
  if (!molfile?.trim()) {
    return { success: false, error: 'No structure to export' };
  }

  try {
    if (isTauriDesktop()) {
      const { saveMolFile } = await import('../tauri/fileOperations');
      const path = await saveMolFile(molfile, defaultName);
      if (!path) return { success: false, error: 'Save cancelled' };
      return { success: true };
    } else {
      downloadBlob(molfile, defaultName, 'chemical/x-mdl-molfile');
      return { success: true };
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg || 'Export failed' };
  }
}

/**
 * Export structure as SDF file (single structure)
 */
export async function exportAsSdf(
  molfile: string,
  defaultName: string = 'structure.sdf'
): Promise<ExportResult> {
  if (!molfile?.trim()) {
    return { success: false, error: 'No structure to export' };
  }

  try {
    const sdfContent = generateSDFFile([
      { molfile, properties: {}, name: 'Structure' },
    ]);

    if (isTauriDesktop()) {
      const { saveMolFile } = await import('../tauri/fileOperations');
      const path = await saveMolFile(sdfContent, defaultName);
      if (!path) return { success: false, error: 'Save cancelled' };
      return { success: true };
    } else {
      downloadBlob(sdfContent, defaultName, 'chemical/x-mdl-sdfile');
      return { success: true };
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg || 'Export failed' };
  }
}

/**
 * Export structure as SMILES file
 */
export async function exportAsSmiles(
  smiles: string,
  defaultName: string = 'structure.smi'
): Promise<ExportResult> {
  if (!smiles?.trim()) {
    return { success: false, error: 'No structure to export' };
  }

  try {
    if (isTauriDesktop()) {
      const { saveFile, writeTextFile } = await import('../tauri/fileOperations');
      const path = await saveFile(
        'Save as SMILES',
        defaultName,
        [{ name: 'SMILES File', extensions: ['smi'] }]
      );
      if (!path) return { success: false, error: 'Save cancelled' };
      await writeTextFile(path, smiles);
      return { success: true };
    } else {
      downloadBlob(smiles, defaultName, 'text/plain');
      return { success: true };
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg || 'Export failed' };
  }
}
