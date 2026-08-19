'use client'

import { useEffect, useRef, useState } from 'react'
import { apiPost, ApiError } from '@/lib/api-client'
import type { PaymentMethod } from '@/types/accounting'

/**
 * 日計表をサーバーから取得する。
 *
 * 以前はブラウザが全会計を読み込んでから当日分を絞って集計していた。
 * 集計はサーバーで完結させ、画面には結果だけを渡す。
 */

export type DailyReport = {
  date: string
  clinicId: string | null
  kpi: { totalRevenue: number; count: number; avgPerPatient: number; cashTotal: number }
  paymentBreakdown: Array<{ method: PaymentMethod; amount: number; count: number }>
  staffBreakdown: Array<{ staffId: string | null; name: string; count: number; revenue: number }>
  hourly: Array<{ hour: number; count: number }>
  transactions: Array<{
    id: string
    invoiceNumber: string
    patientName: string
    staffId: string | null
    staffName: string | null
    items: string[]
    paymentMethod: PaymentMethod
    totalAmount: number
    createdAt: string
  }>
}

const EMPTY: DailyReport = {
  date: '',
  clinicId: null,
  kpi: { totalRevenue: 0, count: 0, avgPerPatient: 0, cashTotal: 0 },
  paymentBreakdown: [],
  staffBreakdown: [],
  hourly: [],
  transactions: [],
}

export function useDailyReport(params: { date: string; clinicId: string | null }) {
  const { date, clinicId } = params
  const [report, setReport] = useState<DailyReport>(EMPTY)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setLoading(true)
    setError(null)

    apiPost<DailyReport>('/api/v1/reports/daily', { date, clinicId: clinicId ?? undefined },
      { authenticated: true, signal: controller.signal })
      .then((res) => setReport(res))
      .catch((err) => {
        if (controller.signal.aborted) return
        setReport({ ...EMPTY, date })
        setError(err instanceof ApiError ? `${err.message}（${err.supportCode}）` : '日計を取得できませんでした。')
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })

    return () => controller.abort()
  }, [date, clinicId])

  return { report, loading, error }
}
