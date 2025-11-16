# 🚀 Circle SCA Wallets - 5-Minute Quick Start

## What You're Building

**Smart Contract Account (SCA) wallets** that:
- Have the **same address** on Arc, Ethereum, Polygon, etc.
- Support **gas sponsorship** (users don't pay fees)
- Enable **programmable logic** (batch ops, custom rules)
- Work with **CCTP** for cross-chain transfers
- Are **controlled by you** (developer-controlled)

---

## ⚡ Quick Setup

### 1. Generate Entity Secret (1 minute)

```bash
cd workers/circle-dev-wallet
npm install

node -e "
const { initiateDeveloperControlledWalletsClient } = require('@circle-fin/developer-controlled-wallets');
const client = initiateDeveloperControlledWalletsClient({
  apiKey: 'd6d53f6a9db4290b1aedbf9ad93f59af:79e7ae96542e1fb6a7bd312c5eec33bf'
});
client.createEntitySecretCiphertext().then(r => {
  console.log('\\n✅ Entity Secret:', r.data?.entitySecret);
  console.log('\\n⚠️ Add this to .env.local as CIRCLE_ENTITY_SECRET\\n');
}).catch(console.error);
"
```

**Copy the output and paste into `.env.local`:**
```bash
CIRCLE_ENTITY_SECRET=paste_your_32_byte_hex_here
```

### 2. Deploy Worker (2 minutes)

```bash
# Set secrets
wrangler secret put CIRCLE_API_KEY
# Paste: d6d53f6a9db4290b1aedbf9ad93f59af:79e7ae96542e1fb6a7bd312c5eec33bf

wrangler secret put CIRCLE_ENTITY_SECRET  
# Paste: your entity secret from step 1

# Deploy
wrangler deploy
```

**Copy the deployed URL and update `.env.local`:**
```bash
VITE_CIRCLE_DEV_WALLET_WORKER_URL=https://your-worker.workers.dev
```

### 3. Create Wallet Set & First Wallet (2 minutes)

```bash
# Replace with your deployed URL
WORKER_URL="https://your-worker.workers.dev"

# Create wallet set
curl -X POST $WORKER_URL/api/wallet-sets/create \
  -H "Content-Type: application/json" \
  -d '{"name":"SOLR-ARC Main"}' \
  | jq -r '.walletSet.id'

# Save the ID, then create wallet
WALLET_SET_ID="paste-id-here"

curl -X POST $WORKER_URL/api/wallets/create \
  -H "Content-Type: application/json" \
  -d "{
    \"walletSetId\": \"$WALLET_SET_ID\",
    \"userId\": \"test-user-1\",
    \"blockchains\": [\"ARC-TESTNET\"],
    \"count\": 1
  }"
```

**Save the wallet address and add to `.env.local`:**
```bash
VITE_CIRCLE_WALLET_SET_ID=paste_wallet_set_id_here
```

### 4. Get Testnet Tokens

```bash
# Replace with your wallet address from step 3
WALLET_ADDRESS="0xYourWalletAddress"

curl -X POST $WORKER_URL/api/faucet \
  -H "Content-Type: application/json" \
  -d "{
    \"address\": \"$WALLET_ADDRESS\",
    \"blockchain\": \"ARC-TESTNET\"
  }"
```

---

## ✅ Done! You Now Have:

- ✅ Entity Secret generated & secured
- ✅ Worker deployed to Cloudflare
- ✅ Wallet Set created
- ✅ SCA wallet on Arc Testnet  
- ✅ Testnet USDC tokens

---

## 🎯 Next: Create Unified Address Wallets

Create wallets with the **same address** on multiple chains:

```bash
curl -X POST $WORKER_URL/api/wallets/create \
  -H "Content-Type: application/json" \
  -d "{
    \"walletSetId\": \"$WALLET_SET_ID\",
    \"userId\": \"cross-chain-user\",
    \"blockchains\": [\"ARC-TESTNET\", \"ETH-SEPOLIA\", \"MATIC-AMOY\"],
    \"count\": 1
  }"
```

**Result:** Same address on Arc, Ethereum, and Polygon! 🎉

---

## 📚 Common Operations

### Send Transaction

```bash
# Get token ID first
curl "$WORKER_URL/api/wallets/balance?walletId=$WALLET_ID" \
  | jq -r '.tokenBalances[0].token.id'

# Send tokens
curl -X POST $WORKER_URL/api/transactions/transfer \
  -H "Content-Type: application/json" \
  -d "{
    \"walletId\": \"$WALLET_ID\",
    \"tokenId\": \"$TOKEN_ID\",
    \"destinationAddress\": \"0xRecipient...\",
    \"amounts\": [\"1000000\"]
  }"
```

### Check Transaction Status

```bash
curl "$WORKER_URL/api/transactions/$TX_ID"
```

### List All Wallets

```bash
curl "$WORKER_URL/api/wallets?walletSetId=$WALLET_SET_ID"
```

---

## 🔧 Integration Example

```typescript
// In your app
const WORKER_URL = import.meta.env.VITE_CIRCLE_DEV_WALLET_WORKER_URL;
const WALLET_SET_ID = import.meta.env.VITE_CIRCLE_WALLET_SET_ID;

async function createProducerWallet(producerId: string) {
  const response = await fetch(`${WORKER_URL}/api/wallets/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      walletSetId: WALLET_SET_ID,
      userId: producerId,
      blockchains: ['ARC-TESTNET'],
      count: 1,
    }),
  });

  const { wallets } = await response.json();
  return wallets[0];
}
```

---

## ❓ Troubleshooting

**"Entity secret not set"**
→ Run step 1 again, copy output to `.env.local`

**"Worker 500 error"**
→ Check secrets are set: `wrangler secret list`

**"Wallet set not found"**
→ Create one: see step 3

**"No testnet tokens"**
→ Wait 30 seconds, or visit: https://faucet.circle.com

---

## 📖 Full Documentation

- **Complete Setup:** `CIRCLE_DEV_WALLET_SETUP.md`
- **Circle Docs:** https://developers.circle.com/wallets/dev-controlled
- **SCA Guide:** https://developers.circle.com/wallets/account-types

---

**Ready to integrate! 🚀**

Update your smart contracts, replace Thirdweb code, and build with Circle!
