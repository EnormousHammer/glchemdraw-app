#!/usr/bin/env node
/**
 * Diagnose OpenAI integration - what we send, what we get
 * Run: node diagnose-openai.mjs
 */
const PROXY = 'http://localhost:3001/openai/chat';

async function send(messages) {
  console.log('\n--- Request ---');
  messages.forEach((m, i) => {
    const preview = m.content.slice(0, 100).replace(/\n/g, ' ');
    console.log(`  [${m.role}]`, preview + (m.content.length > 100 ? '...' : ''));
  });
  const res = await fetch(PROXY, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
    signal: AbortSignal.timeout(60_000),
  });
  const text = await res.text();
  console.log('\n--- Response ---');
  console.log('  Status:', res.status, res.statusText);
  if (!res.ok) {
    console.log('  Body:', text.slice(0, 300));
    return null;
  }
  try {
    const data = JSON.parse(text);
    const content = data.content ?? '';
    console.log('  Content length:', content.length);
    console.log('  Preview:', content.slice(0, 150).replace(/\n/g, ' ') + (content.length > 150 ? '...' : ''));
    return content;
  } catch {
    console.log('  Raw:', text.slice(0, 200));
    return null;
  }
}

async function main() {
  console.log('=== OpenAI Diagnostic ===');
  console.log('Proxy:', PROXY);

  // 1. Health check
  try {
    const h = await fetch('http://localhost:3001/health');
    console.log('Proxy health:', h.ok ? 'OK' : h.status);
  } catch (e) {
    console.error('Proxy not reachable:', e.message);
    console.log('\n>>> Run: npm run dev:proxy');
    process.exit(1);
  }

  // 2. Simple test
  const r1 = await send([
    { role: 'user', content: 'Say "hello" in one word' },
  ]);
  if (!r1) {
    console.log('\n>>> Basic test failed. Check proxy logs and OPENAI_API_KEY in openaikey/.env');
    process.exit(1);
  }

  // 3. Name to SMILES (like search fallback)
  await send([
    { role: 'system', content: 'Convert chemical names to SMILES. Reply with ONLY the SMILES string.' },
    { role: 'user', content: 'Convert this chemical name to SMILES: asprin' },
  ]);

  // 4. NMR prediction (like Predict NMR)
  await send([
    { role: 'system', content: 'Predict NMR from SMILES. Reply with: 1H: δ X.XX ppm (nH) or 13C: δ X.XX ppm (nC). One per line.' },
    { role: 'user', content: 'Predict ¹H and ¹³C NMR for SMILES: CC(=O)C' },
  ]);

  console.log('\n=== All diagnostic requests completed ===');
  console.log('Check proxy terminal for [OpenAI] logs.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
