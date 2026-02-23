/**
 * Intercepts Ctrl+C in Ketcher canvas.
 * Clipboard: image only (PNG, 150 DPI) so Word/PPT gets image.
 * MOL stored separately for canvas paste (exact duplicate).
 */

import { useEffect, useCallback } from 'react';
import { KetSerializer } from 'ketcher-core';
import { setStoredMol, clearStoredMol } from './clipboardStructureStore';

const isTauri = typeof window !== 'undefined' && '__TAURI__' in window;

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

      // Copy image only - Word/PPT gets image; canvas paste uses stored MOL
      if (isTauri) {
        const { clear, writeImage } = await import('@tauri-apps/plugin-clipboard-manager');
        await clear();
        const buffer = await blob.arrayBuffer();
        await writeImage(new Uint8Array(buffer));
      } else {
        await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
      }
      onCopySuccess?.();
    } catch (err) {
      console.error('[useCopyImageToClipboard] Failed:', err);
    }
  }, [ketcherRef, onCopySuccess]);

  useEffect(() => {
    const keydownHandler = async (e: KeyboardEvent) => {
      if (!(e.ctrlKey && e.key === 'c' && !e.shiftKey)) return;
      const target = e.target as HTMLElement;
      const inKetcher = target.closest?.('.Ketcher-root');
      if (!inKetcher || target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        clearStoredMol(); // User copied elsewhere - don't use our stored MOL on paste
        return;
      }

      const ketcher = ketcherRef.current;
      if (!ketcher?.editor) return;

      e.preventDefault();
      e.stopPropagation();
      await copyImage();
    };

    // Block Ketcher's copy event from adding MOL text (runs before Ketcher's handler)
    const copyHandler = (e: ClipboardEvent) => {
      const active = document.activeElement as HTMLElement;
      if (!active?.closest?.('.Ketcher-root')) return;
      if (active?.tagName === 'INPUT' || active?.tagName === 'TEXTAREA') return;
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
