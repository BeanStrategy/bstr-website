const AGENT_ADDRESS = process.env.NEXT_PUBLIC_AGENT_ADDRESS ?? ''
const BSTR_ADDRESS = process.env.NEXT_PUBLIC_BSTR_ADDRESS ?? ''

export default function Footer() {
  return (
    <footer className="border-t border-border mt-24">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="font-semibold"><span className="text-[#0052ff]">Bean</span>Strategy</span>
            </div>
            <p className="text-muted text-sm leading-relaxed">
              The BEAN Reserve Protocol. Continuously accumulating BEAN through
              trading fees and staking yield on Base.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-3">Contracts (Base)</h4>
            <div className="space-y-2 text-sm text-muted font-mono">
              <div>
                <span className="text-white/50 text-xs">Treasury wallet</span>
                <p className="truncate text-xs">{AGENT_ADDRESS || 'TBD'}</p>
              </div>
              <div>
                <span className="text-white/50 text-xs">BSTR token</span>
                <p className="truncate text-xs">{BSTR_ADDRESS || 'Launching soon'}</p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-3">Links</h4>
            <div className="space-y-2 text-sm text-muted">
              <a href="https://x.com/BeanStrategy" target="_blank" rel="noopener noreferrer" className="block hover:text-white transition-colors">
                Twitter / X
              </a>
              <a href="https://minebean.com" target="_blank" rel="noopener noreferrer" className="block hover:text-white transition-colors">
                MineBean Protocol
              </a>
              {AGENT_ADDRESS && (
                <a
                  href={`https://basescan.org/address/${AGENT_ADDRESS}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block hover:text-white transition-colors"
                >
                  BaseScan
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-6 space-y-4">
          <p className="text-muted text-xs leading-relaxed">
            <span className="text-white/60 font-semibold">Disclaimer:</span> BeanStrategy is an experimental autonomous protocol.
            Nothing on this site constitutes financial, investment, or legal advice. Cryptocurrency assets are highly volatile and
            speculative. You may lose some or all of any funds involved. Past performance is not indicative of future results.
            The protocol operates autonomously — there is no team, no guarantees of returns, and no recourse in the event of
            smart contract failure, exploits, or loss of funds. Do your own research (DYOR) before interacting with any on-chain
            protocol. Never risk funds you cannot afford to lose.
            BeanStrategy is an independent project and is not affiliated with, endorsed by, or associated
            with Bankr, BankrBot, OpenClaw, or MineBean in any way.
          </p>
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-muted text-xs">
              BeanStrategy is an autonomous agent protocol. Not financial advice.
            </p>
            <p className="text-muted text-xs">
              Built on{' '}
              <a href="https://base.org" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                Base
              </a>{' '}
              ·{' '}
              <a href="https://minebean.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                Powered by MineBean
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
