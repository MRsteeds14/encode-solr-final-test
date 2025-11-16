const fetch = globalThis.fetch || require('node-fetch');
const { WORKER_URL } = require('./config');

async function testCreateWalletSet(name = 'Test Wallet Set') {
  console.log('Creating wallet set', name);
  const res = await fetch(`${WORKER_URL}/api/wallet-sets/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error(`create wallet set failed: ${res.status}`);
  const json = await res.json();
  console.log('Created:', json);
  return json.walletSet;
}

if (require.main === module) {
  testCreateWalletSet().catch((err) => { console.error(err); process.exit(1); });
}

module.exports = testCreateWalletSet;
