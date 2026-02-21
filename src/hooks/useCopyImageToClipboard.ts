/**
 * Intercepts Ctrl+C in Ketcher canvas.
 * Copies BOTH image (for Word/PPT) AND structure (MOL) for canvas paste/duplicate.
 * ChemDraw-style: paste within canvas duplicates structure; paste elsewhere gets image.
 */

import { useEffect, useCallback } from 'react';
import { KetSerializer } from 'ketcher-core';

const isTauri = typeof window !== 'undefined' && '__TAURI__' in window;

export interface UseCopyImageToClipboardOptions {
  onCopySuccess?: () => void;
}

async function getStructureMolfile(ketcher: any): Promise<string | null> {
  const struct = ketcher.editor?.structSelected?.();
  if (struct && !struct.isBlank?.()) {
    try {
      const { getStructure } = await import('ketcher-core');
      const { SupportedFormat } = await import('ketcher-core');
      return await getStructure(
        ketcher.id,
        SupportedFormat.molAuto,
        ketcher.formatterFactory,
        struct
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

      const blob = await ketcher.generateImage(structStr, {
        outputFormat: 'png',
        backgroundColor: 'transparent',
      });

      const molfile = await getStructureMolfile(ketcher);

      if (isTauri) {
        const { writeImage, writeText } = await import('@tauri-apps/plugin-clipboard-manager');
        const buffer = await blob.arrayBuffer();
        await writeImage(new Uint8Array(buffer));
        if (molfile?.trim()) {
          await writeText(molfile.trim());
        }
      } else {
        const items: Record<string, Blob> = { [blob.type]: blob };
        if (molfile?.trim()) {
          items['text/plain'] = new Blob([molfile.trim()], { type: 'text/plain' });
        }
        await navigator.clipboard.write([new ClipboardItem(items)]);
      }
      onCopySuccess?.();
    } catch (err) {
      console.error('[useCopyImageToClipboard] Failed:', err);
    }
  }, [ketcherRef, onCopySuccess]);

  useEffect(() => {
    const handler = async (e: KeyboardEvent) => {
      if (!(e.ctrlKey && e.key === 'c' && !e.shiftKey)) return;
      const target = e.target as HTMLElement;
      if (!target.closest?.('.Ketcher-root')) return;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      const ketcher = ketcherRef.current;
      if (!ketcher?.editor) return;

      e.preventDefault();
      e.stopPropagation();
      await copyImage();
    };

    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, [ketcherRef, copyImage]);
}
