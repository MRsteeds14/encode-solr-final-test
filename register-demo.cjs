#!/usr/bin/env node

/**
 * Register Demo Wallet as Solar Producer
 *
 * Registers the deployer wallet as a solar producer on RegistryV2
 * with fixed specifications for demo purposes.
 */

const { ethers } = require('ethers');
require('dotenv').config({ path: '.env.local' });

const REGISTRY_V2_ADDRESS = '0xc9559c5884e53548b3d2362aa694b64519d291ee';
const DEMO_WALLET = '0xd513C04FB43499Fa463451FFbF0f43eb48afF8B8';
const RPC_URL = 'https://rpc.testnet.arc.network';

// Demo system specs
const SYSTEM_CAPACITY_KW = 10; // 10 kW system
const DAILY_CAP_KWH = 80; // 80 kWh daily generation cap
const IPFS_METADATA = 'QmDemo'; // Placeholder IPFS hash

const ABI = [
  'function registerProducer(address producer, uint256 systemCapacityKw, uint256 dailyCapKwh, string ipfsMetadata) external',
  'function isWhitelisted(address producer) external view returns (bool)',
  'function getProducer(address producer) external view returns (tuple(bool isWhitelisted, uint256 systemCapacityKw, uint256 dailyCapKwh, uint256 totalMinted, uint256 lastMintTimestamp, string ipfsMetadata, uint256 registrationDate))'
];

async function main() {
  console.log('🔐 Registering Demo Wallet as Solar Producer\n');

  // Check environment
  const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
  if (!privateKey) {
    console.error('❌ Error: DEPLOYER_PRIVATE_KEY not found in .env.local');
    console.error('Please add your deployer wallet private key to .env.local');
    process.exit(1);
  }

  console.log('Configuration:');
  console.log('  Registry:', REGISTRY_V2_ADDRESS);
  console.log('  Demo Wallet:', DEMO_WALLET);
  console.log('  System Capacity:', SYSTEM_CAPACITY_KW, 'kW');
  console.log('  Daily Cap:', DAILY_CAP_KWH, 'kWh');
  console.log('');

  try {
    // Connect to provider
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(privateKey, provider);
    const registry = new ethers.Contract(REGISTRY_V2_ADDRESS, ABI, wallet);

    console.log('👤 Connected as:', wallet.address);

    // Check if already registered
    console.log('\n🔍 Checking registration status...');
    const isWhitelisted = await registry.isWhitelisted(DEMO_WALLET);

    if (isWhitelisted) {
      console.log('✅ Demo wallet is already registered!');
      console.log('\n📊 Current Producer Info:');
      const producer = await registry.getProducer(DEMO_WALLET);
      console.log('  System Capacity:', producer.systemCapacityKw.toString(), 'kW');
      console.log('  Daily Cap:', producer.dailyCapKwh.toString(), 'kWh');
      console.log('  Total Minted:', ethers.formatUnits(producer.totalMinted, 18), 'sARC');
      console.log('  Registration Date:', new Date(Number(producer.registrationDate) * 1000).toLocaleString());
      console.log('\n✅ Demo wallet is ready to mint tokens!');
      return;
    }

    // Register producer
    console.log('📝 Registering demo wallet...');
    const tx = await registry.registerProducer(
      DEMO_WALLET,
      SYSTEM_CAPACITY_KW,
      DAILY_CAP_KWH,
      IPFS_METADATA
    );

    console.log('  Transaction hash:', tx.hash);
    console.log('  Waiting for confirmation...');

    const receipt = await tx.wait();

    if (receipt.status === 1) {
      console.log('\n✅ Demo wallet registered successfully!');
      console.log('  Block:', receipt.blockNumber);
      console.log('  Gas used:', receipt.gasUsed.toString());
      console.log('');
      console.log('📊 Registered with:');
      console.log('  System Capacity:', SYSTEM_CAPACITY_KW, 'kW');
      console.log('  Daily Cap:', DAILY_CAP_KWH, 'kWh');
      console.log('');
      console.log('🎉 Demo wallet is now ready to mint sARC tokens!');
      console.log('   Go to the frontend and start minting!');
    } else {
      console.error('❌ Transaction failed!');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);

    if (error.code === 'INSUFFICIENT_FUNDS') {
      console.error('\n💡 Solution: Get testnet USDC from https://faucet.circle.com');
    } else if (error.message.includes('AccessControl')) {
      console.error('\n💡 Solution: Make sure you\'re using the deployer wallet');
      console.error('   The wallet must have OPERATOR_ROLE on RegistryV2');
    } else if (error.message.includes('Producer already registered')) {
      console.error('\n💡 The wallet is already registered. Check with:');
      console.error('   node -e "const {ethers} = require(\'ethers\'); ... "');
    }

    process.exit(1);
  }
}

main();
