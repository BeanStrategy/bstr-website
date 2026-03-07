const BASE_RPC = 'https://mainnet.base.org'
export const BURN_ADDRESS = '0x000000000000000000000000000000000000dead'

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

export async function fetchBstrTotalSupply(bstrAddress: string): Promise<number> {
  const result = await ethCall(bstrAddress, '0x18160ddd')
  return hexToTokenAmount(result)
}

export async function fetchBstrBurned(bstrAddress: string): Promise<number> {
  const padded = BURN_ADDRESS.slice(2).padStart(64, '0')
  const result = await ethCall(bstrAddress, `0x70a08231${padded}`)
  return hexToTokenAmount(result)
}
