'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import type { HistoryItem } from '@/types'

interface ChartPoint {
  timestamp: number
  label: string
  bean: number
  type: string
}

const INCLUDED_TYPES = new Set([
  'genesis', 'stakeDeposited', 'feeReinvested',
  'checkpointed', 'claimedBEAN', 'yieldCompounded', 'yieldClaimed',
])

const DOT_COLORS: Record<string, string> = {
  genesis:        '#0052ff',
  stakeDeposited: '#0052ff',
  feeReinvested:  '#22c55e',
  yieldCompounded:'#a855f7',
  yieldClaimed:   '#a855f7',
  checkpointed:   '#22c55e',
  claimedBEAN:    '#4ade80',
}

const EVENT_LABELS: Record<string, string> = {
  genesis:        'Capital Injected',
  stakeDeposited: 'Capital Injected',
  feeReinvested:  'Fees Reinvested',
  yieldCompounded:'Compounded',
  yieldClaimed:   'Compounded',
  checkpointed:   'Round Won',
  claimedBEAN:    'BEAN Claimed',
}

function buildChartData(history: HistoryItem[]): ChartPoint[] {
  const sorted = [...history].sort((a, b) => a.timestamp - b.timestamp)
  let cumulative = 0
  const points: ChartPoint[] = []

  for (const item of sorted) {
    const beanAmount = parseFloat(item.beanRewardFormatted ?? item.amountFormatted ?? '0')
    if (beanAmount > 0 && INCLUDED_TYPES.has(item.type)) {
      cumulative += beanAmount
      points.push({ timestamp: item.timestamp, label: '', bean: parseFloat(cumulative.toFixed(4)), type: item.type })
    }
  }

  if (points.length < 2) return points

  // Use time labels when all data fits within 24h, dates otherwise
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomDot = (props: any) => {
  const { cx, cy, payload, index } = props
  const color = DOT_COLORS[payload.type] ?? '#6b7280'
  return (
    <circle
      key={`dot-${index}`}
      cx={cx}
      cy={cy}
      r={4}
      fill={color}
      stroke="#0a0a0a"
      strokeWidth={1.5}
    />
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomActiveDot = (props: any) => {
  const { cx, cy, payload } = props
  const color = DOT_COLORS[payload.type] ?? '#6b7280'
  return <circle cx={cx} cy={cy} r={6} fill={color} stroke="#0a0a0a" strokeWidth={2} />
}

const CustomTooltip = ({ active, payload }: {
  active?: boolean
  payload?: { payload: ChartPoint; value: number }[]
}) => {
  if (active && payload && payload.length) {
    const pt = payload[0].payload
    const d = new Date(pt.timestamp * 1000)
    const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    const timeStr = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    const label = EVENT_LABELS[pt.type] ?? pt.type
    const color = DOT_COLORS[pt.type] ?? '#6b7280'
    return (
      <div className="card p-3 text-sm">
        <p className="text-muted mb-1">{dateStr} · {timeStr}</p>
        <p className="font-medium mb-0.5" style={{ color }}>{label}</p>
        <p className="text-white font-semibold">{payload[0].value.toFixed(4)} BEAN</p>
      </div>
    )
  }
  return null
}

interface AccumulationChartProps {
  history: HistoryItem[]
  height?: number
}

export default function AccumulationChart({ history, height = 220 }: AccumulationChartProps) {
  const data = buildChartData(history)

  if (data.length < 2) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <p className="text-muted text-sm">Accumulation data will appear after first rewards</p>
      </div>
    )
  }

  return (
    <>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="beanGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
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
            width={50}
            tickFormatter={(v: number) => `${v}`}
            domain={[
              (min: number) => parseFloat((min * 0.95).toFixed(2)),
              (max: number) => parseFloat((max * 1.02).toFixed(2)),
            ]}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ stroke: '#374151', strokeWidth: 1 }}
          />
          <Area
            type="monotone"
            dataKey="bean"
            stroke="#22c55e"
            strokeWidth={2}
            fill="url(#beanGradient)"
            dot={<CustomDot />}
            activeDot={<CustomActiveDot />}
          />
        </AreaChart>
      </ResponsiveContainer>
      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-3 justify-end">
        {([
          ['Capital Injected', '#0052ff'],
          ['Fees Reinvested', '#22c55e'],
          ['Compounded',       '#a855f7'],
        ] as [string, string][]).map(([label, color]) => (
          <div key={label} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: color }} />
            <span className="text-xs text-muted">{label}</span>
          </div>
        ))}
      </div>
    </>
  )
}
