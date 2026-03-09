import Link from 'next/link'
import { fetchUserStaking, fetchStakingGlobalStats, fetchUserHistory, fetchBeanStats } from '@/lib/api'
import { formatBEAN, formatUSD, timeAgo } from '@/lib/utils'
import AutoRefresh from '@/components/AutoRefresh'
import BeanIcon from '@/components/BeanIcon'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import type { HistoryItem } from '@/types'

export const revalidate = 60

const AGENT_ADDRESS = process.env.NEXT_PUBLIC_AGENT_ADDRESS ?? ''
const PAGE_SIZE = 25


const STAKING_TYPES = ['genesis', 'stakeDeposited', 'feeReinvested', 'yieldCompounded', 'yieldClaimed', 'stakeWithdrawn']

const FILTERS: Record<string, string[]> = {
  all: STAKING_TYPES,
  capital: ['genesis', 'stakeDeposited'],
  fees: ['feeReinvested'],
  compounds: ['yieldCompounded', 'yieldClaimed'],
}

const EVENT_META: Record<string, { label: string; color: string }> = {
  genesis: { label: 'Capital Injected', color: 'text-[#0052ff]' },
  stakeDeposited: { label: 'Capital Injected', color: 'text-[#0052ff]' },
  feeReinvested: { label: 'Fees Reinvested', color: 'text-accent' },
  yieldCompounded: { label: 'Compounded', color: 'text-purple-400' },
  yieldClaimed: { label: 'Yield Claimed', color: 'text-green-400' },
  stakeWithdrawn: { label: 'Unstaked', color: 'text-red-400' },
}

const FILTER_LABELS: Record<string, string> = {
  all: 'All',
  capital: 'Capital',
  fees: 'Fees',
  compounds: 'Compounds',
}

async function getStakingData() {
  const [userStaking, stakingGlobal, history, stats] = await Promise.allSettled([
    fetchUserStaking(AGENT_ADDRESS),
    fetchStakingGlobalStats(),
    fetchUserHistory(AGENT_ADDRESS, 500),
    fetchBeanStats(),
  ])
  return {
    userStaking: userStaking.status === 'fulfilled' ? userStaking.value : null,
    stakingGlobal: stakingGlobal.status === 'fulfilled' ? stakingGlobal.value : null,
    history: history.status === 'fulfilled' ? history.value as HistoryItem[] : [],
    stats: stats.status === 'fulfilled' ? stats.value : null,
  }
}

export default async function StakingPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; page?: string }>
}) {
  const { filter: rawFilter = 'all', page: rawPage = '1' } = await searchParams
  const filter = rawFilter in FILTERS ? rawFilter : 'all'
  const page = Math.max(1, parseInt(rawPage) || 1)

  const { userStaking, stakingGlobal, history, stats } = await getStakingData()

  const stakedBean = parseFloat(userStaking?.balance ?? '0')
  const pendingRewards = parseFloat(userStaking?.pendingRewards ?? '0')
  const beanPriceUsd = stats?.beanPriceUsd ?? 0
  const apr = stakingGlobal?.apr ?? 0
  const totalStaked = parseFloat(stakingGlobal?.totalStaked ?? '0')

  const treasuryUsd = stakedBean * beanPriceUsd
  const dailyYield = stakedBean * (apr / 100) / 365
  const weeklyYield = dailyYield * 7
  const annualYield = stakedBean * (apr / 100)
  const tvlSharePct = totalStaked > 0 ? (stakedBean / totalStaked) * 100 : 0

  // Staking event history
  const allStakingEvents = history.filter((h) => STAKING_TYPES.includes(h.type))
  const filteredEvents = allStakingEvents
    .filter((h) => FILTERS[filter].includes(h.type))
    .sort((a, b) => b.timestamp - a.timestamp)
  const totalPages = Math.max(1, Math.ceil(filteredEvents.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageEvents = filteredEvents.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  // Lifetime summary stats (always across all events)
  // yieldCompounded = compound() path; yieldClaimed = claimYield()+deposit() fallback path
  // Both represent yield reinvested into the position — count together
  const totalCompounded = allStakingEvents
    .filter((e) => e.type === 'yieldCompounded' || e.type === 'yieldClaimed')
    .reduce((sum, e) => sum + parseFloat(e.amountFormatted ?? e.beanRewardFormatted ?? '0'), 0)
  const compoundCount = allStakingEvents
    .filter((e) => e.type === 'yieldCompounded' || e.type === 'yieldClaimed').length

  return (
    <>
      <Header />
      <main className="max-w-6xl mx-auto px-4 py-12">
        {/* Page header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">Staking</h1>
            <span className="text-xs bg-accent/10 text-accent border border-accent/20 px-3 py-1 rounded-full">
              {apr > 0 ? `${apr.toFixed(0)}% APR` : 'Live'}
            </span>
            <AutoRefresh />
          </div>
          <p className="text-muted">
            BeanStrategy&apos;s core position — all BEAN is staked and compounding continuously.
          </p>
        </div>

        {/* Position hero */}
        <div className="card p-8 mb-6 border-accent/20">
          <p className="text-muted text-sm mb-2">Current Position</p>
          {stakedBean > 0 ? (
            <>
              <p className="stat-number text-4xl md:text-5xl font-bold text-[#0052ff] mb-1 flex items-center gap-3">
                {formatBEAN(stakedBean)} <BeanIcon size={36} />
              </p>
              <p className="text-muted text-lg md:text-xl mb-4">{formatUSD(treasuryUsd)}</p>
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                <span className="text-muted">
                  Pending rewards:{' '}
                  <span className="text-white font-mono inline-flex items-center gap-1">{formatBEAN(pendingRewards, 5)} <BeanIcon size={14} /></span>
                </span>

                <span className="text-muted">
                  TVL share:{' '}
                  <span className="text-white font-mono">{tvlSharePct.toFixed(3)}%</span>
                </span>
              </div>
            </>
          ) : (
            <div>
              <p className="stat-number text-5xl font-bold text-muted mb-2 flex items-center gap-3">0 <BeanIcon size={36} /></p>
              <p className="text-muted">
                Awaiting initial BEAN purchase and stake. Treasury not yet deployed.
              </p>
            </div>
          )}
        </div>

        {/* Yield projections */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="card p-5">
            <p className="text-muted text-sm mb-1">Daily Yield</p>
            <p className="stat-number text-2xl font-bold text-[#0052ff]">
              {stakedBean > 0 ? `+${dailyYield.toFixed(3)}` : '—'}
            </p>
            <p className="text-muted text-sm flex items-center gap-1"><BeanIcon size={14} /> / day</p>
          </div>
          <div className="card p-5">
            <p className="text-muted text-sm mb-1">Weekly Yield</p>
            <p className="stat-number text-2xl font-bold">
              {stakedBean > 0 ? `+${weeklyYield.toFixed(2)}` : '—'}
            </p>
            <p className="text-muted text-sm flex items-center gap-1"><BeanIcon size={14} /> / week</p>
          </div>
          <div className="card p-5">
            <p className="text-muted text-sm mb-1">Annual Projection</p>
            <p className="stat-number text-2xl font-bold">
              {stakedBean > 0 ? `+${formatBEAN(annualYield)}` : '—'}
            </p>
            <p className="text-muted text-sm">
              {stakedBean > 0 ? formatUSD(annualYield * beanPriceUsd) : 'at current APR'}
            </p>
          </div>
          <div className="card p-5">
            <p className="text-muted text-sm mb-1">Protocol APR</p>
            <p className="stat-number text-2xl font-bold text-accent">
              {apr > 0 ? `${apr.toFixed(0)}%` : '—'}
            </p>
            <p className="text-muted text-sm">{formatUSD(stakingGlobal?.tvlUsd ?? 0)} TVL</p>
          </div>
        </div>

        {/* Lifetime staking stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="card p-5">
            <p className="text-muted text-sm mb-1">Total Compounded</p>
            <p className="stat-number text-2xl font-bold text-purple-400 flex items-center gap-2">
              {totalCompounded > 0 ? `+${formatBEAN(totalCompounded)}` : '—'} <BeanIcon size={20} />
            </p>
            <p className="text-muted text-sm">{compoundCount} compound events</p>
          </div>
          <div className="card p-5">
            <p className="text-muted text-sm mb-1">Yield at Current Price</p>
            <p className="stat-number text-2xl font-bold text-[#0052ff]">
              {totalCompounded > 0 ? formatUSD(totalCompounded * beanPriceUsd) : '—'}
            </p>
            <p className="text-muted text-sm">{compoundCount} yield events</p>
          </div>
          <div className="card p-5">
            <p className="text-muted text-sm mb-1">Capital Injections</p>
            <p className="stat-number text-2xl font-bold">
              {allStakingEvents.filter((e) => e.type === 'stakeDeposited' || e.type === 'genesis').length}
            </p>
            <p className="text-muted text-sm">ETH → BEAN transactions</p>
          </div>
        </div>

        {/* History table */}
        <div className="card">
          {/* Filter tabs */}
          <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border">
            <div className="flex flex-wrap gap-1">
              {Object.keys(FILTERS).map((f) => (
                <Link
                  key={f}
                  href={`?filter=${f}&page=1`}
                  scroll={false}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    filter === f
                      ? 'bg-[#0052ff] text-white'
                      : 'text-muted hover:text-white'
                  }`}
                >
                  {FILTER_LABELS[f]}
                </Link>
              ))}
            </div>
            <span className="text-xs text-muted">{filteredEvents.length} events</span>
          </div>

          {/* Event rows */}
          {pageEvents.length === 0 ? (
            <div className="p-8 text-center text-muted">No events yet.</div>
          ) : (
            <div className="divide-y divide-border">
              {pageEvents.map((item: HistoryItem, i: number) => {
                const meta = EVENT_META[item.type] ?? { label: item.type, color: 'text-muted' }
                const amount = item.beanRewardFormatted ?? item.amountFormatted

                return (
                  <div
                    key={i}
                    className="px-6 py-4 flex items-center justify-between hover:bg-card/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <span className={`text-sm font-medium w-24 sm:w-28 ${meta.color}`}>{meta.label}</span>
                      {amount && (
                        <span className="text-sm font-mono text-white inline-flex items-center gap-1">{amount} <BeanIcon size={14} /></span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted">{timeAgo(item.timestamp)}</span>
                      {item.txHash && (
                        <a
                          href={`https://basescan.org/tx/${item.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hidden sm:block text-xs text-muted hover:text-white transition-colors font-mono"
                        >
                          {item.txHash.slice(0, 8)}…
                        </a>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-border flex items-center justify-between">
              <span className="text-xs text-muted">
                Page {currentPage} of {totalPages}
              </span>
              <div className="flex gap-2">
                {currentPage > 1 && (
                  <Link
                    href={`?filter=${filter}&page=${currentPage - 1}`}
                    scroll={false}
                    className="text-xs px-3 py-1.5 card hover:text-white transition-colors"
                  >
                    ← Prev
                  </Link>
                )}
                {currentPage < totalPages && (
                  <Link
                    href={`?filter=${filter}&page=${currentPage + 1}`}
                    scroll={false}
                    className="text-xs px-3 py-1.5 card hover:text-white transition-colors"
                  >
                    Next →
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
