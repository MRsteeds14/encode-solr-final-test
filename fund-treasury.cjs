#!/usr/bin/env node

/**
 * Fund Treasury Script
 *
 * This script properly funds the Treasury contract by:
 * 1. Approving Treasury to spend USDC
 * 2. Calling fundTreasury() function
 *
 * The Treasury does NOT accept direct transfers - you must use fundTreasury()
 */

const { ethers } = require('ethers');
require('dotenv').config({ path: '.env.local' });

// Contract addresses
const TREASURY_ADDRESS = '0x8825518674A89e28d2C11CA0Ec49024ef6e1E2b2';
const USDC_ADDRESS = '0x3600000000000000000000000000000000000000'; // Native USDC on Arc
const RPC_URL = 'https://rpc.testnet.arc.network';
const CHAIN_ID = 5042002;

// Amount to fund (100 USDC with 6 decimals - ERC20 interface)
const AMOUNT = ethers.parseUnits('100', 6);
const USDC_DECIMALS = 6; // ERC20 interface uses 6 decimals

// ABIs
const USDC_ABI = [
  'function approve(address spender, uint256 amount) returns (bool)',
  'function balanceOf(address account) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function decimals() view returns (uint8)'
];

const TREASURY_ABI = [
  'function fundTreasury(uint256 _amount) external',
  'function getTreasuryBalance() view returns (uint256 sarcBalance, uint256 usdcBalance)',
  'function paused() view returns (bool)'
];

async function fundTreasury() {
  console.log('💰 Treasury Funding Script\n');

  // Validate environment
  if (!process.env.DEPLOYER_PRIVATE_KEY) {
    throw new Error('DEPLOYER_PRIVATE_KEY not found in .env.local');
  }

  // Connect to Arc Testnet
  const provider = new ethers.JsonRpcProvider(RPC_URL, {
    chainId: CHAIN_ID,
    name: 'Arc Testnet'
  });

  const wallet = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider);

  console.log(`🔐 Connected as: ${wallet.address}`);
  console.log(`📍 Network: Arc Testnet (${CHAIN_ID})`);
  console.log(`💵 Amount to fund: ${ethers.formatUnits(AMOUNT, USDC_DECIMALS)} USDC (${AMOUNT.toString()} with ${USDC_DECIMALS} decimals)\n`);

  // Create contract instances
  const usdc = new ethers.Contract(USDC_ADDRESS, USDC_ABI, wallet);
  const treasury = new ethers.Contract(TREASURY_ADDRESS, TREASURY_ABI, wallet);

  try {
    // Check USDC decimals
    const decimals = await usdc.decimals();
    console.log(`🔍 USDC decimals: ${decimals}\n`);

    // Check wallet balance
    console.log('🔍 Checking wallet balance...');
    const balance = await usdc.balanceOf(wallet.address);
    console.log(`   Wallet USDC balance (raw): ${balance.toString()}`);
    console.log(`   Wallet USDC balance: ${ethers.formatUnits(balance, USDC_DECIMALS)} USDC`);

    if (balance < AMOUNT) {
      throw new Error(`Insufficient USDC balance. Need ${ethers.formatUnits(AMOUNT, USDC_DECIMALS)} but have ${ethers.formatUnits(balance, USDC_DECIMALS)}`);
    }

    // Check if Treasury is paused
    console.log('\n🔍 Checking Treasury status...');
    const isPaused = await treasury.paused();
    if (isPaused) {
      throw new Error('Treasury contract is paused!');
    }
    console.log('   Treasury is active ✓');

    // Check current Treasury balance
    const [, currentUsdcBalance] = await treasury.getTreasuryBalance();
    console.log(`   Current Treasury USDC: ${ethers.formatUnits(currentUsdcBalance, USDC_DECIMALS)} USDC`);

    // Step 1: Approve Treasury to spend USDC
    console.log('\n📝 Step 1: Approving Treasury to spend USDC...');
    const approveTx = await usdc.approve(TREASURY_ADDRESS, AMOUNT);
    console.log(`   Transaction hash: ${approveTx.hash}`);
    console.log('   Waiting for confirmation...');
    const approveReceipt = await approveTx.wait();
    console.log(`   ✅ Approved! Block: ${approveReceipt.blockNumber}`);

    // Verify allowance
    const allowance = await usdc.allowance(wallet.address, TREASURY_ADDRESS);
    console.log(`   Allowance set: ${ethers.formatUnits(allowance, USDC_DECIMALS)} USDC`);

    // Step 2: Fund Treasury
    console.log('\n💸 Step 2: Calling fundTreasury()...');
    const fundTx = await treasury.fundTreasury(AMOUNT);
    console.log(`   Transaction hash: ${fundTx.hash}`);
    console.log('   Waiting for confirmation...');
    const fundReceipt = await fundTx.wait();
    console.log(`   ✅ Treasury funded! Block: ${fundReceipt.blockNumber}`);
    console.log(`   Gas used: ${fundReceipt.gasUsed.toString()}`);

    // Verify new balance
    console.log('\n🔍 Verifying Treasury balance...');
    const [, newUsdcBalance] = await treasury.getTreasuryBalance();
    console.log(`   New Treasury USDC: ${ethers.formatUnits(newUsdcBalance, USDC_DECIMALS)} USDC`);
    console.log(`   Increase: +${ethers.formatUnits(newUsdcBalance - currentUsdcBalance, USDC_DECIMALS)} USDC`);

    console.log('\n🎉 Treasury funding complete!');
    console.log('\n📋 Transaction Summary:');
    console.log(`   Approve TX: ${approveTx.hash}`);
    console.log(`   Fund TX: ${fundTx.hash}`);
    console.log(`   Explorer: https://testnet.arcscan.app/tx/${fundTx.hash}`);

    console.log('\n✅ Treasury is now ready for redemptions!');
    console.log('   Next: Test the demo flow (mint → redeem)');

  } catch (error) {
    console.error('\n❌ Error funding Treasury:', error.message);
    if (error.data) {
      console.error('   Error data:', error.data);
    }
    process.exit(1);
  }
}

// Run the script
fundTreasury().catch(console.error);
