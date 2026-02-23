/**
 * Intercepts Ctrl+C in Ketcher canvas.
 * Clipboard: image only (PNG, 150 DPI) so Word/PPT gets image.
 * MOL stored separately for canvas paste (exact duplicate).
 */

import { useEffect, useCallback } from 'react';
import { KetSerializer } from 'ketcher-core';
import { setStoredMol, clearStoredMol } from './clipboardStructureStore';
import { cropPngToContent } from '@/lib/export/advancedExport';

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

/** Exported for use by Export menu copy handlers. */
export async function getStructureMolfile(ketcher: any): Promise<string | null> {
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

/** Exported for use by Export menu copy handlers. */
export async function getStructureCdxBytes(ketcher: any): Promise<Uint8Array | null> {
  const struct = ketcher.editor?.structSelected?.();
  const targetStruct = struct && !struct.isBlank?.() ? struct : ketcher.editor?.struct?.();
  if (!targetStruct?.isBlank?.()) {
    try {
      const { getStructure } = await import('ketcher-core');
      const { SupportedFormat } = await import('ketcher-core');
      // binaryCdx or cdx returns base64; decode to bytes for clipboard
      const str = await getStructure(
        ketcher.id,
        ketcher.formatterFactory,
        targetStruct,
        SupportedFormat.binaryCdx
      );
      if (str && typeof str === 'string' && str.length > 0) {
        try {
          const binary = atob(str);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
          return bytes;
        } catch {
          /* not base64, skip */
        }
      }
    } catch {
      try {
        const { getStructure } = await import('ketcher-core');
        const { SupportedFormat } = await import('ketcher-core');
        const str = await getStructure(
          ketcher.id,
          ketcher.formatterFactory,
          targetStruct,
          SupportedFormat.cdx
        );
        if (str && typeof str === 'string' && str.length > 0) {
          try {
            const binary = atob(str);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
            return bytes;
          } catch {
            /* not base64, skip */
          }
        }
      } catch {
        /* ignore */
      }
    }
  }
  return null;
}

/** Get PNG blob for clipboard (scaled, cropped). Exported for Export menu. */
export async function getClipboardPngBlob(ketcher: any): Promise<Blob | null> {
  if (!ketcher?.generateImage) return null;
  try {
    let structStr: string;
    const struct = ketcher.editor?.structSelected?.();
    if (struct && !struct.isBlank?.()) {
      const ketSerializer = new KetSerializer();
      structStr = ketSerializer.serialize(struct);
    } else {
      structStr = await ketcher.getKet();
      if (!structStr?.trim()) return null;
    }
    const rawBlob = await ketcher.generateImage(structStr, { outputFormat: 'png', backgroundColor: 'transparent' });
    const cropped = await cropPngToContent(rawBlob);
    return await scalePngToDpi(cropped, CLIPBOARD_IMAGE_DPI);
  } catch {
    return null;
  }
}

export interface UseCopyImageToClipboardOptions {
  onCopySuccess?: () => void;
}

/** Copy structure as PNG to clipboard. Uses selection if any, else full canvas. */
async function copyStructureAsImage(ketcher: any): Promise<boolean> {
  if (!ketcher?.generateImage) return false;
  try {
    let structStr: string;
    const struct = ketcher.editor?.structSelected?.();
    if (struct && !struct.isBlank?.()) {
      const ketSerializer = new KetSerializer();
      structStr = ketSerializer.serialize(struct);
    } else {
      structStr = await ketcher.getKet();
      if (!structStr?.trim()) return false;
    }
    const rawBlob = await ketcher.generateImage(structStr, { outputFormat: 'png', backgroundColor: 'transparent' });
    const cropped = await cropPngToContent(rawBlob);
    const blob = await scalePngToDpi(cropped, CLIPBOARD_IMAGE_DPI);
    const molfile = await getStructureMolfile(ketcher);
    if (molfile?.trim()) setStoredMol(molfile.trim());
    const cdxBytes = await getStructureCdxBytes(ketcher);
    if (isTauri) {
      // Windows: use ChemDraw-style (EMF + MOL + CDX) for FindMolecule compatibility
      const isWin = typeof navigator !== 'undefined' && /Win/i.test(navigator.platform);
      if (isWin) {
        try {
          const { invoke } = await import('@tauri-apps/api/core');
          const pngBytes = new Uint8Array(await blob.arrayBuffer());
          await invoke('copy_chemdraw_style', {
            pngBytes: Array.from(pngBytes),
            molText: molfile?.trim() ?? '',
            cdxBytes: cdxBytes ? Array.from(cdxBytes) : null,
          });
        } catch (err) {
          console.warn('[copyStructureAsImage] ChemDraw-style failed, fallback to EMF only:', err);
          try {
            const { invoke } = await import('@tauri-apps/api/core');
            const pngBytes = new Uint8Array(await blob.arrayBuffer());
            await invoke('copy_png_as_emf', { pngBytes: Array.from(pngBytes) });
          } catch (err2) {
            console.warn('[copyStructureAsImage] EMF failed, fallback to PNG:', err2);
            const { clear, writeImage } = await import('@tauri-apps/plugin-clipboard-manager');
            await clear();
            await writeImage(new Uint8Array(await blob.arrayBuffer()));
          }
        }
      } else {
        const { clear, writeImage } = await import('@tauri-apps/plugin-clipboard-manager');
        await clear();
        await writeImage(new Uint8Array(await blob.arrayBuffer()));
      }
    } else {
      const pngBlob = blob.type === 'image/png' ? blob : new Blob([await blob.arrayBuffer()], { type: 'image/png' });
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': pngBlob })]);
    }
    return true;
  } catch (err) {
    console.error('[copyStructureAsImage] Failed:', err);
    return false;
  }
}

export function useCopyImageToClipboard(
  ketcherRef: React.RefObject<any>,
  options?: UseCopyImageToClipboardOptions
) {
  const onCopySuccess = options?.onCopySuccess;

  const copyImage = useCallback(async () => {
    const ketcher = ketcherRef.current;
    const ok = await copyStructureAsImage(ketcher);
    if (ok) {
      // Ketcher's copy event may fire after us; re-write image
      setTimeout(() => copyStructureAsImage(ketcher).catch(() => {}), 100);
      setTimeout(() => copyStructureAsImage(ketcher).catch(() => {}), 250);
      onCopySuccess?.();
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
