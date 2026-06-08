'use client'

import { useEffect } from 'react'
import { hydrateClinicStore } from '@/lib/clinic-store'
import { hydratePatientStore } from '@/lib/patient-store'
import { hydrateMedicalRecordStore } from '@/lib/medical-record-store'
import { hydrateAnnouncementsStore } from '@/lib/announcement-store'
import { hydrateAccountingStore } from '@/lib/accounting-store'

export function StoreHydrationProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    Promise.all([
      hydrateClinicStore(),
      hydratePatientStore(),
      hydrateMedicalRecordStore(),
      hydrateAnnouncementsStore(),
      hydrateAccountingStore(),
    ]).catch(() => {})
  }, [])

  return <>{children}</>
}
