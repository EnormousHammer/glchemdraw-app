# Feature Ideas: Beating ChemDraw

GL-ChemDraw advantages: **free, web-based, AI-powered**. ChemDraw is paid, desktop, no AI.

## Already Strong vs ChemDraw

| Feature | GL-ChemDraw | ChemDraw |
|---------|-------------|----------|
| Price | Free | Paid subscription |
| Platform | Web (any device) | Desktop only |
| AI NMR prediction | ✅ OpenAI + nmrdb + nmr-predictor | ❌ No AI |
| AI explanation | ✅ Explain NMR with AI | ❌ No |
| AI naming | ✅ When PubChem has no match | ❌ No |
| PubChem integration | ✅ Direct lookup, 3D | Limited |
| Dark mode | ✅ | ✅ |

---

## High-Impact Additions

### 1. **Name → Structure (improve)**
- ChemDraw: Name lookup
- **Us**: Already have it; add batch name input, fuzzy matching, common name aliases

### 2. **Reaction prediction**
- ChemDraw: Manual drawing
- **Us**: AI suggests likely reactions (already in AI Assistant); make it more prominent, add “Predict products” from reactants

### 3. **Structure from image**
- ChemDraw: OCSR (optical structure recognition)
- **Us**: Ketcher supports paste; add “Upload image → extract structure” using AI vision (GPT-4V) or OCSR API

### 4. **Batch processing**
- ChemDraw: Collections for batch edit
- **Us**: Add batch SMILES → properties, batch NMR prediction, batch export (CSV/Excel)

### 5. **Literature search**
- ChemDraw: Limited
- **Us**: “Find papers mentioning this structure” via PubChem literature or semantic search

### 6. **Safety / regulatory**
- ChemDraw: Basic
- **Us**: GHS pictograms, hazard phrases, regulatory lists (REACH, TSCA) from PubChem; make it a first-class panel

### 7. **Collaboration**
- ChemDraw: Cloud via Signals (paid)
- **Us**: Share link to structure (e.g. `?smiles=CC(=O)O`), optional real-time collab (harder)

### 8. **Mobile-friendly**
- ChemDraw: Desktop only
- **Us**: Responsive layout, touch drawing, “draw on phone, analyze on desktop”

### 9. **Keyboard shortcuts**
- ChemDraw: Many shortcuts
- **Us**: Document and expand shortcuts (Layout Ctrl+L, etc.), add shortcut overlay (e.g. `?`)

### 10. **Export options**
- ChemDraw: Word, PowerPoint, PDF
- **Us**: Add “Copy as image” (already?), export to SVG/PNG for slides, “Export to LaTeX” for papers

---

## Quick Wins (low effort, high value)

1. **Shortcut guide** – `?` or Help shows all shortcuts
2. **Copy structure as image** – One-click copy for slides/reports
3. **Shareable links** – URL with SMILES so others can open the same structure
4. **Better empty states** – Clear “Draw here” / “Search by name” prompts
5. **Tooltips** – Every button has a tooltip (many already do)

---

## Medium Effort

1. **Batch NMR** – Paste multiple SMILES, get table of predictions
2. **Structure from image** – Upload or paste image, AI/OCSR extracts structure
3. **Reaction arrows help** – In-app guide (Reactions button exists; expand it)
4. **Safety panel** – GHS, hazards, regulatory status from PubChem

---

## Longer Term

1. **Real-time collaboration** – Multiple users editing same structure
2. **Plugin / extension API** – Community adds tools
3. **Offline mode** – PWA with cached NMR predictor, limited PubChem
4. **Integration** – Export to Word/PowerPoint, or embed in Notion/Confluence
