import type { HistoryItem } from '@/types'
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

interface RecentActivityProps {
  history: HistoryItem[]
}

export default function RecentActivity({ history }: RecentActivityProps) {
  const items = history.slice(0, 10)

  return (
    <div className="card p-6">
      <h3 className="font-semibold mb-4">Recent Activity</h3>
      {items.length === 0 ? (
        <p className="text-muted text-sm">No activity yet.</p>
      ) : (
        <div className="space-y-3">
          {items.map((item, i) => {
            const meta = EVENT_LABELS[item.type] ?? { label: item.type, color: 'text-muted' }
            const amount =
              item.beanRewardFormatted ??
              item.ethRewardFormatted ??
              item.amountFormatted ??
              null

            return (
              <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-medium ${meta.color}`}>{meta.label}</span>
                  {amount && (
                    <span className="text-xs text-muted font-mono">{amount}</span>
                  )}
                </div>
                <span className="text-xs text-muted">{timeAgo(item.timestamp)}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
