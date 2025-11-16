# 🎴 Circle Wallet Quick Reference Card

Keep this open while building! 📌

---

## 🔑 Where Are My Credentials?

### App ID
```
URL: https://console.circle.com/wallets/user/configurator
Location: Top of page
Format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
.env.local: VITE_CIRCLE_APP_ID=...
```

### Entity Secret  
```
URL: https://console.circle.com/wallets/user/configurator
Location: Scroll to "Entity Secret" section
Action: Click "Generate Entity Secret"
⚠️ WARNING: Copy immediately - you can't view it again!
.env.local: CIRCLE_ENTITY_SECRET=...
```

### API Key (You already have this)
```
Current: d6d53f6a9db4290b1aedbf9ad93f59af:79e7ae96542e1fb6a7bd312c5eec33bf
.env.local: VITE_CIRCLE_API_KEY=...
```

---

## ⚡ Quick Commands

### Install Everything
```bash
npm install
cd workers/circle-wallet && npm install && cd ../..
```

### Deploy Worker
```bash
cd workers/circle-wallet
wrangler secret put CIRCLE_API_KEY
wrangler secret put CIRCLE_ENTITY_SECRET
wrangler deploy
cd ../..
```

### Start Dev Server
```bash
npm run dev
```

### Test Worker Locally
```bash
cd workers/circle-wallet
wrangler dev --port 8788
```

---

## 💻 Code Snippets

### Use the Wallet Hook
```typescript
import { useCircleWallet } from '@/hooks/useCircleWallet';

function MyComponent() {
  const { 
    address,
    isConnected,
    isLoading,
    createWallet,
    connect,
    disconnect,
    sendTransaction,
  } = useCircleWallet();
  
  return (
    <div>
      {isConnected ? (
        <p>Connected: {address}</p>
      ) : (
        <button onClick={() => createWallet()}>
          Create Wallet
        </button>
      )}
    </div>
  );
}
```

### Add Wallet Button
```typescript
import { CircleWalletConnect } from '@/components/wallet/CircleWalletConnect';

<CircleWalletConnect />
```

### Send Transaction
```typescript
const { sendTransaction } = useCircleWallet();

await sendTransaction(
  '0xRecipientAddress',
  '1000000', // 1 USDC (6 decimals)
  'tokenId'
);
```

---

## 🌐 Important URLs

| What | URL |
|------|-----|
| Get Credentials | https://console.circle.com/wallets/user/configurator |
| View Transactions | https://console.circle.com/wallets/user/transactions |
| Interactive Guide | https://developers.circle.com/interactive-quickstarts/user-controlled-wallets |
| Discord Support | https://discord.com/invite/buildoncircle |
| Arc Explorer | https://testnet.arcscan.app |
| Arc Faucet | https://faucet.circle.com |

---

## 📋 Environment Variables Template

```bash
# Circle Credentials (GET THESE FIRST!)
VITE_CIRCLE_API_KEY=d6d53f6a9db4290b1aedbf9ad93f59af:79e7ae96542e1fb6a7bd312c5eec33bf
VITE_CIRCLE_APP_ID=get-from-console
CIRCLE_ENTITY_SECRET=generate-from-console
VITE_CIRCLE_WALLET_WORKER_URL=https://your-worker.workers.dev
```

---

## 🚀 5-Minute Setup

1. Get App ID: https://console.circle.com/wallets/user/configurator
2. Generate Entity Secret (same page, scroll down)
3. Update `.env.local` with both
4. Run: `npm install && cd workers/circle-wallet && npm install`
5. Deploy: `wrangler deploy` (after setting secrets)
6. Test: `npm run dev`

---

## ⚠️ Common Errors & Fixes

| Error | Fix |
|-------|-----|
| "App ID missing" | Add to `.env.local` |
| "Entity Secret invalid" | Regenerate from Console |
| "CORS error" | Check worker URL |
| "PIN dialog doesn't show" | Check browser console |
| "Worker 500" | Check secrets: `wrangler secret list` |

---

## 📞 Help Resources

1. `README_CIRCLE_SETUP.md` - Quick start
2. `GET_CIRCLE_CREDENTIALS.md` - Get credentials  
3. `CIRCLE_TESTING_GUIDE.md` - Verify setup
4. Circle Discord - Community support

---

**Print this or keep it open! 🌟**
