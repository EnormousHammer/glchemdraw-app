# Ketcher Capabilities Check (vs ChemDraw Features)

**Date:** February 2025  
**Purpose:** Verify what Ketcher already provides before implementing.

---

## 1. Structure Layout & Clean

| Feature | Ketcher API | GL-ChemDraw Status |
|---------|-------------|-------------------|
| **Layout** | `ketcher.layout()` | ✅ Implemented (Chemical Info panel, Ctrl+Shift+L) |
| **Clean** | `structService.clean()` | ⚠️ Ketcher has it; we use Layout. Clean standardizes/aromatizes. |
| **Toolbar** | `layout`, `clean` in TopToolbarItemVariant | Ketcher UI has both; we expose Layout only |

**Verdict:** Layout ✅. Clean exists in Ketcher but we don't expose it—optional add.

---

## 2. Template Library

| Feature | Ketcher | Details |
|---------|---------|---------|
| **template-common** | ✅ Bottom toolbar | Ring templates (benzene, cyclohexane, etc.) |
| **template-lib** | ✅ Bottom toolbar | Opens Template Dialog; loads from SDF via `initTmplLib(baseUrl)` |
| **Templates source** | Fetched from `baseUrl` (staticResourcesUrl) | Ketcher loads `templates.sdf` or similar from server |
| **Custom templates** | Via `initLib(lib: SdfItem[])` | Can inject custom SDF templates |
| **Amino acids, sugars** | ❌ Not in default Ketcher | Default = rings + user templates. No amino acid/sugar library by default. |

**Verdict:** Ketcher has template-common + template-lib. Custom amino acids/sugars = we add via our own Template Library component (not in Ketcher).

---

## 3. Name-to-Structure

| Feature | Ketcher | GL-ChemDraw |
|---------|---------|-------------|
| **Search by name** | ❌ Not in Ketcher | ✅ Header search (PubChem + AI fallback) |
| **Recognize (OCSR)** | ✅ Ketcher has Recognize button | ✅ We use OcsrStructServiceProvider |

**Verdict:** Name-to-structure is our feature (header search). Ketcher doesn't provide it.

---

## 4. Image Export / High-Res

| Feature | Ketcher API | Options |
|---------|-------------|---------|
| **generateImage** | `ketcher.generateImage(data, options)` | `outputFormat`, `backgroundColor`, `bondThickness` |
| **Indigo options** | Via struct service | `render-bond-length`, `render-image-width/height`, `render-output-format` (png, pdf, svg) |
| **DPI** | No direct DPI | Use `bondThickness` or `render-bond-length` to scale. Higher = larger image = higher effective DPI when printed. |
| **PDF** | Indigo supports `render-output-format: pdf` | May work if passed through struct service options |

**Verdict:** Ketcher supports `bondThickness` for scaling. For 300 DPI: increase bondThickness (e.g. 2–3× default). PDF: try passing `outputFormat` or Indigo options—needs testing.

---

## 5. Summary: What to Implement

| Feature | Ketcher Has? | Action |
|---------|--------------|--------|
| Layout | ✅ | Already done |
| Clean | ✅ | Optional: add Clean button |
| Template-common/lib | ✅ | Ketcher bottom toolbar—already visible |
| Custom templates (amino acids, sugars) | ❌ | **Implement** our TemplateLibrary component |
| Name-to-structure | ❌ (ours) | Already done (header search) |
| High-res export | ⚠️ bondThickness | **Wire** AdvancedExport; pass bondThickness for scaling |
| PDF export | ⚠️ Indigo supports | **Wire** AdvancedExport; test PDF output |

---

## 6. Implementation Plan

1. **Wire AdvancedExport** – Add to Export menu; connect to `ketcher.generateImage()` with `bondThickness` for quality levels (72/150/300/600 DPI equivalent).
2. **Add Template Library** – Our component with amino acids, sugars, common rings (SMILES → addFragment).
3. **Optional: Clean button** – Expose `ketcher.structService.clean()` if easily accessible.
