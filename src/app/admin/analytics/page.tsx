'use client'

import { useMemo, useState } from 'react'
import { format, subDays, subMonths, parseISO, startOfMonth } from 'date-fns'
import { ja } from 'date-fns/locale'
import { TrendingUp, TrendingDown, Users, CalendarCheck, Repeat2, Receipt } from 'lucide-react'
import { useClinicStore } from '@/lib/clinic-store'
import { useAccountingStore, accountingStore } from '@/lib/accounting-store'
import { useSettingsStore } from '@/lib/settings-store'
import { patientStore } from '@/lib/patient-store'
import { cn } from '@/lib/utils'

const TODAY = format(new Date(), 'yyyy-MM-dd')
const THIS_MONTH = format(new Date(), 'yyyy-MM')
const LAST_MONTH = format(subMonths(new Date(), 1), 'yyyy-MM')

// ── シンプルな棒グラフ ────────────────────────────────────
function BarChart({
  data,
  color = 'bg-green-600',
  formatVal = (v: number) => v.toLocaleString(),
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
          className="flex-1 flex flex-col items-center gap-0.5 group cursor-default"
          title={`${d.label}: ${formatVal(d.value)}`}
        >
          <div
            className={cn('w-full rounded-t-sm transition-all', color, d.value === 0 ? 'opacity-15' : 'opacity-85 group-hover:opacity-100')}
            style={{ height: `${Math.max(2, (d.value / max) * 88)}px` }}
          />
          {d.label && (
            <span className="text-[8px] text-muted-foreground leading-none whitespace-nowrap">{d.label}</span>
          )}
        </div>
      ))}
    </div>
  )
}

// ── 変化率バッジ ────────────────────────────────────
function ChangeBadge({ current, prev }: { current: number; prev: number }) {
  if (prev === 0) return null
  const pct = Math.round((current - prev) / prev * 100)
  const up = pct >= 0
  return (
    <span className={cn(
      'inline-flex items-center gap-0.5 text-xs font-medium',
      up ? 'text-green-600' : 'text-red-500',
    )}>
      {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {up ? '+' : ''}{pct}%
    </span>
  )
}

// ── ドーナツ風ステータス内訳 ────────────────────────────────────
function StatusBar({ data }: { data: { label: string; count: number; color: string }[] }) {
  const total = data.reduce((s, d) => s + d.count, 0)
  if (total === 0) return <p className="text-sm text-muted-foreground">データなし</p>
  return (
    <div className="space-y-2">
      <div className="flex h-3 rounded-full overflow-hidden gap-px">
        {data.map((d) => (
          <div
            key={d.label}
            className={d.color}
            style={{ width: `${(d.count / total) * 100}%` }}
            title={`${d.label}: ${d.count}件`}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {data.map((d) => (
          <div key={d.label} className="flex items-center gap-1.5">
            <div className={cn('w-2.5 h-2.5 rounded-sm flex-shrink-0', d.color)} />
            <span className="text-xs text-muted-foreground">{d.label}</span>
            <span className="text-xs font-semibold">{d.count}</span>
            <span className="text-xs text-muted-foreground">({Math.round(d.count / total * 100)}%)</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AnalyticsPage() {
  useAccountingStore()
  useSettingsStore()
  const { reservations, staff, menus, clinics } = useClinicStore()
  const [selectedClinic, setSelectedClinic] = useState('all')

  const allInvoices = accountingStore.getAll()
  const allPatients = patientStore.getAll()

  // ── KPI 計算 ────────────────────────────────────
  const kpi = useMemo(() => {
    const filterClinic = (inv: typeof allInvoices[0]) =>
      selectedClinic === 'all' || inv.clinic_id === selectedClinic

    const paid = allInvoices.filter((i) => i.status === 'paid' && filterClinic(i))

    const thisMonthRev = paid.filter((i) => i.visit_date.startsWith(THIS_MONTH))
      .reduce((s, i) => s + i.total_amount, 0)
    const lastMonthRev = paid.filter((i) => i.visit_date.startsWith(LAST_MONTH))
      .reduce((s, i) => s + i.total_amount, 0)

    const visited = reservations.filter((r) => r.status === 'visited' &&
      (selectedClinic === 'all' || r.clinic_id === selectedClinic))
    const thisMonthVisits = visited.filter((r) => r.start_at.startsWith(THIS_MONTH)).length
    const lastMonthVisits = visited.filter((r) => r.start_at.startsWith(LAST_MONTH)).length

    const thisMonthStart = startOfMonth(new Date()).toISOString().slice(0, 10)
    const newPatients = allPatients.filter(
      (p) => (p.first_visit_date ?? '') >= thisMonthStart &&
        (selectedClinic === 'all' || p.clinic_id === selectedClinic),
    ).length

    const visitCountByPatient = new Map<string, number>()
    visited.forEach((r) => {
      const key = r.patient_id ?? r.patient_name
      visitCountByPatient.set(key, (visitCountByPatient.get(key) ?? 0) + 1)
    })
    const total = visitCountByPatient.size
    const repeat = Array.from(visitCountByPatient.values()).filter((c) => c >= 2).length
    const repeatRate = total > 0 ? Math.round(repeat / total * 100) : 0

    return { thisMonthRev, lastMonthRev, thisMonthVisits, lastMonthVisits, newPatients, repeatRate }
  }, [allInvoices, reservations, allPatients, selectedClinic])

  // ── 30日チャート ────────────────────────────────────
  const days30 = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => {
      const date = format(subDays(new Date(), 29 - i), 'yyyy-MM-dd')
      const label = i % 5 === 0 || i === 29 ? format(subDays(new Date(), 29 - i), 'M/d') : ''
      const revenue = allInvoices
        .filter((inv) => inv.status === 'paid' && inv.visit_date === date &&
          (selectedClinic === 'all' || inv.clinic_id === selectedClinic))
        .reduce((s, inv) => s + inv.total_amount, 0)
      const visits = reservations.filter((r) =>
        r.status === 'visited' && r.start_at.startsWith(date) &&
        (selectedClinic === 'all' || r.clinic_id === selectedClinic),
      ).length
      return { date, label, revenue, visits }
    })
  }, [allInvoices, reservations, selectedClinic])

  // ── スタッフ別実績 ────────────────────────────────────
  const staffStats = useMemo(() => {
    const filter = (clinicId: string) => selectedClinic === 'all' || clinicId === selectedClinic
    return staff
      .filter((s) => s.is_active && filter(s.clinic_id))
      .map((s) => {
        const visits = reservations.filter((r) =>
          r.staff_id === s.id && r.status === 'visited' && r.start_at.startsWith(THIS_MONTH),
        ).length
        const revenue = allInvoices.filter((i) =>
          i.staff_id === s.id && i.status === 'paid' && i.visit_date.startsWith(THIS_MONTH),
        ).reduce((sum, i) => sum + i.total_amount, 0)
        return { ...s, visits, revenue }
      })
      .sort((a, b) => b.visits - a.visits)
  }, [staff, reservations, allInvoices, selectedClinic])

  // ── メニュー別売上 ────────────────────────────────────
  const menuRanking = useMemo(() => {
    const map = new Map<string, { name: string; count: number; revenue: number }>()
    allInvoices
      .filter((i) => i.status === 'paid' && i.visit_date.startsWith(THIS_MONTH) &&
        (selectedClinic === 'all' || i.clinic_id === selectedClinic))
      .forEach((inv) => {
        inv.items.forEach((item) => {
          const existing = map.get(item.name) ?? { name: item.name, count: 0, revenue: 0 }
          map.set(item.name, {
            name: item.name,
            count: existing.count + item.quantity,
            revenue: existing.revenue + item.subtotal,
          })
        })
      })
    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 8)
  }, [allInvoices, selectedClinic])

  // ── 予約ステータス内訳 ────────────────────────────────────
  const statusBreakdown = useMemo(() => {
    const monthly = reservations.filter((r) =>
      r.start_at.startsWith(THIS_MONTH) &&
      (selectedClinic === 'all' || r.clinic_id === selectedClinic),
    )
    return [
      { label: '来院済', count: monthly.filter((r) => r.status === 'visited').length, color: 'bg-green-500' },
      { label: '予約確定', count: monthly.filter((r) => r.status === 'confirmed').length, color: 'bg-blue-400' },
      { label: 'キャンセル', count: monthly.filter((r) => r.status === 'cancelled').length, color: 'bg-gray-300' },
      { label: '無断キャンセル', count: monthly.filter((r) => r.status === 'no_show').length, color: 'bg-red-400' },
    ]
  }, [reservations, selectedClinic])

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title">分析レポート</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{format(new Date(), 'yyyy年M月', { locale: ja })} の実績</p>
        </div>
        <select
          value={selectedClinic}
          onChange={(e) => setSelectedClinic(e.target.value)}
          className="h-8 rounded-md border border-input bg-white px-3 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
        >
          <option value="all">全院</option>
          {clinics.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* KPI カード */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: '今月の売上', value: `¥${kpi.thisMonthRev.toLocaleString()}`,
            sub: <ChangeBadge current={kpi.thisMonthRev} prev={kpi.lastMonthRev} />,
            icon: Receipt, iconBg: 'bg-green-100', iconColor: 'text-green-700',
          },
          {
            label: '今月の来院数', value: `${kpi.thisMonthVisits}名`,
            sub: <ChangeBadge current={kpi.thisMonthVisits} prev={kpi.lastMonthVisits} />,
            icon: CalendarCheck, iconBg: 'bg-blue-100', iconColor: 'text-blue-700',
          },
          {
            label: '今月の新患数', value: `${kpi.newPatients}名`,
            sub: <span className="text-xs text-muted-foreground">今月初診</span>,
            icon: Users, iconBg: 'bg-purple-100', iconColor: 'text-purple-700',
          },
          {
            label: 'リピート率', value: `${kpi.repeatRate}%`,
            sub: <span className="text-xs text-muted-foreground">2回以上来院</span>,
            icon: Repeat2, iconBg: 'bg-amber-100', iconColor: 'text-amber-700',
          },
        ].map(({ label, value, sub, icon: Icon, iconBg, iconColor }) => (
          <div key={label} className="bg-white rounded-xl border shadow-sm p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', iconBg)}>
                <Icon className={cn('w-4 h-4', iconColor)} />
              </div>
              <span className="text-xs text-muted-foreground font-medium">{label}</span>
            </div>
            <p className="text-2xl font-bold text-green-900">{value}</p>
            <div className="mt-1">{sub}</div>
          </div>
        ))}
      </div>

      {/* チャート */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border shadow-sm p-4">
          <h2 className="text-sm font-semibold text-green-900 mb-3">30日間売上推移</h2>
          <BarChart
            data={days30.map((d) => ({ label: d.label, value: d.revenue }))}
            color="bg-green-600"
            formatVal={(v) => `¥${v.toLocaleString()}`}
          />
        </div>
        <div className="bg-white rounded-xl border shadow-sm p-4">
          <h2 className="text-sm font-semibold text-green-900 mb-3">30日間来院数推移</h2>
          <BarChart
            data={days30.map((d) => ({ label: d.label, value: d.visits }))}
            color="bg-blue-500"
            formatVal={(v) => `${v}名`}
          />
        </div>
      </div>

      {/* 下段テーブル */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* スタッフ別実績 */}
        <div className="bg-white rounded-xl border shadow-sm p-4">
          <h2 className="text-sm font-semibold text-green-900 mb-3">スタッフ別実績（今月）</h2>
          {staffStats.length === 0 ? (
            <p className="text-sm text-muted-foreground">データなし</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-1.5 text-xs text-muted-foreground font-medium">スタッフ</th>
                  <th className="text-right py-1.5 text-xs text-muted-foreground font-medium">来院数</th>
                  <th className="text-right py-1.5 text-xs text-muted-foreground font-medium">売上</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {staffStats.map((s) => (
                  <tr key={s.id}>
                    <td className="py-2">
                      <div className="font-medium text-sm">{s.name}</div>
                      <div className="text-xs text-muted-foreground">{s.role}</div>
                    </td>
                    <td className="py-2 text-right font-semibold">{s.visits}名</td>
                    <td className="py-2 text-right font-semibold text-green-800">
                      ¥{s.revenue.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* メニュー別売上 */}
        <div className="bg-white rounded-xl border shadow-sm p-4">
          <h2 className="text-sm font-semibold text-green-900 mb-3">メニュー別売上（今月）</h2>
          {menuRanking.length === 0 ? (
            <p className="text-sm text-muted-foreground">データなし</p>
          ) : (
            <div className="space-y-2">
              {menuRanking.map((m, i) => {
                const max = menuRanking[0].revenue
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
                        style={{ width: `${(m.revenue / max) * 100}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* 予約ステータス内訳 */}
      <div className="bg-white rounded-xl border shadow-sm p-4">
        <h2 className="text-sm font-semibold text-green-900 mb-3">今月の予約内訳</h2>
        <StatusBar data={statusBreakdown} />
      </div>
    </div>
  )
}
