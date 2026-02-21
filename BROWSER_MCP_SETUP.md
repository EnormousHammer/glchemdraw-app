# Browser MCP Setup — Test GL-ChemDraw in the Browser

This lets the AI agent automate your browser to test the app (navigate, click, type, take snapshots).

## Step 1: Install the Chrome Extension

1. Open Chrome and go to: **https://browsermcp.io/install**
2. Click **"Add to Chrome"** to install the Browser MCP extension
3. Pin the extension to your toolbar (optional, for quick access)

## Step 2: MCP Config (Already Done)

The project has `.cursor/mcp.json` configured with:

```json
{
  "mcpServers": {
    "browsermcp": {
      "command": "npx",
      "args": ["@browsermcp/mcp@latest"]
    }
  }
}
```

## Step 3: Enable in Cursor

1. Open **Cursor Settings** → **Features** → **MCP** (or **Tools & MCP**)
2. If "browsermcp" doesn't appear, click **"Add New MCP Server"**
3. For project-level config: Cursor should auto-detect `.cursor/mcp.json`
4. If not, add manually:
   - **Command:** `npx`
   - **Args:** `@browsermcp/mcp@latest`
5. Click **Refresh** to load the server
6. **Restart Cursor** completely (close and reopen)

## Step 4: Verify

1. Start the dev server: `npm run dev`
2. Open a tab in Chrome and go to `http://localhost:1420`
3. In Cursor Composer, ask: *"Use the browser to navigate to localhost:1420 and take a snapshot"*

If Browser MCP is working, the AI will use `browser_navigate` and `browser_snapshot` tools.

## Troubleshooting

- **"No server found"** — Restart Cursor after adding the config
- **Extension not connecting** — Ensure the Chrome extension is enabled
- **npx fails** — Run `npm install -g @browsermcp/mcp` and use `"command": "browsermcp"` (or `mcp`) in the config

## What You Can Do

Once set up, you can ask the AI to:

- Navigate to your app and test features
- Search for "acetone", click Predict NMR, verify the dialog
- Test the Biopolymer dialog
- Take screenshots of the UI
- Fill forms and click buttons
