import { fetchCurrentRound, fetchBeanStats, fetchUserStaking, fetchEthBalance } from '@/lib/api'
import { formatBEAN, formatUSD } from '@/lib/utils'
import BeanIcon from '@/components/BeanIcon'
import AutoRefresh from '@/components/AutoRefresh'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export const revalidate = 60

const MINING_ACTIVE = false
const AGENT_ADDRESS = process.env.NEXT_PUBLIC_AGENT_ADDRESS ?? ''

// Mining parameters
const AGENT_DEPLOY_ETH = 0.01
const JACKPOT_ODDS = 777
const HOUSE_EDGE_PCT = 0.105  // ~10.5% net (1% admin + 10% vault on losers)

// Activation thresholds
const MIN_BEAN_STAKED = 15
const MIN_ETH_RESERVE = 0.08
const MIN_BEANPOT = 75
const MIN_EV_MARGIN = 0.05     // 5% above breakeven
const MAX_24H_DROP = -30       // volatility guard: stop if BEAN drops >30% in 24h

async function getMiningData() {
  const [round, stats, staking, ethBalance] = await Promise.allSettled([
    fetchCurrentRound(),
    fetchBeanStats(),
    fetchUserStaking(AGENT_ADDRESS),
    fetchEthBalance(AGENT_ADDRESS),
  ])
  return {
    round: round.status === 'fulfilled' ? round.value : null,
    stats: stats.status === 'fulfilled' ? stats.value : null,
    stakedBean: staking.status === 'fulfilled' ? parseFloat(staking.value.balance ?? '0') : 0,
    ethBalance: ethBalance.status === 'fulfilled' ? ethBalance.value : 0,
  }
}

export default async function MiningPage() {
  const { round, stats, stakedBean, ethBalance } = await getMiningData()

  const beanpotPool = parseFloat(round?.beanpotPoolFormatted ?? '0')
  const totalDeployedEth = parseFloat(round?.totalDeployedFormatted ?? '0')
  const beanPriceUsd = stats?.beanPriceUsd ?? 0
  const beanPriceNative = stats?.beanPriceNative ?? 0
  const priceChange24h = stats?.priceChange24h ?? 0
  const beanpotUsd = beanpotPool * beanPriceUsd
  const ethPriceUsd = beanPriceNative > 0 ? beanPriceUsd / beanPriceNative : 0

  // EV calculation
  const ourShare = totalDeployedEth > 0 ? AGENT_DEPLOY_ETH / totalDeployedEth : 0
  const houseEdgeCostUsd = AGENT_DEPLOY_ETH * HOUSE_EDGE_PCT * ethPriceUsd
  const beanPerRound = ourShare * 1.0
  const jackpotBeanEv = (1 / JACKPOT_ODDS) * ourShare * beanpotPool
  const totalBeanEv = beanPerRound + jackpotBeanEv
  const revenueUsd = totalBeanEv * beanPriceUsd
  const evPerRoundUsd = revenueUsd - houseEdgeCostUsd
  const evMargin = houseEdgeCostUsd > 0 ? evPerRoundUsd / houseEdgeCostUsd : 0
  const breakevenBeanUsd = totalBeanEv > 0 && ethPriceUsd > 0
    ? (AGENT_DEPLOY_ETH * HOUSE_EDGE_PCT * ethPriceUsd) / totalBeanEv
    : 0

  // Activation condition checks
  const conditions = {
    beanStaked: { met: stakedBean >= MIN_BEAN_STAKED, label: 'Treasury stake', detail: `${stakedBean.toFixed(2)} / ${MIN_BEAN_STAKED} BEAN`, value: stakedBean, required: MIN_BEAN_STAKED },
    ethReserve: { met: ethBalance >= MIN_ETH_RESERVE, label: 'ETH reserve', detail: `${ethBalance.toFixed(3)} / ${MIN_ETH_RESERVE} ETH`, value: ethBalance, required: MIN_ETH_RESERVE },
    beanpot: { met: beanpotPool >= MIN_BEANPOT, label: 'Beanpot pool', detail: `${beanpotPool.toFixed(0)} / ${MIN_BEANPOT} BEAN`, value: beanpotPool, required: MIN_BEANPOT },
    evPositive: { met: evMargin >= MIN_EV_MARGIN, label: 'EV margin', detail: evMargin !== 0 ? `${(evMargin * 100).toFixed(1)}% (min ${MIN_EV_MARGIN * 100}%)` : 'Insufficient data', value: evMargin, required: MIN_EV_MARGIN },
    volatility: { met: priceChange24h >= MAX_24H_DROP, label: 'Volatility guard', detail: `${priceChange24h >= 0 ? '+' : ''}${priceChange24h.toFixed(1)}% 24h (stop if < ${MAX_24H_DROP}%)`, value: priceChange24h, required: MAX_24H_DROP },
  }
  const allMet = Object.values(conditions).every(c => c.met)
  const evPositive = evMargin > 0

  return (
    <>
      <Header />
      <main className="max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">Mining Strategy</h1>
            <span className={`text-xs px-3 py-1 rounded-full border ${
              MINING_ACTIVE
                ? 'bg-accent/10 text-accent border-accent/20'
                : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
            }`}>
              {MINING_ACTIVE ? 'Active' : 'Paused'}
            </span>
            <AutoRefresh />
          </div>
          <p className="text-muted">
            Beanpot mining generates BEAN rewards every round and carries jackpot upside.
            Active when all conditions are met — paused while the treasury builds.
          </p>
        </div>

        {/* Paused banner */}
        {!MINING_ACTIVE && (
          <div className="card p-6 mb-8 border-yellow-900/40 bg-yellow-950/10">
            <div className="flex items-start gap-4">
              <div className="text-xl mt-0.5 text-yellow-400">⏸</div>
              <div>
                <h2 className="font-semibold text-yellow-400 mb-1">Mining Paused</h2>
                <p className="text-muted text-sm leading-relaxed">
                  Mining is EV-positive when BEAN price is above the breakeven threshold and all
                  activation conditions are met. Once enabled, the AutoMiner contract handles
                  per-round deployment automatically — the agent monitors conditions and
                  starts or stops accordingly.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* EV Status */}
        <h2 className="font-semibold text-lg mb-4">Live EV Analysis</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className={`card p-5 ${evPositive ? 'border-accent/20' : 'border-red-900/40'}`}>
            <p className="text-muted text-sm mb-1">EV Status</p>
            <p className={`stat-number text-2xl font-bold ${evPositive ? 'text-accent' : 'text-red-400'}`}>
              {evPerRoundUsd !== 0 ? (evPositive ? 'EV+' : 'EV−') : '—'}
            </p>
            <p className="text-muted text-sm">
              {evPerRoundUsd !== 0 ? `${evPerRoundUsd >= 0 ? '+' : ''}${formatUSD(evPerRoundUsd)}/round` : 'Insufficient data'}
            </p>
          </div>
          <div className="card p-5">
            <p className="text-muted text-sm mb-1">Breakeven Price</p>
            <p className="stat-number text-2xl font-bold">
              {breakevenBeanUsd > 0 ? formatUSD(breakevenBeanUsd) : '—'}
            </p>
            <p className={`text-sm ${beanPriceUsd > breakevenBeanUsd ? 'text-accent' : 'text-red-400'}`}>
              {beanPriceUsd > 0 && breakevenBeanUsd > 0
                ? beanPriceUsd > breakevenBeanUsd
                  ? `+${formatUSD(beanPriceUsd - breakevenBeanUsd)} above`
                  : `${formatUSD(beanPriceUsd - breakevenBeanUsd)} below`
                : 'Current: ' + formatUSD(beanPriceUsd)}
            </p>
          </div>
          <div className="card p-5">
            <p className="text-muted text-sm mb-1">EV Margin</p>
            <p className={`stat-number text-2xl font-bold ${evMargin >= MIN_EV_MARGIN ? 'text-accent' : evMargin > 0 ? 'text-yellow-400' : 'text-red-400'}`}>
              {evMargin !== 0 ? `${evMargin >= 0 ? '+' : ''}${(evMargin * 100).toFixed(1)}%` : '—'}
            </p>
            <p className="text-muted text-sm">min {MIN_EV_MARGIN * 100}% to activate</p>
          </div>
          <div className="card p-5">
            <p className="text-muted text-sm mb-1">Volatility Guard</p>
            <p className={`stat-number text-2xl font-bold ${conditions.volatility.met ? 'text-accent' : 'text-red-400'}`}>
              {priceChange24h >= 0 ? '+' : ''}{priceChange24h.toFixed(1)}%
            </p>
            <p className="text-muted text-sm">
              {conditions.volatility.met ? 'Clear' : `Active — limit ${MAX_24H_DROP}%`}
            </p>
          </div>
        </div>

        {/* Activation conditions */}
        <div className="card p-6 mb-8">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold">Activation Conditions</h2>
            <span className={`text-xs px-2 py-1 rounded-full ${allMet ? 'bg-accent/10 text-accent' : 'bg-muted/10 text-muted'}`}>
              {Object.values(conditions).filter(c => c.met).length} / {Object.values(conditions).length} met
            </span>
          </div>
          <div className="space-y-3">
            {Object.values(conditions).map((c, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div className="flex items-center gap-3">
                  <span className={`text-base leading-none ${c.met ? 'text-accent' : 'text-muted'}`}>
                    {c.met ? '✓' : '○'}
                  </span>
                  <p className={`text-sm font-medium ${c.met ? 'text-white' : 'text-muted'}`}>{c.label}</p>
                </div>
                <p className={`text-xs font-mono ${c.met ? 'text-accent' : 'text-muted'}`}>{c.detail}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Jackpot + round snapshot */}
        <h2 className="font-semibold text-lg mb-4">Current Round</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="card p-5">
            <p className="text-muted text-sm mb-1">Beanpot Pool</p>
            <p className="stat-number text-2xl font-bold text-yellow-400 flex items-center gap-2">
              {formatBEAN(beanpotPool)} <BeanIcon size={20} />
            </p>
            <p className="text-muted text-sm">{formatUSD(beanpotUsd)}</p>
          </div>
          <div className="card p-5">
            <p className="text-muted text-sm mb-1">Total Deployed</p>
            <p className="stat-number text-2xl font-bold">
              {totalDeployedEth > 0 ? `${totalDeployedEth.toFixed(3)}` : '—'}
            </p>
            <p className="text-muted text-sm">ETH this round</p>
          </div>
          <div className="card p-5">
            <p className="text-muted text-sm mb-1">{MINING_ACTIVE ? 'Our Deploy' : 'Projected Deploy'}</p>
            <p className="stat-number text-2xl font-bold text-[#0052ff]">{AGENT_DEPLOY_ETH} ETH</p>
            <p className="text-muted text-sm">
              {MINING_ACTIVE
                ? ourShare > 0 ? `${(ourShare * 100).toFixed(2)}% pool share` : 'when active'
                : ourShare > 0 ? `${(ourShare * 100).toFixed(2)}% if active` : 'if mining active'}
            </p>
          </div>
          <div className="card p-5">
            <p className="text-muted text-sm mb-1">{MINING_ACTIVE ? 'BEAN/Round EV' : 'Projected EV'}</p>
            <p className="stat-number text-2xl font-bold flex items-center gap-1">
              {totalBeanEv > 0 ? `+${totalBeanEv.toFixed(4)}` : '—'} <BeanIcon size={16} />
            </p>
            <p className="text-muted text-sm">
              {totalBeanEv > 0
                ? MINING_ACTIVE
                  ? `${beanPerRound.toFixed(4)} base + ${jackpotBeanEv.toFixed(5)} jackpot`
                  : `${beanPerRound.toFixed(4)} base + ${jackpotBeanEv.toFixed(5)} jackpot (projected)`
                : 'rewards + jackpot EV'}
            </p>
          </div>
        </div>

        {/* How it works */}
        <div className="card p-6">
          <h2 className="font-semibold mb-4">How Beanpot Mining Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-muted">
            <div>
              <p className="text-white font-medium mb-2">Regular BEAN Rewards</p>
              <p className="leading-relaxed">
                Every round, 1 BEAN is minted and distributed proportionally among miners on the
                winning block. With 60-second rounds, this compounds into meaningful daily
                accumulation when BEAN price is above the breakeven threshold.
              </p>
            </div>
            <div>
              <p className="text-white font-medium mb-2">The Jackpot</p>
              <p className="leading-relaxed">
                0.3 BEAN is added to the beanpot each round. Chainlink VRF triggers the jackpot
                with 1-in-{JACKPOT_ODDS} odds — when hit, the entire pool splits proportionally
                among that round&apos;s winning-block miners. Currently {formatBEAN(beanpotPool)} BEAN ({formatUSD(beanpotUsd)}).
              </p>
            </div>
            <div>
              <p className="text-white font-medium mb-2">Our Strategy</p>
              <p className="leading-relaxed">
                Mining is EV-positive when BEAN price exceeds the breakeven ratio against ETH.
                The AutoMiner contract handles per-round deployment automatically. The agent
                monitors conditions every 6 hours and starts or stops based on live EV,
                reserve health, and price volatility.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
