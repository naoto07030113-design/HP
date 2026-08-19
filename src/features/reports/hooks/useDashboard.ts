'use client'

import { useEffect, useRef, useState } from 'react'
import { apiPost, ApiError } from '@/lib/api-client'
import type { DashboardData, DateRange, PeriodFilter } from '@/types/dashboard'

/**
 * ダッシュボードの集計をサーバーから取得する。
 *
 * 以前はブラウザが全予約・全会計・全患者を読み込んでから集計していた。
 * 集計はサーバーで完結させ、画面には結果だけを渡す。
 */

const EMPTY_KPI = {
  sales: 0, visits: 0, newPatients: 0, repeatPatients: 0, repeatRate: 0,
  cancellationRate: 0, averageSpend: 0, inactivePatients: 0,
  totalReservations: 0, cancelledCount: 0, noShowCount: 0,
}

function emptyData(): DashboardData {
  const today = new Date().toISOString().slice(0, 10)
  const range: DateRange = { from: today, to: today }
  return {
    period: range, prevPeriod: range,
    overall: EMPTY_KPI, prevOverall: EMPTY_KPI,
    clinics: [], staff: [],
    salesTrend: [], visitTrend: [], newPatientTrend: [],
    alerts: [],
  }
}

export function useDashboard(params: {
  period: PeriodFilter
  clinicId: string
  customRange?: DateRange
}) {
  const { period, clinicId } = params
  const from = params.customRange?.from
  const to = params.customRange?.to

  const [data, setData] = useState<DashboardData>(emptyData)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setLoading(true)
    setError(null)

    apiPost<DashboardData>('/api/v1/analytics/dashboard', {
      period,
      clinicId: clinicId === 'all' ? undefined : clinicId,
      from: from ?? undefined,
      to: to ?? undefined,
    }, { authenticated: true, signal: controller.signal })
      .then((res) => setData(res))
      .catch((err) => {
        if (controller.signal.aborted) return
        setData(emptyData())
        setError(err instanceof ApiError
          ? `${err.message}（${err.supportCode}）`
          : '集計を取得できませんでした。')
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })

    return () => controller.abort()
  }, [period, clinicId, from, to])

  return { data, loading, error }
}

/** 院別ダッシュボードの追加集計 */
export function useClinicDetail(params: {
  clinicId: string
  period: PeriodFilter
  customRange?: DateRange
}) {
  const { clinicId, period } = params
  const from = params.customRange?.from
  const to = params.customRange?.to
  const [detail, setDetail] = useState<{
    menuRanking: Array<{ name: string; count: number; revenue: number }>
    monthlyTrend: Array<{ label: string; sales: number; visits: number }>
  }>({ menuRanking: [], monthlyTrend: [] })

  useEffect(() => {
    if (!clinicId) { setDetail({ menuRanking: [], monthlyTrend: [] }); return }
    const controller = new AbortController()
    apiPost<typeof detail>('/api/v1/analytics/clinic', {
      clinicId, period, from: from ?? undefined, to: to ?? undefined,
    }, { authenticated: true, signal: controller.signal })
      .then(setDetail)
      .catch(() => { if (!controller.signal.aborted) setDetail({ menuRanking: [], monthlyTrend: [] }) })
    return () => controller.abort()
  }, [clinicId, period, from, to])

  return detail
}

/** スタッフ別ダッシュボードの直近6か月の推移 */
export function useStaffDetail(staffId: string) {
  const [monthHistory, setMonthHistory] = useState<
    Array<{ label: string; visits: number; cancelled: number }>
  >([])

  useEffect(() => {
    if (!staffId) { setMonthHistory([]); return }
    const controller = new AbortController()
    apiPost<{ monthHistory: typeof monthHistory }>('/api/v1/analytics/staff', { staffId },
      { authenticated: true, signal: controller.signal })
      .then((res) => setMonthHistory(res.monthHistory))
      .catch(() => { if (!controller.signal.aborted) setMonthHistory([]) })
    return () => controller.abort()
  }, [staffId])

  return monthHistory
}
