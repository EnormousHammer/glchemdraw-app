# NMR Prediction API Fixes - Summary

## What Was Fixed

Fixed NMR prediction functionality in **web mode** for GlChemDraw. The nmrdb.org NMR prediction service was failing due to CORS (Cross-Origin Resource Sharing) restrictions in web browsers.

---

## Changes Made

### 1. Enhanced Service Worker (`public/sw.js`)

**Changes:**
- Added new `/api/nmr-prediction` endpoint that accepts SMILES and nucleus parameters
- Improved CORS handling for nmrdb.org requests
- Added better error messages and logging
- Service worker can now bypass CORS by fetching from its context

**How it works:**
- Intercepts NMR prediction requests in the browser
- Fetches HTML from nmrdb.org (bypasses CORS)
- Returns HTML for iframe extraction (since SW can't execute JavaScript)

### 2. Improved API Client (`src/lib/tauri/nmrApi.ts`)

**Changes:**
- Implemented **4-tier fallback strategy** for maximum reliability:
  1. Backend Proxy (Puppeteer) - Best option, extracts data from JavaScript
  2. Service Worker - Can bypass CORS but limited
  3. Vite Dev Proxy - Development mode only
  4. iframe Approach - Last resort, may fail

**Benefits:**
- Graceful degradation - tries best option first, falls back automatically
- Clear console logging shows which strategy succeeded
- Timeout handling prevents hanging on failed attempts
- Better error messages guide users to solutions

### 3. Better Error Handling (`src/components/NMRPrediction/NMRPredictionDialog.tsx`)

**Changes:**
- Enhanced error messages with actionable solutions
- Multi-line formatted errors (using `whiteSpace: 'pre-line'`)
- Specific guidance for each failure scenario
- Console logging for debugging

**User Experience:**
- Users see clear instructions when predictions fail
- Options presented: Desktop app, backend proxy, or wait for iframe
- Refresh button to retry after starting proxy

### 4. Documentation

**New Files:**
- `NMR_WEB_MODE_GUIDE.md` - Comprehensive guide for users
- `START_NMR_PROXY.bat` - Easy Windows launcher for backend proxy
- `test-nmr-proxy-server.js` - Test script to verify proxy works

**Updated Files:**
- Added comments to `server/nmr-proxy.js` explaining how it works

---

## How to Use (for Users)

### Option A: Desktop App (Recommended)
1. Download and install the desktop version
2. NMR predictions work automatically (no CORS issues)

### Option B: Web Mode with Backend Proxy
1. Open terminal in project folder
2. Run: `npm run dev:proxy` (or double-click `START_NMR_PROXY.bat`)
3. Keep terminal open
4. Open GlChemDraw in browser
5. NMR predictions now work!

### Option C: Web Mode without Backend Proxy
- Will attempt iframe fallback
- May fail due to CORS restrictions
- User will see error message with instructions

---

## Technical Architecture

### Desktop Mode Flow
```
Ketcher → NMRPredictionDialog
         → predictNMR()
         → fetchNMRPredictionWithBrowser()
         → Tauri Command (bypasses CORS)
         → nmrdb.org
         → Response ✓
```

### Web Mode Flow (Backend Proxy)
```
Ketcher → NMRPredictionDialog
         → predictNMR()
         → fetchNMRPredictionWithBrowser()
         → fetchNMRPredictionWithProxy()
         → Backend Proxy (localhost:3001)
         → Puppeteer (headless Chrome)
         → nmrdb.org (execute JavaScript)
         → Extract window.ci.data
         → JSON Response ✓
```

### Web Mode Flow (Service Worker - Limited)
```
Ketcher → NMRPredictionDialog
         → predictNMR()
         → fetchNMRPredictionWithBrowser()
         → fetchNMRPredictionWithProxy()
         → Service Worker (/api/nmr-prediction)
         → nmrdb.org (fetch HTML)
         → HTML Response (no JavaScript execution)
         → Falls back to iframe ⚠️
```

### Web Mode Flow (iframe Fallback)
```
Ketcher → NMRPredictionDialog
         → predictNMR()
         → fetchNMRPredictionWithBrowser()
         → fetchNMRPredictionWithProxy()
         → fetchNMRPredictionWithIframe()
         → Create hidden iframe
         → Load nmrdb.org service.php
         → Wait for redirect to prediction page
         → Try to inject extraction script (may fail - CORS)
         → Listen for postMessage (may not receive)
         → Timeout after 60 seconds ✗
```

---

## Why This Approach?

### Problem: nmrdb.org Uses JavaScript to Generate Predictions

The nmrdb.org service:
1. Receives SMILES via `service.php`
2. Stores SMILES in localStorage
3. Redirects to prediction page
4. Loads JavaScript visualizer
5. Visualizer generates predictions
6. Stores results in `window.ci.data`

**This means:**
- Simple HTTP requests won't work (returns HTML, not predictions)
- Need to execute JavaScript to get predictions
- Service Workers can bypass CORS but can't execute page JavaScript
- Browser iframes can execute JavaScript but CORS blocks script injection

### Solution: Multi-Tier Fallback

1. **Backend Proxy with Puppeteer** (Best)
   - Runs headless Chrome on server
   - Can execute JavaScript
   - Can extract `window.ci.data`
   - Returns clean JSON

2. **Service Worker** (Limited)
   - Can bypass CORS for fetching
   - Cannot execute JavaScript
   - Returns HTML for iframe processing

3. **iframe Fallback** (Unreliable)
   - Can execute JavaScript
   - May be blocked by CORS
   - May timeout
   - Last resort

---

## Testing

### Test Backend Proxy

```bash
# Terminal 1: Start proxy
npm run dev:proxy

# Terminal 2: Test proxy
node test-nmr-proxy-server.js
```

Expected output:
```
1. Testing health endpoint...
   ✓ Health check: { status: 'ok' }

2. Testing proxy with simple URL...
   ✓ Proxy works, received 123456 bytes of HTML

3. Testing NMR prediction (this may take 30-60 seconds)...
   Testing with SMILES: CC(=O)O
   Waiting for prediction...
   ✓ NMR prediction succeeded!
   Found 1 spectrum(a)
   Nucleus: 1H
   Peaks: 2
```

### Test in Browser

1. Start dev server: `npm run dev`
2. Start proxy: `npm run dev:proxy` (separate terminal)
3. Open http://localhost:1420
4. Draw a molecule in Ketcher
5. Click NMR prediction button
6. Check browser console for logs:
   - `[NMR API] Strategy 1: Trying backend proxy`
   - `[NMR API] ✓ Backend proxy (Puppeteer) succeeded`

---

## Known Limitations

### Service Worker Limitations
- Cannot execute JavaScript from fetched pages
- Can only return HTML or fetch data
- Chrome/Edge may cache service worker aggressively
- Requires HTTPS or localhost

### iframe Limitations  
- CORS may block script injection
- Cannot access iframe contents across origins
- May not receive postMessage from nmrdb.org
- Timeout after 60 seconds

### Puppeteer Requirements
- Requires Node.js backend
- Downloads Chromium (~200MB first run)
- Slower than direct API (but more reliable)
- May have issues on some hosting platforms

---

## Future Improvements

### Short Term
1. Cache prediction results in IndexedDB (avoid re-fetching)
2. Add retry logic with exponential backoff
3. Show progress indicator during prediction
4. Allow users to configure proxy URL

### Medium Term
1. Investigate WebAssembly-based NMR predictor (run locally)
2. Explore alternative NMR APIs with CORS support
3. Pre-compute predictions for common molecules
4. Add prediction result export (CSV, JSON)

### Long Term
1. Implement machine learning-based NMR predictor
2. Train on custom dataset
3. Deploy as edge function (Cloudflare Workers, etc.)
4. Build mobile app with native NMR support

---

## Troubleshooting Guide

### "Backend proxy timeout"

**Cause:** Proxy server not running or port 3001 blocked

**Fix:**
```bash
# Check if server is running
curl http://localhost:3001/health

# If not, start it
npm run dev:proxy

# Check if port is in use
netstat -ano | findstr :3001  # Windows
lsof -i :3001  # Mac/Linux
```

### "Service Worker not registered"

**Cause:** Service worker failed to install

**Fix:**
1. Open DevTools → Application → Service Workers
2. Click "Unregister"
3. Hard refresh (Ctrl+Shift+R)
4. Check console for errors

### "NMR prediction failed in web mode"

**Cause:** All fallback strategies failed

**Fix (in order):**
1. Start backend proxy: `npm run dev:proxy`
2. Use desktop app instead
3. Check nmrdb.org is accessible
4. Check browser console for specific error

### Predictions stuck at "Predicting..."

**Cause:** iframe timeout or proxy hung

**Fix:**
1. Wait up to 60 seconds for iframe fallback
2. Click "Refresh" button to retry
3. Restart backend proxy if using one
4. Check network tab for failed requests

---

## Configuration

### Change Backend Proxy URL

Edit `src/lib/tauri/nmrApi.ts`:

```typescript
// Line 88
const backendProxyUrl = `http://your-server.com/api/nmr-proxy?url=...`;
```

### Change Proxy Port

Edit `server/nmr-proxy.js`:

```javascript
// Line 19
const PORT = process.env.PORT || 3001;
```

Then update client URL in `nmrApi.ts`.

### Change Service Worker Endpoints

Edit `public/sw.js`:

```javascript
// Lines 10-11
const PROXY_ENDPOINT = '/api/nmr-proxy';
const NMR_DIRECT_ENDPOINT = '/api/nmr-prediction';
```

---

## Files Modified

### Core Files
- ✅ `public/sw.js` - Enhanced service worker
- ✅ `src/lib/tauri/nmrApi.ts` - Multi-tier fallback strategy
- ✅ `src/components/NMRPrediction/NMRPredictionDialog.tsx` - Better error messages

### Documentation
- ✅ `NMR_WEB_MODE_GUIDE.md` - User guide
- ✅ `NMR_FIXES_SUMMARY.md` - This file
- ✅ `START_NMR_PROXY.bat` - Windows launcher

### Testing
- ✅ `test-nmr-proxy-server.js` - Proxy test script

### Unchanged (but improved with better integration)
- `server/nmr-proxy.js` - Backend proxy (added comments)
- `src/lib/nmr/predictor.ts` - Prediction parser
- `src/main.tsx` - Service worker registration

---

## Summary

**What was broken:**
- NMR predictions failed in web mode due to CORS restrictions
- No clear error messages
- No fallback strategies

**What's fixed:**
- ✅ Multi-tier fallback strategy (backend proxy → service worker → iframe)
- ✅ Clear error messages with actionable solutions
- ✅ Better logging for debugging
- ✅ Documentation and helper scripts
- ✅ Desktop app works out of the box
- ✅ Web mode works with backend proxy

**What's still limited:**
- ⚠️ Service Worker can't execute JavaScript (returns HTML)
- ⚠️ iframe approach unreliable without backend proxy
- ⚠️ Backend proxy requires separate server

**Recommendation:**
- Use desktop app for best experience
- Use backend proxy for web mode
- iframe fallback is last resort (may fail)

---

## Quick Reference

| Scenario | Solution | Command |
|----------|----------|---------|
| Desktop app | Install and run | Works automatically |
| Web dev mode | Backend proxy + Vite | `npm run dev:all` |
| Web dev (proxy only) | Backend proxy | `npm run dev:proxy` |
| Test proxy | Run test script | `node test-nmr-proxy-server.js` |
| Start Windows proxy | Batch file | Double-click `START_NMR_PROXY.bat` |
| Debug | Browser console | Look for `[NMR API]` logs |

---

**Status:** ✅ **Fixed and tested** (documentation complete, ready for user testing)

