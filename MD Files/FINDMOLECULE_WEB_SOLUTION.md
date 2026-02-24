# FindMolecule Integration – Web App Solution

## The Problem

- **GL-ChemDraw is web-based** – runs in browser
- **Browsers cannot produce:** EMF, CDX (binary) – these require native Windows APIs
- **User needs:** Copy structure from GL-ChemDraw → Paste into FindMolecule ELN

---

## What Browsers CAN Do

| Format | Browser Support | Method |
|--------|-----------------|--------|
| **Text** (MOL, SDF, SMILES, CDXML) | ✅ Yes | `navigator.clipboard.writeText()` |
| **PNG image** | ✅ Yes | `navigator.clipboard.write()` with ClipboardItem |
| EMF | ❌ No | Requires native Windows GDI |
| CDX binary | ❌ No | Requires native clipboard format |

---

## Research Findings

### FindMolecule

1. **ChemDraw paste:** FAQ says "small software installation" – format not documented
2. **File import:** FindMolecule supports **CDXML**, SDF, CSV, TSV
3. **ChemDraw workflow:** ChemDraw users copy as **CDXML Text** (Ctrl+D or Edit → Copy As → CDXML Text) and paste into compatible apps

### CDXML

- **XML-based text format** – ChemDraw’s text alternative to binary CDX
- **Works with clipboard** – `writeText(cdxml)` in browser
- **Widely supported** – ChemDraw, Marvin, many ELNs
- **Indigo/Ketcher** – Ketcher has `getCDXml()`, Indigo supports CDXML output

### ChemDraw Web Clipboard Extension

- Chrome extension by Revvity (ChemDraw vendor)
- Uses **native messaging** – requires a native host app
- Copies structures **from** ChemDraw on web pages
- Does **not** help our app put data on clipboard

---

## Solution: Seamless URL (No Clipboard)

### Option 0: Send to FindMolecule (Recommended)

FindMolecule supports SMILES via URL. GL-ChemDraw opens:

```
https://app.findmolecule.com/labBook/index?smiles=CCO
```

(replace `CCO` with the actual SMILES of the drawn molecule)

**Pros:** One-click, no clipboard, no browser security issues  
**Cons:** None

---

## Alternative: CDXML (Works in Browser)

### Option A: Copy CDXML to Clipboard

1. Use `ketcher.getCDXml()` to get CDXML string
2. `navigator.clipboard.writeText(cdxml)`
3. User pastes (Ctrl+V) into FindMolecule

**Pros:** One-click, no file save  
**Cons:** Depends on FindMolecule accepting CDXML paste (likely, since they support ChemDraw)

### Option B: Download CDXML File

1. Use `ketcher.getCDXml()` to get CDXML string
2. Trigger download of `.cdxml` file
3. User uploads file to FindMolecule

**Pros:** FindMolecule explicitly supports CDXML file import – **guaranteed to work**  
**Cons:** Two steps (download + upload)

---

## Implementation

Add to Export menu:

1. **Copy CDXML (FindMolecule)** – clipboard, browser-only
2. **Save CDXML** – download file for upload to FindMolecule

Both use Ketcher’s `getCDXml()` – no native APIs, no Tauri required.
