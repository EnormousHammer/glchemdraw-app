/**
 * Advanced Export - High-res PNG/SVG, PDF, and data formats
 * Uses Ketcher generateImage with scaling for DPI
 */

import { exportAsMol, exportAsSdf, exportAsSmiles } from './structureExport';
import { isTauriDesktop } from '../tauri/detectPlatform';

export interface AdvancedExportOptions {
  format: 'PNG' | 'JPEG' | 'SVG' | 'PDF' | 'MOL' | 'SDF' | 'CDX' | 'RXN' | 'SMILES' | 'InChI' | 'InChIKey' | 'SMARTS';
  quality: 'Low' | 'Medium' | 'High' | 'Publication';
  width: number;
  height: number;
  dpi: number;
  backgroundColor: 'white' | 'transparent' | 'black';
  /** Render all atoms and bonds in black (for reports/slides) */
  blackAtoms?: boolean;
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
  JPEG: { ext: '.jpg', mime: 'image/jpeg' },
  SVG: { ext: '.svg', mime: 'image/svg+xml' },
  PDF: { ext: '.pdf', mime: 'application/pdf' },
  MOL: { ext: '.mol', mime: 'chemical/x-mdl-molfile' },
  SDF: { ext: '.sdf', mime: 'chemical/x-mdl-sdfile' },
  RXN: { ext: '.rxn', mime: 'chemical/x-mdl-rxnfile' },
  CDX: { ext: '.cdx', mime: 'application/octet-stream' },
  SMILES: { ext: '.smi', mime: 'text/plain' },
  InChI: { ext: '.txt', mime: 'text/plain' },
  InChIKey: { ext: '.txt', mime: 'text/plain' },
  SMARTS: { ext: '.sma', mime: 'text/plain' },
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

/** Trigger a named file download. Uses blob URL + a.download — Chrome respects this reliably. */
export function downloadBlob(blob: Blob, filename: string): void {
  // Do NOT wrap in new File() — Chrome ignores a.download when URL is from a File object.
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    try { document.body.removeChild(a); } catch (_) {}
    URL.revokeObjectURL(url);
  }, 2000);
}

/** Crop PNG to content bounds (removes excess padding). Adds padding pixels around content. */
export async function cropPngToContent(blob: Blob, padding = 12): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const w = img.width;
      const h = img.height;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(blob);
        return;
      }
      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(0, 0, w, h);
      const d = data.data;
      let minX = w;
      let minY = h;
      let maxX = 0;
      let maxY = 0;
      const isContent = (i: number) => {
        const a = d[i + 3];
        if (a < 20) return false;
        const r = d[i];
        const g = d[i + 1];
        const b = d[i + 2];
        const isWhite = r > 250 && g > 250 && b > 250;
        const isBlack = r < 5 && g < 5 && b < 5;
        return !isWhite && !isBlack; // Exclude transparent, white bg, black bg
      };
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const i = (y * w + x) * 4;
          if (isContent(i)) {
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
          }
        }
      }
      if (minX > maxX || minY > maxY) {
        resolve(blob);
        return;
      }
      const pad = Math.max(0, padding);
      const x1 = Math.max(0, minX - pad);
      const y1 = Math.max(0, minY - pad);
      const x2 = Math.min(w, maxX + pad + 1);
      const y2 = Math.min(h, maxY + pad + 1);
      const cw = x2 - x1;
      const ch = y2 - y1;
      const out = document.createElement('canvas');
      out.width = cw;
      out.height = ch;
      const outCtx = out.getContext('2d');
      if (!outCtx) {
        resolve(blob);
        return;
      }
      outCtx.drawImage(img, x1, y1, cw, ch, 0, 0, cw, ch);
      out.toBlob((b) => (b ? resolve(b) : resolve(blob)), 'image/png', 1.0);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(blob);
    };
    img.src = url;
  });
}

/** Add padding by scaling structure down and centering. structureScale 0.5 = structure takes 50% of frame. */
async function addPaddingToPng(blob: Blob, structureScale = 0.5, bgColor: 'white' | 'transparent' | 'black' = 'white'): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const w = img.width;
      const h = img.height;
      const outW = Math.round(w / structureScale);
      const outH = Math.round(h / structureScale);
      const canvas = document.createElement('canvas');
      canvas.width = outW;
      canvas.height = outH;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(blob);
        return;
      }
      if (bgColor === 'white') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, outW, outH);
      } else if (bgColor === 'black') {
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, outW, outH);
      }
      const dx = (outW - w) / 2;
      const dy = (outH - h) / 2;
      ctx.drawImage(img, dx, dy, w, h);
      canvas.toBlob((b) => (b ? resolve(b) : resolve(blob)), 'image/png', 1.0);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(blob);
    };
    img.src = url;
  });
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

/**
 * Render an SVG string onto a canvas at exact pixel dimensions and return a PNG blob.
 *
 * Because SVG is vector, the browser's SVG rasterizer draws at whatever canvas size we
 * specify — giving perfectly sharp lines, atom labels, and bond angles at any resolution.
 * This replaces the old approach of: Ketcher PNG (screen res) → bitmap upscale → blurry.
 *
 * paddingFraction: fraction of each dimension kept as whitespace margin around the structure.
 * 0.15 = 15 % on each side → structure fills the central 70 % of the frame.
 */
async function svgToHighResPng(
  svgText: string,
  targetW: number,
  targetH: number,
  bgColor: 'white' | 'transparent' | 'black',
  paddingFraction = 0.15,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    if (!ctx) { reject(new Error('Canvas context unavailable')); return; }

    if (bgColor === 'white') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, targetW, targetH);
    } else if (bgColor === 'black') {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, targetW, targetH);
    }
    // transparent: no fill

    // Extract SVG aspect ratio from viewBox or width/height attributes
    let svgAspect = targetW / targetH; // safe fallback
    const vbMatch = svgText.match(/viewBox=["']([^"']+)["']/i);
    if (vbMatch) {
      const parts = vbMatch[1].trim().split(/[\s,]+/).map(Number);
      if (parts.length >= 4 && parts[2] > 0 && parts[3] > 0) svgAspect = parts[2] / parts[3];
    } else {
      const wm = svgText.match(/\bwidth=["']([0-9.]+)/i);
      const hm = svgText.match(/\bheight=["']([0-9.]+)/i);
      if (wm && hm) {
        const sw = parseFloat(wm[1]); const sh = parseFloat(hm[1]);
        if (sw > 0 && sh > 0) svgAspect = sw / sh;
      }
    }

    // Compute draw rectangle — fill available area minus padding, keep SVG aspect ratio
    const padX = targetW * paddingFraction;
    const padY = targetH * paddingFraction;
    const areaW = targetW - 2 * padX;
    const areaH = targetH - 2 * padY;
    const boxAspect = areaW / areaH;
    let drawW: number, drawH: number;
    if (svgAspect > boxAspect) { drawW = areaW; drawH = areaW / svgAspect; }
    else { drawH = areaH; drawW = areaH * svgAspect; }
    const dx = (targetW - drawW) / 2;
    const dy = (targetH - drawH) / 2;

    const img = new Image();
    const svgBlob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    img.onload = () => {
      URL.revokeObjectURL(url);
      ctx.drawImage(img, dx, dy, drawW, drawH);
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('PNG encoding failed'))),
        'image/png', 1.0,
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('SVG render failed')); };
    img.src = url;
  });
}

/** Convert a PNG blob to JPEG. bgFill is used because JPEG has no transparency channel. */
async function pngBlobToJpeg(blob: Blob, quality: number, bgFill: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      canvas.width = img.width; canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = bgFill;
      ctx.fillRect(0, 0, img.width, img.height);
      ctx.drawImage(img, 0, 0);
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('JPEG encoding failed'))),
        'image/jpeg', quality,
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image load failed')); };
    img.src = url;
  });
}

/** Blob → base-64 data URL (needed for jsPDF.addImage). */
function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}

/** Return pixel dimensions of a PNG/JPEG given its data URL. */
function getImageDimensions(dataUrl: string): Promise<{ w: number; h: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ w: img.width, h: img.height });
    img.onerror = () => resolve({ w: 800, h: 600 });
    img.src = dataUrl;
  });
}

/** Convert all non-background content to black (for reports/slides). */
async function applyBlackAtoms(blob: Blob, format: 'png' | 'svg', bgColor: 'white' | 'transparent' | 'black'): Promise<Blob> {
  if (format === 'svg') {
    const text = await blob.text();
    // Replace fill and stroke colors with black. Preserve none/transparent.
    const out = text
      .replace(/fill="(?!none|transparent)([^"]*)"/gi, 'fill="#000000"')
      .replace(/stroke="(?!none|transparent)([^"]*)"/gi, 'stroke="#000000"')
      .replace(/fill:([^;}"\s]+)/g, (_, val) =>
        /none|transparent/i.test(val || '') ? `fill:${val}` : 'fill:#000000'
      )
      .replace(/stroke:([^;}"\s]+)/g, (_, val) =>
        /none|transparent/i.test(val || '') ? `stroke:${val}` : 'stroke:#000000'
      );
    return new Blob([out], { type: 'image/svg+xml' });
  }
  // PNG: replace non-background pixels with black
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
      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const d = data.data;
      const isBg = (i: number) => {
        const a = d[i + 3];
        if (a < 20) return true;
        const r = d[i];
        const g = d[i + 1];
        const b = d[i + 2];
        if (bgColor === 'white') return r > 250 && g > 250 && b > 250;
        if (bgColor === 'black') return r < 5 && g < 5 && b < 5;
        return false;
      };
      for (let i = 0; i < d.length; i += 4) {
        if (!isBg(i)) {
          d[i] = 0;
          d[i + 1] = 0;
          d[i + 2] = 0;
        }
      }
      ctx.putImageData(data, 0, 0);
      canvas.toBlob((b) => (b ? resolve(b) : resolve(blob)), 'image/png', 1.0);
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
  structureData: { molfile?: string; smiles?: string; name?: string; inchiKey?: string }
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
    if (format === 'RXN') {
      if (!ketcher?.getRxn) return { success: false, error: 'Editor not ready' };
      const rxnfile = await ketcher.getRxn?.().catch(() => '');
      if (!rxnfile?.trim()) return { success: false, error: 'No reaction to export. Draw a reaction with arrows on the canvas first.' };
      if (fileHandle) {
        await writeBlobToHandle(fileHandle, new Blob([rxnfile], { type: 'chemical/x-mdl-rxnfile' }));
        return { success: true };
      }
      if (isTauriDesktop()) {
        const { saveFile, writeTextFile } = await import('../tauri/fileOperations');
        const path = await saveFile('Save RXN', `${baseName}.rxn`, [
          { name: 'MDL RXN File', extensions: ['rxn'] },
        ]);
        if (!path) return { success: false, error: 'Save cancelled' };
        await writeTextFile(path, rxnfile);
        return { success: true };
      }
      return { success: true, downloadBlob: new Blob([rxnfile], { type: 'chemical/x-mdl-rxnfile' }), downloadFilename: `${baseName}.rxn` };
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
      return { success: true, downloadBlob: new Blob([inchi], { type: 'text/plain' }), downloadFilename: `${baseName}.txt` };
    }

    if (format === 'InChIKey') {
      // Prefer pre-fetched value from PubChem; fall back to RDKit computation
      let inchiKey: string | null = structureData.inchiKey || null;
      if (!inchiKey && structureData.smiles) {
        const { generateInChIKey } = await import('../chemistry/rdkit');
        inchiKey = await generateInChIKey(structureData.smiles);
      }
      if (!inchiKey) return { success: false, error: 'InChIKey not available — search the structure via PubChem first to fetch it' };
      if (fileHandle) {
        await writeBlobToHandle(fileHandle, new Blob([inchiKey], { type: 'text/plain' }));
        return { success: true };
      }
      if (isTauriDesktop()) {
        const { saveFile, writeTextFile } = await import('../tauri/fileOperations');
        const path = await saveFile('Save InChIKey', `${baseName}.txt`, [
          { name: 'Text File', extensions: ['txt'] },
        ]);
        if (!path) return { success: false, error: 'Save cancelled' };
        await writeTextFile(path, inchiKey);
        return { success: true };
      }
      return { success: true, downloadBlob: new Blob([inchiKey], { type: 'text/plain' }), downloadFilename: `${baseName}.txt` };
    }

    if (format === 'SMARTS') {
      if (!structureData.smiles) return { success: false, error: 'No structure' };
      const { initRDKit } = await import('../chemistry/rdkit');
      const rdkit = await initRDKit();
      if (!rdkit || typeof rdkit.get_mol !== 'function') return { success: false, error: 'RDKit not available' };
      const mol = rdkit.get_mol(structureData.smiles);
      if (!mol || mol.is_valid() === 0) { mol?.delete(); return { success: false, error: 'Invalid structure' }; }
      const smarts = mol.get_smarts();
      mol.delete();
      if (!smarts) return { success: false, error: 'Could not generate SMARTS' };
      if (fileHandle) {
        await writeBlobToHandle(fileHandle, new Blob([smarts], { type: 'text/plain' }));
        return { success: true };
      }
      if (isTauriDesktop()) {
        const { saveFile, writeTextFile } = await import('../tauri/fileOperations');
        const path = await saveFile('Save SMARTS', `${baseName}.sma`, [
          { name: 'SMARTS File', extensions: ['sma', 'txt'] },
        ]);
        if (!path) return { success: false, error: 'Save cancelled' };
        await writeTextFile(path, smarts);
        return { success: true };
      }
      return { success: true, downloadBlob: new Blob([smarts], { type: 'text/plain' }), downloadFilename: `${baseName}.sma` };
    }

    if (format === 'CDX') {
      if (!ketcher) return { success: false, error: 'Editor not ready' };
      const cdxml = ketcher.getCDXml ? await ketcher.getCDXml() : null;
      if (!cdxml?.trim()) return { success: false, error: 'No structure to export. Draw a molecule on the canvas first.' };

      if (isTauriDesktop()) {
        const { getStructureCdxBytes } = await import('../../hooks/useCopyImageToClipboard');
        const cdxBytes = await getStructureCdxBytes(ketcher);
        if (!cdxBytes?.length) return { success: false, error: 'CDX conversion failed. Install: pip install cdx-mol' };
        const blob = new Blob([cdxBytes], { type: 'application/octet-stream' });
        if (fileHandle) {
          await writeBlobToHandle(fileHandle, blob);
          return { success: true };
        }
        const { saveFile } = await import('../tauri/fileOperations');
        const path = await saveFile('Save CDX', `${baseName}.cdx`, [
          { name: 'ChemDraw File', extensions: ['cdx'] },
        ]);
        if (!path) return { success: false, error: 'Save cancelled' };
        const { writeFile } = await import('@tauri-apps/plugin-fs');
        await writeFile(path, cdxBytes);
        return { success: true };
      }

      // Web: call /api/cdxml-to-cdx (Vite proxies to dev server; Vercel serves api/cdxml-to-cdx.py)
      const res = await fetch('/api/cdxml-to-cdx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cdxml: cdxml.trim() }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return { success: false, error: err?.error || `CDX conversion failed (${res.status})` };
      }
      const cdxBlob = await res.blob();
      if (fileHandle) {
        await writeBlobToHandle(fileHandle, cdxBlob);
        return { success: true };
      }
      return { success: true, downloadBlob: cdxBlob, downloadFilename: `${baseName}.cdx` };
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

    // Always fetch SVG from Ketcher for image formats.
    // SVG is vector — we render it onto a canvas at the exact target pixel dimensions, so the
    // browser's own SVG rasterizer draws every line and label at full sharpness.
    // This replaces the old pipeline (Ketcher PNG at screen res → bitmap upscale → blurry).
    const svgGenOpts: Record<string, unknown> = { outputFormat: 'svg' };
    if (backgroundColor === 'transparent') svgGenOpts.backgroundColor = 'transparent';

    let svgRawBlob: Blob;
    try {
      svgRawBlob = await Promise.race([
        ketcher.generateImage(structStr, svgGenOpts),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Image generation took too long')), 30000)
        ),
      ]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return { success: false, error: msg.includes('took too long') ? 'Image generation took too long. Try reducing size or DPI.' : msg };
    }
    if (!svgRawBlob) return { success: false, error: 'Image generation failed' };

    let svgText = await svgRawBlob.text();

    // Apply background and atom-color transforms in SVG space (no quality loss vs. pixel ops)
    if (backgroundColor === 'black') {
      svgText = svgText.replace(/<svg([^>]*)>/, '<svg$1><rect width="100%" height="100%" fill="#000000"/>');
    }
    if (options.blackAtoms) {
      const bb = await applyBlackAtoms(
        new Blob([svgText], { type: 'image/svg+xml' }), 'svg', options.backgroundColor,
      );
      svgText = await bb.text();
    }

    if (format === 'SVG') {
      const svgFinalBlob = new Blob([svgText], { type: 'image/svg+xml' });
      const filename = `${baseName}.svg`;
      if (fileHandle) { await writeBlobToHandle(fileHandle, svgFinalBlob); return { success: true }; }
      if (isTauriDesktop()) {
        const { saveFile, writeTextFile } = await import('../tauri/fileOperations');
        const path = await saveFile('Save SVG', filename, [{ name: 'SVG File', extensions: ['svg'] }]);
        if (!path) return { success: false, error: 'Save cancelled' };
        await writeTextFile(path, svgText);
        return { success: true };
      }
      return { success: true, downloadBlob: svgFinalBlob, downloadFilename: filename };
    }

    // PNG / JPEG / PDF — render SVG onto a canvas at exact target pixel dimensions
    const scale = dpi / 72;
    const outW = Math.min(Math.round(options.width * scale), 7200);
    const outH = Math.min(Math.round(options.height * scale), 7200);

    const hiResPng = await svgToHighResPng(svgText, outW, outH, options.backgroundColor);

    if (format === 'PNG') {
      const filename = `${baseName}.png`;
      if (fileHandle) { await writeBlobToHandle(fileHandle, hiResPng); return { success: true }; }
      if (isTauriDesktop()) {
        const { saveFile } = await import('../tauri/fileOperations');
        const buffer = await hiResPng.arrayBuffer();
        const path = await saveFile('Save PNG', filename, [{ name: 'PNG Image', extensions: ['png'] }]);
        if (!path) return { success: false, error: 'Save cancelled' };
        const { writeFile } = await import('@tauri-apps/plugin-fs');
        await writeFile(path, new Uint8Array(buffer));
        return { success: true };
      }
      return { success: true, downloadBlob: hiResPng, downloadFilename: filename };
    }

    if (format === 'JPEG') {
      const qualityMap: Record<string, number> = { Low: 0.6, Medium: 0.8, High: 0.92, Publication: 0.97 };
      const q = qualityMap[options.quality] ?? 0.92;
      const bgFill = options.backgroundColor === 'black' ? '#000000' : '#ffffff';
      const jpegBlob = await pngBlobToJpeg(hiResPng, q, bgFill);
      const filename = `${baseName}.jpg`;
      if (fileHandle) { await writeBlobToHandle(fileHandle, jpegBlob); return { success: true }; }
      if (isTauriDesktop()) {
        const { saveFile } = await import('../tauri/fileOperations');
        const buffer = await jpegBlob.arrayBuffer();
        const path = await saveFile('Save JPEG', filename, [{ name: 'JPEG Image', extensions: ['jpg', 'jpeg'] }]);
        if (!path) return { success: false, error: 'Save cancelled' };
        const { writeFile } = await import('@tauri-apps/plugin-fs');
        await writeFile(path, new Uint8Array(buffer));
        return { success: true };
      }
      return { success: true, downloadBlob: jpegBlob, downloadFilename: filename };
    }

    if (format === 'PDF') {
      const dataUrl = await blobToDataUrl(hiResPng);
      const imgSize = await getImageDimensions(dataUrl);
      try {
        const { jsPDF } = await import('jspdf');
        const doc = new jsPDF({ unit: 'mm', format: 'a4' });
        const pageW = doc.internal.pageSize.getWidth();
        const pageH = doc.internal.pageSize.getHeight();
        const margin = 20;
        const maxW = pageW - 2 * margin;
        const maxH = pageH - 2 * margin - (options.includeTitle && title ? 15 : 0);
        // Use the actual DPI to convert pixels → mm (consistent with how we built the image)
        let imgW = (imgSize.w / dpi) * 25.4;
        let imgH = (imgSize.h / dpi) * 25.4;
        if (imgW > maxW || imgH > maxH) {
          const s = Math.min(maxW / imgW, maxH / imgH);
          imgW *= s; imgH *= s;
        }
        let y = margin;
        if (options.includeTitle && title) {
          doc.setFontSize(16);
          doc.text(title, margin, y + 5);
          y += 15;
        }
        doc.addImage(dataUrl, 'PNG', margin, y, imgW, imgH);
        const pdfBlob = doc.output('blob');
        const filename = `${baseName}.pdf`;
        if (fileHandle) { await writeBlobToHandle(fileHandle, pdfBlob); return { success: true }; }
        if (isTauriDesktop()) {
          const pdfBytes = doc.output('arraybuffer');
          const { saveFile } = await import('../tauri/fileOperations');
          const path = await saveFile('Save PDF', filename, [{ name: 'PDF Document', extensions: ['pdf'] }]);
          if (!path) return { success: false, error: 'Save cancelled' };
          const { writeFile } = await import('@tauri-apps/plugin-fs');
          await writeFile(path, new Uint8Array(pdfBytes));
          return { success: true };
        }
        return { success: true, downloadBlob: pdfBlob, downloadFilename: filename };
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
