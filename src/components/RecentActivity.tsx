import type { HistoryItem, BurnEvent } from '@/types'
import { timeAgo } from '@/lib/utils'

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

type FeedItem =
  | { kind: 'history'; data: HistoryItem }
  | { kind: 'burn'; data: BurnEvent }

interface RecentActivityProps {
  history: HistoryItem[]
  burnHistory?: BurnEvent[]
}

export default function RecentActivity({ history, burnHistory = [] }: RecentActivityProps) {
  const feed: FeedItem[] = [
    ...history.map(d => ({ kind: 'history' as const, data: d })),
    ...burnHistory.map(d => ({ kind: 'burn' as const, data: d })),
  ]
    .sort((a, b) => b.data.timestamp - a.data.timestamp)
    .slice(0, 5)

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm">Recent Activity</h3>
        <a href="/history" className="text-xs text-muted hover:text-white transition-colors">
          View all →
        </a>
      </div>
      {feed.length === 0 ? (
        <p className="text-muted text-sm">No activity yet.</p>
      ) : (
        <div className="divide-y divide-border">
          {feed.map((item, i) => {
            if (item.kind === 'burn') {
              return (
                <div key={i} className="flex items-center justify-between py-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-orange-400">BSTR burned</span>
                    <span className="text-xs text-muted font-mono">
                      {item.data.bstrBurned.toLocaleString()}
                    </span>
                  </div>
                  <span className="text-xs text-muted">{timeAgo(item.data.timestamp)}</span>
                </div>
              )
            }

            const meta = EVENT_LABELS[item.data.type] ?? { label: item.data.type, color: 'text-muted' }
            const amount =
              item.data.beanRewardFormatted ??
              item.data.ethRewardFormatted ??
              item.data.amountFormatted ??
              null

            return (
              <div key={i} className="flex items-center justify-between py-1.5">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium ${meta.color}`}>{meta.label}</span>
                  {amount && (
                    <span className="text-xs text-muted font-mono">{amount}</span>
                  )}
                </div>
                <span className="text-xs text-muted">{timeAgo(item.data.timestamp)}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
