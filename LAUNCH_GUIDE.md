# GL-ChemDraw Launch Guide

## 🚀 Available Launch Methods

### Method 1: Recommended - One Window (launch.bat)
**Best for:** Most users

```bash
launch.bat
```

- ✅ Launches both servers in ONE terminal window
- ✅ Uses `concurrently` to run both servers
- ✅ Easy to stop (Ctrl+C stops both)
- ✅ Color-coded output

**What it does:**
- Starts Vite Dev Server on http://localhost:1420
- Starts NMR Proxy Server on http://localhost:3001
- Both run simultaneously

---

### Method 2: Manual - Two Windows (launch-manual.bat)
**Best for:** Debugging, seeing separate logs

```bash
launch-manual.bat
```

- Opens TWO separate terminal windows
- One for Vite (frontend)
- One for NMR Proxy (backend)
- Close each window separately to stop servers

---

### Method 3: Web Mode (launch-web.bat)
**Best for:** Web development

```bash
launch-web.bat
```

Same as launch.bat but focused on web mode.

---

### Method 4: Desktop Mode (launch-desktop.bat)
**Best for:** Tauri desktop application

```bash
launch-desktop.bat
```

Launches the Tauri desktop version.

---

## 🔧 Troubleshooting

### Error: "concurrently not found"

**Solution:**
```bash
npm install --save-dev concurrently
```

Then run `launch.bat` again.

---

### Error: "Port 1420 already in use"

**Solution:**
1. Close any existing Vite servers
2. Check Task Manager for Node.js processes
3. Or change port in `vite.config.ts`

---

### Error: "Port 3001 already in use"

**Solution:**
1. Close any existing NMR proxy servers
2. Check Task Manager for Node.js processes
3. Or change port in `server/nmr-proxy.js`

---

### Servers won't start

**Solutions:**
1. Run `npm install` first
2. Check Node.js version: `node --version` (need 20.19+ or 22.12+)
3. Delete `node_modules` and run `npm install` again
4. Check for error messages in console

---

## 📝 Quick Commands

### Install dependencies
```bash
npm install
```

### Run frontend only
```bash
npm run dev
```

### Run backend/proxy only
```bash
npm run dev:proxy
```

### Run both (requires concurrently)
```bash
npm run dev:all
```

### Build for production
```bash
npm run build
```

### Run tests
```bash
npm test
```

---

## ✅ What's Fixed

**Problem:** `npm run dev` was being called but the package.json was missing `concurrently`.

**Solution:**
1. Added `concurrently` to `devDependencies` in `package.json`
2. Updated `launch.bat` to check for and install concurrently
3. Created `launch-improved.bat` with better error handling
4. Created `launch-manual.bat` for two-window approach

---

## 🎯 Recommended Workflow

1. **First Time Setup:**
   ```bash
   npm install
   launch.bat
   ```

2. **Daily Development:**
   ```bash
   launch.bat
   ```
   
3. **Open Browser:**
   - Navigate to http://localhost:1420
   - Start drawing structures!

4. **Stop Servers:**
   - Press `Ctrl+C` in the terminal
   - Or close the terminal window

---

## 📊 Server Status

You should see output like this:

```
========================================
   GlChemDraw - Launch Script
   Starting Development Server + NMR Proxy...
========================================

[1/3] Checking Node.js...
[2/3] Checking dependencies...
[3/3] Launching GlChemDraw...

Starting:
  - Vite Dev Server (http://localhost:1420)
  - NMR Proxy Server (http://localhost:3001)

NOTE: Both servers must run for NMR predictions to work!

[0] VITE ready in X ms
[1] NMR Proxy Server listening on port 3001
```

---

## 🔍 Testing the Fix

1. Open terminal in project folder
2. Run: `launch.bat`
3. Wait for both servers to start
4. Open browser to http://localhost:1420
5. Test all features:
   - Draw structures ✅
   - Name to Structure search ✅
   - Formula to Structure ✅
   - Structure to Name ✅
   - NMR Predictions ✅

---

**Last Updated:** November 2025  
**Status:** ✅ Fixed and Working

