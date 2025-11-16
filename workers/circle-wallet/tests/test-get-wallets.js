const fetch = globalThis.fetch || require('node-fetch');
const { WORKER_URL } = require('./config');

async function listWallets({ walletSetId, refId, blockchain } = {}) {
  const q = new URLSearchParams();
  if (walletSetId) q.append('walletSetId', walletSetId);
  if (refId) q.append('refId', refId);
  if (blockchain) q.append('blockchain', blockchain);
  const res = await fetch(`${WORKER_URL}/api/wallets?${q.toString()}`);
  if (!res.ok) throw new Error(`list wallets failed ${res.status}`);
  const json = await res.json();
  console.log('Wallets:', json.wallets);
  return json.wallets;
}

if (require.main === module) {
  listWallets({}).catch((err) => { console.error(err); process.exit(1); });
}

module.exports = listWallets;
