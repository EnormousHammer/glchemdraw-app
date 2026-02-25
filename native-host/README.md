# GL-ChemDraw Native Messaging Host

Puts CDX (ChemDraw binary) on the Windows clipboard in "ChemDraw Interchange Format" for pasting into FindMolecule ELN.

**Uses cdx-mol** to convert Ketcher CDXML → ChemDraw-spec CDX (ClipboardWin compatible).  
Install: `pip install cdx-mol` (install.ps1 does this automatically).

## Install

```powershell
.\install.ps1 -User
```

Requires Python 3 and `pywin32` (`pip install pywin32`). The installer will attempt to install pywin32 if missing.

## Usage

This host is invoked by the GL-ChemDraw Chrome extension. You do not run it directly.
