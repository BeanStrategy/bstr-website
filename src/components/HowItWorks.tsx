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
        'All BEAN is staked on MineBean protocol. Staking yield from treasury buybacks compounds daily, growing the treasury exponentially.',
    },
  ]

  return (
    <section className="mt-20">
      <h2 className="text-2xl font-bold mb-2">How It Works</h2>
      <p className="text-muted mb-10">
        A self-reinforcing flywheel — more BSTR trading means more BEAN, which means higher NAV,
        which attracts more BSTR buyers.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {steps.map((step) => (
          <div key={step.number} className="card p-6">
            <p className="text-[#0052ff] font-mono text-sm mb-3">{step.number}</p>
            <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
            <p className="text-muted text-sm leading-relaxed">{step.description}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 card p-6 border-[#0052ff]/20">
        <h3 className="font-semibold mb-3 text-[#0052ff]">The Flywheel</h3>
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
          <span className="card px-3 py-1.5">BSTR volume</span>
          <span className="text-[#0052ff]">→</span>
          <span className="card px-3 py-1.5 flex items-center gap-1.5">fees → <BeanIcon size={16} /></span>
          <span className="text-[#0052ff]">→</span>
          <span className="card px-3 py-1.5">stake @ {aprLabel}</span>
          <span className="text-[#0052ff]">→</span>
          <span className="card px-3 py-1.5">NAV rises</span>
          <span className="text-[#0052ff]">→</span>
          <span className="card px-3 py-1.5">more BSTR buyers</span>
          <span className="text-[#0052ff]">→</span>
          <span className="text-white">repeat</span>
        </div>
      </div>
    </section>
  )
}
