/**
 * 予約テーブルへのアクセス。
 *
 * DB に触るのはこの層だけ。Service から直接 SQL を書かない。
 * ここでは service_role クライアントを使うため RLS を迂回する。
 * したがって「誰に何を見せるか」の判断は必ず呼び出し元（Service / permissions）で
 * 済ませてから来ることを前提とする。
 */

import { createServiceClient } from '@/lib/supabase'
import { AppError, ERROR_CODES } from '../errors/AppError'

export type ReservationRow = {
  id: string
  clinic_id: string
  staff_id: string | null
  menu_id: string | null
  patient_id: string | null
  patient_name: string
  patient_phone: string | null
  start_at: string
  end_at: string
  status: 'confirmed' | 'visited' | 'cancelled' | 'no_show'
  memo: string | null
  referral_name: string | null
  created_at: string
  updated_at: string
  created_by?: string | null
  updated_by?: string | null
  deleted_at?: string | null
  deleted_by?: string | null
}

export type AdminReservationListQuery = {
  /** null なら全院（admin のみ）。値があればその院に限定する */
  clinicScope: string | null
  clinicFilter?: string | null
  staffId?: string | null
  patientId?: string | null
  status?: string | null
  search?: string
  from?: string
  to?: string
  page: number
  perPage: number
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

/** 電話番号の表記ゆれを吸収した比較用の形にそろえる */
export function normalizePhoneForMatch(value: string | null | undefined): string {
  if (!value) return ''
  return value
    .replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/[^0-9]/g, '')
}

/** 一覧と件数で同じ絞り込みを使う */
function applyAdminFilters<T extends { eq: Function; is: Function; gte: Function; lt: Function; or: Function }>(
  builder: T, q: AdminReservationListQuery,
): T {
  let b = builder.is('deleted_at', null) as T
  if (q.clinicScope) b = b.eq('clinic_id', q.clinicScope) as T
  else if (q.clinicFilter) b = b.eq('clinic_id', q.clinicFilter) as T
  if (q.staffId) b = b.eq('staff_id', q.staffId) as T
  if (q.patientId) b = b.eq('patient_id', q.patientId) as T
  if (q.status) b = b.eq('status', q.status) as T
  if (q.from) b = b.gte('start_at', `${q.from}T00:00:00+09:00`) as T
  if (q.to) b = b.lt('start_at', `${q.to}T23:59:59+09:00`) as T
  if (q.search) {
    const safe = q.search.replace(/[%_]/g, (c) => `\\${c}`)
    b = b.or(`patient_name.ilike.%${safe}%,patient_phone.ilike.%${safe}%`) as T
  }
  return b
}

export const appointmentRepository = {
  /** 管理画面向けの一覧。所属院の外は返さない */
  async listForAdmin(query: AdminReservationListQuery): Promise<{ rows: ReservationRow[]; total: number }> {
    const from = (query.page - 1) * query.perPage

    const countQuery = applyAdminFilters(
      db().from('reservations').select('id', { count: 'exact', head: true }) as never, query,
    ) as unknown as PromiseLike<{ count: number | null; error: { message: string } | null }>

    const rowsQuery = applyAdminFilters(
      db().from('reservations').select('*') as never, query,
    ) as unknown as { order: Function }

    const [countRes, rowsRes] = await Promise.all([
      countQuery,
      (rowsQuery.order('start_at', { ascending: false }) as { range: Function })
        .range(from, from + query.perPage - 1),
    ])

    wrap(countRes.error, '予約件数の取得')
    wrap((rowsRes as { error: { message: string } | null }).error, '予約一覧の取得')

    return {
      rows: ((rowsRes as { data: ReservationRow[] | null }).data ?? []) as ReservationRow[],
      total: countRes.count ?? 0,
    }
  },

  async insert(values: Record<string, unknown>, actorId: string): Promise<ReservationRow> {
    const now = new Date().toISOString()
    const { data, error } = await db()
      .from('reservations')
      .insert({ ...values, created_by: actorId, updated_by: actorId, created_at: now, updated_at: now })
      .select('*')
      .single()
    wrap(error, '予約の作成')
    return data as ReservationRow
  },

  async updateFields(id: string, values: Record<string, unknown>, actorId: string): Promise<ReservationRow> {
    const { data, error } = await db()
      .from('reservations')
      .update({ ...values, updated_by: actorId, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single()
    wrap(error, '予約の更新')
    return data as ReservationRow
  },

  async softDelete(id: string, actorId: string): Promise<void> {
    const { error } = await db()
      .from('reservations')
      .update({ deleted_at: new Date().toISOString(), deleted_by: actorId })
      .eq('id', id)
    wrap(error, '予約の削除')
  },

  /**
   * 電話番号に一致する今後の予約だけを返す。
   * 以前はブラウザが全予約を取得して絞り込んでいたため、
   * 他の患者の氏名と電話番号が通信に流れていた。ここで必ず絞ってから返す。
   */
  async findUpcomingByPhone(phone: string, now: Date): Promise<ReservationRow[]> {
    const target = normalizePhoneForMatch(phone)
    if (target.length === 0) return []

    const { data, error } = await db()
      .from('reservations')
      .select('*')
      .eq('status', 'confirmed')
      .is('deleted_at', null)
      .gte('start_at', now.toISOString())
      .not('patient_phone', 'is', null)
      .order('start_at')
      .limit(500)
    wrap(error, '予約の照会')

    // 表記ゆれ吸収のため最終比較はサーバー側で行う（結果はサーバー内に留まる）
    return (data ?? []).filter(
      (r) => normalizePhoneForMatch((r as ReservationRow).patient_phone) === target,
    ) as ReservationRow[]
  },

  async findById(id: string): Promise<ReservationRow | null> {
    const { data, error } = await db()
      .from('reservations').select('*').eq('id', id).is('deleted_at', null).maybeSingle()
    wrap(error, '予約の取得')
    return (data as ReservationRow | null) ?? null
  },

  /** 指定スタッフ・時間帯に重なる予約があるか（自分自身は除外） */
  async findOverlapping(
    clinicId: string,
    staffId: string | null,
    startAt: string,
    endAt: string,
    excludeId: string,
  ): Promise<ReservationRow[]> {
    let query = db()
      .from('reservations')
      .select('*')
      .eq('clinic_id', clinicId)
      .is('deleted_at', null)
      .in('status', ['confirmed', 'visited'])
      .neq('id', excludeId)
      .lt('start_at', endAt)
      .gt('end_at', startAt)
    if (staffId) query = query.eq('staff_id', staffId)

    const { data, error } = await query
    wrap(error, '予約重複の確認')
    return (data ?? []) as ReservationRow[]
  },

  async updateStatus(id: string, status: ReservationRow['status']): Promise<ReservationRow> {
    const { data, error } = await db()
      .from('reservations')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single()
    wrap(error, '予約状態の更新')
    return data as ReservationRow
  },

  async updateSchedule(id: string, startAt: string, endAt: string): Promise<ReservationRow> {
    const { data, error } = await db()
      .from('reservations')
      .update({ start_at: startAt, end_at: endAt, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single()
    wrap(error, '予約日時の更新')
    return data as ReservationRow
  },
}
