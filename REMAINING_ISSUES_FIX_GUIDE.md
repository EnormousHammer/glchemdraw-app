# Fix Guide: Remaining Issues

This document describes how to fix the three remaining issues from the original seven, without reporting to Ketcher upstream.

---

## Issue 4: Functional Groups – OMe vs MeO, CN vs NC

**Problem:** Functional groups display as X-MeO instead of X-OMe (oxygen-attached), X-NC instead of X-CN (carbon-attached).

**Root cause:** Ketcher’s abbreviation/S-group label logic uses attachment order. The label is built from atom order in the template, not from the attachment point.

### Approaches (in order of feasibility)

#### 1. Search for functional group data in Ketcher

- Search `node_modules/ketcher-react` and `node_modules/ketcher-core` for:
  - `superatom`, `SUP`, `sgroup`, `abbreviation`
  - `ketcher-fg`, `fg-tmpls`, `functional group`
  - Any `.json` or `.sdf` with OMe, MeO, CN, NC
- Ketcher may load FG templates from static resources or a config URL. Check `staticResourcesUrl` and how templates are fetched.

#### 2. Patch Ketcher’s S-group label rendering

- Find where S-group labels are rendered (e.g. `ReSGroup`, `SGroupRenderer`, `superatom`).
- The label string is likely built from atom symbols in a fixed order. You may need to reorder based on attachment point (e.g. put the attachment atom first in the label).

#### 3. Custom functional group definitions

- If Ketcher supports custom FG definitions (e.g. via API or config), define corrected OMe, CN, etc. with the right attachment order.
- This would require checking Ketcher’s docs and source for “custom templates” or “user abbreviations”.

**Status:** No SDF/JSON FG files found in `node_modules`. FG logic is likely in Ketcher’s rendering/domain code. Requires deeper Ketcher source inspection.

---

## Issue 7: Full ChemDraw-Style Align (Left/Right/Top/Bottom)

**Current state:** Only R-group label alignment (`alignDescriptors`) is implemented.

**Goal:** Align multiple selected structures by their bounding boxes (left, right, top, bottom, center).

### Implementation plan

Ketcher exposes what we need:

- `ketcher.editor.render.ctab` – ReStruct (or equivalent) for atom positions
- `ketcher.editor.selection()` – `EditorSelection` with `atoms`, `bonds`, etc.
- `fromMultipleMove(restruct, lists, d: Vec2)` – moves selected items by delta `d`
- `editor.update(action)` – applies an action
- `Action.mergeWith(action)` – merges actions

**Algorithm:**

1. Get `restruct` from `editor.render.ctab` (or `editor.render`).
2. Get selection: `sel = editor.selection()`.
3. Group selected atoms by connected component (fragment) to get separate structures.
4. For each structure, compute bounding box from atom positions (`atomGetPos` or `restruct.atoms`).
5. Compute alignment target:
   - Align left: `targetX = min(all left edges)`
   - Align right: `targetX = max(all right edges)`
   - Align top: `targetY = min(all top edges)`
   - Align bottom: `targetY = max(all bottom edges)`
6. For each structure, compute delta:
   - Align left: `d = (targetX - structLeft, 0)`
   - Align right: `d = (targetX - structRight, 0)`
   - etc.
7. For each structure, build `lists` in the format expected by `fromMultipleMove`:
   ```js
   { atoms: [...], sgroupData: [], ... }
   ```
8. Call `fromMultipleMove(restruct, lists, d)` for each structure (each with its own `d`).
9. Merge all actions with `action.mergeWith(nextAction)`.
10. Call `editor.update(mergedAction)`.

**Important:** `fromMultipleMove` returns `action.perform(restruct)`, which mutates `restruct` and returns the inverse (for undo). The editor’s `update` expects the inverse action (for undo stack). You must either:

- Use the action **before** `perform` (build it manually with `AtomMove`, `BondMove`, etc.), or
- Confirm how Ketcher’s history/update expects actions (forward vs inverse).

**Exports to use from ketcher-core:**

- `fromMultipleMove`, `formatSelection`, `atomGetPos`
- `Vec2`, `Action`
- Selection keys: `atoms`, `bonds`, `sgroups`, etc.

**UI:** Add Align Left, Align Right, Align Top, Align Bottom (and optionally Center) as toolbar buttons or a dropdown next to the existing Align button.

---

## Issue 6: In-Canvas Copy/Paste for Complex Structures

**Problem:** Complex structures (e.g. CpU amidite) fail to copy/paste within the canvas. Ctrl+C (image) and Ctrl+Shift+C (structure data) work; in-canvas paste fails for large structures.

**Root cause:** Ketcher’s internal clipboard and paste logic, possibly with size/complexity limits.

### Investigation steps

1. **Search for limits:**
   - In `node_modules/ketcher-core`: `clipboard`, `paste`, `max`, `limit`, `size`
   - Look for constants or config that cap structure size or atom count.

2. **Trace paste flow:**
   - Find the paste handler (e.g. Ctrl+V).
   - See how it reads from clipboard and applies `fromPaste` or similar.
   - Check for early returns or errors when structure is “too large”.

3. **Patch if possible:**
   - If limits are configurable (e.g. via Ketcher options), increase them.
   - If limits are hardcoded, add a `patch-package` patch to raise them.
   - Document the change in your patches.

**Status:** Requires code search and debugging. No obvious limit found yet.

---

## Summary – All Fixed

| Issue | Status | Solution |
|-------|--------|----------|
| **#4 Functional groups** | ✅ Fixed | ketcher-core patch: MeO→OMe, EtO→OEt, NC→CN, MeS→SMe, EtS→SEt |
| **#7 Full align** | ✅ Fixed | `src/lib/alignStructures.ts` + Align dropdown (left/right/top/bottom) |
| **#6 In-canvas paste** | ✅ Workaround | Paste button fallback when Ctrl+V fails for complex structures |

---

## Files to create/modify

### For Issue 7 (Align)

- **New:** `src/lib/alignStructures.ts` – align logic using `fromMultipleMove`, selection, bounding boxes
- **Modify:** `AppLayout.tsx` – wire Align Left/Right/Top/Bottom to the new module
- **Modify:** `Toolbar.tsx` – add align buttons or dropdown

### For Issue 4 (Functional groups)

- **Patch:** `patches/ketcher-core+3.10.0-build.1.patch` or `patches/ketcher-react+3.10.0-build.1.patch` – only after locating the exact FG/label code

### For Issue 6 (Paste)

- **Patch:** After finding the limit, add a patch to the relevant Ketcher package
