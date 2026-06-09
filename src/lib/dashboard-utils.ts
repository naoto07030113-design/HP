import {
  format, subDays, subMonths, eachDayOfInterval, parseISO,
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfYear, endOfYear,
  differenceInDays,
} from 'date-fns'
import { ja } from 'date-fns/locale'
import type {
  PeriodFilter, DateRange, KPISnapshot, ClinicKPI, StaffKPI,
  TrendPoint, AlertItem, DashboardData,
} from '@/types/dashboard'
import { accountingStore } from './accounting-store'
import { patientStore } from './patient-store'

// ── 期間計算 ──────────────────────────────────────────────────────
export function getPeriodRange(period: PeriodFilter, custom?: DateRange): DateRange {
  const today = new Date()
  switch (period) {
    case 'today':
      return { from: format(today, 'yyyy-MM-dd'), to: format(today, 'yyyy-MM-dd') }
    case 'week': {
      const ws = startOfWeek(today, { weekStartsOn: 0 })
      const we = endOfWeek(today, { weekStartsOn: 0 })
      return { from: format(ws, 'yyyy-MM-dd'), to: format(we, 'yyyy-MM-dd') }
    }
    case 'month':
      return { from: format(startOfMonth(today), 'yyyy-MM-dd'), to: format(endOfMonth(today), 'yyyy-MM-dd') }
    case 'lastMonth': {
      const lm = subMonths(today, 1)
      return { from: format(startOfMonth(lm), 'yyyy-MM-dd'), to: format(endOfMonth(lm), 'yyyy-MM-dd') }
    }
    case 'year':
      return { from: format(startOfYear(today), 'yyyy-MM-dd'), to: format(endOfYear(today), 'yyyy-MM-dd') }
    case 'custom':
      return custom ?? getPeriodRange('month')
  }
}

export function getPrevPeriodRange(current: DateRange): DateRange {
  const from = parseISO(current.from)
  const to = parseISO(current.to)
  const diff = differenceInDays(to, from) + 1
  return {
    from: format(subDays(from, diff), 'yyyy-MM-dd'),
    to: format(subDays(to, diff), 'yyyy-MM-dd'),
  }
}

// ── KPI 計算 ──────────────────────────────────────────────────────
export function computeKPIs(
  range: DateRange,
  reservations: { id: string; status: string; start_at: string; clinic_id: string; staff_id?: string | null; patient_id?: string | null; patient_name: string }[],
  clinicId: string | 'all' = 'all',
  staffId?: string,
): KPISnapshot {
  const { from, to } = range

  const invoices = accountingStore.getAll().filter((i) =>
    i.status === 'paid' &&
    i.visit_date >= from &&
    i.visit_date <= to &&
    (clinicId === 'all' || i.clinic_id === clinicId) &&
    (!staffId || i.staff_id === staffId),
  )

  const rangeRes = reservations.filter((r) => {
    const d = r.start_at.slice(0, 10)
    return d >= from && d <= to &&
      (clinicId === 'all' || r.clinic_id === clinicId) &&
      (!staffId || r.staff_id === staffId)
  })

  const sales = invoices.reduce((s, i) => s + i.total_amount, 0)
  const visits = rangeRes.filter((r) => r.status === 'visited').length
  const cancelledCount = rangeRes.filter((r) => r.status === 'cancelled').length
  const noShowCount = rangeRes.filter((r) => r.status === 'no_show').length
  const totalReservations = rangeRes.length

  // New patients: first visit in this period
  const allPatients = patientStore.getAll()
  const newPatients = allPatients.filter((p) =>
    (p.first_visit_date ?? '') >= from &&
    (p.first_visit_date ?? '') <= to &&
    (clinicId === 'all' || p.clinic_id === clinicId),
  ).length

  // Repeat patients: visited more than once (from all time up to period end)
  const visitMap = new Map<string, number>()
  reservations.filter((r) =>
    r.status === 'visited' &&
    r.start_at.slice(0, 10) <= to &&
    (clinicId === 'all' || r.clinic_id === clinicId),
  ).forEach((r) => {
    const k = r.patient_id ?? r.patient_name
    visitMap.set(k, (visitMap.get(k) ?? 0) + 1)
  })
  const repeatPatients = Array.from(visitMap.values()).filter((c) => c >= 2).length
  const uniquePatients = visitMap.size
  const repeatRate = uniquePatients > 0 ? Math.round(repeatPatients / uniquePatients * 100) : 0
  const cancellationRate = totalReservations > 0 ? Math.round((cancelledCount + noShowCount) / totalReservations * 100) : 0
  const averageSpend = visits > 0 ? Math.round(sales / visits) : 0

  // Inactive patients (90+ days without visit as of period end)
  const threshold = format(subDays(parseISO(to), 90), 'yyyy-MM-dd')
  const lastVisit = new Map<string, string>()
  reservations.filter((r) => r.status === 'visited' && (clinicId === 'all' || r.clinic_id === clinicId))
    .forEach((r) => {
      const k = r.patient_id ?? r.patient_name
      const d = r.start_at.slice(0, 10)
      const existing = lastVisit.get(k)
      if (!existing || d > existing) lastVisit.set(k, d)
    })
  const inactivePatients = allPatients.filter((p) => {
    if (clinicId !== 'all' && p.clinic_id !== clinicId) return false
    const last = lastVisit.get(p.id)
    return !last || last < threshold
  }).length

  return {
    sales, visits, newPatients, repeatPatients, repeatRate,
    cancellationRate, averageSpend, inactivePatients,
    totalReservations, cancelledCount, noShowCount,
  }
}

// ── トレンドデータ ──────────────────────────────────────────────
export function buildSalesTrend(
  days: number,
  reservations: { id: string; status: string; start_at: string; clinic_id: string }[],
  clinicId: string | 'all' = 'all',
): TrendPoint[] {
  const today = new Date()
  return Array.from({ length: days }, (_, i) => {
    const date = format(subDays(today, days - 1 - i), 'yyyy-MM-dd')
    const label = i % Math.max(1, Math.floor(days / 6)) === 0 || i === days - 1
      ? format(parseISO(date), 'M/d', { locale: ja })
      : ''
    const value = accountingStore.getAll()
      .filter((inv) =>
        inv.status === 'paid' && inv.visit_date === date &&
        (clinicId === 'all' || inv.clinic_id === clinicId),
      )
      .reduce((s, inv) => s + inv.total_amount, 0)
    return { date, label, value }
  })
}

export function buildVisitTrend(
  days: number,
  reservations: { status: string; start_at: string; clinic_id: string }[],
  clinicId: string | 'all' = 'all',
): TrendPoint[] {
  const today = new Date()
  return Array.from({ length: days }, (_, i) => {
    const date = format(subDays(today, days - 1 - i), 'yyyy-MM-dd')
    const label = i % Math.max(1, Math.floor(days / 6)) === 0 || i === days - 1
      ? format(parseISO(date), 'M/d', { locale: ja })
      : ''
    const value = reservations.filter((r) =>
      r.status === 'visited' && r.start_at.startsWith(date) &&
      (clinicId === 'all' || r.clinic_id === clinicId),
    ).length
    return { date, label, value }
  })
}

// ── アラート生成 ──────────────────────────────────────────────────
export function generateAlerts(current: KPISnapshot, prev: KPISnapshot): AlertItem[] {
  const alerts: AlertItem[] = []

  // 売上低下
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

  // 再診率低下
  if (prev.repeatRate > 0 && current.repeatRate < prev.repeatRate - 5) {
    alerts.push({
      id: 'repeat_drop',
      severity: 'warning',
      category: '再診率',
      title: `再診率が ${prev.repeatRate}% → ${current.repeatRate}% に低下`,
      message: '初回来院後の再予約率が下がっています。通院計画の説明を強化してください。',
    })
  }

  // キャンセル率増加
  if (current.cancellationRate >= 20) {
    alerts.push({
      id: 'cancel_high',
      severity: current.cancellationRate >= 30 ? 'danger' : 'warning',
      category: 'キャンセル',
      title: `キャンセル率 ${current.cancellationRate}% — 高水準`,
      message: `キャンセル・無断キャンセルが全予約の ${current.cancellationRate}% を占めています。リマインド送信を確認してください。`,
    })
  }

  // 未再診患者増加
  if (current.inactivePatients >= 20) {
    alerts.push({
      id: 'inactive_high',
      severity: 'info',
      category: '未再診',
      title: `未再診患者 ${current.inactivePatients} 名（90日以上）`,
      message: '再診促進の連絡を行うことで来院数の回復が期待できます。',
    })
  }

  // 新患減少
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

// ── メイン集計 ──────────────────────────────────────────────────
export function buildDashboard(
  period: PeriodFilter,
  reservations: { id: string; status: string; start_at: string; clinic_id: string; staff_id?: string | null; patient_id?: string | null; patient_name: string }[],
  staffList: { id: string; name: string; role: string | null; clinic_id: string; is_active: boolean }[],
  clinicList: { id: string; name: string }[],
  customRange?: DateRange,
  clinicFilter: string = 'all',
): DashboardData {
  const periodRange = getPeriodRange(period, customRange)
  const prevRange = getPrevPeriodRange(periodRange)

  const overall = computeKPIs(periodRange, reservations, clinicFilter)
  const prevOverall = computeKPIs(prevRange, reservations, clinicFilter)

  const clinics: ClinicKPI[] = clinicList
    .filter((c) => clinicFilter === 'all' || c.id === clinicFilter)
    .map((c) => ({
      clinicId: c.id,
      clinicName: c.name,
      ...computeKPIs(periodRange, reservations, c.id),
    }))

  const staff: StaffKPI[] = staffList
    .filter((s) => s.is_active && (clinicFilter === 'all' || s.clinic_id === clinicFilter))
    .map((s) => {
      const kpi = computeKPIs(periodRange, reservations, s.clinic_id, s.id)
      const clinic = clinicList.find((c) => c.id === s.clinic_id)
      return {
        staffId: s.id,
        staffName: s.name,
        role: s.role ?? '',
        clinicId: s.clinic_id,
        clinicName: clinic?.name ?? '',
        sales: kpi.sales,
        visits: kpi.visits,
        newPatients: kpi.newPatients,
        repeatRate: kpi.repeatRate,
        cancellations: kpi.cancelledCount,
        averageSpend: kpi.averageSpend,
      }
    })
    .sort((a, b) => b.sales - a.sales)

  const days = period === 'today' ? 1 : period === 'week' ? 7 : period === 'year' ? 12 : 30
  const salesTrend = buildSalesTrend(days, reservations, clinicFilter)
  const visitTrend = buildVisitTrend(days, reservations, clinicFilter)
  const newPatientTrend = buildVisitTrend(days, reservations, clinicFilter) // same shape, different semantics - could be refined

  const alerts = generateAlerts(overall, prevOverall)

  return {
    period: periodRange,
    prevPeriod: prevRange,
    overall,
    prevOverall,
    clinics,
    staff,
    salesTrend,
    visitTrend,
    newPatientTrend,
    alerts,
  }
}

// ── 変化率 ──────────────────────────────────────────────────────
export function changeRate(current: number, prev: number): number | null {
  if (prev === 0) return null
  return Math.round((current - prev) / prev * 100)
}
