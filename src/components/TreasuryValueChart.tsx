'use client'

import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import type { HistoryItem } from '@/types'

const INCLUDED_TYPES = new Set([
  'genesis', 'stakeDeposited', 'feeReinvested',
  'yieldCompounded', 'yieldClaimed', 'claimedBEAN',
])

const CAPITAL_TYPES = new Set(['genesis', 'stakeDeposited'])

interface TreasuryPoint {
  timestamp: number
  label: string
  value: number
  basis: number
  bean: number
  price: number
  type: string
}

function buildChartData(history: HistoryItem[]): TreasuryPoint[] {
  const sorted = [...history]
    .filter(e => INCLUDED_TYPES.has(e.type) && e.beanPriceUsd)
    .sort((a, b) => a.timestamp - b.timestamp)

  let cumulativeBean = 0
  let costBasis = 0
  const points: TreasuryPoint[] = []

  for (const item of sorted) {
    const amt = parseFloat(item.amountFormatted ?? item.beanRewardFormatted ?? '0')
    if (amt <= 0) continue

    cumulativeBean += amt
    if (CAPITAL_TYPES.has(item.type) && item.sourceAmountUsd) {
      costBasis += item.sourceAmountUsd
    }

    points.push({
      timestamp: item.timestamp,
      label: '',
      value: parseFloat((cumulativeBean * (item.beanPriceUsd ?? 0)).toFixed(2)),
      basis: parseFloat(costBasis.toFixed(2)),
      bean: parseFloat(cumulativeBean.toFixed(4)),
      price: item.beanPriceUsd ?? 0,
      type: item.type,
    })
  }

  if (points.length < 2) return points

  const span = points[points.length - 1].timestamp - points[0].timestamp
  const useTime = span < 86400
  for (const pt of points) {
    const d = new Date(pt.timestamp * 1000)
    pt.label = useTime
      ? d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
      : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return points
}

const CustomTooltip = ({ active, payload }: {
  active?: boolean
  payload?: { payload: TreasuryPoint }[]
}) => {
  if (active && payload && payload.length) {
    const pt = payload[0].payload
    const d = new Date(pt.timestamp * 1000)
    const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    const timeStr = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    const pnl = pt.value - pt.basis
    const pnlColor = pnl >= 0 ? '#22c55e' : '#f87171'

    return (
      <div className="card p-3 text-sm min-w-[160px]">
        <p className="text-muted mb-2">{dateStr} · {timeStr}</p>
        <div className="flex flex-col gap-1">
          <div className="flex justify-between gap-4">
            <span className="text-muted">Value</span>
            <span className="font-mono text-white">${pt.value.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
          </div>
          {pt.basis > 0 && (
            <div className="flex justify-between gap-4">
              <span className="text-muted">Paid</span>
              <span className="font-mono text-muted">${pt.basis.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
            </div>
          )}
          {pt.basis > 0 && (
            <div className="flex justify-between gap-4 border-t border-border pt-1 mt-0.5">
              <span className="text-muted">P&L</span>
              <span className="font-mono font-medium" style={{ color: pnlColor }}>
                {pnl >= 0 ? '+' : ''}${pnl.toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </span>
            </div>
          )}
          <div className="flex justify-between gap-4 border-t border-border pt-1 mt-0.5">
            <span className="text-muted">BEAN</span>
            <span className="font-mono text-[#0052ff]">{pt.bean.toFixed(3)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted">Price</span>
            <span className="font-mono text-muted">${pt.price.toFixed(2)}</span>
          </div>
        </div>
      </div>
    )
  }
  return null
}

interface TreasuryValueChartProps {
  history: HistoryItem[]
  height?: number
}

export default function TreasuryValueChart({ history, height = 260 }: TreasuryValueChartProps) {
  const data = buildChartData(history)

  if (data.length < 2) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <p className="text-muted text-sm">Treasury value data will appear after first events</p>
      </div>
    )
  }

  const allValues = data.flatMap(d => [d.value, d.basis]).filter(v => v > 0)
  const yMin = Math.floor(Math.min(...allValues) * 0.92)
  const yMax = Math.ceil(Math.max(...allValues) * 1.04)

  return (
    <>
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="valueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0052ff" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#0052ff" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: '#6b7280', fontSize: 11 }}
            axisLine={{ stroke: '#1a1a1a' }}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fill: '#6b7280', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={55}
            domain={[yMin, yMax]}
            tickFormatter={(v: number) => `$${v >= 1000 ? `${(v / 1000).toFixed(1)}K` : v}`}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ stroke: '#374151', strokeWidth: 1 }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#0052ff"
            strokeWidth={2}
            fill="url(#valueGradient)"
            dot={{ r: 3, fill: '#0052ff', stroke: '#0a0a0a', strokeWidth: 1.5 }}
            activeDot={{ r: 5, fill: '#0052ff', stroke: '#0a0a0a', strokeWidth: 2 }}
          />
          <Line
            type="monotone"
            dataKey="basis"
            stroke="#6b7280"
            strokeWidth={1.5}
            strokeDasharray="5 3"
            dot={false}
            activeDot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
      <div className="flex gap-5 mt-3 justify-end">
        <div className="flex items-center gap-1.5">
          <span className="w-6 h-0.5 inline-block bg-[#0052ff]" />
          <span className="text-xs text-muted">Treasury Value</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-6 h-0.5 inline-block bg-[#6b7280]" style={{ borderTop: '2px dashed #6b7280', background: 'none' }} />
          <span className="text-xs text-muted">Cost Basis</span>
        </div>
      </div>
    </>
  )
}
