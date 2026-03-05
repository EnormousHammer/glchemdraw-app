# ELN Paste Support

GL-ChemDraw supports copying structures for pasting into Electronic Lab Notebooks (ELNs) and chemistry tools.

## Supported ELNs

| ELN / Tool | Paste Method | Requirements |
|------------|--------------|--------------|
| **FindMolecule** | Copy for FindMolecule → Ctrl+V in FindMolecule | Chrome extension + native host (browser) or desktop app |
| **Microsoft Word / PowerPoint** | Copy as Image (PNG) | Any platform |
| **Other ELNs** | Copy CDXML or MOL | May require manual import; test compatibility |

## FindMolecule (Primary Supported ELN)

**What works:**
- **Export → Copy for FindMolecule (paste into ELN)** — copies ChemDraw-style clipboard (EMF + MOL + CDX on desktop; CDX via extension on browser)
- Paste with **Ctrl+V** (or Cmd+V) into a FindMolecule structure field

**Requirements:**
- **Desktop (Tauri):** Uses native clipboard directly. No extra setup.
- **Browser:** Install the [FindMolecule Chrome extension](https://chromewebstore.google.com/detail/findmolecule/...) and the native host (see `native-host/README.md`).

**What does NOT work (user verified):**
- Send to FindMolecule (URL) — redirects to login, structure never loads
- CDXML paste (text/plain) — FindMolecule does not accept it
- Save CDXML + upload — FindMolecule has no file upload for structures

## Setup

See `native-host/README.md` for installing the native host and extension for browser-based FindMolecule paste.

## Other ELNs

If your ELN accepts MOL or CDXML, try:
- **Export → Copy MOL** — copies MOL format to clipboard
- **Export → Copy CDXML** — copies CDXML (some tools accept this)

Compatibility varies. Test with your specific ELN.
