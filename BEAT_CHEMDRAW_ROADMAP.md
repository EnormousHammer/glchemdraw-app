# 🎯 Refined Roadmap: Beating ChemDraw

**Goal:** Surpass ChemDraw Free and approach ChemDraw Professional while staying free and web-based.

---

## ✅ What We Already Have (Verified)

| Feature | Status | Notes |
|---------|--------|-------|
| Search by name → canvas | ✅ | Type "benzene" + Enter, structure loads |
| Template Library | ✅ | 59+ templates: amino acids, sugars, rings, steroids |
| Name-to-Structure | ✅ | Via header search (PubChem + AI fallback) |
| Structure-to-Name | ✅ | Via PubChem lookup |
| Layout & Clean | ✅ | Ctrl+L, Ctrl+Shift+L |
| Export | ✅ | PNG, JPEG, SVG, PDF, MOL, SDF, SMILES, InChI |
| NMR Prediction | ✅ | ¹H, ¹³C, ¹⁵N, ³¹P, ¹⁹F (AI + nmrdb + nmr-predictor) |
| 3D Viewer | ✅ | Ball & Stick, Space-Filling, Wireframe |
| Biopolymer | ✅ | Peptide, RNA, DNA sequences |
| Reaction arrows | ✅ | Via Ketcher + help dialog |
| Stereochemistry | ✅ | Wedge/dash bonds, chiral display |
| PubChem integration | ✅ | Real-time lookup, safety, properties |
| Copy as image | ✅ | Ctrl+C |
| Keyboard shortcuts | ✅ | Documented in shortcuts dialog |

---

## 🔴 Gaps to Beat ChemDraw

### Tier 1: High Impact (Differentiators)

| # | Feature | ChemDraw Has | Effort | Impact |
|---|---------|--------------|--------|--------|
| 1 | **Structure from image** | OCSR (Pro) | Medium | ⭐⭐⭐ |
| 2 | **Batch processing** | Collections | Medium | ⭐⭐⭐ |
| 3 | **Shareable links** | Cloud (paid) | Low | ⭐⭐⭐ |
| 4 | **Literature search** | SciFinder/Reaxys | Medium | ⭐⭐ |

**1. Structure from image (OCSR)**  
- ChemDraw Pro: Upload image → extracts structure  
- **Us:** Add "Upload image → AI/OCSR extracts structure" (GPT-4V or OCSR API)  
- **Why:** ChemDraw Free doesn't have this; strong differentiator.

**2. Batch processing**  
- ChemDraw: Paste multiple structures, batch edit  
- **Us:** Batch SMILES → properties table, batch NMR prediction, batch export (CSV/Excel)  
- **Why:** Researchers need to process many compounds at once.

**3. Shareable links**  
- ChemDraw: Cloud via Signals (paid)  
- **Us:** Add `?smiles=CC(=O)O` or `?cid=241` to URL – load structure on open  
- **Why:** Free collaboration, easy sharing.

**4. Literature search**  
- ChemDraw: SciFinder/Reaxys ($$$)  
- **Us:** "Find papers mentioning this structure" via PubChem literature  

---

### Tier 2: Polish & UX

| # | Feature | ChemDraw Has | Effort | Impact |
|---|---------|--------------|--------|--------|
| 5 | **Shortcut overlay** | `?` | Low | ⭐⭐ |
| 6 | **Safety panel** | Basic | Low | ⭐⭐ |
| 7 | **Reaction prediction prominence** | Manual only | Low | ⭐⭐ |
| 8 | **Fuzzy search** | No | Low | ⭐ |

**5. Shortcut overlay**  
- `?` key opens full shortcut overlay (like VS Code)  
- Many shortcuts exist; make them discoverable.

**6. Safety panel**  
- GHS pictograms, hazard phrases, regulatory (REACH, TSCA) from PubChem  
- Make safety a first-class panel, not just a section.

**7. Reaction prediction**  
- AI Assistant already has "Predict Reactions"  
- **Us:** Add "Predict products" button next to reactant, make it more prominent.

**8. Fuzzy search**  
- Typo tolerance in compound search (e.g. "benzin" → benzene).

---

### Tier 3: ChemDraw Pro Parity (Advanced)

| # | Feature | ChemDraw Pro | Effort | Impact |
|---|---------|--------------|--------|--------|
| 9 | **Mass spec prediction** | ✅ | Medium | ⭐⭐ |
| 10 | **IR prediction** | ✅ | Medium | ⭐ |
| 11 | **Chemical text** | Subscripts, superscripts | Medium | ⭐⭐ |
| 12 | **Curved arrows** | Mechanism drawing | High | ⭐⭐ |

**9. Mass spec**  
- RDKit can calculate m/z; show fragmentation pattern.

**10. IR prediction**  
- Functional group analysis → estimate peaks.

**11. Chemical text**  
- Subscripts (H₂O), superscripts (⁺), reaction condition labels.

**12. Curved arrows**  
- Electron movement for mechanisms (ChemDraw Pro feature).

---

### Tier 4: Long-Term

| # | Feature | Effort | Impact |
|---|---------|--------|--------|
| 13 | Real-time collaboration | High | ⭐⭐ |
| 14 | Mobile-friendly / touch drawing | High | ⭐⭐ |
| 15 | Offline PWA | Medium | ⭐ |
| 16 | Export to Word/PowerPoint | Medium | ⭐ |

---

## 📋 Priority Order (Recommended)

### Phase 1: Quick wins (1–2 weeks)
1. **Shareable links** – `?smiles=` or `?cid=` in URL  
2. **Shortcut overlay** – `?` to show all shortcuts  
3. **Safety panel** – GHS pictograms, regulatory status  

### Phase 2: Differentiators (2–4 weeks)
4. **Structure from image** – Upload or paste → AI/OCSR extracts structure  
5. **Batch NMR** – Paste multiple SMILES → table of predictions  
6. **Reaction prediction** – Make "Predict products" more prominent  

### Phase 3: Professional features (4–8 weeks)
7. **Batch export** – CSV/Excel for multiple structures  
8. **Literature search** – "Find papers mentioning this structure"  
9. **Mass spec prediction** – Via RDKit  

### Phase 4: Long-term
10. Chemical text formatting, curved arrows, collaboration, mobile.

---

## 🏆 Competitive Summary

| Dimension | ChemDraw Free | ChemDraw Pro | GL-ChemDraw (Now) | GL-ChemDraw (After) |
|-----------|---------------|--------------|-------------------|---------------------|
| Price | Free (limited) | $1,000+/yr | **FREE** | **FREE** |
| Platform | Desktop | Desktop | Desktop + Web | Desktop + Web |
| AI NMR | ❌ | ❌ | ✅ | ✅ |
| AI naming | ❌ | ❌ | ✅ | ✅ |
| PubChem | ❌ | Limited | ✅ | ✅ |
| Structure from image | ❌ | ✅ | ❌ | ✅ |
| Batch processing | ❌ | ✅ | ❌ | ✅ |
| Shareable links | ❌ | Paid cloud | ❌ | ✅ |
| Template library | 50+ | 1000+ | 59+ | 59+ |

**Bottom line:** GL-ChemDraw already beats ChemDraw Free on AI, PubChem, and platform. Adding structure-from-image, batch processing, and shareable links would put it ahead of ChemDraw Free and closer to ChemDraw Pro in practice.
