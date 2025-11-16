/**
 * Proof-of-Generation (PoG) Agent
 * Validates energy generation data, uploads proof to IPFS, and triggers minting
 */

import { ethers } from 'ethers';

// Environment variables interface
interface Env {
  // Arc Network
  ARC_RPC_URL: string;
  AI_AGENT_PRIVATE_KEY: string;

  // Contract addresses
  MINTING_CONTROLLER_ADDRESS: string;
  REGISTRY_ADDRESS: string;

  // IPFS
  PINATA_JWT: string;

  // Optional: NREL API for validation
  NREL_API_KEY?: string;
}

// Request body interface
interface GenerationRequest {
  producerAddress: string;
  kwhGenerated: number;
  timestamp: number;
  metadata?: {
    location?: string;
    systemCapacity?: number;
    weatherConditions?: string;
  };
}

// IPFS upload to Pinata
async function uploadToIPFS(data: any, env: Env): Promise<string> {
  const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${env.PINATA_JWT}`,
    },
    body: JSON.stringify({
      pinataContent: data,
      pinataMetadata: {
        name: `SOLR-ARC-Generation-${data.producer}-${data.timestamp}`,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`IPFS upload failed: ${response.statusText}`);
  }

  const result = await response.json();
  return result.IpfsHash;
}

// Validate energy generation with NREL PVWatts API
async function validateWithNREL(
  data: GenerationRequest,
  env: Env
): Promise<{ valid: boolean; reason: string }> {
  if (!env.NREL_API_KEY || !data.metadata?.location || !data.metadata?.systemCapacity) {
    return { valid: true, reason: 'NREL validation skipped (missing data)' };
  }

  try {
    // Parse location (assumed format: "lat,lon")
    const [lat, lon] = data.metadata.location.split(',').map(s => parseFloat(s.trim()));

    if (isNaN(lat) || isNaN(lon)) {
      return { valid: true, reason: 'NREL validation skipped (invalid location format)' };
    }

    // Query NREL PVWatts API for estimated generation
    const url = `https://developer.nrel.gov/api/pvwatts/v8.json?api_key=${env.NREL_API_KEY}&system_capacity=${data.metadata.systemCapacity}&lat=${lat}&lon=${lon}&azimuth=180&tilt=${lat}`;

    const response = await fetch(url);
    if (!response.ok) {
      console.error('NREL API error:', response.statusText);
      return { valid: true, reason: 'NREL validation skipped (API error)' };
    }

    const nrelData = await response.json();
    const annualGeneration = nrelData.outputs.ac_annual; // kWh/year
    const dailyAverage = annualGeneration / 365;

    // Check if claimed generation is within 150% of daily average (allows for peak days)
    const threshold = dailyAverage * 1.5;

    if (data.kwhGenerated > threshold) {
      return {
        valid: false,
        reason: `Generation ${data.kwhGenerated} kWh exceeds NREL estimate ${threshold.toFixed(2)} kWh`,
      };
    }

    return { valid: true, reason: 'NREL validation passed' };
  } catch (error) {
    console.error('NREL validation error:', error);
    return { valid: true, reason: 'NREL validation skipped (error)' };
  }
}

// MintingController ABI (partial)
const MINTING_CONTROLLER_ABI = [
  'function mintFromGeneration(address _producer, uint256 _kwhAmount, string memory _ipfsProof) external returns (uint256)',
  'function circuitBreakerTriggered() external view returns (bool)',
];

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle OPTIONS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Handle GET request for health check
    if (request.method === 'GET') {
      return new Response(
        JSON.stringify({ 
          status: 'healthy',
          service: 'POG Agent',
          timestamp: Date.now(),
          version: '1.0.0'
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Only accept POST for generation requests
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    try {
      // Parse request
      const data: GenerationRequest = await request.json();

      // Validate request
      if (!data.producerAddress || !data.kwhGenerated || !data.timestamp) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields: producerAddress, kwhGenerated, timestamp' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Step 1: Validate with NREL (if available)
      const nrelValidation = await validateWithNREL(data, env);
      if (!nrelValidation.valid) {
        return new Response(
          JSON.stringify({
            error: 'NREL validation failed',
            reason: nrelValidation.reason,
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Step 2: Upload proof to IPFS
      const ipfsHash = await uploadToIPFS(
        {
          producer: data.producerAddress,
          kwh: data.kwhGenerated,
          timestamp: data.timestamp,
          metadata: data.metadata,
          nrelValidation: nrelValidation.reason,
          agentVersion: '1.0.0',
        },
        env
      );

      console.log('IPFS proof uploaded:', ipfsHash);

      // Step 3: Setup blockchain connection
      const provider = new ethers.JsonRpcProvider(env.ARC_RPC_URL);
      const wallet = new ethers.Wallet(env.AI_AGENT_PRIVATE_KEY, provider);

      // Check gas balance
      const balance = await provider.getBalance(wallet.address);
      if (balance === 0n) {
        return new Response(
          JSON.stringify({
            error: 'Agent wallet has no gas',
            agentAddress: wallet.address,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Step 4: Connect to MintingController
      const mintingController = new ethers.Contract(
        env.MINTING_CONTROLLER_ADDRESS,
        MINTING_CONTROLLER_ABI,
        wallet
      );

      // Check circuit breaker
      const isTriggered = await mintingController.circuitBreakerTriggered();
      if (isTriggered) {
        return new Response(
          JSON.stringify({ error: 'Circuit breaker is active, minting paused' }),
          {
            status: 503,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Step 5: Call mintFromGeneration
      // Convert kWh to Wei (18 decimals)
      const kwhAmountWei = ethers.parseUnits(data.kwhGenerated.toString(), 18);

      console.log('Calling mintFromGeneration:', {
        producer: data.producerAddress,
        kwhAmount: kwhAmountWei.toString(),
        ipfsHash,
      });

      const tx = await mintingController.mintFromGeneration(
        data.producerAddress,
        kwhAmountWei,
        ipfsHash
      );

      console.log('Transaction sent:', tx.hash);

      // Wait for confirmation
      const receipt = await tx.wait();

      console.log('Transaction confirmed:', receipt.hash);

      // Parse minted amount from logs (if needed)
      const mintedEvent = receipt.logs.find((log: any) => {
        try {
          const parsed = mintingController.interface.parseLog(log);
          return parsed?.name === 'Minted';
        } catch {
          return false;
        }
      });

      let mintedAmount = '0';
      if (mintedEvent) {
        const parsed = mintingController.interface.parseLog(mintedEvent);
        mintedAmount = ethers.formatUnits(parsed?.args.sarcAmount || 0, 18);
      }

      // Return success
      return new Response(
        JSON.stringify({
          success: true,
          txHash: receipt.hash,
          ipfsProof: ipfsHash,
          mintedAmount,
          nrelValidation: nrelValidation.reason,
          blockNumber: receipt.blockNumber,
          gasUsed: receipt.gasUsed.toString(),
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } catch (error: any) {
      console.error('PoG Agent error:', error);

      return new Response(
        JSON.stringify({
          error: 'PoG Agent failed',
          message: error.message,
          stack: error.stack,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
  },
};