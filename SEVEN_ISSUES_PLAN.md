# Plan: Tackling the 7 User-Reported Issues

**Purpose:** Understand what we CAN and CANNOT do before implementation.  
**Last updated:** Based on codebase + Ketcher architecture analysis.

---

## Issue 1: Bottom toolbar disappears when switching molecules ↔ macromolecules mode

### What we know
- **Macromolecules mode** uses different UI: monomer library, RNA builder, etc. The ring templates/structure library are for **molecules mode** only – macromolecules don't need them (you work with monomers, not benzene rings).
- **By design**: When in macromolecules mode, the bottom toolbar may be hidden or replaced – that's expected.
- **The bug**: When switching **back** to molecules mode, the toolbar should reappear but doesn't – that's a Ketcher regression.
- Ketcher 3.7.0 unified toolbars; mode switching has known issues (e.g. Layout/Clean removing macromolecules when switching).

### Can we fix it?
| Approach | Feasible? | Notes |
|----------|-----------|-------|
| **Our app code** | ❌ No | Toolbar is inside Ketcher; we don't control its visibility |
| **CSS override** | ⚠️ Maybe | Could try forcing `display`/`visibility` when toolbar is missing – fragile, may break on Ketcher updates |
| **Ketcher patch** | ⚠️ Maybe | Could patch ketcher-react if we find the cause; would need to debug Ketcher's mode-switch logic |
| **Report upstream** | ✅ Yes | File issue at [epam/ketcher](https://github.com/epam/ketcher) – likely a Ketcher bug |

### Recommendation
**CSS workaround implemented** – force `[data-testid="bottom-toolbar"]` visible. No reporting.

---

## Issue 2: Chemical info – show only selected structure, not entire canvas

### What we know
- **We control this.** Our `handleStructureChange` gets `molfile`/`smiles` from `ketcher.getMolfile()` and `ketcher.getSmiles()` – **entire canvas**
- Ketcher exposes `ketcher.editor.structSelected()` – returns the **selected structure only**
- PubChem lookup works when we have SMILES; complex/multi-structure canvases may not match

### Can we fix it?
| Approach | Feasible? | Notes |
|----------|-----------|-------|
| **Use structSelected()** | ✅ Yes | When user has selection, use selected struct's SMILES for PubChem lookup |
| **Fallback to full canvas** | ✅ Yes | When nothing selected, keep current behavior (whole canvas) |
| **Selection change listener** | ✅ Yes | Ketcher has `onSelectionChange` – we can subscribe |

### Recommendation
**We can implement this.** Add selection-aware logic: when something is selected, use `structSelected()` for the chemical info panel; otherwise use full canvas. Requires wiring Ketcher's selection events into our app.

---

## Issue 3: Clean-up – improve bond lengths and angles

### What we know
- **Clean** (Ctrl+Shift+L) = structure standardization (aromatize, normalize) – does **NOT** fix bond lengths/angles.
- **Layout** (Ctrl+L) = 2D coordinate generation – **THIS** fixes bond lengths and angles for good-looking structures.
- User was likely using Clean and expecting geometry fixes – they need **Layout** instead.
- We added a **Layout** button in the Chemical Info panel.

### Can we fix it?
| Approach | Feasible? | Notes |
|----------|-----------|-------|
| **Our app code** | ❌ No | Clean/layout logic is in Ketcher + Indigo |
| **Improve Ketcher call** | ⚠️ Maybe | Could try calling layout/clean with different params if API allows |
| **Expose Layout more prominently** | ✅ Yes | We could add a "Layout" button that calls `ketcher.layout()` – user might be using Clean only |
| **Report upstream** | ✅ Yes | File issue at epam/ketcher or epam/Indigo – known Indigo layout bugs |

### Recommendation
**Report to Ketcher/Indigo** if layout/clean is weak. We can **try** adding a Layout button that calls `ketcher.layout()` – Layout may work better than Clean for some cases. No guarantee we can improve the underlying algorithm.

---

## Issue 4: Functional groups – OMe vs MeO, CN vs NC display

### What we know
- Functional groups (OMe, OEt, CN, etc.) are **Ketcher's abbreviation system**
- Display order (X-MeO vs X-OMe) is controlled by **Ketcher's rendering/label logic**
- Chemically correct: X-OMe (oxygen attached to X), X-CN (carbon attached to X)

### Can we fix it?
| Approach | Feasible? | Notes |
|----------|-----------|-------|
| **Our app code** | ❌ No | Abbreviation display is in Ketcher |
| **Ketcher patch** | ⚠️ Maybe | Would need to find where labels are generated; could be in ketcher-core or data files |
| **Custom functional group definitions** | ⚠️ Maybe | Ketcher may allow custom FG definitions with correct attachment order |
| **Report upstream** | ✅ Yes | File issue at epam/ketcher – this is a chemistry correctness issue |

### Recommendation
**No reporting.** Would require patching ketcher's functional group SDF data or rendering logic – attachment order defines OMe vs MeO. Non-trivial; needs ketcher-fg-tmpls.sdf or similar.

---

## Issue 5: File formats – PNG vs FindMolecule compatibility

### What we know
- **PNG** – Ketcher exports this; good for documents/presentations
- **FindMolecule** – Specific software; need to confirm what formats it accepts
- Standard chemistry formats: **MOL**, **SDF**, **SMILES**, **InChI** – widely supported

### Can we fix it?
| Approach | Feasible? | Notes |
|----------|-----------|-------|
| **Add export formats** | ✅ Yes | Ketcher has `getMolfile()`, `getSmiles()`, etc. – we can add Save As MOL/SDF/SMILES |
| **FindMolecule compatibility** | ⚠️ Unknown | Need to confirm FindMolecule's supported formats (likely MOL, SDF) |
| **Documentation** | ✅ Yes | We can document which formats work where |

### Recommendation
**We can add** more export options (MOL, SDF, SMILES) if not already present. **User** should confirm FindMolecule's supported formats. MOL and SDF are standard and usually work.

---

## Issue 6: Copy/paste within canvas – inconsistent for complex structures

### What we know
- **Copy as image** (Ctrl+C) – ✅ FIXED. Pastes into Word/documents. Uses Tauri clipboard when in desktop.
- **Copy structure data** (Ctrl+Shift+C) – for in-canvas paste. Ketcher's internal clipboard.
- Complex structures (e.g. CpU amidite) may hit **Ketcher limits** for in-canvas paste – that's upstream.

### Can we fix it?
| Approach | Feasible? | Notes |
|----------|-----------|-------|
| **Our app code** | ❌ No | In-canvas copy/paste is Ketcher's logic |
| **Ketcher patch** | ⚠️ Maybe | Could investigate if there's a size/complexity limit we can raise |
| **Report upstream** | ✅ Yes | File issue at epam/ketcher with repro (CpU amidite) |

### Recommendation
**No reporting.** Ctrl+C image copy works. In-canvas paste limits are Ketcher internal – we cannot fix from our app.

---

## Issue 7: Align selected figures (ChemDraw-style)

### What we know
- **ChemDraw** has explicit align tools (left, right, top, bottom, center) for multiple structures.
- **Ketcher** has `alignDescriptors()` – aligns R-group labels (R1, R2, etc.) – we added an Align button for this.
- **Ketcher** has `MonomersAlignment` for macromolecules only – not general small-molecule alignment.
- No ChemDraw-style "align multiple structures" (left/right/top/bottom) in Ketcher's public API – would need custom implementation.

### Can we fix it?
| Approach | Feasible? | Notes |
|----------|-----------|-------|
| **Our app code** | ⚠️ Maybe | Could compute bounding boxes of selected structures and move them – would need Ketcher API to move/transform |
| **Ketcher API** | ⚠️ Unknown | Need to check if Ketcher exposes move/transform operations we can call |
| **Feature request** | ✅ Yes | Request upstream – this is a significant ChemDraw feature Ketcher lacks |

### Recommendation
**No reporting.** Align button for R-groups added. Full structure align would need custom implementation using AtomMove – possible but complex.

---

## Summary Table

| # | Issue | We can fix? | Best action |
|---|-------|-------------|-------------|
| 1 | Bottom toolbar disappears | ✅ CSS workaround | Force bottom-toolbar visible |
| 2 | Chemical info – selected only | ✅ Yes | Implement selection-aware logic |
| 3 | Bond lengths/angles | ✅ Fixed | Use Layout (Ctrl+L), not Clean |
| 4 | Functional groups OMe/MeO | ✅ Patch | ketcher-core patch corrects MeO→OMe, NC→CN, etc. |
| 5 | File formats / FindMolecule | ✅ Yes | Add export formats; document compatibility |
| 6 | Copy image / paste | ✅ Fixed | Ctrl+C = image; Paste button fallback when Ctrl+V fails |
| 7 | Align selected figures | ✅ Full | Align left/right/top/bottom + R-groups |

---

## Implementation Priority (for what we CAN do)

1. **#2 – Chemical info for selected structure** – ✅ DONE – selection-aware logic wired
2. **#5 – Export formats** – ✅ DONE – MOL, SDF, SMILES export in Chemical Info panel
3. **#6 – Copy image** – ✅ DONE – Ctrl+C copies as image (Word), Ctrl+Shift+C copies data
4. **#3 – Layout button** – ✅ DONE – Layout button added (fixes bond lengths/angles; Clean does not)
5. **#7 – Align** – ✅ DONE – Full ChemDraw-style align (left/right/top/bottom) + R-group labels
6. **#1 – Bottom toolbar** – ✅ DONE – CSS workaround forces bottom-toolbar visible

---

## No upstream reporting (per user request)

All fixes done in-app. Issue 4 fixed via ketcher-core patch (MeO→OMe, NC→CN). Issue 6: Paste fallback button added when Ctrl+V fails.
