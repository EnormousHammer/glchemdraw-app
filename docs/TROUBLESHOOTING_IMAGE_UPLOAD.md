# Image Upload on Vercel – Troubleshooting

## Why image upload might fail

### 1. **OpenAI API route not deployed**
- **Check:** Visit `https://your-app.vercel.app/api/openai/chat` in a browser.
- **Expected:** `{"ok":true,"message":"OpenAI chat endpoint","hasKey":true}`
- **If 404 or SPA:** The route isn’t deployed. Ensure `api/openai/chat.js` exists and is committed.

### 2. **Missing API key**
- **Check:** Same URL – if `hasKey` is `false`, the key isn’t set.
- **Fix:** Vercel → Project → Settings → Environment Variables → add `OPENAI_API_KEY`.

### 3. **Model not available**
- **Check:** Snackbar shows the error (e.g. "model not found").
- **Fix:** Set `OPENAI_MODEL` to a supported vision model (e.g. `gpt-4o`, `gpt-4o-mini`).

### 4. **Request body too large**
- **Check:** Snackbar shows 413 or "payload too large".
- **Fix:** Images are compressed above ~2MB; if it still fails, the image may be too large.

### 5. **Network / CORS**
- **Check:** Browser DevTools → Network tab → failed request to `/api/openai/chat`.
- **Fix:** Confirm CORS headers and that the request reaches Vercel.

## Quick diagnostic

1. Open `https://your-app.vercel.app/api/openai/chat`.
2. If you see `{"ok":true,"hasKey":true}` → route and key are OK; the issue is likely in the request or model.
3. If you see `{"ok":true,"hasKey":false}` → add `OPENAI_API_KEY` in Vercel.
4. If you get 404 → the API route is not deployed; check `api/openai/chat.js` and redeploy.
