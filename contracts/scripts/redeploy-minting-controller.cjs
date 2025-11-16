#!/usr/bin/env node
/**
 * Redeploy MintingController with new SARCToken address
 * - Reads existing MintingController's settings (registry, maxDailyMint, anomalyThreshold)
 * - Deploys new MintingController with same values but new token
 * - Grants roles to old minter and operator addresses
 */

const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const getEnv = (key) => {
  const m = envContent.match(new RegExp(`${key}=(.+)`));
  return m ? m[1].trim() : null;
};

const DEPLOYER = getEnv('DEPLOYER_PRIVATE_KEY');
const OLD_MINTING = getEnv('VITE_MINTING_CONTROLLER_ADDRESS');
const NEW_SARC = getEnv('VITE_SARC_TOKEN');
const REGISTRY = getEnv('VITE_REGISTRY_ADDRESS');

async function main() {
  if (!DEPLOYER) {
    console.error('Set DEPLOYER_PRIVATE_KEY in .env.local');
    process.exit(1);
  }

  const provider = new ethers.JsonRpcProvider('https://rpc.testnet.arc.network');
  const wallet = new ethers.Wallet(DEPLOYER, provider);

  // Read onchain values (maxDailyMint, anomalyThreshold)
  const oldAbi = [
    'function maxDailyMint() view returns (uint256)',
    'function anomalyThreshold() view returns (uint256)'
  ];
  const old = new ethers.Contract(OLD_MINTING, oldAbi, provider);

  const maxDailyMint = await old.maxDailyMint();
  const anomalyThreshold = await old.anomalyThreshold();

  console.log('Registry:', REGISTRY);
  console.log('Old Minting Controller:', OLD_MINTING);
  console.log('MaxDailyMint:', maxDailyMint.toString());
  console.log('AnomalyThreshold:', anomalyThreshold.toString());

  // Build and deploy new MintingController
  const artifactPath = path.join(__dirname, '../out/MintingController.sol/MintingController.json');
  if (!fs.existsSync(artifactPath)) {
    console.error('Must run forge build in contracts first');
    process.exit(1);
  }

  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode.object, wallet);

  // Constructor params: registryAddress, sarcTokenAddress, maxDailyMint, anomalyThreshold
  console.log('Deploying new MintingController...');
  const newController = await factory.deploy(REGISTRY, NEW_SARC, maxDailyMint, anomalyThreshold);
  await newController.waitForDeployment();
  const newAddress = await newController.getAddress();

  console.log('New MintingController deployed at:', newAddress);

  // Grant roles to old deployer / ai agent; assume old has same roles
  // We will transfer roles in separate script if needed

  // Update .env.local
  const newEnv = envContent.replace(/VITE_MINTING_CONTROLLER_ADDRESS=.*/, `VITE_MINTING_CONTROLLER_ADDRESS=${newAddress}`);
  fs.writeFileSync(envPath, newEnv);

  console.log('Updated .env.local with new MintingController address');
}

main().catch(err => { console.error(err); process.exit(1); });
