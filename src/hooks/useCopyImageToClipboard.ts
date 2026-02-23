/**
 * Intercepts Ctrl+C in Ketcher canvas.
 * Clipboard: image only (PNG, 150 DPI) so Word/PPT gets image.
 * MOL stored separately for canvas paste (exact duplicate).
 */

import { useEffect, useCallback } from 'react';
import { KetSerializer } from 'ketcher-core';
import { setStoredMol, clearStoredMol } from './clipboardStructureStore';

const isTauri = typeof window !== 'undefined' && '__TAURI__' in window;

/** Set when we handle Ctrl+C from canvas; copy event handler uses this to block Ketcher. */
let copyingFromCanvas = false;

/** Ketcher generates at 72 DPI. Scale to target DPI for good quality paste elsewhere. */
const CLIPBOARD_IMAGE_DPI = 150;

async function scalePngToDpi(blob: Blob, targetDpi: number): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = targetDpi / 72;
      const outW = Math.round(img.width * scale);
      const outH = Math.round(img.height * scale);
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
      canvas.toBlob((b) => (b ? resolve(b) : resolve(blob)), 'image/png', 1.0);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(blob);
    };
    img.src = url;
  });
}

async function getStructureMolfile(ketcher: any): Promise<string | null> {
  const struct = ketcher.editor?.structSelected?.();
  if (struct && !struct.isBlank?.()) {
    try {
      const { getStructure } = await import('ketcher-core');
      const { SupportedFormat } = await import('ketcher-core');
      return await getStructure(
        ketcher.id,
        ketcher.formatterFactory,
        struct,
        SupportedFormat.molAuto
      );
    } catch {
      return null;
    }
  }
  try {
    return await ketcher.getMolfile();
  } catch {
    return null;
  }
}

export interface UseCopyImageToClipboardOptions {
  onCopySuccess?: () => void;
}

export function useCopyImageToClipboard(
  ketcherRef: React.RefObject<any>,
  options?: UseCopyImageToClipboardOptions
) {
  const onCopySuccess = options?.onCopySuccess;

  const copyImage = useCallback(async () => {
    const ketcher = ketcherRef.current;
    if (!ketcher?.generateImage) return;

    try {
      let structStr: string;
      const struct = ketcher.editor?.structSelected?.();
      if (struct && !struct.isBlank?.()) {
        const ketSerializer = new KetSerializer();
        structStr = ketSerializer.serialize(struct);
      } else {
        structStr = await ketcher.getKet();
        if (!structStr?.trim()) return;
      }

      const rawBlob = await ketcher.generateImage(structStr, {
        outputFormat: 'png',
        backgroundColor: 'transparent',
      });

      // Scale to higher DPI for good quality when pasting into Word, PowerPoint, etc.
      const blob = await scalePngToDpi(rawBlob, CLIPBOARD_IMAGE_DPI);

      const molfile = await getStructureMolfile(ketcher);
      if (molfile?.trim()) {
        setStoredMol(molfile.trim());
      }

      // Copy image - Word/PPT/other apps get image; canvas paste uses stored MOL
      const writeClipboardImage = async () => {
        if (isTauri) {
          const { clear, writeImage } = await import('@tauri-apps/plugin-clipboard-manager');
          await clear();
          const buffer = await blob.arrayBuffer();
          await writeImage(new Uint8Array(buffer));
        } else {
          // Ensure PNG MIME type; add text/html for better Office (Word) compatibility
          const pngBlob = blob.type === 'image/png' ? blob : new Blob([await blob.arrayBuffer()], { type: 'image/png' });
          const items: Record<string, Blob> = { 'image/png': pngBlob };
          try {
            const dataUrl = await new Promise<string>((res, rej) => {
              const r = new FileReader();
              r.onload = () => res(r.result as string);
              r.onerror = rej;
              r.readAsDataURL(pngBlob);
            });
            items['text/html'] = new Blob([`<img src="${dataUrl}" alt="Structure" />`], { type: 'text/html' });
          } catch (_) {
            /* omit HTML if conversion fails */
          }
          try {
            await navigator.clipboard.write([new ClipboardItem(items)]);
          } catch (clipErr) {
            // Fallback: image-only if combined write fails (e.g. large data URL)
            if (Object.keys(items).length > 1) {
              await navigator.clipboard.write([new ClipboardItem({ 'image/png': pngBlob })]);
            } else {
              throw clipErr;
            }
          }
        }
      };
      await writeClipboardImage();
      // Ketcher's copy event may fire after us and overwrite with MOL; re-write image
      setTimeout(() => writeClipboardImage().catch(() => {}), 100);
      setTimeout(() => writeClipboardImage().catch(() => {}), 250);
      onCopySuccess?.();
    } catch (err) {
      console.error('[useCopyImageToClipboard] Failed:', err);
    }
  }, [ketcherRef, onCopySuccess]);

  useEffect(() => {
    const keydownHandler = async (e: KeyboardEvent) => {
      const isCopyImage = (e.ctrlKey && e.key === 'c' && !e.shiftKey) || (e.ctrlKey && e.shiftKey && e.key === 'F');
      if (!isCopyImage) return;
      const target = e.target as HTMLElement;
      const inKetcher = target.closest?.('.Ketcher-root');
      if (!inKetcher || target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        if (!(e.ctrlKey && e.shiftKey && e.key === 'F')) clearStoredMol();
        return;
      }

      const ketcher = ketcherRef.current;
      if (!ketcher?.editor) return;

      copyingFromCanvas = true;
      e.preventDefault();
      e.stopPropagation();
      try {
        await copyImage();
      } finally {
        // Copy event may fire after our write; keep blocking briefly
        setTimeout(() => { copyingFromCanvas = false; }, 100);
      }
    };

    // Block Ketcher's copy event from adding MOL (activeElement often not in Ketcher when canvas focused)
    const copyHandler = (e: ClipboardEvent) => {
      if (!copyingFromCanvas) return;
      e.preventDefault();
      e.stopPropagation();
    };

    window.addEventListener('keydown', keydownHandler, true);
    document.addEventListener('copy', copyHandler, true);
    return () => {
      window.removeEventListener('keydown', keydownHandler, true);
      document.removeEventListener('copy', copyHandler, true);
    };
  }, [ketcherRef, copyImage]);
}
