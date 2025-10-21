# GlChemDraw

**Professional Chemistry Structure Drawing & NMR Analysis Software**

[![Build Status](https://github.com/glchemtec/glchemdraw/workflows/CI/badge.svg)](https://github.com/glchemtec/glchemdraw/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)](https://github.com/glchemtec/glchemdraw/releases)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey.svg)](https://github.com/glchemtec/glchemdraw/releases)

GlChemDraw is a modern, cross-platform desktop application for chemical structure drawing and NMR spectroscopy analysis. Built with React, TypeScript, and Tauri, it provides professional-grade tools for chemists, researchers, and students.

## ✨ Features

### 🧪 Chemical Structure Drawing
- **Interactive Molecular Editor**: Intuitive structure drawing with Ketcher integration
- **Real-time Validation**: Automatic structure validation and error detection
- **Multiple Formats**: Support for SMILES, MOL, SDF, and other chemical formats
- **PubChem Integration**: Direct access to PubChem database for compound lookup
- **3D Visualization**: Interactive 3D molecular viewer with conformer analysis

### 📊 NMR Spectroscopy Analysis
- **Advanced NMR Viewer**: Professional NMR spectrum visualization with Nmrium
- **Peak Integration**: Automated and manual peak integration tools
- **Multi-dimensional NMR**: Support for 1D, 2D, and complex NMR experiments
- **Data Import/Export**: Support for various NMR data formats
- **Spectral Analysis**: Advanced tools for spectrum interpretation

### 🔬 Advanced Features
- **Batch Processing**: Import/export multiple structures simultaneously
- **Reaction Editor**: Create and edit chemical reaction schemes
- **Property Calculation**: Molecular descriptors and physical properties
- **Safety Data**: Integrated safety information and hazard classification
- **Export Options**: High-quality image and data export capabilities

### 🎨 User Experience
- **Modern UI**: Clean, intuitive interface built with Material-UI
- **Dark/Light Themes**: Multiple theme options with accessibility support
- **Keyboard Shortcuts**: Comprehensive keyboard navigation
- **Responsive Design**: Optimized for different screen sizes
- **Multi-language Support**: Internationalization ready

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Rust 1.70+ (for Tauri)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/glchemtec/glchemdraw.git
   cd glchemdraw
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run in development mode**
   ```bash
   npm run dev
   ```

4. **Build for production**
   ```bash
   npm run build
   npm run tauri build
   ```

### Pre-built Binaries
Download the latest release from the [Releases page](https://github.com/glchemtec/glchemdraw/releases).

## 📖 Documentation

- [User Manual](docs/USER_MANUAL.md) - Complete user guide
- [Developer Guide](docs/DEVELOPER_GUIDE.md) - Development setup and contribution
- [API Documentation](docs/API.md) - API reference and examples
- [Testing Guide](TESTING.md) - Testing strategies and guidelines
- [Code Signing](CODE_SIGNING.md) - Code signing and security

## 🛠️ Development

### Project Structure
```
glchemdraw/
├── src/                    # Frontend source code
│   ├── components/         # React components
│   ├── lib/               # Utility libraries
│   ├── hooks/             # Custom React hooks
│   └── test/              # Test files
├── src-tauri/             # Tauri backend
├── docs/                  # Documentation
└── dist/                  # Build output
```

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build frontend
- `npm run tauri dev` - Run Tauri development
- `npm run tauri build` - Build desktop application
- `npm run test` - Run unit tests
- `npm run test:e2e` - Run end-to-end tests
- `npm run test:coverage` - Generate test coverage report

### Technology Stack
- **Frontend**: React 18, TypeScript, Material-UI
- **Backend**: Tauri (Rust)
- **Chemistry**: RDKit, Ketcher, Nmrium
- **Testing**: Vitest, Playwright, Testing Library
- **Build**: Vite, Tauri CLI

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

### Code Standards
- TypeScript for type safety
- ESLint and Prettier for code formatting
- Conventional commits for commit messages
- Comprehensive test coverage

## 📋 Roadmap

### Phase 2 (Current)
- ✅ Comprehensive toolbar and menu system
- ✅ Batch import/export functionality
- ✅ 3D structure viewer with PubChem integration
- ✅ Reaction editor with validation
- ✅ Advanced testing suite

### Phase 3 (Planned)
- 🔄 Code signing and security
- 🔄 MSI installer configuration
- 🔄 Auto-update system
- 🔄 Comprehensive documentation
- 🔄 Performance optimizations

### Future Features
- AI-powered structure prediction
- Collaborative editing
- Cloud synchronization
- Plugin system
- Mobile companion app

## 🐛 Bug Reports

Found a bug? Please report it on our [Issues page](https://github.com/glchemtec/glchemdraw/issues).

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [RDKit](https://www.rdkit.org/) - Chemical informatics toolkit
- [Ketcher](https://lifescience.opensource.epam.com/ketcher/) - Chemical structure editor
- [Nmrium](https://www.nmrium.org/) - NMR spectrum viewer
- [PubChem](https://pubchem.ncbi.nlm.nih.gov/) - Chemical database
- [Tauri](https://tauri.app/) - Desktop app framework
- [Material-UI](https://mui.com/) - React component library

## 📞 Support

- 📧 Email: support@glchemtec.com
- 💬 Discussions: [GitHub Discussions](https://github.com/glchemtec/glchemdraw/discussions)
- 🐛 Issues: [GitHub Issues](https://github.com/glchemtec/glchemdraw/issues)
- 📖 Documentation: [Wiki](https://github.com/glchemtec/glchemdraw/wiki)

---

**Made with ❤️ by the GlChemTec Team**

*Professional Chemistry Software for the Modern Era*