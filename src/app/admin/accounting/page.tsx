'use client'

import { useState, useMemo } from 'react'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Receipt, Plus, Search, TrendingUp, Calendar, AlertCircle,
  Pencil, Trash2, Printer, Eye,
} from 'lucide-react'
import { useAccountingStore, accountingStore } from '@/lib/accounting-store'
import { useClinicStore } from '@/lib/clinic-store'
import { InvoiceForm } from '@/features/accounting/components/InvoiceForm'
import { ReceiptDialog } from '@/features/accounting/components/ReceiptDialog'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { EmptyState } from '@/components/common/EmptyState'
import type { Invoice, InvoiceFormData, InvoiceStatus } from '@/types/accounting'
import {
  INVOICE_STATUS_LABELS, INVOICE_STATUS_COLORS,
  PAYMENT_METHOD_LABELS, INSURANCE_TYPE_LABELS,
} from '@/types/accounting'
import { cn } from '@/lib/utils'

const TODAY = format(new Date(), 'yyyy-MM-dd')
const MONTH_START = format(startOfMonth(new Date()), 'yyyy-MM-dd')
const MONTH_END = format(endOfMonth(new Date()), 'yyyy-MM-dd')

export default function AccountingPage() {
  useAccountingStore()
  const { clinics, staff } = useClinicStore()

  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Invoice | null>(null)
  const [receiptInvoice, setReceiptInvoice] = useState<Invoice | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  // Filters
  const [dateFrom, setDateFrom] = useState(MONTH_START)
  const [dateTo, setDateTo] = useState(MONTH_END)
  const [filterClinic, setFilterClinic] = useState('all')
  const [filterStatus, setFilterStatus] = useState<'all' | InvoiceStatus>('all')
  const [search, setSearch] = useState('')

  const invoices = accountingStore.getAll()

  const filtered = useMemo(() => {
    return invoices
      .filter((i) => i.visit_date >= dateFrom && i.visit_date <= dateTo)
      .filter((i) => filterClinic === 'all' || i.clinic_id === filterClinic)
      .filter((i) => filterStatus === 'all' || i.status === filterStatus)
      .filter((i) => !search || i.patient_name.includes(search) || i.invoice_number.includes(search))
      .sort((a, b) => b.visit_date.localeCompare(a.visit_date) || b.created_at.localeCompare(a.created_at))
  }, [invoices, dateFrom, dateTo, filterClinic, filterStatus, search])

  const todaySales = accountingStore.getTodaySales()
  const monthSales = accountingStore.getMonthSales()
  const unpaidCount = accountingStore.getUnpaidCount()

  function openAdd() {
    setEditTarget(null)
    setFormOpen(true)
  }

  function openEdit(inv: Invoice) {
    setEditTarget(inv)
    setFormOpen(true)
  }

  async function handleSave(data: InvoiceFormData) {
    try {
      if (editTarget) await accountingStore.update(editTarget.id, data)
      else await accountingStore.create(data)
      toast.success('保存しました')
    } catch {
      toast.error('保存に失敗しました')
    }
  }

  async function handlePaid(inv: Invoice) {
    try {
      await accountingStore.update(inv.id, { status: 'paid' })
      toast.success('支払済に更新しました')
    } catch {
      toast.error('更新に失敗しました')
    }
  }

  return (
    <div className="p-4 lg:p-6 space-y-5">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">会計管理</h1>
          <p className="text-sm text-muted-foreground mt-0.5">売上・請求・領収書の管理</p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={openAdd}>
          <Plus className="w-4 h-4" />
          新規会計
        </Button>
      </div>

      {/* サマリーカード */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border shadow-sm p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
              <Calendar className="w-4 h-4 text-green-700" />
            </div>
            <span className="text-xs text-muted-foreground font-medium">本日の売上</span>
          </div>
          <p className="text-2xl font-bold text-green-900">¥{todaySales.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-0.5" suppressHydrationWarning>{format(new Date(), 'M月d日')}</p>
        </div>
        <div className="bg-white rounded-xl border shadow-sm p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-blue-700" />
            </div>
            <span className="text-xs text-muted-foreground font-medium">今月の売上</span>
          </div>
          <p className="text-2xl font-bold text-green-900">¥{monthSales.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-0.5" suppressHydrationWarning>{format(new Date(), 'M月')}</p>
        </div>
        <div className="bg-white rounded-xl border shadow-sm p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
              <AlertCircle className="w-4 h-4 text-amber-700" />
            </div>
            <span className="text-xs text-muted-foreground font-medium">未払い件数</span>
          </div>
          <p className="text-2xl font-bold text-amber-700">{unpaidCount}</p>
          <p className="text-xs text-muted-foreground mt-0.5">件</p>
        </div>
      </div>

      {/* フィルター */}
      <div className="bg-white rounded-xl border shadow-sm p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-medium">期間</p>
            <div className="flex items-center gap-1.5">
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-8 text-xs w-36" />
              <span className="text-muted-foreground text-xs">〜</span>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-8 text-xs w-36" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-medium">院</p>
            <Select value={filterClinic} onValueChange={setFilterClinic}>
              <SelectTrigger className="h-8 text-xs w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全院</SelectItem>
                {clinics.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-medium">ステータス</p>
            <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as typeof filterStatus)}>
              <SelectTrigger className="h-8 text-xs w-28"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全て</SelectItem>
                {(Object.entries(INVOICE_STATUS_LABELS) as [InvoiceStatus, string][]).map(([k, v]) => (
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
              placeholder="患者名・伝票番号"
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
          icon={Receipt}
          title="該当する会計データがありません"
          description="フィルター条件を変更するか、新規会計を追加してください"
          action={{ label: '新規会計', onClick: openAdd }}
        />
      ) : (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-green-50/60">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap">伝票番号</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap">来院日</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap">患者名</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap">担当</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap">保険</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap">合計</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap">支払</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap">状態</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((inv) => {
                  const staffMember = staff.find((s) => s.id === inv.staff_id)
                  return (
                    <tr key={inv.id} className="hover:bg-green-50/40 transition-colors">
                      <td className="px-4 py-3">
                        <span className="text-xs text-muted-foreground font-mono">{inv.invoice_number}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">{inv.visit_date}</td>
                      <td className="px-4 py-3">
                        <span className="font-medium">{inv.patient_name}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                        {staffMember?.name ?? '-'}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {INSURANCE_TYPE_LABELS[inv.insurance_type]}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold whitespace-nowrap">
                        ¥{inv.total_amount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {PAYMENT_METHOD_LABELS[inv.payment_method]}
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
                          INVOICE_STATUS_COLORS[inv.status],
                        )}>
                          {INVOICE_STATUS_LABELS[inv.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          {inv.status === 'unpaid' && (
                            <Button
                              variant="outline" size="sm"
                              className="h-7 text-xs border-green-300 text-green-700 hover:bg-green-50"
                              onClick={() => handlePaid(inv)}
                            >
                              支払済にする
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" className="h-7 w-7"
                            onClick={() => setReceiptInvoice(inv)}>
                            <Printer className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7"
                            onClick={() => openEdit(inv)}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => setDeleteId(inv.id)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              {/* フッター: 合計 */}
              <tfoot>
                <tr className="border-t bg-green-50/60">
                  <td colSpan={5} className="px-4 py-3 text-xs font-semibold text-muted-foreground">
                    {filtered.length}件
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-green-900 whitespace-nowrap">
                    ¥{filtered.filter((i) => i.status === 'paid').reduce((s, i) => s + i.total_amount, 0).toLocaleString()}
                  </td>
                  <td colSpan={3} className="px-4 py-3 text-xs text-muted-foreground">（支払済合計）</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      <InvoiceForm
        open={formOpen}
        onOpenChange={setFormOpen}
        editTarget={editTarget}
        onSave={handleSave}
      />

      {receiptInvoice && (
        <ReceiptDialog
          open={!!receiptInvoice}
          onOpenChange={(o) => !o && setReceiptInvoice(null)}
          invoice={receiptInvoice}
        />
      )}

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="会計データを削除しますか？"
        confirmLabel="削除"
        variant="destructive"
        onConfirm={async () => {
          if (deleteId) {
            try {
              await accountingStore.delete(deleteId)
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
