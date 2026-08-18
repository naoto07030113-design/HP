/**
 * 空き時間の算出。
 *
 * 患者側には「どの枠が空いているか」だけを返し、予約そのものは渡さない。
 * 以前はブラウザが全予約を受け取って空きを計算していたため、
 * 空き枠を知るために他の患者の氏名と電話番号まで配信されていた。
 *
 * 営業時間・休診・担当者のシフト・予約の重なりは、すべてここで判定する。
 */

import { createServiceClient } from '@/lib/supabase'
import { AppError, ERROR_CODES } from '../errors/AppError'

const SLOT_STEP_MIN = 30

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}
function toTime(min: number): string {
  return `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`
}

type ClinicRow = { id: string; name: string; open_time: string; close_time: string; is_active: boolean }
type MenuRow = { id: string; clinic_id: string; duration_min: number; is_active: boolean }
type ClosedDayRow = {
  clinic_id: string | null; closed_date: string | null; repeat_type: string
  day_of_week: number | null; close_type: string; close_from: string | null; close_to: string | null
}

/** その日の分単位の時刻が休診帯に入っているか */
function closedRanges(rows: ClosedDayRow[], date: string, dayOfWeek: number): { allDay: boolean; ranges: Array<[number, number]> } {
  const ranges: Array<[number, number]> = []
  let allDay = false

  for (const r of rows) {
    const applies =
      (r.repeat_type === 'weekly' && r.day_of_week === dayOfWeek) ||
      (r.repeat_type === 'none' && r.closed_date === date)
    if (!applies) continue

    if (r.close_type === 'all_day') { allDay = true; continue }
    if (r.close_type === 'morning') { ranges.push([0, 12 * 60]); continue }
    if (r.close_type === 'afternoon') { ranges.push([12 * 60, 24 * 60]); continue }
    if (r.close_type === 'time_range' && r.close_from && r.close_to) {
      ranges.push([toMinutes(r.close_from.slice(0, 5)), toMinutes(r.close_to.slice(0, 5))])
    }
  }
  return { allDay, ranges }
}

export type AvailabilityQuery = {
  clinicId: string
  /** yyyy-MM-dd */
  date: string
  menuId: string
  staffId?: string | null
  /** 変更時に自分自身の予約を除外するため */
  excludeReservationId?: string | null
}

export const availabilityService = {
  async listOpenSlots(query: AvailabilityQuery): Promise<string[]> {
    const supabase = createServiceClient()
    const { clinicId, date, menuId, staffId, excludeReservationId } = query

    const [clinicRes, menuRes] = await Promise.all([
      supabase.from('clinics').select('id,name,open_time,close_time,is_active').eq('id', clinicId).maybeSingle(),
      supabase.from('menus').select('id,clinic_id,duration_min,is_active').eq('id', menuId).maybeSingle(),
    ])

    const clinic = clinicRes.data as ClinicRow | null
    const menu = menuRes.data as MenuRow | null

    if (!clinic || !clinic.is_active) {
      throw new AppError(ERROR_CODES.NOT_FOUND, {
        message: '院が見つかりませんでした。', detail: `clinicId=${clinicId}`,
      })
    }
    if (!menu || !menu.is_active || menu.clinic_id !== clinicId) {
      throw new AppError(ERROR_CODES.NOT_FOUND, {
        message: 'メニューが見つかりませんでした。', detail: `menuId=${menuId} clinicId=${clinicId}`,
      })
    }

    const dayOfWeek = new Date(`${date}T00:00:00+09:00`).getDay()

    const [closedRes, shiftRes, blockRes, resvRes] = await Promise.all([
      supabase.from('closed_days').select('*').or(`clinic_id.eq.${clinicId},clinic_id.is.null`),
      staffId
        ? supabase.from('shifts').select('*').eq('staff_id', staffId).eq('work_date', date).maybeSingle()
        : Promise.resolve({ data: null }),
      staffId
        ? supabase.from('shift_blocks').select('*').eq('staff_id', staffId).eq('block_date', date)
        : Promise.resolve({ data: [] }),
      supabase
        .from('reservations')
        .select('id,staff_id,start_at,end_at,status')
        .eq('clinic_id', clinicId)
        .in('status', ['confirmed', 'visited'])
        .gte('start_at', `${date}T00:00:00+09:00`)
        .lt('start_at', `${date}T23:59:59+09:00`),
    ])

    const closure = closedRanges((closedRes.data ?? []) as ClosedDayRow[], date, dayOfWeek)
    if (closure.allDay) return []

    const shift = shiftRes.data as {
      shift_type: string; start_time: string; end_time: string
      break_start: string | null; break_end: string | null
    } | null
    // 指名ありでその日が勤務でないなら空きなし（シフト未登録の日は院の営業時間で受け付ける）
    if (staffId && shift && shift.shift_type !== 'work') return []

    const blocks = ((blockRes.data ?? []) as Array<{ start_time: string; end_time: string }>).map(
      (b) => [toMinutes(b.start_time.slice(0, 5)), toMinutes(b.end_time.slice(0, 5))] as [number, number],
    )

    // 担当者の休憩時間も予約不可として扱う
    if (staffId && shift?.shift_type === 'work' && shift.break_start && shift.break_end) {
      blocks.push([toMinutes(shift.break_start.slice(0, 5)), toMinutes(shift.break_end.slice(0, 5))])
    }

    const taken = ((resvRes.data ?? []) as Array<{
      id: string; staff_id: string | null; start_at: string; end_at: string
    }>)
      .filter((r) => r.id !== excludeReservationId)
      .filter((r) => (staffId ? r.staff_id === staffId : true))
      .map((r) => {
        const s = new Date(r.start_at)
        const e = new Date(r.end_at)
        // JST での分に直す（DBは timestamptz）
        const toJstMin = (d: Date) =>
          (d.getUTCHours() + 9) % 24 * 60 + d.getUTCMinutes()
        return [toJstMin(s), toJstMin(e)] as [number, number]
      })

    const openMin = toMinutes(clinic.open_time)
    const closeMin = toMinutes(clinic.close_time)
    const shiftStart = staffId && shift?.shift_type === 'work' ? toMinutes(shift.start_time) : openMin
    const shiftEnd = staffId && shift?.shift_type === 'work' ? toMinutes(shift.end_time) : closeMin

    const slots: string[] = []
    for (let start = openMin; start + menu.duration_min <= closeMin; start += SLOT_STEP_MIN) {
      const end = start + menu.duration_min
      const overlaps = (ranges: Array<[number, number]>) =>
        ranges.some(([rs, re]) => start < re && end > rs)

      if (start < shiftStart || end > shiftEnd) continue
      if (overlaps(closure.ranges)) continue
      if (overlaps(blocks)) continue
      if (overlaps(taken)) continue
      slots.push(toTime(start))
    }
    return slots
  },
}
