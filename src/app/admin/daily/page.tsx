'use client'

import { useMemo, useState } from 'react'
import { format, addDays, subDays, parseISO } from 'date-fns'
import { ja } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAccountingStore, accountingStore } from '@/lib/accounting-store'
import { useClinicStore } from '@/lib/clinic-store'
import { PAYMENT_METHOD_LABELS } from '@/types/accounting'
import type { PaymentMethod } from '@/types/accounting'
import { cn } from '@/lib/utils'

const TODAY = format(new Date(), 'yyyy-MM-dd')

const PAYMENT_METHODS: PaymentMethod[] = ['cash', 'card', 'paypay', 'line_pay', 'insurance', 'other']

const PAYMENT_METHOD_COLORS: Record<PaymentMethod, string> = {
  cash:      'bg-green-500',
  card:      'bg-blue-500',
  paypay:    'bg-red-500',
  line_pay:  'bg-emerald-500',
  insurance: 'bg-purple-500',
  other:     'bg-gray-400',
}

export default function DailyLedgerPage() {
  useAccountingStore()
  const store = useClinicStore()

  const [selectedDate, setSelectedDate] = useState(TODAY)
  const [filterClinic, setFilterClinic] = useState('all')

  function goToPrev() {
    setSelectedDate((d) => format(subDays(parseISO(d), 1), 'yyyy-MM-dd'))
  }

  function goToNext() {
    setSelectedDate((d) => format(addDays(parseISO(d), 1), 'yyyy-MM-dd'))
  }

  function goToToday() {
    setSelectedDate(TODAY)
  }

  // All invoices for the selected date, filtered by clinic
  const dayInvoices = useMemo(() => {
    return accountingStore
      .getByDate(selectedDate)
      .filter((inv) => filterClinic === 'all' || inv.clinic_id === filterClinic)
      .filter((inv) => inv.status === 'paid')
  }, [selectedDate, filterClinic, store])

  // KPI calculations
  const kpi = useMemo(() => {
    const totalRevenue = dayInvoices.reduce((sum, inv) => sum + inv.total_amount, 0)
    const count = dayInvoices.length
    const avgPerPatient = count > 0 ? Math.round(totalRevenue / count) : 0
    const cashTotal = dayInvoices
      .filter((inv) => inv.payment_method === 'cash')
      .reduce((sum, inv) => sum + inv.total_amount, 0)
    return { totalRevenue, count, avgPerPatient, cashTotal }
  }, [dayInvoices])

  // Payment method breakdown
  const paymentBreakdown = useMemo(() => {
    const map = new Map<PaymentMethod, { amount: number; count: number }>()
    for (const method of PAYMENT_METHODS) {
      map.set(method, { amount: 0, count: 0 })
    }
    for (const inv of dayInvoices) {
      const entry = map.get(inv.payment_method)!
      map.set(inv.payment_method, {
        amount: entry.amount + inv.total_amount,
        count: entry.count + 1,
      })
    }
    const maxAmount = Math.max(...Array.from(map.values()).map((v) => v.amount), 1)
    return PAYMENT_METHODS.map((method) => {
      const { amount, count } = map.get(method)!
      return { method, label: PAYMENT_METHOD_LABELS[method], amount, count, pct: (amount / maxAmount) * 100 }
    })
  }, [dayInvoices])

  // Staff breakdown
  const staffBreakdown = useMemo(() => {
    const map = new Map<string, { name: string; count: number; revenue: number }>()
    for (const inv of dayInvoices) {
      const staffId = inv.staff_id ?? '__unknown__'
      const staffMember = store.staff.find((s) => s.id === inv.staff_id)
      const name = staffMember?.name ?? '担当不明'
      const existing = map.get(staffId) ?? { name, count: 0, revenue: 0 }
      map.set(staffId, {
        name,
        count: existing.count + 1,
        revenue: existing.revenue + inv.total_amount,
      })
    }
    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue)
  }, [dayInvoices, store.staff])

  // Hourly distribution (0-23 hours)
  const hourlyData = useMemo(() => {
    const counts = new Array<number>(24).fill(0)
    for (const inv of dayInvoices) {
      if (!inv.reservation_id) continue
      const reservation = store.reservations.find((r) => r.id === inv.reservation_id)
      if (!reservation) continue
      try {
        const hour = parseISO(reservation.start_at).getHours()
        counts[hour] = (counts[hour] ?? 0) + 1
      } catch {
        // ignore parse errors
      }
    }
    // Only show hours 7-21 for clinic context
    return Array.from({ length: 15 }, (_, i) => {
      const hour = i + 7
      return { hour, label: `${hour}時`, count: counts[hour] ?? 0 }
    })
  }, [dayInvoices, store.reservations])

  const maxHourCount = Math.max(...hourlyData.map((d) => d.count), 1)

  const formattedDate = format(parseISO(selectedDate), 'yyyy年M月d日(E)', { locale: ja })

  return (
    <div className="p-4 lg:p-6 space-y-5">

      {/* ヘッダー */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="page-title">日次レポート</h1>
          <p className="text-sm text-muted-foreground mt-0.5">日計・支払方法・スタッフ別の売上集計</p>
        </div>
      </div>

      {/* 日付セレクター + 院フィルター */}
      <div className="bg-white rounded-xl border shadow-sm p-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* 前日 / 翌日 */}
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={goToPrev}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="px-3 py-1 rounded-md border border-green-200 bg-green-50 text-green-900 font-semibold text-sm min-w-[11rem] text-center">
              {formattedDate}
            </div>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={goToNext}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <Button
            variant="outline"
            size="sm"
            className={cn(
              'h-8 text-xs',
              selectedDate === TODAY && 'border-green-400 text-green-700 bg-green-50',
            )}
            onClick={goToToday}
          >
            今日
          </Button>

          {/* 院フィルター */}
          <div className="ml-auto">
            <Select value={filterClinic} onValueChange={setFilterClinic}>
              <SelectTrigger className="h-8 text-xs w-40">
                <SelectValue />
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
        </div>
      </div>

      {/* KPI カード */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-green-100 shadow-sm p-4">
          <p className="text-xs text-muted-foreground font-medium mb-2">売上合計</p>
          <p className="text-2xl font-bold text-green-900">
            &yen;{kpi.totalRevenue.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground mt-1">支払済のみ</p>
        </div>

        <div className="bg-white rounded-xl border border-green-100 shadow-sm p-4">
          <p className="text-xs text-muted-foreground font-medium mb-2">会計件数</p>
          <p className="text-2xl font-bold text-green-900">{kpi.count}</p>
          <p className="text-xs text-muted-foreground mt-1">件</p>
        </div>

        <div className="bg-white rounded-xl border border-green-100 shadow-sm p-4">
          <p className="text-xs text-muted-foreground font-medium mb-2">患者単価</p>
          <p className="text-2xl font-bold text-green-900">
            &yen;{kpi.avgPerPatient.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground mt-1">平均</p>
        </div>

        <div className="bg-white rounded-xl border border-green-100 shadow-sm p-4">
          <p className="text-xs text-muted-foreground font-medium mb-2">現金合計</p>
          <p className="text-2xl font-bold text-green-900">
            &yen;{kpi.cashTotal.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground mt-1">現金のみ</p>
        </div>
      </div>

      {/* 中段: 支払方法内訳 + スタッフ別 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* 支払方法内訳 */}
        <div className="bg-white rounded-xl border shadow-sm p-4">
          <h2 className="text-sm font-semibold text-green-900 mb-4">支払方法内訳</h2>
          {dayInvoices.length === 0 ? (
            <p className="text-sm text-muted-foreground">データなし</p>
          ) : (
            <div className="space-y-3">
              {paymentBreakdown.map(({ method, label, amount, count, pct }) => (
                <div key={method}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-medium text-green-900">{label}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-muted-foreground">{count}件</span>
                      <span className="font-semibold text-green-800 w-24 text-right">
                        &yen;{amount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all', PAYMENT_METHOD_COLORS[method])}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* スタッフ別実績 */}
        <div className="bg-white rounded-xl border shadow-sm p-4">
          <h2 className="text-sm font-semibold text-green-900 mb-4">スタッフ別実績</h2>
          {staffBreakdown.length === 0 ? (
            <p className="text-sm text-muted-foreground">データなし</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-green-100">
                  <th className="text-left py-2 text-xs text-muted-foreground font-medium">スタッフ名</th>
                  <th className="text-right py-2 text-xs text-muted-foreground font-medium">件数</th>
                  <th className="text-right py-2 text-xs text-muted-foreground font-medium">売上</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-green-50">
                {staffBreakdown.map((row) => (
                  <tr key={row.name}>
                    <td className="py-2.5 font-medium text-green-900">{row.name}</td>
                    <td className="py-2.5 text-right text-muted-foreground">{row.count}件</td>
                    <td className="py-2.5 text-right font-semibold text-green-800">
                      &yen;{row.revenue.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
              {staffBreakdown.length > 1 && (
                <tfoot>
                  <tr className="border-t border-green-100 bg-green-50/50">
                    <td className="py-2 text-xs font-semibold text-muted-foreground">合計</td>
                    <td className="py-2 text-right text-xs font-semibold text-muted-foreground">
                      {kpi.count}件
                    </td>
                    <td className="py-2 text-right text-sm font-bold text-green-900">
                      &yen;{kpi.totalRevenue.toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          )}
        </div>
      </div>

      {/* 時間帯別分布 */}
      <div className="bg-white rounded-xl border shadow-sm p-4">
        <h2 className="text-sm font-semibold text-green-900 mb-4">時間帯別会計件数</h2>
        {dayInvoices.length === 0 ? (
          <p className="text-sm text-muted-foreground">データなし</p>
        ) : (
          <div className="flex items-end gap-1 h-28 w-full">
            {hourlyData.map(({ hour, label, count }) => (
              <div
                key={hour}
                className="flex-1 flex flex-col items-center gap-0.5 group cursor-default"
                title={`${label}: ${count}件`}
              >
                <div
                  className={cn(
                    'w-full rounded-t-sm transition-all bg-green-500',
                    count === 0 ? 'opacity-15' : 'opacity-80 group-hover:opacity-100',
                  )}
                  style={{ height: `${Math.max(2, (count / maxHourCount) * 88)}px` }}
                />
                <span className="text-[8px] text-muted-foreground leading-none whitespace-nowrap">
                  {label}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 取引一覧 */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-green-100 bg-green-50">
          <h2 className="text-sm font-semibold text-green-900">取引一覧</h2>
        </div>

        {dayInvoices.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground text-sm">
            {selectedDate} の会計データがありません
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-green-50/60">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap">
                    伝票番号
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap">
                    患者名
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap">
                    担当
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap hidden md:table-cell">
                    内容
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap">
                    支払方法
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap">
                    合計
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {dayInvoices
                  .slice()
                  .sort((a, b) => a.created_at.localeCompare(b.created_at))
                  .map((inv) => {
                    const staffMember = store.staff.find((s) => s.id === inv.staff_id)
                    const itemsSummary =
                      inv.items.length > 0
                        ? inv.items.map((item) => item.name).join('、')
                        : '-'
                    return (
                      <tr key={inv.id} className="hover:bg-green-50/30 transition-colors">
                        <td className="px-4 py-3">
                          <span className="text-xs text-muted-foreground font-mono">
                            {inv.invoice_number}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium text-green-900 whitespace-nowrap">
                          {inv.patient_name}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                          {staffMember?.name ?? '-'}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground hidden md:table-cell max-w-[16rem] truncate">
                          {itemsSummary}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                          {PAYMENT_METHOD_LABELS[inv.payment_method]}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold whitespace-nowrap text-green-900">
                          &yen;{inv.total_amount.toLocaleString()}
                        </td>
                      </tr>
                    )
                  })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-green-200 bg-green-50">
                  <td colSpan={4} className="px-4 py-3 text-sm font-bold text-green-900">
                    日計合計
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                    {kpi.count}件
                  </td>
                  <td className="px-4 py-3 text-right text-base font-bold text-green-900 whitespace-nowrap">
                    &yen;{kpi.totalRevenue.toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
