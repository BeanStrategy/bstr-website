import type { BurnEvent } from '@/types'

const BASE_RPC = 'https://mainnet.base.org'
export const BURN_ADDRESS = '0x000000000000000000000000000000000000dead'
const TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'
const BURN_TOPIC = '0x' + BURN_ADDRESS.slice(2).padStart(64, '0')

const FETCH_OPTS = {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'User-Agent': 'BeanStrategy/1.0 (beanstrategy.com)',
  },
  cache: 'no-store' as const,
}

async function ethCall(to: string, data: string): Promise<string> {
  const res = await fetch(BASE_RPC, {
    ...FETCH_OPTS,
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'eth_call',
      params: [{ to, data }, 'latest'],
      id: 1,
    }),
  })
  if (!res.ok) throw new Error(`RPC error: ${res.status}`)
  const json = await res.json()
  if (json.error) throw new Error(json.error.message)
  return json.result as string
}

function hexToTokenAmount(hex: string): number {
  if (!hex || hex === '0x') return 0
  const raw = BigInt(hex)
  const divisor = BigInt('1000000000000000000') // 10^18
  const whole = Number(raw / divisor)
  const frac = Number(raw % divisor) / 1e18
  return whole + frac
}

const WETH_ADDRESS = '0x4200000000000000000000000000000000000006'

export async function fetchNativeEthBalance(address: string): Promise<number> {
  const res = await fetch(BASE_RPC, {
    ...FETCH_OPTS,
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'eth_getBalance',
      params: [address, 'latest'],
      id: 1,
    }),
  })
  if (!res.ok) throw new Error(`RPC error: ${res.status}`)
  const json = await res.json()
  if (json.error) throw new Error(json.error.message)
  return hexToTokenAmount(json.result as string)
}

export async function fetchWethBalance(address: string): Promise<number> {
  const padded = address.slice(2).padStart(64, '0')
  const result = await ethCall(WETH_ADDRESS, `0x70a08231${padded}`)
  return hexToTokenAmount(result)
}

export async function fetchTokenBalance(tokenAddress: string, walletAddress: string): Promise<number> {
  const padded = walletAddress.slice(2).padStart(64, '0')
  const result = await ethCall(tokenAddress, `0x70a08231${padded}`)
  return hexToTokenAmount(result)
}

export async function fetchBstrTotalSupply(bstrAddress: string): Promise<number> {
  const result = await ethCall(bstrAddress, '0x18160ddd')
  return hexToTokenAmount(result)
}

export async function fetchBstrBurned(bstrAddress: string): Promise<number> {
  const padded = BURN_ADDRESS.slice(2).padStart(64, '0')
  const result = await ethCall(bstrAddress, `0x70a08231${padded}`)
  return hexToTokenAmount(result)
}

// Fetch individual burn transactions by querying Transfer events to the burn address.
// Each event is a separate buyback+burn execution by the agent.
export async function fetchBurnHistory(bstrAddress: string, fromBlock = '0x0'): Promise<BurnEvent[]> {
  const res = await fetch(BASE_RPC, {
    ...FETCH_OPTS,
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'eth_getLogs',
      params: [{
        fromBlock,
        toBlock: 'latest',
        address: bstrAddress,
        topics: [TRANSFER_TOPIC, null, BURN_TOPIC],
      }],
      id: 1,
    }),
  })
  if (!res.ok) throw new Error(`eth_getLogs error: ${res.status}`)
  const json = await res.json()
  if (json.error) throw new Error(json.error.message)
  const logs: Array<{ data: string; blockNumber: string; transactionHash: string }> = json.result ?? []

  // Batch block timestamp lookups
  const blockNumbers = [...new Set(logs.map(l => l.blockNumber))]
  const blockTimestamps = new Map<string, number>()
  await Promise.all(blockNumbers.map(async (bn) => {
    try {
      const r = await fetch(BASE_RPC, {
        ...FETCH_OPTS,
        body: JSON.stringify({ jsonrpc: '2.0', method: 'eth_getBlockByNumber', params: [bn, false], id: 1 }),
      })
      const b = await r.json()
      if (b.result?.timestamp) blockTimestamps.set(bn, parseInt(b.result.timestamp, 16))
    } catch {}
  }))

  return logs.map(log => ({
    bstrBurned: hexToTokenAmount(log.data),
    ethSpent: 0, // ETH spent not available from Transfer event — agent logs this separately
    timestamp: blockTimestamps.get(log.blockNumber) ?? 0,
    txHash: log.transactionHash,
    blockNumber: parseInt(log.blockNumber, 16),
  })).sort((a, b) => b.timestamp - a.timestamp)
}
