# 📋 Architecture Decisions & Answers

## Your Questions & Final Decisions

### **Q1: How do I burn tokens?**

**Answer**: You have two options:

1. **❌ Send to Dead Address** (Not recommended)
   ```solidity
   token.transfer(0x000000000000000000000000000000000000dead, amount);
   ```
   - Tokens are locked forever but still count in `totalSupply()`
   - Not true burning

2. **✅ Use burn() Function** (Recommended - what we implemented)
   ```solidity
   token.burnFrom(address, amount);
   ```
   - Permanently destroys tokens
   - Reduces `totalSupply()` 
   - This is what Treasury now does on redemption

**Your Decision**: ✅ **Burn on redemption** (deflationary model)

---

### **Q2: Should AI Agent have MINTER_ROLE?**

**Answer**: YES - this is the recommended approach.

**Why**:
- ✅ Enables autonomous minting via PoG Agent Worker
- ✅ Faster transactions (no need to route through MintingController every time)
- ✅ Better tokenomics (direct mint from validation)
- ✅ Separates validation logic from contract interactions

**Your Decision**: ✅ **AI Agent gets MINTER_ROLE**

**Implementation**:
```
SARCToken Roles:
  ├─ MINTER_ROLE
  │   ├─ MintingController (0xf84748fddee07b4d4d483c6291d0d3e97ad61d00)
  │   └─ AI Agent (0xE1d71CF21De70D144104423077ee7c0B5CFD5284) ✅ NEW
  │
  ├─ BURNER_ROLE
  │   └─ Treasury (NEW_ADDRESS_AFTER_DEPLOY)
  │
  └─ DEFAULT_ADMIN_ROLE
      └─ Deployer (your wallet)
```

---

### **Q3: Should deployer keep admin role or transfer to multisig?**

**Answer**: Keep admin role for now, consider multisig later.

**Recommendation**:
- ✅ **Development/Testing**: Deployer keeps `DEFAULT_ADMIN_ROLE`
- ⏳ **Production**: Transfer to multisig or DAO

**Why Keep Admin Role Now**:
- Faster iteration during hackathon
- Can pause contracts in emergency
- Can grant/revoke roles as needed
- Easy to transfer later

**Your Decision**: ✅ **Deployer keeps admin role**

**Future Migration Path** (when ready for production):
```bash
# Transfer admin to multisig
cast send YOUR_SARC_TOKEN \
  "grantRole(bytes32,address)" \
  0x0000000000000000000000000000000000000000000000000000000000000000 \
  MULTISIG_ADDRESS \
  --private-key YOUR_KEY \
  --rpc-url https://rpc.testnet.arc.network

# Renounce your admin role
cast send YOUR_SARC_TOKEN \
  "renounceRole(bytes32,address)" \
  0x0000000000000000000000000000000000000000000000000000000000000000 \
  YOUR_ADDRESS \
  --private-key YOUR_KEY \
  --rpc-url https://rpc.testnet.arc.network
```

---

## Final System Architecture

### **Tokenomics Model**: Deflationary Proof-of-Generation

```
┌─────────────────────────────────────────────────────────────┐
│                    Proof-of-Generation Cycle                 │
└─────────────────────────────────────────────────────────────┘

1. Solar Production
   └─> User produces 10 kWh solar energy
   
2. Validation
   └─> PoG Agent validates claim (NREL API check)
   
3. Minting (Inflationary)
   └─> AI Agent mints 10 sARC tokens
   └─> Total Supply: +10 sARC
   └─> User Balance: +10 sARC
   
4. Redemption (Deflationary)
   └─> User redeems 5 sARC for $0.50 USDC
   └─> Treasury burns 5 sARC tokens
   └─> Total Supply: -5 sARC (net: 5 sARC)
   └─> User Balance: 5 sARC + $0.50 USDC

Result: Total Supply = Unredeemed Energy (5 sARC = 5 kWh)
```

### **Smart Contract Roles**

| Role | Who Has It | Purpose |
|------|-----------|---------|
| `DEFAULT_ADMIN_ROLE` | Deployer | Can grant/revoke all roles, pause contracts |
| `MINTER_ROLE` | MintingController + AI Agent | Can mint new sARC tokens |
| `BURNER_ROLE` | Treasury | Can burn sARC tokens on redemption |
| `OPERATOR_ROLE` | MintingController + AI Agent | Can call Registry functions |

### **Contract Addresses** (After Redeployment)

```bash
# New Contracts (With Burn)
SARCToken: [Deploy with script]
Treasury: [Deploy with script]

# Existing Contracts (Reused)
RegistryV2: 0xc9559c5884e53548b3d2362aa694b64519d291ee
MintingController: 0xf84748fddee07b4d4d483c6291d0d3e97ad61d00 (may need redeploy)

# System Wallets
AI Agent: 0xE1d71CF21De70D144104423077ee7c0B5CFD5284
Deployer: [Your wallet]

# Utilities
USDC (Arc Testnet): 0x3600000000000000000000000000000000000000
```

---

## What Happens to Old Assets?

### **Old sARC Token** (`0x9604ad29C8fEe0611EcE73a91e192E5d976E2184`)
- **1 Billion sARC** at wallet `0xd513c04fb43499fa463451ffbf0f43eb48aff8b8`
- **Status**: Abandoned (no longer used by your system)
- **Recommendation**: Leave it alone, focus on new token

### **Old Treasury** (`0x8825518674A89e28d2C11CA0Ec49024ef6e1E2b2`)
- **10,010 USDC** balance
- **Status**: Will be replaced with new Treasury
- **Action Required**: 
  1. Withdraw USDC from old Treasury (if possible)
  2. Fund new Treasury with USDC

```bash
# Withdraw from old Treasury (if you have admin role)
cast send 0x8825518674A89e28d2C11CA0Ec49024ef6e1E2b2 \
  "emergencyWithdrawUSDC(address,uint256)" \
  YOUR_ADDRESS \
  10010000000000000000000 \
  --private-key YOUR_KEY \
  --rpc-url https://rpc.testnet.arc.network

# Fund new Treasury
cast send 0x3600000000000000000000000000000000000000 \
  "approve(address,uint256)" \
  NEW_TREASURY_ADDRESS \
  10010000000000000000000 \
  --private-key YOUR_KEY \
  --rpc-url https://rpc.testnet.arc.network

cast send NEW_TREASURY_ADDRESS \
  "fundTreasury(uint256)" \
  10010000000000000000000 \
  --private-key YOUR_KEY \
  --rpc-url https://rpc.testnet.arc.network
```

---

## Deployment Checklist

### Phase 1: Deploy New Contracts
- [ ] Compile contracts: `cd contracts && forge build`
- [ ] Run deployment: `node contracts/scripts/redeploy-system.cjs`
- [ ] Verify SARCToken deployed
- [ ] Verify Treasury deployed
- [ ] Verify roles granted correctly

### Phase 2: Update MintingController
- [ ] Option A: Redeploy with new token address
- [ ] Option B: Add `setToken()` function and update

### Phase 3: Fund Treasury
- [ ] Withdraw USDC from old Treasury
- [ ] Approve new Treasury to spend USDC
- [ ] Call `fundTreasury()` with 10,010 USDC

### Phase 4: Testing
- [ ] Restart frontend: `npm run dev`
- [ ] Test minting (balance updates immediately)
- [ ] Test redemption (tokens are burned)
- [ ] Verify `totalSupply()` decreases after redemption
- [ ] Check Profile tab shows correct system data

### Phase 5: Verification
- [ ] Verify MintingController has MINTER_ROLE
- [ ] Verify Treasury has BURNER_ROLE
- [ ] Verify AI Agent has MINTER_ROLE
- [ ] Check burn events on block explorer

---

## Why This Architecture Works

### **Problem: Pre-Minted Supply Model**
```
❌ 1 Billion tokens pre-minted
❌ Tokens distributed from supply wallet
❌ No connection between minting and solar generation
❌ Supply never decreases
❌ Not a true "proof-of-generation" token
```

### **Solution: On-Demand Mint + Burn Model**
```
✅ Tokens minted ONLY when solar energy is verified
✅ 1 sARC always = 1 kWh of verified energy
✅ Tokens burned on redemption (deflationary)
✅ Total supply = Total unredeemed energy
✅ True proof-of-generation tokenomics
```

### **Benefits**
1. **Transparency**: Supply always matches actual energy
2. **Scarcity**: Redemptions reduce supply
3. **Integrity**: Can't mint without verified generation
4. **Auditability**: All mints/burns visible on-chain
5. **Scalability**: No supply cap (mint as needed)

---

## Security Considerations

### **Access Control**
- ✅ Only AI Agent + MintingController can mint
- ✅ Only Treasury can burn (redemption only)
- ✅ Deployer can pause in emergency
- ✅ Roles can be revoked if compromised

### **Circuit Breakers**
- ✅ MintingController has daily mint limit
- ✅ Registry validates production claims
- ✅ Treasury requires sufficient USDC balance
- ✅ Contracts can be paused by admin

### **Audit Recommendations** (Before Production)
1. Add rate limiting on minting
2. Implement multi-sig for admin role
3. Add time-lock for role changes
4. External security audit
5. Bug bounty program

---

## Next Steps

### Immediate (Today)
1. ✅ Review architecture decisions (this document)
2. ⏳ Deploy new SARCToken + Treasury
3. ⏳ Update/redeploy MintingController
4. ⏳ Test minting and burning

### Short-term (This Week)
1. Fund Treasury with USDC
2. Register test producers
3. Test complete mint → redeem flow
4. Verify Profile display issue

### Long-term (Production)
1. Transfer admin role to multisig
2. External security audit
3. Mainnet deployment
4. Community governance

---

## Support & Documentation

- **Burn Mechanism Details**: `contracts/BURN_MECHANISM.md`
- **Quick Start Guide**: `contracts/DEPLOY_QUICKSTART.md`
- **Deployment Script**: `contracts/scripts/redeploy-system.cjs`
- **Role Granting**: `grant-roles.cjs`

**Questions?** Check the documentation or run:
```bash
node check-role.cjs  # Verify role grants
cast interface YOUR_CONTRACT --rpc-url https://rpc.testnet.arc.network  # Check functions
```

---

**Last Updated**: 2025-11-16  
**Architecture**: Deflationary Proof-of-Generation  
**Status**: Ready for deployment
