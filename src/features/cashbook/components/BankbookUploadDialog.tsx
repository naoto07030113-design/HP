'use client'

import { useState, useRef } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { BookOpen, Loader2, RotateCcw, Trash2 } from 'lucide-react'
import type {
  CashbookEntryFormData, CashbookCategory, BankbookOcrRow,
} from '@/types/cashbook'
import {
  EXPENSE_CATEGORY_LABELS, INCOME_CATEGORY_LABELS, ENTRY_TYPE_LABELS,
} from '@/types/cashbook'
import { useClinicStore } from '@/lib/clinic-store'
import { fileToResizedDataUrl } from '@/lib/image-utils'
import { cn } from '@/lib/utils'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (rows: CashbookEntryFormData[]) => Promise<void>
}

interface ReviewRow extends BankbookOcrRow {
  key: number
  category: CashbookCategory
}

export function BankbookUploadDialog({ open, onOpenChange, onSave }: Props) {
  const { clinics } = useClinicStore()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [rows, setRows] = useState<ReviewRow[] | null>(null)
  const [clinicId, setClinicId] = useState<string | null>(null)

  function reset() {
    setRows(null)
    setLoading(false)
    setSaving(false)
    setClinicId(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function handleOpenChange(o: boolean) {
    if (!o) reset()
    onOpenChange(o)
  }

  async function handleFile(file: File) {
    setLoading(true)
    try {
      const image = await fileToResizedDataUrl(file, 2000)

      const res = await fetch('/api/cashbook/ocr-bankbook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? '読み取りに失敗しました')

      const parsed: BankbookOcrRow[] = data.entries ?? []
      if (parsed.length === 0) {
        toast.error('取引明細を読み取れませんでした。鮮明な画像で再度お試しください')
        return
      }

      setRows(parsed.map((r, i) => ({
        ...r,
        key: i,
        category: r.entry_type === 'income' ? 'sales' : 'misc',
      })))
      toast.success(`${parsed.length}件の取引を読み取りました。内容を確認してください`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '読み取りに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  function updateRow(key: number, patch: Partial<ReviewRow>) {
    setRows((prev) => prev?.map((r) => (r.key === key ? { ...r, ...patch } : r)) ?? null)
  }

  function removeRow(key: number) {
    setRows((prev) => prev?.filter((r) => r.key !== key) ?? null)
  }

  const validRows = (rows ?? []).filter((r) => r.amount > 0 && r.description)
  const incomeTotal = validRows.filter((r) => r.entry_type === 'income').reduce((s, r) => s + r.amount, 0)
  const expenseTotal = validRows.filter((r) => r.entry_type === 'expense').reduce((s, r) => s + r.amount, 0)

  async function handleSave() {
    if (validRows.length === 0) return
    setSaving(true)
    try {
      await onSave(validRows.map((r) => ({
        clinic_id: clinicId,
        entry_date: r.entry_date,
        entry_type: r.entry_type,
        category: r.category,
        vendor: '',
        description: r.description,
        amount: r.amount,
        payment_method: 'bank_transfer',
        source: 'bankbook',
        memo: null,
      })))
      handleOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>通帳読み取り</DialogTitle>
        </DialogHeader>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) void handleFile(file)
          }}
        />

        {/* 1. 画像選択 */}
        {!rows && !loading && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed rounded-xl py-12 flex flex-col items-center gap-3 text-muted-foreground hover:border-green-400 hover:text-green-700 hover:bg-green-50/40 transition-colors"
          >
            <BookOpen className="w-8 h-8" />
            <div className="text-sm font-medium">通帳のページを撮影またはアップロード</div>
            <div className="text-xs">入金・出金の明細を自動で読み取り、確認後に出納帳へ一括登録します</div>
          </button>
        )}

        {/* 2. 読み取り中 */}
        {loading && (
          <div className="py-12 flex flex-col items-center gap-3 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin text-green-700" />
            <p className="text-sm">通帳を読み取っています...</p>
          </div>
        )}

        {/* 3. 確認・修正 */}
        {rows && !loading && (
          <div className="space-y-4">
            <div className="flex items-end justify-between gap-3 flex-wrap">
              <div className="space-y-1">
                <Label>登録先の院</Label>
                <Select
                  value={clinicId ?? '__common__'}
                  onValueChange={(v) => setClinicId(v === '__common__' ? null : v)}
                >
                  <SelectTrigger className="h-9 w-44"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__common__">全社共通</SelectItem>
                    {clinics.filter((c) => c.is_active).map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="text-xs text-muted-foreground space-x-4">
                <span>入金合計 <span className="font-semibold text-green-800">{incomeTotal.toLocaleString()}円</span></span>
                <span>出金合計 <span className="font-semibold text-red-700">{expenseTotal.toLocaleString()}円</span></span>
              </div>
            </div>

            <div className="border rounded-lg overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-green-50/60">
                    <th className="text-left px-3 py-2 text-xs font-semibold text-muted-foreground whitespace-nowrap">日付</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-muted-foreground whitespace-nowrap">区分</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-muted-foreground">摘要</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-muted-foreground whitespace-nowrap">勘定科目</th>
                    <th className="text-right px-3 py-2 text-xs font-semibold text-muted-foreground whitespace-nowrap">金額</th>
                    <th className="px-2 py-2" />
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {rows.map((row) => {
                    const categoryOptions = row.entry_type === 'income' ? INCOME_CATEGORY_LABELS : EXPENSE_CATEGORY_LABELS
                    return (
                      <tr key={row.key}>
                        <td className="px-3 py-1.5">
                          <Input
                            type="date" value={row.entry_date}
                            onChange={(e) => updateRow(row.key, { entry_date: e.target.value })}
                            className="h-8 text-xs w-32"
                          />
                        </td>
                        <td className="px-3 py-1.5">
                          <Select
                            value={row.entry_type}
                            onValueChange={(v) => updateRow(row.key, {
                              entry_type: v as ReviewRow['entry_type'],
                              category: v === 'income' ? 'sales' : 'misc',
                            })}
                          >
                            <SelectTrigger className={cn(
                              'h-8 text-xs w-20',
                              row.entry_type === 'income' ? 'text-green-800' : 'text-red-700',
                            )}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="income">{ENTRY_TYPE_LABELS.income}</SelectItem>
                              <SelectItem value="expense">{ENTRY_TYPE_LABELS.expense}</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-3 py-1.5">
                          <Input
                            value={row.description}
                            onChange={(e) => updateRow(row.key, { description: e.target.value })}
                            className="h-8 text-xs min-w-36"
                          />
                        </td>
                        <td className="px-3 py-1.5">
                          <Select
                            value={row.category}
                            onValueChange={(v) => updateRow(row.key, { category: v as CashbookCategory })}
                          >
                            <SelectTrigger className="h-8 text-xs w-32"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {(Object.entries(categoryOptions) as [CashbookCategory, string][]).map(([k, v]) => (
                                <SelectItem key={k} value={k}>{v}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-3 py-1.5">
                          <Input
                            type="number" min={0} value={row.amount || ''}
                            onChange={(e) => updateRow(row.key, { amount: Math.max(0, Number(e.target.value)) })}
                            className="h-8 text-xs text-right w-28"
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <button
                            type="button"
                            onClick={() => removeRow(row.key)}
                            className="p-1 rounded hover:bg-red-50 hover:text-red-600 text-muted-foreground"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" className="gap-1.5" onClick={reset}>
                <RotateCcw className="w-3.5 h-3.5" />
                別の画像を読み取る
              </Button>
              <Button
                type="button"
                onClick={() => void handleSave()}
                disabled={saving || validRows.length === 0}
              >
                {saving ? '登録中...' : `${validRows.length}件を出納帳に登録する`}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
