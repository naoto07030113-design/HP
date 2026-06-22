'use client'

import { useEffect } from 'react'
import { hydrateBusinessStore } from '@/lib/business-store'
import { hydrateCashbookStore } from '@/lib/cashbook-store'
import { hydrateScheduledPaymentStore } from '@/lib/scheduled-payment-store'
import { hydrateCardStore } from '@/lib/card-store'

export function StoreHydration({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    Promise.all([
      hydrateBusinessStore(),
      hydrateCashbookStore(),
      hydrateScheduledPaymentStore(),
      hydrateCardStore(),
    ]).catch(() => {})
  }, [])

  return <>{children}</>
}
