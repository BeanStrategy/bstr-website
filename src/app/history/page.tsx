import { fetchUserHistory, fetchBeanStats } from '@/lib/api'
import { fetchBstrBurned } from '@/lib/onchain'
import { timeAgo, formatBEAN, formatUSD } from '@/lib/utils'
import ChartWrapper from '@/components/ChartWrapper'
import AutoRefresh from '@/components/AutoRefresh'
import BeanIcon from '@/components/BeanIcon'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import type { HistoryItem } from '@/types'

const AGENT_ADDRESS = process.env.NEXT_PUBLIC_AGENT_ADDRESS ?? ''
const BSTR_ADDRESS = process.env.NEXT_PUBLIC_BSTR_ADDRESS ?? ''

export const revalidate = 60

const EVENT_LABELS: Record<string, { label: string; color: string }> = {
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

  try {
    const fetches: Promise<unknown>[] = [
      fetchUserHistory(AGENT_ADDRESS, 200),
      fetchBeanStats(),
    ]
    if (BSTR_ADDRESS) fetches.push(fetchBstrBurned(BSTR_ADDRESS))

    const [h, s, b] = await Promise.allSettled(fetches)
    if (h.status === 'fulfilled') history = h.value as HistoryItem[]
    if (s.status === 'fulfilled') beanPriceUsd = (s.value as { beanPriceUsd: number }).beanPriceUsd
    if (b && b.status === 'fulfilled') bstrBurned = b.value as number
  } catch {}

  const totalBeanEarned = history.reduce((sum, item) => {
    return sum + parseFloat(item.beanRewardFormatted ?? item.amountFormatted ?? '0')
  }, 0)

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
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          <div className="card p-5">
            <p className="text-muted text-sm mb-1">Total BEAN Earned</p>
            <p className="stat-number text-2xl font-bold text-[#0052ff] flex items-center gap-2">
              {formatBEAN(totalBeanEarned)} <BeanIcon size={20} />
            </p>
            <p className="text-muted text-sm">{formatUSD(totalBeanEarned * beanPriceUsd)}</p>
          </div>
          <div className="card p-5">
            <p className="text-muted text-sm mb-1">Total Events</p>
            <p className="stat-number text-2xl font-bold">{history.length}</p>
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
                ETH staking rewards used to buy and permanently burn BSTR
              </p>
            </div>
            {BSTR_ADDRESS && bstrBurned > 0 && (
              <div className="text-right">
                <p className="text-xs text-muted mb-0.5">Total burned</p>
                <p className="font-mono font-bold text-accent">{formatBEAN(bstrBurned)} BSTR</p>
              </div>
            )}
          </div>

          {!BSTR_ADDRESS ? (
            <div className="p-8">
              <p className="text-muted text-sm mb-4">
                BSTR buyback and burn activity will appear here after token launch. Every 12 hours,
                30% of ETH staking rewards above the operating reserve are used to buy BSTR at
                market price and send it to the burn address permanently.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="bg-card/50 rounded-lg p-4 border border-border">
                  <p className="text-muted mb-1">Frequency</p>
                  <p className="font-medium">Every 12 hours</p>
                </div>
                <div className="bg-card/50 rounded-lg p-4 border border-border">
                  <p className="text-muted mb-1">Source</p>
                  <p className="font-medium">30% of ETH yield above reserve</p>
                </div>
                <div className="bg-card/50 rounded-lg p-4 border border-border">
                  <p className="text-muted mb-1">Destination</p>
                  <p className="font-mono text-xs text-muted">0x000000000000000000000000000000000000dead</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6">
              <p className="text-muted text-sm mb-4">
                All buyback and burn transactions are verifiable on-chain. BSTR sent to the burn
                address is permanently removed from circulation.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href={`https://basescan.org/token/${BSTR_ADDRESS}?a=0x000000000000000000000000000000000000dead`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-muted hover:text-white transition-colors border border-border rounded-lg px-4 py-2"
                >
                  View burn address on Basescan →
                </a>
                <a
                  href={`https://basescan.org/token/${BSTR_ADDRESS}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-muted hover:text-white transition-colors border border-border rounded-lg px-4 py-2"
                >
                  View BSTR contract on Basescan →
                </a>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
