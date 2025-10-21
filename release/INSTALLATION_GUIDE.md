# GlChemDraw Installation Guide

## Quick Installation

### For End Users

1. **Download the installer** from the release package
2. **Choose your preferred installer:**
   - **MSI Installer** (Recommended): `GlChemDraw_0.1.0_x64_en-US.msi`
   - **NSIS Installer**: `GlChemDraw_0.1.0_x64-setup.exe`

3. **Run the installer:**
   - Double-click the downloaded file
   - Follow the installation wizard
   - Choose installation directory (default: `C:\Program Files\GlChemDraw`)

4. **Launch the application:**
   - From Start Menu: Search for "GlChemDraw"
   - From Desktop: Double-click the GlChemDraw icon
   - From Command Line: `C:\Program Files\GlChemDraw\GlChemDraw.exe`

### System Requirements

- **Operating System**: Windows 10 (version 1903) or Windows 11
- **Architecture**: 64-bit (x64)
- **Memory**: 4GB RAM minimum, 8GB recommended
- **Storage**: 500MB free disk space
- **Display**: 1280x800 minimum resolution
- **Internet**: Required for PubChem integration and updates

### Troubleshooting

#### Installation Issues
- **"Windows protected your PC"**: Click "More info" then "Run anyway"
- **"Administrator required"**: Right-click installer and select "Run as administrator"
- **"Antivirus blocking"**: Add GlChemDraw to your antivirus exceptions

#### Runtime Issues
- **"WebView2 not found"**: Install Microsoft Edge WebView2 Runtime
- **"Application won't start"**: Check Windows Event Viewer for error details
- **"Slow performance"**: Ensure hardware acceleration is enabled

#### Uninstallation
1. Go to Windows Settings > Apps
2. Find "GlChemDraw" in the list
3. Click "Uninstall"
4. Follow the uninstallation wizard

### For Developers

#### Building from Source
```bash
# Prerequisites
# - Node.js 18+
# - Rust 1.70+
# - Git

# Clone repository
git clone https://github.com/glchemtec/glchemdraw.git
cd glchemdraw

# Install dependencies
npm install

# Development mode
npm run dev

# Build application
npm run build
npm run tauri build
```

#### Development Requirements
- **Node.js**: 18.0.0 or higher
- **npm**: 8.0.0 or higher
- **Rust**: 1.70.0 or higher
- **Git**: Latest version
- **Visual Studio Build Tools**: For Windows development

### Support

If you encounter any issues during installation:

1. **Check the logs**: Look in `%TEMP%\GlChemDraw\` for error logs
2. **System compatibility**: Ensure your system meets all requirements
3. **Contact support**: Email support@glchemtec.com with:
   - Your Windows version
   - Error messages
   - Installation logs
   - System specifications

### Next Steps

After successful installation:

1. **Read the User Manual**: `USER_MANUAL.md`
2. **Try the tutorials**: Built-in help system
3. **Explore features**: Start with the Getting Started guide
4. **Join the community**: GitHub Discussions for questions and feedback

---

**Happy Chemistry Computing!** 🧪
