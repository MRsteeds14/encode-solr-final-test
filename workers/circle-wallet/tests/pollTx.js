const fetch = globalThis.fetch || require('node-fetch');
const { WORKER_URL } = require('./config');

async function pollForBlockchainTxHash(circleTxId, { intervalMs = 3000, timeoutMs = 120000 } = {}) {
  const start = Date.now();
  while (true) {
    if (Date.now() - start > timeoutMs) {
      throw new Error(`Timeout waiting for Circle transaction ${circleTxId} to map to on-chain tx`);
    }

    const resp = await fetch(`${WORKER_URL}/api/transactions/${circleTxId}`);
    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`Failed to fetch transaction status: ${resp.status} ${text}`);
    }

    const json = await resp.json();
    // SDK / worker may return transaction.blockchainTransactionHash or txHash
    const txInfo = json.transaction || json.data || json; // tolerate different shape
    const state = txInfo?.state || txInfo?.status || json.state;
    const hash = txInfo?.blockchainTransactionHash || txInfo?.txHash || txInfo?.tx_hash || txInfo?.hash || json.txHash;

    console.log(`Polled state=${state} txHash=${hash || 'none'}`);

    if ((state === 'COMPLETE' || state === 'confirmed' || state === 'CONFIRMED') && hash) {
      return hash;
    }

    await new Promise((res) => setTimeout(res, intervalMs));
  }
}

module.exports = { pollForBlockchainTxHash };
