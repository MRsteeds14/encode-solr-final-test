# SOLR-ARC Complete Demo Setup Guide

**Goal**: Get a fully working demo with wallet `0xd513C04FB43499Fa463451FFbF0f43eb48afF8B8`

**Estimated Time**: 2-3 hours

---

## ✅ Prerequisites Checklist

Before starting, verify you have:
- [ ] Contracts compiled (`forge build` in contracts directory)
- [ ] Deployer wallet private key in `.env.local` as `DEPLOYER_PRIVATE_KEY`
- [ ] Thirdweb secret key in `.env.local` as `THIRDWEB_SECRET_KEY`
- [ ] All API keys configured in `.env.local`
- [ ] Cloudflare account with Workers enabled
- [ ] Arc Testnet USDC for gas (get from https://faucet.circle.com)

---

## Step 1: Deploy New MintingController (30 min)

### Why?
Current MintingController points to OLD Registry V1. We need it to point to NEW RegistryV2.

### How to Deploy

#### Option A: Deploy via thirdweb CLI (Recommended)

```bash
cd contracts
npx thirdweb deploy
```

When the dashboard opens:
1. Select **MintingController** contract
2. Select **Arc Testnet** (Chain ID: 5042002)
3. Enter constructor parameters:

| Parameter | Value | Description |
|-----------|-------|-------------|
| `_registry` | `0xc9559c5884e53548b3d2362aa694b64519d291ee` | RegistryV2 address |
| `_sarcToken` | `0x9604ad29C8fEe0611EcE73a91e192E5d976E2184` | sARC token address |
| `_maxDailyMint` | `100000000000000000000000` | 100,000 tokens (18 decimals) |
| `_anomalyThreshold` | `200` | 200% threshold |

4. Click **Deploy**
5. Confirm transaction in your wallet
6. **SAVE THE NEW CONTRACT ADDRESS!**

#### What Happens
- New MintingController deployed pointing to RegistryV2
- Deployer gets `DEFAULT_ADMIN_ROLE`, `OPERATOR_ROLE`, and `MINTER_ROLE`
- Ready to receive additional role grants

### Update Frontend Config

Once deployed, update these files with the **new MintingController address**:

**File 1**: `src/lib/constants.ts`
```typescript
export const CONTRACTS = {
  SARC_TOKEN: '0x9604ad29C8fEe0611EcE73a91e192E5d976E2184',
  REGISTRY: '0xc9559c5884e53548b3d2362aa694b64519d291ee',
  TREASURY: '0x8825518674A89e28d2C11CA0Ec49024ef6e1E2b2',
  MINTING_CONTROLLER: '0xYOUR_NEW_MINTING_CONTROLLER_ADDRESS', // ← UPDATE THIS
}
```

**File 2**: `src/lib/contracts.ts`
```typescript
const FALLBACK_CONTRACT_ADDRESSES = {
  SARC_TOKEN: '0x9604ad29C8fEe0611EcE73a91e192E5d976E2184',
  REGISTRY: '0xc9559c5884e53548b3d2362aa694b64519d291ee',
  TREASURY: '0x8825518674A89e28d2C11CA0Ec49024ef6e1E2b2',
  MINTING_CONTROLLER: '0xYOUR_NEW_MINTING_CONTROLLER_ADDRESS', // ← UPDATE THIS
}
```

---

## Step 2: Grant Roles on New MintingController (20 min)

### Roles Needed

| Role | Granted To | On Contract | Why |
|------|-----------|-------------|-----|
| `MINTER_ROLE` | New MintingController | sARC Token | Allows minting new tokens |
| `OPERATOR_ROLE` | New MintingController | RegistryV2 | Allows recording production |
| `MINTER_ROLE` | AI Agent | New MintingController | Allows AI to trigger minting |
| `OPERATOR_ROLE` | AI Agent | New MintingController | Allows AI to manage minting |

### Grant Using API Script

```bash
# 1. Grant MINTER_ROLE to MintingController on sARC
node grant-role-api.cjs \
  0x9604ad29C8fEe0611EcE73a91e192E5d976E2184 \
  0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6 \
  0xYOUR_NEW_MINTING_CONTROLLER_ADDRESS

# 2. Grant OPERATOR_ROLE to MintingController on RegistryV2
node grant-role-api.cjs \
  0xc9559c5884e53548b3d2362aa694b64519d291ee \
  0x97667070c54ef182b0f5858b034beac1b6f3089aa2d3188bb1e8929f4fa9b929 \
  0xYOUR_NEW_MINTING_CONTROLLER_ADDRESS

# 3. Grant MINTER_ROLE to AI Agent on new MintingController
node grant-role-api.cjs \
  0xYOUR_NEW_MINTING_CONTROLLER_ADDRESS \
  0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6 \
  0xE1d71CF21De70D144104423077ee7c0B5CFD5284

# 4. Grant OPERATOR_ROLE to AI Agent on new MintingController
node grant-role-api.cjs \
  0xYOUR_NEW_MINTING_CONTROLLER_ADDRESS \
  0x97667070c54ef182b0f5858b034beac1b6f3089aa2d3188bb1e8929f4fa9b929 \
  0xE1d71CF21De70D144104423077ee7c0B5CFD5284
```

### Verify Roles

```bash
# Check all roles are granted
node check-role.cjs
```

Or create a verification script if needed.

---

## Step 3: Deploy PoG Agent to Cloudflare Workers (1 hour)

### Navigate to Worker Directory

```bash
cd workers/pog-agent
```

### Create wrangler.toml Configuration

Create or update `wrangler.toml`:

```toml
name = "solr-arc-pog-agent"
main = "index.ts"
compatibility_date = "2024-11-01"
node_compat = true

[vars]
ARC_RPC_URL = "https://rpc.testnet.arc.network"
MINTING_CONTROLLER_ADDRESS = "0xYOUR_NEW_MINTING_CONTROLLER_ADDRESS"
REGISTRY_ADDRESS = "0xc9559c5884e53548b3d2362aa694b64519d291ee"
ARC_CHAIN_ID = "5042002"
```

### Set Secrets

```bash
# Set AI Agent private key (from .env.local)
wrangler secret put AI_AGENT_PRIVATE_KEY
# Paste: <value from .env.local>

# Set Pinata JWT (from .env.local)
wrangler secret put PINATA_JWT
# Paste: <value from .env.local>

# Set NREL API key (from .env.local) - optional
wrangler secret put NREL_API_KEY
# Paste: <value from .env.local>
```

### Install Dependencies (if needed)

```bash
npm install
```

### Deploy Worker

```bash
wrangler deploy
```

**Expected Output:**
```
✅ Successfully published
   https://solr-arc-pog-agent.your-subdomain.workers.dev
```

### Update Frontend with Worker URL

Update `.env.local`:
```bash
VITE_POG_AGENT_URL=https://solr-arc-pog-agent.your-subdomain.workers.dev
```

**Restart your dev server** after updating:
```bash
# In project root
npm run dev
```

---

## Step 4: Register Demo Wallet as Producer (5 min)

### Method 1: Via Frontend (Easiest)

1. Start frontend: `npm run dev`
2. Connect wallet `0xd513C04FB43499Fa463451FFbF0f43eb48afF8B8`
3. You'll see the "Register System" screen
4. Click "Register System" button
5. Confirm transaction
6. Wait for confirmation
7. Dashboard should appear

### Method 2: Via Script

Create a quick registration script:

```javascript
// register-demo.cjs
const { ethers } = require('ethers');
require('dotenv').config({ path: '.env.local' });

async function registerDemo() {
  const provider = new ethers.JsonRpcProvider('https://rpc.testnet.arc.network');
  const wallet = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider);

  const registry = new ethers.Contract(
    '0xc9559c5884e53548b3d2362aa694b64519d291ee',
    [
      'function registerProducer(address producer, uint256 capacityKw, uint256 dailyCapKwh, string ipfsMetadata) external'
    ],
    wallet
  );

  console.log('Registering demo wallet as producer...');
  const tx = await registry.registerProducer(
    '0xd513C04FB43499Fa463451FFbF0f43eb48afF8B8', // Demo wallet
    10, // 10kW capacity
    80, // 80kWh daily cap
    'QmDemo' // IPFS metadata (placeholder)
  );

  console.log('Transaction submitted:', tx.hash);
  await tx.wait();
  console.log('✅ Demo wallet registered!');
}

registerDemo();
```

Run it:
```bash
node register-demo.cjs
```

---

## Step 5: Fund Treasury & AI Agent Wallets (10 min)

### Get Testnet USDC

1. Go to: https://faucet.circle.com
2. Enter your wallet address
3. Request testnet USDC
4. Wait for confirmation

### Fund Treasury

**Send 100+ USDC to Treasury**:
```
Address: 0x8825518674A89e28d2C11CA0Ec49024ef6e1E2b2
Amount: 100 USDC (or more for testing)
Network: Arc Testnet
```

**Why**: Treasury needs USDC to pay out redemptions. Without this, redemptions will fail with "insufficient balance" error.

### Fund AI Agent

**Send 5 USDC to AI Agent**:
```
Address: 0xE1d71CF21De70D144104423077ee7c0B5CFD5284
Amount: 5 USDC (for gas fees)
Network: Arc Testnet
```

**Why**: AI Agent submits blockchain transactions on behalf of users (minting). It needs gas to execute these transactions.

### Verify Balances

Check on block explorer:
- Treasury: https://testnet.arcscan.app/address/0x8825518674A89e28d2C11CA0Ec49024ef6e1E2b2
- AI Agent: https://testnet.arcscan.app/address/0xE1d71CF21De70D144104423077ee7c0B5CFD5284

---

## Step 6: Test Complete Demo Flow (30 min)

### Start Frontend

```bash
npm run dev
```

Open browser to: http://localhost:5173

### Test Flow Checklist

#### ✅ 1. Connection & Registration
- [ ] Connect wallet `0xd513C04FB43499Fa463451FFbF0f43eb48afF8B8`
- [ ] See dashboard (should be registered from Step 4)
- [ ] Verify system info shows: 10kW capacity, 80kWh daily cap

#### ✅ 2. Minting Flow
- [ ] Go to **Mint** tab
- [ ] Enter generation amount (e.g., `10` kWh)
- [ ] Click "Submit Generation Data"
- [ ] Watch PoG Agent status:
  - "Validating generation data..."
  - "Uploading proof to IPFS..."
  - "Minting sARC tokens..."
  - "Success!"
- [ ] Verify sARC balance increases by entered amount
- [ ] Check transaction appears in transaction feed
- [ ] Verify on block explorer: https://testnet.arcscan.app

#### ✅ 3. Redemption Flow
- [ ] Go to **Redeem** tab
- [ ] Enter sARC amount to redeem (e.g., `5`)
- [ ] See USDC preview: `5 sARC × 0.10 = 0.5 USDC`
- [ ] Click "Approve sARC"
- [ ] Confirm approval transaction
- [ ] Wait for approval confirmation
- [ ] Click "Redeem for USDC"
- [ ] Confirm redemption transaction
- [ ] Wait for redemption confirmation
- [ ] Verify:
  - [ ] sARC balance decreased
  - [ ] USDC balance increased
  - [ ] Transaction shows in feed
  - [ ] Correct amounts transferred

#### ✅ 4. Dashboard Verification
- [ ] **Overview tab**:
  - Stats cards show correct balances
  - Energy chart displays (may be empty initially)
  - Transaction feed shows minting + redemption
- [ ] **Profile tab**:
  - Shows correct system capacity (10kW)
  - Shows correct daily cap (80kWh)
  - Shows registration date
  - Shows lifetime stats

### Expected Behavior

**Successful Mint**:
```
1. User enters kWh
2. Frontend calls PoG Agent API
3. PoG Agent validates data
4. PoG Agent uploads proof to IPFS
5. PoG Agent calls mintFromGeneration() as AI Agent
6. Transaction confirms
7. User receives sARC tokens
8. Balance updates
```

**Successful Redemption**:
```
1. User enters sARC amount
2. User approves Treasury to spend sARC
3. User calls redeemForUSDC()
4. Treasury burns/transfers sARC
5. Treasury sends USDC to user
6. Balances update
```

---

## Troubleshooting

### "AccessControl: account is missing role"

**Problem**: Wallet doesn't have required role for operation

**Solutions**:
- For registration: Grant OPERATOR_ROLE to wallet on RegistryV2
- For minting: Verify AI Agent has MINTER_ROLE on MintingController
- Use `node check-role.cjs` to verify roles

### "PoG Agent connection failed"

**Problem**: Worker URL incorrect or worker not deployed

**Solutions**:
1. Verify `VITE_POG_AGENT_URL` in `.env.local`
2. Check worker is deployed: `wrangler deployments list`
3. Test worker directly: `curl https://your-worker-url.workers.dev/health`
4. Check worker logs: `wrangler tail`

### "Treasury has insufficient USDC balance"

**Problem**: Treasury doesn't have enough USDC for redemption

**Solution**: Send more USDC to Treasury (`0x8825518674A89e28d2C11CA0Ec49024ef6e1E2b2`)

### "Transaction reverted: Exceeds daily cap"

**Problem**: Trying to mint more than daily limit (80 kWh)

**Solution**: Either:
- Wait 24 hours for limit to reset
- Mint smaller amounts
- Update daily cap via `updateProducer()` function

### "IPFS upload failed"

**Problem**: Pinata JWT invalid or missing

**Solutions**:
1. Verify `PINATA_JWT` is set in worker secrets: `wrangler secret list`
2. Test Pinata JWT is valid
3. Reset secret if needed: `wrangler secret put PINATA_JWT`

---

## Quick Reference

### Contract Addresses

| Contract | Address |
|----------|---------|
| **sARC Token** | `0x9604ad29C8fEe0611EcE73a91e192E5d976E2184` |
| **RegistryV2** | `0xc9559c5884e53548b3d2362aa694b64519d291ee` |
| **Treasury** | `0x8825518674A89e28d2C11CA0Ec49024ef6e1E2b2` |
| **New MintingController** | `0xYOUR_NEW_ADDRESS` |

### Wallet Addresses

| Wallet | Address |
|--------|---------|
| **Demo/Deployer** | `0xd513C04FB43499Fa463451FFbF0f43eb48afF8B8` |
| **AI Agent** | `0xE1d71CF21De70D144104423077ee7c0B5CFD5284` |

### Role Hashes

| Role | Hash |
|------|------|
| **OPERATOR_ROLE** | `0x97667070c54ef182b0f5858b034beac1b6f3089aa2d3188bb1e8929f4fa9b929` |
| **MINTER_ROLE** | `0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6` |
| **DEFAULT_ADMIN_ROLE** | `0x0000000000000000000000000000000000000000000000000000000000000000` |

### Useful Commands

```bash
# Compile contracts
cd contracts && forge build

# Deploy via thirdweb
cd contracts && npx thirdweb deploy

# Grant role via API
node grant-role-api.cjs <contract> <roleHash> <account>

# Check role
node check-role.cjs

# Deploy worker
cd workers/pog-agent && wrangler deploy

# View worker logs
cd workers/pog-agent && wrangler tail

# Start frontend
npm run dev
```

### Useful Links

- **Arc Testnet Faucet**: https://faucet.circle.com
- **Arc Block Explorer**: https://testnet.arcscan.app
- **thirdweb Dashboard**: https://thirdweb.com/dashboard
- **Pinata Dashboard**: https://app.pinata.cloud

---

## Success Criteria

Your demo is complete when:
- ✅ Wallet connects and shows dashboard
- ✅ Can mint sARC tokens by submitting generation data
- ✅ PoG Agent processes requests and shows status
- ✅ Transactions appear in transaction feed
- ✅ Can redeem sARC for USDC
- ✅ Balances update correctly after each operation
- ✅ All stats and charts display correctly

**Time to demo: ~2-3 hours from start to finish!** 🎉
