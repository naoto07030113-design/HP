/**
 * 物販と物販予約へのアクセス。
 *
 * 物販予約には患者の氏名と電話番号が入る。
 * 以前はブラウザが全件を取得していたため、他院の予約者情報まで端末に載っていた。
 */

import { createServiceClient } from '@/lib/supabase'
import { AppError, ERROR_CODES } from '../errors/AppError'

export type MerchandiseRow = {
  id: string
  clinic_id: string
  name: string
  price: number
  is_active: boolean
}

export type MerchandiseBookingRow = {
  id: string
  merchandise_id: string
  clinic_id: string
  patient_name: string
  patient_phone: string | null
  patient_id: string | null
  quantity: number
  status: 'pending' | 'confirmed' | 'cancelled' | 'delivered'
  notes: string | null
  booked_at: string
  created_at: string
  updated_at: string
  merchandise?: MerchandiseRow
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

export const merchandiseRepository = {
  async findItem(id: string): Promise<MerchandiseRow | null> {
    const { data, error } = await db()
      .from('merchandise').select('id,clinic_id,name,price,is_active').eq('id', id).maybeSingle()
    wrap(error, '物販の取得')
    return (data as MerchandiseRow | null) ?? null
  },

  async listBookings(query: {
    clinicScope: string | null
    clinicFilter: string | null
    status: string | null
    page: number
    perPage: number
  }): Promise<{ rows: MerchandiseBookingRow[]; total: number }> {
    const clinic = query.clinicScope ?? query.clinicFilter
    const from = (query.page - 1) * query.perPage

    const build = (select: string, head = false) => {
      let q = db().from('merchandise_bookings')
        .select(select, head ? { count: 'exact', head: true } : undefined) as never as {
          eq: Function; order: Function; range: Function
        }
      if (clinic) q = q.eq('clinic_id', clinic)
      if (query.status) q = q.eq('status', query.status)
      return q
    }

    const [countRes, rowsRes] = await Promise.all([
      build('id', true) as unknown as PromiseLike<{ count: number | null; error: { message: string } | null }>,
      build('*, merchandise(*)')
        .order('booked_at', { ascending: false })
        .range(from, from + query.perPage - 1),
    ])

    wrap(countRes.error, '物販予約の件数取得')
    wrap((rowsRes as { error: { message: string } | null }).error, '物販予約の取得')

    return {
      rows: ((rowsRes as { data: MerchandiseBookingRow[] | null }).data ?? []) as MerchandiseBookingRow[],
      total: countRes.count ?? 0,
    }
  },

  async findBooking(id: string): Promise<MerchandiseBookingRow | null> {
    const { data, error } = await db()
      .from('merchandise_bookings').select('*, merchandise(*)').eq('id', id).maybeSingle()
    wrap(error, '物販予約の取得')
    return (data as MerchandiseBookingRow | null) ?? null
  },

  async insertBooking(values: Record<string, unknown>): Promise<string> {
    const id = crypto.randomUUID()
    const now = new Date().toISOString()
    const { error } = await db()
      .from('merchandise_bookings')
      .insert({ ...values, id, booked_at: now, created_at: now, updated_at: now })
    wrap(error, '物販予約の登録')
    return id
  },

  async updateBookingStatus(id: string, status: string): Promise<void> {
    const { error } = await db()
      .from('merchandise_bookings')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
    wrap(error, '物販予約の状態更新')
  },

  async deleteBooking(id: string): Promise<void> {
    const { error } = await db().from('merchandise_bookings').delete().eq('id', id)
    wrap(error, '物販予約の削除')
  },
}
