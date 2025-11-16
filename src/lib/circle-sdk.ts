/**
 * Circle User-Controlled Wallets SDK Configuration
 * 
 * This file initializes the Circle Web SDK for user-controlled wallets.
 * Users control their own private keys via PIN/biometric authentication.
 * 
 * Setup Steps:
 * 1. Go to https://console.circle.com/wallets/user/configurator
 * 2. Copy your App ID and add to .env.local as VITE_CIRCLE_APP_ID
 * 3. Copy your Entity Secret and add to .env.local as CIRCLE_ENTITY_SECRET
 */

import { W3SSdk } from '@circle-fin/w3s-pw-web-sdk';

// Configuration from environment variables
export const CIRCLE_CONFIG = {
  apiKey: import.meta.env.VITE_CIRCLE_API_KEY || '',
  appId: import.meta.env.VITE_CIRCLE_APP_ID || '',
  // IMPORTANT: Entity Secret should NEVER be exposed in frontend
  // It will be used in backend/workers only
} as const;

// Validate configuration
if (!CIRCLE_CONFIG.apiKey) {
  console.error('❌ VITE_CIRCLE_API_KEY is not set in .env.local');
}

if (!CIRCLE_CONFIG.appId) {
  console.warn('⚠️ VITE_CIRCLE_APP_ID is not set. Please add it from Circle Console.');
  console.warn('📖 Get it from: https://console.circle.com/wallets/user/configurator');
}

/**
 * Initialize the Circle Web SDK for User-Controlled Wallets
 * This SDK handles PIN setup, wallet creation, and transaction signing in the browser
 */
export function initializeCircleSDK(): W3SSdk | null {
  if (!CIRCLE_CONFIG.appId) {
    console.error('Cannot initialize Circle SDK: App ID is missing');
    return null;
  }

  try {
    const sdk = new W3SSdk({
      appSettings: {
        appId: CIRCLE_CONFIG.appId,
      },
    });

    console.log('✅ Circle Web SDK initialized successfully');
    return sdk;
  } catch (error) {
    console.error('❌ Failed to initialize Circle SDK:', error);
    return null;
  }
}

// Export singleton instance
export const circleSDK = initializeCircleSDK();
