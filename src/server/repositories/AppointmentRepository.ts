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
  created_at: string
  updated_at: string
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

export const appointmentRepository = {
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
    const { data, error } = await db().from('reservations').select('*').eq('id', id).maybeSingle()
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
