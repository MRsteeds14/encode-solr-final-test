# 🧪 Circle Wallet Testing Guide

Step-by-step guide to test your Circle User-Controlled Wallets integration.

---

## Prerequisites

Before testing, make sure you have:

- ✅ App ID in `.env.local`
- ✅ Entity Secret in `.env.local`  
- ✅ Circle Wallet Worker deployed to Cloudflare
- ✅ Worker URL in `.env.local` as `VITE_CIRCLE_WALLET_WORKER_URL`
- ✅ Dependencies installed (`npm install`)

---

## 🧪 Test 1: Worker Health Check

Test that your Cloudflare Worker is running:

```bash
# Replace with your worker URL
curl https://circle-wallet-worker.your-account.workers.dev/api/health

# Or test locally first:
cd workers/circle-wallet
wrangler dev --port 8788

# In another terminal:
curl http://localhost:8788/api/health
```

**Expected:** Some response (even if 404, it means worker is running)

---

## 🧪 Test 2: Create a User

Test user creation via your worker:

```bash
# Create test-user.js
cat > test-user.js << 'EOF'
const WORKER_URL = 'https://circle-wallet-worker.your-account.workers.dev';
const userId = `test-user-${Date.now()}`;

async function testCreateUser() {
  console.log('📝 Creating user:', userId);
  
  const response = await fetch(`${WORKER_URL}/api/users/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });
  
  const data = await response.json();
  console.log('✅ Response:', data);
  
  return userId;
}

testCreateUser().catch(console.error);
EOF

# Run test
node test-user.js
```

**Expected output:**
```json
{
  "success": true,
  "data": {
    "user": {
      "userId": "test-user-1234567890",
      "status": "ENABLED",
      "createDate": "2025-11-15T..."
    }
  }
}
```

---

## 🧪 Test 3: Acquire Session Token

```bash
# Create test-session.js
cat > test-session.js << 'EOF'
const WORKER_URL = 'https://circle-wallet-worker.your-account.workers.dev';
const userId = 'test-user-1234567890'; // Use your user from Test 2

async function testSessionToken() {
  console.log('🔑 Getting session token for:', userId);
  
  const response = await fetch(`${WORKER_URL}/api/users/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });
  
  const data = await response.json();
  console.log('✅ Session token acquired');
  console.log('UserToken:', data.userToken?.substring(0, 20) + '...');
  console.log('EncryptionKey:', data.encryptionKey?.substring(0, 20) + '...');
}

testSessionToken().catch(console.error);
EOF

node test-session.js
```

**Expected:** Both `userToken` and `encryptionKey` returned

---

## 🧪 Test 4: Initialize Wallet

```bash
# Create test-wallet.js
cat > test-wallet.js << 'EOF'
const WORKER_URL = 'https://circle-wallet-worker.your-account.workers.dev';
const userId = 'test-user-1234567890'; // Use your user from Test 2

async function testInitWallet() {
  console.log('💳 Initializing wallet for:', userId);
  
  const response = await fetch(`${WORKER_URL}/api/users/initialize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      userId,
      blockchain: 'ARC-TESTNET',
    }),
  });
  
  const data = await response.json();
  console.log('✅ Wallet initialization started');
  console.log('Challenge ID:', data.challengeId);
  
  // Note: You need to complete this challenge in the Web SDK
  // by setting a PIN. This happens in the frontend.
}

testInitWallet().catch(console.error);
EOF

node test-wallet.js
```

**Expected:** `challengeId` returned

**Note:** The challenge must be completed in the browser (PIN setup)

---

## 🧪 Test 5: Frontend Integration Test

1. **Start your dev server:**
   ```bash
   npm run dev
   ```

2. **Open browser:** http://localhost:5173

3. **Open DevTools Console** (F12)

4. **Click "Connect Wallet" button**

5. **Click "Create New Wallet"**

6. **Watch the console logs:**
   ```
   🔧 Step 1: Creating user...
   ✅ User created
   🔧 Step 2: Acquiring session token...
   ✅ Session token acquired
   🔧 Step 3: Initializing wallet on Arc Testnet...
   ✅ Wallet initialization challenge created
   🔧 Step 4: Setting up PIN...
   ```

7. **Circle SDK will prompt you to:**
   - Set a 6-digit PIN
   - Set up recovery questions
   - Confirm your PIN

8. **After completion, you should see:**
   ```
   ✅ PIN setup complete
   🔧 Step 5: Fetching wallet details...
   ✅ Wallet created successfully: { address: '0x...', id: '...' }
   🔧 Step 6: Requesting testnet tokens...
   ✅ Testnet tokens requested
   ```

9. **Your wallet address should appear in the UI**

---

## 🧪 Test 6: Check Wallet Balance

After creating your wallet, check if testnet tokens arrived:

```bash
# Create test-balance.js
cat > test-balance.js << 'EOF'
const { ethers } = require('ethers');

const WALLET_ADDRESS = '0xYourWalletAddressHere'; // From Test 5
const ARC_RPC = 'https://rpc.testnet.arc.network';

async function checkBalance() {
  const provider = new ethers.JsonRpcProvider(ARC_RPC);
  
  // Check native USDC balance (Arc's native token)
  const balance = await provider.getBalance(WALLET_ADDRESS);
  console.log('💰 Balance:', ethers.formatUnits(balance, 6), 'USDC');
  
  // Check if wallet exists
  const code = await provider.getCode(WALLET_ADDRESS);
  console.log('📝 Wallet type:', code === '0x' ? 'EOA' : 'Smart Contract');
}

checkBalance().catch(console.error);
EOF

npm install ethers
node test-balance.js
```

**Expected:** Balance > 0 USDC (from testnet faucet)

---

## 🧪 Test 7: Integration with Smart Contracts

Test calling your existing smart contracts with Circle wallet:

```typescript
// In your browser console (DevTools)

// Get wallet from Circle hook
const wallet = useCircleWallet();

// Check if connected
console.log('Connected:', wallet.isConnected);
console.log('Address:', wallet.address);

// Try reading from your Registry contract
const { ethers } = require('ethers');
const provider = new ethers.JsonRpcProvider('https://rpc.testnet.arc.network');
const registryAddress = '0xc9559c5884e53548b3d2362aa694b64519d291ee';

const registryAbi = [
  'function isWhitelisted(address producer) view returns (bool)',
];

const registry = new ethers.Contract(registryAddress, registryAbi, provider);
const isWhitelisted = await registry.isWhitelisted(wallet.address);

console.log('Is whitelisted:', isWhitelisted);
```

---

## 🧪 Test 8: Send a Test Transaction

Test sending USDC to another address:

```typescript
// In browser console

const wallet = useCircleWallet();

// Send 0.1 USDC to yourself (test transaction)
const tx = await wallet.sendTransaction(
  wallet.address, // Send to yourself
  '100000', // 0.1 USDC (6 decimals)
  'your-usdc-token-id' // Get this from wallet balance API
);

console.log('Transaction:', tx);
```

**Expected:** PIN prompt appears, transaction completes after PIN entry

---

## 🎯 Success Criteria

All tests should pass:

- ✅ Worker responds to API calls
- ✅ User creation works
- ✅ Session tokens generated
- ✅ Wallet initialization creates challenge
- ✅ Frontend PIN setup completes
- ✅ Wallet receives testnet tokens
- ✅ Balance check shows USDC
- ✅ Smart contract reads work
- ✅ Transactions can be sent

---

## 🐛 Common Issues & Fixes

### Issue: "App ID is missing"

**Fix:**
```bash
# Check .env.local
cat .env.local | grep VITE_CIRCLE_APP_ID

# Should show:
VITE_CIRCLE_APP_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# If empty, get from: https://console.circle.com/wallets/user/configurator
```

### Issue: "Worker returns 500 error"

**Fix:**
```bash
# Check worker logs
wrangler tail circle-wallet-worker

# Verify secrets are set
wrangler secret list

# Should show:
# - CIRCLE_API_KEY
# - CIRCLE_ENTITY_SECRET

# If missing, set them:
wrangler secret put CIRCLE_API_KEY
wrangler secret put CIRCLE_ENTITY_SECRET
```

### Issue: "PIN dialog doesn't appear"

**Fix:**
```javascript
// Check if SDK is initialized
import { circleSDK } from './lib/circle-sdk';
console.log('SDK:', circleSDK);

// Should not be null
// If null, check VITE_CIRCLE_APP_ID in .env.local
```

### Issue: "No testnet tokens received"

**Fix:**
```bash
# Manually request tokens via API
curl -X POST https://circle-wallet-worker.your-account.workers.dev/api/faucet \
  -H "Content-Type: application/json" \
  -d '{"address":"0xYourWalletAddress","blockchain":"ARC-TESTNET"}'

# Or use Arc faucet directly:
# https://faucet.circle.com
```

### Issue: "CORS errors in browser"

**Fix:**
```bash
# Verify worker URL in .env.local matches deployed URL
echo $VITE_CIRCLE_WALLET_WORKER_URL

# Restart dev server
npm run dev
```

---

## 📊 Test Results Template

Use this template to track your tests:

```
Circle Wallet Testing Checklist
================================
Date: ___________
Tester: ___________

[ ] Test 1: Worker Health Check - PASS/FAIL
[ ] Test 2: Create User - PASS/FAIL
[ ] Test 3: Session Token - PASS/FAIL
[ ] Test 4: Initialize Wallet - PASS/FAIL
[ ] Test 5: Frontend Integration - PASS/FAIL
[ ] Test 6: Check Balance - PASS/FAIL
[ ] Test 7: Smart Contract Integration - PASS/FAIL
[ ] Test 8: Send Transaction - PASS/FAIL

Notes:
_________________________________
_________________________________
```

---

## 🎉 All Tests Passed?

**Congratulations!** Your Circle User-Controlled Wallets are fully integrated!

Next steps:
1. Replace Thirdweb wallet UI throughout the app
2. Update all contract interaction hooks
3. Test with your solar energy smart contracts
4. Build the hackathon features!

See `CIRCLE_WALLET_INTEGRATION.md` for full implementation guide.
