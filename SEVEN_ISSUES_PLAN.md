# Plan: Tackling the 7 User-Reported Issues

**Purpose:** Understand what we CAN and CANNOT do before implementation.  
**Last updated:** Based on codebase + Ketcher architecture analysis.

---

## Issue 1: Bottom toolbar disappears when switching molecules ↔ macromolecules mode

### What we know
- The bottom toolbar (ring templates, structure library) is **Ketcher's internal UI**
- Mode switching (molecules ↔ macromolecules) is **Ketcher's built-in feature**
- Our CSS styles `.Ketcher-root [class*="bottom"]` but does not hide it
- Ketcher 3.7.0 unified toolbars; mode switching may have regressions

### Can we fix it?
| Approach | Feasible? | Notes |
|----------|-----------|-------|
| **Our app code** | ❌ No | Toolbar is inside Ketcher; we don't control its visibility |
| **CSS override** | ⚠️ Maybe | Could try forcing `display`/`visibility` when toolbar is missing – fragile, may break on Ketcher updates |
| **Ketcher patch** | ⚠️ Maybe | Could patch ketcher-react if we find the cause; would need to debug Ketcher's mode-switch logic |
| **Report upstream** | ✅ Yes | File issue at [epam/ketcher](https://github.com/epam/ketcher) – likely a Ketcher bug |

### Recommendation
**Report to Ketcher** first. If urgent, try a **CSS workaround** to force the bottom toolbar visible after mode switch (experimental).

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
- Ketcher has **Clean** and **Layout** actions
- **ketcher-standalone** includes `layout()` and `clean()` in `standaloneStructService` (Indigo WASM)
- Known issues: Clean can move molecules to top-left corner; Layout can change R-group definitions
- The Clean button exists in Ketcher's toolbar – user says it "doesn't do much"

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
**Report to Ketcher** first. If they have custom FG definitions, we could try providing corrected ones. Patching Ketcher's label logic is possible but non-trivial.

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
- Copy/paste **within** Ketcher is Ketcher's internal clipboard (Ctrl+C/Ctrl+V for structure data)
- We implemented **copy as image** (Ctrl+C) for pasting into Word – different from in-canvas copy
- Complex structures (e.g. CpU amidite) may hit **Ketcher limits** – size, fragment handling, or clipboard format

### Can we fix it?
| Approach | Feasible? | Notes |
|----------|-----------|-------|
| **Our app code** | ❌ No | In-canvas copy/paste is Ketcher's logic |
| **Ketcher patch** | ⚠️ Maybe | Could investigate if there's a size/complexity limit we can raise |
| **Report upstream** | ✅ Yes | File issue at epam/ketcher with repro (CpU amidite) |

### Recommendation
**Report to Ketcher** with a reproducible example. We cannot fix Ketcher's internal copy/paste from our app. Note: Our Ctrl+C **image** copy is separate and works for pasting into Word.

---

## Issue 7: Align selected figures (ChemDraw-style)

### What we know
- **ChemDraw** has explicit align tools (left, right, top, bottom, center)
- **Ketcher** has `MonomersAlignment` (horizontal/vertical) for **macromolecules** – not general structure alignment
- **Ketcher** has `fromDescriptorsAlign` in ketcher-core – may align descriptors, not arbitrary structures
- No direct "align selected structures" like ChemDraw in Ketcher's public API

### Can we fix it?
| Approach | Feasible? | Notes |
|----------|-----------|-------|
| **Our app code** | ⚠️ Maybe | Could compute bounding boxes of selected structures and move them – would need Ketcher API to move/transform |
| **Ketcher API** | ⚠️ Unknown | Need to check if Ketcher exposes move/transform operations we can call |
| **Feature request** | ✅ Yes | Request upstream – this is a significant ChemDraw feature Ketcher lacks |

### Recommendation
**Report as feature request** to Ketcher. We could **explore** a custom implementation (move selected structures to align) if Ketcher exposes the right APIs – would need investigation.

---

## Summary Table

| # | Issue | We can fix? | Best action |
|---|-------|-------------|-------------|
| 1 | Bottom toolbar disappears | ❌ Unlikely | Report to Ketcher; try CSS workaround |
| 2 | Chemical info – selected only | ✅ Yes | Implement selection-aware logic |
| 3 | Clean-up – bond lengths/angles | ⚠️ Limited | Report to Ketcher; try Layout button |
| 4 | Functional groups OMe/MeO | ❌ Unlikely | Report to Ketcher |
| 5 | File formats / FindMolecule | ✅ Yes | Add export formats; document compatibility |
| 6 | Copy/paste within canvas | ❌ No | Report to Ketcher |
| 7 | Align selected figures | ⚠️ Unknown | Report to Ketcher; explore custom API |

---

## Implementation Priority (for what we CAN do)

1. **#2 – Chemical info for selected structure** – ✅ DONE – selection-aware logic wired
2. **#5 – Export formats** – ✅ DONE – MOL, SDF, SMILES export in Chemical Info panel
3. **#3 – Layout button** – Quick experiment if Layout helps
4. **#1 – CSS workaround** – Experimental if user needs it urgently
5. **#7 – Align** – Investigate Ketcher API if time permits

---

## Upstream issues to file

- [ ] Issue 1: Bottom toolbar disappears on mode switch
- [ ] Issue 3: Clean-up doesn't improve bond lengths/angles well
- [ ] Issue 4: Functional groups display wrong order (OMe vs MeO, CN vs NC)
- [ ] Issue 6: Copy/paste fails for complex structures (CpU amidite)
- [ ] Issue 7: Align selected structures (ChemDraw-style)
