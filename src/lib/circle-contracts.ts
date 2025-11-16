/**
 * Circle Contract Integration Layer
 * 
 * Replaces Thirdweb with direct ethers.js + Circle Developer-Controlled Wallets
 * All transactions signed via Circle Worker API
 */

import { ethers } from 'ethers';

// Arc Testnet RPC
const ARC_RPC_URL = import.meta.env.VITE_ARC_RPC_URL || 'https://rpc.testnet.arc.network';
const CIRCLE_WORKER_URL = import.meta.env.VITE_CIRCLE_DEV_WALLET_WORKER_URL;

// Contract ABIs (minimal - only what we need)
const ERC20_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
];

const MINTING_CONTROLLER_ABI = [
  'function mintFromGeneration(address producer, uint256 kwhAmount, string memory ipfsProof) returns (uint256)',
  'function hasRole(bytes32 role, address account) view returns (bool)',
  'function getMintingStats() view returns (uint256 todayMinted, uint256 dailyRemaining, uint256 allTimeMinted, bool breakerStatus)',
  'function getProducerStats(address producer) view returns (uint256 totalMintedByProducer)',
  'function circuitBreakerTriggered() view returns (bool)',
  'function maxDailyMint() view returns (uint256)',
  'function sarcToken() view returns (address)',
];

const TREASURY_ABI = [
  'function redeemForUSDC(uint256 sarcAmount, string memory ipfsProof) returns (uint256)',
  'function getExchangeRate() view returns (uint256)',
  'function getRedemptionCapacity() view returns (uint256)',
  'function usdcPerKwh() view returns (uint256)',
];

const REGISTRY_ABI = [
  'function isWhitelisted(address producer) view returns (bool)',
  'function registerProducer(address producer, uint256 capacityKw, uint256 dailyCapKwh, string memory ipfsMetadata)',
  'function getProducer(address producer) view returns (tuple(bool isWhitelisted, uint256 systemCapacityKw, uint256 dailyCapKwh, uint256 totalMinted, uint256 lastMintTimestamp, string ipfsMetadata, uint256 registrationDate))',
];

// Contract addresses from env
const CONTRACTS = {
  sarcToken: import.meta.env.VITE_SARC_TOKEN,
  mintingController: import.meta.env.VITE_MINTING_CONTROLLER_ADDRESS,
  treasury: import.meta.env.VITE_TREASURY_ADDRESS,
  registry: import.meta.env.VITE_REGISTRY_ADDRESS,
  usdc: import.meta.env.VITE_ARC_USDC_ADDRESS,
};

// Provider instance
let provider: ethers.JsonRpcProvider | null = null;

export function getProvider(): ethers.JsonRpcProvider {
  if (!provider) {
    provider = new ethers.JsonRpcProvider(ARC_RPC_URL);
  }
  return provider;
}

// Contract instances (read-only)
export function getSarcTokenContract(): ethers.Contract {
  return new ethers.Contract(CONTRACTS.sarcToken, ERC20_ABI, getProvider());
}

export function getUsdcContract(): ethers.Contract {
  return new ethers.Contract(CONTRACTS.usdc, ERC20_ABI, getProvider());
}

export function getMintingControllerContract(): ethers.Contract {
  return new ethers.Contract(CONTRACTS.mintingController, MINTING_CONTROLLER_ABI, getProvider());
}

export function getTreasuryContract(): ethers.Contract {
  return new ethers.Contract(CONTRACTS.treasury, TREASURY_ABI, getProvider());
}

export function getRegistryContract(): ethers.Contract {
  return new ethers.Contract(CONTRACTS.registry, REGISTRY_ABI, getProvider());
}

// Sign and send transaction via Circle Worker
export async function signAndSendTransaction(
  walletId: string,
  contractAddress: string,
  functionName: string,
  args: any[]
): Promise<any> {
  if (!CIRCLE_WORKER_URL) {
    throw new Error('CIRCLE_WORKER_URL not configured');
  }

  // Encode the transaction data
  const iface = new ethers.Interface(
    functionName.includes('mint') ? MINTING_CONTROLLER_ABI :
    functionName.includes('redeem') ? TREASURY_ABI :
    functionName.includes('register') ? REGISTRY_ABI :
    ERC20_ABI
  );
  
  const data = iface.encodeFunctionData(functionName, args);

  console.log('🔧 Signing transaction:', {
    walletId,
    contractAddress,
    functionName,
    args,
    encodedData: data,
  });

  // Send to Circle Worker to sign
  const response = await fetch(`${CIRCLE_WORKER_URL}/api/transactions/sign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      walletId,
      transaction: {
        to: contractAddress,
        data,
        value: '0',
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('❌ Transaction signing failed:', error);
    throw new Error(error.error || 'Transaction signing failed');
  }

  const result = await response.json();
  console.log('✅ Transaction result:', result);
  return result;
}

// Helper: Format token amounts (handle 6 and 18 decimals)
export function formatTokenAmount(amount: bigint, decimals: number = 18): string {
  return ethers.formatUnits(amount, decimals);
}

export function parseTokenAmount(amount: string, decimals: number = 18): bigint {
  return ethers.parseUnits(amount, decimals);
}

// Helper: Get token balance
export async function getTokenBalance(
  tokenAddress: string,
  walletAddress: string
): Promise<string> {
  const contract = new ethers.Contract(tokenAddress, ERC20_ABI, getProvider());
  const balance = await contract.balanceOf(walletAddress);
  
  // Detect decimals (USDC = 6, sARC = 18)
  const decimals = tokenAddress.toLowerCase() === CONTRACTS.usdc.toLowerCase() ? 6 : 18;
  return formatTokenAmount(balance, decimals);
}

// Helper: Check if address is whitelisted producer
export async function isWhitelistedProducer(address: string): Promise<boolean> {
  const registry = getRegistryContract();
  return await registry.isWhitelisted(address);
}

// Helper: Get producer info
export async function getProducerInfo(address: string) {
  const registry = getRegistryContract();
  const info = await registry.producers(address);
  return {
    isActive: info[0],
    capacityKw: Number(info[1]),
    dailyCapKwh: Number(info[2]),
    totalProduction: Number(info[3]),
    lastMintDate: Number(info[4]),
    ipfsMetadata: info[5],
  };
}

// Helper: Get treasury stats
export async function getTreasuryStats() {
  const treasury = getTreasuryContract();
  const usdc = getUsdcContract();
  
  const [exchangeRate, capacity, balance] = await Promise.all([
    treasury.usdcPerKwh(),
    treasury.getRedemptionCapacity(),
    usdc.balanceOf(CONTRACTS.treasury),
  ]);
  
  return {
    exchangeRate: formatTokenAmount(exchangeRate, 6),
    redemptionCapacity: formatTokenAmount(capacity, 18),
    usdcBalance: formatTokenAmount(balance, 6),
  };
}

// Helper: Get minting controller stats
export async function getMintingStats() {
  const controller = getMintingControllerContract();
  const stats = await controller.getMintingStats();
  
  return {
    todayMinted: stats[0],
    dailyRemaining: stats[1],
    allTimeMinted: stats[2],
    breakerStatus: stats[3],
  };
}

// Helper: Get producer minting stats
export async function getProducerMintingStats(address: string) {
  const controller = getMintingControllerContract();
  const totalMinted = await controller.getProducerStats(address);
  
  return {
    totalMinted,
  };
}

export { CONTRACTS };
