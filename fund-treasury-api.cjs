#!/usr/bin/env node

/**
 * Fund Treasury Script (Thirdweb API)
 *
 * Step 2: Call fundTreasury() to deposit USDC into Treasury
 *
 * NOTE: You must run approve-usdc-treasury.cjs first!
 */

require('dotenv').config({ path: '.env.local' });

const THIRDWEB_API_URL = 'https://api.thirdweb.com/v1/contracts/write';
const TREASURY_ADDRESS = '0x8825518674A89e28d2C11CA0Ec49024ef6e1E2b2';
const DEPLOYER_WALLET = '0xd513C04FB43499Fa463451FFbF0f43eb48afF8B8';
const CHAIN_ID = 5042002;

// Amount: 100 USDC with 6 decimals
const AMOUNT = '100000000'; // 100 * 10^6

async function fundTreasury() {
  console.log('💰 Funding Treasury (Thirdweb API)\n');

  if (!process.env.THIRDWEB_SECRET_KEY) {
    throw new Error('THIRDWEB_SECRET_KEY not found in .env.local');
  }

  console.log('Configuration:');
  console.log(`  Treasury: ${TREASURY_ADDRESS}`);
  console.log(`  From Wallet: ${DEPLOYER_WALLET}`);
  console.log(`  Amount: ${AMOUNT} (100 USDC with 6 decimals)`);
  console.log(`  Chain ID: ${CHAIN_ID}\n`);

  const payload = {
    calls: [
      {
        contractAddress: TREASURY_ADDRESS,
        method: 'function fundTreasury(uint256 _amount)',
        params: [AMOUNT]
      }
    ],
    chainId: CHAIN_ID,
    from: DEPLOYER_WALLET
  };

  console.log('📤 Sending fundTreasury request to thirdweb API...');

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

    console.log('✅ Treasury funding submitted successfully!');
    console.log('\nResponse:');
    console.log(JSON.stringify(data, null, 2));

    if (data.transactionIds) {
      console.log('\n📋 Transaction IDs:', data.transactionIds);
    }

    console.log('\n🎉 Treasury funding complete!');
    console.log('   Treasury now has 100 USDC for redemptions');
    console.log('\n✅ Your demo is now fully funded and ready!');
    console.log('\n📝 Next steps:');
    console.log('   1. Run `npm run dev` to start the frontend');
    console.log('   2. Connect wallet 0xd513C04FB43499Fa463451FFbF0f43eb48afF8B8');
    console.log('   3. Test the mint → redeem flow');

  } catch (error) {
    console.error('\n❌ Error funding Treasury:', error.message);
    if (error.response) {
      console.error('Response:', await error.response.text());
    }
    process.exit(1);
  }
}

fundTreasury().catch(console.error);
