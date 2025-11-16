#!/usr/bin/env node
/**
 * Fund New Treasury with USDC
 * 
 * This script transfers USDC from your Circle wallet to the new Treasury contract.
 * 
 * Prerequisites:
 * 1. New Treasury must be deployed (run redeploy-system.cjs first)
 * 2. Your Circle wallet must have USDC balance
 * 3. You need your Circle wallet private key OR access to Circle Worker
 * 
 * Usage: node fund-new-treasury.cjs
 */

const { ethers } = require('ethers');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  rpcUrl: 'https://rpc.testnet.arc.network',
  chainId: 5042002,
  usdc: '0x3600000000000000000000000000000000000000',
  circleWallet: '0x5f02c9D3424F59607d2458D08D89e2D2979657b7',
};

// ABIs
const ERC20_ABI = [
  'function balanceOf(address account) view returns (uint256)',
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function decimals() view returns (uint8)',
];

const TREASURY_ABI = [
  'function fundTreasury(uint256 amount) external',
  'function getTreasuryBalance() view returns (uint256 sarcBalance, uint256 usdcBalance)',
];

// Colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✅${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}❌${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️${colors.reset}  ${msg}`),
  step: (msg) => console.log(`\n${colors.cyan}${colors.bright}${msg}${colors.reset}\n`),
  tx: (msg) => console.log(`${colors.dim}  ${msg}${colors.reset}`),
};

function prompt(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function waitForTx(tx, description) {
  log.tx(`Transaction: ${tx.hash}`);
  log.tx('Waiting for confirmation...');

  const receipt = await tx.wait();

  if (receipt.status === 1) {
    log.success(`${description} - Confirmed!`);
    log.tx(`Block: ${receipt.blockNumber}, Gas: ${receipt.gasUsed.toString()}`);
    return receipt;
  } else {
    throw new Error(`${description} failed`);
  }
}

async function main() {
  console.log('\n');
  console.log('='.repeat(80));
  console.log(`${colors.bright}💰 Fund New Treasury with USDC${colors.reset}`);
  console.log('='.repeat(80));
  console.log('\n');

  // Step 1: Read .env.local to get new Treasury address
  log.step('Step 1: Reading Configuration');

  const envPath = path.join(__dirname, '.env.local');
  
  if (!fs.existsSync(envPath)) {
    log.error('.env.local not found!');
    process.exit(1);
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const treasuryMatch = envContent.match(/VITE_TREASURY_ADDRESS=([0-9a-fA-Fx]+)/);

  if (!treasuryMatch) {
    log.error('VITE_TREASURY_ADDRESS not found in .env.local');
    log.error('Have you run redeploy-system.cjs yet?');
    process.exit(1);
  }

  const newTreasuryAddress = treasuryMatch[1];
  
  log.success('Configuration loaded');
  log.info(`Circle Wallet: ${CONFIG.circleWallet}`);
  log.info(`New Treasury: ${newTreasuryAddress}`);
  log.info(`USDC Contract: ${CONFIG.usdc}`);

  // Step 2: Connect to network
  log.step('Step 2: Connecting to Network');

  const provider = new ethers.JsonRpcProvider(CONFIG.rpcUrl);
  const network = await provider.getNetwork();

  if (network.chainId !== BigInt(CONFIG.chainId)) {
    log.error(`Wrong network! Expected ${CONFIG.chainId}, got ${network.chainId}`);
    process.exit(1);
  }

  log.success('Connected to Arc Testnet');

  // Step 3: Check USDC balance
  log.step('Step 3: Checking USDC Balance');

  const usdcContract = new ethers.Contract(CONFIG.usdc, ERC20_ABI, provider);
  
  // Get USDC decimals (Arc uses 6 decimals, not 18!)
  const decimals = await usdcContract.decimals();
  const balance = await usdcContract.balanceOf(CONFIG.circleWallet);

  log.info(`Circle Wallet Balance: ${ethers.formatUnits(balance, decimals)} USDC`);

  if (balance === 0n) {
    log.error('Circle wallet has 0 USDC!');
    log.info('Get testnet USDC from: https://faucet.circle.com');
    process.exit(1);
  }

  // Step 4: Ask how much to transfer
  log.step('Step 4: Transfer Amount');

  console.log(`Available: ${ethers.formatUnits(balance, decimals)} USDC`);
  const amountInput = await prompt('How much USDC to transfer? (e.g., 10010 or "all"): ');

  let amountToTransfer;
  
  if (amountInput.toLowerCase() === 'all') {
    amountToTransfer = balance;
  } else {
    const parsed = parseFloat(amountInput);
    if (isNaN(parsed) || parsed <= 0) {
      log.error('Invalid amount');
      process.exit(1);
    }
    amountToTransfer = ethers.parseUnits(parsed.toString(), decimals);
  }

  if (amountToTransfer > balance) {
    log.error('Insufficient balance!');
    process.exit(1);
  }

  log.success(`Amount to transfer: ${ethers.formatUnits(amountToTransfer, decimals)} USDC`);

  // Step 5: Get wallet private key
  log.step('Step 5: Wallet Authentication');

  log.warning('You need your Circle wallet private key to sign transactions.');
  log.info('This is the wallet that controls 0x5f02c9D3424F59607d2458D08D89e2D2979657b7\n');

  const privateKey = await prompt('Enter Circle wallet private key (starts with 0x): ');

  if (!privateKey || !privateKey.startsWith('0x')) {
    log.error('Invalid private key');
    process.exit(1);
  }

  const wallet = new ethers.Wallet(privateKey, provider);

  if (wallet.address.toLowerCase() !== CONFIG.circleWallet.toLowerCase()) {
    log.error(`Private key doesn't match Circle wallet!`);
    log.error(`Expected: ${CONFIG.circleWallet}`);
    log.error(`Got: ${wallet.address}`);
    process.exit(1);
  }

  log.success('Wallet authenticated');

  // Step 6: Approve Treasury to spend USDC
  log.step('Step 6: Approving Treasury');

  const usdcWithSigner = usdcContract.connect(wallet);
  
  // Check current allowance
  const currentAllowance = await usdcContract.allowance(CONFIG.circleWallet, newTreasuryAddress);
  
  if (currentAllowance < amountToTransfer) {
    log.info('Approving Treasury to spend USDC...');
    
    const approveTx = await usdcWithSigner.approve(newTreasuryAddress, amountToTransfer);
    await waitForTx(approveTx, 'Approve Treasury');
  } else {
    log.info('Treasury already has sufficient allowance');
  }

  // Step 7: Fund Treasury
  log.step('Step 7: Funding Treasury');

  const treasury = new ethers.Contract(newTreasuryAddress, TREASURY_ABI, wallet);
  
  log.info('Calling fundTreasury()...');
  const fundTx = await treasury.fundTreasury(amountToTransfer);
  await waitForTx(fundTx, 'Fund Treasury');

  // Step 8: Verify
  log.step('Step 8: Verification');

  const [sarcBalance, usdcBalance] = await treasury.getTreasuryBalance();
  
  log.success('Treasury funded successfully!');
  log.info(`Treasury USDC Balance: ${ethers.formatUnits(usdcBalance, decimals)} USDC`);
  log.info(`Treasury sARC Balance: ${ethers.formatUnits(sarcBalance, 18)} sARC`);

  // Final summary
  console.log('\n');
  console.log('='.repeat(80));
  console.log(`${colors.bright}Summary${colors.reset}`);
  console.log('='.repeat(80));
  console.log('');
  console.log(`✅ Transferred: ${ethers.formatUnits(amountToTransfer, decimals)} USDC`);
  console.log(`✅ From: ${CONFIG.circleWallet}`);
  console.log(`✅ To Treasury: ${newTreasuryAddress}`);
  console.log(`✅ Treasury Balance: ${ethers.formatUnits(usdcBalance, decimals)} USDC`);
  console.log('');
  console.log('='.repeat(80));
  console.log('');

  log.success('Treasury is ready for redemptions!');
  console.log('\nNext steps:');
  console.log('  1. Test minting: npm run dev → Mint tab');
  console.log('  2. Test redemption: Redeem tab → Should burn sARC and pay USDC');
  console.log('  3. Verify burn: Check totalSupply() decreased\n');
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { main };
