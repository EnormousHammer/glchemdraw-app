#!/usr/bin/env node
/**
 * Get EXACT OpenAI failure reason
 * Run: node openai-exact-error.mjs
 * Proxy must be running: npm run dev:proxy
 */
const HEALTH = 'http://localhost:3001/health';
const DEBUG = 'http://localhost:3001/openai/debug';
const CHAT = 'http://localhost:3001/openai/chat';

async function main() {
  console.log('=== OpenAI Exact Error Diagnostic ===\n');

  // 0. Health check - is proxy running?
  console.log('0. Proxy health...');
  try {
    const h = await fetch(HEALTH, { signal: AbortSignal.timeout(5000) });
    const hText = await h.text();
    if (!h.ok) {
      console.log('   FAILED:', h.status, hText?.slice(0, 100));
      console.log('\n>>> Start proxy: npm run dev:proxy');
      process.exit(1);
    }
    let hData;
    try {
      hData = JSON.parse(hText);
    } catch {
      console.log('   Unexpected response:', hText?.slice(0, 100));
    }
    if (hData?.service === 'nmr-proxy') {
      console.log('   OK (nmr-proxy)');
    } else {
      console.log('   OK');
    }
  } catch (e) {
    console.log('   Error:', e.message);
    if (e.name === 'TimeoutError') console.log('   Proxy not responding.');
    console.log('\n>>> Start proxy: npm run dev:proxy');
    process.exit(1);
  }

  // 1. Debug endpoint (optional - may 404 if proxy is stale)
  console.log('\n1. Testing /openai/debug...');
  try {
    const r = await fetch(DEBUG, { signal: AbortSignal.timeout(10000) });
    const text = await r.text();
    if (r.status === 404 || (text.includes('<!DOCTYPE') || text.includes('<html'))) {
      console.log('   404 - Debug route not found.');
      console.log('   >>> Restart proxy to enable: npm run dev:proxy');
    } else {
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        console.log('   Response (not JSON):', r.status, text?.slice(0, 150));
      }
      if (data?.ok) {
        console.log('   OK:', data.response);
      } else if (data) {
        console.log('   FAILED:');
        console.log(JSON.stringify(data, null, 2));
      }
    }
  } catch (e) {
    console.log('   Error:', e.message);
  }

  // 2. Full chat request (main diagnostic)
  console.log('\n2. Testing POST /openai/chat...');
  try {
    const res = await fetch(CHAT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: 'Reply with one word.' },
          { role: 'user', content: 'Say hello' },
        ],
      }),
      signal: AbortSignal.timeout(30000),
    });
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      console.log('   Response (not JSON):', res.status, res.statusText);
      console.log('   Body:', text.slice(0, 500));
      return;
    }
    if (res.ok) {
      console.log('   OK:', data.content?.slice(0, 50));
    } else {
      console.log('   FAILED', res.status, '- EXACT ERROR:');
      console.log(JSON.stringify(data, null, 2));
    }
  } catch (e) {
    console.log('   Error:', e.message);
    if (e.cause) console.log('   Cause:', e.cause);
  }

  console.log('\n=== Done. Check proxy terminal for [OpenAI] logs. ===');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
