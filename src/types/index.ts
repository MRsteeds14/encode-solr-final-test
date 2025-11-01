export interface Transaction {
  id: string
  type: 'mint' | 'redeem'
  amount: number
  usdcAmount?: number
  timestamp: number
  status: 'pending' | 'confirmed' | 'failed'
  txHash: string
  ipfsHash?: string
}

export interface ProducerProfile {
  address: string
  systemCapacity: number
  dailyCap: number
  totalGenerated: number
  totalEarned: number
  joinedDate: number
}

export interface EnergyData {
  date: string
  kwh: number
}

export interface WalletState {
  connected: boolean
  address: string | null
  network: string
}

export interface TokenBalance {
  sarc: number
  usdc: number
}

export interface AgentStatus {
  name: string
  status: 'idle' | 'processing' | 'completed' | 'error'
  message: string
}
