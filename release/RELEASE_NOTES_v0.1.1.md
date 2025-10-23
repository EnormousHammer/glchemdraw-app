# GlChemDraw v0.1.1 - React Hooks Fix & Ketcher Loading Improvements

## 🚀 What's New

### 🐛 Bug Fixes
- **Fixed React Hooks Error**: Resolved 'Invalid hook call' errors caused by multiple React instances
- **Fixed Ketcher Infinite Loading**: Implemented dynamic loading and proper state management
- **Enhanced Error Handling**: Added comprehensive error boundaries and fallback mechanisms

### 🔧 Technical Improvements
- **Vite Configuration**: Enhanced React deduplication and dependency resolution
- **Dynamic Imports**: Implemented dynamic loading for ketcher-standalone module
- **Memory Management**: Added proper cleanup and mounted state checks
- **Loading States**: Improved user feedback during component initialization

### 📦 Dependencies
- Updated Vite configuration for better React instance management
- Enhanced ChemCanvas component with robust error handling
- Added fix-react.bat script for development environment setup

### 🎯 Impact
- ✅ Chemical editor now loads properly without infinite loading
- ✅ No more React hooks errors in console
- ✅ Better user experience with proper loading indicators
- ✅ Cross-platform compatibility maintained

### 🛠️ For Developers
- Run `.\fix-react.bat` to clear caches and restart development server
- Check console logs for detailed loading progress
- All React components now use single instance pattern

## 📥 Downloads

### Windows
- **MSI Installer**: `GlChemDraw_0.1.0_x64_en-US.msi` (12.2 MB)
- **NSIS Installer**: `GlChemDraw_0.1.0_x64-setup.exe` (11.1 MB)

### Installation Instructions
1. Download the appropriate installer for your system
2. Run the installer as administrator
3. Follow the installation wizard
4. Launch GlChemDraw from the Start Menu or Desktop shortcut

## 🔄 Migration from v0.1.0
- No data migration required
- All existing projects and settings are preserved
- Improved performance and stability

## 🐛 Known Issues
- Large bundle size due to chemistry libraries (optimization in progress)
- Some RDKit warnings in console (non-critical)

## 📋 System Requirements
- **Windows**: Windows 10/11 (64-bit)
- **Memory**: 4GB RAM minimum, 8GB recommended
- **Storage**: 500MB free space
- **Display**: 1280x800 minimum resolution

---
**Full Changelog**: https://github.com/EnormousHammer/glchemdraw-app/compare/v0.1.0...v0.1.1
