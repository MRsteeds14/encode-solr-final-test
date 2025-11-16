/**
 * Circle API Client for Server-Side Operations
 * 
 * This handles backend operations like:
 * - Creating users
 * - Generating session tokens
 * - Initializing wallets
 * - Creating transaction challenges
 * 
 * IMPORTANT: This should ideally run on a backend server, not in the browser.
 * For the hackathon, we'll use a Cloudflare Worker to handle these operations securely.
 */

import { initiateDeveloperControlledWalletsClient } from '@circle-fin/user-controlled-wallets';

const CIRCLE_API_BASE = 'https://api.circle.com/v1/w3s';

export interface CircleUser {
  userId: string;
  userToken?: string;
  encryptionKey?: string;
  challengeId?: string;
}

export interface CircleWallet {
  id: string;
  address: string;
  blockchain: string;
  state: 'LIVE' | 'FROZEN';
  createDate: string;
  custodyType: 'ENDUSER';
  walletSetId: string;
}

/**
 * Initialize the Circle SDK Client for backend operations
 * This will be used in Cloudflare Workers, not in the frontend
 */
export function initializeCircleBackendSDK(apiKey: string, entitySecret: string) {
  const client = initiateDeveloperControlledWalletsClient({
    apiKey,
    entitySecret,
  });

  return client;
}

/**
 * Create a new user in Circle's system
 * 
 * @param userId - Unique identifier for the user (UUID format recommended)
 * @returns User creation response
 */
export async function createCircleUser(userId: string): Promise<{ user: CircleUser }> {
  const apiKey = import.meta.env.VITE_CIRCLE_API_KEY;
  
  const response = await fetch(`${CIRCLE_API_BASE}/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ userId }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create user: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Acquire a session token for a user
 * Session tokens are valid for 60 minutes
 * 
 * @param userId - The user's unique identifier
 * @returns Session token data (userToken, encryptionKey)
 */
export async function acquireSessionToken(userId: string): Promise<{
  userToken: string;
  encryptionKey: string;
}> {
  const apiKey = import.meta.env.VITE_CIRCLE_API_KEY;
  
  const response = await fetch(`${CIRCLE_API_BASE}/users/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ userId }),
  });

  if (!response.ok) {
    throw new Error(`Failed to acquire session token: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    userToken: data.data.userToken,
    encryptionKey: data.data.encryptionKey,
  };
}

/**
 * Initialize a user account and create their first wallet
 * This also creates a challenge for the user to set their PIN
 * 
 * @param userId - The user's unique identifier
 * @param blockchain - The blockchain to create the wallet on (e.g., 'ARC-TESTNET')
 * @returns Challenge data for PIN setup
 */
export async function initializeUserWallet(
  userId: string,
  blockchain: string = 'ARC-TESTNET',
  idempotencyKey?: string
): Promise<{
  challengeId: string;
  userToken: string;
  encryptionKey: string;
}> {
  const apiKey = import.meta.env.VITE_CIRCLE_API_KEY;
  
  // Generate idempotency key if not provided
  const idemKey = idempotencyKey || `${userId}-${Date.now()}`;
  
  const response = await fetch(`${CIRCLE_API_BASE}/user/initialize`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'X-User-Token': '', // Will be set after session token is acquired
    },
    body: JSON.stringify({
      userId,
      idempotencyKey: idemKey,
      blockchains: [blockchain],
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to initialize user wallet: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data;
}

/**
 * Get wallet information for a user
 * 
 * @param userId - The user's unique identifier
 * @returns Array of wallets owned by the user
 */
export async function getUserWallets(userId: string): Promise<CircleWallet[]> {
  const apiKey = import.meta.env.VITE_CIRCLE_API_KEY;
  
  const response = await fetch(`${CIRCLE_API_BASE}/wallets?userId=${userId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get user wallets: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data.wallets || [];
}

/**
 * Request testnet tokens for a wallet
 * 
 * @param address - The wallet address to fund
 * @param blockchain - The blockchain network (e.g., 'ARC-TESTNET')
 * @param tokenType - Type of token to request ('usdc', 'native', 'eurc')
 */
export async function requestTestnetTokens(
  address: string,
  blockchain: string = 'ARC-TESTNET',
  tokenType: 'usdc' | 'native' | 'eurc' = 'usdc'
): Promise<void> {
  const apiKey = import.meta.env.VITE_CIRCLE_API_KEY;
  
  const response = await fetch(`${CIRCLE_API_BASE}/faucet/drips`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      address,
      blockchain,
      [tokenType]: true,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to request testnet tokens: ${response.statusText}`);
  }
}
