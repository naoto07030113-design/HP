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

  async staffNames(ids: string[]): Promise<Map<string, string>> {
    if (ids.length === 0) return new Map()
    const { data, error } = await db().from('staff').select('id,name').in('id', ids)
    wrap(error, 'スタッフ名の取得')
    return new Map(((data ?? []) as Array<{ id: string; name: string }>).map((s) => [s.id, s.name]))
  },
}
