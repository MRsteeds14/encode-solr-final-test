const testHealth = require('./test-health');
const testCreateWalletSet = require('./test-create-wallet-set');
const testCreateWallet = require('./test-create-wallet');
const requestTestnetTokens = require('./test-faucet');
const listWallets = require('./test-get-wallets');
const { pollForBlockchainTxHash } = require('./pollTx');
const fetch = globalThis.fetch || require('node-fetch');
const { WORKER_URL } = require('./config');

async function run() {
  await testHealth();

  // 1 create wallet set
  const ws = await testCreateWalletSet('solr-arc-e2e');
  const walletSetId = ws?.id;

  // 2 create wallet
  const w = await testCreateWallet({ walletSetId, userId: `e2e-${Date.now()}` });
  if (!w) throw new Error('Wallet not created');
  console.log('Created wallet:', w);

  // 3 request test USDC from faucet
  await requestTestnetTokens(w.address);

  // 4 list wallets
  const wallets = await listWallets({ walletSetId });
  console.log('Wallets for set:', wallets.length);

  // 5 create a small transfer (createTransaction) to self to test tx flow
  // first find a USDC token id
  const res = await fetch(`${WORKER_URL}/api/wallets/balance?walletId=${w.id}`);
  const balanceResp = await res.json();
  const token = (balanceResp.tokenBalances || []).find(t => t.token?.symbol === 'USDC' || t.token?.symbol === 'usdc');
  if (!token) throw new Error('USDC not found in wallet balances (faucet failed)');

  console.log('USDC token id:', token.token.id);

  // create transfer to self of 1 USDC (6 decimals)
  const txRes = await fetch(`${WORKER_URL}/api/transactions/transfer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      walletId: w.id,
      tokenId: token.token.id,
      destinationAddress: w.address,
      amounts: ['1000000'] // 1 USDC with 6 decimals
    }),
  });

  if (!txRes.ok) {
    const text = await txRes.text();
    throw new Error(`create transaction failed: ${txRes.status} ${text}`);
  }

  const txJson = await txRes.json();
  const circleTxId = txJson.transaction?.id || txJson.id || txJson.data?.id || txJson.txHash || txJson.transactionId;
  console.log('Circle tx id / challenge id:', circleTxId, txJson);

  // poll for on-chain tx hash
  const onChainHash = await pollForBlockchainTxHash(circleTxId, { intervalMs: 4000, timeoutMs: 180000 });
  console.log('On-chain tx hash:', onChainHash);

  console.log('E2E run complete.');
}

if (require.main === module) {
  run().catch(err => { console.error(err); process.exit(1); });
}

module.exports = run;
