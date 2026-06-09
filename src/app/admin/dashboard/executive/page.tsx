'use client'

import { useMemo, useState } from 'react'
import { format, parseISO } from 'date-fns'
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
import { useAccountingStore } from '@/lib/accounting-store'
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
export default function ExecutiveDashboardPage() {
  useAccountingStore()
  usePatientStore()
  const store = useClinicStore()

  const [period, setPeriod] = useState<PeriodFilter>('month')
  const [clinicFilter, setClinicFilter] = useState('all')
  const [customRange] = useState<DateRange | undefined>()

  const data = useMemo(
    () =>
      buildDashboard(
        period,
        store.reservations,
        store.staff,
        store.clinics,
        customRange,
        clinicFilter,
      ),
    [period, store.reservations, store.staff, store.clinics, customRange, clinicFilter],
  )

  const now = new Date()
  const lastUpdated = format(now, 'HH:mm', { locale: ja })
  const dateLabel =
    data.period.from === data.period.to
      ? format(parseISO(data.period.from), 'yyyy年M月d日', { locale: ja })
      : `${format(parseISO(data.period.from), 'yyyy年M月d日', { locale: ja })} - ${format(parseISO(data.period.to), 'M月d日', { locale: ja })}`

  const sortedClinics = [...data.clinics].sort((a, b) => b.sales - a.sales)
  const topStaff = [...data.staff].slice(0, 10)

  return (
    <PermissionGuard allowedRoles={['admin', 'staff']}>
      <div className="min-h-screen bg-green-50">
        {/* Hero header */}
        <div className="bg-gradient-to-r from-green-900 to-green-800 text-white px-4 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="page-title text-white text-2xl font-bold">経営ダッシュボード</h1>
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
          {/* Clinic filter */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm font-medium text-green-900">院フィルター</span>
            <Select value={clinicFilter} onValueChange={setClinicFilter}>
              <SelectTrigger className="w-48 bg-white border-green-100">
                <SelectValue placeholder="全院" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全院</SelectItem>
                {store.clinics.map((c) => (
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

          {/* KPI cards — row 1 */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              {
                label: '売上合計',
                value: `¥${data.overall.sales.toLocaleString()}`,
                badge: <ChangeBadge current={data.overall.sales} prev={data.prevOverall.sales} />,
                icon: Receipt,
                iconBg: 'bg-green-100',
                iconColor: 'text-green-700',
              },
              {
                label: '来院数',
                value: `${data.overall.visits}名`,
                badge: <ChangeBadge current={data.overall.visits} prev={data.prevOverall.visits} />,
                icon: CalendarCheck,
                iconBg: 'bg-blue-100',
                iconColor: 'text-blue-700',
              },
              {
                label: '新患数',
                value: `${data.overall.newPatients}名`,
                badge: <ChangeBadge current={data.overall.newPatients} prev={data.prevOverall.newPatients} />,
                icon: Users,
                iconBg: 'bg-purple-100',
                iconColor: 'text-purple-700',
              },
              {
                label: '平均単価',
                value: `¥${data.overall.averageSpend.toLocaleString()}`,
                badge: <ChangeBadge current={data.overall.averageSpend} prev={data.prevOverall.averageSpend} />,
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

          {/* KPI cards — row 2 */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              {
                label: '再診率',
                value: `${data.overall.repeatRate}%`,
                badge: <ChangeBadge current={data.overall.repeatRate} prev={data.prevOverall.repeatRate} />,
                icon: Repeat2,
                iconBg: 'bg-teal-100',
                iconColor: 'text-teal-700',
              },
              {
                label: 'キャンセル率',
                value: `${data.overall.cancellationRate}%`,
                badge: (
                  <ChangeBadge
                    current={data.prevOverall.cancellationRate}
                    prev={data.overall.cancellationRate}
                  />
                ),
                icon: CalendarCheck,
                iconBg: 'bg-red-100',
                iconColor: 'text-red-600',
              },
              {
                label: '未再診患者',
                value: `${data.overall.inactivePatients}名`,
                badge: (
                  <span className="text-xs text-muted-foreground">90日以上未来院</span>
                ),
                icon: Users,
                iconBg: 'bg-orange-100',
                iconColor: 'text-orange-600',
              },
              {
                label: '前期比売上変化',
                value:
                  changeRate(data.overall.sales, data.prevOverall.sales) === null
                    ? '–'
                    : `${changeRate(data.overall.sales, data.prevOverall.sales)! >= 0 ? '+' : ''}${changeRate(data.overall.sales, data.prevOverall.sales)}%`,
                badge: (
                  <span className="text-xs text-muted-foreground">
                    前期 ¥{data.prevOverall.sales.toLocaleString()}
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

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-green-100 shadow-sm p-4">
              <h2 className="text-sm font-semibold text-green-900 mb-3">売上推移</h2>
              <BarChart
                data={data.salesTrend.map((d) => ({ label: d.label, value: d.value }))}
                color="bg-green-600"
                formatVal={(v) => `¥${v.toLocaleString()}`}
              />
            </div>
            <div className="bg-white rounded-xl border border-green-100 shadow-sm p-4">
              <h2 className="text-sm font-semibold text-green-900 mb-3">来院数推移</h2>
              <BarChart
                data={data.visitTrend.map((d) => ({ label: d.label, value: d.value }))}
                color="bg-blue-500"
                formatVal={(v) => `${v}名`}
              />
            </div>
          </div>

          {/* Clinic comparison table */}
          <div className="bg-white rounded-xl border border-green-100 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="w-4 h-4 text-green-700" />
              <h2 className="text-sm font-semibold text-green-900">院別比較</h2>
            </div>
            {sortedClinics.length === 0 ? (
              <p className="text-sm text-muted-foreground">データなし</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[640px]">
                  <thead>
                    <tr className="border-b border-green-100">
                      <th className="text-left py-2 text-xs text-muted-foreground font-medium">院名</th>
                      <th className="text-right py-2 text-xs text-muted-foreground font-medium">売上</th>
                      <th className="text-right py-2 text-xs text-muted-foreground font-medium">来院数</th>
                      <th className="text-right py-2 text-xs text-muted-foreground font-medium">新患数</th>
                      <th className="text-right py-2 text-xs text-muted-foreground font-medium">再診率</th>
                      <th className="text-right py-2 text-xs text-muted-foreground font-medium">キャンセル率</th>
                      <th className="text-right py-2 text-xs text-muted-foreground font-medium">平均単価</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-green-50">
                    {sortedClinics.map((clinic, i) => (
                      <tr
                        key={clinic.clinicId}
                        className={cn(
                          'hover:bg-green-50/50 transition-colors',
                          i === 0 && 'bg-green-50/80',
                        )}
                      >
                        <td className="py-2.5">
                          <span className="font-medium text-green-900">{clinic.clinicName}</span>
                        </td>
                        <td className="py-2.5 text-right font-semibold text-green-800">
                          ¥{clinic.sales.toLocaleString()}
                        </td>
                        <td className="py-2.5 text-right">{clinic.visits}名</td>
                        <td className="py-2.5 text-right">{clinic.newPatients}名</td>
                        <td className="py-2.5 text-right">{clinic.repeatRate}%</td>
                        <td className="py-2.5 text-right">
                          <span
                            className={cn(
                              'text-xs px-1.5 py-0.5 rounded',
                              clinic.cancellationRate >= 20
                                ? 'bg-red-100 text-red-700'
                                : 'text-muted-foreground',
                            )}
                          >
                            {clinic.cancellationRate}%
                          </span>
                        </td>
                        <td className="py-2.5 text-right">
                          ¥{clinic.averageSpend.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Staff ranking */}
          <div className="bg-white rounded-xl border border-green-100 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-4">
              <Award className="w-4 h-4 text-amber-600" />
              <h2 className="text-sm font-semibold text-green-900">スタッフ売上ランキング（上位10名）</h2>
            </div>
            {topStaff.length === 0 ? (
              <p className="text-sm text-muted-foreground">データなし</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[640px]">
                  <thead>
                    <tr className="border-b border-green-100">
                      <th className="text-left py-2 text-xs text-muted-foreground font-medium w-10">順位</th>
                      <th className="text-left py-2 text-xs text-muted-foreground font-medium">名前</th>
                      <th className="text-left py-2 text-xs text-muted-foreground font-medium">役職</th>
                      <th className="text-left py-2 text-xs text-muted-foreground font-medium">院</th>
                      <th className="text-right py-2 text-xs text-muted-foreground font-medium">売上</th>
                      <th className="text-right py-2 text-xs text-muted-foreground font-medium">来院数</th>
                      <th className="text-right py-2 text-xs text-muted-foreground font-medium">平均単価</th>
                      <th className="text-right py-2 text-xs text-muted-foreground font-medium">再診率</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-green-50">
                    {topStaff.map((s, i) => (
                      <tr key={s.staffId} className="hover:bg-green-50/50 transition-colors">
                        <td className="py-2.5">
                          <span
                            className={cn(
                              'inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold',
                              i === 0 && 'bg-yellow-100 text-yellow-700',
                              i === 1 && 'bg-gray-100 text-gray-600',
                              i === 2 && 'bg-amber-100 text-amber-700',
                              i > 2 && 'bg-green-50 text-green-800',
                            )}
                          >
                            {i + 1}
                          </span>
                        </td>
                        <td className="py-2.5 font-medium text-green-900">{s.staffName}</td>
                        <td className="py-2.5 text-muted-foreground text-xs">{s.role ?? '–'}</td>
                        <td className="py-2.5 text-muted-foreground text-xs">{s.clinicName}</td>
                        <td className="py-2.5 text-right font-semibold text-green-800">
                          ¥{s.sales.toLocaleString()}
                        </td>
                        <td className="py-2.5 text-right">{s.visits}名</td>
                        <td className="py-2.5 text-right">¥{s.averageSpend.toLocaleString()}</td>
                        <td className="py-2.5 text-right">{s.repeatRate}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </PermissionGuard>
  )
}
