/**
 * Circle Developer-Controlled Wallets Worker
 * 
 * This Cloudflare Worker handles server-side Circle API operations for
 * Developer-Controlled Wallets with Smart Contract Accounts (SCA).
 * 
 * Features:
 * - Create wallet sets
 * - Create SCA wallets on multiple EVM chains with unified addressing
 * - Derive wallets on-demand for new chains
 * - Sign and send transactions
 * - Request testnet tokens
 * 
 * SECURITY: Entity Secret is stored as a Cloudflare Worker secret
 */

import { initiateDeveloperControlledWalletsClient } from '@circle-fin/developer-controlled-wallets';

interface Env {
  CIRCLE_API_KEY: string;
  CIRCLE_ENTITY_SECRET: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // CORS headers for frontend requests
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      // Initialize Circle SDK client with Entity Secret
      const circleDeveloperSdk = initiateDeveloperControlledWalletsClient({
        apiKey: env.CIRCLE_API_KEY,
        entitySecret: env.CIRCLE_ENTITY_SECRET,
      });

      // Route: Health Check
      if (path === '/api/health' && request.method === 'GET') {
        return Response.json(
          { success: true, message: 'Circle Wallet Worker is running' },
          { headers: corsHeaders }
        );
      }

      // Route: Create Wallet Set
      if (path === '/api/wallet-sets/create' && request.method === 'POST') {
        const { name = 'SOLR-ARC Wallet Set' } = await request.json();
        
        const response = await circleDeveloperSdk.createWalletSet({ name });
        
        return Response.json(
          { 
            success: true,
            walletSet: response.data?.walletSet,
          },
          { headers: corsHeaders }
        );
      }

      // Route: Create SCA Wallets (with unified addressing)
      if (path === '/api/wallets/create' && request.method === 'POST') {
        const { 
          walletSetId,
          userId,
          blockchains = ['ARC-TESTNET'],
          count = 1,
        } = await request.json();
        
        if (!walletSetId) {
          return Response.json(
            { success: false, error: 'walletSetId is required' },
            { status: 400, headers: corsHeaders }
          );
        }

        // Create refId for unified addressing across chains
        const refId = userId || `user-${Date.now()}`;
        
        const response = await circleDeveloperSdk.createWallets({
          accountType: 'SCA', // Smart Contract Account
          blockchains,
          count,
          walletSetId,
          refId, // Same refId = same address across EVM chains
        });
        
        return Response.json(
          { 
            success: true,
            wallets: response.data?.wallets || [],
            refId,
          },
          { headers: corsHeaders }
        );
      }

      // Route: Derive Wallet (add new chain to existing wallet)
      if (path === '/api/wallets/derive' && request.method === 'POST') {
        const { 
          walletId,
          blockchain,
          refId,
        } = await request.json();
        
        if (!walletId || !blockchain) {
          return Response.json(
            { success: false, error: 'walletId and blockchain are required' },
            { status: 400, headers: corsHeaders }
          );
        }
        
        const response = await circleDeveloperSdk.createWalletOnChain({
          id: walletId,
          blockchain,
          refId,
        });
        
        return Response.json(
          { 
            success: true,
            wallet: response.data?.wallet,
          },
          { headers: corsHeaders }
        );
      }

      // Route: Get Wallets
      if (path === '/api/wallets' && request.method === 'GET') {
        const walletSetId = url.searchParams.get('walletSetId');
        const refId = url.searchParams.get('refId');
        const blockchain = url.searchParams.get('blockchain');
        
        const response = await circleDeveloperSdk.listWallets({
          ...(walletSetId && { walletSetId }),
          ...(refId && { refId }),
          ...(blockchain && { blockchain }),
        });
        
        return Response.json(
          { success: true, wallets: response.data?.wallets || [] },
          { headers: corsHeaders }
        );
      }

      // Route: Get Wallet by ID
      if (path.match(/^\/api\/wallets\/[^/]+$/) && request.method === 'GET') {
        const walletId = path.split('/').pop();
        
        const response = await circleDeveloperSdk.getWallet({ id: walletId! });
        
        return Response.json(
          { success: true, wallet: response.data?.wallet },
          { headers: corsHeaders }
        );
      }

      // Route: Get Token Balance
      if (path === '/api/wallets/balance' && request.method === 'GET') {
        const walletId = url.searchParams.get('walletId');
        
        if (!walletId) {
          return Response.json(
            { success: false, error: 'walletId is required' },
            { status: 400, headers: corsHeaders }
          );
        }
        
        const response = await circleDeveloperSdk.getWalletTokenBalance({ id: walletId });
        
        return Response.json(
          { success: true, tokenBalances: response.data?.tokenBalances || [] },
          { headers: corsHeaders }
        );
      }

      // Route: Create Transaction
      if (path === '/api/transactions/transfer' && request.method === 'POST') {
        const { 
          walletId,
          tokenId,
          destinationAddress,
          amounts,
          fee,
        } = await request.json();
        
        if (!walletId || !tokenId || !destinationAddress || !amounts) {
          return Response.json(
            { success: false, error: 'Missing required fields' },
            { status: 400, headers: corsHeaders }
          );
        }
        
        const response = await circleDeveloperSdk.createTransaction({
          walletId,
          tokenId,
          destinationAddress,
          amounts,
          fee: fee || { type: 'level', config: { feeLevel: 'HIGH' } },
        });
        
        return Response.json(
          { 
            success: true,
            transaction: response.data,
          },
          { headers: corsHeaders }
        );
      }

      // Route: Sign Contract Execution Transaction
      if (path === '/api/transactions/sign' && request.method === 'POST') {
        const { 
          walletId,
          transaction,
        } = await request.json();
        
        if (!walletId || !transaction || !transaction.to || !transaction.data) {
          return Response.json(
            { success: false, error: 'Missing required fields: walletId, transaction.to, transaction.data' },
            { status: 400, headers: corsHeaders }
          );
        }
        
        // Create contract execution transaction using Circle SDK
        const response = await circleDeveloperSdk.createContractExecutionTransaction({
          walletId,
          contractAddress: transaction.to,
          callData: transaction.data,
          amount: transaction.value || '0',
          fee: {
            type: 'level',
            config: {
              feeLevel: 'HIGH',
            },
          },
        });
        
        if (!response.data) {
          return Response.json(
            { success: false, error: 'Transaction creation failed' },
            { status: 500, headers: corsHeaders }
          );
        }
        
        return Response.json(
          { 
            success: true,
            txHash: response.data.id,
            transaction: response.data,
          },
          { headers: corsHeaders }
        );
      }

      // Route: Get Transaction Status
      if (path.match(/^\/api\/transactions\/[^/]+$/) && request.method === 'GET') {
        const transactionId = path.split('/').pop();
        
        const response = await circleDeveloperSdk.getTransaction({ id: transactionId! });
        
        return Response.json(
          { success: true, transaction: response.data?.transaction },
          { headers: corsHeaders }
        );
      }

      // Route: Request Testnet Tokens
      if (path === '/api/faucet' && request.method === 'POST') {
        const { 
          address, 
          blockchain = 'ARC-TESTNET',
          usdc = true,
          native = false,
        } = await request.json();
        
        if (!address) {
          return Response.json(
            { success: false, error: 'address is required' },
            { status: 400, headers: corsHeaders }
          );
        }
        
        const response = await circleDeveloperSdk.requestTestnetTokens({
          address,
          blockchain,
          usdc,
          native,
        });
        
        return Response.json(
          { success: true, data: response.data },
          { headers: corsHeaders }
        );
      }

      // Route not found
      return Response.json(
        { success: false, error: 'Route not found' },
        { status: 404, headers: corsHeaders }
      );

    } catch (error: any) {
      console.error('Circle Worker Error:', error);
      
      return Response.json(
        { 
          success: false, 
          error: error.message || 'Internal server error',
          details: error.toString(),
        },
        { status: 500, headers: corsHeaders }
      );
    }
  },
};
