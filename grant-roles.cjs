#!/usr/bin/env node
/**
 * SOLR-ARC Automated Role Granting Script
 *
 * This script automates the process of granting all necessary roles
 * for the SOLR-ARC smart contract system.
 *
 * Usage: node grant-roles.js
 *
 * What it does:
 * 1. Grants MINTER_ROLE to MintingController on sARC token
 * 2. Grants OPERATOR_ROLE to MintingController on Registry
 * 3. Creates a new AI Agent wallet
 * 4. Grants MINTER_ROLE to AI Agent on MintingController
 * 5. Grants OPERATOR_ROLE to AI Agent on MintingController
 * 6. Grants OPERATOR_ROLE to AI Agent on Registry (for registerProducer)
 * 7. Saves AI wallet credentials to .env.local
 * 8. Verifies all roles are granted successfully
 */

const { ethers } = require('ethers');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  rpcUrl: 'https://rpc.testnet.arc.network',
  chainId: 5042002,
  contracts: {
    sarcToken: '0x9604ad29C8fEe0611EcE73a91e192E5d976E2184',
    registry: '0x90b4883040f64aB37678382dE4e0fAa67B1126e1',
    treasury: '0x8825518674A89e28d2C11CA0Ec49024ef6e1E2b2',
    mintingController: '0x186c2987F138f3784913e5e42f0cee4512b89C3E',
  },
  roles: {
    MINTER_ROLE: '0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6',
    OPERATOR_ROLE: '0x97667070c54ef182b0f5858b034beac1b6f3089aa2d3188bb1e8929f4fa9b929',
    DEFAULT_ADMIN_ROLE: '0x0000000000000000000000000000000000000000000000000000000000000000',
  },
};

// Minimal ABI - only what we need
const ACCESS_CONTROL_ABI = [
  'function grantRole(bytes32 role, address account) external',
  'function hasRole(bytes32 role, address account) view returns (bool)',
  'function getRoleAdmin(bytes32 role) view returns (bytes32)',
];

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
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
  warning: (msg) => console.log(`${colors.yellow}⚠️${colors.reset}  ${msg}`),
  step: (msg) => console.log(`\n${colors.cyan}${colors.bright}${msg}${colors.reset}\n`),
  tx: (msg) => console.log(`${colors.dim}  ${msg}${colors.reset}`),
};

// Helper to prompt for input
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

// Helper to wait for transaction
async function waitForTx(tx, description) {
  log.tx(`Transaction hash: ${tx.hash}`);
  log.tx('Waiting for confirmation...');

  const receipt = await tx.wait();

  if (receipt.status === 1) {
    log.success(`${description} - Transaction confirmed!`);
    log.tx(`Block: ${receipt.blockNumber}, Gas used: ${receipt.gasUsed.toString()}`);
    return true;
  } else {
    log.error(`${description} - Transaction failed!`);
    return false;
  }
}

// Helper to verify role
async function verifyRole(contract, role, account, description) {
  try {
    const hasRole = await contract.hasRole(role, account);
    if (hasRole) {
      log.success(`Verified: ${description}`);
      return true;
    } else {
      log.error(`NOT VERIFIED: ${description}`);
      return false;
    }
  } catch (error) {
    log.error(`Verification failed for ${description}: ${error.message}`);
    return false;
  }
}

// Main function
async function main() {
  console.log('\n');
  console.log('='.repeat(70));
  console.log(`${colors.bright}🔐 SOLR-ARC Automated Role Granting${colors.reset}`);
  console.log('='.repeat(70));
  console.log('\n');

  log.info('This script will automatically grant all necessary roles for your contracts.');
  log.info('You will need to provide your deployment wallet private key.');
  log.warning('Your private key will ONLY be stored in memory during execution.\n');

  // Step 1: Get private key
  const privateKey = await prompt('Enter your deployment wallet private key (starts with 0x): ');

  if (!privateKey || !privateKey.startsWith('0x')) {
    log.error('Invalid private key format. Must start with 0x');
    process.exit(1);
  }

  try {
    // Step 2: Connect to provider and create wallet
    log.step('Step 1: Connecting to Arc Testnet');

    const provider = new ethers.JsonRpcProvider(CONFIG.rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);

    // Verify network
    const network = await provider.getNetwork();
    if (network.chainId !== BigInt(CONFIG.chainId)) {
      log.error(`Wrong network! Expected ${CONFIG.chainId}, got ${network.chainId}`);
      process.exit(1);
    }

    log.success(`Connected to Arc Testnet (Chain ID: ${network.chainId})`);
    log.info(`Your address: ${wallet.address}`);

    // Check balance
    const balance = await provider.getBalance(wallet.address);
    log.info(`Balance: ${ethers.formatUnits(balance, 18)} USDC`);

    if (balance < ethers.parseUnits('0.1', 18)) {
      log.warning('Low balance! You may not have enough for gas fees.');
      log.warning('Get testnet USDC from: https://faucet.circle.com\n');

      const proceed = await prompt('Continue anyway? (yes/no): ');
      if (proceed.toLowerCase() !== 'yes') {
        log.info('Aborted by user');
        process.exit(0);
      }
    }

    // Step 3: Initialize contracts
    log.step('Step 2: Initializing Contracts');

    const sarcToken = new ethers.Contract(CONFIG.contracts.sarcToken, ACCESS_CONTROL_ABI, wallet);
    const registry = new ethers.Contract(CONFIG.contracts.registry, ACCESS_CONTROL_ABI, wallet);
    const mintingController = new ethers.Contract(CONFIG.contracts.mintingController, ACCESS_CONTROL_ABI, wallet);

    log.success('All contracts initialized');

    // Step 4: Grant MINTER_ROLE to MintingController on sARC
    log.step('Step 3: Granting MINTER_ROLE to MintingController (on sARC Token)');

    const hasRole1 = await sarcToken.hasRole(CONFIG.roles.MINTER_ROLE, CONFIG.contracts.mintingController);

    if (hasRole1) {
      log.info('Role already granted, skipping...');
    } else {
      log.info('Granting role...');
      const tx1 = await sarcToken.grantRole(CONFIG.roles.MINTER_ROLE, CONFIG.contracts.mintingController);
      await waitForTx(tx1, 'Grant MINTER_ROLE to MintingController');
    }

    await verifyRole(
      sarcToken,
      CONFIG.roles.MINTER_ROLE,
      CONFIG.contracts.mintingController,
      'MintingController has MINTER_ROLE on sARC'
    );

    // Step 5: Grant OPERATOR_ROLE to MintingController on Registry
    log.step('Step 4: Granting OPERATOR_ROLE to MintingController (on Registry)');

    const hasRole2 = await registry.hasRole(CONFIG.roles.OPERATOR_ROLE, CONFIG.contracts.mintingController);

    if (hasRole2) {
      log.info('Role already granted, skipping...');
    } else {
      log.info('Granting role...');
      const tx2 = await registry.grantRole(CONFIG.roles.OPERATOR_ROLE, CONFIG.contracts.mintingController);
      await waitForTx(tx2, 'Grant OPERATOR_ROLE to MintingController');
    }

    await verifyRole(
      registry,
      CONFIG.roles.OPERATOR_ROLE,
      CONFIG.contracts.mintingController,
      'MintingController has OPERATOR_ROLE on Registry'
    );

    // Step 6: Create AI Agent Wallet
    log.step('Step 5: Creating AI Agent Wallet');

    const aiWallet = ethers.Wallet.createRandom();

    log.success('AI Agent wallet created!');
    log.info(`Address: ${aiWallet.address}`);
    log.info(`Private Key: ${aiWallet.privateKey}`);
    log.warning('Save these credentials securely!\n');

    // Step 7: Grant MINTER_ROLE to AI Agent
    log.step('Step 6: Granting MINTER_ROLE to AI Agent (on MintingController)');

    const hasRole3 = await mintingController.hasRole(CONFIG.roles.MINTER_ROLE, aiWallet.address);

    if (hasRole3) {
      log.info('Role already granted, skipping...');
    } else {
      log.info('Granting role...');
      const tx3 = await mintingController.grantRole(CONFIG.roles.MINTER_ROLE, aiWallet.address);
      await waitForTx(tx3, 'Grant MINTER_ROLE to AI Agent');
    }

    await verifyRole(
      mintingController,
      CONFIG.roles.MINTER_ROLE,
      aiWallet.address,
      'AI Agent has MINTER_ROLE on MintingController'
    );

    // Step 8: Grant OPERATOR_ROLE to AI Agent
    log.step('Step 7: Granting OPERATOR_ROLE to AI Agent (on MintingController)');

    const hasRole4 = await mintingController.hasRole(CONFIG.roles.OPERATOR_ROLE, aiWallet.address);

    if (hasRole4) {
      log.info('Role already granted, skipping...');
    } else {
      log.info('Granting role...');
      const tx4 = await mintingController.grantRole(CONFIG.roles.OPERATOR_ROLE, aiWallet.address);
      await waitForTx(tx4, 'Grant OPERATOR_ROLE to AI Agent');
    }

    await verifyRole(
      mintingController,
      CONFIG.roles.OPERATOR_ROLE,
      aiWallet.address,
      'AI Agent has OPERATOR_ROLE on MintingController'
    );

    // Step 9: Grant OPERATOR_ROLE to AI Agent on Registry
    log.step('Step 8: Granting OPERATOR_ROLE to AI Agent (on Registry)');

    const hasRole5 = await registry.hasRole(CONFIG.roles.OPERATOR_ROLE, aiWallet.address);

    if (hasRole5) {
      log.info('Role already granted, skipping...');
    } else {
      log.info('Granting role...');
      log.info('This allows the AI Agent to call registerProducer() on Registry');
      const tx5 = await registry.grantRole(CONFIG.roles.OPERATOR_ROLE, aiWallet.address);
      await waitForTx(tx5, 'Grant OPERATOR_ROLE to AI Agent on Registry');
    }

    await verifyRole(
      registry,
      CONFIG.roles.OPERATOR_ROLE,
      aiWallet.address,
      'AI Agent has OPERATOR_ROLE on Registry'
    );

    // Step 10: Save AI wallet to .env.local
    log.step('Step 9: Saving AI Agent Credentials');

    const envPath = path.join(__dirname, '.env.local');
    let envContent = '';

    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }

    // Remove old AI agent entries if they exist
    envContent = envContent
      .split('\n')
      .filter(line => !line.startsWith('AI_AGENT_WALLET_ADDRESS=') && !line.startsWith('AI_AGENT_PRIVATE_KEY='))
      .join('\n');

    // Add new credentials
    envContent += `\n\n# AI Agent Credentials (Generated ${new Date().toISOString()})\n`;
    envContent += `AI_AGENT_WALLET_ADDRESS=${aiWallet.address}\n`;
    envContent += `AI_AGENT_PRIVATE_KEY=${aiWallet.privateKey}\n`;

    fs.writeFileSync(envPath, envContent.trim() + '\n');

    log.success('.env.local updated with AI Agent credentials');
    log.info(`File location: ${envPath}`);

    // Final summary
    log.step('🎉 All Done! Role Granting Complete');

    console.log('\n');
    console.log('='.repeat(70));
    console.log(`${colors.bright}Summary of Granted Roles:${colors.reset}`);
    console.log('='.repeat(70));
    console.log('');
    console.log('✅ 1. MintingController → sARC Token MINTER_ROLE');
    console.log('✅ 2. MintingController → Registry OPERATOR_ROLE');
    console.log('✅ 3. AI Agent Wallet Created');
    console.log('✅ 4. AI Agent → MintingController MINTER_ROLE');
    console.log('✅ 5. AI Agent → MintingController OPERATOR_ROLE');
    console.log('✅ 6. AI Agent → Registry OPERATOR_ROLE');
    console.log('✅ 7. Credentials saved to .env.local');
    console.log('');
    console.log('='.repeat(70));
    console.log('');

    log.success('Your contracts are now properly configured!');
    log.info('\nNext steps:');
    console.log('  1. Register a test producer: See DEPLOYMENT_GUIDE.md Step 4');
    console.log('  2. Fund the treasury with USDC');
    console.log('  3. Run: node test-deployment.js');
    console.log('  4. Start your frontend: npm run dev\n');

    console.log(`${colors.cyan}AI Agent Wallet (for reference):${colors.reset}`);
    console.log(`  Address: ${aiWallet.address}`);
    console.log(`  Saved to: .env.local\n`);

  } catch (error) {
    log.error(`\nScript failed: ${error.message}`);

    if (error.code === 'INSUFFICIENT_FUNDS') {
      log.warning('Insufficient gas funds. Get testnet USDC from: https://faucet.circle.com');
    } else if (error.code === 'CALL_EXCEPTION') {
      log.warning('Transaction reverted. You may not have admin permissions on the contract.');
    } else {
      console.error(error);
    }

    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { main };
