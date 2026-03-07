'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import type { HistoryItem } from '@/types'

interface ChartPoint {
  date: string
  bean: number
}

function buildChartData(history: HistoryItem[]): ChartPoint[] {
  const sorted = [...history].sort((a, b) => a.timestamp - b.timestamp)
  let cumulative = 0
  const points: ChartPoint[] = []

  for (const item of sorted) {
    const beanAmount = parseFloat(item.beanRewardFormatted ?? item.amountFormatted ?? '0')
    if (beanAmount > 0 && ['checkpointed', 'stakeDeposited', 'yieldCompounded', 'yieldClaimed'].includes(item.type)) {
      cumulative += beanAmount
      const date = new Date(item.timestamp * 1000).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
      points.push({ date, bean: parseFloat(cumulative.toFixed(4)) })
    }
  }

  return points.length > 0 ? points : []
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="card p-3 text-sm">
        <p className="text-muted mb-1">{label}</p>
        <p className="text-accent font-semibold">{payload[0].value.toFixed(4)} BEAN</p>
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
      <div className="card p-6" style={{ height }}>
        <div className="flex items-center justify-center h-full">
          <p className="text-muted text-sm">Accumulation data will appear after first rewards</p>
        </div>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
        <XAxis
          dataKey="date"
          tick={{ fill: '#6b7280', fontSize: 11 }}
          axisLine={{ stroke: '#1a1a1a' }}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: '#6b7280', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={50}
          tickFormatter={(v) => `${v}`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Line
          type="monotone"
          dataKey="bean"
          stroke="#22c55e"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: '#22c55e' }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
