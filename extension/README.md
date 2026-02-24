# GL-ChemDraw Clipboard Extension for FindMolecule

Copy chemical structures from GL-ChemDraw (browser) to the Windows clipboard for pasting into FindMolecule ELN. Uses the same "ChemDraw Interchange Format" that FindMolecule expects.

## Requirements

- **Chrome** (or Chromium-based browser)
- **Windows** (native host uses Windows clipboard APIs)
- **Python 3** with `pywin32` (for the native host)

## Installation

### 1. Install the native host

From the project root:

```powershell
cd native-host
.\install.ps1 -User
```

The `-User` flag installs for the current user only (no admin needed). Omit it to install system-wide.

### 2. Load the Chrome extension

1. Open Chrome and go to `chrome://extensions`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked**
4. Select the `extension` folder in this project

### 3. Use it

1. Open GL-ChemDraw in Chrome (e.g. your Vercel deployment)
2. Draw or load a structure
3. **Export → Copy for FindMolecule (paste into ELN)**
4. Switch to FindMolecule and paste (Ctrl+V)

## How it works

1. The web app converts CDXML → CDX via the API
2. The extension receives the CDX and forwards it to the native host
3. The native host puts the CDX on the Windows clipboard in "ChemDraw Interchange Format"
4. FindMolecule pastes it like ChemDraw

## Troubleshooting

- **"Extension or native host not installed"** – Run `install.ps1` and ensure the extension is loaded
- **"Install pywin32"** – Run `pip install pywin32`
- **Extension not receiving events** – Ensure you're on a matching URL (vercel.app, localhost). Add your domain to `manifest.json` content_scripts `matches` if needed
