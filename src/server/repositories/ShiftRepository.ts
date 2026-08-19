/**
 * 勤務シフトへのアクセス。
 *
 * シフトは (staff_id, work_date) が一意。同じ日を二重に作らないよう upsert する。
 * 予約不可ブロック（shift_blocks）も同じ層で扱う。
 */

import { createServiceClient } from '@/lib/supabase'
import { AppError, ERROR_CODES } from '../errors/AppError'

export type ShiftRow = {
  id: string
  staff_id: string
  clinic_id: string
  work_date: string
  shift_type: 'work' | 'off' | 'paid' | 'sick' | 'special'
  start_time: string
  end_time: string
  break_start: string | null
  break_end: string | null
  created_at: string
  updated_at: string
}

export type ShiftBlockRow = {
  id: string
  staff_id: string
  block_date: string
  start_time: string
  end_time: string
  reason: string | null
  created_at: string
}

function db() {
  return createServiceClient()
}

function wrap(error: { message: string; code?: string } | null, what: string): void {
  if (!error) return
  throw new AppError(ERROR_CODES.DEPENDENCY_UNAVAILABLE, {
    detail: `${what} に失敗: ${error.message}${error.code ? ` (code=${error.code})` : ''}`,
  })
}

export const shiftRepository = {
  /** 期間で引く。シフト表は必ず日付範囲が決まっているため全件取得は不要 */
  async listByRange(query: {
    clinicScope: string | null
    clinicFilter?: string | null
    staffId?: string | null
    from: string
    to: string
  }): Promise<{ shifts: ShiftRow[]; blocks: ShiftBlockRow[] }> {
    let q = db().from('shifts').select('*').gte('work_date', query.from).lte('work_date', query.to)
    if (query.clinicScope) q = q.eq('clinic_id', query.clinicScope)
    else if (query.clinicFilter) q = q.eq('clinic_id', query.clinicFilter)
    if (query.staffId) q = q.eq('staff_id', query.staffId)

    let bq = db().from('shift_blocks').select('*').gte('block_date', query.from).lte('block_date', query.to)
    if (query.staffId) bq = bq.eq('staff_id', query.staffId)

    const [shiftRes, blockRes] = await Promise.all([q.order('work_date'), bq])
    wrap(shiftRes.error, 'シフトの取得')
    wrap(blockRes.error, '予約不可ブロックの取得')

    return {
      shifts: (shiftRes.data ?? []) as ShiftRow[],
      blocks: (blockRes.data ?? []) as ShiftBlockRow[],
    }
  },

  async findOne(staffId: string, workDate: string): Promise<ShiftRow | null> {
    const { data, error } = await db()
      .from('shifts').select('*').eq('staff_id', staffId).eq('work_date', workDate).maybeSingle()
    wrap(error, 'シフトの取得')
    return (data as ShiftRow | null) ?? null
  },

  /** (staff_id, work_date) が一意なので upsert で入れ替える */
  async upsertMany(rows: Array<Record<string, unknown>>): Promise<ShiftRow[]> {
    const now = new Date().toISOString()
    const { data, error } = await db()
      .from('shifts')
      .upsert(rows.map((r) => ({ ...r, updated_at: now })), { onConflict: 'staff_id,work_date' })
      .select('*')
    wrap(error, 'シフトの保存')
    return (data ?? []) as ShiftRow[]
  },

  async remove(staffId: string, workDate: string): Promise<void> {
    const { error } = await db()
      .from('shifts').delete().eq('staff_id', staffId).eq('work_date', workDate)
    wrap(error, 'シフトの削除')
  },

  /** 対象スタッフが所属する院を引く（院スコープの判定に使う） */
  async staffClinicIds(staffIds: string[]): Promise<Map<string, string>> {
    if (staffIds.length === 0) return new Map()
    const { data, error } = await db().from('staff').select('id,clinic_id').in('id', staffIds)
    wrap(error, 'スタッフ所属院の取得')
    return new Map(((data ?? []) as Array<{ id: string; clinic_id: string }>).map((s) => [s.id, s.clinic_id]))
  },
}
