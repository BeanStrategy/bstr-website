import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#050505',
        card: '#0d0d0d',
        border: '#1a1a1a',
        accent: '#22c55e',
        'accent-dim': '#16a34a',
        muted: '#6b7280',
      },
      fontFamily: {
        mono: ['var(--font-mono)', 'Courier New', 'monospace'],
      },
    },
  },
  plugins: [],
}

export default config
