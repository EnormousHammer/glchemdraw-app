# GL-ChemDraw Roadmap: Get Ahead of ChemDraw

**Goal:** Make GL-ChemDraw the preferred choice for chemists.  
**Strategy:** AI-first, free, web-native. Win on features ChemDraw lacks or charges for.

---

## Phase 1: Quick Wins (1–2 weeks)

*Low effort, high impact. Ship fast.*

| # | Task | Impact | Effort | Files |
|---|------|--------|--------|-------|
| 1 | **Chain angle editable** | Drawing matches ChemDraw | Low | DocumentSettings.tsx |
| 2 | **Export presets** | "ACS", "Publication" one-click | Low | AdvancedExport.tsx |
| 3 | **RNX import/export** | Reaction compatibility with FreeChemDraw | Medium | Ketcher, new handlers |
| 4 | **Copy as image (configurable DPI)** | Quick paste to Word/PPT | Low | Export menu |

**Success:** Drawing parity + better export UX.

---

## Phase 2: AI-First (2–4 weeks)

*Double down on what ChemDraw doesn't have.*

| # | Task | Impact | Effort | Notes |
|---|------|--------|--------|-------|
| 1 | **AI default for naming** | When PubChem N/A → auto "Get AI Name" | Low | Already have button; make flow smoother |
| 2 | **AI default for NMR** | When nmrdb fails → auto try AI (no extra click) | Low | nmrdb.ts / NMR dialog |
| 3 | **AI retrosynthesis** | "Suggest synthesis" from target | Medium | New AI endpoint + UI |
| 4 | **Safety summary (AI)** | GHS, hazards, storage from structure | Medium | AI chemistry helpers |

**Success:** "AI Assistant" is the killer feature. Users choose us for AI.

---

## Phase 3: Drawing Polish (3–4 weeks)

*Match ChemDraw feel without copying everything.*

| # | Task | Impact | Effort | Notes |
|---|------|--------|--------|-------|
| 1 | **ACS preset** | Bond 0.18", line 0.006" (ACS style) | Low | DocumentSettings preset |
| 2 | **More templates** | Heterocycles, protecting groups, reagents | Medium | TemplateLibrary data |
| 3 | **Reaction conditions** | Text above/below arrows | Medium | Ketcher reaction API |
| 4 | **Stereochemistry labels** | R/S, CIP when requested | Medium | Ketcher / RDKit |

**Success:** Drawings look publication-ready. No "looks different from ChemDraw" friction.

---

## Phase 4: Collaboration & Sharing (4–6 weeks)

*Web-native advantage.*

| # | Task | Impact | Effort | Notes |
|---|------|--------|--------|-------|
| 1 | **Shareable session URLs** | `?smiles=...` + optional `?edit=1` | Low | Extend existing |
| 2 | **Embeddable widget** | iframe for Notion, Confluence, docs | Medium | New build target |
| 3 | **Real-time collab** | Yjs/CRDT, multiple cursors | High | Major feature |

**Success:** "Share link, edit together" — ChemDraw+ charges for this.

---

## Phase 5: Integrations (ongoing)

*Fit into existing workflows.*

| # | Task | Impact | Effort | Notes |
|---|------|--------|--------|-------|
| 1 | **Structure search (PubChem/ChEMBL)** | Search by structure, not just name | Medium | New API + UI |
| 2 | **ELN paste** | Copy for FindMolecule (done) + others | Low | Document supported ELNs |
| 3 | **Literature from structure** | "Find papers" (done) → improve ranking | Low | literature.ts |

---

## Priority Matrix

```
         HIGH IMPACT
              │
    Phase 2   │   Phase 3
    AI-First  │   Drawing
              │
  ───────────┼───────────
              │
    Phase 1   │   Phase 4
    Quick     │   Collab
    Wins      │
              │
         LOW EFFORT
```

**Recommended order:** Phase 1 → Phase 2 → Phase 3. Phase 4 when ready for a big push.

---

## Metrics to Track

| Metric | Target |
|--------|--------|
| Time to first structure | < 10 s (search or draw) |
| NMR result (any source) | > 95% of requests |
| Export formats | Match ChemDraw (CDX ✓, RNX next) |
| AI usage | > 30% of sessions use AI feature |
| Share link usage | Track `?smiles=` / `?cid=` loads |

---

## Out of Scope (for now)

- Desktop installers (Tauri exists; focus web)
- Mobile native app (web works on tablets)
- ChemDraw file import (CDX export ✓; import later)
- Paid features (stay free)

---

## Next Steps

1. **This week:** Phase 1 items 1–2 (chain angle, export presets)
2. **Next week:** Phase 1 items 3–4 (RNX, copy-as-image)
3. **Then:** Phase 2 AI improvements
4. **Review:** After Phase 2, reassess Phase 3 vs Phase 4
