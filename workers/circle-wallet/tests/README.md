# Circle Worker Local Tests

This directory contains quick Node scripts to exercise the local Circle Cloudflare Worker endpoints.

Prerequisites
- Node 18+ (or newer)
- A local worker running at `http://localhost:8788` or `VITE_CIRCLE_WALLET_WORKER_URL` env variable set
- Worker secrets set via `wrangler secret put` if needed

Install dependencies

```bash
# run from repo root
npm install
cd workers/circle-wallet
npm install
```

Run tests

```bash
# Health check
node workers/circle-wallet/tests/test-health.js

# Create a wallet set
node workers/circle-wallet/tests/test-create-wallet-set.js

# Create a wallet (set WALLET_SET_ID env var) or pass in env
WALLET_SET_ID=<your-wallet-set-id> node workers/circle-wallet/tests/test-create-wallet.js

# Request faucet
WALLET_ADDRESS=0xYourAddress node workers/circle-wallet/tests/test-faucet.js

# Run the full e2e flow:
node workers/circle-wallet/tests/run-e2e.js
```

Notes:
- `run-e2e.js` will create a wallet set and a wallet, call the faucet, create a transfer to the wallet itself, and poll until the Circle worker returns an on-chain tx hash.
- Adjust `DEFAULT_BLOCKCHAIN` in `config.js` if you use a different chain (e.g., ARC vs testnet naming). The worker must be running locally via `wrangler dev`.

Troubleshooting
- If `get /api/health` fails, run `wrangler dev --port 8788` and check console logs.
- If `circleTxId` returns but no on-chain `txHash`, ensure your worker is returning `blockchainTransactionHash` in its transaction details. The poll helper checks multiple fields.
