import Link from 'next/link'
import { fetchUserStaking, fetchStakingGlobalStats, fetchUserHistory, fetchBeanStats } from '@/lib/api'
import { formatBEAN, formatUSD, formatDate, timeAgo } from '@/lib/utils'
import AutoRefresh from '@/components/AutoRefresh'
import BeanIcon from '@/components/BeanIcon'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import type { HistoryItem } from '@/types'

export const revalidate = 60

const AGENT_ADDRESS = process.env.NEXT_PUBLIC_AGENT_ADDRESS ?? ''
const BSTR_ADDRESS = process.env.NEXT_PUBLIC_BSTR_ADDRESS ?? ''
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
  yieldCompounded: { label: 'Compounded', color: 'text-accent' },
  yieldClaimed: { label: 'Yield Claimed', color: 'text-purple-400' },
  stakeWithdrawn: { label: 'Unstaked', color: 'text-red-400' },
}

const FILTER_LABELS: Record<string, string> = {
  all: 'All',
  capital: 'Capital',
  fees: 'Fees',
  compounds: 'Compounds',
}

const isValidTxHash = (hash: string) => /^0x[0-9a-fA-F]{64}$/.test(hash)

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
  const beanPriceNative = stats?.beanPriceNative ?? 0
  const apr = stakingGlobal?.apr ?? 0
  const totalStaked = parseFloat(stakingGlobal?.totalStaked ?? '0')
  const ethPrice = beanPriceNative > 0 ? beanPriceUsd / beanPriceNative : 0

  const treasuryUsd = stakedBean * beanPriceUsd
  const dailyYield = stakedBean * (apr / 100) / 365
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

  // Lifetime summary stats
  const totalCompounded = allStakingEvents
    .filter((e) => e.type === 'yieldCompounded' || e.type === 'yieldClaimed')
    .reduce((sum, e) => sum + parseFloat(e.amountFormatted ?? e.beanRewardFormatted ?? '0'), 0)
  const compoundCount = allStakingEvents
    .filter((e) => e.type === 'yieldCompounded' || e.type === 'yieldClaimed').length

  const capitalEvents = allStakingEvents.filter((e) => e.type === 'genesis' || e.type === 'stakeDeposited')
  const totalEthInvested = capitalEvents.reduce((sum, e) => sum + parseFloat(e.sourceAmount ?? '0'), 0)
  const totalCapitalBean = capitalEvents.reduce((sum, e) => sum + parseFloat(e.amountFormatted ?? '0'), 0)
  const avgBeanPerEth = totalEthInvested > 0 ? totalCapitalBean / totalEthInvested : 0
  const totalCostBasisUsd = capitalEvents.reduce((sum, e) => {
    if (e.sourceAmountUsd != null) return sum + e.sourceAmountUsd
    return sum + parseFloat(e.sourceAmount ?? '0') * ethPrice
  }, 0)
  const unrealizedPnlUsd = totalCostBasisUsd > 0 ? stakedBean * beanPriceUsd - totalCostBasisUsd : 0

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
          {stakedBean > 0 ? (
            <div className="flex flex-col md:flex-row md:items-center gap-8">
              {/* Left: position */}
              <div className="flex-1 min-w-0">
                <p className="text-muted text-sm mb-2">BEAN Staked</p>
                <p className="stat-number text-4xl md:text-5xl font-bold text-[#0052ff] mb-1 flex items-center gap-3">
                  {formatBEAN(stakedBean)} <BeanIcon size={36} />
                </p>
                <p className="text-muted text-lg md:text-xl">{formatUSD(treasuryUsd)}</p>
              </div>

              {/* Divider */}
              <div className="hidden md:block w-px self-stretch bg-border/50" />

              {/* Right: APR + pending + TVL */}
              <div className="flex flex-row md:flex-col gap-8 md:gap-5 md:min-w-[180px] shrink-0">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-xs text-muted uppercase tracking-wide">Protocol APR</p>
                    {apr > 0 && (
                      <span className="text-xs text-accent border border-accent/40 bg-accent/5 px-2 py-0.5 rounded-full">
                        Live
                      </span>
                    )}
                  </div>
                  <p className="text-3xl md:text-4xl font-bold text-accent">
                    {apr > 0 ? `${apr.toFixed(0)}%` : '—'}
                  </p>
                  <p className="text-xs text-muted mt-0.5">Auto-compounding</p>
                </div>
                <div>
                  <p className="text-xs text-muted uppercase tracking-wide mb-1">Pending Rewards</p>
                  <p className="text-xl font-bold font-mono inline-flex items-center gap-1">
                    {formatBEAN(pendingRewards, 5)} <BeanIcon size={16} />
                  </p>
                  <p className="text-xs text-muted mt-0.5">TVL share: {tvlSharePct.toFixed(3)}%</p>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-muted text-sm mb-2">BEAN Staked</p>
              <p className="stat-number text-5xl font-bold text-muted mb-2 flex items-center gap-3">0 <BeanIcon size={36} /></p>
              <p className="text-muted">Awaiting initial BEAN purchase and stake.</p>
            </div>
          )}
        </div>

        {/* Stats — 4 cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="card p-5">
            <p className="text-muted text-sm mb-1">Daily Yield</p>
            <p className="stat-number text-2xl font-bold">
              {stakedBean > 0 ? `+${formatBEAN(dailyYield, 3)}` : '—'}
            </p>
            <p className="text-muted text-sm flex items-center gap-1"><BeanIcon size={14} /> / day</p>
          </div>
          <div className="card p-5">
            <p className="text-muted text-sm mb-1">Annual Projection</p>
            <p className="stat-number text-2xl font-bold">
              {stakedBean > 0 ? `+${formatBEAN(annualYield)}` : '—'}
            </p>
            <p className="text-muted text-sm">
              {stakedBean > 0 ? `${formatUSD(annualYield * beanPriceUsd)} · at current ${apr.toFixed(0)}% APR` : 'at current APR'}
            </p>
          </div>
          <div className="card p-5">
            <p className="text-muted text-sm mb-1">Total Compounded</p>
            <p className="stat-number text-2xl font-bold text-accent flex items-center gap-2">
              {totalCompounded > 0 ? `+${formatBEAN(totalCompounded)}` : '—'} <BeanIcon size={18} />
            </p>
            <p className="text-muted text-sm">
              {totalCompounded > 0 ? `${formatUSD(totalCompounded * beanPriceUsd)} · ` : ''}{compoundCount} events
            </p>
          </div>
          <div className="card p-5">
            <p className="text-muted text-sm mb-1">Capital Deployed</p>
            <p className="stat-number text-2xl font-bold">
              {totalCapitalBean > 0 ? formatBEAN(totalCapitalBean, 4) : '—'}
            </p>
            {avgBeanPerEth > 0 ? (
              <>
                <p className="text-muted text-sm font-mono">
                  {capitalEvents.length} injections · {totalEthInvested.toFixed(4)} ETH
                </p>
                <p className={`text-sm font-mono mt-0.5 ${unrealizedPnlUsd >= 0 ? 'text-accent' : 'text-red-400'}`}>
                  {totalCostBasisUsd > 0
                    ? `${unrealizedPnlUsd >= 0 ? '+' : ''}${formatUSD(unrealizedPnlUsd)} P&L`
                    : `avg ${avgBeanPerEth.toFixed(2)} BEAN/ETH`}
                </p>
              </>
            ) : (
              <p className="text-muted text-sm">ETH → BEAN transactions</p>
            )}
          </div>
        </div>

        {/* History table */}
        <div className="card">
          {/* Filter tabs */}
          <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border">
            <div className="flex flex-wrap gap-1">
              {Object.keys(FILTERS).filter(f => f !== 'fees' || BSTR_ADDRESS !== '').map((f) => (
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
                const isCapital = item.type === 'genesis' || item.type === 'stakeDeposited'
                const ethSpent = isCapital && item.sourceAmount ? parseFloat(item.sourceAmount) : 0
                const beanAmount = isCapital ? parseFloat(item.amountFormatted ?? '0') : 0
                const beanPerEth = ethSpent > 0 ? beanAmount / ethSpent : 0

                return (
                  <div
                    key={i}
                    className="px-6 py-4 flex items-center justify-between hover:bg-card/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <span className={`text-sm font-medium w-24 sm:w-28 ${meta.color}`}>{meta.label}</span>
                      {isCapital && ethSpent > 0 ? (
                        <>
                          <span className="text-sm font-mono text-white">
                            {ethSpent.toFixed(4)} ETH → {formatBEAN(beanAmount, 4)} BEAN
                          </span>
                          <span className="text-xs text-muted font-mono">{beanPerEth.toFixed(2)} BEAN/ETH</span>
                        </>
                      ) : (
                        amount && (
                          <span className="text-sm font-mono text-white inline-flex items-center gap-1">
                            {formatBEAN(parseFloat(amount), 4)} <BeanIcon size={14} />
                          </span>
                        )
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-0.5">
                      <span className="text-xs text-muted">{formatDate(item.timestamp)}</span>
                      <span className="text-xs text-muted/50">{timeAgo(item.timestamp)}</span>
                      {item.txHash && isValidTxHash(item.txHash) && (
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
