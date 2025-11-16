#!/usr/bin/env node
/**
 * Deploy New SARCToken with Burn Mechanism
 * 
 * This script:
 * 1. Deploys new SARCToken.sol (ERC20 + Burnable + AccessControl)
 * 2. Grants MINTER_ROLE to MintingController
 * 3. Grants BURNER_ROLE to Treasury
 * 4. Grants MINTER_ROLE to AI Agent (for PoG Agent Worker)
 * 5. Updates .env.local with new token address
 * 6. Verifies all roles are properly granted
 * 
 * Usage: node contracts/scripts/deploy-sarc-token.cjs
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
    registry: '0xc9559c5884e53548b3d2362aa694b64519d291ee',
    treasury: '0x8825518674A89e28d2C11CA0Ec49024ef6e1E2b2',
    mintingController: '0xf84748fddee07b4d4d483c6291d0d3e97ad61d00',
  },
  roles: {
    MINTER_ROLE: '0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6',
    BURNER_ROLE: '0x3c11d16cbaffd01df69ce1c404f6340ee057498f5f00246190ea54220576a848',
    OPERATOR_ROLE: '0x97667070c54ef182b0f5858b034beac1b6f3089aa2d3188bb1e8929f4fa9b929',
    DEFAULT_ADMIN_ROLE: '0x0000000000000000000000000000000000000000000000000000000000000000',
  },
};

// SARCToken Contract Bytecode and ABI (compile first with: forge build)
// This will need to be updated after compilation
const SARC_TOKEN_ABI = [
  'constructor()',
  'function mint(address to, uint256 amount) external',
  'function burnFrom(address from, uint256 amount) external',
  'function burn(uint256 amount) external',
  'function grantRole(bytes32 role, address account) external',
  'function hasRole(bytes32 role, address account) view returns (bool)',
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address account) view returns (uint256)',
  'function pause() external',
  'function unpause() external',
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
  log.tx(`Transaction hash: ${tx.hash}`);
  log.tx('Waiting for confirmation...');

  const receipt = await tx.wait();

  if (receipt.status === 1) {
    log.success(`${description} - Confirmed!`);
    log.tx(`Block: ${receipt.blockNumber}, Gas used: ${receipt.gasUsed.toString()}`);
    return receipt;
  } else {
    log.error(`${description} - Failed!`);
    throw new Error('Transaction failed');
  }
}

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

async function main() {
  console.log('\n');
  console.log('='.repeat(80));
  console.log(`${colors.bright}🔥 Deploy New SARCToken with Burn Mechanism${colors.reset}`);
  console.log('='.repeat(80));
  console.log('\n');

  log.info('This script will deploy a new SARCToken contract with proper burn functionality.');
  log.warning('Your old token at 0x9604...2184 will be abandoned (you can keep the 1B supply as backup).\n');

  // Check if forge is available
  log.step('Step 1: Checking Dependencies');
  
  try {
    const { execSync } = require('child_process');
    execSync('forge --version', { stdio: 'ignore' });
    log.success('Foundry (forge) is installed');
  } catch {
    log.error('Foundry not found! Install from: https://getfoundry.sh');
    process.exit(1);
  }

  // Compile contracts
  log.step('Step 2: Compiling Contracts');
  
  try {
    const { execSync } = require('child_process');
    log.info('Running: forge build');
    execSync('cd contracts && forge build', { stdio: 'inherit' });
    log.success('Contracts compiled successfully');
  } catch (error) {
    log.error('Compilation failed!');
    process.exit(1);
  }

  // Load compiled bytecode
  log.step('Step 3: Loading Contract Artifacts');
  
  const artifactPath = path.join(__dirname, '../out/SARCToken.sol/SARCToken.json');
  
  if (!fs.existsSync(artifactPath)) {
    log.error(`Artifact not found: ${artifactPath}`);
    log.error('Make sure SARCToken.sol compiled successfully');
    process.exit(1);
  }

  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
  const bytecode = artifact.bytecode.object;
  
  log.success('Contract artifact loaded');
  log.info(`Bytecode size: ${bytecode.length / 2} bytes`);

  // Get deployer private key
  log.step('Step 4: Wallet Setup');
  
  const privateKey = await prompt('Enter your deployer wallet private key (starts with 0x): ');

  if (!privateKey || !privateKey.startsWith('0x')) {
    log.error('Invalid private key format');
    process.exit(1);
  }

  // Connect to network
  const provider = new ethers.JsonRpcProvider(CONFIG.rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);

  const network = await provider.getNetwork();
  if (network.chainId !== BigInt(CONFIG.chainId)) {
    log.error(`Wrong network! Expected ${CONFIG.chainId}, got ${network.chainId}`);
    process.exit(1);
  }

  log.success(`Connected to Arc Testnet`);
  log.info(`Deployer address: ${wallet.address}`);

  const balance = await provider.getBalance(wallet.address);
  log.info(`Balance: ${ethers.formatUnits(balance, 18)} USDC`);

  if (balance < ethers.parseUnits('1', 18)) {
    log.warning('Low balance! You need ~1 USDC for deployment gas');
    const proceed = await prompt('Continue anyway? (yes/no): ');
    if (proceed.toLowerCase() !== 'yes') {
      process.exit(0);
    }
  }

  // Deploy SARCToken
  log.step('Step 5: Deploying SARCToken');

  log.info('Creating contract factory...');
  const SARCToken = new ethers.ContractFactory(SARC_TOKEN_ABI, bytecode, wallet);

  log.info('Deploying contract...');
  const sarcToken = await SARCToken.deploy();

  log.tx(`Deployment transaction: ${sarcToken.deploymentTransaction().hash}`);
  log.tx('Waiting for confirmation...');

  await sarcToken.waitForDeployment();
  const tokenAddress = await sarcToken.getAddress();

  log.success(`SARCToken deployed at: ${tokenAddress}`);

  // Verify deployment
  const name = await sarcToken.name();
  const symbol = await sarcToken.symbol();
  const decimals = await sarcToken.decimals();

  log.info(`Token Name: ${name}`);
  log.info(`Token Symbol: ${symbol}`);
  log.info(`Decimals: ${decimals}`);

  // Grant MINTER_ROLE to MintingController
  log.step('Step 6: Granting MINTER_ROLE to MintingController');

  const hasRole1 = await sarcToken.hasRole(CONFIG.roles.MINTER_ROLE, CONFIG.contracts.mintingController);

  if (!hasRole1) {
    log.info('Granting role...');
    const tx1 = await sarcToken.grantRole(CONFIG.roles.MINTER_ROLE, CONFIG.contracts.mintingController);
    await waitForTx(tx1, 'Grant MINTER_ROLE to MintingController');
  } else {
    log.info('Role already granted');
  }

  await verifyRole(
    sarcToken,
    CONFIG.roles.MINTER_ROLE,
    CONFIG.contracts.mintingController,
    'MintingController has MINTER_ROLE'
  );

  // Grant BURNER_ROLE to Treasury
  log.step('Step 7: Granting BURNER_ROLE to Treasury');

  const hasRole2 = await sarcToken.hasRole(CONFIG.roles.BURNER_ROLE, CONFIG.contracts.treasury);

  if (!hasRole2) {
    log.info('Granting role...');
    const tx2 = await sarcToken.grantRole(CONFIG.roles.BURNER_ROLE, CONFIG.contracts.treasury);
    await waitForTx(tx2, 'Grant BURNER_ROLE to Treasury');
  } else {
    log.info('Role already granted');
  }

  await verifyRole(
    sarcToken,
    CONFIG.roles.BURNER_ROLE,
    CONFIG.contracts.treasury,
    'Treasury has BURNER_ROLE'
  );

  // Grant MINTER_ROLE to AI Agent
  log.step('Step 8: Granting MINTER_ROLE to AI Agent');

  const envPath = path.join(__dirname, '../../.env.local');
  if (!fs.existsSync(envPath)) {
    log.error('.env.local not found! Run grant-roles.cjs first to create AI Agent wallet');
    process.exit(1);
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const aiAgentMatch = envContent.match(/AI_AGENT_WALLET_ADDRESS=([0-9a-fA-Fx]+)/);

  if (!aiAgentMatch) {
    log.error('AI Agent wallet not found in .env.local');
    process.exit(1);
  }

  const aiAgentAddress = aiAgentMatch[1];
  log.info(`AI Agent address: ${aiAgentAddress}`);

  const hasRole3 = await sarcToken.hasRole(CONFIG.roles.MINTER_ROLE, aiAgentAddress);

  if (!hasRole3) {
    log.info('Granting role...');
    const tx3 = await sarcToken.grantRole(CONFIG.roles.MINTER_ROLE, aiAgentAddress);
    await waitForTx(tx3, 'Grant MINTER_ROLE to AI Agent');
  } else {
    log.info('Role already granted');
  }

  await verifyRole(
    sarcToken,
    CONFIG.roles.MINTER_ROLE,
    aiAgentAddress,
    'AI Agent has MINTER_ROLE'
  );

  // Update .env.local
  log.step('Step 9: Updating .env.local');

  let newEnvContent = envContent.replace(
    /VITE_SARC_TOKEN=.*/,
    `VITE_SARC_TOKEN=${tokenAddress}`
  );

  // Add comment about old token
  if (!newEnvContent.includes('OLD_SARC_TOKEN')) {
    newEnvContent += `\n# Old SARCToken (abandoned, 1B supply at 0xd513c04fb43499fa463451ffbf0f43eb48aff8b8)\nOLD_SARC_TOKEN=0x9604ad29C8fEe0611EcE73a91e192E5d976E2184\n`;
  }

  fs.writeFileSync(envPath, newEnvContent);

  log.success('.env.local updated with new token address');

  // Final summary
  log.step('🎉 Deployment Complete!');

  console.log('\n');
  console.log('='.repeat(80));
  console.log(`${colors.bright}Summary:${colors.reset}`);
  console.log('='.repeat(80));
  console.log('');
  console.log(`✅ New SARCToken deployed: ${colors.cyan}${tokenAddress}${colors.reset}`);
  console.log(`✅ MintingController (${CONFIG.contracts.mintingController}) has MINTER_ROLE`);
  console.log(`✅ Treasury (${CONFIG.contracts.treasury}) has BURNER_ROLE`);
  console.log(`✅ AI Agent (${aiAgentAddress}) has MINTER_ROLE`);
  console.log(`✅ .env.local updated`);
  console.log('');
  console.log('='.repeat(80));
  console.log('');

  log.info('Next steps:');
  console.log('  1. Update MintingController to use new token:');
  console.log(`     cast send ${CONFIG.contracts.mintingController} \\`);
  console.log(`       "setToken(address)" ${tokenAddress} \\`);
  console.log('       --private-key YOUR_KEY --rpc-url https://rpc.testnet.arc.network');
  console.log('');
  console.log('  2. Update Treasury to use new token (if needed)');
  console.log('');
  console.log('  3. Restart your frontend: npm run dev');
  console.log('');
  console.log('  4. Test minting: It should now update balances AND burn on redemption!');
  console.log('');

  log.warning('Note: Your old token (1B supply) is still at 0xd513...f8b8 if you need it.');
  console.log('');
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
