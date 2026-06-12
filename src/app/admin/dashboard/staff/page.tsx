'use client'

import { useState, useMemo } from 'react'
import { format, subMonths, startOfMonth, endOfMonth, parseISO } from 'date-fns'
import { ja } from 'date-fns/locale'
import { TrendingUp, TrendingDown, Receipt, Users, CalendarCheck, Repeat2, AlertCircle, Award } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useClinicStore } from '@/lib/clinic-store'
import { useAccountingStore } from '@/lib/accounting-store'
import { usePatientStore } from '@/lib/patient-store'
import { buildDashboard, changeRate, getPeriodRange } from '@/lib/dashboard-utils'
import type { PeriodFilter, StaffKPI } from '@/types/dashboard'
import { PermissionGuard } from '@/components/common/PermissionGuard'
import { cn } from '@/lib/utils'

const PERIODS: { key: PeriodFilter; label: string }[] = [
  { key: 'today', label: '今日' },
  { key: 'week', label: '今週' },
  { key: 'month', label: '今月' },
  { key: 'lastMonth', label: '前月' },
  { key: 'year', label: '今年' },
]

const RANK_STYLES = [
  'bg-yellow-100 text-yellow-800 border border-yellow-300',
  'bg-gray-100 text-gray-700 border border-gray-300',
  'bg-amber-100 text-amber-800 border border-amber-300',
]

function ChangeBadge({ current, prev }: { current: number; prev: number }) {
  const r = changeRate(current, prev)
  if (r === null) return null
  return (
    <span className={cn('text-xs font-medium inline-flex items-center gap-0.5', r >= 0 ? 'text-green-600' : 'text-red-500')}>
      {r >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {r >= 0 ? '+' : ''}{r}%
    </span>
  )
}

type SortKey = keyof Pick<StaffKPI, 'sales' | 'visits' | 'newPatients' | 'repeatRate' | 'cancellations' | 'averageSpend'>

export default function StaffDashboardPage() {
  useAccountingStore()
  usePatientStore()
  const store = useClinicStore()

  const [period, setPeriod] = useState<PeriodFilter>('month')
  const [clinicFilter, setClinicFilter] = useState('all')
  const [selectedStaff, setSelectedStaff] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('sales')
  const [sortAsc, setSortAsc] = useState(false)

  const data = useMemo(
    () => buildDashboard(period, store.reservations, store.staff, store.clinics, undefined, clinicFilter),
    [period, store.reservations, store.staff, store.clinics, clinicFilter],
  )

  const prevData = useMemo(
    () => buildDashboard('lastMonth', store.reservations, store.staff, store.clinics, undefined, clinicFilter),
    [store.reservations, store.staff, store.clinics, clinicFilter],
  )

  const sortedStaff = useMemo(() => {
    return [...data.staff].sort((a, b) => {
      const diff = (a[sortKey] ?? 0) - (b[sortKey] ?? 0)
      return sortAsc ? diff : -diff
    })
  }, [data.staff, sortKey, sortAsc])

  const staffInfo = store.staff.find((s) => s.id === selectedStaff)
  const staffKPI = data.staff.find((s) => s.staffId === selectedStaff)
  const prevStaffKPI = prevData.staff.find((s) => s.staffId === selectedStaff)

  // Month-by-month for selected staff (last 6 months)
  const range = getPeriodRange(period)
  const monthHistory = useMemo(() => {
    if (!selectedStaff) return []
    return Array.from({ length: 6 }, (_, i) => {
      const d = subMonths(new Date(), 5 - i)
      const from = format(startOfMonth(d), 'yyyy-MM-dd')
      const to = format(endOfMonth(d), 'yyyy-MM-dd')
      const monthRes = store.reservations.filter((r) =>
        r.staff_id === selectedStaff &&
        r.start_at.slice(0, 10) >= from &&
        r.start_at.slice(0, 10) <= to,
      )
      const visits = monthRes.filter((r) => r.status === 'visited').length
      const cancelled = monthRes.filter((r) => r.status === 'cancelled' || r.status === 'no_show').length
      return {
        label: format(d, 'M月', { locale: ja }),
        visits,
        cancelled,
      }
    })
  }, [selectedStaff, store.reservations])

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortAsc((v) => !v)
    } else {
      setSortKey(key)
      setSortAsc(false)
    }
  }

  function SortTh({ label, k }: { label: string; k: SortKey }) {
    const active = sortKey === k
    return (
      <th
        className="text-right py-2 text-xs text-muted-foreground font-medium cursor-pointer hover:text-green-700 select-none"
        onClick={() => handleSort(k)}
      >
        {label}{active ? (sortAsc ? ' ↑' : ' ↓') : ''}
      </th>
    )
  }

  return (
    <PermissionGuard allowedRoles={['admin', 'staff']}>
      <div className="p-4 lg:p-6 space-y-5">
        {/* ヘッダー */}
        <div>
          <h1 className="page-title">スタッフ別ダッシュボード</h1>
          <p className="text-sm text-muted-foreground mt-0.5">スタッフごとの実績を比較・分析します</p>
        </div>

        {/* フィルター */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-1">
            {PERIODS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setPeriod(key)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                  period === key
                    ? 'bg-green-800 text-white border-green-800'
                    : 'border-border text-muted-foreground hover:border-green-400',
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <Select value={clinicFilter} onValueChange={(v) => { setClinicFilter(v); setSelectedStaff('') }}>
            <SelectTrigger className="h-8 w-40 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全院</SelectItem>
              {store.clinics.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={selectedStaff || '__all__'} onValueChange={(v) => setSelectedStaff(v === '__all__' ? '' : v)}>
            <SelectTrigger className="h-8 w-48 text-sm"><SelectValue placeholder="スタッフを選択（任意）" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">全スタッフ一覧</SelectItem>
              {store.staff
                .filter((s) => s.is_active && (clinicFilter === 'all' || s.clinic_id === clinicFilter))
                .map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* 個人詳細 */}
        {selectedStaff && staffKPI && (
          <>
            <div className="bg-white rounded-xl border shadow-sm p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-800 font-bold text-sm">
                  {staffInfo?.name?.slice(0, 1) ?? '?'}
                </div>
                <div>
                  <p className="font-semibold text-green-900">{staffInfo?.name}</p>
                  <p className="text-xs text-muted-foreground">{staffInfo?.role} — {staffKPI.clinicName}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                  { label: '売上', value: `¥${staffKPI.sales.toLocaleString()}`, current: staffKPI.sales, prev: prevStaffKPI?.sales ?? 0, icon: Receipt },
                  { label: '来院数', value: `${staffKPI.visits}名`, current: staffKPI.visits, prev: prevStaffKPI?.visits ?? 0, icon: CalendarCheck },
                  { label: '新患数', value: `${staffKPI.newPatients}名`, current: staffKPI.newPatients, prev: prevStaffKPI?.newPatients ?? 0, icon: Users },
                  { label: '再診率', value: `${staffKPI.repeatRate}%`, current: staffKPI.repeatRate, prev: prevStaffKPI?.repeatRate ?? 0, icon: Repeat2 },
                  { label: 'キャンセル', value: `${staffKPI.cancellations}件`, current: staffKPI.cancellations, prev: prevStaffKPI?.cancellations ?? 0, icon: AlertCircle },
                  { label: '平均単価', value: `¥${staffKPI.averageSpend.toLocaleString()}`, current: staffKPI.averageSpend, prev: prevStaffKPI?.averageSpend ?? 0, icon: TrendingUp },
                ].map(({ label, value, current, prev: p, icon: Icon }) => (
                  <div key={label} className="bg-green-50 rounded-lg p-3 border border-green-100">
                    <div className="flex items-center gap-1 mb-1">
                      <Icon className="w-3 h-3 text-green-600" />
                      <span className="text-[11px] text-muted-foreground">{label}</span>
                    </div>
                    <p className="text-base font-bold text-green-900">{value}</p>
                    <ChangeBadge current={current} prev={p} />
                  </div>
                ))}
              </div>
            </div>

            {/* 月別推移 */}
            <div className="bg-white rounded-xl border shadow-sm p-4">
              <h2 className="text-sm font-semibold text-green-900 mb-3">月別来院数（過去6ヶ月）</h2>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 text-xs text-muted-foreground">月</th>
                    <th className="text-right py-2 text-xs text-muted-foreground">来院数</th>
                    <th className="text-right py-2 text-xs text-muted-foreground">キャンセル</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {monthHistory.map((m) => (
                    <tr key={m.label}>
                      <td className="py-2 font-medium">{m.label}</td>
                      <td className="py-2 text-right font-semibold text-green-800">{m.visits}名</td>
                      <td className="py-2 text-right text-muted-foreground">{m.cancelled}件</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ランキングテーブル */}
        {!selectedStaff && (
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b bg-green-50/60 flex items-center gap-2">
              <Award className="w-4 h-4 text-green-700" />
              <h2 className="text-sm font-semibold text-green-900">スタッフ別実績ランキング</h2>
              <span className="text-xs text-muted-foreground ml-1">（列名クリックで並び替え）</span>
            </div>
            {sortedStaff.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">データなし</p>
            ) : (
              <div className="overflow-auto">
                <table className="w-full text-sm min-w-[700px]">
                  <thead>
                    <tr className="border-b bg-green-50/40">
                      <th className="text-left px-4 py-2.5 text-xs text-muted-foreground font-medium w-10">順位</th>
                      <th className="text-left px-4 py-2.5 text-xs text-muted-foreground font-medium">スタッフ</th>
                      <th className="text-left px-4 py-2.5 text-xs text-muted-foreground font-medium hidden sm:table-cell">院</th>
                      <SortTh label="売上" k="sales" />
                      <SortTh label="来院数" k="visits" />
                      <SortTh label="新患数" k="newPatients" />
                      <SortTh label="再診率" k="repeatRate" />
                      <SortTh label="平均単価" k="averageSpend" />
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {sortedStaff.map((s, i) => (
                      <tr
                        key={s.staffId}
                        className="hover:bg-green-50/30 cursor-pointer transition-colors"
                        onClick={() => setSelectedStaff(s.staffId)}
                      >
                        <td className="px-4 py-2.5">
                          <span className={cn(
                            'inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold',
                            i < 3 ? RANK_STYLES[i] : 'text-muted-foreground',
                          )}>
                            {i + 1}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="font-medium text-green-900">{s.staffName}</div>
                          <div className="text-xs text-muted-foreground">{s.role}</div>
                        </td>
                        <td className="px-4 py-2.5 text-muted-foreground text-sm hidden sm:table-cell">{s.clinicName}</td>
                        <td className="px-4 py-2.5 text-right font-semibold text-green-800">¥{s.sales.toLocaleString()}</td>
                        <td className="px-4 py-2.5 text-right">{s.visits}名</td>
                        <td className="px-4 py-2.5 text-right">{s.newPatients}名</td>
                        <td className="px-4 py-2.5 text-right">
                          <span className={cn(
                            'text-xs px-1.5 py-0.5 rounded-full font-medium',
                            s.repeatRate >= 60 ? 'bg-green-100 text-green-800' : s.repeatRate >= 40 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-700',
                          )}>
                            {s.repeatRate}%
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right">¥{s.averageSpend.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </PermissionGuard>
  )
}
