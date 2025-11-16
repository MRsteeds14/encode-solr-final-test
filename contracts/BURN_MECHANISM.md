# 🔥 SARCToken Burn Mechanism & Tokenomics

## Overview

The new **SARCToken** implements a **deflationary proof-of-generation model**:

- ✅ **Mint on Generation**: New sARC tokens are minted when solar energy is verified
- ✅ **Burn on Redemption**: sARC tokens are permanently destroyed when redeemed for USDC
- ✅ **Supply = Unredeemed Energy**: Total supply always represents solar energy not yet redeemed

## How Token Burning Works

### ❌ **Old System (Pre-Burn)**
```
1. User produces 10 kWh solar → Mints 10 sARC
2. User redeems 10 sARC for $1 USDC → sARC sits in Treasury
3. Treasury accumulates sARC forever → Supply never decreases
4. Problem: Total supply disconnected from actual unredeemed energy
```

### ✅ **New System (With Burn)**
```
1. User produces 10 kWh solar → Mints 10 sARC
   - Total supply: 10 sARC
   
2. User redeems 5 sARC for $0.50 USDC → 5 sARC BURNED
   - Total supply: 5 sARC (reduced!)
   
3. Supply always equals unredeemed energy
   - 5 sARC remaining = 5 kWh of energy not yet redeemed
```

## How Burning Happens (Technical)

### Step 1: Treasury Receives sARC
```solidity
// User approves Treasury to spend their sARC
sarcToken.approve(treasuryAddress, amount);

// Treasury transfers sARC from user
sarcToken.safeTransferFrom(msg.sender, address(this), _sarcAmount);
```

### Step 2: Treasury Burns sARC
```solidity
// Treasury calls burnFrom() on SARCToken
ISARCToken(address(sarcToken)).burnFrom(address(this), _sarcAmount);

// This permanently destroys tokens:
// - Reduces totalSupply() by _sarcAmount
// - Reduces Treasury balance to 0
// - Tokens can NEVER be recovered
```

### Step 3: User Receives USDC
```solidity
// Calculate USDC amount (e.g., 10 sARC * $0.10 = $1.00)
uint256 usdcAmount = (_sarcAmount * usdcPerKwh) / 1e18;

// Send USDC to user
usdcToken.safeTransfer(msg.sender, usdcAmount);
```

## Role-Based Access Control

| Contract | Role | Purpose |
|----------|------|---------|
| **SARCToken** | `MINTER_ROLE` | Can call `mint()` to create new tokens |
| **SARCToken** | `BURNER_ROLE` | Can call `burnFrom()` to destroy tokens |
| **SARCToken** | `DEFAULT_ADMIN_ROLE` | Can grant/revoke roles, pause contract |

### Who Has What Roles?

```
SARCToken (0xNEW_ADDRESS_AFTER_DEPLOYMENT)
  ├─ MINTER_ROLE
  │   ├─ MintingController (0xf84748fddee07b4d4d483c6291d0d3e97ad61d00)
  │   └─ AI Agent (0xE1d71CF21De70D144104423077ee7c0B5CFD5284)
  │
  ├─ BURNER_ROLE
  │   └─ Treasury (0x8825518674A89e28d2C11CA0Ec49024ef6e1E2b2)
  │
  └─ DEFAULT_ADMIN_ROLE
      └─ Deployer (your wallet)
```

## Deployment Process

### Step 1: Compile Contracts
```bash
cd contracts
forge build
```

### Step 2: Deploy New SARCToken
```bash
node contracts/scripts/deploy-sarc-token.cjs
```

This script will:
1. ✅ Deploy `SARCToken.sol` to Arc Testnet
2. ✅ Grant `MINTER_ROLE` to `MintingController`
3. ✅ Grant `BURNER_ROLE` to `Treasury`
4. ✅ Grant `MINTER_ROLE` to `AI Agent`
5. ✅ Update `.env.local` with new token address

### Step 3: Update Contracts to Use New Token

**Option A: If MintingController/Treasury have setToken() functions:**
```bash
# Update MintingController
cast send 0xf84748fddee07b4d4d483c6291d0d3e97ad61d00 \
  "setToken(address)" NEW_TOKEN_ADDRESS \
  --private-key YOUR_DEPLOYER_KEY \
  --rpc-url https://rpc.testnet.arc.network

# Update Treasury
cast send 0x8825518674A89e28d2C11CA0Ec49024ef6e1E2b2 \
  "setToken(address)" NEW_TOKEN_ADDRESS \
  --private-key YOUR_DEPLOYER_KEY \
  --rpc-url https://rpc.testnet.arc.network
```

**Option B: If contracts are immutable (token address in constructor):**
You'll need to redeploy `MintingController` and `Treasury` with the new token address.

### Step 4: Test the System
```bash
# Restart frontend
npm run dev

# Test minting
# - Register a system
# - Mint some energy
# - Balance should update immediately

# Test redemption with burn
# - Redeem sARC for USDC
# - Check totalSupply decreased: cast call NEW_TOKEN_ADDRESS "totalSupply()" --rpc-url https://rpc.testnet.arc.network
```

## Verifying Burns On-Chain

### Check Total Supply
```bash
cast call YOUR_SARC_TOKEN_ADDRESS \
  "totalSupply()" \
  --rpc-url https://rpc.testnet.arc.network
```

### Check Treasury Balance (Should be 0 after burn)
```bash
cast call YOUR_SARC_TOKEN_ADDRESS \
  "balanceOf(address)" 0x8825518674A89e28d2C11CA0Ec49024ef6e1E2b2 \
  --rpc-url https://rpc.testnet.arc.network
```

### Monitor Burn Events
```bash
cast logs \
  --address YOUR_SARC_TOKEN_ADDRESS \
  --rpc-url https://rpc.testnet.arc.network \
  "TokensBurned(address indexed from, uint256 amount, address indexed burner)"
```

## Tokenomics Summary

### Supply Dynamics
```
Initial State:
  Total Supply = 0 sARC
  Circulating Supply = 0 sARC

After User A produces 100 kWh:
  Total Supply = 100 sARC (minted)
  Circulating Supply = 100 sARC
  User A Balance = 100 sARC

After User A redeems 40 sARC:
  Total Supply = 60 sARC (40 burned)
  Circulating Supply = 60 sARC
  User A Balance = 60 sARC
  User A USD Balance = +$4.00

After User B produces 50 kWh:
  Total Supply = 110 sARC (60 existing + 50 new)
  Circulating Supply = 110 sARC
  User A Balance = 60 sARC
  User B Balance = 50 sARC
```

### Key Properties
- ✅ **1 sARC always = 1 kWh** of verified solar energy
- ✅ **Supply never exceeds total unredeemed energy**
- ✅ **Deflationary pressure** (redemptions reduce supply)
- ✅ **Transparent on-chain** (all burns visible in events)
- ✅ **No pre-mine** (all tokens minted from verified generation)

## What Happens to Old Token?

### Old Token: `0x9604ad29C8fEe0611EcE73a91e192E5d976E2184`
- 🏦 **1 Billion sARC** at wallet `0xd513c04fb43499fa463451ffbf0f43eb48aff8b8`
- ⚠️ **No longer used** by your system
- 💡 **Options:**
  1. **Ignore it** - Just deploy new token, abandon old one
  2. **Burn it** - Send to 0x000...dead address (locked forever)
  3. **Keep as backup** - Emergency liquidity if needed

**Recommendation**: Ignore it. Your new system doesn't need it.

## FAQ

### Q: Can burned tokens be recovered?
**A**: No. Burning permanently destroys tokens by reducing `totalSupply` and removing from all balances.

### Q: Does burning send tokens to address(0)?
**A**: No. ERC20's internal `_burn()` function directly reduces balance and supply without transferring.

### Q: Who can burn tokens?
**A**: Only addresses with `BURNER_ROLE` (Treasury) OR token holders burning their own tokens via `burn()`.

### Q: What if Treasury doesn't have BURNER_ROLE?
**A**: The `burnFrom()` call will revert with "AccessControl: account missing role".

### Q: Can users burn their own tokens?
**A**: Yes, via the public `burn(uint256 amount)` function (doesn't require BURNER_ROLE).

### Q: Why does Treasury need both transfer AND burn?
**A**: 
1. `transferFrom()` - Moves tokens from user to Treasury
2. `burnFrom()` - Burns tokens FROM Treasury's balance
3. This prevents Treasury from accumulating sARC

### Q: How do I verify a burn happened?
**A**: Check transaction logs for `TokensBurned` event OR check `totalSupply()` before/after redemption.

## Security Considerations

### ✅ **Protected**
- Burn function requires `BURNER_ROLE` (only Treasury)
- Mint function requires `MINTER_ROLE` (only MintingController/AI)
- Admin can pause contract in emergency
- No backdoors or owner minting

### ⚠️ **Risks**
- If deployer loses private key, roles can't be updated
- If Treasury private key is compromised, attacker can't mint (only burn)
- Recommendation: Transfer `DEFAULT_ADMIN_ROLE` to multisig after testing

## Next Steps

1. ✅ **Deploy New SARCToken** - `node contracts/scripts/deploy-sarc-token.cjs`
2. ✅ **Update Frontend** - `.env.local` already updated by script
3. ✅ **Test Minting** - Should update balances immediately
4. ✅ **Test Redemption** - Verify tokens are burned (check `totalSupply`)
5. ✅ **Monitor On-Chain** - Watch for `TokensBurned` events

## Contract Addresses

### New System (With Burn)
```
SARCToken: [Deploy with script]
RegistryV2: 0xc9559c5884e53548b3d2362aa694b64519d291ee
MintingController: 0xf84748fddee07b4d4d483c6291d0d3e97ad61d00
Treasury: 0x8825518674A89e28d2C11CA0Ec49024ef6e1E2b2
USDC: 0x3600000000000000000000000000000000000000
```

### Old System (Abandoned)
```
Old sARC Token: 0x9604ad29C8fEe0611EcE73a91e192E5d976E2184
Holder Wallet: 0xd513c04fb43499fa463451ffbf0f43eb48aff8b8
Balance: 1,000,000,000 sARC (unused)
```

## Support

If you encounter issues:
1. Check role grants: `cast call TOKEN "hasRole(bytes32,address)" ROLE ACCOUNT --rpc-url ...`
2. Check transaction logs: Look for revert reasons
3. Verify contract addresses in `.env.local`
4. Test with small amounts first

---

**Last Updated**: 2025-11-16  
**Version**: 1.0 (Deflationary Model with Burn Mechanism)
