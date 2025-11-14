# SOLR-ARC Quick Reference Card

## 🎯 Your Mission
Get a working demo with wallet `0xd513C04FB43499Fa463451FFbF0f43eb48afF8B8`

---

## 📦 Contract Addresses

```
sARC Token:      0x9604ad29C8fEe0611EcE73a91e192E5d976E2184
RegistryV2:      0xc9559c5884e53548b3d2362aa694b64519d291ee
Treasury:        0x8825518674A89e28d2C11CA0Ec49024ef6e1E2b2
MintingController:0xf84748FDDeE07b4d4d483c6291D0D3E97aD61d00
```

## 👤 Wallets

```
Demo/Deployer:   0xd513C04FB43499Fa463451FFbF0f43eb48afF8B8
AI Agent:        0xE1d71CF21De70D144104423077ee7c0B5CFD5284
```

## 🔑 Role Hashes

```
OPERATOR_ROLE:       0x97667070c54ef182b0f5858b034beac1b6f3089aa2d3188bb1e8929f4fa9b929
MINTER_ROLE:         0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6
DEFAULT_ADMIN_ROLE:  0x0000000000000000000000000000000000000000000000000000000000000000
```

---

## ⚡ Quick Commands

### Deploy MintingController
```bash
cd contracts && npx thirdweb deploy
```

### Grant Roles (replace NEW_MC with your address)
```bash
# On sARC
node grant-role-api.cjs 0x9604ad29C8fEe0611EcE73a91e192E5d976E2184 0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6 NEW_MC

# On RegistryV2
node grant-role-api.cjs 0xc9559c5884e53548b3d2362aa694b64519d291ee 0x97667070c54ef182b0f5858b034beac1b6f3089aa2d3188bb1e8929f4fa9b929 NEW_MC

# AI Agent MINTER on MC
node grant-role-api.cjs NEW_MC 0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6 0xE1d71CF21De70D144104423077ee7c0B5CFD5284

# AI Agent OPERATOR on MC
node grant-role-api.cjs NEW_MC 0x97667070c54ef182b0f5858b034beac1b6f3089aa2d3188bb1e8929f4fa9b929 0xE1d71CF21De70D144104423077ee7c0B5CFD5284
```

### Deploy Worker
```bash
cd workers/pog-agent
cp wrangler.toml.example wrangler.toml
# Edit wrangler.toml with new MC address
wrangler secret put AI_AGENT_PRIVATE_KEY
wrangler secret put PINATA_JWT
wrangler secret put NREL_API_KEY
wrangler deploy
# Copy URL to .env.local as VITE_POG_AGENT_URL
```

### Register Demo Wallet
```bash
node register-demo.cjs
```

### Start Frontend
```bash
npm run dev
```

---

## 🔗 Important Links

- **Faucet**: https://faucet.circle.com
- **Explorer**: https://testnet.arcscan.app
- **thirdweb**: https://thirdweb.com/dashboard

---

## 📝 Files to Update

1. `src/lib/constants.ts` - MINTING_CONTROLLER address
2. `src/lib/contracts.ts` - MINTING_CONTROLLER address
3. `workers/pog-agent/wrangler.toml` - MINTING_CONTROLLER_ADDRESS
4. `.env.local` - VITE_POG_AGENT_URL

---

## ✅ Success Checklist

- [ ] Deploy new MintingController
- [ ] Update frontend config files
- [ ] Grant 4 roles (2 on MC, 2 to AI Agent)
- [ ] Deploy PoG worker
- [ ] Update .env.local with worker URL
- [ ] Register demo wallet
- [ ] Fund Treasury (100 USDC)
- [ ] Fund AI Agent (5 USDC)
- [ ] Test mint
- [ ] Test redeem

---

## 🆘 Troubleshooting

| Problem | Solution |
|---------|----------|
| Role grant fails | Check DEPLOYER_PRIVATE_KEY & THIRDWEB_SECRET_KEY in .env.local |
| Worker deploy fails | Run `wrangler login` first |
| Mint fails | Check worker URL, AI Agent gas, roles |
| Redeem fails | Check Treasury USDC balance |

---

## ⏱️ Total Time: ~1.5 hours

**Start with NEXT_STEPS.md for detailed walkthrough!**
