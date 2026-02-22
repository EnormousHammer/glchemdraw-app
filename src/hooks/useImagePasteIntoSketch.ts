/**
 * Handles pasting images into the Ketcher sketch canvas.
 * - Ctrl+V: intercepts paste when focused on canvas
 * - If clipboard has image: tries OCSR recognition first → structure if recognized, else image
 * - If no image: Ketcher paste (structure data)
 *
 * Ketcher supports images via fromImageCreation(ctab, dataUrl, center, halfSize).
 * OCSR via /api/ocsr (naturalproducts.net) returns SMILES → setMolecule for editable structure.
 */

import { useEffect, useCallback } from 'react';
import { fromImageCreation, Vec2, Scale } from 'ketcher-core';

const isTauri = typeof window !== 'undefined' && '__TAURI__' in window;
const OCSR_API = '/api/ocsr';
const IMAGE_MIMES = ['image/png', 'image/jpeg', 'image/webp'];
const MIN_DIMENSION = 16;

/**
 * Convert Tauri Image (RGBA) to data URL for Ketcher.
 */
async function tauriImageToDataUrl(tauriImage: { rgba: () => Promise<Uint8Array>; size: () => Promise<{ width: number; height: number }> }): Promise<string> {
  const [rgba, size] = await Promise.all([tauriImage.rgba(), tauriImage.size()]);
  const { width, height } = size;
  if (width < MIN_DIMENSION || height < MIN_DIMENSION) {
    throw new Error('Image too small');
  }
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2d not available');
  const imageData = new ImageData(new Uint8ClampedArray(rgba), width, height);
  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL('image/png');
}

/**
 * Get plain text from clipboard (for MOL/SMILES structure paste).
 */
async function getTextFromClipboard(): Promise<string | null> {
  if (isTauri) {
    try {
      const { readText } = await import('@tauri-apps/plugin-clipboard-manager');
      return await readText();
    } catch {
      return null;
    }
  }
  try {
    return await navigator.clipboard.readText();
  } catch {
    return null;
  }
}

/**
 * Get image data URL from clipboard. Returns null if no image.
 */
async function getImageFromClipboard(): Promise<string | null> {
  if (isTauri) {
    try {
      const { readImage } = await import('@tauri-apps/plugin-clipboard-manager');
      const img = await readImage();
      if (!img) return null;
      return await tauriImageToDataUrl(img);
    } catch {
      return null;
    }
  }
  try {
    const items = await navigator.clipboard.read();
    if (!items?.length) return null;
    for (const item of items) {
      if (!(item instanceof ClipboardItem)) continue;
      for (const mime of IMAGE_MIMES) {
        if (!item.types.includes(mime)) continue;
        try {
          const blob = await item.getType(mime);
          if (!blob) continue;
          return await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        } catch {
          continue;
        }
      }
    }
  } catch {
    // Clipboard read denied or no image
  }
  return null;
}

/**
 * Call OCSR API to recognize structure from image. Returns SMILES or null.
 */
async function recognizeImageToStructure(dataUrl: string): Promise<string | null> {
  const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1]! : dataUrl;
  try {
    const res = await fetch(typeof window !== 'undefined' ? window.location.origin + OCSR_API : OCSR_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: base64 }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { struct?: string; smiles?: string };
    const struct = data.struct ?? data.smiles;
    return struct && typeof struct === 'string' ? struct : null;
  } catch {
    return null;
  }
}

/**
 * Add image to Ketcher canvas at view center.
 */
function addImageToCanvas(ketcher: any, dataUrl: string): Promise<boolean> {
  const editor = ketcher?.editor;
  if (!editor?.render?.ctab) return Promise.resolve(false);
  const render = editor.render;
  const options = render.options;

  // Load image to get dimensions
  return new Promise<boolean>((resolve) => {
    const img = new window.Image();
    img.onload = () => {
      try {
        const isValidSize = img.width >= MIN_DIMENSION && img.height >= MIN_DIMENSION;
        if (!isValidSize) {
          resolve(false);
          return;
        }
        const halfSizeCanvas = new Vec2(img.width / 2, img.height / 2);
        const halfSize = Scale.canvasToModel(halfSizeCanvas, options);
        const viewCenter = new Vec2(
          render.viewBox.minX + render.viewBox.width / 2,
          render.viewBox.minY + render.viewBox.height / 2
        );
        const center = Scale.canvasToModel(viewCenter, options);
        const action = fromImageCreation(render.ctab, dataUrl, center, halfSize);
        editor.update(action);
        resolve(true);
      } catch (e) {
        console.error('[useImagePasteIntoSketch] addImageToCanvas failed:', e);
        resolve(false);
      }
    };
    img.onerror = () => resolve(false);
    img.src = dataUrl;
  });
}

export type ImagePasteResult = { success: true; type: 'image' } | { success: true; type: 'structure' } | { success: false };

/** Heuristic: text looks like MOL or SMILES. */
function looksLikeStructure(text: string): boolean {
  const t = text.trim();
  if (!t || t.length > 10000) return false;
  if (t.includes('$$$$') || t.includes('V2000') || t.includes('V3000') || t.includes('M  END')) return true;
  if (t.length < 500 && /^[A-Za-z0-9@\[\]\(\)\.\=\#\-\+\/\\\s\n]+$/.test(t) && !/^\d+$/.test(t)) return true;
  return false;
}

/** Extract text and image from paste event clipboardData (avoids Clipboard API permission). */
async function getFromClipboardData(cd: DataTransfer | null): Promise<{ text: string | null; dataUrl: string | null }> {
  if (!cd) return { text: null, dataUrl: null };
  let text: string | null = cd.getData('text/plain') || cd.getData('text') || null;
  let dataUrl: string | null = null;
  for (const mime of IMAGE_MIMES) {
    const file = Array.from(cd.items || []).find((i) => i.type === mime);
    if (file?.getAsFile) {
      const blob = file.getAsFile();
      if (blob) {
        dataUrl = await new Promise<string>((resolve, reject) => {
          const r = new FileReader();
          r.onload = () => resolve(r.result as string);
          r.onerror = reject;
          r.readAsDataURL(blob);
        });
        break;
      }
    }
  }
  return { text: text?.trim() || null, dataUrl };
}

/**
 * Try to paste from clipboard into Ketcher. ChemDraw-style: structure paste adds to canvas.
 * 1. If clipboard has structure text (MOL/SMILES): add to canvas via addFragment (or setMolecule)
 * 2. If image: try OCSR → structure if recognized, else add as image
 * 3. Else Ketcher paste
 *
 * Pass clipboardData from paste event when available (no permission needed). Otherwise uses Clipboard API.
 */
export async function pasteImageIntoSketch(
  ketcherRef: React.RefObject<any>,
  clipboardData?: DataTransfer | null
): Promise<ImagePasteResult> {
  const ketcher = ketcherRef?.current;
  if (!ketcher) return { success: false };

  let text: string | null;
  let dataUrl: string | null;

  if (clipboardData) {
    const fromEvent = await getFromClipboardData(clipboardData);
    text = fromEvent.text;
    dataUrl = fromEvent.dataUrl;
  } else {
    // Initiate both reads in same tick as user gesture to preserve clipboard permission
    [text, dataUrl] = await Promise.all([getTextFromClipboard(), getImageFromClipboard()]);
  }

  if (text?.trim() && looksLikeStructure(text)) {
    try {
      if (typeof ketcher.addFragment === 'function') {
        await ketcher.addFragment(text.trim());
        return { success: true, type: 'structure' };
      }
      if (typeof ketcher.setMolecule === 'function') {
        await ketcher.setMolecule(text.trim());
        return { success: true, type: 'structure' };
      }
    } catch (err) {
      console.warn('[pasteImageIntoSketch] Structure paste failed:', err);
    }
  }

  if (dataUrl) {
    const smiles = await recognizeImageToStructure(dataUrl);
    if (smiles && typeof ketcher.setMolecule === 'function') {
      try {
        await ketcher.setMolecule(smiles);
        return { success: true, type: 'structure' };
      } catch {
        // Fall through to add as image
      }
    }
    const ok = await addImageToCanvas(ketcher, dataUrl);
    return ok ? { success: true, type: 'image' } : { success: false };
  }
  return { success: false };
}

/**
 * Hook: intercepts paste event when Ketcher is focused.
 * - If clipboard has image: tries OCSR → structure if recognized, else image
 * - If no image: dispatches Ketcher's pasteFromClipboard so structure data is pasted
 */
export function useImagePasteIntoSketch(ketcherRef: React.RefObject<any>) {
  const handlePaste = useCallback(
    async (e: ClipboardEvent) => {
      const target = e.target as HTMLElement;
      if (!target?.closest?.('.Ketcher-root')) return;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      const ketcher = ketcherRef.current;
      if (!ketcher?.editor) return;

      e.preventDefault();
      e.stopPropagation();

      // Use event clipboardData when available (no permission needed)
      const result = await pasteImageIntoSketch(ketcherRef, e.clipboardData);
      if (result.success) {
        return; // image or structure pasted
      }
      // No image/structure: try Ketcher's built-in paste (event or events)
      const editor = ketcher.editor;
      const ev = (editor as any)?.event ?? (editor as any)?.events;
      if (ev?.pasteFromClipboard?.dispatch) {
        ev.pasteFromClipboard.dispatch();
      }
    },
    [ketcherRef]
  );

  useEffect(() => {
    document.addEventListener('paste', handlePaste, true);
    return () => document.removeEventListener('paste', handlePaste, true);
  }, [handlePaste]);
}
