/**
 * Circle Developer-Controlled Wallets SDK Configuration
 * 
 * This uses Developer-Controlled Wallets (YOU manage the wallets on behalf of users)
 * with Smart Contract Accounts (SCA) for advanced features like:
 * - Gas sponsorship
 * - Unified addressing across EVM chains
 * - Batch operations
 * - Programmable wallet logic
 * 
 * Setup Steps:
 * 1. Generate Entity Secret (see instructions below)
 * 2. Register Entity Secret Ciphertext
 * 3. Create Wallet Set
 * 4. Create SCA Wallets on Arc Testnet
 */

import { initiateDeveloperControlledWalletsClient } from '@circle-fin/developer-controlled-wallets';

// Configuration from environment variables
export const CIRCLE_CONFIG = {
  apiKey: import.meta.env.VITE_CIRCLE_API_KEY || '',
  appId: import.meta.env.VITE_CIRCLE_APP_ID || '',
  // Entity Secret is ONLY used in backend (Cloudflare Worker)
  // NEVER expose it in frontend code
} as const;

// Validate configuration
if (!CIRCLE_CONFIG.apiKey) {
  console.error('❌ VITE_CIRCLE_API_KEY is not set in .env.local');
}

if (!CIRCLE_CONFIG.appId) {
  console.warn('⚠️ VITE_CIRCLE_APP_ID is not set.');
}

/**
 * Initialize Circle SDK for Developer-Controlled Wallets
 * This should ONLY be called on the backend (Cloudflare Worker)
 * 
 * @param entitySecret - Your Circle Entity Secret (32-byte hex string)
 */
export function initializeCircleDevSDK(apiKey: string, entitySecret: string) {
  try {
    const client = initiateDeveloperControlledWalletsClient({
      apiKey,
      entitySecret,
    });

    console.log('✅ Circle Developer SDK initialized successfully');
    return client;
  } catch (error) {
    console.error('❌ Failed to initialize Circle SDK:', error);
    throw error;
  }
}

/**
 * Generate Entity Secret using Circle SDK
 * Run this ONCE to generate your entity secret
 * 
 * IMPORTANT: Save the output securely!
 */
export async function generateEntitySecret(apiKey: string) {
  const client = initiateDeveloperControlledWalletsClient({ apiKey });
  
  const response = await client.createEntitySecretCiphertext();
  
  return {
    entitySecret: response.data?.entitySecret,
    entitySecretCiphertext: response.data?.entitySecretCiphertext,
  };
}

// Blockchain configurations for Arc Testnet
export const SUPPORTED_BLOCKCHAINS = {
  ARC_TESTNET: 'ARC-TESTNET',
  // These will have unified addresses when using the same walletSet
  ETH_SEPOLIA: 'ETH-SEPOLIA',
  POLYGON_AMOY: 'MATIC-AMOY',
  ARBITRUM_SEPOLIA: 'ARB-SEPOLIA',
  BASE_SEPOLIA: 'BASE-SEPOLIA',
} as const;

export type SupportedBlockchain = typeof SUPPORTED_BLOCKCHAINS[keyof typeof SUPPORTED_BLOCKCHAINS];
