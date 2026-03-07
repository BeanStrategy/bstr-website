// Mock data for local preview only.
// Enabled via MOCK_DATA=true in .env.local — never set in production.
// Enabled via MOCK_DATA=true in .env.local — never set in production.

import type { BeanStats, StakingGlobalStats, UserStakingInfo, UserRewards, CurrentRound, HistoryItem, BurnEvent } from '@/types'

// 2026-03-07 22:00 UTC — simulates 7 days of agent operation
const NOW = 1772920800
const H = 3600

export const mockBeanStats: BeanStats = {
  beanPriceUsd: 205.42,
  beanPriceNative: 0.0000742,
  priceChange24h: 3.2,
  volume24h: 48200,
  liquidity: 1240000,
  fdv: 7420000,
  totalSupply: '36,000,000',
  totalMinted: '36,000,000',
  beanpotPool: '162.4',
}

export const mockStakingGlobal: StakingGlobalStats = {
  apr: 532,
  totalStaked: '847.23',
  tvlUsd: 173964,
}

export const mockUserStaking: UserStakingInfo = {
  balance: '2.2847',
  pendingRewards: '0.0041',
  compoundFeeReserve: '0.0005',
  canCompound: false,
}

export const mockUserRewards: UserRewards = {
  pendingETH: '3800000000000000',
  pendingETHFormatted: '0.0038',
  pendingBEAN: {
    unroastedFormatted: '0.0041',
    roastedFormatted: '0.0039',
    grossFormatted: '0.0041',
    feeFormatted: '0.0002',
    netFormatted: '0.0039',
  },
}

export const mockCurrentRound: CurrentRound = {
  roundId: '4821',
  beanpotPool: '162400000000000000000',
  beanpotPoolFormatted: '162.4',
  totalDeployed: '8300000000000000000',
  totalDeployedFormatted: '8.3',
  settled: false,
}

// 4 buyback+burn executions over 7 days (fires at 1:30am when ETH yield accumulates above floor)
export const mockBurnHistory: BurnEvent[] = [
  {
    bstrBurned: 9240,
    ethSpent: 0.0068,
    timestamp: NOW - H * 10,
    txHash: '0xf1a3c7e9b2d5f8a0c3e6b9d2f5a8c1e4b7d0f3a6c9e2b5d8f1a4c7e0b3d6f9a2',
    blockNumber: 28471203,
  },
  {
    bstrBurned: 8610,
    ethSpent: 0.0063,
    timestamp: NOW - H * 34,
    txHash: '0xb4d7f0a3c6e9b2d5f8a1c4e7b0d3f6a9c2e5b8d1f4a7c0e3b6d9f2a5c8e1b4d7',
    blockNumber: 28462847,
  },
  {
    bstrBurned: 7980,
    ethSpent: 0.0058,
    timestamp: NOW - H * 58,
    txHash: '0x2e5b8d1f4a7c0e3b6d9f2a5c8e1b4d7f0a3c6e9b2d5f8a1c4e7b0d3f6a9c2e5b',
    blockNumber: 28454491,
  },
  {
    bstrBurned: 7320,
    ethSpent: 0.0054,
    timestamp: NOW - H * 82,
    txHash: '0x8c1e4b7d0f3a6c9e2b5d8f1a4c7e0b3d6f9a2c5e8b1d4f7a0c3e6b9d2f5a8c1e',
    blockNumber: 28446135,
  },
]

// 7 days of realistic agent activity — every 4h compound, 1 ETH claim, initial stake
export const mockHistory: HistoryItem[] = [
  // Day 7 (today)
  {
    type: 'yieldCompounded',
    amountFormatted: '0.0041',
    beanRewardFormatted: '0.0041',
    timestamp: NOW - H * 2,
    txHash: '0x3a7f2c8d1e94b056f3a2c8e7d0b4f1a69c3e2b8d0f5a7c1e4b2d8f3a6c9e2b51',
  },
  {
    type: 'yieldCompounded',
    amountFormatted: '0.0040',
    beanRewardFormatted: '0.0040',
    timestamp: NOW - H * 6,
    txHash: '0x1b4e8c2a0f7d3b6e9c2a5f8b1d4e7c0a3f6b9c2e5a8f1b4d7e0a3c6f9b2e5a82',
  },
  {
    type: 'yieldCompounded',
    amountFormatted: '0.0040',
    beanRewardFormatted: '0.0040',
    timestamp: NOW - H * 10,
    txHash: '0x7c1e4b2d8f3a6c9e2b5d1f4a7c0e3b6d9f2a5c8e1b4d7f0a3c6e9b2d5f8a1c43',
  },
  {
    type: 'yieldCompounded',
    amountFormatted: '0.0039',
    beanRewardFormatted: '0.0039',
    timestamp: NOW - H * 14,
    txHash: '0x9d2f5a8c1e4b7d0f3a6c9e2b5d8f1a4c7e0b3d6f9a2c5e8b1d4f7a0c3e6b9d24',
  },
  // Day 6
  {
    type: 'claimedETH',
    ethRewardFormatted: '0.0071',
    timestamp: NOW - H * 18,
    txHash: '0x5e8b1d4f7a0c3e6b9d2f5a8c1e4b7d0f3a6c9e2b5d8f1a4c7e0b3d6f9a2c5e85',
  },
  {
    type: 'yieldCompounded',
    amountFormatted: '0.0038',
    beanRewardFormatted: '0.0038',
    timestamp: NOW - H * 22,
    txHash: '0x2a5c8e1b4d7f0a3c6e9b2d5f8a1c4e7b0d3f6a9c2e5b8d1f4a7c0e3b6d9f2a56',
  },
  {
    type: 'yieldCompounded',
    amountFormatted: '0.0038',
    beanRewardFormatted: '0.0038',
    timestamp: NOW - H * 26,
    txHash: '0x8f3a6c9e2b5d1f4a7c0e3b6d9f2a5c8e1b4d7f0a3c6e9b2d5f8a1c4e7b0d3f67',
  },
  {
    type: 'yieldCompounded',
    amountFormatted: '0.0037',
    beanRewardFormatted: '0.0037',
    timestamp: NOW - H * 30,
    txHash: '0x4b7d0f3a6c9e2b5d8f1a4c7e0b3d6f9a2c5e8b1d4f7a0c3e6b9d2f5a8c1e4b78',
  },
  // Day 5
  {
    type: 'yieldCompounded',
    amountFormatted: '0.0036',
    beanRewardFormatted: '0.0036',
    timestamp: NOW - H * 34,
    txHash: '0x0c3e6b9d2f5a8c1e4b7d0f3a6c9e2b5d8f1a4c7e0b3d6f9a2c5e8b1d4f7a0c39',
  },
  {
    type: 'yieldCompounded',
    amountFormatted: '0.0035',
    beanRewardFormatted: '0.0035',
    timestamp: NOW - H * 38,
    txHash: '0x6d9f2a5c8e1b4d7f0a3c6e9b2d5f8a1c4e7b0d3f6a9c2e5b8d1f4a7c0e3b6d9a',
  },
  {
    type: 'yieldCompounded',
    amountFormatted: '0.0035',
    beanRewardFormatted: '0.0035',
    timestamp: NOW - H * 42,
    txHash: '0xe2b5d8f1a4c7e0b3d6f9a2c5e8b1d4f7a0c3e6b9d2f5a8c1e4b7d0f3a6c9e2bb',
  },
  // Day 4
  {
    type: 'yieldCompounded',
    amountFormatted: '0.0034',
    beanRewardFormatted: '0.0034',
    timestamp: NOW - H * 46,
    txHash: '0xa4c7e0b3d6f9a2c5e8b1d4f7a0c3e6b9d2f5a8c1e4b7d0f3a6c9e2b5d8f1a4cc',
  },
  {
    type: 'yieldCompounded',
    amountFormatted: '0.0033',
    beanRewardFormatted: '0.0033',
    timestamp: NOW - H * 50,
    txHash: '0xf7a0c3e6b9d2f5a8c1e4b7d0f3a6c9e2b5d8f1a4c7e0b3d6f9a2c5e8b1d4f7dd',
  },
  {
    type: 'yieldCompounded',
    amountFormatted: '0.0033',
    beanRewardFormatted: '0.0033',
    timestamp: NOW - H * 54,
    txHash: '0xb3d6f9a2c5e8b1d4f7a0c3e6b9d2f5a8c1e4b7d0f3a6c9e2b5d8f1a4c7e0b3ee',
  },
  // Day 3
  {
    type: 'yieldCompounded',
    amountFormatted: '0.0032',
    beanRewardFormatted: '0.0032',
    timestamp: NOW - H * 58,
    txHash: '0xc6e9b2d5f8a1c4e7b0d3f6a9c2e5b8d1f4a7c0e3b6d9f2a5c8e1b4d7f0a3c6ff',
  },
  {
    type: 'yieldCompounded',
    amountFormatted: '0.0031',
    beanRewardFormatted: '0.0031',
    timestamp: NOW - H * 62,
    txHash: '0xd9f2a5c8e1b4d7f0a3c6e9b2d5f8a1c4e7b0d3f6a9c2e5b8d1f4a7c0e3b6d9f0',
  },
  {
    type: 'yieldCompounded',
    amountFormatted: '0.0030',
    beanRewardFormatted: '0.0030',
    timestamp: NOW - H * 66,
    txHash: '0x1a4e7b0d3f6a9c2e5b8d1f4a7c0e3b6d9f2a5c8e1b4d7f0a3c6e9b2d5f8a1c41',
  },
  // Day 2
  {
    type: 'yieldCompounded',
    amountFormatted: '0.0029',
    beanRewardFormatted: '0.0029',
    timestamp: NOW - H * 70,
    txHash: '0x2b5f8c1e4a7d0f3b6c9e2b5d8f1a4c7e0b3d6f9a2c5e8b1d4f7a0c3e6b9d2f52',
  },
  // Day 1 — initial stake
  {
    type: 'stakeDeposited',
    amountFormatted: '2.0500',
    beanRewardFormatted: '2.0500',
    timestamp: NOW - H * 72,
    txHash: '0x9e3c6f0a2d5b8e1c4f7a0d3e6c9b2f5a8e1b4d7f0a3c6e9b2d5f8a1c4e7b0d33',
  },
]
