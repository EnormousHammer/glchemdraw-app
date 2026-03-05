# Fix Plan – All Issues from Comprehensive Test

## 1. Invalid compound search feedback
**Files:** `AppLayout.tsx`
- Add `searchNotFound` state (last failed search query)
- When "Compound not found", set `searchNotFound = name` and show in Chemical Info
- Snackbar: use 6000ms for error/warning "not found" messages (dynamic autoHideDuration)

## 2. Batch NMR progress indicator
**Files:** `BatchNMRDialog.tsx`
- Add `progress: { current: number; total: number }` state
- In loop: `setProgress({ current: i+1, total: lines.length })`
- Display: "Predicting CCO… 1/3" instead of generic "Predicting…"
- Preload: already in App.tsx via `preloadNmrPredictor()` – ensure it's called

## 3. Loading UX
**Files:** `LoadingScreen.tsx`
- Add "Loading chemistry engine…" as secondary text (Ketcher loads after)
- Keep 5s timer; add click-to-skip (already exists)

## 4. CDX export
**Status:** CDX exists (Save as CDX, Copy for FindMolecule). Advanced Export has MOL/SDF.
**Action:** Add CDX to Advanced Export format list for web download (via cdxml-to-cdx API when available). Defer if API not ready on Vercel.

## 5. NMR: faster nmrdb timeout
**Files:** `nmrdb.ts`
- Reduce `AbortSignal.timeout(30_000)` to `15_000` so Vercel fails faster → AI fallback

## 6. Drawing polish
**Files:** `DocumentSettings.tsx`
- Add "Publication" preset: slightly larger bond length (0.22"), cleaner defaults
- Or ensure ChemDraw defaults are applied on first load

## 7. Search on Enter
**Files:** `Toolbar.tsx`
- Change `onKeyPress` to `onKeyDown` (more reliable)
- Ensure `event.key === 'Enter'` triggers search

## 8. Template library hint
**Files:** `TemplateLibraryDialog.tsx`
- Add Tooltip to first template button: "Click to add to canvas"
- Or make subtitle bolder: "Click a template to add it to the canvas"

## 9. AI chip in header
**Status:** AI Assistant button exists and scrolls to `aiSectionRef`. 
**Action:** Add "AI" Chip in header (per rules) that scrolls to AI section – check if missing.
