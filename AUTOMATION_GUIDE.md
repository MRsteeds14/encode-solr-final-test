# Automation Scripts Guide

## Overview
These scripts provide automation for contract updates, service management, and configuration validation to prevent common deployment issues.

## Available Commands

### 🚀 Service Management

#### Start all services
```bash
npm run services
```
- Validates configuration
- Starts PoG Agent worker (port 8787)
- Starts frontend dev server (port 5000)
- Logs to `logs/` directory
- Saves PIDs for cleanup

#### Stop all services
```bash
npm run stop
```
- Gracefully stops all running services
- Cleans up ports 5000 and 8787
- Removes PID files

#### Health check
```bash
npm run health
```
- Checks frontend is responding
- Verifies PoG Agent is running
- Tests RPC connection
- Validates contract deployment

### 📦 Contract Management

#### Sync ABIs from Foundry
```bash
npm run sync-abis
```
- Extracts ABIs from `contracts/out/`
- Saves to `src/lib/abis/`
- Generates TypeScript index file
- Run after: `forge build`

#### Validate configuration
```bash
npm run validate
```
- Checks all environment variables
- Validates address formats
- Verifies contracts deployed on-chain
- Checks worker configuration sync

#### Deploy and update
```bash
npm run deploy
```
**Interactive deployment script:**
1. Builds contracts with Forge
2. Syncs ABIs automatically
3. Offers deployment options:
   - Deploy new MintingController
   - Full deployment (future)
   - Skip deployment
4. Updates `.env.local` with new addresses
5. Updates `wrangler.toml` for workers
6. Validates final configuration

## Usage Examples

### Daily Development
```bash
# Start your work session
npm run services

# Your services are now running
# Frontend: http://localhost:5000
# PoG Agent: http://localhost:8787

# When done
npm run stop
```

### After Contract Changes
```bash
# 1. Build contracts
cd contracts && forge build && cd ..

# 2. Sync ABIs to frontend
npm run sync-abis

# 3. If you redeployed, update addresses manually in .env.local
# or use the interactive script:
npm run deploy

# 4. Validate everything is correct
npm run validate

# 5. Restart services with new config
npm run stop && npm run services
```

### Debugging Issues
```bash
# Check if services are healthy
npm run health

# If unhealthy, check logs
tail -f logs/frontend.log
tail -f logs/pog-agent.log

# Restart services
npm run stop && npm run services
```

## Script Details

### `scripts/start-services.sh`
**What it does:**
- Validates config before starting
- Kills existing processes on ports
- Installs dependencies if missing
- Starts workers and frontend in background
- Saves PIDs for cleanup
- Shows service URLs and log paths

**Requirements:**
- `.env.local` must be configured
- `workers/pog-agent/.dev.vars` should have secrets

### `scripts/stop-services.sh`
**What it does:**
- Stops services by PID files
- Fallback: kills by port number
- Cleans up wrangler processes
- Safe to run multiple times

### `scripts/health-check.sh`
**What it does:**
- HTTP requests to frontend (port 5000)
- HTTP request to PoG Agent (port 8787)
- RPC call to Arc testnet
- Checks MintingController has code deployed

**Exit codes:**
- 0: All checks passed
- 1: One or more checks failed

### `scripts/sync-abis.cjs`
**What it does:**
- Reads Foundry artifacts from `contracts/out/`
- Extracts ABI arrays
- Writes to `src/lib/abis/*.json`
- Generates `src/lib/abis/index.ts` for imports

**Syncs these contracts:**
- RegistryV2
- MintingController
- Treasury
- SARCToken

### `scripts/validate-config.cjs`
**What it does:**
- Loads `.env.local`
- Checks required variables exist
- Validates Ethereum address format
- Uses `cast code` to verify deployment
- Compares frontend vs worker config
- Checks ABI files exist

**Exit codes:**
- 0: All valid (or warnings only)
- 1: Errors found

### `scripts/deploy-and-update.sh`
**What it does:**
- Runs `forge build`
- Runs `sync-abis.cjs`
- Interactive deployment menu
- Uses `forge create` for deployment
- Updates `.env.local` with sed
- Updates `wrangler.toml` with sed
- Runs validation at end

**Deployment options:**
1. **Deploy MintingController only**: Uses existing token/registry addresses
2. **Full deployment**: Not yet implemented (add manually)
3. **Skip deployment**: Just sync config

## File Locations

**Logs:**
- `logs/frontend.log` - Vite dev server output
- `logs/pog-agent.log` - Wrangler worker output

**PIDs:**
- `.pids/frontend.pid` - Frontend process ID
- `.pids/pog-agent.pid` - Worker process ID

**ABIs:**
- `src/lib/abis/*.json` - Auto-generated ABI files
- `src/lib/abis/index.ts` - TypeScript exports

## Troubleshooting

### Services won't start
```bash
# Check config
npm run validate

# Check if ports are in use
lsof -i :5000
lsof -i :8787

# Force kill
npm run stop
```

### ABIs not syncing
```bash
# Ensure contracts are built
cd contracts && forge build && cd ..

# Run sync manually
npm run sync-abis

# Check artifacts exist
ls contracts/out/MintingController.sol/
```

### Validation fails
```bash
# Check .env.local exists and has all variables
npm run validate

# Fix any missing variables
# Then re-validate
npm run validate
```

### Deployment issues
```bash
# Make sure you have:
# 1. DEPLOYER_PRIVATE_KEY in .env.local
# 2. Foundry installed (forge)
# 3. Cast installed

# Test deployment manually first:
cd contracts
forge create src/MintingController.sol:MintingController \
  --rpc-url $VITE_ARC_RPC_URL \
  --private-key $DEPLOYER_PRIVATE_KEY \
  --constructor-args <TOKEN> <REGISTRY>
```

## Integration with Existing Workflow

**Before automation:**
1. Deploy contract with `cast send`
2. Manually copy address
3. Update `.env.local`
4. Update `wrangler.toml`
5. Manually sync ABI
6. Restart services individually
7. Hope everything matches

**After automation:**
1. `npm run deploy` → Interactive, updates everything
2. `npm run services` → Starts everything with validation
3. `npm run health` → Verify it's working

## Future Enhancements

- [ ] Full contract deployment (all contracts)
- [ ] Role granting automation
- [ ] Wallet registration automation
- [ ] TypeChain integration for type safety
- [ ] GitHub Actions CI/CD pipeline
- [ ] Docker compose for services

## Tips

💡 **Always run `npm run validate` after deployment**
💡 **Use `npm run services` instead of `npm run dev` for full stack**
💡 **Check health before testing**: `npm run health`
💡 **Logs are your friend**: `tail -f logs/*.log`
