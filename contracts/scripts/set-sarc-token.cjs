#!/usr/bin/env node
/**
 * Check / Set SARCToken in MintingController
 * If the function exists, call setSarcToken with new token address.
 * If not, instruct user to redeploy MintingController.
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

const provider = new ethers.JsonRpcProvider('https://rpc.testnet.arc.network');
const DEPLOYER = getEnv('DEPLOYER_PRIVATE_KEY');
const NEW_TOKEN = getEnv('VITE_SARC_TOKEN');
const MINTING = getEnv('VITE_MINTING_CONTROLLER_ADDRESS');

async function main() {
  console.log('\nChecking if deployed MintingController has setSarcToken...');

  const iface = new ethers.Interface([
    'function setSarcToken(address _newToken) external',
    'function sarcToken() view returns (address)'
  ]);

  const minting = new ethers.Contract(MINTING, iface, provider);

  try {
    const curr = await minting.sarcToken();
    console.log('Current token address:', curr);
  } catch (err) {
    console.log('Function sarcToken() may not be available on deployed contract.');
    console.error(err.message);
  }

  // Check if setSarcToken exists by attempting an eth_call with zero gas
  try {
    const data = iface.encodeFunctionData('setSarcToken', [NEW_TOKEN]);
    // Using provider.call to simulate
    const res = await provider.call({ to: MINTING, data }, 'latest');
    // If it returns something (or empty) then function exists
    console.log('Looks like setSarcToken exists on deployed contract. Calling it...');

    if (!DEPLOYER) {
      console.error('Please set DEPLOYER_PRIVATE_KEY in .env.local to call the setter');
      process.exit(1);
    }

    const wallet = new ethers.Wallet(DEPLOYER, provider);
    const mintingWithSigner = minting.connect(wallet);

    const tx = await mintingWithSigner.setSarcToken(NEW_TOKEN);
    console.log('Tx sent:', tx.hash);
    console.log('Waiting for confirmation...');
    await tx.wait();

    console.log('setSarcToken called successfully!');
    const after = await minting.sarcToken();
    console.log('New token address:', after);
  } catch (err) {
    console.error('setSarcToken not available or call failed. You will need to redeploy MintingController.');
    console.error(err.message);
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
