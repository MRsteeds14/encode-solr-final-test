# 🎯 Circle Developer-Controlled Smart Contract Wallets Setup

## Overview

This guide sets up **Circle Developer-Controlled Wallets** with **Smart Contract Accounts (SCA)** that support:

- ✅ **Unified addressing** across all EVM chains (same address on Arc, Ethereum, Polygon, etc.)
- ✅ **Gas sponsorship** - You pay gas fees for users
- ✅ **Smart contract features** - Programmable wallet logic, batch operations
- ✅ **Cross-chain compatibility** - Works with CCTP for bridging
- ✅ **YOU control the wallets** - No PIN/user authentication needed

---

## 🔐 Step 1: Generate Entity Secret

The Entity Secret is a 32-byte hex string that encrypts/manages all your wallet private keys.

### Method 1: Using Node.js Script (Easiest)

```bash
cd workers/circle-dev-wallet
npm install

# Run generation script
node -e "
const { initiateDeveloperControlledWalletsClient } = require('@circle-fin/developer-controlled-wallets');

const client = initiateDeveloperControlledWalletsClient({
  apiKey: 'd6d53f6a9db4290b1aedbf9ad93f59af:79e7ae96542e1fb6a7bd312c5eec33bf'
});

client.createEntitySecretCiphertext()
  .then(response => {
    console.log('\\n✅ Entity Secret Generated:\\n');
    console.log('Entity Secret:');
    console.log(response.data?.entitySecret);
    console.log('\\nEntity Secret Ciphertext:');
    console.log(response.data?.entitySecretCiphertext);
    console.log('\\n⚠️ SAVE BOTH VALUES SECURELY!');
    console.log('Add Entity Secret to .env.local as CIRCLE_ENTITY_SECRET\\n');
  })
  .catch(err => console.error('Error:', err));
"
```

**Note:** If you get a version error, the package.json is set to use `latest`. Run `npm install` and it will get the most recent version available.

### Method 2: Using the Worker API

Deploy a temporary worker and call the generation endpoint:

```bash
# Deploy worker first
cd workers/circle-dev-wallet
wrangler secret put CIRCLE_API_KEY
# Paste: d6d53f6a9db4290b1aedbf9ad93f59af:79e7ae96542e1fb6a7bd312c5eec33bf

wrangler secret put CIRCLE_ENTITY_SECRET
# Paste a temporary value: temp-secret-will-replace

wrangler deploy

# Call generation endpoint (ONLY ONCE!)
curl -X POST https://your-worker.workers.dev/api/entity-secret/generate
```

**Important:** Save both values returned:
- `entitySecret` → Add to `.env.local` as `CIRCLE_ENTITY_SECRET`
- `entitySecretCiphertext` → Keep as backup

---

## ⚙️ Step 2: Update Environment Variables

Add to your `.env.local`:

```bash
# Circle Developer-Controlled Wallets
VITE_CIRCLE_API_KEY=d6d53f6a9db4290b1aedbf9ad93f59af:79e7ae96542e1fb6a7bd312c5eec33bf
VITE_CIRCLE_APP_ID=33d74e5f-350b-5402-bb69-2015233247f8
CIRCLE_ENTITY_SECRET=your_32_byte_hex_from_step_1

# Worker URL (update after deployment)
VITE_CIRCLE_DEV_WALLET_WORKER_URL=http://localhost:8788
```

---

## 🚢 Step 3: Deploy Cloudflare Worker

```bash
cd workers/circle-dev-wallet

# Install dependencies
npm install

# Set secrets
wrangler secret put CIRCLE_API_KEY
# Paste: d6d53f6a9db4290b1aedbf9ad93f59af:79e7ae96542e1fb6a7bd312c5eec33bf

wrangler secret put CIRCLE_ENTITY_SECRET
# Paste: your entity secret from Step 1

# Deploy
wrangler deploy
```

Copy the deployed URL and update `.env.local`:
```bash
VITE_CIRCLE_DEV_WALLET_WORKER_URL=https://circle-dev-wallet.your-account.workers.dev
```

---

## 🧪 Step 4: Create Your First Wallet Set & SCA Wallet

### Create Wallet Set

A wallet set groups all wallets controlled by the same key:

```bash
curl -X POST https://your-worker.workers.dev/api/wallet-sets/create \
  -H "Content-Type: application/json" \
  -d '{"name":"SOLR-ARC Main Wallet Set"}'

# Save the walletSetId from response
```

### Create SCA Wallet on Arc Testnet

```bash
curl -X POST https://your-worker.workers.dev/api/wallets/create \
  -H "Content-Type: application/json" \
  -d '{
    "walletSetId": "your-wallet-set-id",
    "userId": "solar-producer-1",
    "blockchains": ["ARC-TESTNET"],
    "count": 1
  }'

# Response includes wallet address and refId
```

### Create Wallets on Multiple Chains (Unified Address)

To get the **same address** on multiple chains:

```bash
curl -X POST https://your-worker.workers.dev/api/wallets/create \
  -H "Content-Type: application/json" \
  -d '{
    "walletSetId": "your-wallet-set-id",
    "userId": "solar-producer-1",
    "blockchains": ["ARC-TESTNET", "ETH-SEPOLIA", "MATIC-AMOY"],
    "count": 1
  }'

# All 3 wallets will have the SAME address!
```

### Request Testnet Tokens

```bash
curl -X POST https://your-worker.workers.dev/api/faucet \
  -H "Content-Type: application/json" \
  -d '{
    "address": "0xYourWalletAddress",
    "blockchain": "ARC-TESTNET"
  }'
```

---

## 🎨 Architecture: How It Works

### Unified Addressing

```
Wallet Set ID: abc-123
  ├─ refId: "user-1"
  │  ├─ Arc Testnet:     0x1234...5678 (address index 1)
  │  ├─ Ethereum Sepolia: 0x1234...5678 (same address!)
  │  └─ Polygon Amoy:     0x1234...5678 (same address!)
  │
  └─ refId: "user-2"
     ├─ Arc Testnet:     0xabcd...efgh (address index 2)
     └─ Ethereum Sepolia: 0xabcd...efgh (same address!)
```

### Smart Contract Account (SCA) Benefits

1. **Gas Sponsorship** - Users don't need native tokens for gas
2. **Batch Operations** - Send multiple transactions in one
3. **Social Recovery** - Recover wallets without seed phrases
4. **Programmable Logic** - Custom approval rules
5. **ERC-4337 Compatible** - Standard AA implementation

---

## 📚 API Endpoints

Your worker provides these endpoints:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/entity-secret/generate` | POST | Generate entity secret (once) |
| `/api/wallet-sets/create` | POST | Create wallet set |
| `/api/wallets/create` | POST | Create SCA wallets |
| `/api/wallets/derive` | POST | Add wallet to new chain |
| `/api/wallets` | GET | List wallets |
| `/api/wallets/:id` | GET | Get wallet by ID |
| `/api/wallets/balance` | GET | Get token balance |
| `/api/transactions/transfer` | POST | Send transaction |
| `/api/transactions/:id` | GET | Get transaction status |
| `/api/transactions/sign` | POST | Sign raw transaction |
| `/api/faucet` | POST | Request testnet tokens |

---

## 🔧 Integration Examples

### Create Wallet for New Solar Producer

```typescript
// In your registration flow
async function createProducerWallet(producerId: string) {
  const response = await fetch(`${WORKER_URL}/api/wallets/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      walletSetId: MAIN_WALLET_SET_ID,
      userId: producerId,
      blockchains: ['ARC-TESTNET'],
      count: 1,
    }),
  });

  const { wallets, refId } = await response.json();
  const wallet = wallets[0];

  // Store in your database
  await saveProducer({
    id: producerId,
    walletAddress: wallet.address,
    walletId: wallet.id,
    refId,
  });

  // Request testnet tokens
  await fetch(`${WORKER_URL}/api/faucet`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      address: wallet.address,
      blockchain: 'ARC-TESTNET',
    }),
  });

  return wallet;
}
```

### Send Tokens from Treasury

```typescript
async function payProducer(
  producerAddress: string,
  amountUSDC: string
) {
  // Get treasury wallet token ID for USDC
  const balanceResponse = await fetch(
    `${WORKER_URL}/api/wallets/balance?walletId=${TREASURY_WALLET_ID}`
  );
  const { tokenBalances } = await balanceResponse.json();
  const usdcToken = tokenBalances.find(t => 
    t.token.symbol === 'USDC'
  );

  // Create transaction
  const txResponse = await fetch(`${WORKER_URL}/api/transactions/transfer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      walletId: TREASURY_WALLET_ID,
      tokenId: usdcToken.token.id,
      destinationAddress: producerAddress,
      amounts: [amountUSDC],
    }),
  });

  const { transaction } = await txResponse.json();
  return transaction;
}
```

### Add Cross-Chain Support Later

```typescript
// User wants to receive on Ethereum instead
async function deriveCrossChainWallet(
  existingWalletId: string,
  refId: string,
  newChain: string = 'ETH-SEPOLIA'
) {
  const response = await fetch(`${WORKER_URL}/api/wallets/derive`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      walletId: existingWalletId,
      blockchain: newChain,
      refId,
    }),
  });

  const { wallet } = await response.json();
  // Same address as Arc wallet!
  return wallet;
}
```

---

## ✅ Benefits for Your Solar Project

1. **Seamless Onboarding**
   - No wallet setup for users
   - You create wallets automatically
   - Instant USDC funding via faucet

2. **Cost Efficient**
   - You sponsor all gas fees
   - Users don't need native tokens
   - Batch operations reduce costs

3. **Cross-Chain Ready**
   - Same address on all chains
   - Easy CCTP integration
   - Users choose redemption chain

4. **Enterprise Grade**
   - MPC key management by Circle
   - Compliance hooks available
   - Audit trail for all transactions

5. **Smart Contract Features**
   - Automated treasury management
   - Batch payouts to producers
   - Custom approval logic

---

## 🎯 Next Steps

1. ✅ Generate Entity Secret
2. ✅ Deploy worker
3. ✅ Create wallet set
4. ✅ Create test SCA wallet
5. ✅ Request testnet tokens
6. ✅ Test sending transaction
7. 🔨 Integrate into your app
8. 🔨 Replace Thirdweb code
9. 🔨 Build solar features!

---

## 📞 Support

- **Circle Docs:** https://developers.circle.com/wallets/dev-controlled
- **SCA Guide:** https://developers.circle.com/wallets/account-types
- **Unified Addressing:** https://developers.circle.com/wallets/unified-wallet-addressing-evm
- **Discord:** https://discord.com/invite/buildoncircle

---

**You're ready to build with Circle's most advanced wallet infrastructure! 🚀**
