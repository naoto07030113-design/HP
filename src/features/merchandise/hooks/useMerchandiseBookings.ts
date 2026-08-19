'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { apiPost, ApiError } from '@/lib/api-client'
import type { MerchandiseBookingStatus } from '@/types/merchandise'

/**
 * 物販予約をサーバーから取得する。
 *
 * 予約には患者の氏名と電話番号が入る。以前はブラウザが全件を取得していたため、
 * 他院の予約者情報まで端末に載っていた。
 */

export type MerchandiseBookingDto = {
  id: string
  merchandiseId: string
  merchandiseName: string | null
  clinicId: string
  patientName: string
  patientPhone: string | null
  quantity: number
  status: MerchandiseBookingStatus
  notes: string | null
  bookedAt: string
  price: number | null
}

type Response = {
  bookings: MerchandiseBookingDto[]
  page: number
  perPage: number
  total: number
  hasNext: boolean
}

export function useMerchandiseBookings(params: { clinicId: string | null }) {
  const { clinicId } = params
  const [bookings, setBookings] = useState<MerchandiseBookingDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setLoading(true)
    setError(null)

    apiPost<Response>('/api/v1/merchandise/bookings/list',
      { clinicId: clinicId ?? undefined, page: 1, perPage: 200 },
      { authenticated: true, signal: controller.signal })
      .then((res) => setBookings(res.bookings))
      .catch((err) => {
        if (controller.signal.aborted) return
        setBookings([])
        setError(err instanceof ApiError ? `${err.message}（${err.supportCode}）` : '物販予約を取得できませんでした。')
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })

    return () => controller.abort()
  }, [clinicId, reloadToken])

  const reload = useCallback(() => setReloadToken((n) => n + 1), [])

  return { bookings, loading, error, reload }
}
