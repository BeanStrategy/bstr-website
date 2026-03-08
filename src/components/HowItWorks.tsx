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
      title: 'Fees Split 80/20',
      description:
        '80% of accumulated fees buy BEAN and stake it. 20% buy BSTR and burn it permanently. Both sides compound NAV over time.',
    },
    {
      number: '03',
      title: aprTitle,
      description:
        'All BEAN is staked on MineBean protocol. BEAN staking yield compounds back into the treasury every 4 hours — growing holdings automatically.',
    },
    {
      number: '04',
      title: 'Fees Burn BSTR',
      description:
        '20% of every fee collected is used to buy BSTR on the open market and permanently burn it. Less supply and more BEAN means higher NAV per BSTR.',
    },
  ]

  return (
    <section className="mt-20">
      <h2 className="text-2xl font-bold mb-2">How It Works</h2>
      <p className="text-muted mb-10">
        Every BSTR trade generates fees. Those fees split two ways — growing the BEAN treasury and shrinking BSTR supply. Both push NAV higher.
      </p>

      {/* Step cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        {steps.map((step) => (
          <div key={step.number} className="card p-6">
            <p className="text-[#0052ff] font-mono text-sm mb-3">{step.number}</p>
            <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
            <p className="text-muted text-sm leading-relaxed">{step.description}</p>
          </div>
        ))}
      </div>

      {/* Split funnel diagram */}
      <div className="card border-[#0052ff]/20 overflow-hidden">

        {/* Input node */}
        <div className="flex justify-center px-6 pt-6 pb-0">
          <div className="bg-[#0052ff]/10 border border-[#0052ff]/30 rounded-xl px-6 py-3 text-center">
            <p className="text-xs text-muted uppercase tracking-wide mb-0.5">every BSTR trade</p>
            <p className="font-semibold text-white">1.2% fee → treasury</p>
          </div>
        </div>

        {/* Fork connector */}
        <div className="flex justify-center">
          <div className="w-px h-3 bg-[#0052ff]/30"></div>
        </div>
        <div className="flex mx-12 md:mx-24">
          <div className="flex-1 h-4 border-l-2 border-b-2 border-[#0052ff]/30 rounded-bl-lg"></div>
          <div className="flex-1 h-4 border-r-2 border-b-2 border-[#0052ff]/30 rounded-br-lg"></div>
        </div>

        {/* Split percentage labels */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-px">
          <div className="flex justify-center pt-1 pb-1">
            <span className="text-sm font-mono font-bold text-[#22c55e]">80% → BEAN</span>
          </div>
          <div className="flex justify-center pt-1 pb-1">
            <span className="text-sm font-mono font-bold text-orange-400">20% → Burn</span>
          </div>
        </div>

        {/* Two path columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 md:divide-x divide-border">

          {/* Left: BEAN accumulation */}
          <div className="p-5 flex flex-col items-center gap-2 border-b md:border-b-0 border-border">
            <p className="text-xs text-[#22c55e] uppercase tracking-wide font-medium text-center mb-1">
              BEAN Accumulation
            </p>
            {[
              { text: <span className="flex items-center justify-center gap-1.5">Swap WETH → <BeanIcon size={13} /> BEAN</span> },
              { text: 'Stake on MineBean' },
              { text: `Earn ${aprLabel}` },
              { text: 'Compounds every 4h' },
              { text: 'Treasury grows ↑', highlight: true },
            ].map((step, i) => (
              <div key={i} className="flex flex-col items-center gap-1 w-full max-w-xs">
                <div className={`border rounded-lg px-3 py-2 text-xs text-center w-full ${
                  step.highlight
                    ? 'border-[#22c55e]/40 text-[#22c55e] font-semibold bg-[#22c55e]/5'
                    : 'border-[#22c55e]/15 text-muted'
                }`}>
                  {step.text}
                </div>
                {i < 4 && <span className="text-[#22c55e]/50 text-xs">↓</span>}
              </div>
            ))}
          </div>

          {/* Right: BSTR burn */}
          <div className="p-5 flex flex-col items-center gap-2">
            <p className="text-xs text-orange-400 uppercase tracking-wide font-medium text-center mb-1">
              BSTR Buyback &amp; Burn
            </p>
            {[
              { text: 'Buy BSTR at market price' },
              { text: 'Send to 0x000...dead' },
              { text: 'Permanently removed' },
              { text: 'Circulating supply ↓', highlight: true },
            ].map((step, i) => (
              <div key={i} className="flex flex-col items-center gap-1 w-full max-w-xs">
                <div className={`border rounded-lg px-3 py-2 text-xs text-center w-full ${
                  step.highlight
                    ? 'border-orange-400/40 text-orange-400 font-semibold bg-orange-400/5'
                    : 'border-orange-400/15 text-muted'
                }`}>
                  {step.text}
                </div>
                {i < 3 && <span className="text-orange-400/50 text-xs">↓</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Merge connector */}
        <div className="flex mx-12 md:mx-24">
          <div className="flex-1 h-4 border-l-2 border-t-2 border-[#0052ff]/30 rounded-tl-lg"></div>
          <div className="flex-1 h-4 border-r-2 border-t-2 border-[#0052ff]/30 rounded-tr-lg"></div>
        </div>
        <div className="flex justify-center">
          <div className="w-px h-3 bg-[#0052ff]/30"></div>
        </div>

        {/* Output node */}
        <div className="flex justify-center px-6 pb-6 pt-0">
          <div className="bg-[#0052ff]/10 border border-[#0052ff]/30 rounded-xl px-6 py-3 text-center">
            <p className="font-bold text-[#0052ff]">NAV per BSTR rises ↑</p>
            <p className="text-xs text-muted mt-0.5">more BEAN held · less BSTR in circulation</p>
          </div>
        </div>

      </div>
    </section>
  )
}
