#!/usr/bin/env node

const { ethers } = require('ethers');

const REGISTRY_ADDRESS = '0xc9559c5884e53548b3d2362aa694b64519d291ee';
const OPERATOR_ROLE = '0x97667070c54ef182b0f5858b034beac1b6f3089aa2d3188bb1e8929f4fa9b929';
const WALLET_TO_CHECK = '0x15Ec191bAaeA3ff7bF1383714416B8714703F882';
const RPC_URL = 'https://rpc.testnet.arc.network';

const ABI = [
  'function hasRole(bytes32 role, address account) view returns (bool)'
];

async function checkRole() {
  console.log('🔍 Checking if wallet has OPERATOR_ROLE...\n');
  console.log('Registry:', REGISTRY_ADDRESS);
  console.log('Wallet:', WALLET_TO_CHECK);
  console.log('Role:', OPERATOR_ROLE);
  console.log('');

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const registry = new ethers.Contract(REGISTRY_ADDRESS, ABI, provider);

  try {
    const hasRole = await registry.hasRole(OPERATOR_ROLE, WALLET_TO_CHECK);

    if (hasRole) {
      console.log('✅ SUCCESS! Wallet HAS OPERATOR_ROLE');
      console.log('You can now register producers with this wallet!');
    } else {
      console.log('❌ Wallet does NOT have OPERATOR_ROLE yet');
      console.log('Transaction might still be pending. Wait a minute and try again.');
    }
  } catch (error) {
    console.error('❌ Error checking role:', error.message);
  }
}

checkRole();
