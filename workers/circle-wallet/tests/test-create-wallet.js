const fetch = globalThis.fetch || require('node-fetch');
const { WORKER_URL } = require('./config');

async function testCreateWallet({ walletSetId, userId='test-user-' + Date.now(), blockchains = ['ARC-TESTNET'] } = {}) {
  if (!walletSetId) throw new Error('walletSetId required');
  console.log('Creating wallet for userId', userId);
  const res = await fetch(`${WORKER_URL}/api/wallets/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ walletSetId, userId, blockchains, count: 1 }),
  });
  if (!res.ok) throw new Error(`create wallet failed: ${res.status}`);
  const json = await res.json();
  console.log('Response:', json);
  return json.wallets?.[0] || null;
}

if (require.main === module) {
  const walletSetId = process.env.WALLET_SET_ID;
  testCreateWallet({ walletSetId }).catch((err) => { console.error(err); process.exit(1); });
}

module.exports = testCreateWallet;
