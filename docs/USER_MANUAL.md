# GlChemDraw User Manual

## Table of Contents
1. [Getting Started](#getting-started)
2. [Interface Overview](#interface-overview)
3. [Drawing Chemical Structures](#drawing-chemical-structures)
4. [PubChem Integration](#pubchem-integration)
5. [Validation & Analysis](#validation--analysis)
6. [Batch Processing](#batch-processing)
7. [File Operations](#file-operations)
8. [Keyboard Shortcuts](#keyboard-shortcuts)
9. [Troubleshooting](#troubleshooting)

## Getting Started

### System Requirements
- **Operating System**: Windows 10/11 (64-bit)
- **Memory**: 4GB RAM minimum (8GB recommended)
- **Disk Space**: 500MB free space
- **Internet**: Optional (required for PubChem features)

### Installation
1. Download `GlChemDraw-Setup.msi` from your distribution source
2. Double-click the installer
3. Follow the installation wizard
4. Launch GlChemDraw from Start Menu or Desktop shortcut

## Interface Overview

### Main Window Layout
The application consists of three main panels:

**Left Panel (60%)**: Chemical Structure Editor
- Drawing canvas
- Drawing tools toolbar
- Structure validation panel

**Right Panel (40%)**:
- PubChem Search (15%)
- Compound Information / Molecular Properties (85%)

### Toolbar
- **New**: Clear canvas and start fresh
- **Open**: Load MOL/SDF files
- **Save**: Save current structure
- **Batch Import/Export**: Process multiple structures
- **Undo/Redo**: Navigate drawing history
- **Clear**: Remove all atoms/bonds
- **Dark Mode Toggle**: Switch color themes

## Drawing Chemical Structures

### Basic Drawing
1. Select an atom from the periodic table
2. Click on canvas to place atom
3. Click and drag to create bonds
4. Right-click for context menu options

### Bond Types
- **Single Bond**: Click once
- **Double Bond**: Click twice on same bond
- **Triple Bond**: Click three times
- **Wedge/Dash**: Select from bond menu

### Validation Feedback
The validation panel shows real-time feedback:
- ✅ **Valid Structure**: Green checkmark
- ❌ **Invalid Structure**: Red error icon
- ⚠️ **Warnings**: Yellow warning icon

**Validation Checks:**
- Valence errors
- Unbalanced brackets (in SMILES)
- Undefined stereocenters
- Radical electrons
- Net charge warnings

## PubChem Integration

### Automatic Compound Recognition
When you draw a structure, GlChemDraw automatically searches PubChem after 1.5 seconds of inactivity.

**If found, displays:**
- IUPAC Name
- Molecular Formula & Weight
- CAS Registry Number
- 40+ chemical properties
- 3D structure viewer

### Manual Search
1. Enter compound name or CAS number in search box
2. Press Enter or click Search
3. View results in compound information panel

### Copy Features
- **Copy Individual Properties**: Click copy icon next to any property
- **Copy All (Per Section)**: Use "Copy All" button for entire sections
- **Sections include**:
  - Basic Information
  - Physical Properties
  - 3D Descriptors
  - Pharmacology Data

## Validation & Analysis

### Real-time Structure Validation
Displays in the validation panel:

**Molecular Formula**: Live update as you draw  
**Stereochemistry**: Shows defined/undefined stereocenters  
**Errors**: Valence problems, syntax errors  
**Warnings**: Radical electrons, net charge, undefined stereo  

### Molecular Properties
When no PubChem match is found, displays calculated properties:
- Molecular Weight
- LogP (estimated)
- H-Bond Donors/Acceptors
- TPSA
- Rotatable Bonds
- Ring Count

## Batch Processing

### Batch Import
1. Click **Batch Import** button in toolbar
2. Select SDF file containing multiple structures
3. View import progress
4. Review imported structures list

### Batch Export
1. Have structures loaded in memory
2. Click **Batch Export** button
3. Choose export location
4. Saves all structures to single SDF file

### Bulk PubChem Lookup
1. Import SDF file with multiple structures
2. System automatically performs bulk lookup
3. View progress bar (5 requests/second rate limit)
4. Cancel anytime if needed

### CSV/Excel Export
1. After bulk lookup, use Export Results
2. Exports all compound data to CSV
3. 40+ properties per compound
4. Excel-compatible format (UTF-8 BOM)

## File Operations

### Supported Formats
**Import:**
- MOL files (.mol)
- SDF files (.sdf, .sd)
- SMILES files (.smi, .smiles)

**Export:**
- MOL files (.mol)
- SDF files (.sdf)
- CSV files (.csv)

### File Size Limits
- **Maximum**: 10MB per file
- **Warning**: Files over 8MB show warning
- **Batch**: Up to 1000 structures per SDF

### Recent Files
Access recently opened files from File menu (last 10 files).

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| New | Ctrl+N |
| Open | Ctrl+O |
| Save | Ctrl+S |
| Undo | Ctrl+Z |
| Redo | Ctrl+Y |
| Clear | Ctrl+L |
| Copy | Ctrl+C |
| Paste | Ctrl+V |
| Select All | Ctrl+A |
| Dark Mode | Ctrl+D |

## Troubleshooting

### Application Won't Start
1. Verify Windows 10/11 64-bit
2. Check antivirus isn't blocking
3. Run as Administrator
4. Reinstall if corrupted

### Structure Not Recognized
- Ensure structure is chemically valid
- Check for valence errors
- Try simplifying complex structures
- Wait 1.5s for auto-search to trigger

### PubChem Search Fails
- Check internet connection
- Verify firewall allows HTTPS
- PubChem may be temporarily down
- Try manual search with CAS number

### Batch Import Errors
- Verify SDF format is correct
- Check file isn't corrupted
- Ensure file size is under 10MB
- Look at error log in batch dialog

### Performance Issues
- Close other heavy applications
- Reduce structure complexity
- Clear browser cache (localStorage)
- Restart application

### Error Logs
Located at: `%APPDATA%/glchemdraw/logs/`

Error logs stored in localStorage (last 10 errors):
- Open DevTools (F12)
- Application tab → Local Storage
- Key: `glchemdraw_error_logs`

---

## Getting Help

**Support**: support@glchemtec.com  
**Documentation**: https://docs.glchemtec.com  
**GitHub Issues**: https://github.com/glchemtec/glchemdraw  

**Version**: 0.1.0  
**Last Updated**: January 2025

