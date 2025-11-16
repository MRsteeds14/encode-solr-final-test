#!/usr/bin/env node
/**
 * Complete System Redeployment with Burn Mechanism
 * 
 * This script deploys the entire system from scratch:
 * 1. Deploy new SARCToken (with burn capability)
 * 2. Deploy new Treasury (with burn integration)
 * 3. Keep existing MintingController (update sarcToken reference)
 * 4. Keep existing RegistryV2 (no changes needed)
 * 5. Grant all necessary roles
 * 6. Update .env.local
 * 
 * Usage: node contracts/scripts/redeploy-system.cjs
 */

const { ethers } = require('ethers');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  rpcUrl: 'https://rpc.testnet.arc.network',
  chainId: 5042002,
  existingContracts: {
    registry: '0xc9559c5884e53548b3d2362aa694b64519d291ee',
    mintingController: '0xf84748fddee07b4d4d483c6291d0d3e97ad61d00',
    usdc: '0x3600000000000000000000000000000000000000',
  },
  exchangeRate: '100000000000000000', // 0.10 USDC per kWh (18 decimals)
  roles: {
    MINTER_ROLE: '0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6',
    BURNER_ROLE: '0x3c11d16cbaffd01df69ce1c404f6340ee057498f5f00246190ea54220576a848',
    OPERATOR_ROLE: '0x97667070c54ef182b0f5858b034beac1b6f3089aa2d3188bb1e8929f4fa9b929',
    DEFAULT_ADMIN_ROLE: '0x0000000000000000000000000000000000000000000000000000000000000000',
  },
};

// ABIs
const SARC_TOKEN_ABI = [
  'constructor()',
  'function grantRole(bytes32 role, address account) external',
  'function hasRole(bytes32 role, address account) view returns (bool)',
  'function name() view returns (string)',
  'function symbol() view returns (string)',
];

const TREASURY_ABI = [
  'constructor(address _sarcToken, address _usdcToken, uint256 _usdcPerKwh)',
  'function grantRole(bytes32 role, address account) external',
  'function hasRole(bytes32 role, address account) view returns (bool)',
  'function sarcToken() view returns (address)',
  'function usdcToken() view returns (address)',
];

const MINTING_CONTROLLER_ABI = [
  'function sarcToken() view returns (address)',
  'function grantRole(bytes32 role, address account) external',
  'function hasRole(bytes32 role, address account) view returns (bool)',
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
  log.tx(`Transaction: ${tx.hash}`);
  log.tx('Waiting for confirmation...');

  const receipt = await tx.wait();

  if (receipt.status === 1) {
    log.success(`${description} - Confirmed!`);
    log.tx(`Block: ${receipt.blockNumber}, Gas: ${receipt.gasUsed.toString()}`);
    return receipt;
  } else {
    throw new Error(`${description} failed`);
  }
}

async function main() {
  console.log('\n');
  console.log('='.repeat(80));
  console.log(`${colors.bright}🚀 Complete System Redeployment with Burn Mechanism${colors.reset}`);
  console.log('='.repeat(80));
  console.log('\n');

  log.warning('This will deploy NEW contracts for SARCToken and Treasury.');
  log.warning('Your existing MintingController and RegistryV2 will be reused.\n');

  // Step 1: Compile
  log.step('Step 1: Compiling Contracts');
  
  try {
    const { execSync } = require('child_process');
    log.info('Running: forge build');
    execSync('cd contracts && forge build', { stdio: 'inherit' });
    log.success('Compilation successful');
  } catch (error) {
    log.error('Compilation failed!');
    process.exit(1);
  }

  // Step 2: Load artifacts
  log.step('Step 2: Loading Contract Artifacts');
  
  const sarcArtifactPath = path.join(__dirname, '../out/SARCToken.sol/SARCToken.json');
  const treasuryArtifactPath = path.join(__dirname, '../out/Treasury.sol/Treasury.json');
  
  if (!fs.existsSync(sarcArtifactPath)) {
    log.error(`SARCToken artifact not found: ${sarcArtifactPath}`);
    process.exit(1);
  }
  
  if (!fs.existsSync(treasuryArtifactPath)) {
    log.error(`Treasury artifact not found: ${treasuryArtifactPath}`);
    process.exit(1);
  }

  const sarcArtifact = JSON.parse(fs.readFileSync(sarcArtifactPath, 'utf8'));
  const treasuryArtifact = JSON.parse(fs.readFileSync(treasuryArtifactPath, 'utf8'));
  
  const sarcBytecode = sarcArtifact.bytecode.object;
  const treasuryBytecode = treasuryArtifact.bytecode.object;
  
  log.success('Artifacts loaded');

  // Step 3: Wallet setup
  log.step('Step 3: Wallet Setup');
  
  const privateKey = await prompt('Enter your deployer private key (starts with 0x): ');

  if (!privateKey || !privateKey.startsWith('0x')) {
    log.error('Invalid private key');
    process.exit(1);
  }

  const provider = new ethers.JsonRpcProvider(CONFIG.rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);

  log.success(`Connected to Arc Testnet`);
  log.info(`Deployer: ${wallet.address}`);

  const balance = await provider.getBalance(wallet.address);
  log.info(`Balance: ${ethers.formatUnits(balance, 18)} USDC`);

  if (balance < ethers.parseUnits('2', 18)) {
    log.warning('Low balance! You need ~2 USDC for deployment gas');
  }

  // Step 4: Deploy SARCToken
  log.step('Step 4: Deploying SARCToken');

  const SARCToken = new ethers.ContractFactory(SARC_TOKEN_ABI, sarcBytecode, wallet);
  const sarcToken = await SARCToken.deploy();
  await sarcToken.waitForDeployment();
  const sarcAddress = await sarcToken.getAddress();

  log.success(`SARCToken deployed: ${sarcAddress}`);

  // Step 5: Deploy Treasury
  log.step('Step 5: Deploying Treasury');

  const Treasury = new ethers.ContractFactory(
    TREASURY_ABI,
    treasuryBytecode,
    wallet
  );

  const treasury = await Treasury.deploy(
    sarcAddress,                    // _sarcToken
    CONFIG.existingContracts.usdc, // _usdcToken
    CONFIG.exchangeRate            // _usdcPerKwh (0.10 USDC)
  );

  await treasury.waitForDeployment();
  const treasuryAddress = await treasury.getAddress();

  log.success(`Treasury deployed: ${treasuryAddress}`);

  // Step 6: Grant roles on SARCToken
  log.step('Step 6: Granting Roles on SARCToken');

  // Grant MINTER_ROLE to MintingController
  log.info('Granting MINTER_ROLE to MintingController...');
  let tx = await sarcToken.grantRole(
    CONFIG.roles.MINTER_ROLE,
    CONFIG.existingContracts.mintingController
  );
  await waitForTx(tx, 'Grant MINTER_ROLE');

  // Grant BURNER_ROLE to Treasury
  log.info('Granting BURNER_ROLE to Treasury...');
  tx = await sarcToken.grantRole(
    CONFIG.roles.BURNER_ROLE,
    treasuryAddress
  );
  await waitForTx(tx, 'Grant BURNER_ROLE');

  // Grant MINTER_ROLE to AI Agent
  const envPath = path.join(__dirname, '../../.env.local');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const aiAgentMatch = envContent.match(/AI_AGENT_WALLET_ADDRESS=([0-9a-fA-Fx]+)/);

  if (aiAgentMatch) {
    const aiAgent = aiAgentMatch[1];
    log.info(`Granting MINTER_ROLE to AI Agent (${aiAgent})...`);
    tx = await sarcToken.grantRole(CONFIG.roles.MINTER_ROLE, aiAgent);
    await waitForTx(tx, 'Grant MINTER_ROLE to AI Agent');
  }

  // Step 7: Update .env.local
  log.step('Step 7: Updating .env.local');

  let newEnvContent = envContent
    .replace(/VITE_SARC_TOKEN=.*/, `VITE_SARC_TOKEN=${sarcAddress}`)
    .replace(/VITE_TREASURY_ADDRESS=.*/, `VITE_TREASURY_ADDRESS=${treasuryAddress}`);

  // Add old addresses as backup
  if (!newEnvContent.includes('OLD_SARC_TOKEN')) {
    newEnvContent += `\n# Old Contracts (Pre-Burn)\nOLD_SARC_TOKEN=0x9604ad29C8fEe0611EcE73a91e192E5d976E2184\nOLD_TREASURY=0x8825518674A89e28d2C11CA0Ec49024ef6e1E2b2\n`;
  }

  fs.writeFileSync(envPath, newEnvContent);
  log.success('.env.local updated');

  // Step 8: Summary
  log.step('🎉 Deployment Complete!');

  console.log('\n');
  console.log('='.repeat(80));
  console.log(`${colors.bright}New Contract Addresses:${colors.reset}`);
  console.log('='.repeat(80));
  console.log('');
  console.log(`✅ SARCToken: ${colors.cyan}${sarcAddress}${colors.reset}`);
  console.log(`✅ Treasury: ${colors.cyan}${treasuryAddress}${colors.reset}`);
  console.log('');
  console.log(`${colors.bright}Unchanged:${colors.reset}`);
  console.log(`   RegistryV2: ${CONFIG.existingContracts.registry}`);
  console.log(`   MintingController: ${CONFIG.existingContracts.mintingController}`);
  console.log('');
  console.log('='.repeat(80));
  console.log('');

  log.warning('⚠️  IMPORTANT: MintingController still points to OLD token!');
  console.log('');
  console.log('You need to redeploy MintingController with new token address:');
  console.log('');
  console.log(`1. Edit contracts/src/MintingController.sol constructor OR`);
  console.log(`2. Add a setToken() function to MintingController`);
  console.log('');
  console.log('Recommended: Redeploy MintingController with:');
  console.log('');
  console.log(`   constructor(\n     address(${CONFIG.existingContracts.registry}), // registry\n     address(${sarcAddress}), // NEW sarcToken\n     ...\n   )`);
  console.log('');

  log.info('Next steps:');
  console.log('  1. Redeploy MintingController (see above)');
  console.log('  2. Fund new Treasury with USDC');
  console.log('  3. Restart frontend: npm run dev');
  console.log('  4. Test minting and redemption');
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
