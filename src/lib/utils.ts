export function formatBEAN(value: string | number, decimals = 2): string {
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return '0'
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(decimals)}M`
  if (num >= 1_000) return `${(num / 1_000).toFixed(decimals)}K`
  return num.toLocaleString('en-US', { maximumFractionDigits: decimals })
}

export function formatUSD(value: number): string {
  const num = typeof value === 'number' && isFinite(value) ? value : 0
  if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(2)}M`
  if (num >= 1_000) return `$${(num / 1_000).toFixed(1)}K`
  return `$${num.toFixed(2)}`
}

export function formatETH(value: string | number, decimals = 4): string {
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num) || !isFinite(num)) return '0'
  return num.toFixed(decimals)
}

export function formatPercent(value: number, showSign = true): string {
  const num = typeof value === 'number' && isFinite(value) ? value : 0
  const sign = showSign && num >= 0 ? '+' : ''
  return `${sign}${num.toFixed(2)}%`
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function timeAgo(timestamp: number): string {
  const diff = Math.floor(Date.now() / 1000) - timestamp
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function beanValueUsd(beanAmount: number, priceUsd: number): string {
  return formatUSD(beanAmount * priceUsd)
}
