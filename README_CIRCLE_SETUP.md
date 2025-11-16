# 🌟 SOLR-ARC: Circle User-Controlled Wallets Setup

## 🎯 Mission: Get Your Wallet Running in 10 Minutes

You need **3 things** from Circle to make this work:

1. ✅ **API Key** - You already have this!
2. ❓ **App ID** - Get from Circle Console
3. ❓ **Entity Secret** - Generate via Circle Console

---

## 🚀 Fast Track Setup

### 1️⃣ Get App ID (2 minutes)

Open this URL and copy your App ID:
```
https://console.circle.com/wallets/user/configurator
```

Paste it in `.env.local`:
```bash
VITE_CIRCLE_APP_ID=paste-your-app-id-here
```

### 2️⃣ Generate Entity Secret (2 minutes)

On the same page, click **"Generate Entity Secret"** or **"View Entity Secret"**

⚠️ **Copy it immediately!** You can only see it once.

Paste it in `.env.local`:
```bash
CIRCLE_ENTITY_SECRET=paste-your-entity-secret-here
```

### 3️⃣ Install & Deploy (5 minutes)

```bash
# Install dependencies
npm install

# Deploy Circle wallet worker
cd workers/circle-wallet
npm install

# Set secrets
wrangler secret put CIRCLE_API_KEY
# Paste: d6d53f6a9db4290b1aedbf9ad93f59af:79e7ae96542e1fb6a7bd312c5eec33bf

wrangler secret put CIRCLE_ENTITY_SECRET
# Paste: your entity secret from step 2

# Deploy!
wrangler deploy
```

Copy the deployed URL and update `.env.local`:
```bash
VITE_CIRCLE_WALLET_WORKER_URL=https://your-worker.workers.dev
```

### 4️⃣ Test It! (1 minute)

```bash
cd ../..  # Back to project root
npm run dev
```

Open http://localhost:5173 and click **"Connect Wallet"**

---

## 📚 Detailed Guides

Need more help? Check these guides:

1. **`GET_CIRCLE_CREDENTIALS.md`** ⭐ **START HERE**
   - Step-by-step to get App ID & Entity Secret
   - Multiple methods (Console, CLI, Interactive)

2. **`CIRCLE_SETUP_GUIDE.md`**
   - Complete setup instructions
   - Environment configuration
   - Worker deployment

3. **`CIRCLE_TESTING_GUIDE.md`**
   - Test your integration
   - Verify everything works
   - Troubleshooting tips

4. **`CIRCLE_INTEGRATION_SUMMARY.md`**
   - Architecture overview
   - API reference
   - Next steps for hackathon

---

## 🗂️ What We Built

```
📁 Your Project
├── 📄 .env.local (ADD YOUR CREDENTIALS HERE!)
│
├── 📁 src/lib/
│   ├── circle-sdk.ts          # Web SDK initialization
│   └── circle-api.ts           # API client functions
│
├── 📁 src/hooks/
│   └── useCircleWallet.ts      # React hook for wallets
│
├── 📁 src/components/wallet/
│   └── CircleWalletConnect.tsx # Wallet UI component
│
├── 📁 workers/circle-wallet/   # Cloudflare Worker (Backend)
│   ├── index.ts                # API endpoints
│   ├── package.json
│   └── wrangler.toml
│
└── 📁 Documentation/
    ├── GET_CIRCLE_CREDENTIALS.md      ⭐ START HERE
    ├── CIRCLE_SETUP_GUIDE.md
    ├── CIRCLE_TESTING_GUIDE.md
    └── CIRCLE_INTEGRATION_SUMMARY.md
```

---

## ✅ Checklist

Before you start coding:

- [ ] Got App ID from Circle Console
- [ ] Generated Entity Secret
- [ ] Updated `.env.local` with both
- [ ] Ran `npm install`
- [ ] Deployed Circle wallet worker
- [ ] Updated worker URL in `.env.local`
- [ ] Tested wallet creation in browser

---

## 🎯 What Circle Wallets Give You

✨ **Better UX:**
- No browser extensions needed (no MetaMask)
- No seed phrases to remember
- Simple PIN/biometric auth
- Built-in recovery options

🔐 **Better Security:**
- MPC key management (no single point of failure)
- Entity Secret stays on backend only
- PIN encrypted on user's device
- Enterprise-grade compliance ready

⚡ **Better Features:**
- Gas fee sponsorship (you pay for users)
- Native USDC on Arc blockchain
- Cross-chain transfers (CCTP)
- Smart contract wallet capabilities

---

## 🆘 Quick Troubleshooting

### "Where do I get App ID?"

Open: https://console.circle.com/wallets/user/configurator
Look at the top of the page - it's displayed there.

### "Entity Secret generation failed"

Use the Console method (easiest):
1. Go to same URL above
2. Scroll to "Entity Secret" section
3. Click "Generate"
4. Copy immediately!

### "Worker deployment fails"

```bash
# Log in to Cloudflare first
wrangler login

# Then try again
cd workers/circle-wallet
wrangler deploy
```

### "PIN dialog doesn't appear"

Check your `.env.local` has:
```bash
VITE_CIRCLE_APP_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

Restart dev server:
```bash
npm run dev
```

---

## 🎉 Ready to Build!

Once you complete the 4 steps above, you'll have:

✅ Circle User-Controlled Wallets
✅ Secure backend infrastructure
✅ Beautiful wallet UI
✅ Testnet tokens automatically
✅ Ready for smart contract integration

**Now you can focus on building your solar energy tokenization features!**

---

## 📖 Next Steps

1. Complete the 4-step setup above
2. Read `CIRCLE_INTEGRATION_SUMMARY.md` for architecture
3. Follow `CIRCLE_TESTING_GUIDE.md` to verify
4. Start replacing Thirdweb code
5. Build your hackathon project! 🚀

---

## 📞 Need Help?

- **Detailed Setup:** See `GET_CIRCLE_CREDENTIALS.md`
- **Testing Help:** See `CIRCLE_TESTING_GUIDE.md`
- **Circle Discord:** https://discord.com/invite/buildoncircle
- **Circle Docs:** https://developers.circle.com/wallets/user-controlled

---

**Let's build something amazing! 🌟**
