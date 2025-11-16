# Circle User-Controlled Wallets Setup Guide

## 📋 Prerequisites

Before setting up Circle wallets, you need:

1. ✅ Circle Developer Account
2. ✅ Circle API Key (you already have this)
3. ❓ Circle App ID (need to get from Console)
4. ❓ Circle Entity Secret (need to generate)

---

## 🚀 Step 1: Get Your App ID from Circle Console

### Instructions:

1. **Visit Circle Console:**
   - Go to: https://console.circle.com/
   - Log in with your Circle account

2. **Navigate to User-Controlled Wallets:**
   - Click on "Wallets" in the left sidebar
   - Select "User-Controlled" (formerly called Programmable Wallets)

3. **Open the Configurator:**
   - Click on "Configurator" in the left menu
   - You'll see your **App ID** displayed at the top

4. **Copy Your App ID:**
   - Copy the App ID (format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)
   - Paste it into `.env.local`:
   ```
   VITE_CIRCLE_APP_ID=your_app_id_here
   ```

---

## 🔐 Step 2: Generate Your Entity Secret

The Entity Secret is a cryptographic key that secures your wallet operations. **NEVER expose it in frontend code.**

### Option A: Generate via SDK (Recommended for Hackathon)

Run this command in your terminal:

```bash
npm install
cd workers/circle-wallet
npm install
node -e "const { initiateDeveloperControlledWalletsClient } = require('@circle-fin/user-controlled-wallets'); const client = initiateDeveloperControlledWalletsClient({ apiKey: 'd6d53f6a9db4290b1aedbf9ad93f59af:79e7ae96542e1fb6a7bd312c5eec33bf' }); client.createEntitySecretCiphertext().then(r => console.log('Entity Secret:', r.data?.entitySecret));"
```

### Option B: Generate via Circle Console

1. Go to: https://console.circle.com/wallets/user/configurator
2. Look for "Entity Secret" section
3. Click "Generate New Entity Secret"
4. **IMPORTANT:** Save it immediately - you can't view it again!

### Option C: Use Interactive Quickstart

1. Visit: https://developers.circle.com/interactive-quickstarts/user-controlled-wallets
2. Follow the guided setup to generate your Entity Secret

---

## ⚙️ Step 3: Configure Environment Variables

Update your `.env.local` file:

```bash
# Circle Configuration
VITE_CIRCLE_API_KEY=d6d53f6a9db4290b1aedbf9ad93f59af:79e7ae96542e1fb6a7bd312c5eec33bf
VITE_CIRCLE_APP_ID=your_app_id_from_step_1
CIRCLE_ENTITY_SECRET=your_entity_secret_from_step_2

# Cloudflare Worker URL (will be set after deployment)
VITE_CIRCLE_WALLET_WORKER_URL=http://localhost:8788
```

---

## 🛠️ Step 4: Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install Circle Worker dependencies
cd workers/circle-wallet
npm install
cd ../..
```

---

## 🚢 Step 5: Deploy Circle Wallet Worker

The Entity Secret must be stored securely in Cloudflare Workers, not in your frontend.

```bash
cd workers/circle-wallet

# Set your secrets (you'll be prompted to enter them)
wrangler secret put CIRCLE_API_KEY
# Paste: d6d53f6a9db4290b1aedbf9ad93f59af:79e7ae96542e1fb6a7bd312c5eec33bf

wrangler secret put CIRCLE_ENTITY_SECRET
# Paste: your_entity_secret_from_step_2

# Deploy the worker
wrangler deploy

# Copy the deployed URL (e.g., https://circle-wallet-worker.your-account.workers.dev)
# Update .env.local with:
# VITE_CIRCLE_WALLET_WORKER_URL=https://circle-wallet-worker.your-account.workers.dev
```

---

## ✅ Step 6: Test Your Setup

Run the test script to verify everything is working:

```bash
npm run dev
```

Visit http://localhost:5173 and try creating a wallet!

---

## 🎯 API Endpoints Available

Once your worker is deployed, you'll have these endpoints:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/users/create` | POST | Create a new user |
| `/api/users/token` | POST | Get session token for user |
| `/api/users/initialize` | POST | Initialize user account & create wallet |
| `/api/wallets` | GET | Get user's wallets |
| `/api/transactions/transfer` | POST | Create transfer challenge |
| `/api/faucet` | POST | Request testnet tokens |

---

## 🔍 Troubleshooting

### Issue: "App ID is missing"
**Solution:** Make sure you copied the App ID from Circle Console to `.env.local` as `VITE_CIRCLE_APP_ID`

### Issue: "Entity Secret is invalid"
**Solution:** Regenerate your Entity Secret following Step 2 and update Cloudflare Worker secrets

### Issue: "CORS error when calling worker"
**Solution:** Make sure your worker is deployed and the URL in `.env.local` matches the deployed URL

### Issue: "Cannot find module '@circle-fin/user-controlled-wallets'"
**Solution:** Run `npm install` in the `workers/circle-wallet` directory

---

## 📚 Next Steps

After completing setup:

1. ✅ Create your first user
2. ✅ Initialize a wallet on Arc Testnet
3. ✅ Request testnet USDC tokens
4. ✅ Test a transaction

See `CIRCLE_WALLET_INTEGRATION.md` for integration examples!
