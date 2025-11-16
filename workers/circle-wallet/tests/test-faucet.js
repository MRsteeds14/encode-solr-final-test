const fetch = globalThis.fetch || require('node-fetch');
const { WORKER_URL, DEFAULT_BLOCKCHAIN } = require('./config');

async function requestTestnetTokens(address, tokenType='usdc') {
  if (!address) throw new Error('address required');
  const body = { address, blockchain: DEFAULT_BLOCKCHAIN };
  if (tokenType === 'usdc') body.usdc = true;
  if (tokenType === 'native') body.native = true;
  console.log('Requesting testnet tokens', body);
  const res = await fetch(`${WORKER_URL}/api/faucet`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`faucet failed: ${res.status}`);
  const json = await res.json();
  console.log('Faucet response:', json);
  return json.data;
}

if (require.main === module) {
  const address = process.argv[2] || process.env.WALLET_ADDRESS;
  requestTestnetTokens(address).catch((err) => { console.error(err); process.exit(1); });
}

module.exports = requestTestnetTokens;
