# 🏗️ Circle Wallet Architecture Guide

## Overview

This app uses **Circle Developer-Controlled Wallets** with a custom **User Registry System** to provide persistent wallet access without requiring users to manage private keys.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER FLOW                                │
└─────────────────────────────────────────────────────────────────┘

1. User enters email/username
            ↓
2. Check User Registry (localStorage)
            ↓
    ┌───────────────────┐
    │ User exists?      │
    └───────────────────┘
         ↙          ↘
      YES            NO
       ↓              ↓
  Load wallet    Create wallet via Circle API
       ↓              ↓
  Show Dashboard    Register in User Registry
                      ↓
                 Show Dashboard


┌─────────────────────────────────────────────────────────────────┐
│                    TECHNICAL STACK                               │
└─────────────────────────────────────────────────────────────────┘

Frontend (React)
├── UserLogin.tsx          → Login/Register UI
├── useCircleWallet.ts     → Wallet state management
└── user-registry.ts       → User ↔ Wallet mapping

Backend (Cloudflare Worker)
├── Circle API calls       → Create wallets
├── Entity Secret          → Controls all wallets
└── Transaction signing    → Signs on behalf of users

Blockchain (Arc Testnet)
└── Smart Contracts        → RegistryV2, Treasury, etc.
```

---

## How It Works

### Developer-Controlled Wallets Explained

**What it means:**
- Your backend (Cloudflare Worker) controls ALL wallet private keys via Circle's API
- Users never see seed phrases or private keys
- You can sign transactions on behalf of users
- Wallets are permanent blockchain addresses

**NOT like traditional Web3:**
- Users don't need MetaMask
- No browser wallet extensions
- No manual transaction signing
- No gas fee management by users

---

## User Registry System

### Storage Location
```typescript
// localStorage key: 'solr_user_registry'
{
  userId: "john@example.com",
  email: "john@example.com",
  walletId: "circle-wallet-id-123",
  walletAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7",
  createdAt: 1699920000000,
  lastLogin: 1699920000000
}
```

### Why We Need This

**Problem:** Circle creates a NEW wallet every time you call `createWallet()`
- No built-in "login" system
- Each connect = new address
- Users lose access to previous wallets

**Solution:** User Registry maps identities to wallets
- Email/Username → Wallet Address (permanent mapping)
- User enters identifier → We load their existing wallet
- One user = One wallet forever

---

## Login Flow (Step-by-Step)

### New User Registration

```typescript
// 1. User enters: "alice@solar.com"
// 2. Check registry - not found
// 3. Call Circle API to create wallet
const wallet = await createWallet("alice@solar.com");
// Returns: { id: "wallet-123", address: "0xABC..." }

// 4. Save to registry
registerUser({
  userId: "alice@solar.com",
  email: "alice@solar.com",
  walletId: "wallet-123",
  walletAddress: "0xABC..."
});

// 5. Save to localStorage for session
localStorage.setItem('circle_wallet', JSON.stringify(wallet));
localStorage.setItem('circle_wallet_user_id', "alice@solar.com");

// 6. User sees dashboard with address 0xABC...
```

### Returning User Login

```typescript
// 1. User enters: "alice@solar.com"
// 2. Check registry - FOUND!
const user = findUser("alice@solar.com");
// Returns: { walletId: "wallet-123", walletAddress: "0xABC..." }

// 3. Load wallet into localStorage (no API call needed)
localStorage.setItem('circle_wallet', JSON.stringify({
  id: user.walletId,
  address: user.walletAddress,
  blockchain: 'ARC-TESTNET',
  state: 'LIVE'
}));

// 4. User sees dashboard with SAME address 0xABC...
```

---

## Cross-Chain Support

### How Circle Wallets Work Across Chains

Circle can create the SAME wallet on multiple blockchains:

```typescript
// When creating wallet, specify multiple chains
const wallet = await circleDeveloperSdk.createWallet({
  walletSetId: WALLET_SET_ID,
  blockchains: [
    'ARC-TESTNET',      // Arc testnet
    'ETH-SEPOLIA',      // Ethereum testnet
    'MATIC-AMOY',       // Polygon testnet
    'AVAX-FUJI',        // Avalanche testnet
  ]
});

// Result: SAME address on all EVM chains
// 0xABC... on Arc
// 0xABC... on Ethereum
// 0xABC... on Polygon
// 0xABC... on Avalanche
```

**Why it works:**
- Same private key → Same address on all EVM chains
- Circle manages the key, creates wallets on each chain
- You control via single wallet ID in Circle API

---

## Security Model

### Who Controls What

| Party | Controls | Can Access |
|-------|----------|------------|
| **User** | Login credentials (email/username) | Dashboard, view transactions |
| **Your Backend** | Private keys (via Circle) | Sign transactions, create wallets |
| **Circle** | Key storage (encrypted MPC) | Nothing without your Entity Secret |

### Security Features

✅ **Entity Secret Protection**
- Stored in Cloudflare Worker environment variables
- Never exposed to frontend
- Required for all Circle API calls

✅ **User Session Management**
- localStorage tracks current user
- No passwords (for demo - can add later)
- Logout clears session data

✅ **Transaction Signing**
- Backend signs with Circle API
- Frontend sends transaction params
- User approves via UI (not cryptographic signature)

---

## Code Architecture

### Frontend Files

```
src/
├── components/wallet/
│   ├── UserLogin.tsx              → Login/Register modal
│   └── WalletButton.tsx           → Shows wallet or login button
├── hooks/
│   └── useCircleWallet.ts         → Wallet state management
└── lib/
    └── user-registry.ts           → User ↔ Wallet mapping
```

### Backend Files

```
workers/circle-dev-wallet/
└── index.ts                       → Circle API endpoints
    ├── POST /api/wallets/create   → Create new wallet
    ├── GET  /api/wallets/:id      → Get wallet details
    └── POST /api/transactions/sign → Sign transactions
```

---

## API Flow

### Creating a Wallet

```
Frontend                 Worker                    Circle API
========                 ======                    ==========

createWallet("user")
     ↓
     POST /api/wallets/create
     { walletSetId, userId, blockchains }
                          ↓
                          POST /wallets/create
                          + Entity Secret in headers
                                                    ↓
                                                    Create wallet keys (MPC)
                                                    Return wallet ID & address
                          ↓
                          { id, address, blockchain }
     ↓
Store in localStorage
Show dashboard
```

### Signing a Transaction

```
Frontend                 Worker                    Circle API
========                 ======                    ==========

Register solar system
     ↓
signAndSendTransaction(walletId, contract, function, args)
     ↓
     POST /api/transactions/sign
     { walletId, transaction: { to, data, value } }
                          ↓
                          POST /transactions/contractExecution
                          + Entity Secret in headers
                                                    ↓
                                                    Sign with private key (MPC)
                                                    Broadcast to blockchain
                                                    Return tx hash
                          ↓
                          { txHash, transaction }
     ↓
Poll Circle API for status
INITIATED → SENT → CONFIRMED → COMPLETE
```

---

## Comparison: Developer vs User-Controlled

| Feature | Developer-Controlled (You Have) | User-Controlled (Alternative) |
|---------|--------------------------------|-------------------------------|
| **Key Storage** | Backend via Circle | User's device |
| **Authentication** | Custom (email/username) | PIN/Biometrics required |
| **User Experience** | Seamless, no crypto knowledge | Must set PIN, manage security |
| **Recovery** | You control (can always access) | User must remember PIN/recovery |
| **Implementation** | Simple backend API calls | Complex SDK integration |
| **Gas Sponsorship** | Easy (you sign everything) | Requires separate setup |
| **Use Case** | Enterprise, custodial apps | Consumer wallets |
| **Best For** | Your hackathon demo! | Production consumer apps |

---

## Production Considerations

### Current Demo Setup (Sufficient for Hackathon)

✅ User Registry in localStorage
✅ Simple email/username login
✅ Instant wallet access
✅ No passwords required

### Future Production Enhancements

📋 **Backend User Database**
- Move registry from localStorage to PostgreSQL/MongoDB
- Secure user management
- Audit logs

🔐 **Add Authentication**
- Password/PIN for login
- OAuth (Google, GitHub)
- 2FA for security

💾 **Session Management**
- JWT tokens
- Secure session storage
- Auto-logout on inactivity

🔄 **Wallet Recovery**
- Email verification
- Security questions
- Admin recovery process

---

## Troubleshooting

### User can't login

**Check:**
1. Is identifier exactly the same? (case-insensitive)
2. Registry exists in localStorage? (`localStorage.getItem('solr_user_registry')`)
3. Wallet data corrupted? Clear and re-register

### New wallet created on every login

**Cause:** Registry lookup failing
**Fix:** Check `findUser()` logic matches your identifier format

### Wallet address changed

**Cause:** Creating new wallet instead of loading existing
**Fix:** Ensure `loginUser()` is called, not `createWallet()`

---

## FAQ

**Q: Can users access their wallet from another device?**
A: Not currently (localStorage is local). Would need backend database.

**Q: What if user loses their identifier?**
A: You control the wallet, so you can help them recover.

**Q: Can I export the private key?**
A: No, Circle doesn't expose raw private keys. That's the security model.

**Q: How do I add Ethereum support?**
A: Add `'ETH-SEPOLIA'` to `blockchains` array when creating wallet.

**Q: Do I need different wallets for different chains?**
A: No! Same wallet ID works across all chains you specified.

---

## Next Steps

1. ✅ **Test the login flow** - Create account, logout, login again
2. ✅ **Verify persistence** - Same wallet address after login
3. ✅ **Register solar system** - Test full flow with wallet
4. 📋 **Add backend database** - Move registry to server (optional)
5. 🔐 **Add passwords** - Simple auth layer (optional)

---

**Built for:** Encode x Arc DeFi Hackathon  
**Date:** November 16, 2025  
**Architecture:** Circle Developer-Controlled Wallets + Custom User Registry
