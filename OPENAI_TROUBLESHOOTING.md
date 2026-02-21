# OpenAI Failure – Get Exact Error

## 1. Restart proxy (required for new error logging)
```bash
# Stop existing proxy (Ctrl+C), then:
npm run dev:proxy
```

## 2. Run diagnostic
```bash
node openai-exact-error.mjs
```
Shows exact error from `/openai/debug` and `/openai/chat`.

## 3. In the app
- **Browser DevTools (F12) → Console**: Look for `[OpenAI] FAILED` with full message
- **Error Alert**: The red error box now shows the full error including `detail`
- **Proxy terminal**: Look for `[OpenAI] FAILED ---` with message, status, code, response.data

## 4. Common failures

| Error | Cause |
|-------|-------|
| `No OPENAI_API_KEY` | Add key to `openaikey/.env` |
| `fetch failed` / `Failed to fetch` | Proxy not running – `npm run dev:proxy` |
| `401` / `Incorrect API key` | Invalid or expired key |
| `429` | Rate limit – wait and retry |
| `500` + `detail` | Check proxy terminal for `[OpenAI]` log |

## 5. Test proxy directly
```bash
# Health
curl http://localhost:3001/health

# Chat (PowerShell)
Invoke-RestMethod -Uri "http://localhost:3001/openai/chat" -Method POST -ContentType "application/json" -Body '{"messages":[{"role":"user","content":"Say OK"}]}'
```
