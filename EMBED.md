# Embedding GL-ChemDraw

Embed GL-ChemDraw in Notion, Confluence, documentation, or any page that supports iframes.

## Quick embed

```html
<iframe
  src="https://your-domain.com/?embed=1"
  width="100%"
  height="600"
  frameborder="0"
  allowfullscreen
  title="GL-ChemDraw Structure Editor"
></iframe>
```

## URL parameters

| Parameter | Description |
|-----------|-------------|
| `embed=1` | Compact UI for iframe embedding |
| `smiles=...` | Load structure from SMILES (e.g. `?smiles=c1ccccc1` for benzene) |
| `cid=...` | Load structure from PubChem CID (e.g. `?cid=241` for benzene) |
| `edit=1` | Editable mode (default when sharing) |
| `edit=0` | View-only mode |

## Examples

**Benzene, editable:**
```
https://your-domain.com/?embed=1&smiles=c1ccccc1&edit=1
```

**PubChem CID 241 (benzene), view-only:**
```
https://your-domain.com/?embed=1&cid=241&edit=0
```

## PostMessage API (parent ↔ iframe)

When embedded, the parent can communicate with GL-ChemDraw:

- **Set structure:** `postMessage({ type: 'glchemdraw:setStructure', molfile: '...' })` or `{ type: 'glchemdraw:setStructure', smiles: '...' }`
- **Request structure:** `postMessage({ type: 'glchemdraw:requestStructure' })` — GL-ChemDraw replies with `{ type: 'glchemdraw:structure', molfile, smiles }`

## Notion

1. Type `/embed` and paste the iframe URL
2. Or use the Embed block and enter: `https://your-domain.com/?embed=1`

## Confluence

1. Insert → Other Macros → Embed
2. Enter the iframe URL
