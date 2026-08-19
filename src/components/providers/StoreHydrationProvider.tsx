'use client'

import { useEffect } from 'react'
import { toast } from 'sonner'
import { hydrateClinicStore } from '@/lib/clinic-store'
import { hydratePatientStore } from '@/lib/patient-store'
import { hydrateMedicalRecordStore } from '@/lib/medical-record-store'
import { hydrateAnnouncementsStore } from '@/lib/announcement-store'
import { hydrateAccountingStore } from '@/lib/accounting-store'
import { hydrateSettingsStore } from '@/lib/settings-store'
import { hydrateClosedDaysStore } from '@/lib/closed-days-store'
import { hydrateMerchandiseStore } from '@/lib/merchandise-store'

// scope='public': 患者向けページ用。予約に必要な公開データのみロードする
// （患者・カルテ・会計はスタッフ専用のため匿名アクセスではロードしない）
export function StoreHydrationProvider({
  children,
  scope = 'admin',
}: {
  children: React.ReactNode
  scope?: 'admin' | 'public'
}) {
  useEffect(() => {
    const tasks = [
      hydrateClinicStore(scope),
      hydrateAnnouncementsStore(),
      hydrateSettingsStore(),
      hydrateClosedDaysStore(),
      hydrateMerchandiseStore(scope),
    ]
    if (scope === 'admin') {
      tasks.push(
        hydratePatientStore(),
        hydrateMedicalRecordStore(),
        hydrateAccountingStore(),
      )
    }
    // 共有データの読み込み失敗を黙って捨てると、画面が「データ0件」に見えてしまう
    Promise.all(tasks).catch((err) => {
      console.error('共有データの読み込みに失敗しました', err)
      toast.error('データの読み込みに失敗しました。画面を再読み込みしてください')
    })
  }, [scope])

  return <>{children}</>
}
