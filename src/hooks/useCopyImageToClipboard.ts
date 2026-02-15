/**
 * Intercepts Ctrl+C in Ketcher canvas and copies structure as image.
 * Uses Tauri's native writeImage when in Tauri (WebView clipboard doesn't support images).
 */

import { useEffect, useRef, useCallback } from 'react';
import { KetSerializer } from 'ketcher-core';

const isTauri = typeof window !== 'undefined' && '__TAURI__' in window;

export function useCopyImageToClipboard(ketcherRef: React.RefObject<any>) {

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
        // No selection: use full canvas (getKet returns entire structure)
        structStr = await ketcher.getKet();
        if (!structStr?.trim()) return;
      }

      const blob = await ketcher.generateImage(structStr, {
        outputFormat: 'png',
        backgroundColor: '255, 255, 255',
      });

      if (isTauri) {
        const { writeImage } = await import('@tauri-apps/plugin-clipboard-manager');
        const buffer = await blob.arrayBuffer();
        await writeImage(new Uint8Array(buffer));
      } else {
        await navigator.clipboard.write([
          new ClipboardItem({ [blob.type]: blob }),
        ]);
      }
    } catch (err) {
      console.error('[useCopyImageToClipboard] Failed:', err);
    }
  }, [ketcherRef]);

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
