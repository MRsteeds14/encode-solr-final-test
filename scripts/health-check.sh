#!/bin/bash

# Health Check Script
# Verifies all services are running and responsive

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🏥 Running health checks...${NC}\n"

errors=0

# Check Frontend
echo -e "${BLUE}Frontend (http://localhost:5000):${NC}"
if curl -s http://localhost:5000 > /dev/null; then
    echo -e "${GREEN}✓${NC} Responding"
else
    echo -e "${RED}✗${NC} Not responding"
    errors=$((errors + 1))
fi

# Check PoG Agent
echo -e "\n${BLUE}PoG Agent (http://localhost:8787):${NC}"
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8787/health 2>/dev/null)
if [ "$response" = "200" ] || [ "$response" = "404" ]; then
    echo -e "${GREEN}✓${NC} Responding (HTTP $response)"
else
    echo -e "${RED}✗${NC} Not responding"
    errors=$((errors + 1))
fi

# Check RPC connection
echo -e "\n${BLUE}Arc Testnet RPC:${NC}"
source .env.local
rpc_response=$(curl -s -X POST $VITE_ARC_RPC_URL \
    -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
    2>/dev/null)

if echo "$rpc_response" | grep -q "result"; then
    block=$(echo "$rpc_response" | grep -oP '"result":"\K[^"]+')
    echo -e "${GREEN}✓${NC} Connected (block: $block)"
else
    echo -e "${RED}✗${NC} Connection failed"
    errors=$((errors + 1))
fi

# Check contract deployment
echo -e "\n${BLUE}Smart Contracts:${NC}"
if [ -n "$VITE_MINTING_CONTROLLER_ADDRESS" ]; then
    code=$(cast code $VITE_MINTING_CONTROLLER_ADDRESS --rpc-url $VITE_ARC_RPC_URL 2>/dev/null)
    if [ -n "$code" ] && [ "$code" != "0x" ]; then
        echo -e "${GREEN}✓${NC} MintingController deployed"
    else
        echo -e "${RED}✗${NC} MintingController not found at address"
        errors=$((errors + 1))
    fi
else
    echo -e "${YELLOW}⚠${NC} MintingController address not configured"
fi

# Summary
echo -e "\n${'='.repeat(50)}"
if [ $errors -eq 0 ]; then
    echo -e "${GREEN}✅ All health checks passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ $errors check(s) failed${NC}"
    echo -e "${YELLOW}💡 Run 'npm run services' to restart services${NC}"
    exit 1
fi
