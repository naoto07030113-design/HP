'use client'

import { useState, useEffect, useMemo } from 'react'
import { format, subMonths, startOfMonth, addDays } from 'date-fns'
import {
  TrendingUp, TrendingDown, Scale, Wallet, BellRing, ArrowRight,
} from 'lucide-react'
import Link from 'next/link'
import { useCashbookStore, cashbookStore } from '@/lib/cashbook-store'
import { useScheduledPaymentStore, scheduledPaymentStore } from '@/lib/scheduled-payment-store'
import { EmptyState } from '@/components/common/EmptyState'
import type { ExpenseCategory } from '@/types/cashbook'
import {
  EXPENSE_CATEGORY_LABELS, CATEGORY_BAR_COLORS, DOCUMENT_TYPE_LABELS,
} from '@/types/cashbook'
import { cn } from '@/lib/utils'

const MONTHS_WINDOW = 6

function lastNMonths(n: number): string[] {
  const base = startOfMonth(new Date())
  const arr: string[] = []
  for (let i = n - 1; i >= 0; i--) arr.push(format(subMonths(base, i), 'yyyy-MM'))
  return arr
}

function monthLabel(m: string): string {
  return format(new Date(`${m}-01T00:00:00`), 'M月')
}

function yen(n: number): string {
  return `${n < 0 ? '-' : ''}${Math.abs(n).toLocaleString()}円`
}

// コンパクト表示（万円単位）。資金繰りをひと目で掴むため
function compact(n: number): string {
  const sign = n > 0 ? '+' : n < 0 ? '-' : ''
  const a = Math.abs(n)
  if (a >= 10000) return `${sign}${(a / 10000).toFixed(a >= 100000 ? 0 : 1)}万`
  return `${sign}${a.toLocaleString()}`
}

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  useCashbookStore()
  useScheduledPaymentStore()
  const entries = cashbookStore.getAll()
  const payments = scheduledPaymentStore.getAll()

  // 月次集計（収入・支出・収支・累計）
  const data = useMemo(() => {
    const byMonth = new Map<string, { income: number; expense: number }>()
    for (const e of entries) {
      const k = e.entry_date.slice(0, 7)
      const cur = byMonth.get(k) ?? { income: 0, expense: 0 }
      if (e.entry_type === 'income') cur.income += e.amount
      else cur.expense += e.amount
      byMonth.set(k, cur)
    }

    const months = lastNMonths(MONTHS_WINDOW)
    const windowStart = months[0]
    // ウィンドウ開始より前の収支を累計の起点にする
    let running = 0
    for (const [k, v] of Array.from(byMonth.entries())) {
      if (k < windowStart) running += v.income - v.expense
    }
    return months.map((m) => {
      const v = byMonth.get(m) ?? { income: 0, expense: 0 }
      const net = v.income - v.expense
      running += net
      return { month: m, income: v.income, expense: v.expense, net, cumulative: running }
    })
  }, [entries])

  // 今月の支出カテゴリ内訳
  const thisMonth = data[data.length - 1]?.month ?? format(new Date(), 'yyyy-MM')
  const categoryBreakdown = useMemo(() => {
    const totals = new Map<ExpenseCategory, number>()
    for (const e of entries) {
      if (e.entry_type !== 'expense') continue
      if (!e.entry_date.startsWith(thisMonth)) continue
      const cat = e.category as ExpenseCategory
      totals.set(cat, (totals.get(cat) ?? 0) + e.amount)
    }
    return Array.from(totals.entries()).sort((a, b) => b[1] - a[1])
  }, [entries, thisMonth])
  const expenseMonthTotal = categoryBreakdown.reduce((s, [, v]) => s + v, 0)

  // 今後の支払予定（資金繰り）
  const upcoming = useMemo(() => {
    return payments
      .filter((p) => p.status === 'pending')
      .sort((a, b) => a.due_date.localeCompare(b.due_date))
  }, [payments])
  const upcomingTotal = upcoming.reduce((s, p) => s + p.amount, 0)
  const today = format(new Date(), 'yyyy-MM-dd')
  const within30 = format(addDays(new Date(), 30), 'yyyy-MM-dd')
  const upcoming30Total = upcoming.filter((p) => p.due_date <= within30).reduce((s, p) => s + p.amount, 0)

  // KPI
  const cur = data[data.length - 1]
  const monthIncome = cur?.income ?? 0
  const monthExpense = cur?.expense ?? 0
  const monthNet = cur?.net ?? 0
  const cumulative = cur?.cumulative ?? 0

  // チャート用スケール
  const maxBar = Math.max(1, ...data.map((d) => Math.max(d.income, d.expense)))
  const cumVals = data.map((d) => d.cumulative)
  const cmin = Math.min(0, ...cumVals)
  const cmax = Math.max(0, ...cumVals)
  const crange = cmax - cmin || 1
  const n = data.length
  const xat = (i: number) => (n <= 1 ? 50 : (i / (n - 1)) * 100)
  const yat = (v: number) => 100 - ((v - cmin) / crange) * 100
  const linePts = data.map((d, i) => `${xat(i)},${yat(d.cumulative)}`).join(' ')
  const areaPts = `${xat(0)},100 ${linePts} ${xat(n - 1)},100`

  if (!mounted) {
    return <div className="p-4 lg:p-6 text-sm text-muted-foreground">読み込み中...</div>
  }

  if (entries.length === 0) {
    return (
      <div className="p-4 lg:p-6 space-y-5">
        <div>
          <h1 className="page-title">キャッシュフロー</h1>
          <p className="text-sm text-muted-foreground mt-0.5">収入・支出の推移と資金繰りの見える化</p>
        </div>
        <EmptyState
          icon={Wallet}
          title="まだデータがありません"
          description="経費・出納帳で収入や支出を登録すると、ここに月次推移や資金繰りが表示されます。"
          action={{ label: '経費・出納帳へ', onClick: () => { window.location.href = '/cashbook' } }}
        />
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-6 space-y-5">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">キャッシュフロー</h1>
          <p className="text-sm text-muted-foreground mt-0.5" suppressHydrationWarning>
            {monthLabel(thisMonth)}時点 ・ 直近{MONTHS_WINDOW}か月の推移と資金繰り
          </p>
        </div>
        <Link href="/cashbook" className="text-xs text-green-700 hover:text-green-800 inline-flex items-center gap-1">
          経費・出納帳を開く <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* KPIカード */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border shadow-sm p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-green-700" />
            </div>
            <span className="text-xs text-muted-foreground font-medium">今月の収入</span>
          </div>
          <p className="text-xl font-bold text-green-900">{yen(monthIncome)}</p>
        </div>
        <div className="bg-white rounded-xl border shadow-sm p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
              <TrendingDown className="w-4 h-4 text-red-700" />
            </div>
            <span className="text-xs text-muted-foreground font-medium">今月の支出</span>
          </div>
          <p className="text-xl font-bold text-red-700">{yen(monthExpense)}</p>
        </div>
        <div className="bg-white rounded-xl border shadow-sm p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', monthNet >= 0 ? 'bg-blue-100' : 'bg-amber-100')}>
              <Scale className={cn('w-4 h-4', monthNet >= 0 ? 'text-blue-700' : 'text-amber-700')} />
            </div>
            <span className="text-xs text-muted-foreground font-medium">今月の収支</span>
          </div>
          <p className={cn('text-xl font-bold', monthNet >= 0 ? 'text-blue-900' : 'text-amber-700')}>{yen(monthNet)}</p>
        </div>
        <div className="bg-white rounded-xl border shadow-sm p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', cumulative >= 0 ? 'bg-emerald-100' : 'bg-red-100')}>
              <Wallet className={cn('w-4 h-4', cumulative >= 0 ? 'text-emerald-700' : 'text-red-700')} />
            </div>
            <span className="text-xs text-muted-foreground font-medium">累計収支（記録ベース）</span>
          </div>
          <p className={cn('text-xl font-bold', cumulative >= 0 ? 'text-emerald-800' : 'text-red-700')}>{yen(cumulative)}</p>
        </div>
      </div>

      {/* 月次推移（収入・支出の棒グラフ） */}
      <div className="bg-white rounded-xl border shadow-sm p-4">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold">月次の収入・支出</p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-green-400" />収入</span>
            <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-red-400" />支出</span>
          </div>
        </div>
        <div className="flex items-end gap-2 sm:gap-4 h-44">
          {data.map((d) => (
            <div key={d.month} className="flex-1 flex flex-col items-center justify-end h-full gap-1">
              <div className="w-full flex items-end justify-center gap-1 flex-1">
                <div
                  className="w-1/2 max-w-[28px] bg-green-400 rounded-t transition-all"
                  style={{ height: `${(d.income / maxBar) * 100}%` }}
                  title={`収入 ${yen(d.income)}`}
                />
                <div
                  className="w-1/2 max-w-[28px] bg-red-400 rounded-t transition-all"
                  style={{ height: `${(d.expense / maxBar) * 100}%` }}
                  title={`支出 ${yen(d.expense)}`}
                />
              </div>
              <span className="text-[11px] text-muted-foreground" suppressHydrationWarning>{monthLabel(d.month)}</span>
              <span className={cn('text-[11px] font-semibold', d.net >= 0 ? 'text-blue-700' : 'text-amber-700')}>
                {compact(d.net)}
              </span>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground mt-2 text-right">各月の下段は収支（収入−支出、万円目安）</p>
      </div>

      {/* 累計収支の推移（折れ線） */}
      <div className="bg-white rounded-xl border shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold">累計収支の推移</p>
          <span className={cn('text-sm font-bold', cumulative >= 0 ? 'text-emerald-800' : 'text-red-700')}>
            現在 {yen(cumulative)}
          </span>
        </div>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-28">
          <defs>
            <linearGradient id="cumGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2f704e" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#2f704e" stopOpacity="0" />
            </linearGradient>
          </defs>
          <polygon points={areaPts} fill="url(#cumGrad)" />
          {cmin < 0 && cmax > 0 && (
            <line x1="0" y1={yat(0)} x2="100" y2={yat(0)} stroke="#cbd5e1" strokeWidth="1" strokeDasharray="2 2" vectorEffect="non-scaling-stroke" />
          )}
          <polyline points={linePts} fill="none" stroke="#2f704e" strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
        </svg>
        <div className="flex justify-between mt-1">
          {data.map((d) => (
            <span key={d.month} className="text-[11px] text-muted-foreground flex-1 text-center" suppressHydrationWarning>
              {monthLabel(d.month)}
            </span>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* 今月の支出内訳 */}
        <div className="bg-white rounded-xl border shadow-sm p-4">
          <p className="text-sm font-semibold mb-3" suppressHydrationWarning>{monthLabel(thisMonth)}の支出内訳</p>
          {categoryBreakdown.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">今月の支出はまだありません</p>
          ) : (
            <>
              <div className="flex h-3 rounded-full overflow-hidden mb-3">
                {categoryBreakdown.map(([cat, total]) => (
                  <div
                    key={cat}
                    className={CATEGORY_BAR_COLORS[cat]}
                    style={{ width: `${(total / expenseMonthTotal) * 100}%` }}
                    title={`${EXPENSE_CATEGORY_LABELS[cat]} ${yen(total)}`}
                  />
                ))}
              </div>
              <div className="space-y-1.5">
                {categoryBreakdown.map(([cat, total]) => (
                  <div key={cat} className="flex items-center gap-2 text-xs">
                    <span className={cn('w-2.5 h-2.5 rounded-sm flex-shrink-0', CATEGORY_BAR_COLORS[cat])} />
                    <span className="text-muted-foreground flex-1">{EXPENSE_CATEGORY_LABELS[cat]}</span>
                    <span className="font-semibold">{yen(total)}</span>
                    <span className="text-muted-foreground w-10 text-right">{Math.round((total / expenseMonthTotal) * 100)}%</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* 今後の支払予定（資金繰り） */}
        <div className="bg-white rounded-xl border shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold inline-flex items-center gap-1.5">
              <BellRing className="w-4 h-4 text-amber-600" />
              今後の支払予定
            </p>
            <span className="text-xs text-muted-foreground">30日以内 <span className="font-semibold text-red-700">{yen(upcoming30Total)}</span></span>
          </div>
          {upcoming.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">未払いの支払予定はありません</p>
          ) : (
            <>
              <div className="space-y-1.5 max-h-56 overflow-y-auto">
                {upcoming.slice(0, 8).map((p) => {
                  const overdue = p.due_date < today
                  return (
                    <div key={p.id} className="flex items-center gap-2 text-xs py-1 border-b last:border-0">
                      <span className={cn(
                        'px-1.5 py-0.5 rounded font-medium flex-shrink-0',
                        overdue ? 'bg-red-600 text-white' : p.due_date <= within30 ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-600',
                      )}>
                        {p.due_date}
                      </span>
                      <span className="text-muted-foreground flex-shrink-0">{DOCUMENT_TYPE_LABELS[p.document_type]}</span>
                      <span className="flex-1 truncate">{p.vendor || p.description}</span>
                      <span className="font-semibold flex-shrink-0">{yen(p.amount)}</span>
                    </div>
                  )
                })}
              </div>
              <div className="flex items-center justify-between mt-3 pt-2 border-t">
                <span className="text-xs text-muted-foreground">未払い合計（{upcoming.length}件）</span>
                <span className="text-sm font-bold text-red-700">{yen(upcomingTotal)}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
