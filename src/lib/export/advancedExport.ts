/**
 * Advanced Export - High-res PNG/SVG, PDF, and data formats
 * Uses Ketcher generateImage with scaling for DPI
 */

import { exportAsMol, exportAsSdf, exportAsSmiles } from './structureExport';
import { isTauriDesktop } from '../tauri/detectPlatform';

export interface AdvancedExportOptions {
  format: 'PNG' | 'SVG' | 'PDF' | 'MOL' | 'SDF' | 'SMILES' | 'InChI';
  quality: 'Low' | 'Medium' | 'High' | 'Publication';
  width: number;
  height: number;
  dpi: number;
  backgroundColor: 'white' | 'transparent' | 'black';
  includeProperties?: boolean;
  includeAnnotations?: boolean;
  includeTitle?: boolean;
  title?: string;
  author?: string;
  date?: string;
  /** When provided (File System Access API), write directly to file for automatic save */
  fileHandle?: FileSystemFileHandle;
}

/** Extension and MIME for each format */
export const FORMAT_EXT: Record<string, { ext: string; mime: string }> = {
  PNG: { ext: '.png', mime: 'image/png' },
  SVG: { ext: '.svg', mime: 'image/svg+xml' },
  PDF: { ext: '.pdf', mime: 'application/pdf' },
  MOL: { ext: '.mol', mime: 'chemical/x-mdl-molfile' },
  SDF: { ext: '.sdf', mime: 'chemical/x-mdl-sdfile' },
  SMILES: { ext: '.smi', mime: 'text/plain' },
  InChI: { ext: '.txt', mime: 'text/plain' },
};

/** Write blob to File System Access API handle */
async function writeBlobToHandle(handle: FileSystemFileHandle, blob: Blob): Promise<void> {
  const writable = await handle.createWritable();
  await writable.write(blob);
  await writable.close();
}

const DPI_MAP: Record<string, number> = {
  Low: 72,
  Medium: 150,
  High: 300,
  Publication: 600,
};

/** Keep only letters, numbers, hyphen, underscore. Short and sweet. */
const SAFE_CHARS = /[^a-zA-Z0-9_-]/g;
const WIN_RESERVED = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i;

/** Short, clean filename: letters, numbers, hyphen, underscore only. Max 40 chars. */
export function sanitizeFilename(name: string, maxLen: number = 40): string {
  if (!name?.trim()) return 'structure';
  let safe = name
    .replace(SAFE_CHARS, '')
    .replace(/-+/g, '-')
    .replace(/_+/g, '_')
    .replace(/^[-_]+|[-_]+$/g, '')
    .slice(0, maxLen);
  if (WIN_RESERVED.test(safe) || !safe) return 'structure';
  return safe;
}

/** Ensure filename has correct extension for format. Short base (40 chars max). */
export function ensureExtension(filename: string, format: string): string {
  const { ext } = FORMAT_EXT[format] || { ext: '.png' };
  const base = sanitizeFilename(filename.replace(/\.[^.]+$/, '').trim() || 'structure');
  return `${base}${ext}`;
}

/** Trigger download - use File with explicit name for better browser support. */
export function downloadBlob(blob: Blob, filename: string): void {
  const file = blob instanceof File ? blob : new File([blob], filename, { type: blob.type });
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  a.style.display = 'none';
  document.body.appendChild(a);
  try {
    a.click();
  } catch (_) {}
  setTimeout(() => {
    try { document.body.removeChild(a); } catch (_) {}
    URL.revokeObjectURL(url);
  }, 1000);
}

/** Scale PNG blob to target DPI. If width/height provided, scale to fit within that box (at dpi) while keeping aspect ratio. */
async function scalePngToDpi(
  blob: Blob,
  targetDpi: number,
  targetWidth?: number,
  targetHeight?: number
): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = targetDpi / 72;
      let outW: number;
      let outH: number;
      if (targetWidth && targetHeight && targetWidth > 0 && targetHeight > 0) {
        const maxW = Math.round(targetWidth * scale);
        const maxH = Math.round(targetHeight * scale);
        const imgAspect = img.width / img.height;
        const boxAspect = maxW / maxH;
        if (imgAspect > boxAspect) {
          outW = maxW;
          outH = Math.round(maxW / imgAspect);
        } else {
          outH = maxH;
          outW = Math.round(maxH * imgAspect);
        }
      } else {
        outW = Math.round(img.width * scale);
        outH = Math.round(img.height * scale);
      }
      const canvas = document.createElement('canvas');
      canvas.width = outW;
      canvas.height = outH;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(blob);
        return;
      }
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, outW, outH);
      canvas.toBlob(
        (b) => (b ? resolve(b) : resolve(blob)),
        'image/png',
        1.0
      );
    };
    img.onerror = () => resolve(blob);
    img.src = URL.createObjectURL(blob);
  });
}

/** Ketcher generateImage only accepts 'transparent' for backgroundColor. White/black must be omitted. */
/** For black background: composite Ketcher output (white bg) onto black via canvas. */
async function applyBlackBackground(blob: Blob): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(blob);
        return;
      }
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      canvas.toBlob((b) => (b ? resolve(b) : resolve(blob)), 'image/png', 1.0);
    };
    img.onerror = () => resolve(blob);
    img.src = URL.createObjectURL(blob);
  });
}

export interface AdvancedExportResult {
  success: boolean;
  error?: string;
  /** When present, UI should show a download link (browsers block async-triggered downloads) */
  downloadBlob?: Blob;
  downloadFilename?: string;
}

/**
 * Perform advanced export using Ketcher and options.
 */
export async function performAdvancedExport(
  ketcher: any,
  options: AdvancedExportOptions,
  structureData: { molfile?: string; smiles?: string; name?: string }
): Promise<AdvancedExportResult> {
  const { format, dpi, backgroundColor, title, fileHandle } = options;
  const baseName = sanitizeFilename(structureData.name || 'structure');

  try {
    // Data formats - use existing exporters or write to fileHandle
    if (format === 'MOL') {
      const molfile = structureData.molfile || '';
      if (!molfile?.trim()) return { success: false, error: 'No structure to export' };
      if (fileHandle) {
        await writeBlobToHandle(fileHandle, new Blob([molfile], { type: 'chemical/x-mdl-molfile' }));
        return { success: true };
      }
      return await exportAsMol(molfile, `${baseName}.mol`);
    }
    if (format === 'SDF') {
      const molfile = structureData.molfile || '';
      if (!molfile?.trim()) return { success: false, error: 'No structure to export' };
      if (fileHandle) {
        const { generateSDFFile } = await import('../chemistry/sdf');
        const sdfContent = generateSDFFile([{ molfile, properties: {}, name: 'Structure' }]);
        await writeBlobToHandle(fileHandle, new Blob([sdfContent], { type: 'chemical/x-mdl-sdfile' }));
        return { success: true };
      }
      return await exportAsSdf(molfile, `${baseName}.sdf`);
    }
    if (format === 'SMILES') {
      const smiles = structureData.smiles || '';
      if (!smiles?.trim()) return { success: false, error: 'No structure to export' };
      if (fileHandle) {
        await writeBlobToHandle(fileHandle, new Blob([smiles], { type: 'text/plain' }));
        return { success: true };
      }
      return await exportAsSmiles(smiles, `${baseName}.smi`);
    }
    if (format === 'InChI') {
      if (!structureData.smiles) return { success: false, error: 'No structure' };
      const { generateInChI } = await import('../chemistry/rdkit');
      const inchi = await generateInChI(structureData.smiles);
      if (!inchi) return { success: false, error: 'Could not generate InChI' };
      if (fileHandle) {
        await writeBlobToHandle(fileHandle, new Blob([inchi], { type: 'text/plain' }));
        return { success: true };
      }
      if (isTauriDesktop()) {
        const { saveFile, writeTextFile } = await import('../tauri/fileOperations');
        const path = await saveFile('Save InChI', `${baseName}.txt`, [
          { name: 'Text File', extensions: ['txt'] },
        ]);
        if (!path) return { success: false, error: 'Save cancelled' };
        await writeTextFile(path, inchi);
        return { success: true };
      }
      downloadBlob(new Blob([inchi], { type: 'text/plain' }), `${baseName}.txt`);
      return { success: true };
    }

    // Image formats - need Ketcher
    if (!ketcher?.generateImage) return { success: false, error: 'Editor not ready' };

    // Use ketcher.getKet() directly - avoids Indigo conversion errors (molfile→KET can fail for
    // reactions, polymers, or malformed data). getKet returns native format generateImage expects.
    let structStr: string;
    try {
      structStr = await ketcher.getKet();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return { success: false, error: msg || 'Could not get structure' };
    }
    if (!structStr?.trim()) return { success: false, error: 'No structure to export. Draw a molecule on the canvas first.' };

    const genOpts: Record<string, unknown> = {
      outputFormat: format === 'SVG' ? 'svg' : 'png',
    };
    if (backgroundColor === 'transparent') {
      genOpts.backgroundColor = 'transparent';
    }
    // Ketcher's option manager rejects rgb(), hex, etc. Only 'transparent' works. White is default.

    let blob: Blob;
    try {
      blob = await Promise.race([
        ketcher.generateImage(structStr, genOpts),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Image generation took too long')), 30000)
        ),
      ]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return { success: false, error: msg.includes('took too long') ? 'Image generation took too long. Try reducing size or DPI.' : msg };
    }
    if (!blob) return { success: false, error: 'Image generation failed' };

    if (backgroundColor === 'black' && format !== 'SVG') {
      blob = await applyBlackBackground(blob);
    }

    if (format === 'PNG') {
      const scaled = await scalePngToDpi(blob, dpi, options.width, options.height);
      const filename = `${baseName}.png`;
      if (fileHandle) {
        await writeBlobToHandle(fileHandle, scaled);
        return { success: true };
      }
      if (isTauriDesktop()) {
        const { saveFile } = await import('../tauri/fileOperations');
        const buffer = await scaled.arrayBuffer();
        const path = await saveFile('Save PNG', filename, [
          { name: 'PNG Image', extensions: ['png'] },
        ]);
        if (!path) return { success: false, error: 'Save cancelled' };
        const { writeFile } = await import('@tauri-apps/plugin-fs');
        await writeFile(path, new Uint8Array(buffer));
        return { success: true };
      }
      const safePngFilename = filename.endsWith('.png') ? filename : `${baseName}.png`;
      return { success: true, downloadBlob: scaled, downloadFilename: safePngFilename };
    }

    if (format === 'SVG') {
      let text = await blob.text();
      if (backgroundColor === 'black') {
        text = text.replace(/<svg([^>]*)>/, '<svg$1><rect width="100%" height="100%" fill="#000000"/>');
      }
      const filename = `${baseName}.svg`;
      const svgBlob = new Blob([text], { type: 'image/svg+xml' });
      if (fileHandle) {
        await writeBlobToHandle(fileHandle, svgBlob);
        return { success: true };
      }
      if (isTauriDesktop()) {
        const { saveFile, writeTextFile } = await import('../tauri/fileOperations');
        const path = await saveFile('Save SVG', filename, [
          { name: 'SVG File', extensions: ['svg'] },
        ]);
        if (!path) return { success: false, error: 'Save cancelled' };
        await writeTextFile(path, text);
        return { success: true };
      }
      const safeSvgFilename = filename.endsWith('.svg') ? filename : `${baseName}.svg`;
      return { success: true, downloadBlob: svgBlob, downloadFilename: safeSvgFilename };
    }

    if (format === 'PDF') {
      const pngBlob = await scalePngToDpi(blob, dpi, options.width, options.height);
      const dataUrl = await new Promise<string>((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result as string);
        r.onerror = rej;
        r.readAsDataURL(pngBlob);
      });
      const imgSize = await new Promise<{ w: number; h: number }>((res) => {
        const img = new Image();
        img.onload = () => res({ w: img.width, h: img.height });
        img.onerror = () => res({ w: 400, h: 300 });
        img.src = dataUrl;
      });
      try {
        const { jsPDF } = await import('jspdf');
        const doc = new jsPDF({ unit: 'mm', format: 'a4' });
        const pageW = doc.internal.pageSize.getWidth();
        const pageH = doc.internal.pageSize.getHeight();
        const margin = 20;
        const maxW = pageW - 2 * margin;
        const maxH = pageH - 2 * margin - (options.includeTitle && title ? 15 : 0);
        let imgW = (imgSize.w / 96) * 25.4;
        let imgH = (imgSize.h / 96) * 25.4;
        if (imgW > maxW || imgH > maxH) {
          const scale = Math.min(maxW / imgW, maxH / imgH);
          imgW *= scale;
          imgH *= scale;
        }
        let y = margin;
        if (options.includeTitle && title) {
          doc.setFontSize(16);
          doc.text(title, margin, y + 5);
          y += 15;
        }
        doc.addImage(dataUrl, 'PNG', margin, y, imgW, imgH);
        const filename = `${baseName}.pdf`;
        const pdfBlob = doc.output('blob');
        if (fileHandle) {
          await writeBlobToHandle(fileHandle, pdfBlob);
          return { success: true };
        }
        if (isTauriDesktop()) {
          const pdfBytes = doc.output('arraybuffer');
          const { saveFile } = await import('../tauri/fileOperations');
          const path = await saveFile('Save PDF', filename, [
            { name: 'PDF Document', extensions: ['pdf'] },
          ]);
          if (!path) return { success: false, error: 'Save cancelled' };
          const { writeFile } = await import('@tauri-apps/plugin-fs');
          await writeFile(path, new Uint8Array(pdfBytes));
          return { success: true };
        }
        const safePdfFilename = filename.endsWith('.pdf') ? filename : `${baseName}.pdf`;
        return { success: true, downloadBlob: pdfBlob, downloadFilename: safePdfFilename };
      } catch {
        return { success: false, error: 'PDF export requires jspdf. Install: npm install jspdf' };
      }
    }

    return { success: false, error: 'Unsupported format' };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg || 'Export failed (unknown error)' };
  }
}
