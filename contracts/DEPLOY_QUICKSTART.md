# 🚀 Quick Start: Deploy & Test Burn Mechanism

## TL;DR

You need to deploy a **new SARCToken** because your current one doesn't support burning. Here's the fastest path:

## 1️⃣ Deploy New Token (5 minutes)

```bash
# Make sure you're in the project root
cd /Users/sommers-j/Documents/solr-arc-solar-energ

# Compile contracts
cd contracts && forge build && cd ..

# Deploy new token (will prompt for private key)
node contracts/scripts/deploy-sarc-token.cjs
```

**What this does:**
- ✅ Deploys new SARCToken with burn capability
- ✅ Grants MINTER_ROLE to MintingController
- ✅ Grants BURNER_ROLE to Treasury
- ✅ Grants MINTER_ROLE to AI Agent
- ✅ Updates `.env.local` automatically

## 2️⃣ Update Contracts (Option A or B)

### **Option A: If Contracts Have Setters** (Recommended if available)
```bash
# Get new token address from .env.local
NEW_TOKEN=$(grep VITE_SARC_TOKEN .env.local | cut -d'=' -f2)

# Update MintingController
cast send 0xf84748fddee07b4d4d483c6291d0d3e97ad61d00 \
  "setSARCToken(address)" $NEW_TOKEN \
  --private-key YOUR_DEPLOYER_KEY \
  --rpc-url https://rpc.testnet.arc.network

# Update Treasury
cast send 0x8825518674A89e28d2C11CA0Ec49024ef6e1E2b2 \
  "setSARCToken(address)" $NEW_TOKEN \
  --private-key YOUR_DEPLOYER_KEY \
  --rpc-url https://rpc.testnet.arc.network
```

### **Option B: If Contracts Are Immutable** (Token address in constructor)
You need to redeploy MintingController and Treasury with new token address.

**Check if contracts have setters:**
```bash
# Check MintingController
cast interface 0xf84748fddee07b4d4d483c6291d0d3e97ad61d00 \
  --rpc-url https://rpc.testnet.arc.network | grep -i "set"

# Check Treasury  
cast interface 0x8825518674A89e28d2C11CA0Ec49024ef6e1E2b2 \
  --rpc-url https://rpc.testnet.arc.network | grep -i "set"
```

**If no setters, redeploy contracts:**
```bash
# This requires editing deployment scripts with new token address
# Contact me if you need help with this
```

## 3️⃣ Test Everything

### Test Minting
```bash
# Restart frontend
npm run dev

# In browser:
# 1. Login as Test@solar.com
# 2. Go to Mint tab
# 3. Enter 10 kWh
# 4. Submit
# 5. Balance should update IMMEDIATELY (no waiting!)
```

### Test Burning
```bash
# Get new token address
TOKEN=$(grep VITE_SARC_TOKEN .env.local | cut -d'=' -f2)

# Check total supply BEFORE redemption
cast call $TOKEN "totalSupply()" --rpc-url https://rpc.testnet.arc.network

# In browser:
# 1. Go to Redeem tab
# 2. Enter amount to redeem
# 3. Submit

# Check total supply AFTER redemption (should be LOWER)
cast call $TOKEN "totalSupply()" --rpc-url https://rpc.testnet.arc.network
```

## 4️⃣ Verify Roles

```bash
TOKEN=$(grep VITE_SARC_TOKEN .env.local | cut -d'=' -f2)
MINTER_ROLE="0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6"
BURNER_ROLE="0x3c11d16cbaffd01df69ce1c404f6340ee057498f5f00246190ea54220576a848"

# Check MintingController has MINTER_ROLE
cast call $TOKEN "hasRole(bytes32,address)" \
  $MINTER_ROLE 0xf84748fddee07b4d4d483c6291d0d3e97ad61d00 \
  --rpc-url https://rpc.testnet.arc.network

# Check Treasury has BURNER_ROLE
cast call $TOKEN "hasRole(bytes32,address)" \
  $BURNER_ROLE 0x8825518674A89e28d2C11CA0Ec49024ef6e1E2b2 \
  --rpc-url https://rpc.testnet.arc.network

# Both should return true (0x0000...0001)
```

## Troubleshooting

### ❌ "Minting still doesn't work"
**Check:**
1. Did MintingController get updated to new token address?
2. Does MintingController have MINTER_ROLE?
3. Is user registered in RegistryV2?

```bash
# Check if MintingController points to new token
cast call 0xf84748fddee07b4d4d483c6291d0d3e97ad61d00 \
  "sarcToken()" --rpc-url https://rpc.testnet.arc.network
```

### ❌ "Redemption fails with 'missing role'"
**Check:**
1. Does Treasury have BURNER_ROLE on new token?
2. Did Treasury get updated to use new token?

```bash
# Check if Treasury points to new token
cast call 0x8825518674A89e28d2C11CA0Ec49024ef6e1E2b2 \
  "sarcToken()" --rpc-url https://rpc.testnet.arc.network

# Verify BURNER_ROLE
cast call $NEW_TOKEN "hasRole(bytes32,address)" \
  0x3c11d16cbaffd01df69ce1c404f6340ee057498f5f00246190ea54220576a848 \
  0x8825518674A89e28d2C11CA0Ec49024ef6e1E2b2 \
  --rpc-url https://rpc.testnet.arc.network
```

### ❌ "Profile still shows zeros"
**This is separate from token deployment!**

Check:
1. Is user wallet registered in Registry?
2. Does `.env.local` have correct VITE_REGISTRY_ADDRESS?

```bash
# Get user wallet from Circle
# Then check if registered:
cast call 0xc9559c5884e53548b3d2362aa694b64519d291ee \
  "getProducer(address)" YOUR_WALLET_ADDRESS \
  --rpc-url https://rpc.testnet.arc.network
```

## What Changed?

### Old Architecture ❌
```
Mint: ✅ Works (but balance doesn't update)
Redeem: ✅ Works (but tokens accumulate in Treasury)
Burn: ❌ Never happens (supply always grows)
```

### New Architecture ✅
```
Mint: ✅ Works + balance updates immediately
Redeem: ✅ Works + tokens are BURNED
Burn: ✅ Happens automatically on redemption
Supply: ✅ Always equals unredeemed energy
```

## One-Liner Deployment

```bash
cd /Users/sommers-j/Documents/solr-arc-solar-energ && \
cd contracts && forge build && cd .. && \
node contracts/scripts/deploy-sarc-token.cjs
```

Then follow prompts to enter your deployer private key.

## Key Addresses

```bash
# Your Current Setup
Old sARC Token: 0x9604ad29C8fEe0611EcE73a91e192E5d976E2184
Registry: 0xc9559c5884e53548b3d2362aa694b64519d291ee
MintingController: 0xf84748fddee07b4d4d483c6291d0d3e97ad61d00
Treasury: 0x8825518674A89e28d2C11CA0Ec49024ef6e1E2b2
AI Agent: 0xE1d71CF21De70D144104423077ee7c0B5CFD5284

# After Deployment
New sARC Token: [Will be generated by script]
```

## Need Help?

Run this to check everything:
```bash
node check-role.cjs
```

Or contact support with:
- Transaction hash of failed mint/redeem
- Wallet address having issues
- Screenshot of error message
