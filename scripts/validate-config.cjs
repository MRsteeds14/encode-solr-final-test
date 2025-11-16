#!/usr/bin/env node

/**
 * Configuration Validation Script
 * Checks that all required environment variables are set and contracts are deployed
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const GREEN = '\x1b[32m';
const BLUE = '\x1b[34m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const RESET = '\x1b[0m';

console.log(`${BLUE}🔍 Validating configuration...${RESET}\n`);

// Load .env.local
const envPath = path.join(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
  console.log(`${RED}❌ .env.local not found${RESET}`);
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
  }
});

// Required variables
const REQUIRED_VARS = [
  'VITE_ARC_RPC_URL',
  'VITE_CIRCLE_WALLET_ADDRESS',
  'VITE_REGISTRY_ADDRESS',
  'VITE_MINTING_CONTROLLER_ADDRESS',
  'VITE_TREASURY_ADDRESS',
  'VITE_SARC_TOKEN_ADDRESS',
  'VITE_POG_AGENT_URL'
];

let errors = 0;
let warnings = 0;

// Check required variables
console.log(`${BLUE}Environment Variables:${RESET}`);
REQUIRED_VARS.forEach(varName => {
  if (!env[varName] || env[varName] === '') {
    console.log(`${RED}✗${RESET} ${varName}: Missing`);
    errors++;
  } else {
    console.log(`${GREEN}✓${RESET} ${varName}: ${env[varName].substring(0, 20)}...`);
  }
});

// Validate addresses are properly formatted
console.log(`\n${BLUE}Address Format:${RESET}`);
const ADDRESS_VARS = [
  'VITE_CIRCLE_WALLET_ADDRESS',
  'VITE_REGISTRY_ADDRESS',
  'VITE_MINTING_CONTROLLER_ADDRESS',
  'VITE_TREASURY_ADDRESS',
  'VITE_SARC_TOKEN_ADDRESS'
];

ADDRESS_VARS.forEach(varName => {
  const address = env[varName];
  if (address && /^0x[a-fA-F0-9]{40}$/.test(address)) {
    console.log(`${GREEN}✓${RESET} ${varName}: Valid format`);
  } else if (address) {
    console.log(`${RED}✗${RESET} ${varName}: Invalid address format`);
    errors++;
  }
});

// Check if contracts have code deployed (optional, requires cast)
console.log(`\n${BLUE}On-Chain Validation:${RESET}`);
try {
  const rpcUrl = env.VITE_ARC_RPC_URL;
  
  ADDRESS_VARS.forEach(varName => {
    if (!env[varName]) return;
    
    try {
      const code = execSync(
        `cast code ${env[varName]} --rpc-url ${rpcUrl}`,
        { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
      ).trim();
      
      if (code === '0x' || code === '') {
        console.log(`${YELLOW}⚠${RESET} ${varName}: No code at address (not deployed?)`);
        warnings++;
      } else {
        console.log(`${GREEN}✓${RESET} ${varName}: Contract deployed (${code.length} bytes)`);
      }
    } catch (error) {
      console.log(`${YELLOW}⚠${RESET} ${varName}: Could not verify (${error.message})`);
    }
  });
} catch (error) {
  console.log(`${YELLOW}⚠${RESET} On-chain validation skipped (cast not available)`);
}

// Check worker configuration
console.log(`\n${BLUE}Worker Configuration:${RESET}`);
const wranglerPath = path.join(process.cwd(), 'workers/pog-agent/wrangler.toml');
if (fs.existsSync(wranglerPath)) {
  const wranglerContent = fs.readFileSync(wranglerPath, 'utf8');
  const mintingMatch = wranglerContent.match(/MINTING_CONTROLLER_ADDRESS = "([^"]+)"/);
  
  if (mintingMatch && mintingMatch[1] === env.VITE_MINTING_CONTROLLER_ADDRESS) {
    console.log(`${GREEN}✓${RESET} wrangler.toml: MintingController address matches`);
  } else {
    console.log(`${YELLOW}⚠${RESET} wrangler.toml: MintingController address mismatch`);
    console.log(`   Frontend: ${env.VITE_MINTING_CONTROLLER_ADDRESS}`);
    console.log(`   Worker:   ${mintingMatch ? mintingMatch[1] : 'not found'}`);
    warnings++;
  }
} else {
  console.log(`${YELLOW}⚠${RESET} wrangler.toml not found`);
}

// Check if ABIs exist
console.log(`\n${BLUE}ABIs:${RESET}`);
const abisDir = path.join(process.cwd(), 'src/lib/abis');
if (fs.existsSync(abisDir)) {
  const abiFiles = fs.readdirSync(abisDir).filter(f => f.endsWith('.json'));
  console.log(`${GREEN}✓${RESET} Found ${abiFiles.length} ABI files`);
  abiFiles.forEach(file => {
    console.log(`  • ${file}`);
  });
} else {
  console.log(`${YELLOW}⚠${RESET} ABIs directory not found (run sync-abis.js)`);
  warnings++;
}

// Summary
console.log(`\n${'='.repeat(50)}`);
if (errors > 0) {
  console.log(`${RED}❌ Validation failed: ${errors} error(s), ${warnings} warning(s)${RESET}`);
  process.exit(1);
} else if (warnings > 0) {
  console.log(`${YELLOW}⚠️  Validation passed with ${warnings} warning(s)${RESET}`);
  console.log(`${BLUE}💡 Fix warnings for optimal setup${RESET}`);
  process.exit(0);
} else {
  console.log(`${GREEN}✅ All checks passed!${RESET}`);
  process.exit(0);
}
