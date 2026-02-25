# Ketcher Export & Clipboard Capabilities

**Purpose:** Document what Ketcher can export, for FindMolecule clipboard integration.

---

## 1. Ketcher Direct API (ketcher instance)

| Method | Returns | Use |
|--------|---------|-----|
| `getMolfile()` | `Promise<string>` | MOL V2000/V3000 |
| `getSmiles()` | `Promise<string>` | SMILES |
| `getExtendedSmiles()` | `Promise<string>` | Extended SMILES |
| `getCDXml()` | `Promise<string>` | CDXML (ChemDraw XML text) |
| `getCDX()` | `Promise<string>` | CDX (likely base64) |
| `getSdf()` | `Promise<string>` | SDF |
| `getRxn()` | `Promise<string>` | RXN (reaction) |
| `getKet()` | `Promise<string>` | Ketcher native KET format |
| `getCml()` | `Promise<string>` | CML |
| `getSmarts()` | `Promise<string>` | SMARTS |
| `getInchi()` | `Promise<string>` | InChI |
| `getInChIKey()` | `Promise<string>` | InChI Key |
| `getFasta()` | `Promise<string>` | FASTA (peptides) |
| `getSequence()` | `Promise<string>` | 1-letter or 3-letter sequence |
| `getIdt()` | `Promise<string>` | IDT format |
| `getAxoLabs()` | `Promise<string>` | AxoLabs format |
| `getRdf()` | `Promise<string>` | RDF |
| `generateImage(data, options)` | `Promise<Blob>` | PNG or SVG |

---

## 2. getStructure (ketcher-core) – Selection-Aware Export

```ts
import { getStructure, SupportedFormat } from 'ketcher-core';

const str = await getStructure(
  ketcher.id,
  ketcher.formatterFactory,
  struct,           // selection or full canvas
  SupportedFormat.xxx
);
```

**SupportedFormat values:**

| Format | Returns | Notes |
|--------|---------|-------|
| `mol`, `molV3000`, `molAuto` | MOL string | molAuto picks V2000/V3000 |
| `rxn`, `rxnV3000` | RXN string | Reactions |
| `smiles`, `smilesExt`, `smarts` | String | |
| `inChI`, `inChIAuxInfo`, `inChIKey` | String | |
| `cml` | CML string | |
| `ket` | KET string | Ketcher native |
| **`cdxml`** | **CDXML string** | ChemDraw XML text |
| **`cdx`** | **Base64 string** | Decode → CDX bytes |
| **`binaryCdx`** | **Base64 string** | Decode → CDX bytes |
| `sdf`, `sdfV3000` | SDF string | |
| `fasta`, `sequence`, `sequence3Letter` | String | Biopolymers |
| `idt`, `axoLabs`, `helm` | String | Biopolymer formats |
| `rdf`, `rdfV3000` | RDF string | |

---

## 3. What We Use Today

| Feature | Ketcher API Used |
|---------|-------------------|
| Copy for FindMolecule (CDX) | `getStructure(..., SupportedFormat.binaryCdx)` or `SupportedFormat.cdx` → base64 decode |
| Copy for FindMolecule (CDXML fallback) | `ketcher.getCDXml()` |
| Ctrl+C (PNG) | `ketcher.getKet()` + `ketcher.generateImage()` |
| MOL for in-app paste | `getStructureMolfile()` → `getStructure(..., molAuto)` or `ketcher.getMolfile()` |
| Save CDXML | `ketcher.getCDXml()` |
| Export MOL/SDF/SMILES | `ketcher.getMolfile()`, `ketcher.getSdf()`, `ketcher.getSmiles()` |

---

## 4. Clipboard-Relevant Formats

| Format | Ketcher Source | Browser Clipboard | Native Clipboard |
|--------|----------------|-------------------|------------------|
| **CDX binary** | getStructure(binaryCdx) → decode | ❌ Cannot set | ✅ Via native host |
| **CDXML text** | getCDXml() | ✅ text/plain | ✅ CF_UNICODETEXT |
| **MOL text** | getMolfile() | ✅ text/plain | ✅ CF_UNICODETEXT |
| **SMILES** | getSmiles() | ✅ text/plain | ✅ CF_UNICODETEXT |
| **PNG** | generateImage() | ✅ image/png | ✅ CF_DIB/CF_BITMAP |

---

## 5. Constraints

- **Browser Clipboard API** supports only: `text/plain`, `text/html`, `image/png`, etc. No custom formats.
- **"ChemDraw Interchange Format"** is a Windows-registered format. Only native code can set it.
- **Ketcher CDX** (binaryCdx/cdx) may not be 100% ChemDraw-compatible. Indigo/Ketcher use their own CDX implementation.

---

## 6. Options for FindMolecule (from Ketcher)

| Option | Ketcher Source | Requires |
|--------|----------------|----------|
| CDX binary (ClipboardWin) | getStructure(binaryCdx) | Extension + native host |
| CDXML text | getCDXml() | Browser clipboard or native host |
| MOL text | getMolfile() | Browser clipboard or native host |
| SMILES URL | getSmiles() | "Send to FindMolecule" (no clipboard) |
| CDXML file | getCDXml() | Save + upload |
