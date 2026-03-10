import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

export const metadata: Metadata = {
  title: 'BeanStrategy — The BEAN Reserve Protocol',
  description:
    'BeanStrategy (BSTR) continuously accumulates BEAN through trading fees and staking yield. The first BEAN treasury reserve protocol on Base.',
  metadataBase: new URL('https://beanstrategy.com'),
  icons: { icon: '/images/favicon.ico' },
  openGraph: {
    title: 'BeanStrategy — The BEAN Reserve Protocol',
    description: 'Continuously accumulating BEAN, powered by trading fees and high-yield staking on MineBean.',
    type: 'website',
    url: 'https://beanstrategy.com',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@BeanStrategy',
    creator: '@BeanStrategy',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-background text-white min-h-screen">
        {children}
        <Analytics />
      </body>
    </html>
  )
}
