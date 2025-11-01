export const CONTRACTS = {
  SARC_TOKEN: '0x9604ad29C8fEe0611EcE73a91e192E5d976E2184',
  REGISTRY: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
  TREASURY: '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199',
  MINTING_CONTROLLER: '0xdD2FD4581271e230360230F9337D5c0430Bf44C0',
} as const

export const ARC_TESTNET = {
  chainId: 1234,
  name: 'Arc Testnet',
  rpcUrl: 'https://rpc-testnet.arcchain.org',
  blockExplorer: 'https://testnet.arcscan.app',
  nativeCurrency: {
    name: 'USDC',
    symbol: 'USDC',
    decimals: 6,
  },
} as const

export const EXCHANGE_RATE = 0.10

export const MAX_DAILY_KWH = 100

export const DEMO_WALLET_ADDRESS = '0x742d35Cc6634C0532925a3b844Bc9C1199'
