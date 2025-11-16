#!/usr/bin/env node
/**
 * Setup Demo User for Testing
 * Pre-registers the Circle wallet from .env.local with test@solar.com
 */

const DEMO_EMAIL = 'test@solar.com';
const WALLET_ID = 'f36f6138-5f74-5ae9-b8d6-30d7d5640e55';
const WALLET_ADDRESS = '0x5f02c9d3424f59607d2458d08d89e2d2979657b7';

const demoUser = {
  userId: DEMO_EMAIL.toLowerCase(),
  email: DEMO_EMAIL,
  walletId: WALLET_ID,
  walletAddress: WALLET_ADDRESS,
  createdAt: Date.now(),
  lastLogin: Date.now(),
};

console.log('📝 Setting up demo user in registry...');
console.log('');
console.log('Demo User Profile:');
console.log('  Email:', DEMO_EMAIL);
console.log('  Wallet Address:', WALLET_ADDRESS);
console.log('  Wallet ID:', WALLET_ID);
console.log('');
console.log('✅ Copy this JSON and paste it into your browser console:');
console.log('');
console.log('localStorage.setItem("solr_user_registry", JSON.stringify([' + JSON.stringify(demoUser) + ']));');
console.log('localStorage.setItem("circle_wallet", JSON.stringify({id:"' + WALLET_ID + '",address:"' + WALLET_ADDRESS + '",blockchain:"ARC-TESTNET",state:"LIVE",accountType:"SCA"}));');
console.log('localStorage.setItem("circle_wallet_user_id", "' + DEMO_EMAIL.toLowerCase() + '");');
console.log('window.location.reload();');
console.log('');
console.log('📌 Or use these credentials to register via the UI:');
console.log('  Email: test@solar.com');
console.log('  (Will create wallet automatically)');
