/**
 * Smart Contract Instances for SOLR-ARC
 * Centralized contract configuration using Thirdweb
 */

import { getContract } from 'thirdweb';
import { client } from './thirdweb-client';
import { arcTestnet } from './chains';

const FALLBACK_CONTRACT_ADDRESSES = {
  SARC_TOKEN: '0x9604ad29C8fEe0611EcE73a91e192E5d976E2184',
  REGISTRY: '0xc9559c5884e53548b3d2362aa694b64519d291ee', // RegistryV2 - with pre-configured roles
  TREASURY: '0x8825518674A89e28d2C11CA0Ec49024ef6e1E2b2',
  MINTING_CONTROLLER: '0xf84748FDDeE07b4d4d483c6291D0D3E97aD61d00',
} as const;

function getEnvAddress(key: string, fallback: string) {
  const value = import.meta.env[key as keyof ImportMetaEnv] as string | undefined;
  return value && value.length > 0 ? value : fallback;
}

// Contract Addresses resolved from environment (fallback to known deployments)
export const CONTRACT_ADDRESSES = {
  SARC_TOKEN: getEnvAddress('VITE_SARC_TOKEN', FALLBACK_CONTRACT_ADDRESSES.SARC_TOKEN),
  REGISTRY: getEnvAddress('VITE_REGISTRY_ADDRESS', FALLBACK_CONTRACT_ADDRESSES.REGISTRY),
  TREASURY: getEnvAddress('VITE_TREASURY_ADDRESS', FALLBACK_CONTRACT_ADDRESSES.TREASURY),
  MINTING_CONTROLLER: getEnvAddress(
    'VITE_MINTING_CONTROLLER_ADDRESS',
    FALLBACK_CONTRACT_ADDRESSES.MINTING_CONTROLLER,
  ),
} as const;

// Registry Contract - Manages solar producer whitelisting and validation
export const registryContract = getContract({
  client,
  address: CONTRACT_ADDRESSES.REGISTRY,
  chain: arcTestnet,
});

// MintingController Contract - Orchestrates token minting with AI validation
export const mintingControllerContract = getContract({
  client,
  address: CONTRACT_ADDRESSES.MINTING_CONTROLLER,
  chain: arcTestnet,
});

// Treasury Contract - Handles sARC → USDC redemptions
export const treasuryContract = getContract({
  client,
  address: CONTRACT_ADDRESSES.TREASURY,
  chain: arcTestnet,
});

// sARC Token Contract - ERC20 token representing solar energy
export const sarcTokenContract = getContract({
  client,
  address: CONTRACT_ADDRESSES.SARC_TOKEN,
  chain: arcTestnet,
});

// USDC Contract - Native USDC on Arc Testnet
export const usdcContract = getContract({
  client,
  address: '0x3600000000000000000000000000000000000000',
  chain: arcTestnet,
});

// Export all contracts
export const contracts = {
  registry: registryContract,
  mintingController: mintingControllerContract,
  treasury: treasuryContract,
  sarcToken: sarcTokenContract,
  usdc: usdcContract,
} as const;
