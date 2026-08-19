'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { apiPost, ApiError } from '@/lib/api-client'
import type { Reservation } from '@/types/clinic'

/**
 * 管理画面の予約をサーバーから取得する。
 *
 * 以前は全予約をブラウザに読み込んでいた。他院の予約が端末に残るうえ、
 * 件数が増えると取りこぼしが起きるため、絞り込みをサーバーへ移した。
 * カレンダーは日付範囲、一覧は検索条件で引く。
 */

export type ReservationDto = {
  id: string
  clinicId: string
  staffId: string | null
  menuId: string | null
  patientId: string | null
  patientName: string
  patientPhone: string | null
  referralName: string | null
  startAt: string
  endAt: string
  status: Reservation['status']
  memo: string | null
  createdAt: string
  updatedAt: string
}

type Response = {
  reservations: ReservationDto[]
  page: number
  perPage: number
  total: number
  hasNext: boolean
}

/** API(camelCase) → 画面で使っている型(snake_case) */
export function toReservation(d: ReservationDto): Reservation {
  return {
    id: d.id,
    clinic_id: d.clinicId,
    staff_id: d.staffId,
    menu_id: d.menuId,
    patient_id: d.patientId,
    patient_name: d.patientName,
    patient_phone: d.patientPhone,
    referral_name: d.referralName,
    start_at: d.startAt,
    end_at: d.endAt,
    status: d.status,
    memo: d.memo,
    created_at: d.createdAt,
    updated_at: d.updatedAt,
  }
}

/** 画面のフォーム型 → API の入力形 */
export function toApiInput(form: Partial<Reservation>) {
  const out: Record<string, unknown> = {}
  if (form.clinic_id !== undefined) out.clinicId = form.clinic_id
  if (form.staff_id !== undefined) out.staffId = form.staff_id
  if (form.menu_id !== undefined) out.menuId = form.menu_id
  if (form.patient_id !== undefined) out.patientId = form.patient_id
  if (form.patient_name !== undefined) out.patientName = form.patient_name
  if (form.patient_phone !== undefined) out.patientPhone = form.patient_phone ?? ''
  if (form.referral_name !== undefined) out.referralName = form.referral_name ?? ''
  if (form.start_at !== undefined) out.startAt = form.start_at
  if (form.end_at !== undefined) out.endAt = form.end_at
  if (form.status !== undefined) out.status = form.status
  if (form.memo !== undefined) out.memo = form.memo ?? ''
  return out
}

export type ReservationFilters = {
  clinicId: string | null
  staffId?: string | null
  /** 患者詳細から、その患者の予約だけを引くときに使う */
  patientId?: string | null
  status: Reservation['status'] | null
  search: string
  /** yyyy-MM-dd */
  from?: string
  to?: string
  perPage?: number
}

export function useReservationList(filters: ReservationFilters) {
  const [items, setItems] = useState<Reservation[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [hasNext, setHasNext] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)
  const abortRef = useRef<AbortController | null>(null)

  const { clinicId, staffId, patientId, status, search, from, to } = filters
  const perPage = filters.perPage ?? 100

  useEffect(() => { setPage(1) }, [clinicId, staffId, patientId, status, search, from, to])

  useEffect(() => {
    const delay = search ? 300 : 0
    const timer = setTimeout(() => {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller
      setLoading(true)
      setError(null)

      apiPost<Response>('/api/v1/reservations/list', {
        clinicId: clinicId ?? undefined,
        staffId: staffId ?? undefined,
        patientId: patientId ?? undefined,
        status: status ?? undefined,
        search: search || undefined,
        from: from || undefined,
        to: to || undefined,
        page,
        perPage,
      }, { authenticated: true, signal: controller.signal })
        .then((res) => {
          setItems(res.reservations.map(toReservation))
          setTotal(res.total)
          setHasNext(res.hasNext)
        })
        .catch((err) => {
          if (controller.signal.aborted) return
          setItems([])
          setError(err instanceof ApiError ? `${err.message}（${err.supportCode}）` : '予約を取得できませんでした。')
        })
        .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    }, delay)

    return () => clearTimeout(timer)
  }, [clinicId, staffId, patientId, status, search, from, to, page, perPage, reloadToken])

  const reload = useCallback(() => setReloadToken((n) => n + 1), [])

  return { items, total, page, setPage, hasNext, loading, error, reload, perPage }
}
