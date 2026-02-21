# ChemDraw vs GL-ChemDraw — Gap Analysis

**Date:** February 2025  
**Purpose:** Compare GL-ChemDraw to commercial ChemDraw and identify closable gaps.

---

## Executive Summary

| Aspect | ChemDraw Professional | GL-ChemDraw | Gap Closable? |
|--------|------------------------|-------------|---------------|
| Structure drawing | ✅ Full | ✅ Full (Ketcher) | ✅ Parity |
| Name-to-structure | ✅ Built-in | ✅ Via PubChem search | ✅ Parity |
| NMR prediction | ✅ 1H/13C, robust | ⚠️ 1H weak, 13C OK | ⚠️ Partial |
| Layout/Clean | ✅ | ✅ | ✅ Parity |
| Export MOL/SDF/SMILES | ✅ | ✅ | ✅ Parity |
| Biopolymer (Peptide/DNA/RNA) | ✅ FASTA paste | ✅ HELM sequence | ✅ Parity |
| 3D visualization | ✅ On-canvas | ✅ Separate viewer | ✅ Parity |
| Reaction arrows | ✅ | ✅ (Ketcher) | ✅ Parity |
| Structure-to-name | ✅ | ❌ | ⚠️ Possible |
| Custom templates | ✅ Extensive | ⚠️ Ketcher only | ⚠️ Possible |
| High-res export | ✅ 300/600 DPI | ❌ | ⚠️ Possible |
| Price | $$$ | Free | ✅ |

---

## 1. Feature-by-Feature Comparison

### 1.1 Structure Drawing (Core)

| Feature | ChemDraw | GL-ChemDraw | Gap |
|---------|---------|-------------|-----|
| Bond drawing | ✅ | ✅ | None |
| Ring templates | ✅ | ✅ (Ketcher built-in) | None |
| Atom labels | ✅ | ✅ | None |
| Stereochemistry (wedge/dash) | ✅ | ✅ | None |
| R-groups | ✅ | ✅ | None |
| Layout (bond lengths/angles) | ✅ | ✅ Ctrl+L | None |
| Clean (aromatize) | ✅ | ✅ Ctrl+Shift+L | None |

**Verdict:** ✅ Parity — no gap.

---

### 1.2 Name-to-Structure

| Feature | ChemDraw | GL-ChemDraw | Gap |
|---------|----------|-------------|-----|
| IUPAC name | ✅ | ✅ (via PubChem) | None |
| Common name | ✅ | ✅ | None |
| CAS number | ✅ | ✅ | None |
| Drug name | ✅ | ✅ | None |
| SMILES paste | ✅ | ✅ | None |
| InChI paste | ✅ | ✅ | None |

**Verdict:** ✅ Parity — PubChem search covers most use cases.

---

### 1.3 NMR Prediction

| Feature | ChemDraw | GL-ChemDraw | Gap |
|---------|----------|-------------|-----|
| 1H NMR | ✅ Reliable | ⚠️ Often 0 signals (nmr-predictor) | **Large** |
| 13C NMR | ✅ | ✅ Works | **Small** |
| nmrdb.org fallback | N/A | ⚠️ Proxy times out | **Medium** |
| JCAMP-DX export | ✅ | ❌ | **Medium** |
| Coupling constants | ✅ | ❌ | **Medium** |

**Verdict:** ⚠️ **Gap exists.** 1H prediction is the main weakness. Options to close:
  1. **Use nmrdb.org as primary** — requires fixing proxy (page structure changes) or desktop app.
  2. **Add alternative predictor** — e.g. ML-based, or different HOSE DB.
  3. **Link to external** — "Open in NMRium Prediction" button (already considered, user declined).

---

### 1.4 Biopolymer

| Feature | ChemDraw | GL-ChemDraw | Gap |
|---------|----------|-------------|-----|
| Peptide sequence | ✅ FASTA paste | ✅ HELM (MVDG etc.) | ✅ Parity |
| DNA/RNA | ✅ | ✅ | ✅ Parity |
| Macromolecule mode | ✅ | ✅ (Ketcher) | ✅ Parity |
| Structure Library (monomers) | ✅ | ✅ | ✅ Parity |

**Verdict:** ✅ Parity — HELM sequence input works.

---

### 1.5 Export

| Feature | ChemDraw | GL-ChemDraw | Gap |
|---------|----------|-------------|-----|
| MOL | ✅ | ✅ | None |
| SDF | ✅ | ✅ | None |
| SMILES | ✅ | ✅ | None |
| RXN | ✅ | ✅ | None |
| PNG/SVG | ✅ | ✅ | None |
| High-res (300/600 DPI) | ✅ | ❌ | **Medium** |
| PDF report | ✅ | ❌ | **Medium** |

**Verdict:** ⚠️ Basic export parity; high-res and PDF are gaps.

---

### 1.6 Structure-to-Name

| Feature | ChemDraw | GL-ChemDraw | Gap |
|---------|----------|-------------|-----|
| IUPAC name from structure | ✅ | ❌ | **Medium** |
| Common name | ✅ | ❌ | **Medium** |

**Verdict:** ⚠️ **Gap exists.** Could be closed with:
  - OPSIN (open source) via API
  - Chemaxon API (paid)
  - RDKit `MolToSmiles` + lookup (not full IUPAC)

---

### 1.7 3D Visualization

| Feature | ChemDraw | GL-ChemDraw | Gap |
|---------|----------|-------------|-----|
| 3D viewer | ✅ On-canvas | ✅ Separate (3Dmol.js) | ✅ Parity |
| 3D cleanup | ✅ | ❌ | **Small** |
| Conformer generation | ✅ | ❌ | **Medium** |

**Verdict:** ✅ Basic parity; advanced 3D is a gap.

---

### 1.8 Templates & Customization

| Feature | ChemDraw | GL-ChemDraw | Gap |
|---------|----------|-------------|-----|
| Ring templates | ✅ | ✅ (Ketcher) | None |
| Structure Library | ✅ | ✅ | None |
| Custom templates (80+) | ✅ Amino acids, sugars | ❌ | **Medium** |
| User-defined templates | ✅ | ❌ | **Medium** |

**Verdict:** ⚠️ Ketcher templates are sufficient; custom library is a nice-to-have.

---

### 1.9 Reactions

| Feature | ChemDraw | GL-ChemDraw | Gap |
|---------|----------|-------------|-----|
| Reaction arrows | ✅ | ✅ (Ketcher) | None |
| Arrow types | ✅ | ✅ | None |
| Mapping | ✅ | ✅ | None |
| RXN export | ✅ | ✅ | None |

**Verdict:** ✅ Parity.

---

### 1.10 Unique GL-ChemDraw Advantages

| Feature | ChemDraw | GL-ChemDraw |
|---------|----------|-------------|
| PubChem integration | ✅ (Signals) | ✅ Free |
| Dark mode | ✅ (v23) | ✅ |
| Web-based | ❌ | ✅ |
| Free & open source | ❌ | ✅ |
| Cross-platform (Tauri) | ✅ | ✅ |
| Desktop app | ✅ | ✅ |

---

## 2. Test Results Summary (E2E)

| Test Suite | Passed | Failed | Notes |
|------------|--------|--------|-------|
| App | 0 | 4 | Selectors outdated (GlChemDraw vs GL-ChemDraw, Structure Validation) |
| File Operations | 0 | 4 | New/Open/Save buttons may have different labels |
| Search | 1 | 3 | PubChem search works; some tests need selector fixes |
| Validation | 1 | 3 | "Valid Structure" vs "Structure Validation" |
| NMR Prediction | 2 | 0 | ✅ Pass |

**Recommendation:** Update E2E tests to match current UI (e.g. "GL-ChemDraw", "Valid Structure").

---

## 3. Gaps We Can Close (Prioritized)

### High Priority

1. **NMR 1H prediction**
   - Improve nmrdb.org proxy or add alternative backend
   - Or document clearly: "Use desktop app for NMR predictions"

2. **E2E test fixes**
   - Update selectors for app title, validation panel, file buttons
   - Ensures regression detection

### Medium Priority

3. **Structure-to-name (IUPAC)**
   - Add OPSIN or similar API
   - Or link to external tool

4. **High-res export**
   - Add 300/600 DPI PNG, SVG
   - Useful for publications

5. **Custom template library**
   - 80+ templates (amino acids, sugars, etc.)
   - Improves drawing speed

### Low Priority

6. **PDF report export**
   - Combine structure + properties + NMR

7. **3D cleanup / conformer**
   - RDKit or similar

---

## 4. Gaps That Are Hard to Close

- **ChemDraw-level NMR accuracy** — Requires paid/commercial predictor or large trained model
- **Full polymer chemistry** — Average MW, subunit count (ChemDraw Professional)
- **Generic structure library enumeration** — 81-member libraries in seconds

---

## 5. Conclusion

**Can we close the gap?** Yes, for most everyday use cases.

- **Structure drawing:** ✅ Already at parity
- **Name-to-structure:** ✅ Parity
- **NMR:** ⚠️ 13C OK; 1H needs work
- **Export:** ✅ Basic parity; high-res is additive
- **Biopolymer, reactions, 3D:** ✅ Parity

**Recommendation:** Focus on fixing the NMR 1H path (nmrdb proxy or desktop promotion) and updating E2E tests. The remaining gaps (structure-to-name, high-res, custom templates) are incremental improvements.
