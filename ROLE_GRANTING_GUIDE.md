# Role Granting Guide for SOLR-ARC

This guide explains how to grant roles on your smart contracts using two methods: the automated script and the thirdweb API.

## 🎯 Quick Summary

**Problem:** The Registry contract's `registerProducer()` function requires `OPERATOR_ROLE`, but the AI Agent doesn't have this role.

**Solution:** Grant `OPERATOR_ROLE` to the AI Agent on the Registry contract using one of two methods below.

---

## Method 1: Automated Script (Recommended)

The `grant-roles.cjs` script now includes the missing role grant.

### Prerequisites

1. Add your deployer private key to `.env.local`:
   ```bash
   DEPLOYER_PRIVATE_KEY=0xYourPrivateKeyHere
   ```

2. Ensure you have Arc Testnet USDC for gas:
   - Get from: https://faucet.circle.com

### Run the Script

```bash
node grant-roles.cjs
```

The script will:
1. ✅ Grant MINTER_ROLE to MintingController on sARC Token
2. ✅ Grant OPERATOR_ROLE to MintingController on Registry
3. ✅ Create AI Agent Wallet
4. ✅ Grant MINTER_ROLE to AI Agent on MintingController
5. ✅ Grant OPERATOR_ROLE to AI Agent on MintingController
6. ✅ **Grant OPERATOR_ROLE to AI Agent on Registry** ← NEW!
7. ✅ Save credentials to `.env.local`

---

## Method 2: thirdweb API (For Quick Fixes)

Use this method to grant roles without running the full setup script.

### Prerequisites

1. Get your thirdweb secret key:
   - Go to: https://thirdweb.com/dashboard
   - Navigate to: **Settings** → **API Keys**
   - Create or copy your secret key

2. Add to `.env.local`:
   ```bash
   THIRDWEB_SECRET_KEY=your_secret_key_here
   DEPLOYER_PRIVATE_KEY=0xYourPrivateKeyHere
   ```

### Quick Command

To grant OPERATOR_ROLE to AI Agent on Registry:

```bash
node grant-role-api.js grant-operator-to-ai
```

### Custom Role Grant

To grant any role on any contract:

```bash
node grant-role-api.js <contractAddress> <roleHash> <accountAddress>
```

**Example:**
```bash
node grant-role-api.js \
  0x90b4883040f64aB37678382dE4e0fAa67B1126e1 \
  0x97667070c54ef182b0f5858b034beac1b6f3089aa2d3188bb1e8929f4fa9b929 \
  0xE1d71CF21De70D144104423077ee7c0B5CFD5284
```

### Manual cURL Request

If you prefer to use cURL directly:

```bash
curl -X POST https://api.thirdweb.com/v1/contracts/write \
-H "Content-Type: application/json" \
-H "x-secret-key: YOUR_THIRDWEB_SECRET_KEY" \
-d '{
  "calls": [
    {
      "contractAddress": "0x90b4883040f64aB37678382dE4e0fAa67B1126e1",
      "method": "function grantRole(bytes32 role, address account)",
      "params": [
        "0x97667070c54ef182b0f5858b034beac1b6f3089aa2d3188bb1e8929f4fa9b929",
        "0xE1d71CF21De70D144104423077ee7c0B5CFD5284"
      ]
    }
  ],
  "chainId": 5042002,
  "from": "0xYourAdminWalletAddress"
}'
```

---

## 🔑 Role Reference

### OPERATOR_ROLE
- **Hash:** `0x97667070c54ef182b0f5858b034beac1b6f3089aa2d3188bb1e8929f4fa9b929`
- **Calculation:** `keccak256("OPERATOR_ROLE")`
- **Permissions:**
  - Registry: Can call `registerProducer()`, `updateDailyLimit()`, `recordProduction()`
  - MintingController: Can pause/unpause, adjust limits

### MINTER_ROLE
- **Hash:** `0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6`
- **Calculation:** `keccak256("MINTER_ROLE")`
- **Permissions:**
  - sARC Token: Can mint new tokens
  - MintingController: Can call `mintFromGeneration()`

### DEFAULT_ADMIN_ROLE
- **Hash:** `0x0000000000000000000000000000000000000000000000000000000000000000`
- **Permissions:** Can grant/revoke all roles

---

## 📝 Contract Addresses (Arc Testnet)

| Contract | Address |
|----------|---------|
| **Registry** | `0x90b4883040f64aB37678382dE4e0fAa67B1126e1` |
| **Treasury** | `0x8825518674A89e28d2C11CA0Ec49024ef6e1E2b2` |
| **MintingController** | `0x186c2987F138f3784913e5e42f0cee4512b89C3E` |
| **sARC Token** | `0x9604ad29C8fEe0611EcE73a91e192E5d976E2184` |
| **AI Agent** | `0xE1d71CF21De70D144104423077ee7c0B5CFD5284` |

---

## ✅ Verification

After granting roles, verify they were applied correctly:

```bash
node test-deployment.js
```

This will check all role assignments and report any issues.

---

## 🔧 Troubleshooting

### "AccessControl: account is missing role"

**Cause:** The caller doesn't have the required role.

**Fix:** Grant the role using one of the methods above.

### "Transaction reverted"

**Causes:**
- Your wallet doesn't have DEFAULT_ADMIN_ROLE
- Insufficient gas funds
- Contract is paused

**Fix:**
- Use the deployer wallet that created the contracts
- Get more USDC from: https://faucet.circle.com
- Check contract status with `test-deployment.js`

### "INSUFFICIENT_FUNDS"

**Fix:** Get Arc Testnet USDC from https://faucet.circle.com

---

## 📚 Additional Resources

- **Deployment Guide:** See `DEPLOYMENT_GUIDE.md`
- **Test Deployment:** Run `node test-deployment.js`
- **Arc Testnet Faucet:** https://faucet.circle.com
- **Arc Explorer:** https://testnet.arcscan.app
- **thirdweb Dashboard:** https://thirdweb.com/dashboard

---

## 🎯 Next Steps After Granting Roles

1. **Verify roles:**
   ```bash
   node test-deployment.js
   ```

2. **Register a test producer:**
   - Use the frontend UI
   - Or call `registerProducer()` directly

3. **Test minting:**
   - Submit generation data via the PoG Agent
   - Verify sARC tokens are minted

4. **Test redemption:**
   - Fund the Treasury with USDC
   - Redeem sARC for USDC via the frontend

---

## 📞 Support

If you encounter issues:
1. Check the console output for error messages
2. Verify your environment variables in `.env.local`
3. Ensure you're on Arc Testnet (Chain ID: 5042002)
4. Check your wallet has sufficient USDC for gas
