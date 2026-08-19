'use client'

import { useEffect, useState } from 'react'
import { apiPost, ApiError } from '@/lib/api-client'

/**
 * 分析レポートをサーバーから取得する。
 *
 * 以前はブラウザが全会計・全患者・全予約を読み込んでから集計していた。
 */

export type AnalyticsReport = {
  month: string
  kpi: {
    thisMonthRev: number; lastMonthRev: number
    thisMonthVisits: number; lastMonthVisits: number
    newPatients: number; repeatRate: number
  }
  days30: Array<{ date: string; label: string; revenue: number; visits: number }>
  staffStats: Array<{ id: string; name: string; role: string | null; clinicId: string; visits: number; revenue: number }>
  menuRanking: Array<{ name: string; count: number; revenue: number }>
  statusBreakdown: Array<{ status: string; count: number }>
  inactivePatients: Array<{
    id: string; name: string; nameKana: string | null; phone: string | null
    clinicId: string; lastVisitDate: string | null; daysSince: number | null
  }>
}

const EMPTY: AnalyticsReport = {
  month: '',
  kpi: { thisMonthRev: 0, lastMonthRev: 0, thisMonthVisits: 0, lastMonthVisits: 0, newPatients: 0, repeatRate: 0 },
  days30: [],
  staffStats: [],
  menuRanking: [],
  statusBreakdown: [],
  inactivePatients: [],
}

export function useAnalyticsReport(params: { clinicId: string | null; inactiveDays: number }) {
  const { clinicId, inactiveDays } = params
  const [report, setReport] = useState<AnalyticsReport>(EMPTY)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError(null)

    apiPost<AnalyticsReport>('/api/v1/analytics/report',
      { clinicId: clinicId ?? undefined, inactiveDays },
      { authenticated: true, signal: controller.signal })
      .then(setReport)
      .catch((err) => {
        if (controller.signal.aborted) return
        setReport(EMPTY)
        setError(err instanceof ApiError ? `${err.message}（${err.supportCode}）` : '集計を取得できませんでした。')
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })

    return () => controller.abort()
  }, [clinicId, inactiveDays])

  return { report, loading, error }
}
