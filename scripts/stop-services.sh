#!/bin/bash

# Stop Services Script
# Gracefully stops all running services

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🛑 Stopping SOLR Arc services...${NC}\n"

# Function to stop service by PID file
stop_service() {
    local name=$1
    local pid_file=$2
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if ps -p $pid > /dev/null 2>&1; then
            kill $pid 2>/dev/null || kill -9 $pid 2>/dev/null
            echo -e "${GREEN}✓${NC} Stopped $name (PID: $pid)"
        else
            echo -e "${YELLOW}⚠${NC} $name (PID: $pid) not running"
        fi
        rm "$pid_file"
    else
        echo -e "${YELLOW}⚠${NC} No PID file found for $name"
    fi
}

# Stop by PID files
if [ -d ".pids" ]; then
    stop_service "Frontend" ".pids/frontend.pid"
    stop_service "PoG Agent" ".pids/pog-agent.pid"
fi

# Fallback: kill by port
echo -e "\n${BLUE}Checking ports...${NC}"
if lsof -Pi :5000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    lsof -ti:5000 | xargs kill -9 2>/dev/null || true
    echo -e "${GREEN}✓${NC} Cleaned up port 5000"
fi

if lsof -Pi :8787 -sTCP:LISTEN -t >/dev/null 2>&1; then
    lsof -ti:8787 | xargs kill -9 2>/dev/null || true
    echo -e "${GREEN}✓${NC} Cleaned up port 8787"
fi

# Kill any wrangler dev processes
pkill -f "wrangler.*pog-agent" 2>/dev/null && echo -e "${GREEN}✓${NC} Stopped wrangler processes" || true

echo -e "\n${GREEN}✅ All services stopped${NC}"
