# FindMolecule ELN – Clipboard Format Research

## Summary

**What we implemented:** Copy MOL/SDF to clipboard and Save MOL/SDF file – these were already available via the existing Export menu. We only added menu items that call the same logic.

**What FindMolecule actually needs:** Unknown. Their FAQ says "a small software installation" for ChemDraw copy/paste but does not document which clipboard format that software reads.

**Research findings (confirmed):**
- FindMolecule FAQ: "Can I copy/paste from/to Chemdraw? Yes, you will simply need to make a small software installation." – no format details.
- ChemDraw uses "ChemDraw Interchange Format" (binary CDX) on Windows clipboard – standard registered format.
- Browser Clipboard API cannot set custom formats like "ChemDraw Interchange Format" – only text/plain, image/png, etc.
- CDXML as text/plain on clipboard: **not confirmed** to work for FindMolecule paste. User testing reported it does not work.
- FindMolecule supports CDXML **file import** (upload) – not the same as clipboard paste.

---

## Clipboard Formats Used by Chemical Programs

### ChemDraw (and Marvin/Chemaxon) default copy

From Chemaxon documentation, a standard copy puts multiple formats on the clipboard:

| Format | Type | Use |
|--------|------|-----|
| **CDX** | ChemDraw binary structure | Native ChemDraw format – editable structure |
| **MOL** | MDL Molfile (text) | Universal structure format – editable |
| **EMF** | Enhanced Metafile (Windows only) | Vector image – for Word/PPT, **not** a structure format |
| **PNG** | Raster image | Image only – not editable structure |

### EMF (Enhanced Metafile)

- **What it is:** Windows vector image format (lines, curves, text).
- **Use:** Paste into Word, PowerPoint, etc. as a scalable graphic.
- **Structure import:** EMF is an image. It does **not** carry chemical structure data. To get a structure from EMF you would need chemical OCR (e.g. OSRA, MolScribe).
- **Browser/JS:** Browsers cannot produce EMF. `canvas.toBlob()` supports PNG, JPEG, WebP only. EMF would require native Windows APIs or server-side conversion.

### MOL (Molfile)

- Universal structure format.
- Ketcher already exports MOL.
- Widely supported by ELNs and chemical tools.

### CDX (ChemDraw)

- ChemDraw’s native binary format.
- Ketcher has some CDX support but known compatibility issues with ChemDraw.
- FindMolecule’s "small software" may read CDX from the clipboard (unconfirmed).

---

## FindMolecule ELN – What We Know

1. **FAQ:** "Can I copy/paste from/to Chemdraw? Yes, you will simply need to make a small software installation."
2. **No public docs** on:
   - What that software does
   - Which clipboard formats it reads (CDX, MOL, EMF, etc.)
   - Whether it is a clipboard listener, browser extension, or desktop helper

---

## What Our App Currently Does

| Action | Format | Implementation |
|--------|--------|----------------|
| Ctrl+C | PNG image only | `useCopyImageToClipboard` – MOL stored in memory for in-app paste only |
| Export → MOL | Save .mol file | `handleExport('mol')` |
| Export → SDF | Save .sdf file | `handleExport('sdf')` |
| Export → Copy MOL (FindMolecule) | MOL text to clipboard | **New** – uses `writeTextToClipboard` |
| Export → Copy SDF (FindMolecule) | SDF text to clipboard | **New** – uses `writeTextToClipboard` |

The **new** part is writing MOL/SDF to the clipboard. The existing Export menu only saved files; it did not copy structure data to the clipboard. So Copy MOL/SDF to clipboard is a new behavior.

---

## What Would Be Needed for EMF

1. **EMF is an image format** – not suitable for structure import unless you add OCR.
2. **Browser cannot produce EMF** – would need:
   - Tauri/Electron native code (Windows only), or
   - Server-side conversion (e.g. SVG → EMF), or
   - A third-party library (e.g. Aspose.CAD).
3. **FindMolecule’s software** – unknown if it reads EMF. ChemDraw puts EMF on the clipboard for image paste into Office, not for structure import.

---

## Recommendations

1. **Contact FindMolecule support** – Ask which clipboard formats their ChemDraw software reads (CDX, MOL, SMILES, EMF, etc.).
2. **Test with extension + native host** – Copy MOL to clipboard, install FindMolecule’s software, and try pasting into their ELN.
3. **If MOL is not supported** – Ask about CDX or other formats. Ketcher CDX export exists but has known issues.
4. **EMF** – Treat as an image format. Do not add EMF unless FindMolecule explicitly confirms they use it for structure import.
