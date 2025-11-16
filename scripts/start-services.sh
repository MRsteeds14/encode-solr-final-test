#!/bin/bash

# Service Management Script
# Starts all required services and validates they're running

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🚀 Starting SOLR Arc services...${NC}\n"

# Function to check if port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Function to kill process on port
kill_port() {
    local port=$1
    local name=$2
    if check_port $port; then
        echo -e "${YELLOW}⚠️  Port $port in use, killing existing process...${NC}"
        lsof -ti:$port | xargs kill -9 2>/dev/null || true
        sleep 1
        echo -e "${GREEN}✓${NC} Cleaned up port $port"
    fi
}

# Validate configuration first
echo -e "${BLUE}Step 1: Validating configuration${NC}"
node scripts/validate-config.cjs
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Configuration validation failed${NC}"
    echo -e "${YELLOW}💡 Run 'npm run deploy' to update configuration${NC}"
    exit 1
fi
echo -e "${GREEN}✓${NC} Configuration valid\n"

# Kill existing processes
echo -e "${BLUE}Step 2: Cleaning up existing processes${NC}"
kill_port 5000 "Frontend"
kill_port 8787 "PoG Agent"
echo ""

# Start PoG Agent Worker
echo -e "${BLUE}Step 3: Starting PoG Agent Worker${NC}"
cd workers/pog-agent

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing PoG Agent dependencies...${NC}"
    npm install
fi

# Check for required secrets
if ! grep -q "AI_AGENT_PRIVATE_KEY" .dev.vars 2>/dev/null; then
    echo -e "${YELLOW}⚠️  Warning: .dev.vars not found or missing AI_AGENT_PRIVATE_KEY${NC}"
    echo -e "${YELLOW}   PoG Agent may not function properly${NC}"
fi

# Start in background
nohup npm run dev > ../../logs/pog-agent.log 2>&1 &
POG_PID=$!
cd ../..

sleep 3

if check_port 8787; then
    echo -e "${GREEN}✓${NC} PoG Agent running on port 8787 (PID: $POG_PID)"
else
    echo -e "${RED}✗${NC} PoG Agent failed to start"
    echo -e "${YELLOW}Check logs/pog-agent.log for details${NC}"
    exit 1
fi
echo ""

# Start Frontend
echo -e "${BLUE}Step 4: Starting Frontend Dev Server${NC}"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing frontend dependencies...${NC}"
    npm install
fi

# Start in background
nohup npm run dev > logs/frontend.log 2>&1 &
FRONTEND_PID=$!

sleep 3

if check_port 5000; then
    echo -e "${GREEN}✓${NC} Frontend running on port 5000 (PID: $FRONTEND_PID)"
else
    echo -e "${RED}✗${NC} Frontend failed to start"
    echo -e "${YELLOW}Check logs/frontend.log for details${NC}"
    exit 1
fi
echo ""

# Save PIDs for later
mkdir -p .pids
echo $POG_PID > .pids/pog-agent.pid
echo $FRONTEND_PID > .pids/frontend.pid

echo -e "${GREEN}✅ All services started successfully!${NC}\n"
echo -e "${BLUE}📊 Service Status:${NC}"
echo -e "  Frontend:   http://localhost:5000  (PID: $FRONTEND_PID)"
echo -e "  PoG Agent:  http://localhost:8787  (PID: $POG_PID)"
echo ""
echo -e "${BLUE}📝 Logs:${NC}"
echo -e "  Frontend:   tail -f logs/frontend.log"
echo -e "  PoG Agent:  tail -f logs/pog-agent.log"
echo ""
echo -e "${BLUE}🛑 To stop services:${NC}"
echo -e "  npm run stop"
echo ""
echo -e "${GREEN}Ready for testing! Open http://localhost:5000 in your browser${NC}"
