import { fetchUserHistory, fetchBeanStats, fetchUserStaking } from '@/lib/api'
import { fetchBstrBurned, fetchBurnHistory } from '@/lib/onchain'
import { timeAgo, formatBEAN, formatUSD } from '@/lib/utils'
import { mockBurnHistory } from '@/lib/mock-data'
import ChartWrapper from '@/components/ChartWrapper'
import AutoRefresh from '@/components/AutoRefresh'
import BeanIcon from '@/components/BeanIcon'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import type { HistoryItem, BurnEvent } from '@/types'

const AGENT_ADDRESS = process.env.NEXT_PUBLIC_AGENT_ADDRESS ?? ''
const BSTR_ADDRESS = process.env.NEXT_PUBLIC_BSTR_ADDRESS ?? ''
const MOCK = process.env.MOCK_DATA === 'true'

export const revalidate = 60

const GENESIS_TX = '0x22cc7ac8e092bc9ae6b85efa897b9775dfd994e22264cc8e611dc8ac6bf6d435'
const GENESIS_EVENT: HistoryItem = {
  type: 'genesis',
  amountFormatted: '4.728176',
  timestamp: 1772928960,
  txHash: GENESIS_TX,
}

const EVENT_LABELS: Record<string, { label: string; color: string }> = {
  genesis: { label: 'Seed purchase', color: 'text-[#0052ff]' },
  checkpointed: { label: 'Round won', color: 'text-accent' },
  claimedETH: { label: 'ETH claimed', color: 'text-blue-400' },
  claimedBEAN: { label: 'BEAN claimed', color: 'text-green-400' },
  stakeDeposited: { label: 'BEAN staked', color: 'text-accent' },
  stakeWithdrawn: { label: 'Unstaked', color: 'text-red-400' },
  yieldClaimed: { label: 'Yield claimed', color: 'text-purple-400' },
  yieldCompounded: { label: 'Compounded', color: 'text-accent' },
  deployed: { label: 'Deployed', color: 'text-muted' },
}

export default async function HistoryPage() {
  let history: HistoryItem[] = []
  let beanPriceUsd = 0
  let bstrBurned = 0
  let burnHistory: BurnEvent[] = []
  let pendingBean = 0

  try {
    const fetches: Promise<unknown>[] = [
      fetchUserHistory(AGENT_ADDRESS, 200),
      fetchBeanStats(),
      fetchUserStaking(AGENT_ADDRESS),
    ]
    if (BSTR_ADDRESS) {
      fetches.push(fetchBstrBurned(BSTR_ADDRESS))
      fetches.push(fetchBurnHistory(BSTR_ADDRESS))
    }

    const [h, s, st, b, bh] = await Promise.allSettled(fetches)
    if (h.status === 'fulfilled') history = [GENESIS_EVENT, ...(h.value as HistoryItem[]).filter(e => e.txHash !== GENESIS_TX)]
    if (s.status === 'fulfilled') beanPriceUsd = (s.value as { beanPriceUsd: number }).beanPriceUsd
    if (st.status === 'fulfilled') pendingBean = parseFloat((st.value as { pendingRewards?: string })?.pendingRewards ?? '0')
    if (b && b.status === 'fulfilled') bstrBurned = b.value as number
    if (bh && bh.status === 'fulfilled') burnHistory = bh.value as BurnEvent[]
  } catch {}

  if (MOCK) {
    burnHistory = mockBurnHistory
    bstrBurned = mockBurnHistory.reduce((sum, e) => sum + e.bstrBurned, 0)
  }

  const seedBean = parseFloat(GENESIS_EVENT.amountFormatted ?? '0')
  const earnedBean = history.reduce((sum, item) => {
    if (item.type === 'genesis') return sum
    return sum + parseFloat(item.beanRewardFormatted ?? item.amountFormatted ?? '0')
  }, 0)
  const totalBeanEarned = seedBean + earnedBean

  return (
    <>
      <Header />
      <main className="max-w-6xl mx-auto px-4 py-12">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl md:text-3xl font-bold">Accumulation History</h1>
            <AutoRefresh />
          </div>
          <p className="text-muted">Full BEAN acquisition log for the BeanStrategy treasury</p>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <div className="card p-5 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-muted text-sm mb-1">Total BEAN Held</p>
              <p className="stat-number text-2xl font-bold text-[#0052ff] flex items-center gap-2">
                {formatBEAN(totalBeanEarned)} <BeanIcon size={20} />
              </p>
              <p className="text-muted text-sm">{formatUSD(totalBeanEarned * beanPriceUsd)}</p>
            </div>
            <div className="text-right flex flex-col gap-1 shrink-0">
              <p className="text-xs text-muted">
                <span className="text-white/60">Seeded</span>{' '}
                <span className="font-mono">{formatBEAN(seedBean)}</span>
              </p>
              <p className="text-xs text-muted">
                <span className="text-accent">+ Earned</span>{' '}
                <span className="font-mono">{formatBEAN(earnedBean)}</span>
              </p>
              {pendingBean > 0 && (
                <p className="text-xs text-muted">
                  <span className="text-yellow-400/70">~ Pending</span>{' '}
                  <span className="font-mono">{formatBEAN(pendingBean)}</span>
                </p>
              )}
            </div>
          </div>
          <div className="card p-5">
            <p className="text-muted text-sm mb-1">BEAN Price</p>
            <p className="stat-number text-2xl font-bold">{formatUSD(beanPriceUsd)}</p>
          </div>
        </div>

        {/* Chart */}
        <div className="card p-6 mb-8">
          <h3 className="font-semibold mb-4">Cumulative BEAN Accumulated</h3>
          <ChartWrapper history={history} height={280} />
        </div>

        {/* Full event log */}
        <div className="card">
          <div className="p-6 border-b border-border">
            <h3 className="font-semibold">Event Log</h3>
          </div>
          {history.length === 0 ? (
            <div className="p-8 text-center text-muted">No events yet.</div>
          ) : (
            <div className="divide-y divide-border">
              {history.map((item, i) => {
                const meta = EVENT_LABELS[item.type] ?? { label: item.type, color: 'text-muted' }
                const amount =
                  item.beanRewardFormatted ?? item.ethRewardFormatted ?? item.amountFormatted

                return (
                  <div
                    key={i}
                    className="px-6 py-4 flex items-center justify-between hover:bg-card/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <span className={`text-sm font-medium w-24 sm:w-32 ${meta.color}`}>
                        {meta.label}
                      </span>
                      {amount && (
                        <span className="text-sm font-mono text-white">{amount}</span>
                      )}
                      {item.roundId && (
                        <span className="hidden sm:block text-xs text-muted">Round #{item.roundId}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
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
        </div>
        {/* Buyback & Burn History */}
        <div className="card mt-8">
          <div className="p-6 border-b border-border flex items-center justify-between">
            <div>
              <h3 className="font-semibold">BSTR Buyback &amp; Burn</h3>
              <p className="text-muted text-sm mt-0.5">
                20% of BSTR trading fees used to buy and permanently burn BSTR
              </p>
            </div>
            {bstrBurned > 0 && (
              <div className="text-right">
                <p className="text-xs text-muted mb-0.5">Total burned</p>
                <p className="font-mono font-bold text-orange-400">{formatBEAN(bstrBurned)} BSTR</p>
              </div>
            )}
          </div>

          {!BSTR_ADDRESS && !MOCK ? (
            <div className="p-8">
              <p className="text-muted text-sm mb-4">
                BSTR buyback and burn activity will appear here after token launch. Every time fees are collected,
                20% of the WETH is used to buy BSTR at market price and send it to the burn address permanently.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="bg-card/50 rounded-lg p-4 border border-border">
                  <p className="text-muted mb-1">Frequency</p>
                  <p className="font-medium">Every 12 hours</p>
                </div>
                <div className="bg-card/50 rounded-lg p-4 border border-border">
                  <p className="text-muted mb-1">Source</p>
                  <p className="font-medium">20% of WETH trading fees</p>
                </div>
                <div className="bg-card/50 rounded-lg p-4 border border-border">
                  <p className="text-muted mb-1">Destination</p>
                  <p className="font-mono text-xs text-muted">0x000000000000000000000000000000000000dead</p>
                </div>
              </div>
            </div>
          ) : burnHistory.length === 0 ? (
            <div className="p-8 text-center text-muted text-sm">No burn events yet.</div>
          ) : (
            <>
              <div className="divide-y divide-border">
                {burnHistory.map((event, i) => (
                  <div
                    key={i}
                    className="px-6 py-4 flex items-center justify-between hover:bg-card/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-medium text-orange-400 w-24 sm:w-32">Burned</span>
                      <span className="text-sm font-mono text-white">
                        {event.bstrBurned.toLocaleString()} BSTR
                      </span>
                      {event.ethSpent > 0 && (
                        <span className="hidden sm:block text-xs text-muted">
                          {event.ethSpent.toFixed(4)} ETH
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-muted">{timeAgo(event.timestamp)}</span>
                      <a
                        href={`https://basescan.org/tx/${event.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hidden sm:block text-xs text-muted hover:text-white transition-colors font-mono"
                      >
                        {event.txHash.slice(0, 8)}…
                      </a>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-6 py-4 border-t border-border flex items-center justify-between">
                <div className="flex gap-6">
                  <div>
                    <p className="text-xs text-muted mb-0.5">Total BSTR burned</p>
                    <p className="font-mono font-semibold text-orange-400">
                      {formatBEAN(bstrBurned)} BSTR
                    </p>
                  </div>
                  {burnHistory.some(e => e.ethSpent > 0) && (
                    <div>
                      <p className="text-xs text-muted mb-0.5">Total ETH spent</p>
                      <p className="font-mono font-semibold text-white">
                        {burnHistory.reduce((sum, e) => sum + e.ethSpent, 0).toFixed(4)} ETH
                      </p>
                    </div>
                  )}
                </div>
                {BSTR_ADDRESS && (
                  <a
                    href={`https://basescan.org/token/${BSTR_ADDRESS}?a=0x000000000000000000000000000000000000dead`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-muted hover:text-white transition-colors"
                  >
                    View burn address →
                  </a>
                )}
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
