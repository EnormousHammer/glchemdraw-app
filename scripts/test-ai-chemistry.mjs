/**
 * Manual test script for AI chemistry functions.
 * Run: node scripts/test-ai-chemistry.mjs
 * Requires: npm run dev:proxy (localhost:3001) and OPENAI_API_KEY in openaikey/.env
 */

const PROXY = 'http://localhost:3001';

async function chat(messages) {
  const res = await fetch(`${PROXY}/openai/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
    signal: AbortSignal.timeout(60000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.content || '';
}

async function aiNameToSmiles(name) {
  const content = await chat([
    { role: 'system', content: 'You are a chemistry expert. Convert chemical names to SMILES. Reply with ONLY the SMILES string, nothing else.' },
    { role: 'user', content: `Convert this chemical name to SMILES: ${name}` },
  ]);
  const smiles = content.trim().split(/\s/)[0]?.trim();
  return smiles && smiles.length > 2 ? smiles : null;
}

async function aiSmilesToIupac(smiles) {
  const content = await chat([
    { role: 'system', content: 'You are a chemistry expert. Convert SMILES to IUPAC name. Reply with ONLY the IUPAC name on the first line.' },
    { role: 'user', content: `Give the IUPAC name for SMILES: ${smiles}` },
  ]);
  const name = content.trim().split('\n')[0]?.trim();
  return name && name.length > 2 ? name : null;
}

async function aiEstimatePhysicalProperties(smiles) {
  const content = await chat([
    { role: 'system', content: 'You are an expert medicinal chemist. Estimate physical/chemical properties. Reply in format:\nMelting Point: [value]\nBoiling Point: [value]\nAqueous Solubility: [value]\nLogP: [number]\nTPSA: [number]' },
    { role: 'user', content: `Estimate properties for SMILES: ${smiles}` },
  ]);
  const result = {};
  for (const line of content.split('\n').map(l => l.trim()).filter(Boolean)) {
    const m = line.match(/^([^:]+):\s*(.+)$/);
    if (m) result[m[1].trim()] = m[2].trim();
  }
  return Object.keys(result).length > 0 ? result : null;
}

async function aiEstimateSafety(smiles, name) {
  const compound = name ? `${name} (${smiles})` : smiles;
  const content = await chat([
    { role: 'system', content: 'You are a chemical safety expert. Provide a concise safety summary. Include GHS, flammability, handling. 2-4 short paragraphs.' },
    { role: 'user', content: `Safety summary for: ${compound}` },
  ]);
  return content.trim().length > 20 ? content.trim() : null;
}

async function main() {
  console.log('Testing AI chemistry functions (proxy must be running on :3001)\n');

  try {
    const health = await fetch(`${PROXY}/health`, { signal: AbortSignal.timeout(3000) });
    if (!health.ok) throw new Error('Proxy not healthy');
    console.log('✓ Proxy OK\n');
  } catch (e) {
    console.error('✗ Proxy not available. Run: npm run dev:proxy');
    process.exit(1);
  }

  const tests = [
    ['aiNameToSmiles("ethanol")', () => aiNameToSmiles('ethanol')],
    ['aiNameToSmiles("aspirin")', () => aiNameToSmiles('aspirin')],
    ['aiSmilesToIupac("CCO")', () => aiSmilesToIupac('CCO')],
    ['aiSmilesToIupac(aspirin SMILES)', () => aiSmilesToIupac('CC(=O)Oc1ccccc1C(=O)O')],
    ['aiEstimatePhysicalProperties("CCO")', () => aiEstimatePhysicalProperties('CCO')],
    ['aiEstimateSafety("CCO", "ethanol")', () => aiEstimateSafety('CCO', 'ethanol')],
  ];

  for (const [label, fn] of tests) {
    process.stdout.write(`${label}... `);
    try {
      const result = await fn();
      if (result === null || result === undefined) {
        console.log('✗ returned null');
      } else if (typeof result === 'object') {
        console.log('✓', JSON.stringify(result).slice(0, 80) + '...');
      } else {
        console.log('✓', String(result).slice(0, 60) + (String(result).length > 60 ? '...' : ''));
      }
    } catch (e) {
      console.log('✗', e.message);
    }
  }

  console.log('\nDone.');
}

main();
