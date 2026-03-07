import { formatBEAN, formatUSD } from '@/lib/utils'
import BeanIcon from '@/components/BeanIcon'

interface BeanpotCardProps {
  beanpotPool: string
  beanPriceUsd: number
}

export default function BeanpotCard({ beanpotPool, beanPriceUsd }: BeanpotCardProps) {
  const poolAmount = parseFloat(beanpotPool)
  const poolUsd = poolAmount * beanPriceUsd
  const triggerChance = ((1 / 777) * 100).toFixed(2)

  return (
    <div className="card card-hover p-6 border-yellow-900/40">
      <div className="flex items-start justify-between mb-2">
        <p className="text-muted text-sm">Beanpot Jackpot</p>
        <span className="text-xs bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-2 py-0.5 rounded-full">
          {triggerChance}% / round
        </span>
      </div>
      <p className="stat-number text-2xl font-bold text-yellow-400 flex items-center gap-2">
        {formatBEAN(poolAmount)} <BeanIcon size={22} />
      </p>
      <p className="text-muted text-sm mt-1">{formatUSD(poolUsd)}</p>
      <div className="mt-4 pt-4 border-t border-border">
        <p className="text-xs text-muted">
          Jackpot accumulates 0.3 BEAN/round. Triggers randomly via Chainlink VRF.
          Agent holds small position for jackpot exposure.
        </p>
      </div>
    </div>
  )
}
