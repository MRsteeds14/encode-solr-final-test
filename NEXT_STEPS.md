# Next Steps to Complete SOLR-ARC Demo

**Current Status**: Documentation and scripts are ready. You need to execute the deployment steps.

---

## 📋 Quick Start Checklist

Follow these steps in order:

### ✅ Step 1: Deploy New MintingController (~10 min)

```bash
cd contracts
npx thirdweb deploy
```

**In thirdweb dashboard:**
- Select: MintingController
- Network: Arc Testnet (5042002)
- Constructor params:
  - `_registry`: `0xc9559c5884e53548b3d2362aa694b64519d291ee`
  - `_sarcToken`: `0x9604ad29C8fEe0611EcE73a91e192E5d976E2184`
  - `_maxDailyMint`: `100000000000000000000000`
  - `_anomalyThreshold`: `200`

**Save the deployed address!**

---

### ✅ Step 2: Update Frontend Config (~5 min)

Update `src/lib/constants.ts`:
```typescript
MINTING_CONTROLLER: '0xYOUR_NEW_ADDRESS_HERE'
```

Update `src/lib/contracts.ts`:
```typescript
MINTING_CONTROLLER: '0xYOUR_NEW_ADDRESS_HERE'
```

---

### ✅ Step 3: Grant Roles (~10 min)

**Replace `NEW_MC_ADDR` with your new MintingController address:**

```bash
# 1. Grant MINTER_ROLE to MintingController on sARC
node grant-role-api.cjs 0x9604ad29C8fEe0611EcE73a91e192E5d976E2184 0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6 NEW_MC_ADDR

# 2. Grant OPERATOR_ROLE to MintingController on RegistryV2
node grant-role-api.cjs 0xc9559c5884e53548b3d2362aa694b64519d291ee 0x97667070c54ef182b0f5858b034beac1b6f3089aa2d3188bb1e8929f4fa9b929 NEW_MC_ADDR

# 3. Grant MINTER_ROLE to AI Agent on MintingController
node grant-role-api.cjs NEW_MC_ADDR 0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6 0xE1d71CF21De70D144104423077ee7c0B5CFD5284

# 4. Grant OPERATOR_ROLE to AI Agent on MintingController
node grant-role-api.cjs NEW_MC_ADDR 0x97667070c54ef182b0f5858b034beac1b6f3089aa2d3188bb1e8929f4fa9b929 0xE1d71CF21De70D144104423077ee7c0B5CFD5284
```

---

### ✅ Step 4: Deploy PoG Agent Worker (~30 min)

```bash
cd workers/pog-agent

# Copy template
cp wrangler.toml.example wrangler.toml

# Edit wrangler.toml - update MINTING_CONTROLLER_ADDRESS with your new address
# Then set secrets:
wrangler secret put AI_AGENT_PRIVATE_KEY
# (paste from .env.local)

wrangler secret put PINATA_JWT
# (paste from .env.local)

wrangler secret put NREL_API_KEY
# (paste from .env.local)

# Deploy
wrangler deploy

# Copy the worker URL it gives you
```

**Update .env.local** with worker URL:
```bash
VITE_POG_AGENT_URL=https://solr-arc-pog-agent.your-subdomain.workers.dev
```

**Restart frontend:**
```bash
npm run dev
```

---

### ✅ Step 5: Register Demo Wallet (~5 min)

```bash
node register-demo.cjs
```

Or use the frontend registration flow.

---

### ✅ Step 6: Fund Wallets (~10 min)

**Get USDC from faucet:**
https://faucet.circle.com

**Send USDC to:**
1. Treasury: `0x8825518674A89e28d2C11CA0Ec49024ef6e1E2b2` (100 USDC)
2. AI Agent: `0xE1d71CF21De70D144104423077ee7c0B5CFD5284` (5 USDC)

---

### ✅ Step 7: Test Demo! (~20 min)

```bash
npm run dev
```

**Test flow:**
1. Connect wallet `0xd513C04FB43499Fa463451FFbF0f43eb48afF8B8`
2. See dashboard
3. Go to Mint tab → Enter 10 kWh → Submit
4. Wait for PoG Agent to process
5. Verify sARC balance increased
6. Go to Redeem tab → Enter 5 sARC → Approve → Redeem
7. Verify USDC balance increased

---

## 📚 Documentation Files Created

| File | Purpose |
|------|---------|
| **DEMO_SETUP_GUIDE.md** | Complete step-by-step guide with troubleshooting |
| **NEXT_STEPS.md** | Quick checklist (this file) |
| **workers/pog-agent/wrangler.toml.example** | Worker configuration template |
| **register-demo.cjs** | Script to register demo wallet |
| **grant-role-api.cjs** | Script to grant roles via thirdweb API |
| **check-role.cjs** | Script to verify roles are granted |

---

## 🚨 Important Notes

1. **Save your new MintingController address** - you'll need it multiple times
2. **Update wrangler.toml** with the new address before deploying worker
3. **Restart frontend** after updating `.env.local`
4. **Wait for transactions** to confirm (usually 5-30 seconds)
5. **Check worker logs** if minting fails: `cd workers/pog-agent && wrangler tail`

---

## ⏱️ Time Estimate

| Step | Time |
|------|------|
| Deploy MintingController | 10 min |
| Update frontend config | 5 min |
| Grant roles (4 transactions) | 10 min |
| Deploy PoG worker | 30 min |
| Register wallet | 5 min |
| Fund wallets | 10 min |
| Test demo | 20 min |
| **TOTAL** | **~1.5 hours** |

---

## 🆘 Need Help?

1. **Can't deploy contract?**
   - Check you have Arc testnet USDC for gas
   - Verify network is Arc Testnet (5042002)

2. **Role granting fails?**
   - Verify DEPLOYER_PRIVATE_KEY and THIRDWEB_SECRET_KEY in `.env.local`
   - Check deployer wallet has admin role
   - Run `node check-role.cjs` to verify

3. **Worker deployment fails?**
   - Install wrangler: `npm install -g wrangler`
   - Login: `wrangler login`
   - Check Cloudflare account has Workers enabled

4. **Minting fails?**
   - Check worker is deployed and URL is correct
   - Verify AI Agent has gas (USDC on Arc)
   - Check worker logs: `wrangler tail`
   - Verify all roles are granted

5. **Redemption fails?**
   - Check Treasury has USDC balance
   - Verify approval was successful first
   - Check you have sARC to redeem

---

## 🎯 Success Criteria

Your demo is working when:
- ✅ Can connect wallet and see dashboard
- ✅ Can mint sARC by entering kWh amount
- ✅ PoG Agent shows processing status
- ✅ sARC balance increases after minting
- ✅ Can redeem sARC for USDC
- ✅ USDC balance increases after redemption
- ✅ Transaction feed shows all operations

---

**Ready to start? Begin with Step 1!** 🚀

See **DEMO_SETUP_GUIDE.md** for detailed instructions and troubleshooting.
