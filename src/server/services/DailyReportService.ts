/**
 * 日計表の集計。
 *
 * 以前はブラウザが全会計を読み込んでから、その日の分だけを絞って集計していた。
 * 他院の売上まで端末に載るうえ、件数が増えると取りこぼしたまま「正しく見える」
 * 数字が出てしまう。集計はサーバーで行い、画面には結果だけを渡す。
 */

import { reportRepository } from '../repositories/ReportRepository'
import type { InvoiceRow } from '../repositories/InvoiceRepository'
import { assertClinicAccess, clinicScope, requireCapability } from '../permissions/policy'
import type { Actor } from '../auth/session'
import type { DailyReportInput } from '../validators/report'

type PaymentMethod = InvoiceRow['payment_method']

const PAYMENT_METHODS: PaymentMethod[] = ['cash', 'card', 'paypay', 'line_pay', 'insurance', 'other']

/** 画面に出す時間帯（院の営業時間に合わせた範囲） */
const HOUR_FROM = 7
const HOUR_TO = 21

export type DailyReport = {
  date: string
  clinicId: string | null
  kpi: { totalRevenue: number; count: number; avgPerPatient: number; cashTotal: number }
  paymentBreakdown: Array<{ method: PaymentMethod; amount: number; count: number }>
  staffBreakdown: Array<{ staffId: string | null; name: string; count: number; revenue: number }>
  hourly: Array<{ hour: number; count: number }>
  transactions: Array<{
    id: string
    invoiceNumber: string
    patientName: string
    staffId: string | null
    staffName: string | null
    items: string[]
    paymentMethod: PaymentMethod
    totalAmount: number
    createdAt: string
  }>
}

export const dailyReportService = {
  async build(actor: Actor, input: DailyReportInput): Promise<DailyReport> {
    requireCapability(actor, 'analytics.read')

    const scope = clinicScope(actor)
    if (input.clinicId) assertClinicAccess(actor, input.clinicId)
    // admin が院を指定しなければ全院。それ以外は必ず自院に固定される
    const clinicId = scope ?? input.clinicId ?? null

    const invoices = await reportRepository.paidInvoicesForDate(input.date, clinicId)

    const staffIds = Array.from(new Set(invoices.map((i) => i.staff_id).filter((v): v is string => !!v)))
    const reservationIds = Array.from(
      new Set(invoices.map((i) => i.reservation_id).filter((v): v is string => !!v)),
    )
    const [staffNames, startTimes] = await Promise.all([
      reportRepository.staffNames(staffIds),
      reportRepository.reservationStartTimes(reservationIds),
    ])

    const totalRevenue = invoices.reduce((s, i) => s + (i.total_amount ?? 0), 0)
    const count = invoices.length
    const cashTotal = invoices
      .filter((i) => i.payment_method === 'cash')
      .reduce((s, i) => s + (i.total_amount ?? 0), 0)

    const paymentBreakdown = PAYMENT_METHODS.map((method) => {
      const rows = invoices.filter((i) => i.payment_method === method)
      return {
        method,
        amount: rows.reduce((s, i) => s + (i.total_amount ?? 0), 0),
        count: rows.length,
      }
    })

    const staffMap = new Map<string, { staffId: string | null; name: string; count: number; revenue: number }>()
    for (const inv of invoices) {
      const key = inv.staff_id ?? '__unknown__'
      const entry = staffMap.get(key) ?? {
        staffId: inv.staff_id,
        name: (inv.staff_id ? staffNames.get(inv.staff_id) : null) ?? '担当不明',
        count: 0,
        revenue: 0,
      }
      entry.count += 1
      entry.revenue += inv.total_amount ?? 0
      staffMap.set(key, entry)
    }
    const staffBreakdown = Array.from(staffMap.values()).sort((a, b) => b.revenue - a.revenue)

    const hourCounts = new Map<number, number>()
    for (const inv of invoices) {
      if (!inv.reservation_id) continue
      const startAt = startTimes.get(inv.reservation_id)
      if (!startAt) continue
      const hour = new Date(startAt).getHours()
      hourCounts.set(hour, (hourCounts.get(hour) ?? 0) + 1)
    }
    const hourly = Array.from({ length: HOUR_TO - HOUR_FROM + 1 }, (_, i) => {
      const hour = HOUR_FROM + i
      return { hour, count: hourCounts.get(hour) ?? 0 }
    })

    return {
      date: input.date,
      clinicId,
      kpi: {
        totalRevenue,
        count,
        avgPerPatient: count > 0 ? Math.round(totalRevenue / count) : 0,
        cashTotal,
      },
      paymentBreakdown,
      staffBreakdown,
      hourly,
      transactions: invoices.map((inv) => ({
        id: inv.id,
        invoiceNumber: inv.invoice_number,
        patientName: inv.patient_name,
        staffId: inv.staff_id,
        staffName: (inv.staff_id ? staffNames.get(inv.staff_id) : null) ?? null,
        items: (inv.invoice_items ?? []).map((it) => it.name),
        paymentMethod: inv.payment_method,
        totalAmount: inv.total_amount ?? 0,
        createdAt: inv.created_at,
      })),
    }
  },
}
