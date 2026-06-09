'use client'

import { useMemo, useState } from 'react'
import { format, parseISO, subMonths, startOfMonth, endOfMonth } from 'date-fns'
import { ja } from 'date-fns/locale'
import {
  TrendingUp,
  TrendingDown,
  Users,
  Receipt,
  CalendarCheck,
  Repeat2,
  AlertTriangle,
  AlertCircle,
  Info,
  Building2,
  Award,
} from 'lucide-react'
import { useClinicStore } from '@/lib/clinic-store'
import { useAccountingStore, accountingStore } from '@/lib/accounting-store'
import { usePatientStore } from '@/lib/patient-store'
import { buildDashboard, changeRate } from '@/lib/dashboard-utils'
import type { PeriodFilter, DateRange } from '@/types/dashboard'
import { PermissionGuard } from '@/components/common/PermissionGuard'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

// ── BarChart ────────────────────────────────────────────────────────────
function BarChart({
  data,
  color = 'bg-green-600',
  formatVal,
}: {
  data: { label: string; value: number }[]
  color?: string
  formatVal?: (v: number) => string
}) {
  const max = Math.max(...data.map((d) => d.value), 1)
  return (
    <div className="flex items-end gap-px h-28 w-full">
      {data.map((d, i) => (
        <div
          key={i}
          className="flex-1 flex flex-col items-center gap-0.5 group"
          title={`${d.label}: ${formatVal?.(d.value) ?? d.value}`}
        >
          <div
            className={cn(
              'w-full rounded-t-sm transition-all',
              color,
              d.value === 0 ? 'opacity-15' : 'opacity-85 group-hover:opacity-100',
            )}
            style={{ height: `${Math.max(2, (d.value / max) * 88)}px` }}
          />
          {d.label && (
            <span className="text-[8px] text-muted-foreground">{d.label}</span>
          )}
        </div>
      ))}
    </div>
  )
}

// ── ChangeBadge ─────────────────────────────────────────────────────────
function ChangeBadge({ current, prev }: { current: number; prev: number }) {
  const r = changeRate(current, prev)
  if (r === null) return null
  return (
    <span
      className={cn(
        'text-xs font-medium inline-flex items-center gap-0.5',
        r >= 0 ? 'text-green-600' : 'text-red-500',
      )}
    >
      {r >= 0 ? (
        <TrendingUp className="w-3 h-3" />
      ) : (
        <TrendingDown className="w-3 h-3" />
      )}
      {r >= 0 ? '+' : ''}
      {r}%
    </span>
  )
}

// ── Period filter pills ─────────────────────────────────────────────────
const PERIOD_OPTIONS: { value: PeriodFilter; label: string }[] = [
  { value: 'today', label: '今日' },
  { value: 'week', label: '今週' },
  { value: 'month', label: '今月' },
  { value: 'lastMonth', label: '前月' },
  { value: 'year', label: '今年' },
]

// ── Main page ───────────────────────────────────────────────────────────
export default function ClinicDashboardPage() {
  useAccountingStore()
  usePatientStore()
  const store = useClinicStore()

  const [period, setPeriod] = useState<PeriodFilter>('month')
  const [customRange] = useState<DateRange | undefined>()

  const activeClinics = store.clinics.filter((c) => c.is_active)
  const [selectedClinic, setSelectedClinic] = useState<string>(
    activeClinics[0]?.id ?? '',
  )

  // Build dashboard for the selected clinic
  const data = useMemo(
    () =>
      buildDashboard(
        period,
        store.reservations,
        store.staff,
        store.clinics,
        customRange,
        selectedClinic || 'all',
      ),
    [period, store.reservations, store.staff, store.clinics, customRange, selectedClinic],
  )

  // Build overall dashboard (all clinics) for comparison
  const allData = useMemo(
    () =>
      buildDashboard(
        period,
        store.reservations,
        store.staff,
        store.clinics,
        customRange,
        'all',
      ),
    [period, store.reservations, store.staff, store.clinics, customRange],
  )

  // Menu ranking for selected clinic
  const menuRanking = useMemo(() => {
    if (!selectedClinic) return []
    const invoices = accountingStore
      .getAll()
      .filter(
        (i) =>
          i.status === 'paid' &&
          i.visit_date >= data.period.from &&
          i.visit_date <= data.period.to &&
          i.clinic_id === selectedClinic,
      )
    const map = new Map<string, { count: number; revenue: number }>()
    invoices.forEach((inv) =>
      inv.items.forEach((item) => {
        const e = map.get(item.name) ?? { count: 0, revenue: 0 }
        map.set(item.name, {
          count: e.count + item.quantity,
          revenue: e.revenue + item.subtotal,
        })
      }),
    )
    return Array.from(map.entries())
      .map(([name, d]) => ({ name, ...d }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8)
  }, [selectedClinic, data.period.from, data.period.to])

  // Last 6 months trend for this clinic
  const monthlyTrend = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const date = subMonths(new Date(), 5 - i)
      const from = format(startOfMonth(date), 'yyyy-MM-dd')
      const to = format(endOfMonth(date), 'yyyy-MM-dd')
      const monthLabel = format(date, 'M月', { locale: ja })
      const invoices = accountingStore
        .getAll()
        .filter(
          (inv) =>
            inv.status === 'paid' &&
            inv.visit_date >= from &&
            inv.visit_date <= to &&
            (!selectedClinic || inv.clinic_id === selectedClinic),
        )
      const sales = invoices.reduce((s, inv) => s + inv.total_amount, 0)
      const visits = store.reservations.filter(
        (r) =>
          r.status === 'visited' &&
          r.start_at.slice(0, 10) >= from &&
          r.start_at.slice(0, 10) <= to &&
          (!selectedClinic || r.clinic_id === selectedClinic),
      ).length
      return { label: monthLabel, sales, visits }
    })
  }, [selectedClinic, store.reservations])

  const clinicKPI = data.overall
  const prevKPI = data.prevOverall

  // Company averages (across all clinics)
  const numClinics = allData.clinics.length || 1
  const companyAvg = {
    sales: Math.round(allData.overall.sales / numClinics),
    visits: Math.round(allData.overall.visits / numClinics),
    newPatients: Math.round(allData.overall.newPatients / numClinics),
    repeatRate: Math.round(
      allData.clinics.reduce((s, c) => s + c.repeatRate, 0) / numClinics,
    ),
    cancellationRate: Math.round(
      allData.clinics.reduce((s, c) => s + c.cancellationRate, 0) / numClinics,
    ),
    averageSpend: Math.round(allData.overall.averageSpend),
  }

  const selectedClinicObj = store.clinics.find((c) => c.id === selectedClinic)

  const now = new Date()
  const lastUpdated = format(now, 'HH:mm', { locale: ja })
  const dateLabel =
    data.period.from === data.period.to
      ? format(parseISO(data.period.from), 'yyyy年M月d日', { locale: ja })
      : `${format(parseISO(data.period.from), 'yyyy年M月d日', { locale: ja })} - ${format(parseISO(data.period.to), 'M月d日', { locale: ja })}`

  // Staff for selected clinic
  const clinicStaff = data.staff.filter(
    (s) => !selectedClinic || s.clinicId === selectedClinic,
  )

  return (
    <PermissionGuard allowedRoles={['admin', 'staff']}>
      <div className="min-h-screen bg-green-50">
        {/* Hero header */}
        <div className="bg-gradient-to-r from-green-900 to-green-800 text-white px-4 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="page-title text-white text-2xl font-bold">院別ダッシュボード</h1>
              <p className="text-green-200 text-sm mt-1">{dateLabel}</p>
            </div>
            <div className="flex items-center gap-2 text-green-300 text-xs">
              <span>最終更新: {lastUpdated}</span>
            </div>
          </div>

          {/* Period pills */}
          <div className="mt-5 flex flex-wrap gap-2">
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setPeriod(opt.value)}
                className={cn(
                  'px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
                  period === opt.value
                    ? 'bg-white text-green-900'
                    : 'bg-green-800/60 text-green-100 hover:bg-green-700/60',
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="px-4 lg:px-8 py-6 space-y-6">
          {/* Clinic selector */}
          <div className="flex items-center gap-3 flex-wrap">
            <Building2 className="w-4 h-4 text-green-700" />
            <span className="text-sm font-medium text-green-900">院を選択</span>
            <Select
              value={selectedClinic}
              onValueChange={setSelectedClinic}
            >
              <SelectTrigger className="w-56 bg-white border-green-100">
                <SelectValue placeholder="院を選択してください" />
              </SelectTrigger>
              <SelectContent>
                {activeClinics.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Alerts */}
          {data.alerts.length > 0 && (
            <div className="space-y-2">
              {data.alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={cn(
                    'flex items-start gap-3 rounded-lg border px-4 py-3',
                    alert.severity === 'danger' && 'bg-red-50 border-red-200',
                    alert.severity === 'warning' && 'bg-amber-50 border-amber-200',
                    alert.severity === 'info' && 'bg-blue-50 border-blue-200',
                  )}
                >
                  {alert.severity === 'danger' && (
                    <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  )}
                  {alert.severity === 'warning' && (
                    <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  )}
                  {alert.severity === 'info' && (
                    <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  )}
                  <div>
                    <p
                      className={cn(
                        'text-sm font-semibold',
                        alert.severity === 'danger' && 'text-red-800',
                        alert.severity === 'warning' && 'text-amber-800',
                        alert.severity === 'info' && 'text-blue-800',
                      )}
                    >
                      [{alert.category}] {alert.title}
                    </p>
                    <p
                      className={cn(
                        'text-xs mt-0.5',
                        alert.severity === 'danger' && 'text-red-600',
                        alert.severity === 'warning' && 'text-amber-600',
                        alert.severity === 'info' && 'text-blue-600',
                      )}
                    >
                      {alert.message}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!selectedClinic ? (
            <div className="bg-white rounded-xl border border-green-100 shadow-sm p-8 text-center">
              <Building2 className="w-10 h-10 text-green-300 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">院を選択してください</p>
            </div>
          ) : (
            <>
              {/* KPI cards — row 1 */}
              <div>
                <h2 className="text-sm font-semibold text-green-800 mb-3">
                  {selectedClinicObj?.name ?? ''} — KPI
                </h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    {
                      label: '売上合計',
                      value: `¥${clinicKPI.sales.toLocaleString()}`,
                      badge: <ChangeBadge current={clinicKPI.sales} prev={prevKPI.sales} />,
                      icon: Receipt,
                      iconBg: 'bg-green-100',
                      iconColor: 'text-green-700',
                    },
                    {
                      label: '来院数',
                      value: `${clinicKPI.visits}名`,
                      badge: <ChangeBadge current={clinicKPI.visits} prev={prevKPI.visits} />,
                      icon: CalendarCheck,
                      iconBg: 'bg-blue-100',
                      iconColor: 'text-blue-700',
                    },
                    {
                      label: '新患数',
                      value: `${clinicKPI.newPatients}名`,
                      badge: <ChangeBadge current={clinicKPI.newPatients} prev={prevKPI.newPatients} />,
                      icon: Users,
                      iconBg: 'bg-purple-100',
                      iconColor: 'text-purple-700',
                    },
                    {
                      label: '平均単価',
                      value: `¥${clinicKPI.averageSpend.toLocaleString()}`,
                      badge: <ChangeBadge current={clinicKPI.averageSpend} prev={prevKPI.averageSpend} />,
                      icon: Award,
                      iconBg: 'bg-amber-100',
                      iconColor: 'text-amber-700',
                    },
                  ].map(({ label, value, badge, icon: Icon, iconBg, iconColor }) => (
                    <div key={label} className="bg-white rounded-xl border border-green-100 shadow-sm p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', iconBg)}>
                          <Icon className={cn('w-4 h-4', iconColor)} />
                        </div>
                        <span className="text-xs text-muted-foreground font-medium">{label}</span>
                      </div>
                      <p className="text-2xl font-bold text-green-900">{value}</p>
                      <div className="mt-1">{badge}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* KPI cards — row 2 */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  {
                    label: '再診率',
                    value: `${clinicKPI.repeatRate}%`,
                    badge: <ChangeBadge current={clinicKPI.repeatRate} prev={prevKPI.repeatRate} />,
                    icon: Repeat2,
                    iconBg: 'bg-teal-100',
                    iconColor: 'text-teal-700',
                  },
                  {
                    label: 'キャンセル率',
                    value: `${clinicKPI.cancellationRate}%`,
                    badge: (
                      <ChangeBadge
                        current={prevKPI.cancellationRate}
                        prev={clinicKPI.cancellationRate}
                      />
                    ),
                    icon: CalendarCheck,
                    iconBg: 'bg-red-100',
                    iconColor: 'text-red-600',
                  },
                  {
                    label: '未再診患者',
                    value: `${clinicKPI.inactivePatients}名`,
                    badge: <span className="text-xs text-muted-foreground">90日以上未来院</span>,
                    icon: Users,
                    iconBg: 'bg-orange-100',
                    iconColor: 'text-orange-600',
                  },
                  {
                    label: '前期比売上変化',
                    value:
                      changeRate(clinicKPI.sales, prevKPI.sales) === null
                        ? '–'
                        : `${changeRate(clinicKPI.sales, prevKPI.sales)! >= 0 ? '+' : ''}${changeRate(clinicKPI.sales, prevKPI.sales)}%`,
                    badge: (
                      <span className="text-xs text-muted-foreground">
                        前期 ¥{prevKPI.sales.toLocaleString()}
                      </span>
                    ),
                    icon: Building2,
                    iconBg: 'bg-green-100',
                    iconColor: 'text-green-700',
                  },
                ].map(({ label, value, badge, icon: Icon, iconBg, iconColor }) => (
                  <div key={label} className="bg-white rounded-xl border border-green-100 shadow-sm p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', iconBg)}>
                        <Icon className={cn('w-4 h-4', iconColor)} />
                      </div>
                      <span className="text-xs text-muted-foreground font-medium">{label}</span>
                    </div>
                    <p className="text-2xl font-bold text-green-900">{value}</p>
                    <div className="mt-1">{badge}</div>
                  </div>
                ))}
              </div>

              {/* vs. Company average comparison */}
              <div className="bg-white rounded-xl border border-green-100 shadow-sm p-4">
                <h2 className="text-sm font-semibold text-green-900 mb-4">全院平均との比較</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[600px]">
                    <thead>
                      <tr className="border-b border-green-100">
                        <th className="text-left py-2 text-xs text-muted-foreground font-medium">項目</th>
                        <th className="text-right py-2 text-xs text-muted-foreground font-medium">
                          {selectedClinicObj?.name ?? '選択院'}
                        </th>
                        <th className="text-right py-2 text-xs text-muted-foreground font-medium">全院平均</th>
                        <th className="text-right py-2 text-xs text-muted-foreground font-medium">差異</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-green-50">
                      {[
                        {
                          label: '売上',
                          clinic: clinicKPI.sales,
                          avg: companyAvg.sales,
                          fmt: (v: number) => `¥${v.toLocaleString()}`,
                          higherIsBetter: true,
                        },
                        {
                          label: '来院数',
                          clinic: clinicKPI.visits,
                          avg: companyAvg.visits,
                          fmt: (v: number) => `${v}名`,
                          higherIsBetter: true,
                        },
                        {
                          label: '新患数',
                          clinic: clinicKPI.newPatients,
                          avg: companyAvg.newPatients,
                          fmt: (v: number) => `${v}名`,
                          higherIsBetter: true,
                        },
                        {
                          label: '再診率',
                          clinic: clinicKPI.repeatRate,
                          avg: companyAvg.repeatRate,
                          fmt: (v: number) => `${v}%`,
                          higherIsBetter: true,
                        },
                        {
                          label: 'キャンセル率',
                          clinic: clinicKPI.cancellationRate,
                          avg: companyAvg.cancellationRate,
                          fmt: (v: number) => `${v}%`,
                          higherIsBetter: false,
                        },
                        {
                          label: '平均単価',
                          clinic: clinicKPI.averageSpend,
                          avg: companyAvg.averageSpend,
                          fmt: (v: number) => `¥${v.toLocaleString()}`,
                          higherIsBetter: true,
                        },
                      ].map(({ label, clinic, avg, fmt, higherIsBetter }) => {
                        const diff = clinic - avg
                        const isPositive = higherIsBetter ? diff >= 0 : diff <= 0
                        return (
                          <tr key={label} className="hover:bg-green-50/50 transition-colors">
                            <td className="py-2.5 font-medium text-green-900">{label}</td>
                            <td className="py-2.5 text-right font-semibold text-green-800">{fmt(clinic)}</td>
                            <td className="py-2.5 text-right text-muted-foreground">{fmt(avg)}</td>
                            <td className="py-2.5 text-right">
                              <span
                                className={cn(
                                  'text-xs font-medium',
                                  isPositive ? 'text-green-600' : 'text-red-500',
                                )}
                              >
                                {diff >= 0 ? '+' : ''}
                                {fmt(diff)}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Sales trend chart */}
              <div className="bg-white rounded-xl border border-green-100 shadow-sm p-4">
                <h2 className="text-sm font-semibold text-green-900 mb-3">売上推移</h2>
                <BarChart
                  data={data.salesTrend.map((d) => ({ label: d.label, value: d.value }))}
                  color="bg-green-600"
                  formatVal={(v) => `¥${v.toLocaleString()}`}
                />
              </div>

              {/* Staff performance for this clinic */}
              <div className="bg-white rounded-xl border border-green-100 shadow-sm p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Users className="w-4 h-4 text-green-700" />
                  <h2 className="text-sm font-semibold text-green-900">スタッフ実績</h2>
                </div>
                {clinicStaff.length === 0 ? (
                  <p className="text-sm text-muted-foreground">データなし</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[480px]">
                      <thead>
                        <tr className="border-b border-green-100">
                          <th className="text-left py-2 text-xs text-muted-foreground font-medium">スタッフ</th>
                          <th className="text-left py-2 text-xs text-muted-foreground font-medium">役職</th>
                          <th className="text-right py-2 text-xs text-muted-foreground font-medium">来院数</th>
                          <th className="text-right py-2 text-xs text-muted-foreground font-medium">売上</th>
                          <th className="text-right py-2 text-xs text-muted-foreground font-medium">平均単価</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-green-50">
                        {clinicStaff.map((s) => (
                          <tr key={s.staffId} className="hover:bg-green-50/50 transition-colors">
                            <td className="py-2.5 font-medium text-green-900">{s.staffName}</td>
                            <td className="py-2.5 text-muted-foreground text-xs">{s.role ?? '–'}</td>
                            <td className="py-2.5 text-right">{s.visits}名</td>
                            <td className="py-2.5 text-right font-semibold text-green-800">
                              ¥{s.sales.toLocaleString()}
                            </td>
                            <td className="py-2.5 text-right">¥{s.averageSpend.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Menu ranking */}
              <div className="bg-white rounded-xl border border-green-100 shadow-sm p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Receipt className="w-4 h-4 text-green-700" />
                  <h2 className="text-sm font-semibold text-green-900">メニュー別売上ランキング</h2>
                </div>
                {menuRanking.length === 0 ? (
                  <p className="text-sm text-muted-foreground">データなし</p>
                ) : (
                  <div className="space-y-2.5">
                    {menuRanking.map((m, i) => {
                      const maxRev = menuRanking[0]?.revenue ?? 1
                      return (
                        <div key={m.name}>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="font-medium flex items-center gap-1.5">
                              <span className="text-muted-foreground w-4 text-right">{i + 1}</span>
                              {m.name}
                            </span>
                            <div className="flex items-center gap-3 text-right">
                              <span className="text-muted-foreground">{m.count}件</span>
                              <span className="font-semibold text-green-800 w-20 text-right">
                                ¥{m.revenue.toLocaleString()}
                              </span>
                            </div>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-green-500 rounded-full"
                              style={{ width: `${(m.revenue / maxRev) * 100}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Month-by-month trend table */}
              <div className="bg-white rounded-xl border border-green-100 shadow-sm p-4">
                <h2 className="text-sm font-semibold text-green-900 mb-4">月別実績（直近6ヶ月）</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[400px]">
                    <thead>
                      <tr className="border-b border-green-100">
                        <th className="text-left py-2 text-xs text-muted-foreground font-medium">月</th>
                        <th className="text-right py-2 text-xs text-muted-foreground font-medium">売上</th>
                        <th className="text-right py-2 text-xs text-muted-foreground font-medium">来院数</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-green-50">
                      {monthlyTrend.map((m) => (
                        <tr key={m.label} className="hover:bg-green-50/50 transition-colors">
                          <td className="py-2.5 font-medium text-green-900">{m.label}</td>
                          <td className="py-2.5 text-right font-semibold text-green-800">
                            ¥{m.sales.toLocaleString()}
                          </td>
                          <td className="py-2.5 text-right">{m.visits}名</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </PermissionGuard>
  )
}
