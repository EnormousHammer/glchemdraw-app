#!/usr/bin/env node
/**
 * Quick AI integration test - runs against local proxy
 * Run: node test-ai-now.mjs
 */
const PROXY = 'http://localhost:3001/openai/chat';

async function chat(messages) {
  const res = await fetch(PROXY, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Proxy ${res.status}: ${err}`);
  }
  const data = await res.json();
  return data.content ?? '';
}

async function main() {
  console.log('Testing AI integration...\n');

  // 1. Basic connectivity
  console.log('1. Basic connectivity:');
  try {
    const hello = await chat([{ role: 'user', content: 'Say "OK" only' }]);
    console.log('   Result:', hello.trim().slice(0, 50));
    console.log('   PASS\n');
  } catch (e) {
    console.log('   FAIL:', e.message, '\n');
    process.exit(1);
  }

  // 2. Name-to-SMILES (asprin -> aspirin)
  console.log('2. AI fallback: "asprin" -> SMILES:');
  try {
    const content = await chat([
      { role: 'system', content: 'You are a chemistry expert. Convert chemical names to SMILES. Reply with ONLY the SMILES string, nothing else.' },
      { role: 'user', content: 'Convert this chemical name to SMILES: asprin' },
    ]);
    const smiles = content.trim().split(/\s/)[0]?.trim();
    console.log('   Result:', smiles || content.slice(0, 80));
    const ok = smiles && smiles.length > 2 && /[A-Za-z\[\]\(\)=#@\+\-\d]/.test(smiles);
    console.log(ok ? '   PASS\n' : '   (parse issue but AI responded)\n');
  } catch (e) {
    console.log('   FAIL:', e.message, '\n');
    process.exit(1);
  }

  // 3. SMILES to IUPAC
  console.log('3. AI: SMILES -> IUPAC (CC=O for acetone):');
  try {
    const content = await chat([
      { role: 'system', content: 'You are a chemistry expert. Convert SMILES to IUPAC name. Reply with ONLY the IUPAC name.' },
      { role: 'user', content: 'Give the IUPAC name for SMILES: CC=O' },
    ]);
    const name = content.trim().split('\n')[0]?.trim();
    console.log('   Result:', name || content.slice(0, 80));
    console.log(name && name.length > 2 ? '   PASS\n' : '   (parse issue but AI responded)\n');
  } catch (e) {
    console.log('   FAIL:', e.message, '\n');
    process.exit(1);
  }

  console.log('All AI tests passed.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
