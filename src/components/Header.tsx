'use client'
import { useState } from 'react'
import Link from 'next/link'

const NAV_LINKS = [
  { href: '/', label: 'Treasury' },
  { href: '/history', label: 'History' },
  { href: '/staking', label: 'Staking' },
  { href: '/mining', label: 'Mining' },
]

export default function Header() {
  const [open, setOpen] = useState(false)

  return (
    <header className="border-b border-border sticky top-0 z-50 bg-background/95 backdrop-blur">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-semibold text-lg" onClick={() => setOpen(false)}>
          <span><span className="text-[#0052ff]">Bean</span>Strategy</span>
          <span className="text-xs text-muted bg-card border border-border px-2 py-0.5 rounded-full ml-1">
            BSTR
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm text-muted">
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-white transition-colors">
              {l.label}
            </Link>
          ))}
          <a href="https://x.com/BeanStrategy" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
            Twitter
          </a>
          <span className="relative group">
            <span className="bg-[#0052ff]/40 text-white/50 font-semibold px-4 py-1.5 rounded-full text-xs cursor-not-allowed select-none">
              Buy BSTR
            </span>
            <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 text-xs text-muted bg-card border border-border px-2 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              Coming soon
            </span>
          </span>
        </nav>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 text-muted hover:text-white transition-colors"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          {open ? (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-border bg-background px-4 py-4 flex flex-col gap-4 text-sm text-muted">
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-white transition-colors" onClick={() => setOpen(false)}>
              {l.label}
            </Link>
          ))}
          <a href="https://x.com/BeanStrategy" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
            Twitter
          </a>
          <span className="bg-[#0052ff]/40 text-white/50 font-semibold px-4 py-2 rounded-full text-xs cursor-not-allowed select-none text-center">
            Buy BSTR — Coming Soon
          </span>
        </div>
      )}
    </header>
  )
}
