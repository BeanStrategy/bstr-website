import {
  fetchBeanStats,
  fetchStakingGlobalStats,
  fetchUserStaking,
  fetchUserHistory,
} from '@/lib/api'
import { fetchBstrTotalSupply, fetchBstrBurned, fetchBurnHistory, fetchNativeEthBalance, fetchWethBalance, fetchTokenBalance } from '@/lib/onchain'
import { mockBurnHistory } from '@/lib/mock-data'
import type { BurnEvent } from '@/types'
import { formatBEAN, formatUSD, formatPercent } from '@/lib/utils'
import StatCard from '@/components/StatCard'
import RecentActivity from '@/components/RecentActivity'
import ChartWrapper from '@/components/ChartWrapper'
import HowItWorks from '@/components/HowItWorks'
import AutoRefresh from '@/components/AutoRefresh'
import BeanIcon from '@/components/BeanIcon'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

const AGENT_ADDRESS = process.env.NEXT_PUBLIC_AGENT_ADDRESS ?? ''
const BSTR_ADDRESS = process.env.NEXT_PUBLIC_BSTR_ADDRESS ?? ''
const MOCK = process.env.MOCK_DATA === 'true'

export const revalidate = 60

async function getDashboardData() {
  try {
    const minebean = Promise.allSettled([
      fetchBeanStats(),
      fetchStakingGlobalStats(),
      fetchUserStaking(AGENT_ADDRESS),
      fetchUserHistory(AGENT_ADDRESS),
      fetchNativeEthBalance(AGENT_ADDRESS),
      fetchWethBalance(AGENT_ADDRESS),
      fetchTokenBalance('0x5c72992b83E74c4D5200A8E8920fB946214a5A5D', AGENT_ADDRESS),
    ])

    const bstr = BSTR_ADDRESS
      ? Promise.allSettled([
          fetchBstrTotalSupply(BSTR_ADDRESS),
          fetchBstrBurned(BSTR_ADDRESS),
          fetchBurnHistory(BSTR_ADDRESS),
        ])
      : Promise.resolve(null)

    const [minebeanResults, bstrResults] = await Promise.all([minebean, bstr])
    const [stats, stakingGlobal, userStaking, history, ethBal, wethBal, beanWalletBal] = minebeanResults

    let bstrTotalSupply = 0
    let bstrBurned = 0
    let burnHistory: BurnEvent[] = []
    if (bstrResults) {
      const [supply, burned, burns] = bstrResults
      if (supply.status === 'fulfilled') bstrTotalSupply = supply.value
      if (burned.status === 'fulfilled') bstrBurned = burned.value
      if (burns.status === 'fulfilled') burnHistory = burns.value as BurnEvent[]
    }

    if (MOCK) burnHistory = mockBurnHistory

    return {
      stats: stats.status === 'fulfilled' ? stats.value : null,
      stakingGlobal: stakingGlobal.status === 'fulfilled' ? stakingGlobal.value : null,
      userStaking: userStaking.status === 'fulfilled' ? userStaking.value : null,
      history: history.status === 'fulfilled' ? history.value : [],
      ethBalance: ethBal.status === 'fulfilled' ? (ethBal.value as number) : 0,
      wethBalance: wethBal.status === 'fulfilled' ? (wethBal.value as number) : 0,
      beanWalletBalance: beanWalletBal.status === 'fulfilled' ? (beanWalletBal.value as number) : 0,
      bstrTotalSupply,
      bstrBurned,
      burnHistory,
    }
  } catch {
    return {
      stats: null, stakingGlobal: null, userStaking: null, history: [],
      ethBalance: 0, wethBalance: 0, beanWalletBalance: 0,
      bstrTotalSupply: 0, bstrBurned: 0, burnHistory: [] as BurnEvent[],
    }
  }
}

export default async function HomePage() {
  const { stats, stakingGlobal, userStaking, history, ethBalance, wethBalance, beanWalletBalance, bstrTotalSupply, bstrBurned, burnHistory } =
    await getDashboardData()

  const stakedBean = parseFloat(userStaking?.balance ?? '0')
  const totalBean = stakedBean + beanWalletBalance
  const beanPrice = Number(stats?.beanPriceUsd ?? 0)
  const beanUsd = totalBean * beanPrice
  // ETH price derived from BEAN native price ratio (both quoted in ETH and USD)
  const ethPrice = stats && stats.beanPriceNative > 0
    ? stats.beanPriceUsd / stats.beanPriceNative
    : 0
  const ethUsd = ethBalance * ethPrice
  const wethUsd = wethBalance * ethPrice
  const totalTreasuryUsd = beanUsd + ethUsd + wethUsd
  const treasuryUsd = beanUsd // keep for legacy references
  const apr = Number(stakingGlobal?.apr ?? 0)

  const bstrCirculating = bstrTotalSupply > 0 ? bstrTotalSupply - bstrBurned : 0
  const navPerBstrUsd = bstrCirculating > 0 ? treasuryUsd / bstrCirculating : 0
  const hasBstr = BSTR_ADDRESS !== ''


  return (
    <>
      <Header />
      <main className="max-w-6xl mx-auto px-4 py-12">
        {/* Hero */}
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs text-muted bg-card border border-border px-3 py-1 rounded-full">
              Base Mainnet · Auto-compounding
            </span>
            <AutoRefresh />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
            The BEAN Reserve Protocol
          </h1>
          <p className="text-muted text-lg max-w-2xl">
            BeanStrategy (BSTR) continuously accumulates BEAN through trading fees and staking
            yield. Modeled after MicroStrategy&apos;s Bitcoin reserve strategy — for BEAN.
          </p>
        </div>

        {/* Primary stat — treasury */}
        <div className="card p-8 mb-6 border-accent/20">
          <div className="flex flex-col md:flex-row md:items-center gap-8">

            {/* Left: BEAN treasury number */}
            <div className="flex-1 min-w-0">
              <p className="text-muted text-sm mb-2">Total BEAN Treasury</p>
              <p className="stat-number text-4xl md:text-5xl lg:text-6xl font-bold text-[#0052ff] mb-2 flex items-center gap-3">
                {formatBEAN(totalBean)} <BeanIcon size={40} />
              </p>
              <p className="text-muted text-xl mb-3">{formatUSD(treasuryUsd)}</p>
              {stats && (
                <p className="text-muted text-sm">
                  BEAN price:{' '}
                  <span className="text-white font-mono">{formatUSD(stats.beanPriceUsd)}</span>
                  {' · '}
                  <span className={stats.priceChange24h >= 0 ? 'text-accent' : 'text-red-400'}>
                    {formatPercent(stats.priceChange24h)} 24h
                  </span>
                </p>
              )}
            </div>

            {/* Divider */}
            <div className="hidden md:block w-px self-stretch bg-border/50" />

            {/* Right: key protocol metrics */}
            <div className="flex flex-row md:flex-col gap-8 md:gap-6 md:min-w-[160px] shrink-0">
              <div>
                <div className="flex items-center justify-between gap-3 mb-1">
                  <p className="text-xs text-muted uppercase tracking-wide">Staking APR</p>
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
                <p className="text-xs text-muted uppercase tracking-wide mb-1">Protocol TVL</p>
                <p className="text-2xl md:text-3xl font-bold text-white">
                  {stakingGlobal ? formatUSD(stakingGlobal.tvlUsd) : '—'}
                </p>
                <p className="text-xs text-muted mt-0.5">MineBean total</p>
              </div>
            </div>

          </div>
        </div>

        {/* Treasury asset breakdown */}
        <div className="card p-5 mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted mb-1">BEAN</p>
            <p className="text-base font-semibold text-[#0052ff]">{formatUSD(beanUsd)}</p>
            <p className="text-xs text-muted font-mono mt-0.5">
              {formatBEAN(stakedBean)} staked
              {beanWalletBalance > 0 && ` + ${formatBEAN(beanWalletBalance)} wallet`}
            </p>
          </div>
          <div className="sm:border-l sm:border-border sm:pl-4">
            <p className="text-xs text-muted mb-1">ETH{wethBalance > 0 ? ' + WETH' : ''} (reserve)</p>
            <p className="text-base font-semibold">{formatUSD(ethUsd + wethUsd)}</p>
            <p className="text-xs text-muted font-mono mt-0.5">
              {ethBalance.toFixed(4)} ETH{wethBalance > 0 ? ` + ${wethBalance.toFixed(4)} WETH` : ''}
            </p>
          </div>
        </div>

        {/* BSTR metrics */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <StatCard
            label="NAV per BSTR"
            value={hasBstr && navPerBstrUsd > 0 ? formatUSD(navPerBstrUsd) : '—'}
            sub={hasBstr ? 'Treasury USD / circulating supply' : 'After token launch'}
          />
          <StatCard
            label="BSTR Burned"
            value={hasBstr && bstrBurned > 0 ? formatBEAN(bstrBurned) : '—'}
            sub={hasBstr ? 'Permanently removed from supply' : 'After token launch'}
          />
        </div>

        {/* Buyback & Burn explainer — shown after token launch */}
        {hasBstr && <div className="card p-6 mb-6">
          <h3 className="font-semibold mb-1">BSTR Buyback &amp; Burn</h3>
          <p className="text-muted text-sm mb-5">
            A second flywheel runs alongside BEAN accumulation. 20% of BSTR trading fees are used to buy and permanently burn BSTR — reducing supply every time the token trades.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-xs text-muted uppercase tracking-wide mb-2">Source</p>
              <p className="text-sm text-white font-medium mb-1">20% of trading fees</p>
              <p className="text-sm text-muted">
                Every BSTR trade generates a 1.2% fee. 20% of the treasury's share is automatically
                used to buy and burn BSTR — every single trade.
              </p>
            </div>
            <div>
              <p className="text-xs text-muted uppercase tracking-wide mb-2">Mechanism</p>
              <p className="text-sm text-white font-medium mb-1">Buy on market → burn forever</p>
              <p className="text-sm text-muted">
                The agent buys BSTR at market price via Bankr and immediately sends it to the burn
                address{' '}
                <span className="font-mono text-xs">0x000...dead</span>.
                No treasury allocation. No vesting. Gone permanently.
              </p>
            </div>
            <div>
              <p className="text-xs text-muted uppercase tracking-wide mb-2">Effect</p>
              <p className="text-sm text-white font-medium mb-1">
                Circulating supply falls, NAV rises
              </p>
              <p className="text-sm text-muted">
                As BEAN treasury grows and BSTR supply shrinks, NAV per BSTR increases on both
                sides of the equation — compounding value for holders over time.
              </p>
            </div>
          </div>
        </div>}

        {/* Accumulation chart */}
        <div className="card p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">BEAN Accumulation</h3>
            <a href="/history" className="text-xs text-muted hover:text-white transition-colors">
              View full history →
            </a>
          </div>
          <ChartWrapper history={history} />
        </div>

        {/* Recent activity */}
        <div className="mb-6">
          <RecentActivity history={history} burnHistory={burnHistory} />
        </div>

        {/* How it works */}
        <HowItWorks apr={apr} />
      </main>
      <Footer />
    </>
  )
}
