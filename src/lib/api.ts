import type {
  BeanStats,
  StakingGlobalStats,
  UserStakingInfo,
  UserRewards,
  CurrentRound,
  HistoryItem,
  BurnEvent,
} from '@/types'
import {
  mockBeanStats,
  mockStakingGlobal,
  mockUserStaking,
  mockUserRewards,
  mockCurrentRound,
  mockHistory,
  mockBurnHistory,
} from '@/lib/mock-data'

// Set MOCK_DATA=true in .env.local for local preview with simulated agent data.
// Never set in production — Vercel env vars do not include this.
const MOCK = process.env.MOCK_DATA === 'true'

const API = 'https://api.minebean.com/api'
// Self-hosted history ledger on the agent VPS — source of truth for all agent events.
const VPS_API = process.env.BSTR_VPS_API_URL ?? 'http://188.166.74.182:3001'

// All fetches use no-store so page-level ISR (export const revalidate) controls caching.
// User-Agent is required — Vercel's fetch sends none by default and some APIs block it.
const FETCH_OPTS: RequestInit = {
  cache: 'no-store',
  headers: { 'User-Agent': 'BeanStrategy/1.0 (beanstrategy.com)' },
}

export async function fetchBeanStats(): Promise<BeanStats> {
  if (MOCK) return mockBeanStats
  const res = await fetch(`${API}/stats`, FETCH_OPTS)
  if (!res.ok) throw new Error(`fetchBeanStats: ${res.status}`)
  const data = await res.json()
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
  if (MOCK) return mockStakingGlobal
  const res = await fetch(`${API}/staking/stats`, FETCH_OPTS)
  if (!res.ok) throw new Error(`fetchStakingGlobalStats: ${res.status}`)
  const data = await res.json()
  return {
    apr: Number(data.apr ?? 0),
    totalStaked: data.totalStakedFormatted ?? data.totalStaked ?? '0',
    tvlUsd: Number(data.tvlUsd ?? 0),
  }
}

export async function fetchUserStaking(address: string): Promise<UserStakingInfo> {
  if (MOCK) return mockUserStaking
  const res = await fetch(`${API}/staking/${address}`, FETCH_OPTS)
  if (!res.ok) throw new Error(`fetchUserStaking: ${res.status}`)
  const data = await res.json()
  return {
    balance: data.balanceFormatted ?? data.balance ?? '0',
    pendingRewards: data.pendingRewardsFormatted ?? data.pendingRewards ?? '0',
    compoundFeeReserve: data.compoundFeeReserveFormatted ?? data.compoundFeeReserve ?? '0',
    canCompound: Boolean(data.canCompound),
  }
}

export async function fetchUserRewards(address: string): Promise<UserRewards> {
  if (MOCK) return mockUserRewards
  const res = await fetch(`${API}/user/${address}/rewards`, FETCH_OPTS)
  if (!res.ok) throw new Error(`fetchUserRewards: ${res.status}`)
  return res.json()
}

export async function fetchCurrentRound(): Promise<CurrentRound> {
  if (MOCK) return mockCurrentRound
  const res = await fetch(`${API}/round/current`, FETCH_OPTS)
  if (!res.ok) throw new Error(`fetchCurrentRound: ${res.status}`)
  return res.json()
}

export async function fetchUserHistory(_address: string, _limit = 50): Promise<HistoryItem[]> {
  if (MOCK) return mockHistory
  const res = await fetch(`${VPS_API}/history`, FETCH_OPTS)
  if (!res.ok) throw new Error(`fetchUserHistory: ${res.status}`)
  const data = await res.json()
  const items: HistoryItem[] = Array.isArray(data) ? data : data.history ?? data.items ?? []
  return items.slice().sort((a, b) => b.timestamp - a.timestamp)
}

export async function fetchBurnHistory(): Promise<BurnEvent[]> {
  if (MOCK) return mockBurnHistory
  const res = await fetch(`${VPS_API}/burns`, FETCH_OPTS)
  if (!res.ok) throw new Error(`fetchBurnHistory: ${res.status}`)
  const data = await res.json()
  return Array.isArray(data) ? data : []
}
