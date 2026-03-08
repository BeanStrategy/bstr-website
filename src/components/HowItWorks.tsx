import BeanIcon from '@/components/BeanIcon'

interface HowItWorksProps {
  apr?: number
}

export default function HowItWorks({ apr }: HowItWorksProps) {
  const aprLabel = apr && apr > 0 ? `${apr.toFixed(0)}% APR` : 'high-yield APR'
  const aprTitle = apr && apr > 0 ? `BEAN Earns ${apr.toFixed(0)}% APR` : 'BEAN Earns High-Yield APR'

  const steps = [
    {
      number: '01',
      title: 'Trade BSTR, Generate Fees',
      description:
        'Every BSTR swap on Base generates a 1.2% fee. 57% flows directly to the BeanStrategy treasury wallet — automatically, on-chain, forever.',
    },
    {
      number: '02',
      title: 'Fees Buy BEAN',
      description:
        'The autonomous agent converts accumulated WETH fees into BEAN tokens at market price. No selling. No distributions. Pure accumulation.',
    },
    {
      number: '03',
      title: aprTitle,
      description:
        'All BEAN is staked on MineBean protocol. BEAN staking yield compounds back into the treasury every 4 hours — growing holdings automatically. Staking also generates separate ETH rewards.',
    },
    {
      number: '04',
      title: 'ETH Yield Burns BSTR',
      description:
        'A portion of ETH staking rewards buys BSTR on the open market and permanently burns it. Less supply and more BEAN means higher NAV per BSTR.',
    },
  ]

  return (
    <section className="mt-20">
      <h2 className="text-2xl font-bold mb-2">How It Works</h2>
      <p className="text-muted mb-10">
        Two self-reinforcing flywheels — BEAN accumulation grows the treasury, BSTR buybacks
        reduce supply. Both compound NAV over time.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {steps.map((step) => (
          <div key={step.number} className="card p-6">
            <p className="text-[#0052ff] font-mono text-sm mb-3">{step.number}</p>
            <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
            <p className="text-muted text-sm leading-relaxed">{step.description}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 card p-6 border-[#0052ff]/20">
        <h3 className="font-semibold mb-5 text-[#0052ff]">The Two Flywheels</h3>
        <div className="space-y-6">

          {/* Flywheel 1 */}
          <div>
            <p className="text-xs text-muted uppercase tracking-wide mb-3">BEAN Accumulation</p>
            {/* Mobile: vertical */}
            <div className="flex flex-col gap-1 sm:hidden text-sm">
              {[
                <span key="1" className="card px-3 py-1.5 text-muted">BSTR volume</span>,
                <span key="2" className="card px-3 py-1.5 flex items-center gap-1.5 text-muted">fees → <BeanIcon size={14} /></span>,
                <span key="3" className="card px-3 py-1.5 text-muted">stake @ {aprLabel}</span>,
                <span key="4" className="card px-3 py-1.5 text-muted">yield compounds</span>,
                <span key="5" className="card px-3 py-1.5 text-muted">more BEAN</span>,
                <span key="6" className="card px-3 py-1.5 text-muted">NAV rises</span>,
              ].map((step, i) => (
                <div key={i} className="flex flex-col items-start">
                  {step}
                  {i < 5 && <span className="text-[#0052ff] text-xs pl-3">↓</span>}
                </div>
              ))}
              <span className="text-white text-sm pl-1">↺ repeat</span>
            </div>
            {/* Desktop: horizontal */}
            <div className="hidden sm:flex flex-wrap items-center gap-2 text-sm text-muted">
              <span className="card px-3 py-1.5">BSTR volume</span>
              <span className="text-[#0052ff]">→</span>
              <span className="card px-3 py-1.5 flex items-center gap-1.5">fees → <BeanIcon size={16} /></span>
              <span className="text-[#0052ff]">→</span>
              <span className="card px-3 py-1.5">stake @ {aprLabel}</span>
              <span className="text-[#0052ff]">→</span>
              <span className="card px-3 py-1.5">yield compounds</span>
              <span className="text-[#0052ff]">→</span>
              <span className="card px-3 py-1.5">more BEAN</span>
              <span className="text-[#0052ff]">→</span>
              <span className="card px-3 py-1.5">NAV rises</span>
              <span className="text-[#0052ff]">→</span>
              <span className="text-white">repeat</span>
            </div>
          </div>

          {/* Flywheel 2 */}
          <div>
            <p className="text-xs text-muted uppercase tracking-wide mb-3">BSTR Buyback &amp; Burn</p>
            {/* Mobile: vertical */}
            <div className="flex flex-col gap-1 sm:hidden text-sm">
              {[
                'ETH staking yield',
                'buy BSTR',
                'burn forever',
                'supply ↓',
                'NAV rises',
              ].map((step, i) => (
                <div key={i} className="flex flex-col items-start">
                  <span className="card px-3 py-1.5 text-muted">{step}</span>
                  {i < 4 && <span className="text-[#0052ff] text-xs pl-3">↓</span>}
                </div>
              ))}
              <span className="text-white text-sm pl-1">↺ repeat</span>
            </div>
            {/* Desktop: horizontal */}
            <div className="hidden sm:flex flex-wrap items-center gap-2 text-sm text-muted">
              <span className="card px-3 py-1.5">ETH staking yield</span>
              <span className="text-[#0052ff]">→</span>
              <span className="card px-3 py-1.5">buy BSTR</span>
              <span className="text-[#0052ff]">→</span>
              <span className="card px-3 py-1.5">burn forever</span>
              <span className="text-[#0052ff]">→</span>
              <span className="card px-3 py-1.5">supply ↓</span>
              <span className="text-[#0052ff]">→</span>
              <span className="card px-3 py-1.5">NAV rises</span>
              <span className="text-[#0052ff]">→</span>
              <span className="text-white">repeat</span>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
