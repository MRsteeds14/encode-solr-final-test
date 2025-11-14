#!/usr/bin/env node

/**
 * Approve USDC for Treasury Script (Thirdweb API)
 *
 * Step 1: Approve Treasury to spend USDC from deployer wallet
 */

require('dotenv').config({ path: '.env.local' });

const THIRDWEB_API_URL = 'https://api.thirdweb.com/v1/contracts/write';
const USDC_ADDRESS = '0x3600000000000000000000000000000000000000';
const TREASURY_ADDRESS = '0x8825518674A89e28d2C11CA0Ec49024ef6e1E2b2';
const DEPLOYER_WALLET = '0xd513C04FB43499Fa463451FFbF0f43eb48afF8B8';
const CHAIN_ID = 5042002;

// Amount: 100 USDC with 6 decimals
const AMOUNT = '100000000'; // 100 * 10^6

async function approveUSDC() {
  console.log('📝 Approving USDC for Treasury (Thirdweb API)\n');

  if (!process.env.THIRDWEB_SECRET_KEY) {
    throw new Error('THIRDWEB_SECRET_KEY not found in .env.local');
  }

  console.log('Configuration:');
  console.log(`  USDC Contract: ${USDC_ADDRESS}`);
  console.log(`  Treasury: ${TREASURY_ADDRESS}`);
  console.log(`  From Wallet: ${DEPLOYER_WALLET}`);
  console.log(`  Amount: ${AMOUNT} (100 USDC with 6 decimals)`);
  console.log(`  Chain ID: ${CHAIN_ID}\n`);

  const payload = {
    calls: [
      {
        contractAddress: USDC_ADDRESS,
        method: 'function approve(address spender, uint256 amount) returns (bool)',
        params: [TREASURY_ADDRESS, AMOUNT]
      }
    ],
    chainId: CHAIN_ID,
    from: DEPLOYER_WALLET
  };

  console.log('📤 Sending approval request to thirdweb API...');

  try {
    const response = await fetch(THIRDWEB_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-secret-key': process.env.THIRDWEB_SECRET_KEY
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ API Error:', data);
      throw new Error(`API request failed: ${response.status}`);
    }

    console.log('✅ Approval submitted successfully!');
    console.log('\nResponse:');
    console.log(JSON.stringify(data, null, 2));

    if (data.transactionIds) {
      console.log('\n📋 Transaction IDs:', data.transactionIds);
    }

    console.log('\n✅ USDC approval complete!');
    console.log('   Treasury can now spend 100 USDC from your wallet');
    console.log('\n📝 Next step: Run `node fund-treasury-api.cjs`');

  } catch (error) {
    console.error('\n❌ Error approving USDC:', error.message);
    if (error.response) {
      console.error('Response:', await error.response.text());
    }
    process.exit(1);
  }
}

approveUSDC().catch(console.error);
