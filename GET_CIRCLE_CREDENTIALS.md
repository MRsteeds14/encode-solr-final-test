# 🎯 Quick Start: Get Circle Credentials NOW

This guide will help you get your Circle App ID and Entity Secret in **under 5 minutes**.

---

## 📱 Step 1: Get Your App ID (2 minutes)

### Method: Circle Console (Easiest)

1. **Open Circle Console in your browser:**
   ```
   https://console.circle.com/wallets/user/configurator
   ```

2. **Log in** with your Circle account credentials

3. **You'll see the Configurator page** - Your App ID is displayed at the top:
   ```
   App ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
   ```

4. **Copy it and paste into `.env.local`:**
   ```bash
   VITE_CIRCLE_APP_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
   ```

✅ **Done! Your App ID is ready.**

---

## 🔐 Step 2: Generate Entity Secret (3 minutes)

Your Entity Secret is a cryptographic key that secures wallet operations. You have 3 options:

### Option A: Circle Console (Recommended - Easiest)

1. **Stay on the same Configurator page:**
   ```
   https://console.circle.com/wallets/user/configurator
   ```

2. **Scroll down to find "Entity Secret" section**

3. **Click "Generate Entity Secret" or "View Entity Secret"**

4. **IMPORTANT: Copy it immediately!** You can only view it once.
   ```
   Entity Secret: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

5. **Paste into `.env.local`:**
   ```bash
   CIRCLE_ENTITY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

✅ **Done! Your Entity Secret is ready.**

---

### Option B: Generate via Node.js Script (For Developers)

If you prefer to generate it programmatically:

1. **Create a temporary script:**
   ```bash
   cd workers/circle-wallet
   npm install
   ```

2. **Run this command:**
   ```bash
   node -e "
   const { initiateDeveloperControlledWalletsClient } = require('@circle-fin/user-controlled-wallets');
   
   const client = initiateDeveloperControlledWalletsClient({
     apiKey: 'd6d53f6a9db4290b1aedbf9ad93f59af:79e7ae96542e1fb6a7bd312c5eec33bf'
   });
   
   client.createEntitySecretCiphertext()
     .then(response => {
       console.log('\n✅ Entity Secret Generated:');
       console.log(response.data?.entitySecret);
       console.log('\nCopy this to your .env.local as CIRCLE_ENTITY_SECRET\n');
     })
     .catch(err => console.error('Error:', err));
   "
   ```

3. **Copy the output and paste into `.env.local`**

✅ **Done!**

---

### Option C: Interactive Quickstart (Guided Experience)

1. **Visit the interactive guide:**
   ```
   https://developers.circle.com/interactive-quickstarts/user-controlled-wallets
   ```

2. **Follow the step-by-step wizard** - it will help you:
   - Create a user
   - Generate Entity Secret
   - Initialize a test wallet

3. **Copy your credentials from the guide outputs**

✅ **Done!**

---

## ✅ Step 3: Verify Your Setup

Your `.env.local` should now look like this:

```bash
# Circle API Keys
VITE_CIRCLE_API_KEY=d6d53f6a9db4290b1aedbf9ad93f59af:79e7ae96542e1fb6a7bd312c5eec33bf
VITE_CIRCLE_APP_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
CIRCLE_ENTITY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# ... rest of your env vars
```

**Check all three are filled in:**
- ✅ VITE_CIRCLE_API_KEY (you already have this)
- ✅ VITE_CIRCLE_APP_ID (just copied from Console)
- ✅ CIRCLE_ENTITY_SECRET (just generated)

---

## 🚀 Step 4: Deploy Circle Wallet Worker

Now that you have all credentials, deploy the backend worker:

```bash
# Navigate to worker directory
cd workers/circle-wallet

# Install dependencies (if not already done)
npm install

# Set secrets in Cloudflare
wrangler secret put CIRCLE_API_KEY
# When prompted, paste: d6d53f6a9db4290b1aedbf9ad93f59af:79e7ae96542e1fb6a7bd312c5eec33bf

wrangler secret put CIRCLE_ENTITY_SECRET
# When prompted, paste your Entity Secret from .env.local

# Deploy!
wrangler deploy
```

**You'll see output like:**
```
✨ Deployed circle-wallet-worker
   https://circle-wallet-worker.your-account.workers.dev
```

**Copy that URL and update `.env.local`:**
```bash
VITE_CIRCLE_WALLET_WORKER_URL=https://circle-wallet-worker.your-account.workers.dev
```

---

## 🎉 Step 5: Test It!

```bash
# Return to project root
cd ../..

# Install all dependencies
npm install

# Start the dev server
npm run dev
```

Open http://localhost:5173 and click "Connect Wallet" - you should see the Circle wallet dialog!

---

## ❓ Troubleshooting

### Issue: "Cannot find App ID in Console"

**Solution:** 
- Make sure you're in the "User-Controlled" wallets section (not Developer-Controlled)
- The URL should be: `https://console.circle.com/wallets/user/configurator`
- Click "Configurator" in the left sidebar

### Issue: "Entity Secret not showing in Console"

**Solution:**
- Click "Generate New Entity Secret" button
- If you already generated one and lost it, generate a new one
- Save it immediately - you can't view it again!

### Issue: "Worker deployment fails"

**Solution:**
```bash
# Make sure you're logged in to Cloudflare
wrangler login

# Try deploying again
cd workers/circle-wallet
wrangler deploy
```

### Issue: "CORS error when testing"

**Solution:**
- Make sure your worker URL in `.env.local` matches the deployed URL
- Try restarting your dev server: `npm run dev`

---

## 📚 Next Steps

✅ Credentials obtained
✅ Worker deployed
✅ Frontend running

**Now you're ready to:**

1. Create your first Circle wallet
2. Integrate with smart contracts
3. Build the solar energy tokenization features!

See `CIRCLE_WALLET_INTEGRATION.md` for code examples.

---

## 🆘 Need Help?

- **Circle Discord:** https://discord.com/invite/buildoncircle
- **Circle Docs:** https://developers.circle.com/wallets/user-controlled/web-sdk
- **Circle Support:** https://support.usdc.circle.com/hc/en-us/p/contactus

---

**Ready to build? Let's go! 🚀**
