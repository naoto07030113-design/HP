'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { apiPost, ApiError } from '@/lib/api-client'
import type { Shift, ShiftBlock, ShiftFormData } from '@/types/clinic'

/**
 * シフト表をサーバーから取得する。
 *
 * 以前はブラウザが shifts を全件読み込んでいたため、他院のシフトが端末に載り、
 * 件数が増えると静かに欠落した。表示中の期間だけをサーバーから引く。
 */

export type ShiftDto = {
  id: string
  staffId: string
  clinicId: string
  workDate: string
  shiftType: Shift['shift_type']
  startTime: string
  endTime: string
  breakStart: string | null
  breakEnd: string | null
  createdAt: string
  updatedAt: string
}

export type ShiftBlockDto = {
  id: string
  staffId: string
  blockDate: string
  startTime: string
  endTime: string
  reason: string | null
}

type Response = {
  shifts: ShiftDto[]
  blocks: ShiftBlockDto[]
  from: string
  to: string
}

/** API(camelCase) → 画面で使っている型(snake_case) */
export function toShift(d: ShiftDto): Shift {
  return {
    id: d.id,
    staff_id: d.staffId,
    clinic_id: d.clinicId,
    work_date: d.workDate,
    shift_type: d.shiftType,
    start_time: d.startTime,
    end_time: d.endTime,
    break_start: d.breakStart,
    break_end: d.breakEnd,
    created_at: d.createdAt,
    updated_at: d.updatedAt,
  }
}

export function toShiftBlock(d: ShiftBlockDto): ShiftBlock {
  return {
    id: d.id,
    staff_id: d.staffId,
    block_date: d.blockDate,
    start_time: d.startTime,
    end_time: d.endTime,
    reason: d.reason,
    created_at: '',
  }
}

/** 画面のフォーム型 → API の入力形 */
export function toApiShift(form: ShiftFormData) {
  return {
    staffId: form.staff_id,
    clinicId: form.clinic_id,
    workDate: form.work_date,
    shiftType: form.shift_type ?? 'work',
    // 休みの日は画面側が時刻を空にして送ってくる。API は必ず時刻を持たせるため既定値で埋める
    startTime: (form.start_time || '09:00').slice(0, 5),
    endTime: (form.end_time || '18:00').slice(0, 5),
    breakStart: form.break_start ? form.break_start.slice(0, 5) : null,
    breakEnd: form.break_end ? form.break_end.slice(0, 5) : null,
  }
}

export function useShiftList(params: { clinicId: string; from: string; to: string }) {
  const { clinicId, from, to } = params
  const [shifts, setShifts] = useState<Shift[]>([])
  const [blocks, setBlocks] = useState<ShiftBlock[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!clinicId) { setShifts([]); setBlocks([]); setLoading(false); return }

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setLoading(true)
    setError(null)

    apiPost<Response>('/api/v1/shifts/list', { clinicId, from, to },
      { authenticated: true, signal: controller.signal })
      .then((res) => {
        setShifts(res.shifts.map(toShift))
        setBlocks(res.blocks.map(toShiftBlock))
      })
      .catch((err) => {
        if (controller.signal.aborted) return
        setShifts([])
        setBlocks([])
        setError(err instanceof ApiError ? `${err.message}（${err.supportCode}）` : 'シフトを取得できませんでした。')
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })

    return () => controller.abort()
  }, [clinicId, from, to, reloadToken])

  const reload = useCallback(() => setReloadToken((n) => n + 1), [])

  return { shifts, blocks, loading, error, reload }
}
