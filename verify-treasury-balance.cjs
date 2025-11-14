const { ethers } = require('ethers');
require('dotenv').config({ path: '.env.local' });

const TREASURY_ADDRESS = '0x8825518674A89e28d2C11CA0Ec49024ef6e1E2b2';
const USDC_ADDRESS = '0x3600000000000000000000000000000000000000';
const RPC_URL = 'https://rpc.testnet.arc.network';

const TREASURY_ABI = [
  'function getTreasuryBalance() view returns (uint256 sarcBalance, uint256 usdcBalance)'
];

const USDC_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function decimals() view returns (uint8)'
];

async function verifyBalance() {
  console.log('🔍 Verifying Treasury Balance\n');

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const treasury = new ethers.Contract(TREASURY_ADDRESS, TREASURY_ABI, provider);
  const usdc = new ethers.Contract(USDC_ADDRESS, USDC_ABI, provider);

  try {
    // Get USDC decimals
    const decimals = await usdc.decimals();
    console.log(`USDC Decimals: ${decimals}\n`);

    // Get Treasury balance via getTreasuryBalance()
    const [sarcBalance, usdcBalance] = await treasury.getTreasuryBalance();
    console.log('Treasury Balance (via getTreasuryBalance):');
    console.log(`  sARC: ${ethers.formatUnits(sarcBalance, 18)}`);
    console.log(`  USDC: ${ethers.formatUnits(usdcBalance, decimals)} (using ${decimals} decimals)\n`);

    // Also check direct balanceOf for comparison
    const directBalance = await usdc.balanceOf(TREASURY_ADDRESS);
    console.log('Treasury Balance (via balanceOf):');
    console.log(`  Raw: ${directBalance.toString()}`);
    console.log(`  Formatted (${decimals} decimals): ${ethers.formatUnits(directBalance, decimals)}\n`);

    if (usdcBalance > 0) {
      console.log('✅ Treasury is funded and ready for redemptions!');
    } else {
      console.log('⚠️  Treasury balance is still 0. Transaction may still be pending.');
      console.log('   Check: https://testnet.arcscan.app/address/0x8825518674A89e28d2C11CA0Ec49024ef6e1E2b2');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

verifyBalance();
