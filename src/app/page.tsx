import {
  fetchBeanStats,
  fetchStakingGlobalStats,
  fetchUserStaking,
  fetchCurrentRound,
  fetchUserHistory,
} from '@/lib/api'
import { formatBEAN, formatUSD, formatPercent } from '@/lib/utils'
import StatCard from '@/components/StatCard'
import BeanpotCard from '@/components/BeanpotCard'
import RecentActivity from '@/components/RecentActivity'
import ChartWrapper from '@/components/ChartWrapper'
import HowItWorks from '@/components/HowItWorks'
import AutoRefresh from '@/components/AutoRefresh'
import BeanIcon from '@/components/BeanIcon'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

const AGENT_ADDRESS = process.env.NEXT_PUBLIC_AGENT_ADDRESS ?? ''

export const revalidate = 60

async function getDashboardData() {
  try {
    const [stats, stakingGlobal, userStaking, currentRound, history] = await Promise.allSettled([
      fetchBeanStats(),
      fetchStakingGlobalStats(),
      fetchUserStaking(AGENT_ADDRESS),
      fetchCurrentRound(),
      fetchUserHistory(AGENT_ADDRESS),
    ])

    return {
      stats: stats.status === 'fulfilled' ? stats.value : null,
      stakingGlobal: stakingGlobal.status === 'fulfilled' ? stakingGlobal.value : null,
      userStaking: userStaking.status === 'fulfilled' ? userStaking.value : null,
      currentRound: currentRound.status === 'fulfilled' ? currentRound.value : null,
      history: history.status === 'fulfilled' ? history.value : [],
    }
  } catch {
    return { stats: null, stakingGlobal: null, userStaking: null, currentRound: null, history: [] }
  }
}

export default async function HomePage() {
  const { stats, stakingGlobal, userStaking, currentRound, history } = await getDashboardData()

  const stakedBean = parseFloat(userStaking?.balance ?? '0')
  const beanPrice = Number(stats?.beanPriceUsd ?? 0)
  const treasuryUsd = stakedBean * beanPrice
  const apr = Number(stakingGlobal?.apr ?? 0)
  const beanpotPool = currentRound?.beanpotPoolFormatted ?? '0'

  // NAV calculation requires BSTR total supply from chain — placeholder until token launches
  const navPerBstr = '—'


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
          <p className="text-muted text-sm mb-2">Total BEAN Treasury</p>
          <p className="stat-number text-4xl md:text-5xl lg:text-6xl font-bold text-[#0052ff] mb-2 flex items-center gap-3">
            {formatBEAN(stakedBean)} <BeanIcon size={40} />
          </p>
          <p className="text-muted text-xl">
            {formatUSD(treasuryUsd)}
          </p>
          {stats && (
            <p className="text-muted text-sm mt-3">
              BEAN price:{' '}
              <span className="text-white font-mono">{formatUSD(stats.beanPriceUsd)}</span>
              {' · '}
              <span className={stats.priceChange24h >= 0 ? 'text-accent' : 'text-red-400'}>
                {formatPercent(stats.priceChange24h)} 24h
              </span>
            </p>
          )}
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Staking APR"
            value={apr > 0 ? `${apr.toFixed(0)}%` : '—'}
            sub="Auto-compounding daily"
            accent
            badge="Live"
          />
          <StatCard
            label="NAV per BSTR"
            value={navPerBstr}
            sub="After token launch"
          />
          <StatCard
            label="BEAN Price"
            value={stats ? formatUSD(stats.beanPriceUsd) : '—'}
            sub={stats ? formatPercent(stats.priceChange24h) + ' 24h' : undefined}
          />
          <StatCard
            label="Staking TVL"
            value={stakingGlobal ? formatUSD(stakingGlobal.tvlUsd) : '—'}
            sub="MineBean protocol total"
          />
        </div>

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

        {/* Beanpot + activity */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <BeanpotCard
            beanpotPool={beanpotPool}
            beanPriceUsd={beanPrice}
          />
          <RecentActivity history={history} />
        </div>

        {/* How it works */}
        <HowItWorks apr={apr} />
      </main>
      <Footer />
    </>
  )
}
