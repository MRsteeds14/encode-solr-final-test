const { ethers } = require('ethers');
require('dotenv').config({ path: '.env.local' });

const USDC_ADDRESS = '0x3600000000000000000000000000000000000000';
const RPC_URL = 'https://rpc.testnet.arc.network';

const WALLETS = {
  'Demo/Deployer': '0xd513C04FB43499Fa463451FFbF0f43eb48afF8B8',
  'AI Agent': '0xE1d71CF21De70D144104423077ee7c0B5CFD5284',
  'Treasury': '0x8825518674A89e28d2C11CA0Ec49024ef6e1E2b2'
};

async function checkBalances() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const usdc = new ethers.Contract(USDC_ADDRESS, ['function balanceOf(address) view returns (uint256)'], provider);

  console.log('💰 Wallet USDC Balances (Arc Testnet)\n');

  for (const [name, address] of Object.entries(WALLETS)) {
    const balance = await usdc.balanceOf(address);
    console.log(`${name}:`);
    console.log(`  Address: ${address}`);
    console.log(`  Balance: ${ethers.formatUnits(balance, 18)} USDC\n`);
  }
}

checkBalances();
