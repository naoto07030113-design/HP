'use client'

import { useEffect } from 'react'
import { hydrateClinicStore } from '@/lib/clinic-store'
import { hydratePatientStore } from '@/lib/patient-store'
import { hydrateMedicalRecordStore } from '@/lib/medical-record-store'
import { hydrateAnnouncementsStore } from '@/lib/announcement-store'

/**
 * アプリ起動時に暗号化ストレージから各ストアを復号・ハイドレートする。
 * 管理画面レイアウトの最上位に配置する。
 */
export function StoreHydrationProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // 全ストアを並列で復号・ハイドレーション
    Promise.all([
      hydrateClinicStore(),
      hydratePatientStore(),
      hydrateMedicalRecordStore(),
      hydrateAnnouncementsStore(),
    ]).catch(() => {
      // 暗号化対応ブラウザでない場合はデモデータのまま継続
    })
  }, [])

  return <>{children}</>
}
