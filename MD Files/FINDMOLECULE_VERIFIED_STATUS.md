# FindMolecule Integration – Verified Status

**Purpose:** Record what actually works vs what does not. Do not suggest broken options.

---

## ❌ DOES NOT WORK (verified by user testing)

### Send to FindMolecule (URL)
- **URL:** `https://app.findmolecule.com/labBook/index?smiles=CCO`
- **What happens:** Redirects to login; structure never loads
- **Do not suggest this.** User has reported this failure multiple times.

### CDXML paste (text/plain on clipboard)
- **What happens:** FindMolecule does not accept CDXML when pasted from clipboard
- **Do not suggest** "copy CDXML and paste" as a working flow

---

## ✅ WORKS

### Copy for FindMolecule (with full setup) – ONLY working option
- Requires: Chrome extension + native host + cdx-mol + ClipboardWin
- Native host converts CDXML → ChemDraw CDX via cdx-mol
- Puts CDX in "ChemDraw Interchange Format" on clipboard
- User pastes (Ctrl+V) into FindMolecule

---

## ❌ Save CDXML + upload – NOT AVAILABLE

FindMolecule ELN does **not** have file upload for structures. User verified. Do not suggest this.

## Summary for AI/developers

When discussing FindMolecule integration:
- **Never** recommend "Send to FindMolecule" (URL) – it does not work
- **Never** suggest CDXML clipboard paste – it does not work
- **Never** suggest Save CDXML + upload – FindMolecule has no upload for structures
- **Only** option: Copy for FindMolecule (extension + native host + ClipboardWin)
