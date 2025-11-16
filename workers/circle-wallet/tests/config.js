const WORKER_URL = process.env.VITE_CIRCLE_WALLET_WORKER_URL || process.env.CIRCLE_DEV_WALLET_WORKER_URL || 'http://localhost:8788';
const DEFAULT_BLOCKCHAIN = process.env.CIRCLE_BLOCKCHAIN || 'ARC-TESTNET';

module.exports = { WORKER_URL, DEFAULT_BLOCKCHAIN };
