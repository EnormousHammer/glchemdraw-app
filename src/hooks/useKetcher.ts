/**N
 * useKetcher Hook
 * Provides methods to interact with Ketcher editor instance
 */

import { useCallback, useRef } from 'react';

export interface KetcherInstance {
  getMolfile: () => Promise<string>;
  setMolecule: (molfile: string) => Promise<void>;
  getSmiles: () => Promise<string>;
  getInchi: () => Promise<string>;
  addFragment: (molfile: string) => Promise<void>;
  editor: {
    clear: () => void;
    undo: () => void;
    redo: () => void;
  };
}

export const useKetcher = () => {
  const ketcherRef = useRef<KetcherInstance | null>(null);

  const setKetcherInstance = useCallback((instance: KetcherInstance) => {
    ketcherRef.current = instance;
  }, []);

  const getMolfile = useCallback(async (): Promise<string | null> => {
    if (!ketcherRef.current) {
      console.warn('[useKetcher] Ketcher instance not initialized');
      return null;
    }

    try {
      return await ketcherRef.current.getMolfile();
    } catch (error) {
      console.error('[useKetcher] Error getting MOL file:', error);
      return null;
    }
  }, []);

  const getSmiles = useCallback(async (): Promise<string | null> => {
    if (!ketcherRef.current) {
      console.warn('[useKetcher] Ketcher instance not initialized');
      return null;
    }

    try {
      return await ketcherRef.current.getSmiles();
    } catch (error) {
      console.error('[useKetcher] Error getting SMILES:', error);
      return null;
    }
  }, []);

  const setMolecule = useCallback(async (molfile: string): Promise<boolean> => {
    if (!ketcherRef.current) {
      console.warn('[useKetcher] Ketcher instance not initialized');
      return false;
    }

    try {
      await ketcherRef.current.setMolecule(molfile);
      return true;
    } catch (error) {
      console.error('[useKetcher] Error setting molecule:', error);
      return false;
    }
  }, []);

  const clearCanvas = useCallback(() => {
    if (!ketcherRef.current) {
      console.warn('[useKetcher] Ketcher instance not initialized');
      return;
    }

    try {
      ketcherRef.current.editor.clear();
    } catch (error) {
      console.error('[useKetcher] Error clearing canvas:', error);
    }
  }, []);

  const undo = useCallback(() => {
    if (!ketcherRef.current) {
      return;
    }

    try {
      ketcherRef.current.editor.undo();
    } catch (error) {
      console.error('[useKetcher] Error undoing:', error);
    }
  }, []);

  const redo = useCallback(() => {
    if (!ketcherRef.current) {
      return;
    }

    try {
      ketcherRef.current.editor.redo();
    } catch (error) {
      console.error('[useKetcher] Error redoing:', error);
    }
  }, []);

  return {
    setKetcherInstance,
    getMolfile,
    getSmiles,
    setMolecule,
    clearCanvas,
    undo,
    redo,
    isInitialized: () => ketcherRef.current !== null,
  };
};

