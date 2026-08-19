/**
 * 集計用の読み取り。
 *
 * 一覧用のリポジトリと違い、ここは「集計に必要な列だけを、期間で絞って」引く。
 * 画面に出すのは集計後の数値なので、明細をブラウザへ送らなくて済む。
 */

import { createServiceClient } from '@/lib/supabase'
import { AppError, ERROR_CODES } from '../errors/AppError'
import type { InvoiceRow } from './InvoiceRepository'

function db() {
  return createServiceClient()
}

function wrap(error: { message: string; code?: string } | null, what: string): void {
  if (!error) return
  throw new AppError(ERROR_CODES.DEPENDENCY_UNAVAILABLE, {
    detail: `${what} に失敗: ${error.message}${error.code ? ` (code=${error.code})` : ''}`,
  })
}

/**
 * 上限（既定1000行）で静かに欠けないよう、必要な列だけをページで読み切る。
 * 集計に使うのはサーバー内だけで、ブラウザへは結果しか返さない。
 */
async function readAll<T>(
  build: () => { range: Function },
  what: string,
  limit = 20_000,
): Promise<T[]> {
  const PAGE = 1000
  const rows: T[] = []
  for (let from = 0; from < limit; from += PAGE) {
    const { data, error } = await (build().range(from, from + PAGE - 1) as PromiseLike<{
      data: T[] | null; error: { message: string } | null
    }>)
    wrap(error, what)
    const chunk = data ?? []
    rows.push(...chunk)
    if (chunk.length < PAGE) break
  }
  return rows
}

export type AnalyticsReservation = {
  id: string
  status: string
  start_at: string
  clinic_id: string
  staff_id: string | null
  patient_id: string | null
  patient_name: string
}

export type AnalyticsInvoice = {
  visit_date: string
  clinic_id: string
  staff_id: string | null
  total_amount: number
  payment_method: 'cash' | 'card' | 'paypay' | 'line_pay' | 'insurance' | 'other'
}

export type AnalyticsPatient = {
  id: string
  clinic_id: string
  name: string
  name_kana: string | null
  phone: string | null
  first_visit_date: string | null
  referral_source: string | null
  is_active: boolean
}

export const reportRepository = {
  /** 指定日の支払済み会計。明細も一緒に引く */
  async paidInvoicesForDate(date: string, clinicId: string | null): Promise<InvoiceRow[]> {
    let q = db()
      .from('invoices')
      .select('*, invoice_items(*)')
      .is('deleted_at', null)
      .eq('status', 'paid')
      .eq('visit_date', date)
    if (clinicId) q = q.eq('clinic_id', clinicId)

    const { data, error } = await q.order('created_at')
    wrap(error, '日計の取得')
    return (data ?? []) as InvoiceRow[]
  },

  /** 時間帯別の集計に使う。会計に紐づく予約の開始時刻だけを引く */
  async reservationStartTimes(ids: string[]): Promise<Map<string, string>> {
    if (ids.length === 0) return new Map()
    const { data, error } = await db()
      .from('reservations').select('id,start_at').in('id', ids)
    wrap(error, '予約時刻の取得')
    return new Map(((data ?? []) as Array<{ id: string; start_at: string }>).map((r) => [r.id, r.start_at]))
  },

  /** 集計に使う予約。期間で絞り、必要な列だけを引く */
  async analyticsReservations(from: string, to: string, clinicId: string | null): Promise<AnalyticsReservation[]> {
    return readAll<AnalyticsReservation>(() => {
      let q = db()
        .from('reservations')
        .select('id,status,start_at,clinic_id,staff_id,patient_id,patient_name')
        .is('deleted_at', null)
        .gte('start_at', `${from}T00:00:00+09:00`)
        .lt('start_at', `${to}T23:59:59+09:00`)
      if (clinicId) q = q.eq('clinic_id', clinicId)
      return q.order('start_at') as unknown as { range: Function }
    }, '集計用の予約取得')
  },

  /** 集計に使う支払済み会計 */
  async analyticsInvoices(from: string, to: string, clinicId: string | null): Promise<AnalyticsInvoice[]> {
    return readAll<AnalyticsInvoice>(() => {
      let q = db()
        .from('invoices')
        .select('visit_date,clinic_id,staff_id,total_amount,payment_method')
        .is('deleted_at', null)
        .eq('status', 'paid')
        .gte('visit_date', from)
        .lte('visit_date', to)
      if (clinicId) q = q.eq('clinic_id', clinicId)
      return q.order('visit_date') as unknown as { range: Function }
    }, '集計用の会計取得')
  },

  /** 新患数・未再診数の判定に使う。氏名などは読まない */
  async analyticsPatients(clinicId: string | null): Promise<AnalyticsPatient[]> {
    return readAll<AnalyticsPatient>(() => {
      let q = db()
        .from('patients')
        .select('id,clinic_id,name,name_kana,phone,first_visit_date,referral_source,is_active')
        .is('deleted_at', null)
      if (clinicId) q = q.eq('clinic_id', clinicId)
      return q.order('id') as unknown as { range: Function }
    }, '集計用の患者取得')
  },

  /** メニュー別ランキングに使う。明細だけを期間で引く */
  async invoiceItemsForRange(from: string, to: string, clinicId: string | null): Promise<
    Array<{ name: string; quantity: number; subtotal: number }>
  > {
    const rows = await readAll<{ invoice_items: Array<{ name: string; quantity: number; subtotal: number }> | null }>(
      () => {
        let q = db()
          .from('invoices')
          .select('id, invoice_items(name,quantity,subtotal)')
          .is('deleted_at', null)
          .eq('status', 'paid')
          .gte('visit_date', from)
          .lte('visit_date', to)
        if (clinicId) q = q.eq('clinic_id', clinicId)
        return q.order('visit_date') as unknown as { range: Function }
      },
      '会計明細の取得',
    )
    return rows.flatMap((r) => r.invoice_items ?? [])
  },

  async clinics(): Promise<Array<{ id: string; name: string }>> {
    const { data, error } = await db().from('clinics').select('id,name').order('sort_order')
    wrap(error, '院一覧の取得')
    return (data ?? []) as Array<{ id: string; name: string }>
  },

  async staffList(clinicId: string | null): Promise<Array<{
    id: string; name: string; role: string | null; clinic_id: string; is_active: boolean
  }>> {
    let q = db().from('staff').select('id,name,role,clinic_id,is_active')
    if (clinicId) q = q.eq('clinic_id', clinicId)
    const { data, error } = await q.order('sort_order')
    wrap(error, 'スタッフ一覧の取得')
    return (data ?? []) as Array<{
      id: string; name: string; role: string | null; clinic_id: string; is_active: boolean
    }>
  },

  async staffNames(ids: string[]): Promise<Map<string, string>> {
    if (ids.length === 0) return new Map()
    const { data, error } = await db().from('staff').select('id,name').in('id', ids)
    wrap(error, 'スタッフ名の取得')
    return new Map(((data ?? []) as Array<{ id: string; name: string }>).map((s) => [s.id, s.name]))
  },
}
