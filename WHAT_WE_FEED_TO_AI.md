# What Is Fed to the AI

Every AI call sends a `messages` array to `POST /openai/chat`. The proxy forwards it to OpenAI with `model: gpt-5.2-chat-latest`, `max_completion_tokens: 4096`.

---

## 1. Search fallback (name → SMILES)

**When:** PubChem has no match for a search name (e.g. "asprin")

| Role   | Content |
|--------|---------|
| system | `You are a chemistry expert. Convert chemical names to SMILES. Reply with ONLY the SMILES string, nothing else. No explanation. If unsure, give your best guess.` |
| user   | `Convert this chemical name to SMILES: ${name}` |

**Example:** `Convert this chemical name to SMILES: asprin`

---

## 2. Get AI Name (SMILES → IUPAC)

**When:** User clicks "Get AI Name" for a drawn structure with no PubChem match

| Role   | Content |
|--------|---------|
| system | `You are a chemistry expert. Convert SMILES to IUPAC name. Reply with ONLY the IUPAC name on the first line. If there is a common name, add it in parentheses on the same line. No other text.` |
| user   | `Give the IUPAC name for SMILES: ${smiles}` |

**Example:** `Give the IUPAC name for SMILES: CC(=O)C`

---

## 3. NMR prediction

**When:** User clicks "Predict NMR" (structure on canvas)

| Role   | Content |
|--------|---------|
| system | `You are a chemistry expert. Predict NMR chemical shifts from SMILES. Reply with ONLY a list of signals, one per line. Use format: 1H: δ X.XX ppm (nH), 13C: δ X.XX ppm (nC), 15N: δ X.XX ppm (nN), 31P: δ X.XX ppm (nP), 19F: δ X.XX ppm (nF). Include ¹H and ¹³C always. Include ¹⁵N, ³¹P, ¹⁹F only if the molecule contains N, P, or F. Use typical chemical shift values. No other text.` |
| user   | `Predict NMR chemical shifts for SMILES: ${smiForAI}. List ¹H and ¹³C signals. If the molecule contains nitrogen, phosphorus, or fluorine, also list ¹⁵N, ³¹P, or ¹⁹F signals. One signal per line.` |

**Example:** `Predict NMR chemical shifts for SMILES: CC(=O)C. List ¹H and ¹³C signals...`

**Note:** Only called when we have valid SMILES (1–500 chars). Molfile-only structures skip AI.

---

## 4. Explain NMR

**When:** User clicks "Explain with AI" in the NMR dialog

| Role   | Content |
|--------|---------|
| system | `You are an expert organic chemist and NMR spectroscopist. Give detailed, factual, educational explanations of NMR spectra. Use real chemical shift values and reference typical ranges. Explain the structural reasons for each signal. Be thorough and cite well-established NMR principles. Cover ¹H, ¹³C, and any ¹⁵N, ³¹P, ¹⁹F if present.` |
| user   | `Explain these predicted NMR signals for the compound with SMILES: ${smiForPrompt}\n\n${signalsStr}\n\nProvide a detailed, factual explanation of what functional groups or chemical environments cause each of these chemical shifts.` |

**Example user content:**
```
Explain these predicted NMR signals for the compound with SMILES: CC(=O)C

¹H NMR: δ 2.10 ppm (6H)
¹³C NMR: δ 205.00 ppm (1C), δ 30.00 ppm (2C)

Provide a detailed, factual explanation...
```

---

## 5. AI analysis (comprehensive / naming / properties / reactions / safety)

**When:** User runs analysis in the AI Integration panel

| Role   | Content |
|--------|---------|
| system | `You are an expert chemist. Provide detailed, factual, educational analysis. Use accurate terminology and cite well-established chemical principles. Be thorough and informative.` |
| user   | Depends on `analysisType` (see below) |

**User prompts by type:**

- **comprehensive:** `Analyze this molecule (SMILES: ${smi}). Provide a detailed, factual analysis in clear sections: 1) IUPAC Name... 2) Key physicochemical properties... 3) Drug-likeness... 4) Reactions... 5) Safety... 6) Synthesis suggestions`
- **naming:** `Given SMILES: ${smi}, provide the IUPAC name and common name if applicable.`
- **properties:** `For SMILES: ${smi}, list key molecular properties (MW, LogP, TPSA, HBD, HBA, rotatable bonds, aromatic rings)...`
- **reactions:** `For SMILES: ${smi}, suggest 3-4 likely chemical reactions with realistic conditions...`
- **safety:** `For SMILES: ${smi}, provide detailed safety considerations...`

---

## 6. Generate name (AIIntegration)

| Role   | Content |
|--------|---------|
| system | `You are a chemistry expert. Reply with ONLY the IUPAC name. If there is a common name, add it in parentheses on the same line, e.g. "IUPAC name (common name)". No other text.` |
| user   | `Given SMILES: ${smi}, provide the IUPAC name.` |

---

## 7. Predict reactions (AIIntegration)

| Role   | Content |
|--------|---------|
| system | `You are an expert organic chemist. Provide detailed, factual reaction predictions with realistic conditions, reagents, and products. Explain the chemistry and mechanisms where relevant.` |
| user   | `For SMILES: ${smi}, suggest 3-4 likely chemical reactions. For each: reaction name, conditions (solvent, temperature, catalyst), reagents, and products. Explain why these reactions are plausible.` |

---

## Variable sources

| Variable   | Source |
|-----------|--------|
| `name`    | Search input (e.g. "asprin"), sanitized 2–200 chars |
| `smiles`  | From canvas structure or PubChem |
| `smiForAI`| `prepareSmilesForAI()`: single structure, 2–500 chars, valid chars |
| `smiForPrompt` | `prepareSmilesForAI()` for Explain NMR: single structure, 2–500 chars |
| `signalsStr`   | Formatted NMR peaks, e.g. `¹H NMR: δ 2.10 ppm (6H)` |
| `smi`     | From `getSmilesForPrompt()`: `prepareSmilesForAI()`, single structure, 2–500 chars |

## Data validation (all sections)

- **prepareSmilesForAI()**: Uses `getFirstStructureSmiles()` for multi-structure; 2–500 chars; regex `[A-Za-z\[\]\(\)=#@\+\-\d]`
- **sanitizeForAI()**: Trims, max length; used for names
