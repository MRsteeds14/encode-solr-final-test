#!/bin/bash

# Deploy and Update Automation Script
# This script deploys contracts, updates environment variables, and syncs ABIs

set -e  # Exit on error

echo "🚀 Starting automated deployment and configuration update..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: Must run from project root${NC}"
    exit 1
fi

# Function to extract address from cast output
extract_address() {
    local output="$1"
    echo "$output" | grep -oE '0x[a-fA-F0-9]{40}' | head -n 1
}

# Function to update env file
update_env() {
    local key="$1"
    local value="$2"
    local env_file=".env.local"
    
    if grep -q "^${key}=" "$env_file" 2>/dev/null; then
        # Update existing key (works on both macOS and Linux)
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s|^${key}=.*|${key}=${value}|" "$env_file"
        else
            sed -i "s|^${key}=.*|${key}=${value}|" "$env_file"
        fi
        echo -e "${GREEN}✓${NC} Updated ${key} in .env.local"
    else
        echo "${key}=${value}" >> "$env_file"
        echo -e "${GREEN}✓${NC} Added ${key} to .env.local"
    fi
}

# Function to update wrangler.toml
update_wrangler() {
    local key="$1"
    local value="$2"
    local wrangler_file="workers/pog-agent/wrangler.toml"
    
    if grep -q "^${key} =" "$wrangler_file" 2>/dev/null; then
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s|^${key} = \".*\"|${key} = \"${value}\"|" "$wrangler_file"
        else
            sed -i "s|^${key} = \".*\"|${key} = \"${value}\"|" "$wrangler_file"
        fi
        echo -e "${GREEN}✓${NC} Updated ${key} in wrangler.toml"
    fi
}

echo -e "\n${BLUE}📋 Step 1: Building contracts${NC}"
cd contracts
forge build
cd ..
echo -e "${GREEN}✓${NC} Contracts built successfully"

echo -e "\n${BLUE}📦 Step 2: Syncing ABIs${NC}"
node scripts/sync-abis.cjs
echo -e "${GREEN}✓${NC} ABIs synced to frontend"

echo -e "\n${BLUE}🔧 Step 3: Contract Deployment${NC}"
echo "Choose deployment option:"
echo "1) Deploy new MintingController only"
echo "2) Deploy all contracts (full deployment)"
echo "3) Skip deployment (just sync configs)"
read -p "Enter choice (1-3): " deploy_choice

if [ "$deploy_choice" == "1" ]; then
    echo -e "${YELLOW}Deploying MintingController...${NC}"
    
    # Load existing addresses from .env.local
    source .env.local
    
    cd contracts
    output=$(forge create src/MintingController.sol:MintingController \
        --rpc-url $VITE_ARC_RPC_URL \
        --private-key $DEPLOYER_PRIVATE_KEY \
        --constructor-args $VITE_SARC_TOKEN_ADDRESS $VITE_REGISTRY_ADDRESS 2>&1)
    
    minting_address=$(extract_address "$output")
    cd ..
    
    if [ -n "$minting_address" ]; then
        echo -e "${GREEN}✓${NC} MintingController deployed: ${minting_address}"
        update_env "VITE_MINTING_CONTROLLER_ADDRESS" "$minting_address"
        update_wrangler "MINTING_CONTROLLER_ADDRESS" "$minting_address"
        
        echo -e "\n${YELLOW}⚠️  Remember to grant MINTER_ROLE to new MintingController:${NC}"
        echo "cast send $VITE_SARC_TOKEN_ADDRESS \"grantRole(bytes32,address)\" \\"
        echo "  0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6 \\"
        echo "  $minting_address \\"
        echo "  --rpc-url $VITE_ARC_RPC_URL --private-key $DEPLOYER_PRIVATE_KEY"
    else
        echo -e "${RED}❌ Deployment failed${NC}"
        exit 1
    fi
    
elif [ "$deploy_choice" == "2" ]; then
    echo -e "${YELLOW}Full deployment not implemented yet. Deploy manually with forge create.${NC}"
    exit 1
fi

echo -e "\n${BLUE}🔄 Step 4: Validating configuration${NC}"
node scripts/validate-config.cjs

echo -e "\n${GREEN}✅ Deployment and configuration complete!${NC}"
echo -e "\n${BLUE}Next steps:${NC}"
echo "1. Restart services: npm run services"
echo "2. Grant roles if needed (see output above)"
echo "3. Test the application"
