/**
 * Preload nmr-predictor databases in the background.
 * Call early (e.g. on app mount) so first NMR prediction is fast.
 * Databases are cached by the nmr-predictor module - subsequent fetches return immediately.
 */

let preloadPromise: Promise<void> | null = null;

export function preloadNmrPredictor(): void {
  if (preloadPromise) return;
  preloadPromise = (async () => {
    try {
      const { fetchProton, fetchCarbon } = await import('nmr-predictor');
      await Promise.all([fetchProton(), fetchCarbon()]);
      console.log('[NMR] Databases preloaded');
    } catch (e) {
      console.warn('[NMR] Preload failed (will load on first prediction):', e);
    }
  })();
}

export function getNmrPreloadPromise(): Promise<void> | null {
  return preloadPromise;
}
