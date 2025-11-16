#!/usr/bin/env node
/**
 * Fund Treasury via Circle Developer Wallet API
 * Transfers USDC from Circle wallet to Treasury using Circle's transaction signing
 */

const { ethers } = require('ethers');
const fetch = require('node-fetch');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

// Read .env.local
const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

const getEnv = (key) => {
  const match = envContent.match(new RegExp(`${key}=(.+)`));
  return match ? match[1].trim() : null;
};

const CONFIG = {
  circleWallet: '0x5f02c9D3424F59607d2458D08D89e2D2979657b7',
  circleWorkerUrl: getEnv('VITE_CIRCLE_DEV_WALLET_WORKER_URL'),
  treasury: getEnv('VITE_TREASURY_ADDRESS'),
  usdc: '0x3600000000000000000000000000000000000000',
  rpcUrl: 'https://rpc.testnet.arc.network',
};

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✅${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}❌${colors.reset} ${msg}`),
  step: (msg) => console.log(`\n${colors.cyan}${msg}${colors.reset}\n`),
};

async function main() {
  console.log('\n='.repeat(70));
  console.log('💰 Fund Treasury via Circle Developer Wallet');
  console.log('='.repeat(70) + '\n');

  log.info(`Circle Wallet: ${CONFIG.circleWallet}`);
  log.info(`Treasury: ${CONFIG.treasury}`);
  log.info(`Amount: 5000 USDC`);

  // Step 1: Approve Treasury
  log.step('Step 1: Approving Treasury to spend USDC');

  const approveData = new ethers.Interface([
    'function approve(address spender, uint256 amount) returns (bool)'
  ]).encodeFunctionData('approve', [CONFIG.treasury, 5000000000n]); // 5000 USDC (6 decimals)

  log.info('Getting Circle wallet ID...');
  
  const walletsResponse = await fetch(`${CONFIG.circleWorkerUrl}/api/wallets?blockchain=ARC-TESTNET`, {
    method: 'GET',
  });
  const walletsData = await walletsResponse.json();
  const wallet = walletsData.wallets?.find(w => w.address?.toLowerCase() === CONFIG.circleWallet.toLowerCase());
  
  if (!wallet) {
    log.error('Circle wallet not found');
    process.exit(1);
  }
  
  log.info(`Wallet ID: ${wallet.id}`);
  log.info('Calling Circle Worker to sign approve transaction...');

  const approveResponse = await fetch(`${CONFIG.circleWorkerUrl}/api/transactions/sign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      walletId: wallet.id,
      transaction: {
        to: CONFIG.usdc,
        data: approveData,
        value: '0',
      },
    }),
  });

  const approveResult = await approveResponse.json();

  if (!approveResult.success) {
    log.error(`Approve failed: ${approveResult.error || 'Unknown error'}`);
    process.exit(1);
  }

  log.success(`Approve transaction id: ${approveResult.txHash}`);
  log.info('Polling Circle for blockchain tx hash...');

  // Poll Circle API to get the real blockchain tx hash
  const provider = new ethers.JsonRpcProvider(CONFIG.rpcUrl);
  const approveChainHash = await pollForBlockchainTxHash(approveResult.txHash, CONFIG.circleWorkerUrl);
  if (!approveChainHash) {
    log.error('Could not get blockchain tx hash for approve');
    process.exit(1);
  }

  log.info(`approve tx hash on chain: ${approveChainHash}`);
  log.info('Waiting for chain confirmation...');
  await provider.waitForTransaction(approveChainHash);

  log.success('Approval confirmed!');

  // Step 2: Fund Treasury
  log.step('Step 2: Funding Treasury');

  const fundData = new ethers.Interface([
    'function fundTreasury(uint256 amount)'
  ]).encodeFunctionData('fundTreasury', [5000000000n]); // 5000 USDC

  log.info('Calling Circle Worker to sign fundTreasury transaction...');

  const fundResponse = await fetch(`${CONFIG.circleWorkerUrl}/api/transactions/sign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      walletId: wallet.id,
      transaction: {
        to: CONFIG.treasury,
        data: fundData,
        value: '0',
      },
    }),
  });

  const fundResult = await fundResponse.json();

  if (!fundResult.success) {
    log.error(`Fund failed: ${fundResult.error || 'Unknown error'}`);
    process.exit(1);
  }

  log.success(`Fund transaction id: ${fundResult.txHash}`);
  log.info('Polling Circle for blockchain tx hash...');

  const fundChainHash = await pollForBlockchainTxHash(fundResult.txHash, CONFIG.circleWorkerUrl);
  if (!fundChainHash) {
    log.error('Could not get blockchain tx hash for fund transaction');
    process.exit(1);
  }

  log.info(`fund tx hash on chain: ${fundChainHash}`);
  log.info('Waiting for chain confirmation...');
  await provider.waitForTransaction(fundChainHash);

  log.success('Treasury funded successfully!');

  // Step 3: Verify
  log.step('Step 3: Verification');

  const treasury = new ethers.Contract(
    CONFIG.treasury,
    ['function getTreasuryBalance() view returns (uint256, uint256)'],
    provider
  );

  const [sarcBalance, usdcBalance] = await treasury.getTreasuryBalance();

  log.success(`Treasury USDC Balance: ${Number(usdcBalance) / 1e6} USDC`);
  log.success(`Treasury sARC Balance: ${ethers.formatUnits(sarcBalance, 18)} sARC`);

  console.log('\n' + '='.repeat(70));
  console.log('✅ Complete! Treasury is ready for redemptions');
  console.log('='.repeat(70) + '\n');
}

/**
 * Poll Circle Worker to retrieve blockchain tx hash for a given Circle tx id.
 * Returns the chain tx hash string when available, otherwise null.
 */
async function pollForBlockchainTxHash(circleTxId, workerUrl) {
  const maxTries = 60;
  const delayMs = 5000;

  for (let i = 0; i < maxTries; i++) {
    try {
      const resp = await fetch(`${workerUrl}/api/transactions/${circleTxId}`, { method: 'GET' });
      const data = await resp.json();
      // Debug: log returned data if present
      // eslint-disable-next-line no-console
      console.log('Circle status', JSON.stringify(data));

      // Circle SDK usually places the blockchain hash under transaction.blockchainTransactionHash
      const tx = data?.transaction || data?.transaction?.transaction || null;
      // Circle returns different fields depending on SDK version; check all possibilities
      const chainHash = data?.transaction?.txHash || data?.transaction?.blockchainTransactionHash || data?.transaction?.transactionHash || data?.transaction?.hash || (data?.transaction?.blockchainTransaction?.hash ?? null);

      // Also confirm that the transaction state is complete and included in a block
      const state = data?.transaction?.state || null;
      if (chainHash && typeof chainHash === 'string' && chainHash.length > 0 && state === 'COMPLETE') {
        return chainHash;
      }

      // If no chain hash yet, wait and retry
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    } catch (err) {
      // network or parse error, wait and retry
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  // If we exit here, include the last known state in the error for debugging
  return null;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
