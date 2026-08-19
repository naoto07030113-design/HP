'use client'

import { useEffect } from 'react'
import { toast } from 'sonner'
import { hydrateClinicStore } from '@/lib/clinic-store'
import { hydrateAnnouncementsStore } from '@/lib/announcement-store'
import { hydrateSettingsStore } from '@/lib/settings-store'
import { hydrateClosedDaysStore } from '@/lib/closed-days-store'
import { hydrateMerchandiseStore } from '@/lib/merchandise-store'

/**
 * 画面共通で使う「公開情報」だけを先に読み込む。
 *
 * 患者・カルテ・会計・予約・シフトはここでは読まない。
 * それぞれの画面が必要な分だけを API から引く（`/api/v1/*`）。
 * 以前はここで全患者・全カルテ・全会計をブラウザへ読み込んでいたため、
 * 他院のデータが端末に載り、件数が増えると静かに欠けていた。
 *
 * scope='public': 患者向けページ用。予約に必要な公開データのみロードする
 */
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
    // 共有データの読み込み失敗を黙って捨てると、画面が「データ0件」に見えてしまう
    Promise.all(tasks).catch((err) => {
      console.error('共有データの読み込みに失敗しました', err)
      toast.error('データの読み込みに失敗しました。画面を再読み込みしてください')
    })
  }, [scope])

  return <>{children}</>
}
