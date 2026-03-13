export interface BeanStats {
  beanPriceUsd: number
  beanPriceNative: number
  priceChange24h: number
  volume24h: number
  liquidity: number
  fdv: number
  totalSupply: string
  totalMinted: string
  beanpotPool: string
}

export interface StakingGlobalStats {
  apr: number
  totalStaked: string
  tvlUsd: number
}

export interface UserStakingInfo {
  balance: string
  pendingRewards: string
  compoundFeeReserve: string
  canCompound: boolean
}

export interface UserRewards {
  pendingETH: string
  pendingETHFormatted: string
  pendingBEAN: {
    unroastedFormatted: string
    roastedFormatted: string
    grossFormatted: string
    feeFormatted: string
    netFormatted: string
  }
}

export interface HistoryItem {
  type: string
  roundId?: string
  ethReward?: string
  ethRewardFormatted?: string
  beanReward?: string
  beanRewardFormatted?: string
  amount?: string
  amountFormatted?: string
  sourceCurrency?: 'ETH' | 'WETH'
  sourceAmount?: string
  sourceAmountUsd?: number
  timestamp: number
  txHash?: string
}

export interface CurrentRound {
  roundId: string
  beanpotPool: string
  beanpotPoolFormatted: string
  totalDeployed: string
  totalDeployedFormatted: string
  settled: boolean
}

export interface BurnEvent {
  bstrBurned: number
  ethSpent: number
  timestamp: number
  txHash: string
  blockNumber: number
}

export interface DashboardData {
  stats: BeanStats
  stakingGlobal: StakingGlobalStats
  userStaking: UserStakingInfo
  currentRound: CurrentRound
  history: HistoryItem[]
}
