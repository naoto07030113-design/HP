'use client'

import { useState, useMemo } from 'react'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Wallet, Plus, Search, TrendingDown, TrendingUp, Scale,
  Pencil, Trash2, Download, Camera, BookOpen,
} from 'lucide-react'
import { useCashbookStore, cashbookStore } from '@/lib/cashbook-store'
import { useClinicStore } from '@/lib/clinic-store'
import { EntryForm } from '@/features/cashbook/components/EntryForm'
import { ReceiptUploadDialog } from '@/features/cashbook/components/ReceiptUploadDialog'
import { BankbookUploadDialog } from '@/features/cashbook/components/BankbookUploadDialog'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { EmptyState } from '@/components/common/EmptyState'
import type { CashbookEntry, CashbookEntryFormData, CashbookCategory, EntryType, ExpenseCategory } from '@/types/cashbook'
import {
  CATEGORY_LABELS, EXPENSE_CATEGORY_LABELS, INCOME_CATEGORY_LABELS,
  CATEGORY_BAR_COLORS, PAYMENT_METHOD_LABELS, ENTRY_SOURCE_LABELS,
} from '@/types/cashbook'
import { cn } from '@/lib/utils'

const TODAY = format(new Date(), 'yyyy-MM-dd')
const MONTH_START = format(startOfMonth(new Date()), 'yyyy-MM-dd')
const MONTH_END = format(endOfMonth(new Date()), 'yyyy-MM-dd')

// 税理士提出用の出納帳CSV（日付昇順・収入/支出/差引残高）
function downloadCashbookCsv(entries: CashbookEntry[], clinicName: (id: string | null) => string) {
  const sorted = [...entries].sort((a, b) =>
    a.entry_date.localeCompare(b.entry_date) || a.created_at.localeCompare(b.created_at))

  const header = ['日付', '勘定科目', '摘要', '収入金額', '支出金額', '差引残高', '部門', '入出金方法', '取込元', 'メモ']
  let balance = 0
  const rows = sorted.map((e) => {
    const income = e.entry_type === 'income' ? e.amount : 0
    const expense = e.entry_type === 'expense' ? e.amount : 0
    balance += income - expense
    const summary = [e.vendor, e.description].filter(Boolean).join(' ')
    return [
      e.entry_date,
      CATEGORY_LABELS[e.category],
      summary,
      income ? String(income) : '',
      expense ? String(expense) : '',
      String(balance),
      clinicName(e.clinic_id),
      PAYMENT_METHOD_LABELS[e.payment_method],
      ENTRY_SOURCE_LABELS[e.source],
      e.memo ?? '',
    ]
  })

  const csv = [header, ...rows]
    .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','))
    .join('\r\n')
  // Excel で文字化けしないよう BOM を付与
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `出納帳_${format(new Date(), 'yyyyMMdd')}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function CashbookPage() {
  useCashbookStore()
  const { clinics } = useClinicStore()

  const [formOpen, setFormOpen] = useState(false)
  const [receiptOpen, setReceiptOpen] = useState(false)
  const [bankbookOpen, setBankbookOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<CashbookEntry | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  // Filters
  const [dateFrom, setDateFrom] = useState(MONTH_START)
  const [dateTo, setDateTo] = useState(MONTH_END)
  const [filterClinic, setFilterClinic] = useState('all')
  const [filterType, setFilterType] = useState<'all' | EntryType>('all')
  const [filterCategory, setFilterCategory] = useState<'all' | CashbookCategory>('all')
  const [search, setSearch] = useState('')

  const entries = cashbookStore.getAll()

  const filtered = useMemo(() => {
    return entries
      .filter((e) => e.entry_date >= dateFrom && e.entry_date <= dateTo)
      .filter((e) => {
        if (filterClinic === 'all') return true
        if (filterClinic === '__common__') return e.clinic_id === null
        return e.clinic_id === filterClinic
      })
      .filter((e) => filterType === 'all' || e.entry_type === filterType)
      .filter((e) => filterCategory === 'all' || e.category === filterCategory)
      .filter((e) => !search || e.description.includes(search) || e.vendor.includes(search))
  }, [entries, dateFrom, dateTo, filterClinic, filterType, filterCategory, search])

  const incomeTotal = filtered.filter((e) => e.entry_type === 'income').reduce((s, e) => s + e.amount, 0)
  const expenseTotal = filtered.filter((e) => e.entry_type === 'expense').reduce((s, e) => s + e.amount, 0)
  const balance = incomeTotal - expenseTotal

  // 支出のカテゴリ別内訳（フィルター適用後）
  const categoryBreakdown = useMemo(() => {
    const totals = new Map<ExpenseCategory, number>()
    for (const e of filtered) {
      if (e.entry_type !== 'expense') continue
      const cat = e.category as ExpenseCategory
      totals.set(cat, (totals.get(cat) ?? 0) + e.amount)
    }
    return Array.from(totals.entries()).sort((a, b) => b[1] - a[1])
  }, [filtered])

  function clinicName(id: string | null): string {
    if (id === null) return '全社共通'
    return clinics.find((c) => c.id === id)?.name ?? '-'
  }

  function openAdd() {
    setEditTarget(null)
    setFormOpen(true)
  }

  function openEdit(entry: CashbookEntry) {
    setEditTarget(entry)
    setFormOpen(true)
  }

  async function handleSave(data: CashbookEntryFormData) {
    try {
      if (editTarget) await cashbookStore.update(editTarget.id, data)
      else await cashbookStore.create(data)
      toast.success('保存しました')
    } catch {
      toast.error('保存に失敗しました')
    }
  }

  async function handleReceiptSave(data: CashbookEntryFormData) {
    try {
      await cashbookStore.create(data)
      toast.success(`${format(new Date(data.entry_date), 'M月')}の出納帳に登録しました`)
    } catch {
      toast.error('登録に失敗しました')
      throw new Error('save failed')
    }
  }

  async function handleBankbookSave(rows: CashbookEntryFormData[]) {
    try {
      await cashbookStore.createMany(rows)
      toast.success(`${rows.length}件を出納帳に登録しました`)
    } catch {
      toast.error('登録に失敗しました')
      throw new Error('save failed')
    }
  }

  return (
    <div className="p-4 lg:p-6 space-y-5">
      {/* ヘッダー */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="page-title">経費・出納帳</h1>
          <p className="text-sm text-muted-foreground mt-0.5">経費・入出金の記録と税理士提出用の出納帳出力</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setReceiptOpen(true)}>
            <Camera className="w-4 h-4" />
            レシート読み取り
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setBankbookOpen(true)}>
            <BookOpen className="w-4 h-4" />
            通帳読み取り
          </Button>
          <Button
            variant="outline" size="sm" className="gap-1.5"
            onClick={() => downloadCashbookCsv(filtered, clinicName)}
            disabled={filtered.length === 0}
          >
            <Download className="w-4 h-4" />
            出納帳CSV出力
          </Button>
          <Button size="sm" className="gap-1.5" onClick={openAdd}>
            <Plus className="w-4 h-4" />
            新規入力
          </Button>
        </div>
      </div>

      {/* サマリーカード */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border shadow-sm p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-green-700" />
            </div>
            <span className="text-xs text-muted-foreground font-medium">期間内の収入</span>
          </div>
          <p className="text-2xl font-bold text-green-900">{incomeTotal.toLocaleString()}円</p>
          <p className="text-xs text-muted-foreground mt-0.5">{dateFrom} から {dateTo}</p>
        </div>
        <div className="bg-white rounded-xl border shadow-sm p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
              <TrendingDown className="w-4 h-4 text-red-700" />
            </div>
            <span className="text-xs text-muted-foreground font-medium">期間内の支出（経費）</span>
          </div>
          <p className="text-2xl font-bold text-red-700">{expenseTotal.toLocaleString()}円</p>
          <p className="text-xs text-muted-foreground mt-0.5">{filtered.filter((e) => e.entry_type === 'expense').length}件</p>
        </div>
        <div className="bg-white rounded-xl border shadow-sm p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className={cn(
              'w-8 h-8 rounded-lg flex items-center justify-center',
              balance >= 0 ? 'bg-blue-100' : 'bg-amber-100',
            )}>
              <Scale className={cn('w-4 h-4', balance >= 0 ? 'text-blue-700' : 'text-amber-700')} />
            </div>
            <span className="text-xs text-muted-foreground font-medium">差引（収入 - 支出）</span>
          </div>
          <p className={cn('text-2xl font-bold', balance >= 0 ? 'text-blue-900' : 'text-amber-700')}>
            {balance < 0 && '-'}{Math.abs(balance).toLocaleString()}円
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">期間内の収支</p>
        </div>
      </div>

      {/* 支出のカテゴリ別内訳 */}
      {categoryBreakdown.length > 0 && expenseTotal > 0 && (
        <div className="bg-white rounded-xl border shadow-sm p-4">
          <p className="text-xs text-muted-foreground font-medium mb-3">支出の勘定科目別内訳</p>
          <div className="flex h-3 rounded-full overflow-hidden mb-3">
            {categoryBreakdown.map(([cat, total]) => (
              <div
                key={cat}
                className={CATEGORY_BAR_COLORS[cat]}
                style={{ width: `${(total / expenseTotal) * 100}%` }}
                title={`${EXPENSE_CATEGORY_LABELS[cat]} ${total.toLocaleString()}円`}
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5">
            {categoryBreakdown.map(([cat, total]) => (
              <div key={cat} className="flex items-center gap-1.5 text-xs">
                <span className={cn('w-2.5 h-2.5 rounded-sm', CATEGORY_BAR_COLORS[cat])} />
                <span className="text-muted-foreground">{EXPENSE_CATEGORY_LABELS[cat]}</span>
                <span className="font-semibold">{total.toLocaleString()}円</span>
                <span className="text-muted-foreground">({Math.round((total / expenseTotal) * 100)}%)</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* フィルター */}
      <div className="bg-white rounded-xl border shadow-sm p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-medium">期間</p>
            <div className="flex items-center gap-1.5">
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-8 text-xs w-36" />
              <span className="text-muted-foreground text-xs">から</span>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-8 text-xs w-36" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-medium">区分</p>
            <Select value={filterType} onValueChange={(v) => setFilterType(v as typeof filterType)}>
              <SelectTrigger className="h-8 text-xs w-24"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全て</SelectItem>
                <SelectItem value="income">入金</SelectItem>
                <SelectItem value="expense">出金</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-medium">院</p>
            <Select value={filterClinic} onValueChange={setFilterClinic}>
              <SelectTrigger className="h-8 text-xs w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全て</SelectItem>
                <SelectItem value="__common__">全社共通</SelectItem>
                {clinics.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-medium">勘定科目</p>
            <Select value={filterCategory} onValueChange={(v) => setFilterCategory(v as typeof filterCategory)}>
              <SelectTrigger className="h-8 text-xs w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全て</SelectItem>
                {(Object.entries(EXPENSE_CATEGORY_LABELS) as [CashbookCategory, string][]).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
                {(Object.entries(INCOME_CATEGORY_LABELS) as [CashbookCategory, string][]).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="relative flex-1 min-w-32">
            <p className="text-xs text-muted-foreground font-medium mb-1">検索</p>
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-[calc(100%-1.25rem)] transform -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="摘要・支払先"
              className="pl-8 h-8 text-xs"
            />
          </div>
          <div className="flex gap-1.5 ml-auto">
            <Button
              variant="outline" size="sm" className="h-8 text-xs"
              onClick={() => { setDateFrom(TODAY); setDateTo(TODAY) }}
            >
              本日
            </Button>
            <Button
              variant="outline" size="sm" className="h-8 text-xs"
              onClick={() => { setDateFrom(MONTH_START); setDateTo(MONTH_END) }}
            >
              今月
            </Button>
          </div>
        </div>
      </div>

      {/* 一覧テーブル */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="該当するデータがありません"
          description="レシートや通帳の読み取り、または新規入力から登録してください"
          action={{ label: '新規入力', onClick: openAdd }}
        />
      ) : (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-green-50/60">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap">日付</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap">勘定科目</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">摘要</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap">院</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap">収入</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap">支出</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap">方法</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap">取込元</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((entry) => (
                  <tr key={entry.id} className="hover:bg-green-50/40 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap text-sm">{entry.entry_date}</td>
                    <td className="px-4 py-3 text-xs whitespace-nowrap">
                      <span className={cn(
                        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
                        entry.entry_type === 'income'
                          ? 'bg-green-50 border-green-200 text-green-800'
                          : 'bg-red-50 border-red-200 text-red-800',
                      )}>
                        {CATEGORY_LABELS[entry.category]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium">{entry.description}</span>
                      {entry.vendor && (
                        <span className="text-xs text-muted-foreground ml-2">{entry.vendor}</span>
                      )}
                      {entry.memo && (
                        <p className="text-xs text-muted-foreground mt-0.5">{entry.memo}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {clinicName(entry.clinic_id)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold whitespace-nowrap text-green-800">
                      {entry.entry_type === 'income' ? `${entry.amount.toLocaleString()}円` : ''}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold whitespace-nowrap text-red-700">
                      {entry.entry_type === 'expense' ? `${entry.amount.toLocaleString()}円` : ''}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {PAYMENT_METHOD_LABELS[entry.payment_method]}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {ENTRY_SOURCE_LABELS[entry.source]}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <Button variant="ghost" size="icon" className="h-7 w-7"
                          onClick={() => openEdit(entry)}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => setDeleteId(entry.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              {/* フッター: 合計 */}
              <tfoot>
                <tr className="border-t bg-green-50/60">
                  <td colSpan={4} className="px-4 py-3 text-xs font-semibold text-muted-foreground">
                    {filtered.length}件
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-green-900 whitespace-nowrap">
                    {incomeTotal.toLocaleString()}円
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-red-700 whitespace-nowrap">
                    {expenseTotal.toLocaleString()}円
                  </td>
                  <td colSpan={3} className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                    差引 {balance < 0 ? '-' : ''}{Math.abs(balance).toLocaleString()}円
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      <EntryForm
        open={formOpen}
        onOpenChange={setFormOpen}
        editTarget={editTarget}
        onSave={handleSave}
      />

      <ReceiptUploadDialog
        open={receiptOpen}
        onOpenChange={setReceiptOpen}
        onSave={handleReceiptSave}
      />

      <BankbookUploadDialog
        open={bankbookOpen}
        onOpenChange={setBankbookOpen}
        onSave={handleBankbookSave}
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="この入出金データを削除しますか？"
        confirmLabel="削除"
        variant="destructive"
        onConfirm={async () => {
          if (deleteId) {
            try {
              await cashbookStore.delete(deleteId)
              toast.success('削除しました')
            } catch {
              toast.error('削除に失敗しました')
            }
          }
          setDeleteId(null)
        }}
      />
    </div>
  )
}
