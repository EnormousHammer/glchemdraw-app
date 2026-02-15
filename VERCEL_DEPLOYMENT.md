# 🚀 GlChemDraw - Vercel Deployment Guide

## ⚠️ IMPORTANT LIMITATIONS

**NMR predictions may NOT work reliably on Vercel due to:**

1. **Timeout Limits:**
   - Vercel Free: 10 seconds ❌ (NMR needs 60-90 seconds)
   - Vercel Pro: 60 seconds ⚠️ (Might timeout for complex molecules)
   
2. **Memory Constraints:**
   - Chromium binary is ~50MB
   - Headless browser uses 200-500MB RAM
   - May exceed serverless limits

3. **Cold Starts:**
   - First request takes 5-10 seconds just to start
   - Reduces available time for actual prediction

## ✅ What WILL Work on Vercel

- ✅ Structure drawing with Ketcher
- ✅ PubChem compound search
- ✅ 3D structure viewer
- ✅ Chemical property display
- ✅ Formula validation
- ⚠️ NMR predictions (may timeout frequently)

## 📋 Deployment Steps

### 1. Prerequisites

- Vercel account (free or pro)
- Git repository connected to Vercel
- **Vercel Pro required** for NMR predictions (60s timeout vs 10s)

### 2. Install Required Packages

```bash
npm install
```

This installs:
- `@sparticuz/chromium` - Chromium binary for Vercel
- `puppeteer-core` - Headless browser control

### 3. Deploy to Vercel

**Option A: Vercel CLI**
```bash
npm i -g vercel
vercel login
vercel --prod
```

**Option B: Vercel Dashboard**
1. Go to https://vercel.com/new
2. Import your Git repository
3. Set Framework Preset: **Vite**
4. Set Build Command: `npm run build`
5. Set Output Directory: `dist`
6. Click "Deploy"

### 4. Configure Function Settings (Pro Plan Only)

In Vercel Dashboard → Project Settings → Functions:
- **Timeout**: 60 seconds (maximum on Pro)
- **Memory**: 3008 MB (maximum)
- **Region**: Choose closest to your users

## 🐛 Troubleshooting

### NMR Predictions Timeout

**Solution 1: Upgrade to Vercel Pro**
- Get 60 second timeout instead of 10
- Still may timeout for complex molecules

**Solution 2: Use Desktop App (Recommended)**
```bash
# Run desktop version instead
npm run tauri dev
```

**Solution 3: Deploy to Alternative Platform**
- Railway.app (120s timeout, free tier)
- Render.com (flexible timeouts)
- DigitalOcean App Platform
- Your own VPS

### Chromium Binary Too Large

Error: "Function exceeds size limit"

**Solution:**
This is a Vercel limitation. The app is too large for serverless.
Use desktop app or deploy to traditional server.

### Memory Errors

Error: "Function exceeded memory limit"

**Solution:**
Upgrade to Vercel Pro with 3008MB memory limit.

## 💡 Recommended Approach

For best user experience:

1. **Deploy to Vercel** - for structure drawing and PubChem features
2. **Disable NMR predictions** - or show warning about timeouts
3. **Promote Desktop App** - for full NMR functionality

Or:

1. **Deploy to Railway/Render** - for full functionality including NMR
2. Get proper Node.js environment with longer timeouts

## 📦 Alternative: Static Deployment (No NMR)

If you want a simple static deployment WITHOUT NMR:

```bash
# Build static version
npm run build

# Deploy dist/ folder to:
# - Netlify
# - GitHub Pages
# - Vercel (just the frontend)
# - Any static host
```

This gives you structure drawing and PubChem but no NMR predictions.

## 🎯 Bottom Line

**Vercel Free:** Structure drawing works, NMR doesn't work ❌
**Vercel Pro:** Structure drawing works, NMR works sometimes ⚠️
**Desktop App:** Everything works perfectly ✅
**Railway/Render:** Everything works well ✅

Choose based on your needs and budget!

