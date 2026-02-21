# NMR Predictions in Web Mode - Setup Guide

## Overview

NMR predictions in web mode require special handling due to browser security restrictions (CORS). This guide explains how to enable NMR predictions when running GlChemDraw in a web browser.

## Problem

The nmrdb.org NMR prediction service uses JavaScript to generate predictions. Web browsers block cross-origin requests (CORS), preventing direct access to the prediction data.

## Solutions

### Option 1: Use Desktop App (Recommended) ⭐

The desktop application bypasses CORS restrictions completely using Tauri's native HTTP client.

**Steps:**
1. Download and install the desktop version of GlChemDraw
2. Run the desktop app
3. NMR predictions will work automatically

**Advantages:**
- ✅ No setup required
- ✅ Works offline after initial setup
- ✅ Faster performance
- ✅ More reliable

---

### Option 2: Backend Proxy Server (For Web Mode)

If you need to use the web version, start the backend proxy server.

**Steps:**

#### Windows:
1. Double-click `START_NMR_PROXY.bat`
2. Keep the terminal window open
3. Open GlChemDraw in your browser
4. NMR predictions will now work

#### Linux/Mac:
```bash
npm run dev:proxy
```

**How it works:**
- Runs a local Node.js server on port 3001
- Uses Puppeteer (headless Chrome) to fetch predictions
- Extracts prediction data from JavaScript execution
- Returns clean JSON data to your browser

**Requirements:**
- Node.js installed
- `npm install` completed (includes Puppeteer)

---

### Option 3: Service Worker (Limited)

The app includes a Service Worker that attempts to bypass CORS automatically.

**Status:** ⚠️ Partially working
- Service Worker can fetch HTML from nmrdb.org
- Cannot execute JavaScript to extract predictions
- Falls back to iframe approach (may fail)

**No action required** - this runs automatically but has limitations.

---

### Option 4: iframe Fallback (Last Resort)

If all else fails, the app creates a hidden iframe to load the prediction page.

**Status:** ⚠️ Unreliable
- Often blocked by browser security policies
- May timeout waiting for data
- Only works if nmrdb.org allows iframe embedding

**No action required** - this is the automatic fallback.

---

## Troubleshooting

### "NMR prediction failed in web mode"

**Solution:**
1. Use Desktop App (easiest)
2. Or start backend proxy: `npm run dev:proxy`
3. Or wait 60 seconds for iframe fallback to complete

### "Backend proxy timeout"

**Check:**
1. Is the proxy server running? Look for terminal with "Server running on port 3001"
2. Is port 3001 available? Close other apps using that port
3. Network issues? Check your internet connection

### "Service Worker not registered"

**Fix:**
1. Refresh the page (Ctrl+F5)
2. Check browser console for errors
3. Service Workers require HTTPS or localhost

### Predictions taking too long

**Why:**
- nmrdb.org predictions require computational time
- Iframe approach waits up to 60 seconds
- Network latency can add delays

**Solution:**
- Use backend proxy (faster)
- Use desktop app (fastest)
- Be patient with iframe fallback

---

## Technical Details

### Request Flow

#### Desktop Mode:
```
GlChemDraw Desktop → Tauri HTTP Client → nmrdb.org → Response
```

#### Web Mode (Backend Proxy):
```
Browser → localhost:3001 → Puppeteer → nmrdb.org → JavaScript Execution → JSON Response
```

#### Web Mode (Service Worker):
```
Browser → Service Worker → nmrdb.org → HTML (no JavaScript) → iframe fallback
```

### File Locations

- **Service Worker:** `public/sw.js`
- **Backend Proxy:** `server/nmr-proxy.js`
- **API Client:** `src/lib/tauri/nmrApi.ts`
- **NMR Predictor:** `src/lib/nmr/predictor.ts`
- **UI Dialog:** `src/components/NMRPrediction/NMRPredictionDialog.tsx`

### Fallback Strategy

The system tries multiple approaches in order:

1. **Backend Proxy** (port 3001) - Best option
   - Timeout: 5 seconds
   - Uses Puppeteer with headless Chrome
   - Extracts data from window.ci.data

2. **Service Worker** (/api/nmr-prediction) - Limited
   - Can fetch HTML but not execute JavaScript
   - Returns HTML for iframe processing

3. **Vite Dev Proxy** (dev mode only) - Development
   - Only works with `npm run dev`
   - Proxies requests but returns HTML

4. **iframe Approach** - Last resort
   - Timeout: 60 seconds
   - May fail due to CORS
   - Tries to inject extraction script

---

## Development

### Starting Development Environment

```bash
# Terminal 1 - Frontend
npm run dev

# Terminal 2 - Backend Proxy (for NMR)
npm run dev:proxy

# Or run both together
npm run dev:all
```

### Testing NMR Predictions

1. Open GlChemDraw
2. Draw a molecule in Ketcher
3. Click the NMR icon or menu option
4. Check browser console for logs:
   - `[NMR API] Strategy 1: Trying backend proxy`
   - `[NMR API] ✓ Backend proxy succeeded`

### Debugging

Enable verbose logging by checking the browser console:
- `[Service Worker]` - Service worker activity
- `[NMR API]` - API client strategy attempts
- `[NMR Predictor]` - Prediction parsing
- `[NMR Dialog]` - UI component events

---

## Production Deployment

### With Backend Proxy

Deploy the backend proxy to a server:

```bash
# Deploy server/nmr-proxy.js to your hosting
# Update nmrApi.ts to use production URL
const backendProxyUrl = `https://your-api.com/nmr-proxy?url=...`;
```

### Without Backend Proxy

If you can't deploy a backend:

1. Desktop app works out of the box
2. Web mode will use iframe fallback (limited reliability)
3. Consider alternative NMR prediction services with CORS support

---

## Security Considerations

- Backend proxy makes requests to nmrdb.org on behalf of users
- Rate limiting recommended for production
- Consider caching prediction results
- Validate SMILES input to prevent abuse

---

## Future Improvements

Potential enhancements:

1. **WebAssembly NMR predictor** - Run predictions locally
2. **Alternative API** - Use a CORS-enabled NMR service
3. **Prediction caching** - Store results in IndexedDB
4. **Server-side rendering** - Pre-compute common molecules
5. **Progressive Web App** - Better offline support

---

## Support

For issues:
1. Check browser console for error messages
2. Verify backend proxy is running (if using web mode)
3. Try desktop app as alternative
4. Report bugs with console logs

---

## Summary

| Mode | Setup | Speed | Reliability | Recommended |
|------|-------|-------|-------------|-------------|
| Desktop App | None | Fast | ⭐⭐⭐⭐⭐ | ✅ Yes |
| Backend Proxy | npm run dev:proxy | Medium | ⭐⭐⭐⭐ | ✅ For web |
| Service Worker | Auto | Slow | ⭐⭐ | ❌ Limited |
| iframe | Auto | Very Slow | ⭐ | ❌ Last resort |

**Recommendation:** Use the desktop app for best experience. If you need web mode, run the backend proxy server.

