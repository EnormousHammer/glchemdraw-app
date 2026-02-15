# GL-ChemDraw Conversion Features Guide

## Overview

GL-ChemDraw now includes comprehensive conversion features that were missing from the base Ketcher editor. These features allow you to seamlessly convert between different chemical representations.

## New Features Added

### 1. **Formula to Structure Converter** 🔬

Convert molecular formulas to chemical structures using PubChem database.

**How to Use:**
1. Click the **molecule icon** (🔗) in the toolbar
2. Enter a molecular formula (e.g., `C6H12O6`, `H2O`, `CH4`)
3. Click "Search"
4. Select from matching compounds
5. Click to load structure into canvas

**Features:**
- Searches PubChem database
- Shows multiple matches (up to 10)
- Displays IUPAC names, common names, and properties
- One-click loading into canvas
- Copy SMILES for each result

**Examples:**
- Water: `H2O`
- Glucose: `C6H12O6`
- Ethanol: `C2H6O`
- Benzene: `C6H6`
- Aspirin: `C9H8O4`

---

### 2. **Structure to Name Converter** 📝

Generate IUPAC names and find common names for drawn structures.

**How to Use:**
1. Draw a chemical structure in the canvas
2. Click the **text icon** (T) in the toolbar
3. The tool automatically searches PubChem
4. View IUPAC name, common names, and synonyms
5. Click copy icons to copy any name

**Features:**
- Automatic IUPAC name generation
- Common name identification
- Synonym list (up to 8 displayed)
- Molecular formula and weight display
- PubChem CID reference
- One-click copy for all names

**Note:** Only structures cataloged in PubChem database can be identified. Novel or uncataloged compounds will not be found.

---

### 3. **Name to Structure Search** 🔍

Search for compounds by name and load them into canvas.

**How to Use:**
1. Type compound name in search bar (top of toolbar)
2. Press Enter or click search icon
3. Structure automatically loads into canvas
4. All properties displayed in right panel

**Features:**
- Real-time PubChem search
- Comprehensive compound data
- Safety information
- Molecular descriptors
- Chemical identifiers

**Examples:**
- "aspirin"
- "caffeine"
- "glucose"
- "benzene"
- "acetone"

---

## Feature Comparison

| Feature | Ketcher Base | GL-ChemDraw |
|---------|-------------|-------------|
| Draw structures | ✅ | ✅ |
| Get SMILES | ✅ | ✅ |
| Get InChI | ✅ | ✅ |
| Calculate MW/Formula | ✅ | ✅ Auto |
| Name → Structure | ❌ | ✅ |
| Formula → Structure | ❌ | ✅ |
| Structure → Name | ❌ | ✅ |
| PubChem Integration | ❌ | ✅ |
| Safety Data | ❌ | ✅ |

---

## Toolbar Icons

**Location:** Top toolbar, center-right section

1. **Search Bar** - Name to Structure search
2. **🔗 Molecule Icon** - Formula to Structure converter
3. **T Text Icon** - Structure to Name converter

---

## Technical Details

### Data Source
All conversion features use the **PubChem REST API**:
- Real-time database queries
- No mock data
- Comprehensive chemical information
- CAS numbers and synonyms

### Supported Formats
- **Input:** Molecular formulas, compound names, SMILES
- **Output:** MOL files, SMILES, InChI, IUPAC names

### Limitations
1. **Internet required** - All features require PubChem API access
2. **Known compounds only** - Novel/uncataloged compounds won't be found
3. **Formula ambiguity** - Some formulas match multiple compounds
4. **Database coverage** - Limited to PubChem catalog

---

## Usage Tips

### Formula to Structure
- Use standard element symbols (case-sensitive)
- No spaces in formula (e.g., `H2O` not `H 2 O`)
- Numbers must follow element (e.g., `C6H12` not `C6 H12`)
- Review multiple results carefully

### Structure to Name
- Draw complete, valid structures
- Ensure all bonds are correct
- Check stereochemistry if important
- More complex = longer search time

### Name to Structure
- Try common names first
- Use IUPAC names for better results
- Check synonyms if no match
- CAS numbers also work

---

## Troubleshooting

### "No compound found"
- Check spelling
- Try alternative names
- Verify chemical formula format
- Ensure internet connection

### "Structure not found in PubChem"
- May be novel compound
- Try drawing simpler structure
- Check if structure is valid
- Verify stereochemistry

### "Search failed"
- Check internet connection
- PubChem may be down
- Try again in a few moments
- Check browser console for errors

---

## Examples Walkthrough

### Example 1: Search by Formula
```
Formula: C6H12O6
→ Shows 10 results including glucose, fructose
→ Click glucose
→ Structure loads in canvas
→ View properties in right panel
```

### Example 2: Identify Structure
```
1. Draw benzene ring
2. Click Structure → Name button
3. View result: "benzene"
4. Copy IUPAC name
```

### Example 3: Search by Name
```
Type: "aspirin"
→ Press Enter
→ Structure loads automatically
→ See: 2-acetoxybenzoic acid (IUPAC)
→ Molecular formula: C9H8O4
```

---

## API Integration

All features integrate with:
- `src/lib/pubchem/api.ts` - PubChem API calls
- `src/lib/pubchem/cache.ts` - Caching layer
- `src/lib/chemistry/smilesToMol.ts` - Format conversion

---

## Future Enhancements

Potential future additions:
- [ ] Batch formula conversion
- [ ] Export names list
- [ ] CAS number search
- [ ] InChI/InChIKey search
- [ ] Substructure search
- [ ] Similarity search
- [ ] Offline mode with local database

---

## Support

For issues or questions:
1. Check console logs (F12)
2. Verify PubChem connectivity
3. Review error messages
4. Check network tab for API calls

---

**Last Updated:** November 2025
**Version:** 0.1.1+
**Author:** GL-ChemDraw Development Team

