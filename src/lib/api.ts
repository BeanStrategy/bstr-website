import type {
  BeanStats,
  StakingGlobalStats,
  UserStakingInfo,
  UserRewards,
  CurrentRound,
  HistoryItem,
} from '@/types'

const API = 'https://api.minebean.com/api'

export async function fetchBeanStats(): Promise<BeanStats> {
  const res = await fetch(`${API}/stats`, { next: { revalidate: 30 } })
  if (!res.ok) throw new Error('Failed to fetch stats')
  const data = await res.json()
  // API nests price data under data.bean — normalize to flat structure
  return {
    beanPriceUsd: Number(data.bean?.priceUsd ?? 0),
    beanPriceNative: Number(data.bean?.priceNative ?? 0),
    priceChange24h: Number(data.bean?.priceChange24h ?? 0),
    volume24h: Number(data.bean?.volume24h ?? 0),
    liquidity: Number(data.bean?.liquidity ?? 0),
    fdv: Number(data.bean?.fdv ?? 0),
    totalSupply: data.totalSupplyFormatted ?? data.totalSupply ?? '0',
    totalMinted: data.totalMintedFormatted ?? data.totalMinted ?? '0',
    beanpotPool: data.beanpotPoolFormatted ?? '0',
  }
}

export async function fetchStakingGlobalStats(): Promise<StakingGlobalStats> {
  const res = await fetch(`${API}/staking/stats`, { next: { revalidate: 60 } })
  if (!res.ok) throw new Error('Failed to fetch staking stats')
  const data = await res.json()
  // API returns tvlUsd and apr as strings — coerce to numbers
  return {
    apr: Number(data.apr ?? 0),
    totalStaked: data.totalStakedFormatted ?? data.totalStaked ?? '0',
    tvlUsd: Number(data.tvlUsd ?? 0),
  }
}

export async function fetchUserStaking(address: string): Promise<UserStakingInfo> {
  const res = await fetch(`${API}/staking/${address}`, { next: { revalidate: 60 } })
  if (!res.ok) throw new Error('Failed to fetch user staking')
  const data = await res.json()
  // Use formatted (human-readable) values — raw values are 18-decimal wei
  return {
    balance: data.balanceFormatted ?? data.balance ?? '0',
    pendingRewards: data.pendingRewardsFormatted ?? data.pendingRewards ?? '0',
    compoundFeeReserve: data.compoundFeeReserveFormatted ?? data.compoundFeeReserve ?? '0',
    canCompound: Boolean(data.canCompound),
  }
}

export async function fetchUserRewards(address: string): Promise<UserRewards> {
  const res = await fetch(`${API}/user/${address}/rewards`, { next: { revalidate: 60 } })
  if (!res.ok) throw new Error('Failed to fetch rewards')
  return res.json()
}

export async function fetchCurrentRound(): Promise<CurrentRound> {
  const res = await fetch(`${API}/round/current`, { next: { revalidate: 30 } })
  if (!res.ok) throw new Error('Failed to fetch current round')
  return res.json()
}

export async function fetchUserHistory(address: string, limit = 50): Promise<HistoryItem[]> {
  const res = await fetch(`${API}/user/${address}/history?limit=${limit}`, {
    next: { revalidate: 60 },
  })
  if (!res.ok) throw new Error('Failed to fetch history')
  const data = await res.json()
  return Array.isArray(data) ? data : data.items ?? []
}
