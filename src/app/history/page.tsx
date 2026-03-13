import { fetchUserHistory, fetchBeanStats, fetchUserStaking } from '@/lib/api'
import { fetchBstrBurned, fetchBurnHistory } from '@/lib/onchain'
import { formatDate, formatBEAN, formatUSD } from '@/lib/utils'
import ChartWrapper from '@/components/ChartWrapper'
import TreasuryChartWrapper from '@/components/TreasuryChartWrapper'
import AutoRefresh from '@/components/AutoRefresh'
import BeanIcon from '@/components/BeanIcon'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import type { HistoryItem, BurnEvent } from '@/types'

const AGENT_ADDRESS = process.env.NEXT_PUBLIC_AGENT_ADDRESS ?? ''
const BSTR_ADDRESS = process.env.NEXT_PUBLIC_BSTR_ADDRESS ?? ''

export const revalidate = 60

const EVENT_LABELS: Record<string, { label: string; color: string }> = {
  genesis: { label: 'Capital Injected', color: 'text-[#0052ff]' },
  checkpointed: { label: 'Round won', color: 'text-accent' },
  claimedETH: { label: 'ETH claimed', color: 'text-blue-400' },
  claimedBEAN: { label: 'BEAN claimed', color: 'text-green-400' },
  stakeDeposited: { label: 'Capital Injected', color: 'text-[#0052ff]' },
  feeReinvested: { label: 'Fees Reinvested', color: 'text-accent' },
  stakeWithdrawn: { label: 'Unstaked', color: 'text-red-400' },
  yieldClaimed: { label: 'Yield claimed', color: 'text-purple-400' },
  yieldCompounded: { label: 'Compounded', color: 'text-accent' },
  deployed: { label: 'Deployed', color: 'text-muted' },
}

const isValidTxHash = (hash: string) => /^0x[0-9a-fA-F]{64}$/.test(hash)

export default async function HistoryPage() {
  let history: HistoryItem[] = []
  let beanPriceUsd = 0
  let beanPriceNative = 0
  let priceChange24h = 0
  let volume24h = 0
  let liquidity = 0
  let bstrBurned = 0
  let burnHistory: BurnEvent[] = []
  let pendingBean = 0
  let stakedBean = 0

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
    if (h.status === 'fulfilled') history = h.value as HistoryItem[]
    if (s.status === 'fulfilled') {
      const stats = s.value as { beanPriceUsd: number; beanPriceNative: number; priceChange24h: number; volume24h: number; liquidity: number }
      beanPriceUsd = stats.beanPriceUsd
      beanPriceNative = stats.beanPriceNative
      priceChange24h = stats.priceChange24h
      volume24h = stats.volume24h
      liquidity = stats.liquidity
    }
    if (st.status === 'fulfilled') {
      const staking = st.value as { balance?: string; pendingRewards?: string }
      stakedBean = parseFloat(staking?.balance ?? '0')
      pendingBean = parseFloat(staking?.pendingRewards ?? '0')
    }
    if (b && b.status === 'fulfilled') bstrBurned = b.value as number
    if (bh && bh.status === 'fulfilled') burnHistory = bh.value as BurnEvent[]
  } catch {}

  const ethPrice = beanPriceNative > 0 ? beanPriceUsd / beanPriceNative : 0

  // Capital = all BEAN purchased with ETH (genesis + subsequent purchases)
  const capitalEvents = history.filter(e => e.type === 'genesis' || e.type === 'stakeDeposited')
  const totalCapital = capitalEvents.reduce((sum, e) => sum + parseFloat(e.amountFormatted ?? '0'), 0)
  const totalEthInvested = capitalEvents.reduce((sum, e) => sum + parseFloat(e.sourceAmount ?? '0'), 0)
  const avgBeanPerEth = totalEthInvested > 0 ? totalCapital / totalEthInvested : 0

  // True cost basis: use stored USD value at purchase time when available
  const totalCostBasisUsd = capitalEvents.reduce((sum, e) => {
    if (e.sourceAmountUsd != null) return sum + e.sourceAmountUsd
    return sum + parseFloat(e.sourceAmount ?? '0') * ethPrice
  }, 0)
  const unrealizedPnlUsd = totalCostBasisUsd > 0 ? stakedBean * beanPriceUsd - totalCostBasisUsd : 0

  // Yield = BEAN earned via compounding
  const earnedBean = Math.max(0, history
    .filter(e => e.type === 'yieldCompounded' || e.type === 'yieldClaimed')
    .reduce((sum, e) => sum + parseFloat(e.amountFormatted ?? e.beanRewardFormatted ?? '0'), 0))

  // Fee flywheel — BEAN accumulated from BSTR trading fees
  const feeEvents = history
    .filter(e => e.type === 'feeReinvested')
    .sort((a, b) => b.timestamp - a.timestamp)
  const totalFeeBean = feeEvents.reduce((sum, e) => sum + parseFloat(e.amountFormatted ?? '0'), 0)
  const totalFeeWeth = feeEvents.reduce((sum, e) => sum + parseFloat(e.sourceAmount ?? '0'), 0)

  // Main event log: newest-first, feeReinvested excluded (shown in flywheel section below)
  const mainEvents = [...history]
    .sort((a, b) => b.timestamp - a.timestamp)
    .filter(e => e.type !== 'feeReinvested')

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

        {/* Summary — 3 sections */}
        <div className="card p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-0">

            {/* Section 1: BEAN Position */}
            <div className="md:pr-6">
              <p className="text-xs text-muted uppercase tracking-wide mb-3">Position</p>
              <p className="stat-number text-3xl font-bold text-[#0052ff] flex items-center gap-2 mb-1">
                {formatBEAN(stakedBean)} <BeanIcon size={24} />
              </p>
              <p className="text-muted text-sm mb-4">{formatUSD(stakedBean * beanPriceUsd)} current value</p>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted">Capital</span>
                  <span className="text-sm font-mono flex items-center gap-1">
                    {formatBEAN(totalCapital)} <BeanIcon size={13} />
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted">Yield earned</span>
                  <span className="text-sm font-mono text-accent flex items-center gap-1">
                    {earnedBean > 0 ? `+${formatBEAN(earnedBean)}` : '—'}
                    {earnedBean > 0 && <BeanIcon size={13} />}
                  </span>
                </div>
                {pendingBean > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted">Pending</span>
                    <span className="text-sm font-mono text-muted flex items-center gap-1">
                      ~{formatBEAN(pendingBean, 4)} <BeanIcon size={13} />
                    </span>
                  </div>
                )}
              </div>
            </div>


            {/* Section 2: Investment */}
            <div className="md:px-6 border-t border-border md:border-t-0 md:border-l pt-5 md:pt-0">
              <p className="text-xs text-muted uppercase tracking-wide mb-3">Investment</p>
              <p className="text-2xl font-bold mb-1">{totalEthInvested.toFixed(4)} ETH</p>
              <p className="text-muted text-sm mb-4">total invested</p>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted">Cost basis</span>
                  <span className="text-sm font-mono">
                    {totalCostBasisUsd > 0 ? formatUSD(totalCostBasisUsd) : '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted">Avg price</span>
                  <span className="text-sm font-mono flex items-center gap-1">
                    {avgBeanPerEth > 0 ? `${avgBeanPerEth.toFixed(2)}` : '—'}
                    {avgBeanPerEth > 0 && <><BeanIcon size={13} /><span className="text-muted">/ETH</span></>}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted">Purchases</span>
                  <span className="text-sm font-mono">{capitalEvents.length}</span>
                </div>
              </div>
            </div>

            {/* Section 3: Performance */}
            <div className="md:pl-6 border-t border-border md:border-t-0 md:border-l pt-5 md:pt-0">
              <p className="text-xs text-muted uppercase tracking-wide mb-3">Performance</p>
              <p className={`text-2xl font-bold mb-1 ${unrealizedPnlUsd >= 0 ? 'text-accent' : 'text-red-400'}`}>
                {totalCostBasisUsd > 0
                  ? `${unrealizedPnlUsd >= 0 ? '+' : ''}${formatUSD(unrealizedPnlUsd)}`
                  : '—'}
              </p>
              <p className="text-muted text-sm mb-4">unrealized P&amp;L</p>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted">Paid</span>
                  <span className="text-sm font-mono">
                    {totalCostBasisUsd > 0 ? formatUSD(totalCostBasisUsd) : '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted">Now worth</span>
                  <span className="text-sm font-mono">{formatUSD(stakedBean * beanPriceUsd)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted"><BeanIcon size={13} /> price</span>
                  <span className="text-sm font-mono flex items-center gap-1.5">
                    {formatUSD(beanPriceUsd)}
                    {priceChange24h !== 0 && (
                      <span className={`text-xs ${priceChange24h >= 0 ? 'text-accent' : 'text-red-400'}`}>
                        {priceChange24h >= 0 ? '+' : ''}{priceChange24h.toFixed(2)}%
                      </span>
                    )}
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* BEAN accumulation chart */}
        <div className="card p-6 mb-6">
          <h3 className="font-semibold mb-4">Cumulative BEAN</h3>
          <ChartWrapper history={history} height={240} />
        </div>

        {/* Treasury value chart */}
        <div className="card p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Treasury Value</h3>
            <span className="text-xs text-muted">USD · historical price at each event</span>
          </div>
          <TreasuryChartWrapper history={history} height={260} />
        </div>

        {/* Event log */}
        <div className="card">
          <div className="p-6 border-b border-border">
            <h3 className="font-semibold">Event Log</h3>
          </div>
          {mainEvents.length === 0 ? (
            <div className="p-8 text-center text-muted">No events yet.</div>
          ) : (
            <div className="divide-y divide-border">
              {mainEvents.map((item, i) => {
                const meta = EVENT_LABELS[item.type] ?? { label: item.type, color: 'text-muted' }
                const amount =
                  item.beanRewardFormatted ?? item.ethRewardFormatted ?? item.amountFormatted

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
                      <span className={`text-sm font-medium w-24 sm:w-32 ${meta.color}`}>
                        {meta.label}
                      </span>
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
                            {item.type === 'claimedETH' || item.type === 'deployed'
                              ? amount
                              : formatBEAN(parseFloat(amount), 4)}
                            {item.type !== 'claimedETH' && item.type !== 'deployed' && <BeanIcon size={14} />}
                          </span>
                        )
                      )}
                      {item.roundId && (
                        <span className="hidden sm:block text-xs text-muted">Round #{item.roundId}</span>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-0.5">
                      <span className="text-xs text-muted">{formatDate(item.timestamp)}</span>
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
        </div>

        {/* Trading Fee Flywheel */}
        <div className="card mt-8">
          <div className="p-6 border-b border-border flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Trading Fee Flywheel</h3>
              <p className="text-muted text-sm mt-0.5">
                BSTR trading fees collected as WETH — 80% buys and stakes BEAN, 20% buys and burns BSTR
              </p>
            </div>
            {totalFeeBean > 0 && (
              <div className="text-right">
                <p className="text-xs text-muted mb-0.5">BEAN from fees</p>
                <p className="font-mono font-bold text-accent">{formatBEAN(totalFeeBean)} BEAN</p>
              </div>
            )}
          </div>

          {!BSTR_ADDRESS ? (
            <div className="p-6">
              <p className="text-muted text-sm">
                Fee collection activates after BSTR token launch — WETH fees will be split 80% BEAN / 20% BSTR burn automatically.
              </p>
            </div>
          ) : feeEvents.length === 0 && burnHistory.length === 0 ? (
            <div className="p-8 text-center text-muted text-sm">No fee-collect events yet.</div>
          ) : (
            <>
              {feeEvents.length > 0 && (
                <div className="divide-y divide-border">
                  {feeEvents.map((item, i) => (
                    <div key={i} className="px-6 py-4 flex items-center justify-between hover:bg-card/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-medium text-accent w-28">Fees → BEAN</span>
                        <span className="text-sm font-mono text-white inline-flex items-center gap-1">
                          +{formatBEAN(parseFloat(item.amountFormatted ?? '0'), 4)} <BeanIcon size={14} />
                        </span>
                        {item.sourceAmount && (
                          <span className="hidden sm:block text-xs text-muted">
                            {parseFloat(item.sourceAmount).toFixed(4)} WETH
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-0.5">
                        <span className="text-xs text-muted">{formatDate(item.timestamp)}</span>
                          {item.txHash && isValidTxHash(item.txHash) && (
                          <a href={`https://basescan.org/tx/${item.txHash}`} target="_blank" rel="noopener noreferrer"
                            className="hidden sm:block text-xs text-muted hover:text-white font-mono">
                            {item.txHash.slice(0, 8)}…
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {burnHistory.length > 0 && (
                <>
                  <div className="px-6 py-3 border-t border-border">
                    <p className="text-xs text-muted uppercase tracking-wide">BSTR Burns (20% of fees)</p>
                  </div>
                  <div className="divide-y divide-border">
                    {burnHistory.map((event, i) => (
                      <div key={i} className="px-6 py-4 flex items-center justify-between hover:bg-card/50 transition-colors">
                        <div className="flex items-center gap-4">
                          <span className="text-sm font-medium text-orange-400 w-28">BSTR Burned</span>
                          <span className="text-sm font-mono text-white">{event.bstrBurned.toLocaleString()} BSTR</span>
                          {event.ethSpent > 0 && (
                            <span className="hidden sm:block text-xs text-muted">{event.ethSpent.toFixed(4)} WETH</span>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-0.5">
                          <span className="text-xs text-muted">{formatDate(event.timestamp)}</span>
                          {isValidTxHash(event.txHash) && (
                            <a href={`https://basescan.org/tx/${event.txHash}`} target="_blank" rel="noopener noreferrer"
                              className="hidden sm:block text-xs text-muted hover:text-white font-mono">
                              {event.txHash.slice(0, 8)}…
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              <div className="px-6 py-4 border-t border-border flex items-center justify-between">
                <div className="flex gap-6">
                  {totalFeeBean > 0 && (
                    <div>
                      <p className="text-xs text-muted mb-0.5">Total BEAN from fees</p>
                      <p className="font-mono font-semibold text-accent">{formatBEAN(totalFeeBean)} BEAN</p>
                    </div>
                  )}
                  {totalFeeWeth > 0 && (
                    <div>
                      <p className="text-xs text-muted mb-0.5">Total WETH processed</p>
                      <p className="font-mono font-semibold text-white">{totalFeeWeth.toFixed(4)} WETH</p>
                    </div>
                  )}
                  {bstrBurned > 0 && (
                    <div>
                      <p className="text-xs text-muted mb-0.5">Total BSTR burned</p>
                      <p className="font-mono font-semibold text-orange-400">{formatBEAN(bstrBurned)} BSTR</p>
                    </div>
                  )}
                </div>
                {BSTR_ADDRESS && (
                  <a href={`https://basescan.org/token/${BSTR_ADDRESS}?a=0x000000000000000000000000000000000000dead`}
                    target="_blank" rel="noopener noreferrer"
                    className="text-xs text-muted hover:text-white transition-colors">
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
