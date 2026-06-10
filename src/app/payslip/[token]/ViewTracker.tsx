'use client'

import { useEffect } from 'react'

export default function ViewTracker({ tokenId, alreadyViewed }: { tokenId: string; alreadyViewed: boolean }) {
  useEffect(() => {
    if (alreadyViewed) return
    fetch('/api/payroll/view-slip', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tokenId }),
    }).catch(() => {})
  }, [tokenId, alreadyViewed])

  return null
}
