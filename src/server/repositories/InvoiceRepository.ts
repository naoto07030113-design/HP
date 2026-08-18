/**
 * 会計テーブルへのアクセス。
 *
 * invoices と invoice_items の2テーブルをまとめて扱う。
 * 明細の差し替えは「全消し → 入れ直し」で行う。件数が少なく、
 * 部分更新より整合が取りやすいため。
 */

import { createServiceClient } from '@/lib/supabase'
import { AppError, ERROR_CODES } from '../errors/AppError'

export type InvoiceItemRow = {
  id: string
  invoice_id: string
  menu_id: string | null
  name: string
  unit_price: number
  quantity: number
  discount: number
  subtotal: number
}

export type InvoiceRow = {
  id: string
  invoice_number: string
  reservation_id: string | null
  patient_id: string | null
  patient_name: string
  clinic_id: string
  staff_id: string | null
  visit_date: string
  subtotal: number
  discount_total: number
  tax_rate: number
  tax_amount: number
  total_amount: number
  insurance_type: 'none' | 'health_insurance' | 'workers_comp' | 'auto_accident'
  insurance_copay: number
  payment_method: 'cash' | 'card' | 'paypay' | 'line_pay' | 'insurance' | 'other'
  payment_amount: number
  change_amount: number
  status: 'unpaid' | 'paid' | 'cancelled'
  memo: string | null
  created_at: string
  updated_at: string
  created_by?: string | null
  updated_by?: string | null
  deleted_at?: string | null
  deleted_by?: string | null
  invoice_items?: InvoiceItemRow[]
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

export type InvoiceListQuery = {
  clinicScope: string | null
  clinicFilter?: string | null
  patientId?: string | null
  status?: string | null
  search?: string
  from?: string
  to?: string
  page: number
  perPage: number
}

/** 一覧と件数で同じ絞り込みを使う */
function applyFilters<T extends { eq: Function; is: Function; gte: Function; lte: Function; or: Function }>(
  builder: T, q: InvoiceListQuery,
): T {
  let b = builder.is('deleted_at', null) as T
  if (q.clinicScope) b = b.eq('clinic_id', q.clinicScope) as T
  else if (q.clinicFilter) b = b.eq('clinic_id', q.clinicFilter) as T
  if (q.patientId) b = b.eq('patient_id', q.patientId) as T
  if (q.status) b = b.eq('status', q.status) as T
  if (q.from) b = b.gte('visit_date', q.from) as T
  if (q.to) b = b.lte('visit_date', q.to) as T
  if (q.search) {
    const safe = q.search.replace(/[%_]/g, (c) => `\\${c}`)
    b = b.or(`patient_name.ilike.%${safe}%,invoice_number.ilike.%${safe}%`) as T
  }
  return b
}

export const invoiceRepository = {
  async list(query: InvoiceListQuery): Promise<{ rows: InvoiceRow[]; total: number }> {
    const from = (query.page - 1) * query.perPage

    const countQuery = applyFilters(
      db().from('invoices').select('id', { count: 'exact', head: true }) as never, query,
    ) as unknown as PromiseLike<{ count: number | null; error: { message: string } | null }>

    const rowsQuery = applyFilters(
      db().from('invoices').select('*, invoice_items(*)') as never, query,
    ) as unknown as { order: Function }

    const [countRes, rowsRes] = await Promise.all([
      countQuery,
      (rowsQuery.order('visit_date', { ascending: false }) as { range: Function })
        .range(from, from + query.perPage - 1),
    ])

    wrap(countRes.error, '会計件数の取得')
    wrap((rowsRes as { error: { message: string } | null }).error, '会計一覧の取得')

    return {
      rows: ((rowsRes as { data: InvoiceRow[] | null }).data ?? []) as InvoiceRow[],
      total: countRes.count ?? 0,
    }
  },

  async findById(id: string): Promise<InvoiceRow | null> {
    const { data, error } = await db()
      .from('invoices').select('*, invoice_items(*)')
      .eq('id', id).is('deleted_at', null).maybeSingle()
    wrap(error, '会計の取得')
    return (data as InvoiceRow | null) ?? null
  },

  /**
   * その日の連番で伝票番号を採番する。
   * 以前はブラウザ側で「手元にある会計の件数」から採番していたため、
   * 全件が手元にない場合や同時操作で番号が衝突した。
   * DB を直接数え、衝突したら次の番号で再試行する。
   */
  async nextInvoiceNumber(visitDate: string): Promise<string> {
    const ymd = visitDate.replace(/-/g, '')
    const { count, error } = await db()
      .from('invoices')
      .select('id', { count: 'exact', head: true })
      .eq('visit_date', visitDate)
    wrap(error, '伝票番号の採番')
    return `INV-${ymd}-${String((count ?? 0) + 1).padStart(3, '0')}`
  },

  async insert(
    invoice: Record<string, unknown>,
    items: Array<Record<string, unknown>>,
    actorId: string,
  ): Promise<InvoiceRow> {
    const now = new Date().toISOString()
    const { data, error } = await db()
      .from('invoices')
      .insert({ ...invoice, created_by: actorId, updated_by: actorId, created_at: now, updated_at: now })
      .select('*')
      .single()
    wrap(error, '会計の作成')

    const created = data as InvoiceRow
    await this.replaceItems(created.id, items)
    return (await this.findById(created.id)) ?? created
  },

  async update(
    id: string,
    invoice: Record<string, unknown>,
    items: Array<Record<string, unknown>> | null,
    actorId: string,
  ): Promise<InvoiceRow> {
    const { error } = await db()
      .from('invoices')
      .update({ ...invoice, updated_by: actorId, updated_at: new Date().toISOString() })
      .eq('id', id)
    wrap(error, '会計の更新')

    if (items) await this.replaceItems(id, items)
    const row = await this.findById(id)
    if (!row) {
      throw new AppError(ERROR_CODES.DEPENDENCY_UNAVAILABLE, {
        detail: `更新後の会計 ${id} を読み直せませんでした`,
      })
    }
    return row
  },

  /** 明細を入れ替える。invoice_items.id は TEXT なので採番して渡す */
  async replaceItems(invoiceId: string, items: Array<Record<string, unknown>>): Promise<void> {
    const supabase = db()
    const { error: delError } = await supabase.from('invoice_items').delete().eq('invoice_id', invoiceId)
    wrap(delError, '会計明細の削除')

    if (items.length === 0) return
    const rows = items.map((it, i) => ({ ...it, id: `${invoiceId}-${i + 1}`, invoice_id: invoiceId }))
    const { error: insError } = await supabase.from('invoice_items').insert(rows)
    wrap(insError, '会計明細の登録')
  },

  async softDelete(id: string, actorId: string): Promise<void> {
    const { error } = await db()
      .from('invoices')
      .update({ deleted_at: new Date().toISOString(), deleted_by: actorId })
      .eq('id', id)
    wrap(error, '会計の削除')
  },

  /** 画面上部の集計。一覧をページングするため、全件を読まずに数える */
  async stats(scope: { clinicScope: string | null; clinicFilter: string | null }): Promise<{
    todaySales: number; monthSales: number; unpaidCount: number
  }> {
    const clinic = scope.clinicScope ?? scope.clinicFilter
    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
    const monthFrom = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`

    const sum = async (from: string, to: string): Promise<number> => {
      let q = db().from('invoices').select('total_amount')
        .is('deleted_at', null).eq('status', 'paid').gte('visit_date', from).lte('visit_date', to)
      if (clinic) q = q.eq('clinic_id', clinic)
      const { data, error } = await q
      wrap(error, '売上集計')
      return ((data ?? []) as Array<{ total_amount: number }>).reduce((s, r) => s + (r.total_amount ?? 0), 0)
    }

    let unpaidQuery = db().from('invoices').select('id', { count: 'exact', head: true })
      .is('deleted_at', null).eq('status', 'unpaid')
    if (clinic) unpaidQuery = unpaidQuery.eq('clinic_id', clinic)

    const [todaySales, monthSales, unpaidRes] = await Promise.all([
      sum(today, today),
      sum(monthFrom, today),
      unpaidQuery,
    ])
    wrap(unpaidRes.error, '未払い件数の取得')

    return { todaySales, monthSales, unpaidCount: unpaidRes.count ?? 0 }
  },
}
