# RegistryV2 Deployment Guide

## 🎯 What's New in RegistryV2

**RegistryV2** is an enhanced version of the Registry contract that **pre-configures all necessary roles during deployment**. This means you don't need to run separate role-granting scripts after deployment!

### Key Difference

| Version | Role Configuration |
|---------|-------------------|
| **Registry (V1)** | Deploy → Then grant roles manually |
| **RegistryV2** | Deploy with roles → Ready to use immediately! |

---

## 🚀 Quick Deployment with thirdweb CLI

### Step 1: Compile the Contract

```bash
cd contracts
forge build
```

### Step 2: Deploy with thirdweb CLI

```bash
npx thirdweb deploy
```

This will:
1. Open the thirdweb dashboard in your browser
2. Show you the contract to deploy
3. Ask for constructor parameters

### Step 3: Constructor Parameters

When deploying RegistryV2, you'll need to provide **2 addresses**:

| Parameter | Value | Description |
|-----------|-------|-------------|
| **_mintingController** | `0x186c2987F138f3784913e5e42f0cee4512b89C3E` | Your MintingController contract address |
| **_aiAgent** | `0xE1d71CF21De70D144104423077ee7c0B5CFD5284` | Your AI Agent wallet address |

**In the thirdweb dashboard:**
1. Select **RegistryV2** contract
2. Select **Arc Testnet** (Chain ID: 5042002)
3. Enter constructor parameters:
   - `_mintingController`: `0x186c2987F138f3784913e5e42f0cee4512b89C3E`
   - `_aiAgent`: `0xE1d71CF21De70D144104423077ee7c0B5CFD5284`
4. Click **Deploy**
5. Confirm transaction in your wallet

---

## ✅ What Roles Are Pre-Configured?

After deployment, these roles are **automatically granted**:

| Account | Contract | Role | Purpose |
|---------|----------|------|---------|
| **Deployer** (You) | RegistryV2 | `DEFAULT_ADMIN_ROLE` | Can manage all roles |
| **Deployer** (You) | RegistryV2 | `OPERATOR_ROLE` | Can register producers |
| **MintingController** | RegistryV2 | `OPERATOR_ROLE` | Can call `recordProduction()` |
| **AI Agent** | RegistryV2 | `OPERATOR_ROLE` | Can call `registerProducer()` |

**No additional role-granting needed!** 🎉

---

## 🔄 Migration from Registry (V1) to RegistryV2

If you're currently using the old Registry contract, here's how to migrate:

### Step 1: Deploy RegistryV2

Follow the deployment steps above.

### Step 2: Update Your Contract Addresses

Update these files with the new RegistryV2 address:

1. **[src/lib/constants.ts](src/lib/constants.ts)**
   ```typescript
   export const REGISTRY_ADDRESS = '0xYourNewRegistryV2Address'
   ```

2. **[src/lib/contracts.ts](src/lib/contracts.ts)**
   ```typescript
   export const registryAddress = '0xYourNewRegistryV2Address'
   ```

3. **[.env.local](.env.local)** (if you have it)
   ```bash
   VITE_REGISTRY_ADDRESS=0xYourNewRegistryV2Address
   ```

### Step 3: Update MintingController Reference

Your MintingController contract has a hardcoded reference to the old Registry address. You have two options:

**Option A: Deploy a new MintingController** (Recommended)
- Deploy a new MintingController that points to RegistryV2
- Grant it OPERATOR_ROLE on RegistryV2 (already done via constructor!)
- Grant it MINTER_ROLE on sARC token

**Option B: Keep using the old MintingController**
- Leave MintingController pointing to the old Registry for production minting
- Use RegistryV2 for new producer registrations via AI Agent
- Not ideal, but works if you want to test RegistryV2 first

### Step 4: Verify Deployment

Run the test deployment script:

```bash
node test-deployment.js
```

Update the script first to check RegistryV2 address instead of the old one.

---

## 📋 Complete Redeployment (Fresh Start)

If you want to redeploy **all contracts** with the new Registry:

### Deployment Order

1. **Deploy sARC Token** (or reuse existing: `0x9604ad29C8fEe0611EcE73a91e192E5d976E2184`)

2. **Deploy RegistryV2**
   - Constructor params:
     - `_mintingController`: `address(0)` (placeholder for now)
     - `_aiAgent`: `0xE1d71CF21De70D144104423077ee7c0B5CFD5284`

3. **Deploy MintingController**
   - Constructor params:
     - `_registry`: `<RegistryV2 address from step 2>`
     - `_sarcToken`: `0x9604ad29C8fEe0611EcE73a91e192E5d976E2184`
     - `_maxDailyMint`: `100000000000000000000000` (100,000 with 18 decimals)
     - `_anomalyThreshold`: `200` (2%)

4. **Update RegistryV2 Roles**
   - Grant OPERATOR_ROLE to the new MintingController:
   ```bash
   node grant-role-api.js <RegistryV2Address> 0x97667070c54ef182b0f5858b034beac1b6f3089aa2d3188bb1e8929f4fa9b929 <MintingControllerAddress>
   ```

5. **Deploy Treasury**
   - Constructor params:
     - `_sarcToken`: `0x9604ad29C8fEe0611EcE73a91e192E5d976E2184`
     - `_usdcToken`: `0x3600000000000000000000000000000000000000`
     - `_initialExchangeRate`: `100000000000000000` (0.10 USDC per sARC)

6. **Grant MINTER_ROLE to MintingController on sARC**
   ```bash
   node grant-role-api.js 0x9604ad29C8fEe0611EcE73a91e192E5d976E2184 0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6 <MintingControllerAddress>
   ```

---

## 🎯 Benefits of RegistryV2

✅ **Faster Deployment** - No separate role-granting step needed
✅ **Fewer Transactions** - Save on gas by setting roles in constructor
✅ **Less Error-Prone** - Can't forget to grant critical roles
✅ **Demo-Ready** - Deploy and immediately use for demos
✅ **Transparent** - All role grants visible in constructor transaction

---

## 🛠️ Constructor Parameters Reference

For easy copy-paste when deploying via thirdweb CLI:

### Current Deployment Values

```
_mintingController: 0x186c2987F138f3784913e5e42f0cee4512b89C3E
_aiAgent: 0xE1d71CF21De70D144104423077ee7c0B5CFD5284
```

### If Deploying Fresh (No MintingController Yet)

**Option 1:** Deploy RegistryV2 with placeholder addresses, then update later
```
_mintingController: 0x0000000000000000000000000000000000000001 (placeholder)
_aiAgent: 0xE1d71CF21De70D144104423077ee7c0B5CFD5284
```

Then grant OPERATOR_ROLE to the real MintingController after it's deployed.

**Option 2:** Deploy MintingController first (pointing to old Registry), then deploy RegistryV2 with the real MintingController address.

---

## 📝 Contract Verification

After deployment, verify your contract on Arc Testnet:

1. Go to: https://testnet.arcscan.app
2. Search for your RegistryV2 contract address
3. Verify roles were granted correctly by checking events:
   - Look for `RoleGranted` events in the deployment transaction
   - Should see 4 events (deployer gets 2 roles, MintingController gets 1, AI Agent gets 1)

---

## 🔍 Testing Your Deployment

### Verify Roles

Use the thirdweb dashboard or ethers.js to check roles:

```javascript
const registry = new ethers.Contract(registryV2Address, ABI, provider);

// Check AI Agent has OPERATOR_ROLE
const hasRole = await registry.hasRole(
  '0x97667070c54ef182b0f5858b034beac1b6f3089aa2d3188bb1e8929f4fa9b929',
  '0xE1d71CF21De70D144104423077ee7c0B5CFD5284'
);
console.log('AI Agent has OPERATOR_ROLE:', hasRole); // Should be true

// Check MintingController has OPERATOR_ROLE
const hasRole2 = await registry.hasRole(
  '0x97667070c54ef182b0f5858b034beac1b6f3089aa2d3188bb1e8929f4fa9b929',
  '0x186c2987F138f3784913e5e42f0cee4512b89C3E'
);
console.log('MintingController has OPERATOR_ROLE:', hasRole2); // Should be true
```

### Test Registration

Try registering a producer from your AI Agent wallet:

```javascript
const registryWithAiAgent = new ethers.Contract(
  registryV2Address,
  ABI,
  aiAgentWallet
);

const tx = await registryWithAiAgent.registerProducer(
  producerAddress,
  10, // 10 kW system
  80, // 80 kWh daily cap
  'QmExampleIPFSHash'
);

await tx.wait();
console.log('Producer registered successfully!');
```

---

## 🆘 Troubleshooting

### "Invalid MintingController address" during deployment

**Cause:** You entered `0x0000000000000000000000000000000000000000` (zero address)

**Fix:** Either use a real MintingController address or use `0x0000000000000000000000000000000000000001` as a placeholder, then grant roles later.

### "AccessControl: account is missing role" when trying to register

**Cause:** The AI Agent doesn't have OPERATOR_ROLE (shouldn't happen with RegistryV2!)

**Fix:** Check that you deployed RegistryV2 (not Registry) with the correct AI Agent address in constructor.

### Can't find RegistryV2 in thirdweb deploy list

**Cause:** Contract not compiled or thirdweb can't find it

**Fix:**
1. Run `forge build` first
2. Make sure you're in the contracts directory
3. Check that `RegistryV2.sol` exists in `contracts/src/`

---

## 📚 Next Steps

After deploying RegistryV2:

1. ✅ Update frontend contract addresses
2. ✅ Test producer registration via AI Agent
3. ✅ Test production minting via MintingController
4. ✅ Run full integration test
5. ✅ Update documentation with new addresses

**Need help?** Check [ROLE_GRANTING_GUIDE.md](ROLE_GRANTING_GUIDE.md) for role management.
