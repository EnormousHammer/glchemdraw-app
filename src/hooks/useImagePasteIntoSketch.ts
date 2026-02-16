/**
 * Handles pasting images into the Ketcher sketch canvas.
 * - Ctrl+V: intercepts paste when focused on canvas, adds image if clipboard has one
 * - Can be called from Paste button (user gesture allows clipboard read)
 *
 * Ketcher supports images via fromImageCreation(ctab, dataUrl, center, halfSize).
 * Web: navigator.clipboard.read() for image/png. Tauri: readImage() from plugin.
 */

import { useEffect, useCallback } from 'react';
import { fromImageCreation, Vec2, Scale } from 'ketcher-core';

const isTauri = typeof window !== 'undefined' && '__TAURI__' in window;
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

/**
 * Try to paste image from clipboard into Ketcher. Returns result for UI feedback.
 * Call from Paste button (user gesture) or from Ctrl+V handler.
 */
export async function pasteImageIntoSketch(ketcherRef: React.RefObject<any>): Promise<ImagePasteResult> {
  const ketcher = ketcherRef?.current;
  if (!ketcher) return { success: false };

  const dataUrl = await getImageFromClipboard();
  if (dataUrl) {
    const ok = await addImageToCanvas(ketcher, dataUrl);
    return ok ? { success: true, type: 'image' } : { success: false };
  }
  return { success: false };
}

/**
 * Hook: intercepts paste event when Ketcher is focused.
 * - If clipboard has image: adds image to canvas at view center
 * - If not: dispatches Ketcher's pasteFromClipboard so structure data is pasted
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

      const result = await pasteImageIntoSketch(ketcherRef);
      if (result.success && result.type === 'image') {
        return;
      }
      // No image: let Ketcher paste structure data (clipboard still has content)
      const editor = ketcher.editor;
      if (editor?.events?.pasteFromClipboard?.dispatch) {
        editor.events.pasteFromClipboard.dispatch();
      }
    },
    [ketcherRef]
  );

  useEffect(() => {
    document.addEventListener('paste', handlePaste, true);
    return () => document.removeEventListener('paste', handlePaste, true);
  }, [handlePaste]);
}
