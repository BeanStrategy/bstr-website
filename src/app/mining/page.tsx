import { fetchCurrentRound, fetchBeanStats } from '@/lib/api'
import { formatBEAN, formatUSD } from '@/lib/utils'
import BeanIcon from '@/components/BeanIcon'
import AutoRefresh from '@/components/AutoRefresh'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export const revalidate = 60

const AGENT_DEPLOY_ETH = 0.02
const JACKPOT_TRIGGER_ODDS = 777
const MINING_ACTIVE = false // flip to true when mining is enabled

// Minimum treasury BEAN staked before mining is reconsidered
const ACTIVATION_TREASURY_BEAN = 50
// Minimum beanpot pool size to justify any mining activity
const ACTIVATION_BEANPOT_BEAN = 150

async function getMiningData() {
  try {
    const [round, stats] = await Promise.allSettled([fetchCurrentRound(), fetchBeanStats()])
    return {
      round: round.status === 'fulfilled' ? round.value : null,
      stats: stats.status === 'fulfilled' ? stats.value : null,
    }
  } catch {
    return { round: null, stats: null }
  }
}

export default async function MiningPage() {
  const { round, stats } = await getMiningData()

  const beanpotPool = parseFloat(round?.beanpotPoolFormatted ?? '0')
  const totalDeployedEth = parseFloat(round?.totalDeployedFormatted ?? '0')
  const beanPriceUsd = stats?.beanPriceUsd ?? 0
  const beanPriceNative = stats?.beanPriceNative ?? 0 // ETH per BEAN
  const beanpotUsd = beanpotPool * beanPriceUsd

  // Lottery snapshot calculations
  const agentShare = totalDeployedEth > 0 ? AGENT_DEPLOY_ETH / totalDeployedEth : 0
  const winProbabilityPct = (agentShare / JACKPOT_TRIGGER_ODDS) * 100
  const costPerRoundBean = beanPriceNative > 0 ? AGENT_DEPLOY_ETH / beanPriceNative : 0

  return (
    <>
      <Header />
      <main className="max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">Mining Strategy</h1>
            <span className={`text-xs px-3 py-1 rounded-full border ${MINING_ACTIVE ? 'bg-accent/10 text-accent border-accent/20' : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'}`}>
              {MINING_ACTIVE ? 'Active' : 'Paused'}
            </span>
            <AutoRefresh />
          </div>
          <p className="text-muted">
            Beanpot mining is deferred while the treasury builds. Strategy and cadence will be
            reviewed once the minimum stake threshold is reached.
          </p>
        </div>

        {/* Status banner */}
        <div className="card p-6 mb-8 border-yellow-900/40 bg-yellow-950/10">
          <div className="flex items-start gap-4">
            <div className="text-2xl mt-0.5">⏸</div>
            <div>
              <h2 className="font-semibold text-yellow-400 mb-1">Mining Deferred</h2>
              <p className="text-muted text-sm leading-relaxed">
                BeanStrategy&apos;s primary focus right now is building the treasury through
                trading fees and staking yield. With rounds running every 60 seconds, mining costs
                accumulate fast — even a modest bet adds up significantly per day. Mining will be
                reconsidered once the treasury reaches its initial stake target and we can assess
                the right cadence and bet size without pressuring the reserve.
              </p>
            </div>
          </div>
        </div>

        {/* Live jackpot snapshot */}
        <h2 className="font-semibold text-lg mb-4">Current Jackpot</h2>
        <div className={`grid gap-4 mb-8 ${MINING_ACTIVE ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-1 max-w-sm'}`}>
          <div className="card p-5">
            <p className="text-muted text-sm mb-1">Beanpot Pool</p>
            <p className="stat-number text-2xl font-bold text-yellow-400 flex items-center gap-2">
              {formatBEAN(beanpotPool)} <BeanIcon size={22} />
            </p>
            <p className="text-muted text-sm">{formatUSD(beanpotUsd)}</p>
          </div>

          {MINING_ACTIVE && (
            <>
              <div className="card p-5">
                <p className="text-muted text-sm mb-1">Our Share</p>
                <p className="stat-number text-2xl font-bold">
                  {agentShare > 0 ? (agentShare * 100).toFixed(3) : '—'}%
                </p>
                <p className="text-muted text-sm">
                  {AGENT_DEPLOY_ETH} ETH of {totalDeployedEth > 0 ? `${totalDeployedEth.toFixed(3)} ETH` : '—'} deployed
                </p>
              </div>

              <div className="card p-5">
                <p className="text-muted text-sm mb-1">Win Probability</p>
                <p className="stat-number text-2xl font-bold">
                  {winProbabilityPct > 0 ? winProbabilityPct.toFixed(4) : '—'}%
                </p>
                <p className="text-muted text-sm">per round (1-in-{JACKPOT_TRIGGER_ODDS} trigger × share)</p>
              </div>

              <div className="card p-5">
                <p className="text-muted text-sm mb-1">Cost Per Round</p>
                <p className="stat-number text-2xl font-bold">{AGENT_DEPLOY_ETH} ETH</p>
                <p className="text-muted text-sm">
                  {costPerRoundBean > 0 ? `~${costPerRoundBean.toFixed(3)} BEAN equivalent` : '—'}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Activation conditions */}
        <div className="card p-6 mb-8">
          <h2 className="font-semibold mb-5">Activation Conditions</h2>
          <div className="space-y-4">
            <Condition
              label="Treasury reaches minimum stake"
              detail={`${ACTIVATION_TREASURY_BEAN} BEAN staked — primary accumulation goal before any ETH is spent on mining`}
              met={false}
            />
            <Condition
              label="Beanpot pool is meaningful"
              detail={`Pool must exceed ${ACTIVATION_BEANPOT_BEAN} BEAN (${formatUSD(ACTIVATION_BEANPOT_BEAN * beanPriceUsd)}) — current: ${formatBEAN(beanpotPool)} BEAN`}
              met={beanpotPool >= ACTIVATION_BEANPOT_BEAN}
            />
            <Condition
              label="Operating reserve sufficient"
              detail="ETH reserve > 0.3 ETH — rounds run every 60s so mining costs compound quickly"
              met={false}
            />
          </div>
        </div>

        {/* How beanpot works */}
        <div className="card p-6">
          <h2 className="font-semibold mb-4">How Beanpot Mining Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-muted">
            <div>
              <p className="text-white font-medium mb-2">The Jackpot</p>
              <p className="leading-relaxed">
                Each mining round, 0.3 BEAN is added to the beanpot pool. A Chainlink VRF
                randomly triggers the jackpot with 1-in-{JACKPOT_TRIGGER_ODDS} odds per round. The
                winner takes the entire pool.
              </p>
            </div>
            <div>
              <p className="text-white font-medium mb-2">Your Share</p>
              <p className="leading-relaxed">
                {MINING_ACTIVE
                  ? `Deploying ${AGENT_DEPLOY_ETH} ETH gives a proportional claim on the jackpot relative to all ETH deployed that round. With ~${totalDeployedEth.toFixed(2)} ETH total deployed, our bet represents a ${(agentShare * 100).toFixed(3)}% share of the pool.`
                  : `Deploying ${AGENT_DEPLOY_ETH} ETH gives a proportional claim on the jackpot relative to all ETH deployed that round. Share size and win probability are calculated live once mining is active.`}
              </p>
            </div>
            <div>
              <p className="text-white font-medium mb-2">Our Strategy</p>
              <p className="leading-relaxed">
                Mining is a lottery, not an investment. With 60-second rounds, even a small bet
                deployed every round costs thousands per day. Once the treasury is established,
                we&apos;ll set a limited daily cadence — a few rounds per day maximum — treating
                mining as jackpot exposure, not a primary accumulation strategy.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}

function Condition({ label, detail, met }: { label: string; detail: string; met: boolean }) {
  return (
    <div className="flex items-start gap-4">
      <span className={`mt-0.5 text-lg leading-none ${met ? 'text-accent' : 'text-muted'}`}>
        {met ? '✓' : '○'}
      </span>
      <div>
        <p className={`font-medium text-sm ${met ? 'text-accent' : 'text-white'}`}>{label}</p>
        <p className="text-muted text-xs mt-0.5">{detail}</p>
      </div>
    </div>
  )
}
