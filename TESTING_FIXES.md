# 🔧 Testing Guide: Profile Display & Disconnect Fixes

## Issues Fixed

### Issue 1: Producer Profile Not Showing System Size ✅
**Root Cause:** `REGISTRY_ABI` was missing the `getProducer()` function
- Contract has: `getProducer(address) returns (Producer struct)`
- ABI only had: `producers(address)` mapping
- Result: `useProducerStatus` couldn't fetch complete data

**Fix Applied:**
- Added `getProducer()` to `REGISTRY_ABI` in `circle-contracts.ts`
- Returns full struct: `(isWhitelisted, systemCapacityKw, dailyCapKwh, totalMinted, lastMintTimestamp, ipfsMetadata, registrationDate)`
- Added debug logging to show parsed profile data

### Issue 2: Disconnect Stays on Dashboard ✅
**Root Cause:** State cleared but component didn't navigate to landing page
- `disconnect()` cleared localStorage
- `App.tsx` checked `walletAddress` but didn't re-render landing page
- No forced navigation after state change

**Fix Applied:**
- Added `setTimeout(() => window.location.href = '/', 100)` after disconnect
- Added cleanup effect to reset state when `isConnected = false`
- Enhanced logging to track disconnect flow

---

## Testing Steps

### Test 1: Profile Display

```bash
# 1. Start dev server
npm run dev

# 2. Open browser console (F12)
# 3. Login with your account
# 4. Check console for logs:

Expected logs:
✅ Restored wallet for user: <email> Address: <address>
👛 Wallet connected: <address>
🔍 Producer status for <address> : {
  isWhitelisted: true,
  systemCapacityKw: 10n,      ← Should show BigInt
  dailyCapKwh: 80n,           ← Should show BigInt
  totalMinted: 0n,
  ...
}
📊 Profile data: {
  systemCapacity: 10,          ← Should show number (not 0!)
  dailyCap: 80,                ← Should show number (not 0!)
  totalGenerated: 0,
  rawProducerData: {...}
}

# 5. Navigate to "Profile" tab
# 6. Verify display shows:
   - System Capacity: 10 kW
   - Daily Cap: 80 kWh
   - Lifetime Energy: 0 kWh
   - Member Since: (today's date)
```

**If Profile Still Shows 0 kW:**

Check console for these specific logs:
```javascript
// Should see BigInt values in raw data
🔍 Producer status for 0x... : {
  systemCapacityKw: 10n,  // ← Must be BigInt with 'n'
  dailyCapKwh: 80n        // ← Must be BigInt with 'n'
}

// Should convert to numbers
📊 Profile data: {
  systemCapacity: 10,     // ← Must be number (not 0, not NaN)
  dailyCap: 80           // ← Must be number (not 0, not NaN)
}
```

**Troubleshooting:**
```javascript
// Run in browser console to test ABI:
import { getRegistryContract } from '@/lib/circle-contracts';

const contract = getRegistryContract();
const data = await contract.getProducer('YOUR_ADDRESS');
console.log('Direct contract call:', data);

// Should return array with 7 elements:
// [true, 10n, 80n, 0n, 0n, "", timestamp]
```

---

### Test 2: Disconnect Flow

```bash
# 1. Login to account
# 2. Verify dashboard loads
# 3. Click "Disconnect" button
# 4. Confirm dialog: "Disconnect from <email>?"
# 5. Click "OK"

Expected behavior:
✅ Console shows: "👋 User logged out - wallet disconnected"
✅ Page navigates to "/" (landing page)
✅ Landing page shows with hero section
✅ "Login" button visible (not "Disconnect")
✅ No dashboard visible

# 6. Click "Login" again
# 7. Enter same email
# 8. Verify dashboard loads with same data
```

**If Disconnect Doesn't Navigate:**

Check console:
```
Expected logs:
👋 User logged out - wallet disconnected
🔄 Wallet disconnected - state reset
👋 No wallet connected - showing landing page

If you see:
👋 User logged out - wallet disconnected
(but no navigation)

Then check:
1. Browser blocked the redirect?
2. Error in console?
3. Try hard refresh (Cmd+Shift+R)
```

---

## Debug Commands

### Check Profile Data

```javascript
// In browser console (F12)

// 1. Check raw producer data
const address = '0xYOUR_ADDRESS';
const provider = new ethers.JsonRpcProvider('https://rpc.testnet.arc.network');
const registryAddress = '0xc9559c5884e53548b3d2362aa694b64519d291ee';
const abi = ['function getProducer(address) view returns (bool, uint256, uint256, uint256, uint256, string, uint256)'];
const contract = new ethers.Contract(registryAddress, abi, provider);
const data = await contract.getProducer(address);
console.log('Raw contract data:', data);

// 2. Check localStorage
const wallet = JSON.parse(localStorage.getItem('circle_wallet'));
console.log('Stored wallet:', wallet);

// 3. Check user registry
const registry = JSON.parse(localStorage.getItem('solr_user_registry'));
console.log('User registry:', registry);
```

### Force Profile Refresh

```javascript
// In Profile tab, click "Refresh" button
// OR in console:
location.reload();
```

### Clear All State (Reset)

```javascript
// In console:
localStorage.clear();
location.reload();
```

---

## Expected Console Output

### On Login:
```
✅ Restored wallet for user: alice@solar.com Address: 0xABC...
👛 Wallet connected: 0xABC...
🔍 Producer status for 0xABC... : {
  isWhitelisted: true,
  systemCapacityKw: 10n,
  dailyCapKwh: 80n,
  totalMinted: 0n,
  lastMintTimestamp: 0n,
  ipfsMetadata: "",
  registrationDate: 1731801600n
}
📋 Registration status: { isRegistered: true, isCheckingRegistration: false, producerData: {...} }
📊 Profile data: {
  systemCapacity: 10,
  dailyCap: 80,
  totalGenerated: 0,
  rawProducerData: {...}
}
```

### On Disconnect:
```
👋 User logged out - wallet disconnected
🔄 Wallet disconnected - state reset
👋 No wallet connected - showing landing page
(Page navigates to landing)
```

### On Profile Tab:
```
📊 Profile data: {
  systemCapacity: 10,    ← Should NOT be 0
  dailyCap: 80,          ← Should NOT be 0
  totalGenerated: 0,
  rawProducerData: { systemCapacityKw: 10n, ... }
}
```

---

## What Changed in Code

### `circle-contracts.ts`
```typescript
// BEFORE (Missing getProducer):
const REGISTRY_ABI = [
  'function isWhitelisted(address producer) view returns (bool)',
  'function registerProducer(...)',
  'function producers(address) view returns (...)',  // ← Only mapping
];

// AFTER (Added getProducer):
const REGISTRY_ABI = [
  'function isWhitelisted(address producer) view returns (bool)',
  'function registerProducer(...)',
  'function producers(address) view returns (...)',
  'function getProducer(address) view returns (bool, uint256, uint256, uint256, uint256, string, uint256)',  // ← Full struct getter
];
```

### `WalletButton.tsx`
```typescript
// BEFORE (No navigation):
const handleDisconnect = () => {
  if (confirmDisconnect) {
    logoutUser();
    disconnect();
  }
};

// AFTER (Forces navigation):
const handleDisconnect = () => {
  if (confirmDisconnect) {
    logoutUser();
    disconnect();
    setTimeout(() => window.location.href = '/', 100);  // ← Navigate to home
  }
};
```

### `App.tsx`
```typescript
// ADDED: Cleanup effect
useEffect(() => {
  if (!isConnected && !walletAddress) {
    setShowRegistration(false);
    setActiveTab('overview');
    console.log('🔄 Wallet disconnected - state reset');
  }
}, [isConnected, walletAddress]);

// ADDED: Profile debug logging
useEffect(() => {
  if (profile) {
    console.log('📊 Profile data:', {
      systemCapacity: profile.systemCapacity,
      dailyCap: profile.dailyCap,
      ...
    });
  }
}, [profile, producerData]);
```

---

## Success Criteria

### ✅ Profile Display Works When:
- [ ] Console shows `systemCapacityKw: 10n` (BigInt)
- [ ] Console shows `📊 Profile data: { systemCapacity: 10 }` (number)
- [ ] Profile tab displays "System Capacity: 10 kW"
- [ ] Profile tab displays "Daily Cap: 80 kWh"
- [ ] No NaN or 0 values for registered system

### ✅ Disconnect Works When:
- [ ] Clicking "Disconnect" shows confirmation dialog
- [ ] After confirming, page navigates to landing page (/)
- [ ] Landing page shows hero section with "Login" button
- [ ] No dashboard or profile visible
- [ ] Can login again and see same wallet address

---

## If Issues Persist

### Profile Still Shows 0:

1. **Check contract is correct:**
   ```bash
   # Verify RegistryV2 address in .env.local
   VITE_REGISTRY_ADDRESS=0xc9559c5884e53548b3d2362aa694b64519d291ee
   ```

2. **Test contract directly:**
   ```javascript
   // In console
   const contract = new ethers.Contract(
     '0xc9559c5884e53548b3d2362aa694b64519d291ee',
     ['function getProducer(address) view returns (bool, uint256, uint256, uint256, uint256, string, uint256)'],
     new ethers.JsonRpcProvider('https://rpc.testnet.arc.network')
   );
   const data = await contract.getProducer('YOUR_WALLET_ADDRESS');
   console.log(data);
   ```

3. **Check registration actually succeeded:**
   - Go to https://testnet.arcscan.app
   - Search your wallet address
   - Find `registerProducer` transaction
   - Verify it shows "Success"

### Disconnect Doesn't Navigate:

1. **Force reload after disconnect:**
   ```typescript
   // Already implemented in code:
   setTimeout(() => window.location.href = '/', 100);
   ```

2. **Check browser console for errors**

3. **Clear browser cache:**
   ```bash
   Cmd+Shift+Delete (Chrome/Firefox)
   Clear browsing data
   Reload
   ```

---

## Final Verification

**Before submitting/demoing:**

1. ✅ Fresh browser session (incognito/private)
2. ✅ Register new account with unique email
3. ✅ Complete registration flow
4. ✅ Check Profile tab shows correct data
5. ✅ Disconnect and verify landing page
6. ✅ Login again with same email
7. ✅ Verify same wallet address and profile data

---

**Status: Ready for Testing! 🚀**

All fixes applied with "measure twice, cut once" approach:
- Root causes identified
- Proper fixes implemented
- Debug logging added
- Testing steps documented
