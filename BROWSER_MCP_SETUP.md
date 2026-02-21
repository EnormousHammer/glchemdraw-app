# Browser MCP Setup — Test GL-ChemDraw in the Browser

This lets the AI agent automate your browser to test the app (navigate, click, type, take snapshots).

## Quick Install from GitHub (One-Click)

**Easiest method:** Go to the GitHub repo and click **"Add to Cursor"**:

| MCP Server | GitHub Link | One-Click Install |
|------------|-------------|-------------------|
| **Playwright MCP** (recommended) | [github.com/microsoft/playwright-mcp](https://github.com/microsoft/playwright-mcp) | Click "Add to Cursor" button on the README |
| **Browser MCP** | [github.com/BrowserMCP/mcp](https://github.com/BrowserMCP/mcp) | See [browsermcp.io/install](https://browsermcp.io/install) for Chrome extension |

After clicking, Cursor will add the server to your MCP config. **Restart Cursor** to apply.

---

## Two Options Available

| Option | Requires | Best For |
|--------|----------|----------|
| **Playwright MCP** | Node.js only | Recommended — no extension, works immediately |
| **Browser MCP** | Chrome + extension | Uses your actual Chrome tabs |

---

## Option A: Playwright MCP (Recommended)

**No Chrome extension needed.** Uses Playwright's built-in browser. Already configured.

### Prerequisites
- Node.js 18+
- Playwright browsers installed: `npx playwright install chromium` (already done in this project)

### Config (Already Done)
Both project `.cursor/mcp.json` and global `~/.cursor/mcp.json` include Playwright MCP.

---

## Option B: Browser MCP

**Requires Chrome extension.** Controls your actual Chrome browser tabs.

### Step 1: Install the Chrome Extension
1. Open Chrome and go to: **https://browsermcp.io/install**
2. Click **"Add to Chrome"** to install the Browser MCP extension
3. Pin the extension to your toolbar (optional)

### Step 2: Config (Already Done)
Both project and global MCP config include browsermcp.

---

## Enable in Cursor

1. Open **Cursor Settings** (Ctrl+,) → **Features** → **MCP** (or **Tools & MCP**)
2. Verify `browsermcp` and `playwright` appear in the list
3. If not, click **Refresh** to reload from config
4. **Restart Cursor completely** (close and reopen) — required for MCP changes

### Config Locations
- **Project:** `.cursor/mcp.json` — for this workspace only
- **Global:** `~/.cursor/mcp.json` — available in all Cursor projects

---

## Verify Setup

1. Start the dev server: `npm run dev`
2. In Cursor Composer, ask: *"Navigate to http://localhost:1420 and take a snapshot"*

If working, the AI will use browser tools (e.g. `playwright_navigate`, `browser_navigate`).

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| **Tools not available** | Restart Cursor completely after config changes |
| **browsermcp not connecting** | Install Chrome extension from browsermcp.io |
| **playwright fails** | Run `npx playwright install chromium` |
| **npx prompts** | Config uses `-y` flag to avoid install prompts |

---

## What You Can Do

Once set up, ask the AI to:

- Navigate to your app and test features
- Search for "acetone", click Predict NMR, verify the dialog
- Test the Biopolymer dialog
- Take screenshots of the UI
- Fill forms and click buttons
