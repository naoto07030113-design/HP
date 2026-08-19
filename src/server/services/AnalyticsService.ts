/**
 * 経営ダッシュボードの集計。
 *
 * 以前はブラウザが全予約・全会計・全患者を読み込んでから集計していた。
 * 他院の売上と患者情報が端末に載るうえ、取得上限（既定1000行）に達すると
 * 静かに欠けたまま「それらしい」数字が出てしまう。
 *
 * 集計はここで行い、画面へは結果だけを返す。
 * 再診率と未再診の判定は直近1年の来院履歴を見る（全期間を毎回読むと重く、
 * 1年あれば「90日以上来ていない」の判定には十分なため）。
 */

import {
  reportRepository,
  type AnalyticsInvoice,
  type AnalyticsPatient,
  type AnalyticsReservation,
} from '../repositories/ReportRepository'
import { AppError, ERROR_CODES } from '../errors/AppError'
import { shiftRepository } from '../repositories/ShiftRepository'
import { assertClinicAccess, clinicScope, requireCapability } from '../permissions/policy'
import type { Actor } from '../auth/session'
import type {
  AnalyticsReportInput, ClinicDetailInput, DashboardInput, StaffDetailInput,
} from '../validators/report'
import type {
  AlertItem, ClinicKPI, DashboardData, DateRange, KPISnapshot, PeriodFilter, StaffKPI, TrendPoint,
} from '@/types/dashboard'

const DAY = 86_400_000
/** 再診率・未再診の判定に使う遡り期間 */
const HISTORY_DAYS = 365
/** 未再診とみなす日数 */
const INACTIVE_DAYS = 90

// ── 日付ユーティリティ（date-fns に依存せず yyyy-MM-dd で扱う） ──

function ymd(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function parse(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function shift(s: string, days: number): string {
  return ymd(new Date(parse(s).getTime() + days * DAY))
}

function diffDays(from: string, to: string): number {
  return Math.round((parse(to).getTime() - parse(from).getTime()) / DAY)
}

export function getPeriodRange(period: PeriodFilter, custom?: DateRange, today = new Date()): DateRange {
  const t = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  switch (period) {
    case 'today':
      return { from: ymd(t), to: ymd(t) }
    case 'week': {
      const ws = new Date(t.getTime() - t.getDay() * DAY)
      return { from: ymd(ws), to: ymd(new Date(ws.getTime() + 6 * DAY)) }
    }
    case 'month':
      return {
        from: ymd(new Date(t.getFullYear(), t.getMonth(), 1)),
        to: ymd(new Date(t.getFullYear(), t.getMonth() + 1, 0)),
      }
    case 'lastMonth':
      return {
        from: ymd(new Date(t.getFullYear(), t.getMonth() - 1, 1)),
        to: ymd(new Date(t.getFullYear(), t.getMonth(), 0)),
      }
    case 'year':
      return {
        from: ymd(new Date(t.getFullYear(), 0, 1)),
        to: ymd(new Date(t.getFullYear(), 11, 31)),
      }
    case 'custom':
      return custom ?? getPeriodRange('month', undefined, today)
  }
}

export function getPrevPeriodRange(current: DateRange): DateRange {
  const span = diffDays(current.from, current.to) + 1
  return { from: shift(current.from, -span), to: shift(current.to, -span) }
}

// ── 集計 ──

export type Dataset = {
  reservations: AnalyticsReservation[]
  invoices: AnalyticsInvoice[]
  patients: AnalyticsPatient[]
}

export function computeKPIs(
  data: Dataset,
  range: DateRange,
  clinicId: string | 'all',
  staffId?: string,
): KPISnapshot {
  const { from, to } = range
  const inClinic = (cid: string) => clinicId === 'all' || cid === clinicId

  const invoices = data.invoices.filter((i) =>
    i.visit_date >= from && i.visit_date <= to &&
    inClinic(i.clinic_id) && (!staffId || i.staff_id === staffId),
  )

  const rangeRes = data.reservations.filter((r) => {
    const d = r.start_at.slice(0, 10)
    return d >= from && d <= to && inClinic(r.clinic_id) && (!staffId || r.staff_id === staffId)
  })

  const sales = invoices.reduce((s, i) => s + (i.total_amount ?? 0), 0)
  const visits = rangeRes.filter((r) => r.status === 'visited').length
  const cancelledCount = rangeRes.filter((r) => r.status === 'cancelled').length
  const noShowCount = rangeRes.filter((r) => r.status === 'no_show').length
  const totalReservations = rangeRes.length

  const newPatients = data.patients.filter((p) =>
    (p.first_visit_date ?? '') >= from && (p.first_visit_date ?? '') <= to && inClinic(p.clinic_id),
  ).length

  // 再診率: 対象期間の終わりまでに2回以上来院した人の割合
  const visitCount = new Map<string, number>()
  data.reservations
    .filter((r) => r.status === 'visited' && r.start_at.slice(0, 10) <= to && inClinic(r.clinic_id))
    .forEach((r) => {
      const key = r.patient_id ?? r.patient_name
      visitCount.set(key, (visitCount.get(key) ?? 0) + 1)
    })
  const repeatPatients = Array.from(visitCount.values()).filter((c) => c >= 2).length
  const uniquePatients = visitCount.size

  // 未再診: 期間の終わりから90日以上来院がない人
  const threshold = shift(to, -INACTIVE_DAYS)
  const lastVisit = new Map<string, string>()
  data.reservations
    .filter((r) => r.status === 'visited' && inClinic(r.clinic_id))
    .forEach((r) => {
      const key = r.patient_id ?? r.patient_name
      const d = r.start_at.slice(0, 10)
      const prev = lastVisit.get(key)
      if (!prev || d > prev) lastVisit.set(key, d)
    })
  const inactivePatients = data.patients.filter((p) => {
    if (!inClinic(p.clinic_id)) return false
    const last = lastVisit.get(p.id)
    return !last || last < threshold
  }).length

  return {
    sales,
    visits,
    newPatients,
    repeatPatients,
    repeatRate: uniquePatients > 0 ? Math.round((repeatPatients / uniquePatients) * 100) : 0,
    cancellationRate: totalReservations > 0
      ? Math.round(((cancelledCount + noShowCount) / totalReservations) * 100)
      : 0,
    averageSpend: visits > 0 ? Math.round(sales / visits) : 0,
    inactivePatients,
    totalReservations,
    cancelledCount,
    noShowCount,
  }
}

function trendLabel(index: number, days: number, date: string): string {
  const step = Math.max(1, Math.floor(days / 6))
  if (index % step !== 0 && index !== days - 1) return ''
  const [, m, d] = date.split('-')
  return `${Number(m)}/${Number(d)}`
}

function buildTrends(
  data: Dataset,
  days: number,
  clinicId: string | 'all',
  today: Date,
): { salesTrend: TrendPoint[]; visitTrend: TrendPoint[] } {
  const end = ymd(today)
  const inClinic = (cid: string) => clinicId === 'all' || cid === clinicId

  const salesByDate = new Map<string, number>()
  data.invoices.filter((i) => inClinic(i.clinic_id)).forEach((i) => {
    salesByDate.set(i.visit_date, (salesByDate.get(i.visit_date) ?? 0) + (i.total_amount ?? 0))
  })

  const visitsByDate = new Map<string, number>()
  data.reservations
    .filter((r) => r.status === 'visited' && inClinic(r.clinic_id))
    .forEach((r) => {
      const d = r.start_at.slice(0, 10)
      visitsByDate.set(d, (visitsByDate.get(d) ?? 0) + 1)
    })

  const salesTrend: TrendPoint[] = []
  const visitTrend: TrendPoint[] = []
  for (let i = 0; i < days; i++) {
    const date = shift(end, -(days - 1 - i))
    const label = trendLabel(i, days, date)
    salesTrend.push({ date, label, value: salesByDate.get(date) ?? 0 })
    visitTrend.push({ date, label, value: visitsByDate.get(date) ?? 0 })
  }
  return { salesTrend, visitTrend }
}

function generateAlerts(current: KPISnapshot, prev: KPISnapshot): AlertItem[] {
  const alerts: AlertItem[] = []

  if (prev.sales > 0 && current.sales < prev.sales * 0.9) {
    const drop = Math.round((1 - current.sales / prev.sales) * 100)
    alerts.push({
      id: 'sales_drop',
      severity: drop >= 20 ? 'danger' : 'warning',
      category: '売上',
      title: `売上が前期比 ${drop}% 低下`,
      message: `今期売上 ¥${current.sales.toLocaleString()} は前期 ¥${prev.sales.toLocaleString()} から ${drop}% 減少しています。`,
    })
  }

  if (prev.repeatRate > 0 && current.repeatRate < prev.repeatRate - 5) {
    alerts.push({
      id: 'repeat_drop',
      severity: 'warning',
      category: '再診率',
      title: `再診率が ${prev.repeatRate}% → ${current.repeatRate}% に低下`,
      message: '初回来院後の再予約率が下がっています。通院計画の説明を強化してください。',
    })
  }

  if (current.cancellationRate >= 20) {
    alerts.push({
      id: 'cancel_high',
      severity: current.cancellationRate >= 30 ? 'danger' : 'warning',
      category: 'キャンセル',
      title: `キャンセル率 ${current.cancellationRate}% — 高水準`,
      message: `キャンセル・無断キャンセルが全予約の ${current.cancellationRate}% を占めています。リマインド送信を確認してください。`,
    })
  }

  if (current.inactivePatients >= 20) {
    alerts.push({
      id: 'inactive_high',
      severity: 'info',
      category: '未再診',
      title: `未再診患者 ${current.inactivePatients} 名（90日以上）`,
      message: '再診促進の連絡を行うことで来院数の回復が期待できます。',
    })
  }

  if (prev.newPatients > 0 && current.newPatients < prev.newPatients * 0.8) {
    alerts.push({
      id: 'new_patient_drop',
      severity: 'warning',
      category: '新患',
      title: '新患数が前期比 20%+ 減少',
      message: `新患数 ${current.newPatients} 名は前期 ${prev.newPatients} 名を下回っています。集客施策を見直してください。`,
    })
  }

  return alerts
}

function trendDays(period: PeriodFilter): number {
  if (period === 'today') return 1
  if (period === 'week') return 7
  if (period === 'year') return 12
  return 30
}

const MONTH_LABELS = 6

export type StaffDetail = {
  monthHistory: Array<{ label: string; visits: number; cancelled: number }>
}

export type AnalyticsReport = {
  month: string
  kpi: {
    thisMonthRev: number; lastMonthRev: number
    thisMonthVisits: number; lastMonthVisits: number
    newPatients: number; repeatRate: number
  }
  days30: Array<{ date: string; label: string; revenue: number; visits: number }>
  staffStats: Array<{ id: string; name: string; role: string | null; clinicId: string; visits: number; revenue: number }>
  menuRanking: Array<{ name: string; count: number; revenue: number }>
  statusBreakdown: Array<{ status: string; count: number }>
  inactivePatients: Array<{
    id: string; name: string; nameKana: string | null; phone: string | null
    clinicId: string; lastVisitDate: string | null; daysSince: number | null
  }>
}

export type ClinicDetail = {
  menuRanking: Array<{ name: string; count: number; revenue: number }>
  monthlyTrend: Array<{ label: string; sales: number; visits: number }>
}

export const analyticsService = {
  async dashboard(actor: Actor, input: DashboardInput): Promise<DashboardData> {
    requireCapability(actor, 'analytics.read')

    const scope = clinicScope(actor)
    if (input.clinicId) assertClinicAccess(actor, input.clinicId)
    // admin 以外は必ず自院に固定される
    const clinicId = scope ?? input.clinicId ?? null

    const today = new Date()
    const custom = input.from && input.to ? { from: input.from, to: input.to } : undefined
    const period = getPeriodRange(input.period, custom, today)
    const prevPeriod = getPrevPeriodRange(period)

    const days = trendDays(input.period)
    const trendFrom = shift(ymd(today), -(days - 1))
    const historyFrom = shift(ymd(today), -HISTORY_DAYS)

    // 必要な範囲をまとめて1回だけ読む
    const from = [period.from, prevPeriod.from, trendFrom, historyFrom].sort()[0]
    const to = [period.to, ymd(today)].sort().slice(-1)[0]

    const [reservations, invoices, patients, clinicRows, staffRows] = await Promise.all([
      reportRepository.analyticsReservations(from, to, clinicId),
      reportRepository.analyticsInvoices(from, to, clinicId),
      reportRepository.analyticsPatients(clinicId),
      reportRepository.clinics(),
      reportRepository.staffList(clinicId),
    ])
    const data: Dataset = { reservations, invoices, patients }

    const filter: string = input.clinicId ?? clinicId ?? 'all'
    const overall = computeKPIs(data, period, filter)
    const prevOverall = computeKPIs(data, prevPeriod, filter)

    const clinics: ClinicKPI[] = clinicRows
      .filter((c) => filter === 'all' || c.id === filter)
      .map((c) => ({ clinicId: c.id, clinicName: c.name, ...computeKPIs(data, period, c.id) }))

    const staff: StaffKPI[] = staffRows
      .filter((s) => s.is_active && (filter === 'all' || s.clinic_id === filter))
      .map((s) => {
        const kpi = computeKPIs(data, period, s.clinic_id, s.id)
        return {
          staffId: s.id,
          staffName: s.name,
          role: s.role ?? '',
          clinicId: s.clinic_id,
          clinicName: clinicRows.find((c) => c.id === s.clinic_id)?.name ?? '',
          sales: kpi.sales,
          visits: kpi.visits,
          newPatients: kpi.newPatients,
          repeatRate: kpi.repeatRate,
          cancellations: kpi.cancelledCount,
          averageSpend: kpi.averageSpend,
        }
      })
      .sort((a, b) => b.sales - a.sales)

    const { salesTrend, visitTrend } = buildTrends(data, days, filter, today)

    return {
      period,
      prevPeriod,
      overall,
      prevOverall,
      clinics,
      staff,
      salesTrend,
      visitTrend,
      newPatientTrend: visitTrend,
      alerts: generateAlerts(overall, prevOverall),
    }
  },

  /** 院別ダッシュボードの追加集計（メニュー別ランキングと直近6か月の推移） */
  async clinicDetail(actor: Actor, input: ClinicDetailInput): Promise<ClinicDetail> {
    requireCapability(actor, 'analytics.read')
    assertClinicAccess(actor, input.clinicId)

    const today = new Date()
    const custom = input.from && input.to ? { from: input.from, to: input.to } : undefined
    const period = getPeriodRange(input.period, custom, today)

    // 直近6か月ぶんの範囲
    const months = Array.from({ length: MONTH_LABELS }, (_, i) => {
      const base = new Date(today.getFullYear(), today.getMonth() - (MONTH_LABELS - 1 - i), 1)
      return {
        label: `${base.getMonth() + 1}月`,
        from: ymd(base),
        to: ymd(new Date(base.getFullYear(), base.getMonth() + 1, 0)),
      }
    })
    const monthFrom = months[0].from
    const monthTo = months[months.length - 1].to

    const [items, invoices, reservations] = await Promise.all([
      reportRepository.invoiceItemsForRange(period.from, period.to, input.clinicId),
      reportRepository.analyticsInvoices(monthFrom, monthTo, input.clinicId),
      reportRepository.analyticsReservations(monthFrom, monthTo, input.clinicId),
    ])

    const menuMap = new Map<string, { count: number; revenue: number }>()
    items.forEach((it) => {
      const e = menuMap.get(it.name) ?? { count: 0, revenue: 0 }
      menuMap.set(it.name, {
        count: e.count + (it.quantity ?? 0),
        revenue: e.revenue + (it.subtotal ?? 0),
      })
    })
    const menuRanking = Array.from(menuMap.entries())
      .map(([name, d]) => ({ name, ...d }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8)

    const monthlyTrend = months.map((m) => ({
      label: m.label,
      sales: invoices
        .filter((i) => i.visit_date >= m.from && i.visit_date <= m.to)
        .reduce((s, i) => s + (i.total_amount ?? 0), 0),
      visits: reservations.filter((r) => {
        const d = r.start_at.slice(0, 10)
        return r.status === 'visited' && d >= m.from && d <= m.to
      }).length,
    }))

    return { menuRanking, monthlyTrend }
  },

  /** スタッフ別ダッシュボードの直近6か月の来院・キャンセル推移 */
  async staffDetail(actor: Actor, input: StaffDetailInput): Promise<StaffDetail> {
    requireCapability(actor, 'analytics.read')

    const owners = await shiftRepository.staffClinicIds([input.staffId])
    const clinicId = owners.get(input.staffId)
    if (!clinicId) {
      throw new AppError(ERROR_CODES.NOT_FOUND, {
        message: '対象のスタッフが見つかりませんでした。',
        detail: `staffId=${input.staffId}`,
      })
    }
    assertClinicAccess(actor, clinicId)

    const today = new Date()
    const months = Array.from({ length: MONTH_LABELS }, (_, i) => {
      const base = new Date(today.getFullYear(), today.getMonth() - (MONTH_LABELS - 1 - i), 1)
      return {
        label: `${base.getMonth() + 1}月`,
        from: ymd(base),
        to: ymd(new Date(base.getFullYear(), base.getMonth() + 1, 0)),
      }
    })

    const reservations = await reportRepository.analyticsReservations(
      months[0].from, months[months.length - 1].to, clinicId,
    )
    const mine = reservations.filter((r) => r.staff_id === input.staffId)

    return {
      monthHistory: months.map((m) => {
        const inMonth = mine.filter((r) => {
          const d = r.start_at.slice(0, 10)
          return d >= m.from && d <= m.to
        })
        return {
          label: m.label,
          visits: inMonth.filter((r) => r.status === 'visited').length,
          cancelled: inMonth.filter((r) => r.status === 'cancelled' || r.status === 'no_show').length,
        }
      }),
    }
  },

  /**
   * 分析レポート画面。
   * 以前はブラウザが全会計・全患者・全予約を読み込んで集計していた。
   */
  async report(actor: Actor, input: AnalyticsReportInput): Promise<AnalyticsReport> {
    requireCapability(actor, 'analytics.read')

    const scope = clinicScope(actor)
    if (input.clinicId) assertClinicAccess(actor, input.clinicId)
    const clinicId = scope ?? input.clinicId ?? null

    const today = new Date()
    const thisMonth = { from: ymd(new Date(today.getFullYear(), today.getMonth(), 1)),
                        to: ymd(new Date(today.getFullYear(), today.getMonth() + 1, 0)) }
    const lastMonth = { from: ymd(new Date(today.getFullYear(), today.getMonth() - 1, 1)),
                        to: ymd(new Date(today.getFullYear(), today.getMonth(), 0)) }
    // 未再診の判定に必要なぶんだけ遡る
    const historyFrom = shift(ymd(today), -Math.max(HISTORY_DAYS, input.inactiveDays))
    const from = [lastMonth.from, shift(ymd(today), -29), historyFrom].sort()[0]
    const to = [thisMonth.to, ymd(today)].sort().slice(-1)[0]

    const [reservations, invoices, patients, items, staffRows] = await Promise.all([
      reportRepository.analyticsReservations(from, to, clinicId),
      reportRepository.analyticsInvoices(from, to, clinicId),
      reportRepository.analyticsPatients(clinicId),
      reportRepository.invoiceItemsForRange(thisMonth.from, thisMonth.to, clinicId),
      reportRepository.staffList(clinicId),
    ])

    const inClinic = (cid: string) => !clinicId || cid === clinicId
    const inMonth = (d: string, m: { from: string; to: string }) => d >= m.from && d <= m.to

    const paid = invoices.filter((i) => inClinic(i.clinic_id))
    const visited = reservations.filter((r) => r.status === 'visited' && inClinic(r.clinic_id))

    const sum = (rows: AnalyticsInvoice[]) => rows.reduce((s, i) => s + (i.total_amount ?? 0), 0)

    const visitCount = new Map<string, number>()
    visited.forEach((r) => {
      const key = r.patient_id ?? r.patient_name
      visitCount.set(key, (visitCount.get(key) ?? 0) + 1)
    })
    const uniquePatients = visitCount.size
    const repeat = Array.from(visitCount.values()).filter((c) => c >= 2).length

    const days30 = Array.from({ length: 30 }, (_, i) => {
      const date = shift(ymd(today), -(29 - i))
      const [, m, d] = date.split('-')
      return {
        date,
        label: i % 5 === 0 || i === 29 ? `${Number(m)}/${Number(d)}` : '',
        revenue: sum(paid.filter((inv) => inv.visit_date === date)),
        visits: visited.filter((r) => r.start_at.slice(0, 10) === date).length,
      }
    })

    const staffStats = staffRows
      .filter((s) => s.is_active && inClinic(s.clinic_id))
      .map((s) => ({
        id: s.id, name: s.name, role: s.role, clinicId: s.clinic_id,
        visits: visited.filter((r) => r.staff_id === s.id && inMonth(r.start_at.slice(0, 10), thisMonth)).length,
        revenue: sum(paid.filter((i) => i.staff_id === s.id && inMonth(i.visit_date, thisMonth))),
      }))
      .sort((a, b) => b.visits - a.visits)

    const menuMap = new Map<string, { count: number; revenue: number }>()
    items.forEach((it) => {
      const e = menuMap.get(it.name) ?? { count: 0, revenue: 0 }
      menuMap.set(it.name, { count: e.count + (it.quantity ?? 0), revenue: e.revenue + (it.subtotal ?? 0) })
    })
    const menuRanking = Array.from(menuMap.entries())
      .map(([name, d]) => ({ name, ...d }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8)

    const monthly = reservations.filter(
      (r) => inClinic(r.clinic_id) && inMonth(r.start_at.slice(0, 10), thisMonth),
    )
    const statusBreakdown = ['visited', 'confirmed', 'cancelled', 'no_show'].map((status) => ({
      status, count: monthly.filter((r) => r.status === status).length,
    }))

    const threshold = shift(ymd(today), -input.inactiveDays)
    const lastVisit = new Map<string, string>()
    visited.forEach((r) => {
      const key = r.patient_id ?? r.patient_name
      const d = r.start_at.slice(0, 10)
      const prev = lastVisit.get(key)
      if (!prev || d > prev) lastVisit.set(key, d)
    })
    const inactivePatients = patients
      .filter((p) => {
        if (!p.is_active || !inClinic(p.clinic_id)) return false
        const last = lastVisit.get(p.id)
        return !last || last < threshold
      })
      .map((p) => {
        const last = lastVisit.get(p.id) ?? null
        return {
          id: p.id, name: p.name, nameKana: p.name_kana, phone: p.phone, clinicId: p.clinic_id,
          lastVisitDate: last,
          daysSince: last
            ? Math.round((parse(ymd(today)).getTime() - parse(last).getTime()) / DAY)
            : null,
        }
      })
      .sort((a, b) => {
        if (a.lastVisitDate === null) return -1
        if (b.lastVisitDate === null) return 1
        return a.lastVisitDate < b.lastVisitDate ? -1 : 1
      })
      .slice(0, 50)

    return {
      month: thisMonth.from.slice(0, 7),
      kpi: {
        thisMonthRev: sum(paid.filter((i) => inMonth(i.visit_date, thisMonth))),
        lastMonthRev: sum(paid.filter((i) => inMonth(i.visit_date, lastMonth))),
        thisMonthVisits: visited.filter((r) => inMonth(r.start_at.slice(0, 10), thisMonth)).length,
        lastMonthVisits: visited.filter((r) => inMonth(r.start_at.slice(0, 10), lastMonth)).length,
        newPatients: patients.filter(
          (p) => inClinic(p.clinic_id) && inMonth(p.first_visit_date ?? '', thisMonth),
        ).length,
        repeatRate: uniquePatients > 0 ? Math.round((repeat / uniquePatients) * 100) : 0,
      },
      days30,
      staffStats,
      menuRanking,
      statusBreakdown,
      inactivePatients,
    }
  },
}
