#!/usr/bin/env node

/**
 * Grant Role via thirdweb API
 *
 * This script uses the thirdweb API to grant roles on smart contracts.
 * Useful for granting roles without needing to run a local wallet transaction.
 *
 * Usage:
 *   node grant-role-api.js <contractAddress> <roleHash> <accountAddress>
 *
 * Example:
 *   node grant-role-api.js 0x90b4883040f64aB37678382dE4e0fAa67B1126e1 \
 *     0x97667070c54ef182b0f5858b034beac1b6f3089aa2d3188bb1e8929f4fa9b929 \
 *     0xE1d71CF21De70D144104423077ee7c0B5CFD5284
 *
 * Environment Variables Required:
 *   - THIRDWEB_SECRET_KEY: Your thirdweb API secret key
 *   - DEPLOYER_PRIVATE_KEY: Private key of wallet with DEFAULT_ADMIN_ROLE
 */

require('dotenv').config({ path: '.env.local' });

const THIRDWEB_API_URL = 'https://api.thirdweb.com/v1/contracts/write';
const CHAIN_ID = 5042002; // Arc Testnet

async function grantRole(contractAddress, roleHash, accountAddress) {
  const secretKey = process.env.THIRDWEB_SECRET_KEY;
  const deployerPrivateKey = process.env.DEPLOYER_PRIVATE_KEY;

  if (!secretKey) {
    console.error('❌ Error: THIRDWEB_SECRET_KEY not found in environment variables');
    console.error('Please add it to your .env.local file');
    process.exit(1);
  }

  if (!deployerPrivateKey) {
    console.error('❌ Error: DEPLOYER_PRIVATE_KEY not found in environment variables');
    console.error('Please add it to your .env.local file');
    process.exit(1);
  }

  // Derive the "from" address from the private key
  const { ethers } = require('ethers');
  const wallet = new ethers.Wallet(deployerPrivateKey);
  const fromAddress = wallet.address;

  console.log('🔐 Granting Role via thirdweb API...');
  console.log('   Contract:', contractAddress);
  console.log('   Role Hash:', roleHash);
  console.log('   To Account:', accountAddress);
  console.log('   From:', fromAddress);
  console.log('   Chain ID:', CHAIN_ID);
  console.log('');

  const payload = {
    calls: [
      {
        contractAddress,
        method: 'function grantRole(bytes32 role, address account)',
        params: [roleHash, accountAddress]
      }
    ],
    chainId: CHAIN_ID,
    from: fromAddress
  };

  try {
    const response = await fetch(THIRDWEB_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-secret-key': secretKey
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ API Error:', result);
      process.exit(1);
    }

    console.log('✅ Role granted successfully!');
    console.log('📝 Transaction Result:', JSON.stringify(result, null, 2));

    if (result.queueId) {
      console.log('');
      console.log('⏳ Transaction queued with ID:', result.queueId);
      console.log('Monitor status at: https://thirdweb.com/dashboard');
    }

    return result;
  } catch (error) {
    console.error('❌ Error granting role:', error.message);
    process.exit(1);
  }
}

// Predefined role hashes for convenience
const ROLES = {
  OPERATOR_ROLE: '0x97667070c54ef182b0f5858b034beac1b6f3089aa2d3188bb1e8929f4fa9b929',
  MINTER_ROLE: '0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6',
  DEFAULT_ADMIN_ROLE: '0x0000000000000000000000000000000000000000000000000000000000000000'
};

// Contract addresses for convenience
const CONTRACTS = {
  Registry: '0x90b4883040f64aB37678382dE4e0fAa67B1126e1',
  Treasury: '0x8825518674A89e28d2C11CA0Ec49024ef6e1E2b2',
  MintingController: '0x186c2987F138f3784913e5e42f0cee4512b89C3E',
  sARC: '0x9604ad29C8fEe0611EcE73a91e192E5d976E2184'
};

// CLI Interface
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Grant Role via thirdweb API\n');
    console.log('Usage:');
    console.log('  node grant-role-api.js <contractAddress> <roleHash> <accountAddress>');
    console.log('');
    console.log('Quick Commands:');
    console.log('  node grant-role-api.js grant-operator-to-ai');
    console.log('    → Grants OPERATOR_ROLE to AI Agent on Registry');
    console.log('');
    console.log('Available Role Hashes:');
    Object.entries(ROLES).forEach(([name, hash]) => {
      console.log(`  ${name}: ${hash}`);
    });
    console.log('');
    console.log('Contract Addresses:');
    Object.entries(CONTRACTS).forEach(([name, address]) => {
      console.log(`  ${name}: ${address}`);
    });
    process.exit(0);
  }

  // Quick command: grant OPERATOR_ROLE to AI Agent on Registry
  if (args[0] === 'grant-operator-to-ai') {
    const AI_AGENT_ADDRESS = '0xE1d71CF21De70D144104423077ee7c0B5CFD5284';
    console.log('🚀 Quick Command: Grant OPERATOR_ROLE to AI Agent on Registry\n');
    grantRole(CONTRACTS.Registry, ROLES.OPERATOR_ROLE, AI_AGENT_ADDRESS);
  } else if (args.length === 3) {
    const [contractAddress, roleHash, accountAddress] = args;
    grantRole(contractAddress, roleHash, accountAddress);
  } else {
    console.error('❌ Invalid arguments');
    console.error('Usage: node grant-role-api.js <contractAddress> <roleHash> <accountAddress>');
    console.error('   or: node grant-role-api.js grant-operator-to-ai');
    process.exit(1);
  }
}

module.exports = { grantRole, ROLES, CONTRACTS };
