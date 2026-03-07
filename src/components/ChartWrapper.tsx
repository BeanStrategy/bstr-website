'use client'

import dynamic from 'next/dynamic'
import type { HistoryItem } from '@/types'

const AccumulationChart = dynamic(() => import('./AccumulationChart'), { ssr: false })

interface ChartWrapperProps {
  history: HistoryItem[]
  height?: number
}

export default function ChartWrapper({ history, height }: ChartWrapperProps) {
  return <AccumulationChart history={history} height={height} />
}
