import type { Metadata } from 'next'
import {
  fetchBeanStats,
  fetchStakingGlobalStats,
  fetchUserStaking,
  fetchUserHistory,
} from '@/lib/api'
import type { HistoryItem } from '@/types'
import { formatBEAN, formatUSD, formatPercent } from '@/lib/utils'
import BeanIcon from '@/components/BeanIcon'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'About BeanStrategy — The BEAN Reserve Protocol on Base',
  description:
    'BeanStrategy is the first autonomous BEAN treasury reserve protocol on Base. Modeled after MicroStrategy\'s Bitcoin strategy — an on-chain agent that continuously accumulates BEAN through trading fees and MineBean staking yield.',
  openGraph: {
    title: 'About BeanStrategy — The BEAN Reserve Protocol',
    description:
      'An autonomous on-chain agent that continuously accumulates BEAN through MineBean staking yield. The BEAN reserve protocol on Base.',
    url: 'https://beanstrategy.com/about',
    type: 'article',
  },
  alternates: {
    canonical: 'https://beanstrategy.com/about',
  },
}

const AGENT_ADDRESS = process.env.NEXT_PUBLIC_AGENT_ADDRESS ?? ''

async function getAboutData() {
  try {
    const [stats, stakingGlobal, userStaking, history] = await Promise.allSettled([
      fetchBeanStats(),
      fetchStakingGlobalStats(),
      fetchUserStaking(AGENT_ADDRESS),
      fetchUserHistory(AGENT_ADDRESS),
    ])
    return {
      stats: stats.status === 'fulfilled' ? stats.value : null,
      stakingGlobal: stakingGlobal.status === 'fulfilled' ? stakingGlobal.value : null,
      userStaking: userStaking.status === 'fulfilled' ? userStaking.value : null,
      history: history.status === 'fulfilled' ? history.value as HistoryItem[] : [],
    }
  } catch {
    return { stats: null, stakingGlobal: null, userStaking: null, history: [] }
  }
}

export default async function AboutPage() {
  const { stats, stakingGlobal, userStaking, history } = await getAboutData()

  const stakedBean = parseFloat(userStaking?.balance ?? '0')
  const beanPrice = Number(stats?.beanPriceUsd ?? 0)
  const beanUsd = stakedBean * beanPrice
  const apr = Number(stakingGlobal?.apr ?? 0)
  const tvlUsd = Number(stakingGlobal?.tvlUsd ?? 0)

  const genesisEvent = history.find((e: HistoryItem) => e.type === 'genesis')
  const genesisTimestamp = genesisEvent?.timestamp ?? 0
  const daysAccumulating = genesisTimestamp > 0
    ? Math.floor((Date.now() / 1000 - genesisTimestamp) / 86400)
    : 0

  const capitalEvents = history.filter((e: HistoryItem) => e.type === 'genesis' || e.type === 'stakeDeposited')
  const compoundEvents = history.filter((e: HistoryItem) => e.type === 'yieldCompounded' || e.type === 'yieldClaimed')
  const totalCompounded = compoundEvents.reduce((sum, e) => sum + parseFloat(e.beanRewardFormatted ?? e.amountFormatted ?? '0'), 0)

  const faqItems = [
    {
      q: 'What is BeanStrategy?',
      a: 'BeanStrategy (BSTR) is an autonomous on-chain protocol that continuously accumulates BEAN — the native token of MineBean protocol — using a combination of trading fees and staking yield. Think of it as a BEAN reserve treasury managed entirely by code, not a team.',
    },
    {
      q: 'How does BeanStrategy work?',
      a: 'The protocol runs on an AI agent that operates 24/7 on Base. Every BSTR trade generates a fee; 80% of that fee buys BEAN and stakes it on MineBean, 20% buys and permanently burns BSTR. Staking rewards are compounded every 8 hours — automatically growing the BEAN reserve without any manual intervention.',
    },
    {
      q: 'What is MineBean staking?',
      a: `MineBean is a yield protocol on Base where BEAN holders can stake their tokens to earn staking rewards, currently at ${apr > 0 ? `${apr.toFixed(0)}% APR` : 'high APR'}. BeanStrategy deposits all accumulated BEAN into MineBean staking, and compounds the rewards back into the position automatically.`,
    },
    {
      q: 'Why BEAN?',
      a: 'BEAN is the core asset of MineBean protocol — a high-yield staking token on Base with deep liquidity and an active ecosystem. Its consistent staking yield makes it ideal as a treasury reserve asset: it earns more of itself over time, creating a self-compounding position.',
    },
    {
      q: 'Why is this modeled after MicroStrategy?',
      a: 'MicroStrategy demonstrated a simple but powerful concept: a company can use its balance sheet to accumulate a scarce asset (Bitcoin) and hold it as a reserve — generating returns through appreciation and NAV growth. BeanStrategy applies this same logic to BEAN: an autonomous protocol that steadily accumulates BEAN, with NAV per BSTR rising as holdings grow and supply shrinks.',
    },
    {
      q: 'What is NAV per BSTR?',
      a: 'NAV (Net Asset Value) per BSTR is the total USD value of the BEAN treasury divided by the circulating BSTR supply. As the BEAN treasury grows (through fees and compounding) and BSTR supply falls (through burns), NAV per BSTR rises from both sides.',
    },
    {
      q: 'Is there a team behind BeanStrategy?',
      a: 'BeanStrategy operates as an autonomous agent protocol. An AI agent executes all on-chain operations — compounding, fee collection, buybacks, and burns — automatically. The protocol is designed to function without daily human intervention.',
    },
    {
      q: 'Where can I track the treasury?',
      a: 'The live dashboard at beanstrategy.com shows real-time BEAN holdings, staking APR, treasury USD value, compounding history, and more. All data is sourced directly from the blockchain and MineBean protocol API.',
    },
  ]

  return (
    <>
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-12">

        {/* Hero */}
        <div className="mb-12">
          <a href="/" className="text-xs text-muted hover:text-white transition-colors inline-block mb-6">
            ← Back to dashboard
          </a>
          <h1 className="text-4xl md:text-5xl font-bold mb-5 leading-tight">
            The BEAN Reserve Protocol
          </h1>
          <p className="text-muted text-lg leading-relaxed max-w-2xl">
            BeanStrategy is an autonomous on-chain protocol that continuously accumulates BEAN
            through MineBean staking yield and trading fees — modeled after MicroStrategy&apos;s
            Bitcoin reserve strategy.
          </p>
        </div>

        {/* Live stats bar */}
        {(stakedBean > 0 || apr > 0) && (
          <div className="card p-5 mb-12 border-[#0052ff]/20">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              <div>
                <p className="text-xs text-muted uppercase tracking-wide mb-1">BEAN Staked</p>
                <p className="text-xl font-bold text-[#0052ff] flex items-center gap-1.5">
                  {formatBEAN(stakedBean)} <BeanIcon size={16} />
                </p>
                {beanUsd > 0 && <p className="text-xs text-muted mt-0.5">{formatUSD(beanUsd)}</p>}
              </div>
              <div>
                <p className="text-xs text-muted uppercase tracking-wide mb-1">Staking APR</p>
                <p className="text-xl font-bold text-accent">
                  {apr > 0 ? `${apr.toFixed(0)}%` : '—'}
                </p>
                <p className="text-xs text-muted mt-0.5">Auto-compounding</p>
              </div>
              <div>
                <p className="text-xs text-muted uppercase tracking-wide mb-1">Days Active</p>
                <p className="text-xl font-bold">
                  {daysAccumulating > 0 ? daysAccumulating : '—'}
                </p>
                <p className="text-xs text-muted mt-0.5">since genesis</p>
              </div>
              <div>
                <p className="text-xs text-muted uppercase tracking-wide mb-1">Protocol TVL</p>
                <p className="text-xl font-bold">
                  {tvlUsd > 0 ? formatUSD(tvlUsd) : '—'}
                </p>
                <p className="text-xs text-muted mt-0.5">MineBean total</p>
              </div>
            </div>
          </div>
        )}

        {/* What is BeanStrategy */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">What is BeanStrategy?</h2>
          <div className="space-y-4 text-muted leading-relaxed">
            <p>
              BeanStrategy (ticker: BSTR) is a protocol on Base that implements a single idea: use a treasury
              to accumulate as much BEAN as possible, and let the math do the rest. Every mechanism in the
              protocol — trading fees, staking rewards, buyback and burn — is designed to push one metric
              higher: BEAN per BSTR.
            </p>
            <p>
              When you hold BSTR, you hold a claim on the treasury&apos;s BEAN reserve. As that reserve
              grows through compounding yield and fee-driven purchases, and as the BSTR supply shrinks
              through buyback and burn, each BSTR token represents more BEAN over time.
            </p>
            <p>
              There is no team managing trades, no governance vote needed to compound rewards. An autonomous
              AI agent executes every on-chain operation automatically — compounding staking rewards every
              8 hours, collecting fees, and burning BSTR supply — continuously, on Base.
            </p>
          </div>
        </section>

        {/* The MicroStrategy parallel */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">The MicroStrategy Parallel</h2>
          <div className="card p-6 border-[#0052ff]/15 mb-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-muted uppercase tracking-wide mb-3">MicroStrategy / Bitcoin</p>
                <ul className="space-y-2 text-sm text-muted">
                  <li className="flex items-start gap-2"><span className="text-[#0052ff] mt-0.5">→</span> Uses corporate treasury to hold Bitcoin as reserve asset</li>
                  <li className="flex items-start gap-2"><span className="text-[#0052ff] mt-0.5">→</span> Issues equity (MSTR) backed by BTC holdings</li>
                  <li className="flex items-start gap-2"><span className="text-[#0052ff] mt-0.5">→</span> NAV per share rises as BTC accumulates</li>
                  <li className="flex items-start gap-2"><span className="text-[#0052ff] mt-0.5">→</span> Conviction-based accumulation — never sells</li>
                </ul>
              </div>
              <div className="border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-6">
                <p className="text-xs text-muted uppercase tracking-wide mb-3">BeanStrategy / BEAN</p>
                <ul className="space-y-2 text-sm text-muted">
                  <li className="flex items-start gap-2"><span className="text-accent mt-0.5">→</span> Uses on-chain treasury to accumulate BEAN as reserve asset</li>
                  <li className="flex items-start gap-2"><span className="text-accent mt-0.5">→</span> Issues BSTR tokens backed by BEAN holdings</li>
                  <li className="flex items-start gap-2"><span className="text-accent mt-0.5">→</span> NAV per BSTR rises as BEAN accumulates and BSTR burns</li>
                  <li className="flex items-start gap-2"><span className="text-accent mt-0.5">→</span> Autonomous accumulation — never sells, always compounds</li>
                </ul>
              </div>
            </div>
          </div>
          <p className="text-muted leading-relaxed">
            The key insight is that BEAN is not just a speculative asset — it actively generates yield
            through MineBean staking. This means the treasury grows in two dimensions simultaneously:
            through price appreciation if BEAN gains value, and through staking rewards that add more BEAN
            to the position regardless of price. MicroStrategy&apos;s Bitcoin holds its value through scarcity;
            BeanStrategy&apos;s BEAN compounds its position through yield.
          </p>
        </section>

        {/* How the flywheel works */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">The Accumulation Flywheel</h2>
          <p className="text-muted mb-6 leading-relaxed">
            BeanStrategy runs two parallel processes that both push NAV per BSTR higher. Once BSTR launches,
            trading fees activate a second flywheel — until then, the staking loop runs continuously.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Staking loop */}
            <div className="card p-5">
              <p className="text-xs text-accent uppercase tracking-wide font-medium mb-3">BEAN Staking Loop</p>
              <ol className="space-y-2.5">
                {[
                  { label: 'BEAN is staked on MineBean protocol' },
                  { label: `Earns ${apr > 0 ? `${apr.toFixed(0)}% APR` : 'staking yield'} continuously` },
                  { label: 'Agent compounds rewards every 8 hours' },
                  { label: 'Compounded BEAN re-stakes automatically' },
                  { label: 'Treasury grows — no manual action required', accent: true },
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm">
                    <span className="text-accent font-mono text-xs mt-0.5 shrink-0">{String(i + 1).padStart(2, '0')}</span>
                    <span className={step.accent ? 'text-accent font-medium' : 'text-muted'}>{step.label}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Fee + burn loop */}
            <div className="card p-5">
              <p className="text-xs text-orange-400 uppercase tracking-wide font-medium mb-3">BSTR Fee + Burn Loop <span className="text-muted">(at launch)</span></p>
              <ol className="space-y-2.5">
                {[
                  { label: 'BSTR trades generate 1.2% fee per swap' },
                  { label: '57% of fees flow to treasury wallet' },
                  { label: '80% of fees: WETH → buy BEAN → stake' },
                  { label: '20% of fees: buy BSTR at market → burn' },
                  { label: 'More BEAN held, less BSTR in supply', accent: true },
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm">
                    <span className="text-orange-400 font-mono text-xs mt-0.5 shrink-0">{String(i + 1).padStart(2, '0')}</span>
                    <span className={step.accent ? 'text-orange-400 font-medium' : 'text-muted'}>{step.label}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {compoundEvents.length > 0 && totalCompounded > 0 && (
            <div className="card p-4 border-accent/15">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-xs text-muted uppercase tracking-wide mb-1">Compounding in action</p>
                  <p className="text-sm text-muted">
                    The agent has compounded{' '}
                    <span className="text-white font-medium">{compoundEvents.length} times</span>
                    {daysAccumulating > 0 && ` over ${daysAccumulating} days`}, adding{' '}
                    <span className="text-accent font-medium flex-inline items-center gap-1">
                      {totalCompounded.toFixed(4)} BEAN
                    </span>{' '}
                    in yield to the treasury.
                  </p>
                </div>
                <a href="/history" className="text-xs text-[#0052ff] hover:text-white transition-colors shrink-0">
                  View history →
                </a>
              </div>
            </div>
          )}
        </section>

        {/* Why BEAN */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Why BEAN?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
            {[
              {
                title: 'High-Yield Staking',
                body: `MineBean staking currently yields ${apr > 0 ? `${apr.toFixed(0)}%` : 'strong'} APR. Unlike most DeFi assets, BEAN doesn't just hold value — it earns more of itself through protocol staking.`,
              },
              {
                title: 'Built on Base',
                body: 'Base is a low-cost, high-throughput L2 built by Coinbase. Gas fees are minimal, enabling the agent to compound rewards on an 8-hour cycle without fee drag eating into returns.',
              },
              {
                title: 'Protocol Ecosystem',
                body: `MineBean has ${tvlUsd > 0 ? formatUSD(tvlUsd) + ' TVL' : 'deep liquidity'} and an active staking ecosystem. BeanStrategy participates as a large protocol-level staker, benefiting from sustained yield.`,
              },
            ].map((card) => (
              <div key={card.title} className="card p-5">
                <h3 className="font-semibold mb-2">{card.title}</h3>
                <p className="text-sm text-muted leading-relaxed">{card.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Transparency */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Full On-Chain Transparency</h2>
          <p className="text-muted leading-relaxed mb-5">
            Every action taken by the BeanStrategy agent is recorded on Base and visible to anyone. The
            treasury wallet address is public, every compound and stake event is indexed in real-time, and
            the live dashboard reflects current holdings with no delay. There is no off-chain accounting
            or manual reporting — the blockchain is the ledger.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card p-5">
              <p className="text-xs text-muted uppercase tracking-wide mb-3">What is tracked</p>
              <ul className="space-y-1.5 text-sm text-muted">
                {[
                  'Every BEAN stake and compound event',
                  'Fee collection and WETH → BEAN swaps',
                  'BSTR buyback and burn transactions',
                  'ETH reserve balance (gas and fee buffer)',
                  'Staking APR from MineBean protocol API',
                  'BEAN price at every treasury event',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="card p-5">
              <p className="text-xs text-muted uppercase tracking-wide mb-3">Where to verify</p>
              <ul className="space-y-1.5 text-sm text-muted">
                {[
                  { label: 'Live dashboard', href: '/' },
                  { label: 'Full event history', href: '/history' },
                  { label: 'Staking position', href: '/staking' },
                  ...(AGENT_ADDRESS ? [{ label: 'Treasury wallet on BaseScan', href: `https://basescan.org/address/${AGENT_ADDRESS}` }] : []),
                  { label: 'MineBean protocol', href: 'https://minebean.com' },
                ].map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      target={link.href.startsWith('http') ? '_blank' : undefined}
                      rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                      className="flex items-center gap-2 hover:text-white transition-colors"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[#0052ff] shrink-0" />
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Capital injection context */}
        {capitalEvents.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">Treasury History</h2>
            <p className="text-muted leading-relaxed mb-4">
              The BeanStrategy treasury was seeded through {capitalEvents.length === 1 ? 'an initial capital injection' : `${capitalEvents.length} capital injections`},
              converting ETH to BEAN and staking it immediately. Since then, the agent has been compounding
              staking rewards autonomously — growing the BEAN position without additional capital.
            </p>
            <div className="card p-5">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-xs text-muted uppercase tracking-wide mb-1">BEAN Staked</p>
                  <p className="font-semibold text-[#0052ff] flex items-center gap-1.5">
                    {formatBEAN(stakedBean)} <BeanIcon size={14} />
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted uppercase tracking-wide mb-1">Yield Compounded</p>
                  <p className="font-semibold text-accent">
                    {totalCompounded > 0 ? `+${totalCompounded.toFixed(4)} BEAN` : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted uppercase tracking-wide mb-1">Days Running</p>
                  <p className="font-semibold">{daysAccumulating > 0 ? `${daysAccumulating} days` : '—'}</p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* FAQ */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
          <div className="space-y-0 divide-y divide-border border border-border rounded-xl overflow-hidden">
            {faqItems.map((item) => (
              <div key={item.q} className="p-5">
                <h3 className="font-semibold mb-2 text-white">{item.q}</h3>
                <p className="text-muted text-sm leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="card p-8 text-center border-[#0052ff]/20">
          <h2 className="text-2xl font-bold mb-3">Track the Treasury Live</h2>
          <p className="text-muted mb-6 max-w-lg mx-auto">
            The dashboard updates every 60 seconds with live BEAN holdings, staking APR, treasury value,
            and full compound history.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="/"
              className="inline-block bg-[#0052ff] hover:bg-[#0042cc] text-white font-medium px-6 py-2.5 rounded-lg transition-colors text-sm"
            >
              View Dashboard
            </a>
            <a
              href="/history"
              className="inline-block border border-border hover:border-white/40 text-muted hover:text-white font-medium px-6 py-2.5 rounded-lg transition-colors text-sm"
            >
              Event History
            </a>
          </div>
        </section>

      </main>
      <Footer />
    </>
  )
}
