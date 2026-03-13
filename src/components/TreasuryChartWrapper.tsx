'use client'

import dynamic from 'next/dynamic'
import type { HistoryItem } from '@/types'

const TreasuryValueChart = dynamic(() => import('./TreasuryValueChart'), { ssr: false })

interface Props {
  history: HistoryItem[]
  height?: number
}

export default function TreasuryChartWrapper({ history, height }: Props) {
  return <TreasuryValueChart history={history} height={height} />
}
