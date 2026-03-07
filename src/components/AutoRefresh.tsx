'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { REFRESH_INTERVAL_MS } from '@/lib/config'

export default function AutoRefresh() {
  const router = useRouter()
  const [secondsAgo, setSecondsAgo] = useState(0)

  useEffect(() => {
    const refreshTimer = setInterval(() => {
      router.refresh()
      setSecondsAgo(0)
    }, REFRESH_INTERVAL_MS)

    const countTimer = setInterval(() => {
      setSecondsAgo((s) => s + 1)
    }, 1000)

    return () => {
      clearInterval(refreshTimer)
      clearInterval(countTimer)
    }
  }, [router])

  return (
    <span className="text-xs text-muted">
      {secondsAgo === 0 ? 'Just updated' : `Updated ${secondsAgo}s ago`}
    </span>
  )
}
